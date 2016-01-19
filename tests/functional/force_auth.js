/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern!object',
  'tests/lib/helpers',
  'tests/functional/lib/helpers'
], function (registerSuite, TestHelpers, FunctionalHelpers) {
  var PASSWORD = 'password';
  var email;

  var thenify = FunctionalHelpers.thenify;

  var createUser = FunctionalHelpers.createUser;
  var click = FunctionalHelpers.click;
  var fillOutForceAuth = thenify(FunctionalHelpers.fillOutForceAuth);
  var openForceAuth = thenify(FunctionalHelpers.openForceAuth);
  var testElementExists = FunctionalHelpers.testElementExists;
  var testElementTextInclude = FunctionalHelpers.testElementTextInclude;
  var testElementValueEquals = FunctionalHelpers.testElementValueEquals;
  var type = FunctionalHelpers.type;

  function testAccountNoLongerExistsErrorShown() {
    return this.parent
      .then(testElementTextInclude('.error', 'no longer exists'));
  }

  registerSuite({
    name: 'force_auth',

    beforeEach: function () {
      email = TestHelpers.createEmail();

      return FunctionalHelpers.clearBrowserState(this);
    },

    'with an invalid email': function () {
      return this.remote
        .then(openForceAuth(this, 'invalid', {
          // TODO - this is a discrepancy and should go to the 400 page,
          // but that's for another PR.
          header: '#fxa-unexpected-error-header'
        }));
    },

    'with a registered email, no uid': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(openForceAuth(this, email))

        .then(fillOutForceAuth(this, PASSWORD))

        .then(testElementExists('#fxa-settings-header'));
    },

    'with a registered email, invalid uid': function () {
      var self = this;
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(function (accountInfo) {
          return openForceAuth(self, email, {
            // TODO - this is a discrepancy and should go to the 400 page,
            // but that's for another PR.
            header: '#fxa-unexpected-error-header',
            uid: 'a' + accountInfo.uid
          })();
        });
    },

    'with a registered email, registered uid': function () {
      var self = this;
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(function (accountInfo) {
          return openForceAuth(self, email, {
            uid: accountInfo.uid
          })();
        })

        .then(fillOutForceAuth(this, PASSWORD))

        .then(testElementExists('#fxa-settings-header'));
    },

    'with a registered email, unregistered uid': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(openForceAuth(this, email, {
          uid: TestHelpers.createUID()
        }))

        .then(testAccountNoLongerExistsErrorShown);
    },

    'with an unregistered email, no uid': function () {
      return this.remote
        // user is redirected to the signup page
        .then(openForceAuth(this, email, { header: '#fxa-signup-header' }))

        .then(testAccountNoLongerExistsErrorShown)

        // user cannot edit email
        .then(testElementExists('input[type=email].hidden'));
    },

    'with an unregistered email, registered uid': function () {
      var self = this;
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(function (accountInfo) {
          return openForceAuth(self, 'a' + email, {
            uid: accountInfo.uid
          })();
        })

        // user stays on the force_auth page but cannot continue, broker
        // does not support uid change
        .then(testAccountNoLongerExistsErrorShown);
    },

    'with an unregistered email, unregistered uid': function () {
      return this.remote
        .then(openForceAuth(this, email, {
          uid: TestHelpers.createUID()
        }))

        // user stays on the force_auth page but cannot continue, broker
        // does not support uid change
        .then(testAccountNoLongerExistsErrorShown);
    },

    'forgot password flow via force-auth goes directly to confirm email screen': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(openForceAuth(this, email))
        .then(click('.reset-password'))

        .then(testElementExists('#fxa-confirm-reset-password-header'))

        // user remembers her password, clicks the "sign in" link. They
        // should go back to the /force_auth screen.
        .then(click('.sign-in'))

        .then(testElementExists('#fxa-force-auth-header'));
    },

    'visiting the tos/pp links saves information for return': function () {
      var self = this;
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(function () {
          return testRepopulateFields.call(self, '/legal/terms', '#fxa-tos-header');
        })
        .then(function () {
          return testRepopulateFields.call(self, '/legal/privacy', '#fxa-pp-header');
        });
    },

    'form prefill information is cleared after sign in->sign out': function () {
      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(openForceAuth(this, email))

        .then(fillOutForceAuth(this, PASSWORD))

        .then(testElementExists('#fxa-settings-header'))

        .then(click('#signout'))

        .then(testElementExists('#fxa-signin-header'))

        .then(testElementValueEquals('input[type=password]', ''));
    }
  });

  function testRepopulateFields(dest, header) {
    return this.remote
      .then(openForceAuth(this, email))

      .then(type('input[type=password]', PASSWORD))

      .then(click('a[href="' + dest + '"]'))

      .then(testElementExists(header))

      .then(click('.back'))

      .then(testElementExists('#fxa-force-auth-header'))

      .then(testElementValueEquals('input[type=password]', PASSWORD));
  }
});
