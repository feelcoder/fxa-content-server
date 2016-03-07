/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Display a loading screen on view initialization until
 * the View's normal template is rendered.
 */

define(function (require, exports, module) {
  'use strict';

  var $ = require('jquery');
  var loadingTemplate = require('stache!templates/loading');

  module.exports = {
    initialize: function () {
      var loadingHTML = loadingTemplate({});
      this.setHTML(loadingHTML);
    },

    /**
     * Set the HTML of the view
     *
     * @param {string || element} html
     */
    setHTML: function (html) {
      $('#loading-spinner').hide();
      // note - the html is written directly into #stage instead
      // of this.$el because overwriting this.$el has a nasty side effect
      // where the view's DOM event handlers do hook up properly.

      // Render the new view while stage is invisible then fade it in
      // using css animations to catch problems with an explicit
      // opacity rule after class is added.

      $('#stage').html(html).addClass('fade-in-forward').css('opacity', 1);

      // The user may be scrolled part way down the page
      // on view transition. Force them to the top of the page.
      this.window.scrollTo(0, 0);

      $('#fox-logo').addClass('fade-in-forward').css('opacity', 1);
    }
  };
});

