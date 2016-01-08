// This jquery plugin depends on jquery_ujs,
// ensure below lines added before this file in your pipeline
// //= require jquery
// //= require jquery_ujs

'use strict';

(function($, undefined) {

  $.fn.ujsh = function (options) {

    var DEFAULT_ERR_MSG = 'Sorry, something went wrong. Please try again later';

    var ERROR = 'error';

    var SUCCESS = 'success';

    var HINT = 'hint';

    var LIST = 'list';

    var DIALOG = 'dialog';

    var hintTmp = '<span class="ujsh-hint ujsh-hint__{{modifier}}">{{content}}</span>';

    var listTmp = '<ul class="ujsh-list ujsh-list__{{modifier}}"></ul>';

    var listItemTmp = '<li class="ujsh-list--item ujsh-list--item__{{modifier}}">{{content}}</li>';

    var dialogTmp = '' +
    '<div class="ujsh-dialog ujsh-dialog__{{modifier}}">' +
    '<div class="ujsh-dialog--wrapper">' +
      '<div class="ujsh-dialog--container>' +
        '<div class="ujsh-dialog--header">' +
          '<a class="ujsh-dialog--button-close" data-ujsh-dialog-close>&times;</a>' +
        '</div>' +
        '<div class="ujsh-dialog--body">' +
          '{{content}}' +
        '</div>' +
      '</div>' +
    '</div>';

    var reporters = {
      error: {
        hint: function (request, status, error) {
          var errors = parseErrors(request);
          var field, fieldErrors, $field;
          var hintTmp = options.error.reporting.hint.tmp;

          for (field in errors) {
            fieldErrors = errors[field];
            $field = this.find('[type!=hidden][name*="[' + field + ']"]');
            $field.toggleClass(options.error.className, true);
            $(hintTmp.replace(/{{content}}/, fieldErrors.join(', '))).insertAfter($field);
          }
        },
        list: function (request, status, error) {
          this.prepend(requestToErrorList(request));
        },
        dialog: function (request, status, error) {
          var $list = requestToErrorList(request);
          var dialogTmp = options.error.reporting.dialog.tmp;
          var $dialog = $(dialogTmp.replace(/{{content}}/, $list[0].outerHTML));
          $dialog.find('[data-ujsh-dialog-close]').on('click', dialogCloseHandler.bind($dialog));
          $('body').prepend($dialog);
        }
      },
      success: {
        list: function (data, status, request) {
          var $list = $(options.error.reporting.list.tmp);
          var itemTmp = options.error.reporting.list.itemTmp;
          $list.append(itemTmp.replace(/{{content}}/, data.notice));
          this.prepend($list);
        },
        dialog: function (data, status, request) {
          var dialogTmp = options.success.reporting.dialog.tmp;
          var $dialog = $(dialogTmp.replace(/{{content}}/, data.notice));
          $dialog.find('[data-ujsh-dialog-close]').on('click', dialogCloseHandler.bind($dialog));
          $('body').prepend($dialog);
        }
      }
    }
    
    var defaultOptions = {
      before: {
        disable: false,
        handler: beforeHandler,
        clear: true
      },
      error: {
        disable: false,
        handler: errorHandler,
        beforeHandler: null,
        afterHandler: null,
        redirect: false,
        className: ERROR,
        reporting: {
          style: HINT, // hint, list, dialog
          hint: {
            tmp: hintTmp.replace(/{{modifier}}/g, ERROR)
          },
          list: {
            tmp: listTmp.replace(/{{modifier}}/g, ERROR),
            itemTmp: listItemTmp.replace(/{{modifier}}/g, ERROR),
          },
          dialog: {
            tmp: dialogTmp.replace(/{{modifier}}/g, ERROR)
          }
        }
      },
      success: {
        disable: false,
        handler: successHandler,
        beforeHandler: null,
        afterHandler: null,
        redirect: false,
        className: SUCCESS,
        reporting: {
          style: DIALOG, // list, dialog
          hint: {
            tmp: hintTmp.replace(/{{modifier}}/g, SUCCESS)
          },
          list: {
            tmp: listTmp.replace(/{{modifier}}/g, SUCCESS),
            itemTmp: listItemTmp.replace(/{{modifier}}/g, SUCCESS)
          },
          dialog: {
            tmp: dialogTmp.replace(/{{modifier}}/g, SUCCESS)
          }
        }
      }
    };

    function dialogCloseHandler () {
      this.remove();
    }

    function requestToErrorList (request) {
      var errors = parseErrors(request);
      var field, fieldErrors;
      var $list = $(options.error.reporting.list.tmp);
      var itemTmp = options.error.reporting.list.itemTmp;
      var items = [];

      for (field in errors) {
        fieldErrors = errors[field];
        items.push(
          itemTmp.replace(
            /{{content}}/, 
            '<strong>' + field.replace(/_/g, ' ') + '</strong> ' + fieldErrors.join(', ')
          )
        );
      }
      $list.html(items.join(''));
      return $list;
    }

    function parseErrors (request) {
      var errors = request.responseJSON ? (request.responseJSON.errors || request.responseJSON.error || request.responseJSON) : request.responseText || DEFAULT_ERR_MSG;
      if (typeof errors === 'string') {
        errors = {'': [errors]};
      }
      return errors;
    }

    function redirect (request) {
      var location = request.getResponseHeader('Location');
      if (location) {
        window.location.href = location;
      } else {
        window.location.reload();
      }
    }

    function beforeHandler (e) {
      if (options.before.clear) {
        $('.ujsh-' + options.error.reporting.style).remove();
        if (options.error.reporting.style === HINT) {
          this.find(
            'input.' + options.error.className + ', ' +
            'select.' + options.error.className + ', ' +
            'textarea.' + options.error.className
          ).toggleClass(options.error.className, false);
        }

        $('.ujsh-' + options.success.reporting.style).remove();
      }
    }

    function errorHandler (e, request, status, error) {
      if (typeof options.error.beforeFilter === 'function') {
        options.error.beforeFilter.call(this, e, request, status, error);
      }
      if (options.error.redirect) {
        return redirect(request);
      }
      reporters.error[options.error.reporting.style].call(this, request, status, error);
      if (typeof options.error.afterFilter === 'function') {
        options.error.afterFilter.call(this, e, request, status, error);
      }
    }

    function successHandler (e, data, status, request) {
      if (typeof options.success.beforeFilter === 'function') {
        options.success.beforeFilter.call(this, e, data, status, request);
      }
      if (options.success.redirect) {
        return redirect(request);
      }
      reporters.success[options.success.reporting.style].call(this, data, status, request);
      if (typeof options.success.afterFilter === 'function') {
        options.success.afterFilter.call(this, e, data, status, request);
      }
    }

    options = $.extend(true, defaultOptions, options || {});
    if (this.data('error-redirect')) options.error.redirect = this.data('error-redirect')
    if (this.data('success-redirect')) options.success.redirect = this.data('success-redirect')
    if (this.data('error-reporting-style')) options.error.reporting.style = this.data('error-reporting-style')
    if (this.data('success-reporting-style')) options.error.reporting.style = this.data('success-reporting-style')

    if (!options.before.disable) this.on('ajax:before', options.before.handler.bind(this));
    if (!options.error.disable) this.on('ajax:error', options.error.handler.bind(this));
    if (!options.success.disable) this.on('ajax:success', options.success.handler.bind(this));

    this.options = options;
    this.defaultOptions = defaultOptions;

    return this;
  }
})( jQuery );