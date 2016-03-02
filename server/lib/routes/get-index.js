/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var activityEvent = require('../activity-event');
var crypto = require('crypto');

var activityEventQueryParams = [
  'context',
  'entrypoint',
  'migration',
  'service',
  'utm_campaign',
  'utm_content',
  'utm_medium',
  'utm_source',
  'utm_term'
];

module.exports = function (config) {
  var STATIC_RESOURCE_URL = config.get('static_resource_url');

  var route = {};
  route.method = 'get';
  route.path = '/';

  route.process = function (req, res) {
    var time = Date.now();
    var flowId = crypto.randomBytes(16).toString('hex');
    res.render('index', {
      flowBeginTime: time,
      flowId: flowId,
      staticResourceUrl: STATIC_RESOURCE_URL
    });

    activityEvent('flow.begin', {
      flow_id: flowId, //eslint-disable-line camelcase
      flow_time: 0, //eslint-disable-line camelcase
      time: time
    }, req, activityEventQueryParams);
  };

  return route;
};

