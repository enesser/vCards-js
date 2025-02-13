"use strict";

/* global require, describe, it: true */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vCard = require("../index");

/**
 * Test values.
 */
const TEST_VALUE_UID = "69531f4a-c34d-4a1e-8922-bd38a9476a53";
const TEST_FILENAME = "./test/testCard.vcf";

/**
 * @param  {String} vCardString
 * @return {Array.<string>} content-lines
 */
const splitVcardStringIntoOrderedContentLines = vCardString =>
{
	return vCardString.replace(/\r\n[\t ]/g, "") /* Unfolding */.split(/[\n\r]+/).sort();
};

/**
 * Get all lines of specific property.
 * @param  {string} prop
 * @param  {Array.<string>} lines
 * @return {Array.<string>}
 */
const getPropertyLines = (prop, lines) =>
{
	const propLength = prop.length;
	return lines.filter(line =>
	{
		if (line.indexOf(prop) !== 0) return false;
		const nextC = line[propLength];
		// followed by value or params separator
		return nextC === ";" || nextC === ":";
	});
};

/**
 * Split a line into prop, params and value.
 * @param  {string} line
 * @return {Object}
 */
const splitLine = line =>
{
	const segments = line.split(":");
	const propAndParams = segments.shift();
	const value = segments.join(":");

	const params = propAndParams.split(";");
	const prop = params.shift();

	return { prop, params, value };
};

/**
 * Get vCard value by field name.
 * @param  {string} fieldName
 * @param  {Array} lines
 * @return {string}
 */
const getValueByFieldName = (fieldName, lines) =>
{
	const propLines = getPropertyLines(fieldName, lines);
	return propLines.length ? propLines[0].split(":")[1] : undefined;
};

/**
 * Test cases.
 */
describe("vCard", function()
{
	const testCard = vCard();
	testCard.version = "3.0";
	testCard.uid = TEST_VALUE_UID;
	testCard.lastName = "Doe";
	testCard.middleName = "D";
	testCard.firstName = "John";
	testCard.nameSuffix = "J\\R";
	testCard.namePrefix = "M;R";
	testCard.nickname = "Test User";
	testCard.gender = "M";
	testCard.organization = "ACME Corporation";
	testCard.photo.embedFromFile(path.join(__dirname, "testPhoto.png"));
	testCard.logo.attachFromUrl("https://testurl", "png");
	testCard.workPhone = "312-555-1212";
	testCard.homePhone = "312-555-1313";
	testCard.cellPhone = "12345678900";
	testCard.pagerPhone = "312-555-1515";
	testCard.homeFax = "312-555-1616";
	testCard.workFax = "312-555-1717";
	testCard.birthday = new Date(2018, 11, 1);
	testCard.anniversary = new Date(2018, 11, 1);
	testCard.title = "Crash Test Dummy";
	testCard.role = "Crash Testing";
	testCard.email = "john.doe@testmail";
	testCard.workEmail = "john.doe@workmail";
	testCard.url = "http://johndoe";
	testCard.workUrl = "http://acemecompany/johndoe";

	testCard.homeAddress.label = "Home Address\nPrint Label";
	testCard.homeAddress.street = "123 Main Street";
	testCard.homeAddress.city = "Chicago";
	testCard.homeAddress.stateProvince = "IL";
	testCard.homeAddress.postalCode = 12345;
	testCard.homeAddress.countryRegion = "United States of America";

	testCard.workAddress.label = "Work Address\nPrint Label";
	testCard.workAddress.street = "123 Corporate Loop\nSuite 500";
	testCard.workAddress.city = "Los Angeles";
	testCard.workAddress.stateProvince = "CA";
	testCard.workAddress.postalCode = "54321";
	testCard.workAddress.countryRegion = "California Republic";

	testCard.source = "http://sourceurl";
	testCard.note = "John Doe's \nnotes;,";

	testCard.socialUrls.facebook = "https://facebook/johndoe";
	testCard.socialUrls.linkedIn = "https://linkedin/johndoe";
	testCard.socialUrls.twitter = "https://twitter/johndoe";
	testCard.socialUrls.flickr = "https://flickr/johndoe";
	testCard.socialUrls.custom = "https://custom/johndoe";

	describe(".getFormattedString v3", function()
	{
		const v3RefLines = splitVcardStringIntoOrderedContentLines(
			fs.readFileSync(path.join(__dirname, "v3WorkingCard.vcf"), "utf8")
		);

		testCard.version = "3.0";
		const v3String = testCard.getFormattedString();
		const v3Lines = splitVcardStringIntoOrderedContentLines(v3String);

		it("should start with BEGIN:VCARD", function(done)
		{
			assert.ok(v3String.startsWith("BEGIN:VCARD\r\n"));
			done();
		});

		it("should be well-formed", function(done)
		{
			for (let i = 0; i < v3Lines.length; i++)
			{
				const line = v3Lines[i];

				if (line.length > 0)
				{
					const segments = line.split(":");
					assert(segments.length >= 2 || segments[0].indexOf(";") === 0, "Malformed line: " + line);
				}
			}
			done();
		});

		it("should encode LF and comma properly (3.0+)", function(done)
		{
			for (let i = 0; i < v3Lines.length; i++)
			{
				const line = v3Lines[i];

				if (line.indexOf("NOTE") === 0)
				{
					assert.ok(line.indexOf("\\n") !== -1, "Could not find escaped LF: " + line);
					assert.ok(line.indexOf("\\,") !== -1, "Could not find escaped comma: " + line);
					done();
				}
			}
		});

		it("should escape properly", function(done)
		{
			const allowedRegEx = /^(?:[^\\,\n]+|\\[n,\\])*$/;
			// not sure how to do compound check via single regex
			const compoundAllowedRegEx = /^(?:[^,\n]+|\\[n,])*$/;
			const endingBackslashesRegEx = /\\+$/;

			for (let i = 0; i < v3Lines.length; i++)
			{
				const line = v3Lines[i];
				if (!line) continue;

				const { prop, value } = splitLine(line);

				// we only check VALUE because PROP should only contain known values and PARAMS are difficult to check
				//   v4 supports comma in 'TYPE="HOME,CELL"', 'LABEL="Some multiline text"' and maybe others
				//   v3 supports colon in TYPE=HOME,CELL and maybe others
				//   semicolon would need to check each found agains known params

				if (prop === "N" || prop === "ADR")
				{
					const compounds = value.split(";");
					const requiredCount = prop === "N" ? 5 : 7;
					let foundCount = 0;
					for (let j = 0; j < compounds.length; j++)
					{
						const compound = compounds[j];
						if (compound && !compoundAllowedRegEx.test(compound))
							assert.fail("Found non-escaped character in compound '" + compound + "' of: " + line);

						// if compound ends with a odd number of backslashes, it means the semicolon is escaped,
						//   so it is part of the following compound and not counted separately
						const endingBackslashesMatch = compound.match(endingBackslashesRegEx);
						if (!endingBackslashesMatch || endingBackslashesMatch[0].length % 2 === 0)
							foundCount++;
					}
					assert.equal(
						foundCount,
						requiredCount,
						"Found wrong number of compounds (" + foundCount + " / " + requiredCount + "): " + line
					);
				} else
				{
					assert.ok(allowedRegEx.test(value), "Found non-escaped character: " + line);
				}
			}

			done();
		});

		it("should format birthday as 2018-12-01 (ISO-8601 4.1.2.2 extended date format)", function(done)
		{
			const birthdayValue = getValueByFieldName("BDAY", v3Lines);
			assert.equal(birthdayValue, "2018-12-01");
			done();
		});

		it("should not crash when cellPhone is a large number, using 12345678900", function(done)
		{
			testCard.cellPhone = 12345678900;
			testCard.getFormattedString();
			done();
		});

		it(`should have UID set as test value: ${TEST_VALUE_UID}`, (done) =>
		{
			assert.equal(getValueByFieldName("UID", v3Lines), TEST_VALUE_UID);
			done();
		});

		it("should end with END:VCARD", function(done)
		{
			assert.ok(v3String.endsWith("END:VCARD\r\n"));
			done();
		});

		it(`should match a working vCard`, function(done)
		{
			// REV always is generated with current date
			const refRevLine = v3RefLines.find(line => line.indexOf("REV:") === 0);
			const checkLines = v3Lines.map(line => line.indexOf("REV:") === 0 ? refRevLine : line);

			assert.deepEqual(checkLines, v3RefLines);
			done();
		});

		it(`should save to ${TEST_FILENAME}`, function(done)
		{
			testCard.saveToFile(TEST_FILENAME);
			done();
		});
	});

	describe(".getFormattedString v4", function()
	{
		const v4RefLines = splitVcardStringIntoOrderedContentLines(
			fs.readFileSync(path.join(__dirname, "v4WorkingCard.vcf"), "utf8")
		);

		testCard.version = "4.0";
		const v4Lines = splitVcardStringIntoOrderedContentLines(testCard.getFormattedString());

		// we don´t do primitives check of v3 again

		it("should format anniversary as 2018-12-01 (ISO-8601 4.1.2.2 extended date format)", function(done)
		{
			const anniversaryValue = getValueByFieldName("ANNIVERSARY", v4Lines);
			assert.equal(anniversaryValue, "2018-12-01");
			done();
		});

		it(`should match a working vCard`, function(done)
		{
			// REV always is generated with current date
			const refRevLine = v4RefLines.find(line => line.indexOf("REV:") === 0);
			const checkLines = v4Lines.map(line => line.indexOf("REV:") === 0 ? refRevLine : line);

			assert.deepEqual(checkLines, v4RefLines);
			done();
		});
	});

	describe(".getFormattedString v2.1", function()
	{
		const v2_1RefLines = splitVcardStringIntoOrderedContentLines(
			fs.readFileSync(path.join(__dirname, "v2.1WorkingCard.vcf"), "utf8")
		);

		testCard.version = "2.1";
		const v2_1String = testCard.getFormattedString();
		const v2_1Lines = splitVcardStringIntoOrderedContentLines(v2_1String);

		// we don´t do primitives check of v3 again

		it(`should match a working vCard`, function(done)
		{
			// REV always is generated with current date
			const refRevLine = v2_1RefLines.find(line => line.indexOf("REV:") === 0);
			const checkLines = v2_1Lines.map(line => line.indexOf("REV:") === 0 ? refRevLine : line);

			assert.deepEqual(checkLines, v2_1RefLines);
			done();
		});
	});
});
