/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Do some validation.

define(function (require, exports, module) {
  'use strict';

  var Validate = require('lib/validate');
  var Vat = require('vat');

  Vat.register('base64jwt', Vat.string().test(Validate.isBase64JwtValid));
  Vat.register('hex', Vat.string().test(Validate.isHexValid));
  Vat.register('uri', Vat.string().test(Validate.isUriValid));
  Vat.register('url', Vat.string().test(Validate.isUrlValid));
  Vat.register('urn', Vat.string().test(Validate.isUrnValid));

  return Vat;
});

