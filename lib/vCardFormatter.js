'use strict';

(function vCardFormatter() {
    var moment = require('moment');
    var majorVersion = '4';

    function e(value) {
        if (value) {
            return value.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
        }
        return '';
    }

    function nl() {
        return '\r\n';
    }

    function getFormattedPhoto(photoType, url, mediaType) {

        var formattedPhoto = '';

        if (majorVersion >= 4) {
            formattedPhoto = photoType + ';MEDIATYPE=image/' + mediaType + ':' + e(url) + nl();
        } else if (majorVersion === 3) {
            formattedPhoto = photoType + ';TYPE=' + mediaType + ':' + e(url) + nl();
        } else {
            formattedPhoto = photoType + ';' + mediaType + ':' + e(url) + nl();
        }

        return formattedPhoto;
    }

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
        getFormattedString: function(vCard) {

            majorVersion = vCard.getMajorVersion();

            var formattedVCardString = '';
            formattedVCardString += 'BEGIN: VCARD' + nl();
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
                formattedVCardString += getFormattedPhoto('LOGO', vCard.logo.url, vCard.logo.mediaType);
            }

            if (vCard.photo.url) {
                formattedVCardString += getFormattedPhoto('PHOTO', vCard.photo.url, vCard.photo.mediaType);
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

            if (vCard.source) {
                formattedVCardString += 'SOURCE:' + e(vCard.source) + nl();
            }

            formattedVCardString += 'REV:' + moment().format() + nl();
            formattedVCardString += 'END: VCARD' + nl();
            return formattedVCardString;
        }
    }
})();