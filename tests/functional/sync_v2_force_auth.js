/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern!object',
  'tests/lib/helpers',
  'tests/functional/lib/helpers'
], function (registerSuite, TestHelpers, FunctionalHelpers) {
  var email;
  var PASSWORD = '12345678';

  var createUser = FunctionalHelpers.createUser;
  var fillOutForceAuth = FunctionalHelpers.thenify(FunctionalHelpers.fillOutForceAuth);
  var noSuchBrowserNotification = FunctionalHelpers.noSuchBrowserNotification;
  var openForceAuth = FunctionalHelpers.thenify(FunctionalHelpers.openForceAuth);
  var respondToWebChannelMessage = FunctionalHelpers.respondToWebChannelMessage;
  var testIsBrowserNotified = FunctionalHelpers.testIsBrowserNotified;

  registerSuite({
    name: 'Firefox Desktop Sync v2 force_auth',

    beforeEach: function () {
      email = TestHelpers.createEmail();

      return FunctionalHelpers.clearBrowserState(this);
    },

    'verified': function () {
      var self = this;

      return this.remote
        .then(createUser(email, PASSWORD, { preVerified: true }))
        .then(openForceAuth(self, email, { context: 'fx_desktop_v2', service: 'sync' }))

        .then(noSuchBrowserNotification(self, 'fxaccounts:logout'))

        .then(respondToWebChannelMessage(self, 'fxaccounts:can_link_account', { ok: true } ))

        .then(fillOutForceAuth(self, PASSWORD))

        // add a slight delay to ensure the page does not transition
        .sleep(2000)

        // the page does not transition.
        .findByCssSelector('#fxa-force-auth-header')
        .end()

        .then(testIsBrowserNotified(self, 'fxaccounts:can_link_account'))
        .then(testIsBrowserNotified(self, 'fxaccounts:login'));
    }
  });
});
