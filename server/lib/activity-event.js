/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('lodash');
var Promise = require('bluebird');

var ALLOWED_QUERY_PARAMS = [
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
var MAX_PARAM_LENGTH = 100;

module.exports = function (event, data, request) {
  var queryParams = _.pick(request.query, ALLOWED_QUERY_PARAMS);
  var eventData = _.assign({
    event: event,
    path: request.originalUrl,
    userAgent: request.headers['user-agent']
  }, data, _.mapValues(queryParams, limitLength));

  optionallySetFallbackData(eventData, 'service', request.query.client_id);
  optionallySetFallbackData(eventData, 'entrypoint', request.query.entryPoint);

  return new Promise(function (resolve) {
    setImmediate(function () {
      // The data pipeline listens on stderr.
      process.stderr.write('activityEvent ' + JSON.stringify(eventData) + '\n');
      resolve();
    });
  });
};

function limitLength (param) {
  if (param && param.length > MAX_PARAM_LENGTH) {
    return param.substr(0, 100);
  }

  return param;
}

function optionallySetFallbackData (eventData, key, fallback) {
  if (! eventData[key] && fallback) {
    eventData[key] = limitLength(fallback);
  }
}

