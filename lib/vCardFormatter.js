/********************************************************************************
 vCards-js, Eric J Nesser, November 2014,
 ********************************************************************************/
/*jslint node: true */
"use strict";

// vCard v2.1 (Internet Mail Consortium): https://web.archive.org/web/20150921154105/http://www.imc.org/pdi/vcard-21.rtf
// vCard v3.0 (IETF): https://datatracker.ietf.org/doc/html/rfc2426
// vCard v4.0 (IETF): https://datatracker.ietf.org/doc/html/rfc6350

/**
 * vCard formatter for formatting vCards in VCF format
 */
(function vCardFormatter()
{
	let majorVersion = 3;

	/**
	 * Escape value string
	 * @param  {String}  value  string to encode
	 * @return {String}         encoded string
	 */
	function e(value)
	{
		if (value)
		{
			if (typeof value !== "string")
				value = "" + value;

			return value
				.replace(/\\/g, "\\\\") // backslash must be escaped
				.replace(/\n/g, "\\n")
				.replace(/,/g, "\\,");
		}

		return "";
	}

	/**
	 * Escape compund value string
	 * @param  {String}  value  string to encode
	 * @return {String}         encoded string
	 */
	function ec(value)
	{
		return value ? e(value).replace(/;/g, "\\;") : "";
	}

	/**
	 * Return a content-line
	 * A content-line ends with CRLF and contain lines with max 75 characters.
	 * If content contain more characters, the content is split into "folding" lines which are separated by CRLF-WS
	 * @param  {String}          prop    one of the vCard property names
	 * @param  {Array.<String>}  params  parameters for the property
	 * @param  {String}          value
	 * @return {String}          Formatted content-line
	 */
	function contentLine(prop, params, value)
	{
		const paramsString = params.filter(Boolean).join(";");
		let content = prop + (paramsString ? ";" + paramsString : "") + ":" + value;

		if (majorVersion < 3)
		{
			// v2.1 defines folding on whitespaces and 76 which we don´t implemented yet
			return content + "\r\n";
		}

		let maxLineLength = 75;
		const lines = [];
		while (content.length > maxLineLength)
		{
			lines.push(content.slice(0, maxLineLength));
			content = content.slice(maxLineLength);
			maxLineLength = 74; // respected the folding starting whitespace
		}
		lines.push(content);

		return lines.join("\r\n ") + "\r\n";
	}

	/**
	 * Get formatted photo content-line
	 * @param  {object}   photo  Photo object as of vCard.getPhoto()
	 * @return {String}          Formatted photo content-line
	 */
	function getPhotoContentLine(prop, photo)
	{
		const params = [];

		let imageType = photo.mediaType;
		let mediaType = imageType;
		if (imageType.includes("/"))
			imageType = imageType.split("/")[1];
		else
			mediaType = "image/" + imageType;

		if (majorVersion >= 4)
		{
			params.push("VALUE=uri");
			params.push("MEDIATYPE=" + mediaType);

			if (photo.base64)
				return contentLine(prop, params, e("data:image/png;base64," + photo.url));
		} else if (majorVersion === 3)
		{
			if (photo.base64)
				params.push("ENCODING=b");
			params.push("TYPE=" + imageType.toUpperCase());
		} else
		{
			if (photo.base64)
			{
				// v2.1 does not know "b" and specifies it as "BASE64",
				//   but outlook only support utf-8 via v2.1 charset definition and requires requires base64 encoding as "b"
				//   thunderbird hadn´t issues when using v2.1 with "ENCODING=b", even it is not defined in spec
				params.push("ENCODING=b");
				params.push("TYPE=" + imageType.toUpperCase()); // v2.1 does not know PNG
			} else
			{
				params.push("VALUE=URL");
			}
		}

		return contentLine(prop, params, e(photo.url));
	}

	/**
	 * Get formatted date attribute content-line
	 * @param  {String}     prop
	 * @param  {Date}       date
	 * @return {String}           Formatted date content-line
	 */
	function getDateContentLine(prop, date)
	{
		const params = majorVersion >= 4 ? ["VALUE=date-and-or-time"] : [];

		const yyyy = "" + date.getFullYear();
		const mm = ("0" + (date.getMonth() + 1)).slice(-2);
		const dd = ("0" + date.getDate()).slice(-2);
		// ISO-8601 4.1.2.2 extended format which enables 4.1.2.3 a) "reduced accuracy" support
		const formattedDate = yyyy + "-" + mm + "-" + dd;

		return contentLine(prop, params, formattedDate);
	}

	/**
	 * Get ADR content-line
	 * @param  {"home" | "work"}  type
	 * @param  {object}           addr       Address object as of vCard.getMailingAddress()
	 * @param  {boolean}          isPrimary
	 * @return {String}                      Formatted address content-line
	 */
	function getAddressPropLine(type, addr, isPrimary = false)
	{
		const contentLines = [];

		if (addr.label || addr.street || addr.city || addr.stateProvince || addr.postalCode || addr.countryRegion)
		{
			const params = [];
			if (majorVersion >= 4)
			{
				params.push("TYPE=" + type.toUpperCase());
				if (isPrimary)
					params.push("PREF=1");
				if (addr.label)
					params.push("LABEL=\"" + e(addr.label) + "\"");
			} else if (majorVersion >= 3)
			{
				const types = [type.toUpperCase()];
				if (isPrimary) types.push("PREF");

				params.push("TYPE=" + types.join(","));

				if (addr.label)
					contentLines.push(contentLine("LABEL", params, e(addr.label)));
			} else
			{
				params.push(type.toUpperCase());
				if (isPrimary) params.push("PREF");
				params.push("CHARSET=utf-8");

				if (addr.label)
					contentLines.push(contentLine("LABEL", params, e(addr.label)));
			}

			const values = ["", "", addr.street, addr.city, addr.stateProvince, addr.postalCode, addr.countryRegion];
			contentLines.push(contentLine("ADR", params, values.map(ec).join(";")));
		}

		return contentLines.join("");
	}

	/**
	 * Get EMAIL content line
	 * @param  {"home" | "work" | "other"} type
	 * @param  {String}                    address
	 * @param  {boolean}                   isPrimary
	 * @return {String}                    Formatted e-mail content-line
	 */
	function getEmailPropLine(type, address, isPrimary = false)
	{
		const params = [];
		if (majorVersion >= 4)
		{
			params.push("TYPE=" + type.toUpperCase());
			if (isPrimary) params.push("PREF=1");
		} else if (majorVersion >= 3)
		{
			const types = [type.toUpperCase()];
			// RFC does not define this distinction, but initial implementation contained it
			types.push("INTERNET");
			if (isPrimary) types.push("PREF");

			params.push("TYPE=" + types.join(","));
		} else
		{
			if (type != "other") params.push(type.toUpperCase());
			params.push("INTERNET");
			if (isPrimary) params.push("PREF");
			params.push("CHARSET=utf-8");
		}

		return contentLine("EMAIL", params, e(address));
	}

	/**
	 * Get TEL content-line
	 * @param  {"cell" | "voice" | "pager" | "fax" } type
	 * @param  {String}                              tel
	 * @param  {"home" | "work" | undefined}         target
	 * @param  {boolean}                             isPrimary
	 * @return {String}                              Formatted tel content-line
	 */
	function getTelPropLine(type, tel, target = undefined, isPrimary = false)
	{
		// supported types
		//  v3: "home", "work", "pref", "voice", "fax", "msg", "cell", "pager", "bbs", "modem", "car", "isdn", "video", "pcs"
		//  v4: "text", "voice", "fax", "cell", "video", "pager", "textphone" + special "work", "home"
		const params = [];

		if (majorVersion >= 4)
		{
			params.push(
				"TYPE=" + (target ? "\"" + target.toUpperCase() + "," + type.toUpperCase() + "\"" : type.toUpperCase())
			);
			if (isPrimary) params.push("PREF=1");
			params.push("VALUE=uri");

			// value in URI format
			return contentLine("TEL", params, "tel:" + e(tel));
		} else if (majorVersion >= 3)
		{
			const types = [type.toUpperCase()];
			if (target) types.unshift(target.toUpperCase());
			if (isPrimary) types.push("PREF");

			params.push("TYPE=" + types.join(","));

			return contentLine("TEL", params, e(tel));
		} else
		{
			params.push(type.toUpperCase());
			if (target) params.unshift(target.toUpperCase());
			if (isPrimary) params.push("PREF");

			return contentLine("TEL", params, e(tel));
		}
	}

	module.exports = {
		/**
		 * Get formatted vCard in VCF format
		 * @param  {object}     vCard object
		 * @return {String}     Formatted vCard in VCF format
		 */
		getFormattedString: function(vCard)
		{
			majorVersion = vCard.getMajorVersion();

			let formattedVCardString = "";
			formattedVCardString += contentLine("BEGIN", [], "VCARD");
			formattedVCardString += contentLine("VERSION", [], vCard.version);

			// As of RFC 2426 vCard 3.0 already dropped CHARSET type parameter.
			//   Charset must be declared in Content-Type MIME header
			const params = majorVersion >= 3 ? [] : ["CHARSET=utf-8"];

			let formattedName = vCard.formattedName;
			if (!formattedName)
				formattedName = [vCard.firstName, vCard.middleName, vCard.lastName].filter(Boolean).join(" ");
			formattedVCardString += contentLine("FN", params, e(formattedName));

			const nameParts = [vCard.lastName, vCard.firstName, vCard.middleName, vCard.namePrefix, vCard.nameSuffix];
			formattedVCardString += contentLine("N", params, nameParts.map(ec).join(";"));

			if (vCard.nickname && majorVersion >= 3)
				formattedVCardString += contentLine("NICKNAME", params, e(vCard.nickname));

			if (vCard.gender && majorVersion >= 4)
				formattedVCardString += contentLine("GENDER", params, e(vCard.gender));

			if (vCard.uid)
				formattedVCardString += contentLine("UID", params, e(vCard.uid));

			if (vCard.birthday)
				formattedVCardString += getDateContentLine("BDAY", vCard.birthday);

			if (vCard.anniversary && majorVersion >= 4)
				formattedVCardString += getDateContentLine("ANNIVERSARY", vCard.anniversary);

			if (vCard.email)
			{
				if (!Array.isArray(vCard.email))
					vCard.email = [vCard.email];
				vCard.email.forEach(
					function(address)
					{
						formattedVCardString += getEmailPropLine("home", address);
					}
				);
			}

			if (vCard.workEmail)
			{
				if (!Array.isArray(vCard.workEmail))
					vCard.workEmail = [vCard.workEmail];
				vCard.workEmail.forEach(
					function(address)
					{
						formattedVCardString += getEmailPropLine("work", address);
					}
				);
			}

			if (vCard.otherEmail)
			{
				if (!Array.isArray(vCard.otherEmail))
					vCard.otherEmail = [vCard.otherEmail];
				vCard.otherEmail.forEach(
					function(address)
					{
						formattedVCardString += getEmailPropLine("other", address);
					}
				);
			}

			if (vCard.logo.url)
				formattedVCardString += getPhotoContentLine("LOGO", vCard.logo);

			if (vCard.photo.url)
				formattedVCardString += getPhotoContentLine("PHOTO", vCard.photo);

			if (vCard.cellPhone)
			{
				if (!Array.isArray(vCard.cellPhone))
					vCard.cellPhone = [vCard.cellPhone];
				vCard.cellPhone.forEach(
					function(number)
					{
						formattedVCardString += getTelPropLine("cell", number);
					}
				);
			}

			if (vCard.pagerPhone)
			{
				if (!Array.isArray(vCard.pagerPhone))
					vCard.pagerPhone = [vCard.pagerPhone];
				vCard.pagerPhone.forEach(
					function(number)
					{
						formattedVCardString += getTelPropLine("pager", number);
					}
				);
			}

			if (vCard.homePhone)
			{
				if (!Array.isArray(vCard.homePhone))
					vCard.homePhone = [vCard.homePhone];
				vCard.homePhone.forEach(
					function(number)
					{
						formattedVCardString += getTelPropLine("voice", number, "home");
					}
				);
			}

			if (vCard.workPhone)
			{
				if (!Array.isArray(vCard.workPhone))
					vCard.workPhone = [vCard.workPhone];
				vCard.workPhone.forEach(
					function(number)
					{
						formattedVCardString += getTelPropLine("voice", number, "work");
					}
				);
			}

			if (vCard.homeFax)
			{
				if (!Array.isArray(vCard.homeFax))
					vCard.homeFax = [vCard.homeFax];
				vCard.homeFax.forEach(
					function(number)
					{
						formattedVCardString += getTelPropLine("fax", number, "home");
					}
				);
			}

			if (vCard.workFax)
			{
				if (!Array.isArray(vCard.workFax))
					vCard.workFax = [vCard.workFax];
				vCard.workFax.forEach(
					function(number)
					{
						formattedVCardString += getTelPropLine("fax", number, "work");
					}
				);
			}

			if (vCard.otherPhone)
			{
				if (!Array.isArray(vCard.otherPhone))
					vCard.otherPhone = [vCard.otherPhone];
				vCard.otherPhone.forEach(
					function(number)
					{
						formattedVCardString += getTelPropLine("voice", number);
					}
				);
			}

			[
				{ details: vCard.homeAddress, type: "home" },
				{ details: vCard.workAddress, type: "work" }
			]
				.forEach(
					function(obj)
					{
						formattedVCardString += getAddressPropLine(obj.type, obj.details);
					}
				);

			if (vCard.title)
				formattedVCardString += contentLine("TITLE", params, e(vCard.title));

			if (vCard.role)
				formattedVCardString += contentLine("ROLE", params, e(vCard.role));

			if (vCard.organization)
				formattedVCardString += contentLine("ORG", params, e(vCard.organization));

			if (vCard.url)
			{
				if (!Array.isArray(vCard.url))
					vCard.url = [vCard.url];
				vCard.url.forEach(url =>
				{
					formattedVCardString += contentLine("URL", params, e(url));
				});
			}

			if (vCard.workUrl)
				formattedVCardString += contentLine("URL", ["TYPE=WORK"].concat(params), e(vCard.workUrl));

			if (vCard.note)
				formattedVCardString += contentLine("NOTE", params, e(vCard.note));

			if (vCard.socialUrls)
			{
				for (const key in vCard.socialUrls)
				{
					if (vCard.socialUrls.hasOwnProperty(key) && vCard.socialUrls[key])
						formattedVCardString += contentLine("X-SOCIALPROFILE", ["TYPE=" + key], e(vCard.socialUrls[key]));
				}
			}

			if (vCard.source)
				formattedVCardString += contentLine("SOURCE", params, e(vCard.source));

			formattedVCardString += contentLine("REV", [], (new Date()).toISOString());

			if (vCard.isOrganization)
				formattedVCardString += contentLine("X-ABShowAs", [], "COMPANY");

			formattedVCardString += contentLine("END", [], "VCARD");

			return formattedVCardString;
		}
	};
})();
