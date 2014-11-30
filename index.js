'use strict';

var vCard = (function () {

    function getPhoto() {
        return {
            url: '',
            mediaType: '',

            attachFromUrl: function(url, mediaType) {
                this.url = url;
                this.mediaType = mediaType;
            },

            embedFromFile: function(filename) {
                throw 'Not implemented yet.';
            }
        }
    }

    function getMailingAddress() {
        return {
            /**
             * Represents the actual text that should be put on the mailing label when delivering a physical package to the person/object associated with the vCard
             * @type {String}
             */
            label: '',

            /**
             * Street address
             * @type {String}
             */
            street: '',

            /**
             * City
             * @type {String}
             */
            city: '',

            /**
             * State or province
             * @type {String}
             */
            stateProvince: '',

            /**
             * Postal code
             * @type {String}
             */
            postalCode: '',

            /**
             * Country or region
             * @type {String}
             */
            countryRegion: ''
        }
    }

    //function create() {
    return {
        birthday: '',
        cellPhone: '',
        email: '',
        firstName: '',
        formattedName: '',

        /**
         * Gender.
         * @type {String} Must be M or F for Male or Female
         */
        gender: '',
        homeAddress: getMailingAddress(),
        homePhone: '',
        lastName: '',
        logo: getPhoto(),
        middleName: '',
        namePrefix: '',
        nameSuffix: '',
        nickname: '',
        note: '',
        organization: '',
        photo: getPhoto(),
        role: '',

        /**
         * A URL that can be used to get the latest version of this vCard
         * @type {String}
         */
        source: '',

        title: '',
        url: '',
        workAddress: getMailingAddress(),
        workPhone: '',

        /**
         * vCard version
         * @type {String}
         */
        version: '4.0',

        /**
         * Get rendered string
         * @param  {String} format
         * @return {String}        Rendered results
         */

        getMajorVersion: function() {
            var majorVersionString = this.version ? this.version.split('.')[0] : '4';
            if (!isNaN(majorVersionString)) {
                return parseInt(majorVersionString);
            }
            return 4;
        },

        getFormattedString: function() {
            var vCardFormatter = require('./lib/vCardFormatter');
            return vCardFormatter.getFormattedString(this);
        },

        saveToFile: function(filename) {
            var vCardFormatter = require('./lib/vCardFormatter');
            var contents = vCardFormatter.getFormattedString(this);

            var fs = require('fs');
            fs.writeFileSync(filename, contents, { encoding: 'utf8' });
        }
    }
});

module.exports = vCard;