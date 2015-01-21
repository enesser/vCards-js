/********************************************************************************
    VCardsJS 0.10, Eric J Nesser, November 2014
********************************************************************************/
/*jslint node: true */
'use strict';

/**
 * vCard formatter for formatting vCards in VCF format
 */
(function vCardFormatter() {
    var moment = require('moment');
    var majorVersion = '4';

    /**
     * Encode string
     * @param  {String}     value to encode
     * @return {String}     encoded string
     */
    function e(value) {
        if (value) {
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

      if (majorVersion >= 4){
        params = base64 ? ';ENCODING=b;MEDIATYPE=image/' : ';MEDIATYPE=image/';
      } else if (majorVersion === 3){
        params = base64 ? ';ENCODING=b;TYPE=' : ';TYPE=';
      } else{
        params = base64 ? ';ENCODING=BASE64;' : ';';
      }

      var formattedPhoto = photoType + params + mediaType + ':' + e(url) + nl();
      return formattedPhoto;
    }

    /**
     * Get formatted address
     * @param  {object}         address
     * @return {String}         Formatted address
     */
    function getFormattedAddress(address) {

        var formattedAddress = '';

        if (address.details.label ||
            address.details.street ||
            address.details.city ||
            address.details.stateProvince ||
            address.details.postalCode ||
            address.details.countryRegion) {

            if (majorVersion < 4) {
                if (address.details.label) {
                    formattedAddress = 'LABEL;TYPE=' + address.type + ':' + e(address.details.label) + nl();
                }
                formattedAddress += 'ADR;TYPE=' + address.type + ':;;' +
                    e(address.details.street) + ';' +
                    e(address.details.city) + ';' +
                    e(address.details.stateProvince) + ';' +
                    e(address.details.postalCode) + ';' +
                    e(address.details.countryRegion) + nl();
            } else {
                formattedAddress = 'ADR;TYPE=' + address.type +
                    ';LABEL=' + e(address.details.label) + ':;;' +
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

            formattedVCardString += 'FN:' + e(formattedName) + nl();
            formattedVCardString += 'N:' +
                e(vCard.lastName) + ';' +
                e(vCard.firstName) + ';' +
                e(vCard.middleName) + ';' +
                e(vCard.namePrefix) + ';' +
                e(vCard.nameSuffix) + nl();

            if (vCard.nickname && majorVersion >= 3) {
                formattedVCardString += 'NICKNAME:' + e(vCard.nickname) + nl();
            }

            if (vCard.gender && majorVersion >= 4) {
                formattedVCardString += 'GENDER:' + e(vCard.gender) + nl();
            }

            if (vCard.birthday) {
                formattedVCardString += 'BDAY:' + moment(vCard.birthday).format('YYYYMMDD') + nl();
            }

            if (vCard.anniversary && majorVersion >= 4) {
                formattedVCardString += 'ANNIVERSARY:' + moment(vCard.anniversary).format('YYYYMMDD') + nl();
            }

            if (vCard.email) {
                if (majorVersion >= 4) {
                    formattedVCardString += 'EMAIL:' + e(vCard.email) + nl();
                } else {
                    formattedVCardString += 'EMAIL;PREF;INTERNET:' + e(vCard.email) + nl();
                }
            }

            if (vCard.photo.logo) {
                formattedVCardString += getFormattedPhoto('LOGO', vCard.logo.url, vCard.logo.mediaType, vCard.logo.base64);
            }

            if (vCard.photo.url) {
                formattedVCardString += getFormattedPhoto('PHOTO', vCard.photo.url, vCard.photo.mediaType, vCard.photo.base64);
            }

            if (vCard.cellPhone) {
                formattedVCardString += 'TEL;TYPE=CELL:' + e(vCard.cellPhone) + nl();
            }

            if (vCard.homePhone) {
                formattedVCardString += 'TEL;TYPE=HOME,VOICE:' + e(vCard.homePhone) + nl();
            }

            if (vCard.workPhone) {
                formattedVCardString += 'TEL;TYPE=WORK,VOICE:' + e(vCard.workPhone) + nl();
            }

            [{
                details: vCard.homeAddress,
                type: 'HOME'
            }, {
                details: vCard.workAddress,
                type: 'WORK'
            }].forEach(
                function(address) {
                    formattedVCardString += getFormattedAddress(address);
                }
            );

            if (vCard.title) {
                formattedVCardString += 'TITLE:' + e(vCard.title) + nl();
            }

            if (vCard.role) {
                formattedVCardString += 'ROLE:' + e(vCard.role) + nl();
            }

            if (vCard.organization) {
                formattedVCardString += 'ORG:' + e(vCard.organization) + nl();
            }

            if (vCard.url) {
                formattedVCardString += 'URL:' + e(vCard.url) + nl();
            }

            if (vCard.note) {
                formattedVCardString += 'NOTE:' + e(vCard.note) + nl();
            }

            if (vCard.socialUrls) {
                for (var key in vCard.socialUrls) {
                    if (vCard.socialUrls.hasOwnProperty(key) &&
                        vCard.socialUrls[key]) {                        
                        formattedVCardString += 'X-SOCIALPROFILE;TYPE=' + key + ":" + e(vCard.socialUrls[key]) + nl();
                    }
                }
            }

            if (vCard.source) {
                formattedVCardString += 'SOURCE:' + e(vCard.source) + nl();
            }

            formattedVCardString += 'REV:' + moment().format() + nl();
            formattedVCardString += 'END:VCARD' + nl();
            return formattedVCardString;
        }
    };
})();
