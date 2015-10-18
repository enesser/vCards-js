/********************************************************************************
    vCards-js, Eric J Nesser, November 2014
********************************************************************************/
/*jslint node: true */
'use strict';

/**
 * vCard formatter for formatting vCards in VCF format
 */
(function vCardFormatter() {
    var moment = require('moment');
    var majorVersion = '3';

    /**
     * Encode string
     * @param  {String}     value to encode
     * @return {String}     encoded string
     */
    function e(value) {
        if (value) {
            if (typeof(value) !== 'string') {
                value = '' + value;
            }
            return value.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
        }
        return '';
    }

    /**
     * Return new line characters
     * @return {String} new line characters
     */
    function nl() {
        return '\r\n';
    }

    /**
     * Get formatted photo
     * @param  {String} photoType       Photo type (PHOTO, LOGO)
     * @param  {String} url             URL to attach photo from
     * @param  {String} mediaType       Media-type of photo (JPEG, PNG, GIF)
     * @return {String}                 Formatted photo
     */
    function getFormattedPhoto(photoType, url, mediaType, base64) {

        var params;

        if (majorVersion >= 4) {
            params = base64 ? ';ENCODING=b;MEDIATYPE=image/' : ';MEDIATYPE=image/';
        } else if (majorVersion === 3) {
            params = base64 ? ';ENCODING=b;TYPE=' : ';TYPE=';
        } else {
            params = base64 ? ';ENCODING=BASE64;' : ';';
        }

        var formattedPhoto = photoType + params + mediaType + ':' + e(url) + nl();
        return formattedPhoto;
    }

    /**
     * Get formatted address
     * @param  {object}         address
     * @param  {object}         encoding prefix
     * @return {String}         Formatted address
     */
    function getFormattedAddress(encodingPrefix, address) {

        var formattedAddress = '';

        if (address.details.label ||
            address.details.street ||
            address.details.city ||
            address.details.stateProvince ||
            address.details.postalCode ||
            address.details.countryRegion) {

            if (majorVersion >= 4) {
                formattedAddress = 'ADR' + encodingPrefix + ';TYPE=' + address.type +
                    (address.details.label ? ';LABEL="' + e(address.details.label) + '"' : '') + ':;;' +
                    e(address.details.street) + ';' +
                    e(address.details.city) + ';' +
                    e(address.details.stateProvince) + ';' +
                    e(address.details.postalCode) + ';' +
                    e(address.details.countryRegion) + nl();
            } else {
                if (address.details.label) {
                    formattedAddress = 'LABEL' + encodingPrefix + ';TYPE=' + address.type + ':' + e(address.details.label) + nl();
                }
                formattedAddress += 'ADR' + encodingPrefix + ';TYPE=' + address.type + ':;;' +
                    e(address.details.street) + ';' +
                    e(address.details.city) + ';' +
                    e(address.details.stateProvince) + ';' +
                    e(address.details.postalCode) + ';' +
                    e(address.details.countryRegion) + nl();

            }
        }

        return formattedAddress;
    }

    module.exports = {

        /**
         * Get formatted vCard in VCF format
         * @param  {object}     vCard object
         * @return {String}     Formatted vCard in VCF format
         */
        getFormattedString: function(vCard) {

            majorVersion = vCard.getMajorVersion();

            var formattedVCardString = '';
            formattedVCardString += 'BEGIN:VCARD' + nl();
            formattedVCardString += 'VERSION:' + vCard.version + nl();

            var encodingPrefix = majorVersion >= 4 ? '' : ';CHARSET=UTF-8';
            var formattedName = vCard.formattedName;

            if (!formattedName) {
                formattedName = '';

                [vCard.firstName, vCard.middleName, vCard.lastName]
                    .forEach(function(name) {
                        if (name) {
                            if (formattedName) {
                                formattedName += ' ';
                            }
                        }
                        formattedName += name;
                    });
            }

            formattedVCardString += 'FN' + encodingPrefix + ':' + e(formattedName) + nl();
            formattedVCardString += 'N' + encodingPrefix + ':' +
                e(vCard.lastName) + ';' +
                e(vCard.firstName) + ';' +
                e(vCard.middleName) + ';' +
                e(vCard.namePrefix) + ';' +
                e(vCard.nameSuffix) + nl();

            if (vCard.nickname && majorVersion >= 3) {
                formattedVCardString += 'NICKNAME' + encodingPrefix + ':' + e(vCard.nickname) + nl();
            }

            if (vCard.gender) {
                formattedVCardString += 'GENDER:' + e(vCard.gender) + nl();
            }

            if (vCard.birthday) {
                formattedVCardString += 'BDAY:' + moment(vCard.birthday).format('YYYYMMDD') + nl();
            }

            if (vCard.anniversary) {
                formattedVCardString += 'ANNIVERSARY:' + moment(vCard.anniversary).format('YYYYMMDD') + nl();
            }

            if (vCard.email) {
                if (majorVersion >= 4) {
                    formattedVCardString += 'EMAIL' + encodingPrefix + ';type=HOME:' + e(vCard.email) + nl();
                } else if (majorVersion >= 3 && majorVersion < 4) {
                    formattedVCardString += 'EMAIL' + encodingPrefix + ';type=HOME,INTERNET:' + e(vCard.email) + nl();
                } else {
                    formattedVCardString += 'EMAIL' + encodingPrefix + ';HOME;INTERNET:' + e(vCard.email) + nl();
                }
            }

            if (vCard.workEmail) {
                if (majorVersion >= 4) {
                    formattedVCardString += 'EMAIL' + encodingPrefix + ';type=WORK:' + e(vCard.workEmail) + nl();
                } else if (majorVersion >= 3 && majorVersion < 4) {
                    formattedVCardString += 'EMAIL' + encodingPrefix + ';type=WORK,INTERNET:' + e(vCard.workEmail) + nl();
                } else {
                    formattedVCardString += 'EMAIL' + encodingPrefix + ';WORK;INTERNET:' + e(vCard.workEmail) + nl();
                }
            }

            if (vCard.logo.url) {
                formattedVCardString += getFormattedPhoto('LOGO', vCard.logo.url, vCard.logo.mediaType, vCard.logo.base64);
            }

            if (vCard.photo.url) {
                formattedVCardString += getFormattedPhoto('PHOTO', vCard.photo.url, vCard.photo.mediaType, vCard.photo.base64);
            }

            if (vCard.cellPhone) {
                if (majorVersion >= 4) {
                    formattedVCardString += 'TEL;VALUE=uri;TYPE="voice,cell":tel:' + e(vCard.cellPhone) + nl();
                } else {
                    formattedVCardString += 'TEL;TYPE=CELL:' + e(vCard.cellPhone) + nl();
                }
            }

            if (vCard.pagerPhone) {
                if (majorVersion >= 4) {
                    formattedVCardString += 'TEL;VALUE=uri;TYPE="pager,cell":tel:' + e(vCard.pagerPhone) + nl();
                } else {
                    formattedVCardString += 'TEL;TYPE=PAGER:' + e(vCard.pagerPhone) + nl();
                }
            }

            if (vCard.homePhone) {
                if (majorVersion >= 4) {
                    formattedVCardString += 'TEL;VALUE=uri;TYPE="voice,home":tel:' + e(vCard.homePhone) + nl();
                } else {
                    formattedVCardString += 'TEL;TYPE=HOME,VOICE:' + e(vCard.homePhone) + nl();
                }
            }

            if (vCard.workPhone) {
                if (majorVersion >= 4) {
                    formattedVCardString += 'TEL;VALUE=uri;TYPE="voice,work":tel:' + e(vCard.workPhone) + nl();

                } else {
                    formattedVCardString += 'TEL;TYPE=WORK,VOICE:' + e(vCard.workPhone) + nl();
                }
            }

            if (vCard.homeFax) {
                if (majorVersion >= 4) {
                    formattedVCardString += 'TEL;VALUE=uri;TYPE="fax,home":tel:' + e(vCard.homeFax) + nl();

                } else {
                    formattedVCardString += 'TEL;TYPE=HOME,FAX:' + e(vCard.homeFax) + nl();
                }
            }

            if (vCard.workFax) {
                if (majorVersion >= 4) {
                    formattedVCardString += 'TEL;VALUE=uri;TYPE="fax,work":tel:' + e(vCard.workFax) + nl();

                } else {
                    formattedVCardString += 'TEL;TYPE=WORK,FAX:' + e(vCard.workFax) + nl();
                }
            }

            [{
                details: vCard.homeAddress,
                type: 'HOME'
            }, {
                details: vCard.workAddress,
                type: 'WORK'
            }].forEach(
                function(address) {
                    formattedVCardString += getFormattedAddress(encodingPrefix, address);
                }
            );

            if (vCard.title) {
                formattedVCardString += 'TITLE' + encodingPrefix + ':' + e(vCard.title) + nl();
            }

            if (vCard.role) {
                formattedVCardString += 'ROLE' + encodingPrefix + ':' + e(vCard.role) + nl();
            }

            if (vCard.organization) {
                formattedVCardString += 'ORG' + encodingPrefix + ':' + e(vCard.organization) + nl();
            }

            if (vCard.url) {
                formattedVCardString += 'URL' + encodingPrefix + ':' + e(vCard.url) + nl();
            }

            if (vCard.workUrl) {
                formattedVCardString += 'URL;type=WORK' + encodingPrefix + ':' + e(vCard.workUrl) + nl();
            }

            if (vCard.note) {
                formattedVCardString += 'NOTE' + encodingPrefix + ':' + e(vCard.note) + nl();
            }

            if (vCard.socialUrls) {
                for (var key in vCard.socialUrls) {
                    if (vCard.socialUrls.hasOwnProperty(key) &&
                        vCard.socialUrls[key]) {
                        formattedVCardString += 'X-SOCIALPROFILE' + encodingPrefix + ';TYPE=' + key + ':' + e(vCard.socialUrls[key]) + nl();
                    }
                }
            }

            if (vCard.source) {
                formattedVCardString += 'SOURCE' + encodingPrefix + ':' + e(vCard.source) + nl();
            }

            formattedVCardString += 'REV:' + moment().format() + nl();
            formattedVCardString += 'END:VCARD' + nl();
            return formattedVCardString;
        }
    };
})();
