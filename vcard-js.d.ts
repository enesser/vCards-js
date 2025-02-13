// Type definitions for vCards-js
// Project-Source: https://github.com/enesser/vCards-js/pull/80
// Definitions by: nikolai.essel@maxworx.com

/**
 * Factory function to create a new vCard instance.
 */
declare function vCardsJS(): VCard;
export default vCardsJS;

/**
 * Represents a contact vCard.
 */
export interface VCard
{
	/**
	 * Date of anniversary (v4+ only).
	 */
	anniversary?: Date;
	/**
	 * Date of birth.
	 */
	birthday?: Date;
	/**
	 * Cell phone number.
	 */
	cellPhone: string | Array<string>;
	/**
	 * Private email address.
	 */
	email: string | Array<string>;
	/**
	 * First name.
	 */
	firstName: string;
	/**
	 * Formatted name; will auto-populate if not set.
	 */
	formattedName: string;
	/**
	 * Gender (v4+ only).
	 * (M)ale, (F)emale, (O)ther, (N)ot applicable, (U)nknown
	 */
	gender?: "M" | "F" | "O" | "N" | "U";
	/**
	 * Indicates if this vCard represents an organization (X-ABShowAs:COMPANY).
	 */
	isOrganization?: boolean;
	/**
	 * Home address.
	 */
	homeAddress: Address;
	/**
	 * Home fax number.
	 */
	homeFax: string | Array<string>;
	/**
	 * Home phone number.
	 */
	homePhone: string | Array<string>;
	/**
	 * Last name.
	 */
	lastName: string;
	/**
	 * Logo (as a Photo object).
	 */
	logo: Photo;
	/**
	 * Middle name.
	 */
	middleName: string;
	/**
	 * Name prefix.
	 */
	namePrefix: string;
	/**
	 * Name suffix.
	 */
	nameSuffix: string;
	/**
	 * Nickname (v3+ only).
	 */
	nickname: string | undefined;
	/**
	 * Supplemental information or comments.
	 */
	note: string;
	/**
	 * Organization name.
	 */
	organization: string;
	/**
	 * Other email address.
	 */
	otherEmail: string | Array<string>;
	/**
	 * Other phone number.
	 */
	otherPhone: string | Array<string>;
	/**
	 * Pager number.
	 */
	pagerPhone: string | Array<string>;
	/**
	 * Individual's photo.
	 */
	photo: Photo;
	/**
	 * Role or business category.
	 */
	role: string;
	/**
	 * Social URLs (e.g., Facebook, Twitter, LinkedIn).
	 */
	socialUrls: SocialUrls;
	/**
	 * URL to retrieve the latest version of this vCard.
	 */
	source: string;
	/**
	 * Job title or functional position.
	 */
	title: string;
	/**
	 * Persistent, globally unique identifier.
	 */
	uid: string;
	/**
	 * Personal website URL.
	 */
	url: string | Array<string>;
	/**
	 * vCard version (e.g., "3.0").
	 */
	version: string;
	/**
	 * Work address.
	 */
	workAddress: Address;
	/**
	 * Work email address.
	 */
	workEmail: string | Array<string>;
	/**
	 * Work fax number.
	 */
	workFax: string | Array<string>;
	/**
	 * Work phone number.
	 */
	workPhone: string | Array<string>;
	/**
	 * Work website URL.
	 */
	workUrl: string;

	/**
	 * Get the formatted vCard in VCF format.
	 * @returns A string representing the formatted vCard.
	 */
	getFormattedString(): string;
	/**
	 * Get the major version of the vCard format.
	 * @returns The major version as a number.
	 */
	getMajorVersion(): number;
	/**
	 * Save the formatted vCard to a file.
	 * @param filename - The path to the file where the vCard should be saved.
	 */
	saveToFile(filename: string): void;
}

/**
 * Represents a photo that can be attached or embedded in a vCard.
 */
export interface Photo
{
	url: string;
	mediaType: string;
	base64: boolean;
	/**
	 * Attach a photo from a URL.
	 * @param url - URL where the photo can be found.
	 * @param mediaType - Media type of the photo (e.g., "JPEG", "PNG", "GIF").
	 */
	attachFromUrl(url: string, mediaType: string): void;
	/**
	 * Embed a photo from a file using base-64 encoding.
	 * @param fileLocation - File path to the photo.
	 */
	embedFromFile(fileLocation: string): void;
	/**
	 * Embed a photo from a base-64 string.
	 * @param base64String - Base-64 encoded photo.
	 * @param mediaType - Media type of the photo.
	 */
	embedFromString(base64String: string, mediaType: string): void;
}

/**
 * Represents an address in a vCard.
 */
export interface Address
{
	/**
	 * The text that should appear on a mailing label.
	 */
	label: string;
	/**
	 * Street address.
	 */
	street: string;
	/**
	 * City.
	 */
	city: string;
	/**
	 * State or province.
	 */
	stateProvince: string;
	/**
	 * Postal code.
	 */
	postalCode: string;
	/**
	 * Country or region.
	 */
	countryRegion: string;
}

/**
 * Represents social media URLs in a vCard.
 */
export interface SocialUrls
{
	facebook: string;
	flickr: string;
	linkedIn: string;
	twitter: string;
	// Allow additional social URL entries
	[key: string]: string;
}
