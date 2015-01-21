vCards JS
=====

[![Build Status](https://travis-ci.org/enesser/vCards-js.svg?branch=master)](https://travis-ci.org/enesser/vCards-js.svg?branch=master)
[![Dependency Status](https://david-dm.org/enesser/vCards-JS.svg?style=flat)](https://david-dm.org/enesser/vCards-JS.svg?style=flat)
[![devDependency Status](https://david-dm.org/enesser/vCards-JS/dev-status.svg?style=flat)](https://david-dm.org/enesser/vCards-JS/dev-status.svg?style=flat)

Create vCards to import contacts into Outlook, iOS, Mac OS, and Android devices from your website or application.

![Screenshot](https://cloud.githubusercontent.com/assets/5659221/5240131/f99c1f3e-78c1-11e4-83b1-4f6e70eecf65.png)

## Install

```sh
npm install vcards-js --save
```

## Usage

Below is a simple example of how to create a basic vCard and how to save it to a file, or view its contents from the console.

### Basic vCard

```js
var vCard = require('vcards-js');

//create a new vCard
vCard = vCard();

//set properties
vCard.firstName = 'Eric';
vCard.middleName = 'J';
vCard.lastName = 'Nesser';
vCard.organization = 'ACME Corporation';
vCard.photo.attachFromUrl('https://avatars2.githubusercontent.com/u/5659221?v=3&s=460', 'JPEG');
vCard.workPhone = '312-555-1212';
vCard.birthday = new Date('01-01-1985');
vCard.title = 'Software Developer';
vCard.url = 'https://github.com/enesser';
vCard.note = 'Notes on Eric';

//save to file
vCard.saveToFile('./eric-nesser.vcf');

//get as formatted string
console.log(vCard.getFormattedString());

```

### On the Web

You can use vCards JS on your website. Below is an example of how to get it working on Express 4.

```js

var express = require('express');
var router = express.Router();

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {

    var vCard = require('vcards-js');

    //create a new vCard
    vCard = vCard();

    //set properties
    vCard.firstName = 'Eric';
    vCard.middleName = 'J';
    vCard.lastName = 'Nesser';
    vCard.organization = 'ACME Corporation';

    //set content-type and disposition including desired filename
    res.set('Content-Type', 'text/vcard; name="enesser.vcf"');
    res.set('Content-Disposition', 'inline; filename="enesser.vcf"');

    //send the response
    res.send(vCard.getFormattedString());
});

```

### Complete Example

The following shows a vCard with everything filled out.

```js
var vCard = require('vcards-js');

//create a new vCard
vCard = vCard();

//set basic properties shown before
vCard.firstName = 'Eric';
vCard.middleName = 'J';
vCard.lastName = 'Nesser';
vCard.organization = 'ACME Corporation';
vCard.photo.attachFromUrl('https://avatars2.githubusercontent.com/u/5659221?v=3&s=460', 'JPEG');
vCard.workPhone = '312-555-1212';
vCard.birthday = new Date('01-01-1985');
vCard.title = 'Software Developer';
vCard.url = 'https://github.com/enesser';
vCard.note = 'Notes on Eric';

//set other vitals
vCard.nickname = 'Scarface';
vCard.namePrefix = 'Mr.';
vCard.nameSuffix = 'JR';
vCard.gender = 'M';
vCard.anniversary = new Date('01-01-2004');
vCard.role = 'Software Development';

//set other phone numbers
vCard.homePhone = '312-555-1313';
vCard.cellPhone = '312-555-1414';

//set logo of organization or personal logo
vCard.logo.attachFromUrl('https://avatars2.githubusercontent.com/u/5659221?v=3&s=460', 'JPEG');

//set URL where the vCard can be found
vCard.source = 'http://mywebpage/myvcard.vcf';

//set address information
vCard.homeAddress.label = 'Home Address';
vCard.homeAddress.street = '123 Main Street';
vCard.homeAddress.city = 'Chicago';
vCard.homeAddress.stateProvince = 'IL';
vCard.homeAddress.postalCode = '12345';
vCard.homeAddress.countryRegion = 'United States of America';

vCard.workAddress.label = 'Work Address';
vCard.workAddress.street = '123 Corporate Loop\nSuite 500';
vCard.workAddress.city = 'Los Angeles';
vCard.workAddress.stateProvince = 'CA';
vCard.workAddress.postalCode = '54321';
vCard.workAddress.countryRegion = 'United States of America';

//set social media URLs
vCard.socialUrls['facebook'] = 'https://...';
vCard.socialUrls['linkedIn'] = 'https://...';
vCard.socialUrls['twitter'] = 'https://...';
vCard.socialUrls['flickr'] = 'https://...';
vCard.socialUrls['custom'] = 'https://...';

//you can also embed photos from files instead of attaching via URL
vCard.photo.embedFromFile('photo.jpg');
vCard.logo.embedFromFile('logo.jpg');

vCard.version = '4.0'; //can also support 2.1 and 3.0, certain versions only support certain fields

//save to file
vCard.saveToFile('./eric-nesser.vcf');

//get as formatted string
console.log(vCard.getFormattedString());
```

### Known Issues

vCards JS currently has partial support for 2.1, and broad support for 3.0 and 4.0. I will be adding full support for 2.1 soon.

vCards JS was built to specifications. This means there are some issues with MS Outlook. Outlook may not support all the fields that
the library supports as it has its own proprietary extensions. I will be adding more Outlook-specific support in the near future.

If there's anything you need that's missing, please let me know and I will make that my priority.

### Contributions

Contributions are always welcome!

### License
Copyright (c) 2014 Eric J Nesser MIT