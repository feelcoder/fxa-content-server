/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!bluebird',
  'intern/dojo/node!path',
  'intern/dojo/node!proxyquire',
  'intern/dojo/node!sinon',
], function (registerSuite, assert, Promise, path, proxyquire, sinon) {
  var request, activityEvent, write, random;

  registerSuite({
    name: 'activity-event',

    setup: function () {
      request = {
        headers: { 'user-agent': 'foo' },
        query: {
          bar: 'baz',
          qux: 'wibble',
          zignore: 'ignore me'
        }
      };
    },

    'sample rate is 100%': {
      setup: function () {
        activityEvent = proxyquire(path.resolve('server/lib/activity-event'), {
          './configuration': {
            get: function (property) {
              if (property !== 'activity_events.sample_rate') {
                throw new Error('Bad property `' + property + '` in mock config.get');
              }
              return 1;
            }
          }
        });

        write = process.stderr.write;
        process.stderr.write = sinon.spy();
      },

      teardown: function () {
        process.stderr.write = write;
      },

      'interface is correct': function () {
        assert.isFunction(activityEvent);
        assert.lengthOf(activityEvent, 4);
      },

      'call activityEvent': {
        setup: function () {
          activityEvent('mock event', { a: 'b', c: 'd' }, request, [ 'bar', 'qux' ]);
          return new Promise(function (resolve) {
            setImmediate(function () {
              resolve();
            });
          });
        },

        'process.stderr.write was called correctly': function () {
          assert.equal(process.stderr.write.callCount, 1);

          var args = process.stderr.write.args[0];
          assert.lengthOf(args, 1);
          assert.equal(args[0].substr(0, 14), 'activityEvent ');
          assert.equal(args[0][args[0].length - 1], '\n');

          var eventData = JSON.parse(args[0].substr(14));
          assert.isObject(eventData);
          assert.lengthOf(Object.keys(eventData), 7);
          assert.equal(eventData.op, 'activityEvent');
          assert.equal(eventData.event, 'mock event');
          assert.equal(eventData.userAgent, 'foo');
          assert.equal(eventData.bar, 'baz');
          assert.equal(eventData.qux, 'wibble');
          assert.equal(eventData.a, 'b');
          assert.equal(eventData.c, 'd');
        }
      }
    },

    'sample rate is 50%': {
      setup: function () {
        activityEvent = proxyquire(path.resolve('server/lib/activity-event'), {
          './configuration': {
            get: function (property) {
              if (property !== 'activity_events.sample_rate') {
                throw new Error('Bad property `' + property + '` in mock config.get');
              }
              return 0.5;
            }
          }
        });

        write = process.stderr.write;
        process.stderr.write = sinon.spy();

        random = Math.random;
        var count = 0;
        Math.random = sinon.spy(function () {
          if (++count % 2 === 1) {
            return 0.4;
          }
          return 0.5;
        });

        for (var i = 0; i < 6; ++i) {
          activityEvent('bar', {}, request);
        }
        return new Promise(function (resolve) {
          setImmediate(function () {
            resolve();
          });
        });
      },

      teardown: function () {
        process.stderr.write = write;
        Math.random = random;
      },

      'Math.random was called 6 times': function () {
        assert.equal(Math.random.callCount, 6);
      },

      'process.stderr.write was called 3 times': function () {
        assert.equal(process.stderr.write.callCount, 3);
      }
    },

    'sample rate is 1%': {
      setup: function () {
        activityEvent = proxyquire(path.resolve('server/lib/activity-event'), {
          './configuration': {
            get: function (property) {
              if (property !== 'activity_events.sample_rate') {
                throw new Error('Bad property `' + property + '` in mock config.get');
              }
              return 0.01;
            }
          }
        });

        write = process.stderr.write;
        process.stderr.write = sinon.spy();

        random = Math.random;
        var count = 0;
        Math.random = sinon.spy(function () {
          if (++count % 100 === 1) {
            return 0.009;
          }
          return 0.01;
        });

        for (var i = 0; i < 101; ++i) {
          activityEvent('bar', {}, request);
        }
        return new Promise(function (resolve) {
          setImmediate(function () {
            resolve();
          });
        });
      },

      teardown: function () {
        process.stderr.write = write;
        Math.random = random;
      },

      'Math.random was called 101 times': function () {
        assert.equal(Math.random.callCount, 101);
      },

      'process.stderr.write was called twice': function () {
        assert.equal(process.stderr.write.callCount, 2);
      }
    }
  });
});
