/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  var Backbone = require('backbone');
  var chai = require('chai');
  var Notifier = require('lib/channels/notifier');
  var NullChannel = require('lib/channels/null');
  var sinon = require('sinon');

  var assert = chai.assert;

  describe('lib/channels/notifier', function () {
    var NOTIFICATION = Notifier.COMPLETE_RESET_PASSWORD_TAB_OPEN;

    var iframeChannelMock;
    var notifier;
    var tabChannelMock;
    var webChannelMock;

    beforeEach(function () {
      iframeChannelMock = new NullChannel();
      sinon.spy(iframeChannelMock, 'send');

      webChannelMock = new NullChannel();
      sinon.spy(webChannelMock, 'send');

      // Use a Backbone.Events based stub object so events
      // can be triggered on the mock for the tests. This will
      // require that `send` is mocked in.
      tabChannelMock = Object.create(Backbone.Events);
      tabChannelMock.send = sinon.spy();
      sinon.spy(tabChannelMock, 'on');


      notifier = new Notifier({
        iframeChannel: iframeChannelMock,
        tabChannel: tabChannelMock,
        webChannel: webChannelMock
      });
    });

    it('listens on initialization', function () {
      assert.equal(tabChannelMock.on.callCount,
                   Object.keys(Notifier.prototype.COMMANDS).length);
    });

    it('emits events received from other tabs', function (done) {
      var message = {
        data: { uid: '123' },
        event: NOTIFICATION
      };

      notifier.on(NOTIFICATION, function (data) {
        try {
          assert.deepEqual(data, message);
        } catch (e) {
          return done(e);
        }
        done();
      });

      tabChannelMock.trigger(NOTIFICATION, message);
    });

    describe('triggerAll', function () {
      it('triggers events on all channels and self', function () {
        var ev = 'fxaccounts:logout';
        var data = { uid: 'foo' };
        var spy = sinon.spy();

        notifier.on(ev, spy);
        notifier.triggerAll(ev, data);

        assert.isTrue(webChannelMock.send.calledWith(ev, data));
        assert.isTrue(tabChannelMock.send.calledWith(ev, data));
        assert.isTrue(iframeChannelMock.send.calledWith(ev, data));
        assert.isTrue(spy.called);
      });
    });

    describe('triggerRemote', function () {
      describe('with a global message', function () {
        var data = { uid: 'foo' };
        var ev = 'fxaccounts:logout';
        var notifierSpy;

        beforeEach(function () {
          notifierSpy = sinon.spy();

          notifier.on(ev, notifierSpy);
          notifier.triggerRemote(ev, data);
        });

        it('triggers events on remote channels but not self', function () {
          assert.isTrue(webChannelMock.send.calledWith(ev, data));
          assert.isTrue(tabChannelMock.send.calledWith(ev, data));
          assert.isTrue(iframeChannelMock.send.calledWith(ev, data));
          assert.isFalse(notifierSpy.called);
        });
      });

      describe('with an `internal:` message', function () {
        var ev = 'internal:message';
        var notifierSpy;

        beforeEach(function () {
          notifierSpy = sinon.spy();

          notifier.on(ev, notifierSpy);
          notifier.triggerRemote(ev);
        });

        it('triggers events on tabChannel only', function () {
          assert.isTrue(tabChannelMock.send.calledWith(ev));

          assert.isFalse(webChannelMock.send.called);
          assert.isFalse(iframeChannelMock.send.called);
          assert.isFalse(notifierSpy.called);
        });
      });

      describe('with undefined properties', function () {
        var data = { a: undefined, uid: 'foo', z: undefined };
        var expectedData = { uid: 'foo' };
        var ev = 'fxaccounts:logout';
        var notifierSpy;

        beforeEach(function () {
          notifierSpy = sinon.spy();

          notifier.on(ev, notifierSpy);
          notifier.triggerRemote(ev, data);
        });

        it('triggers events on remote channels but not self', function () {
          assert.equal(webChannelMock.send.args[0][0], ev);
          assert.deepEqual(webChannelMock.send.args[0][1], expectedData);
          assert.equal(tabChannelMock.send.args[0][0], ev);
          assert.deepEqual(tabChannelMock.send.args[0][1], expectedData);
          assert.equal(iframeChannelMock.send.args[0][0], ev);
          assert.deepEqual(iframeChannelMock.send.args[0][1], expectedData);
        });
      });

      it('throws if password is sent with fxaccounts:complete_reset_password_tab_open', function () {
        assert.throws(function () {
          notifier.triggerRemote('fxaccounts:complete_reset_password_tab_open', { password: 'foo' });
        });
      });

      it('does not throw if password is not sent with fxaccounts:complete_reset_password_tab_open', function () {
        assert.doesNotThrow(function () {
          notifier.triggerRemote('fxaccounts:complete_reset_password_tab_open');
        });
      });

      it('throws if password is sent with fxaccounts:delete', function () {
        assert.throws(function () {
          notifier.triggerRemote('fxaccounts:delete', { password: 'foo', uid: 'bar' });
        });
      });

      it('does not throw if password is not sent with fxaccounts:delete', function () {
        assert.doesNotThrow(function () {
          notifier.triggerRemote('fxaccounts:delete', { uid: 'foo' });
        });
      });

      it('throws if password is sent with profile:change', function () {
        assert.throws(function () {
          notifier.triggerRemote('profile:change', { password: 'foo', uid: 'bar' });
        });
      });

      it('does not throw if password is not sent with profile:change', function () {
        assert.doesNotThrow(function () {
          notifier.triggerRemote('profile:change', { uid: 'foo' });
        });
      });

      it('throws if password is sent with internal:signed_in', function () {
        assert.throws(function () {
          notifier.triggerRemote('internal:signed_in', {
            keyFetchToken: 'foo',
            password: 'bar',
            uid: 'baz',
            unwrapBKey: 'qux'
          });
        });
      });

      it('does not throw if password is not sent with internal:signed_in', function () {
        assert.doesNotThrow(function () {
          notifier.triggerRemote('internal:signed_in', {
            keyFetchToken: 'foo',
            uid: 'baz',
            unwrapBKey: 'qux'
          });
        });
      });

      it('does not throw if undefined password is sent with internal:signed_in', function () {
        assert.doesNotThrow(function () {
          notifier.triggerRemote('internal:signed_in', {
            keyFetchToken: 'foo',
            password: undefined,
            uid: 'baz',
            unwrapBKey: 'qux'
          });
        });
      });

      it('throws if password is sent with fxaccounts:logout', function () {
        assert.throws(function () {
          notifier.triggerRemote('fxaccounts:logout', { password: 'foo', uid: 'bar' });
        });
      });

      it('does not throw if password is not sent with fxaccounts:logout', function () {
        assert.doesNotThrow(function () {
          notifier.triggerRemote('fxaccounts:logout', { uid: 'foo' });
        });
      });
    });
  });
});

