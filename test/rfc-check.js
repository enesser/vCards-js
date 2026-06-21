"use strict";
// Ad-hoc RFC conformance checker for generated vCards.
//   v2.1 = IMC vCard 2.1, v3.0 = RFC 2426, v4.0 = RFC 6350
const vCard = require("../index");
const path = require("path");

function buildCard(version) {
	const c = vCard();
	c.version = version;
	c.uid = "69531f4a-c34d-4a1e-8922-bd38a9476a53";
	c.firstName = "John"; c.middleName = "D"; c.lastName = "Doe";
	c.namePrefix = "M;R"; c.nameSuffix = "J\\R";
	c.nickname = "Test User"; c.gender = "M";
	c.organization = "ACME Corporation, Inc.";
	c.title = "Crash Test Dummy"; c.role = "Crash Testing";
	c.email = "john.doe@testmail"; c.workEmail = "john.doe@workmail";
	c.workPhone = "312-555-1212"; c.homePhone = "312-555-1313";
	c.cellPhone = "12345678900"; c.pagerPhone = "312-555-1515";
	c.homeFax = "312-555-1616"; c.workFax = "312-555-1717";
	c.birthday = new Date(2018, 11, 1); c.anniversary = new Date(2018, 11, 1);
	c.url = "http://johndoe"; c.workUrl = "http://acme/johndoe";
	c.photo.embedFromFile(path.join(__dirname, "testPhoto.png"));
	c.logo.attachFromUrl("https://testurl", "png");
	c.homeAddress.label = "Home\nLabel"; c.homeAddress.street = "123 Main Street";
	c.homeAddress.city = "Chicago"; c.homeAddress.stateProvince = "IL";
	c.homeAddress.postalCode = 12345; c.homeAddress.countryRegion = "USA";
	c.note = "Notes \nwith;,special";
	c.socialUrls.twitter = "https://twitter/johndoe";
	c.source = "http://sourceurl";
	return c.getFormattedString();
}

// Split a value into components on UNescaped ';'
function splitUnescaped(value, sep) {
	const out = []; let cur = ""; let bs = 0;
	for (const ch of value) {
		if (ch === sep && bs % 2 === 0) { out.push(cur); cur = ""; bs = 0; continue; }
		cur += ch; bs = ch === "\\" ? bs + 1 : 0;
	}
	out.push(cur); return out;
}

function check(version) {
	const s = buildCard(version);
	const major = parseInt(version, 10);
	const errors = []; const warnings = [];

	// 1. Every line ends in CRLF (no bare LF / bare CR)
	if (/[^\r]\n/.test(s) || /\r[^\n]/.test(s))
		errors.push("Contains a bare LF or CR (all line breaks must be CRLF)");

	const physical = s.split("\r\n");
	// trailing element after final CRLF should be ""
	if (physical[physical.length - 1] !== "")
		errors.push("Document does not end with CRLF");
	physical.pop();

	// 2. Physical line octet length <= 75 (RFC folding), v2.1 does not fold
	if (major >= 3) {
		physical.forEach((ln, i) => {
			const octets = Buffer.byteLength(ln, "utf8");
			if (octets > 75) errors.push(`Line ${i + 1} is ${octets} octets (>75, must be folded)`);
		});
	}

	// 3. Blank lines are not valid content-lines in RFC 2426/6350 grammar
	if (major >= 3) {
		const blanks = physical.filter(l => l === "").length;
		if (blanks > 0) errors.push(`${blanks} blank line(s) present — not allowed by the RFC ${major === 4 ? "6350" : "2426"} grammar`);
	}

	// Unfold: CRLF + (space|tab) joins continuation
	const logical = s.replace(/\r\n[ \t]/g, "").split("\r\n").filter(l => l.length);

	// 4. BEGIN / VERSION / END structure
	if (logical[0] !== "BEGIN:VCARD") errors.push("Does not start with BEGIN:VCARD");
	if (logical[1] !== "VERSION:" + version) errors.push(`VERSION must be 2nd line and equal "VERSION:${version}", got "${logical[1]}"`);
	if (logical[logical.length - 1] !== "END:VCARD") errors.push("Does not end with END:VCARD");

	// Parse content lines
	const props = logical.slice(2, -1).map(line => {
		const idx = line.indexOf(":");
		const head = line.slice(0, idx);
		const value = line.slice(idx + 1);
		const parts = head.split(";");
		return { name: parts[0].toUpperCase(), params: parts.slice(1), value };
	});
	const names = props.map(p => p.name);

	// 5. Required properties
	if (!names.includes("FN")) errors.push("Missing required property FN");
	if (major === 3 && !names.includes("N")) errors.push("Missing required property N (required in 3.0)");

	// 6. Structured-value component counts
	props.filter(p => p.name === "N").forEach(p => {
		const n = splitUnescaped(p.value, ";").length;
		if (n !== 5) errors.push(`N must have 5 components, has ${n}: ${p.value}`);
	});
	props.filter(p => p.name === "ADR").forEach(p => {
		const n = splitUnescaped(p.value, ";").length;
		if (n !== 7) errors.push(`ADR must have 7 components, has ${n}: ${p.value}`);
	});

	// 7. Escaping in text values: bare newline / CR not allowed in any value
	props.forEach(p => {
		if (/[\r\n]/.test(p.value)) errors.push(`${p.name} value contains an unescaped line break`);
	});

	// 8. v4 TEL must be a tel: URI with VALUE=uri
	if (major >= 4) {
		props.filter(p => p.name === "TEL").forEach(p => {
			if (!p.value.startsWith("tel:")) errors.push(`v4 TEL value must be a tel: URI: ${p.value}`);
			if (!p.params.some(x => /^VALUE=uri$/i.test(x))) errors.push(`v4 TEL must declare VALUE=uri: ${p.params}`);
		});
	}

	// 9. URL-referenced photo must declare VALUE=uri (3.0/4.0) or VALUE=URL (2.1)
	props.filter(p => (p.name === "PHOTO" || p.name === "LOGO")).forEach(p => {
		const isBase64 = p.params.some(x => /ENCODING=b/i.test(x)) || /^data:/.test(p.value);
		if (!isBase64) {
			const declared = p.params.some(x => /^VALUE=(uri|url)$/i.test(x));
			if (!declared) errors.push(`${p.name} URL must declare VALUE=uri/URL: ${p.params}`);
		}
	});

	return { version, errors, warnings, lineCount: logical.length };
}

let failed = false;
["2.1", "3.0", "4.0"].forEach(v => {
	const r = check(v);
	console.log(`\n=== vCard ${v} (${r.lineCount} logical lines) ===`);
	if (r.errors.length === 0) console.log("  OK — conformant");
	r.errors.forEach(e => { failed = true; console.log("  ERROR: " + e); });
	r.warnings.forEach(w => console.log("  WARN:  " + w));
});
process.exit(failed ? 1 : 0);
