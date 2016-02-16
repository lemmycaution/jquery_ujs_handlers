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
      '<div class="ujsh-dialog--container">' +
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
        hint: function (e, request, status, error) {
          var errors = parseErrors(request);
          var field, fieldErrors, $field, fieldSelector;
          var hintTmp = this.options.error.reporting.hint.tmp;

          for (field in errors) {
            fieldErrors = errors[field];
            fieldSelector = field;
            if (field.indexOf('.') > -1) {
              fieldSelector = field.split('.');
              fieldSelector = fieldSelector[fieldSelector.length -1];
            }
            $field = this.find('[type!=hidden][name*="[' + fieldSelector + ']"]');
            $field.toggleClass(this.options.error.className, true);
            $(hintTmp.replace(/{{content}}/, fieldErrors.join(', '))).insertAfter($field);
          }
        },
        list: function (e, request, status, error) {
          this.prepend(requestToErrorList.call(this, request));
        },
        dialog: function (e, request, status, error) {
          var $list = requestToErrorList.call(this, request);
          var dialogTmp = this.options.error.reporting.dialog.tmp;
          var $dialog = $(dialogTmp.replace(/{{content}}/, $list[0].outerHTML));
          $dialog.find('[data-ujsh-dialog-close]').on('click', dialogCloseHandler.bind($dialog));
          $('body').prepend($dialog);
        }
      },
      success: {
        list: function (e, data, status, request) {
          var content = parseSuccess(data), $list, itemTmp;
          if (typeof content === 'undefined' || content == null) return;
          $list = $(this.options.success.reporting.list.tmp);
          itemTmp = this.options.success.reporting.list.itemTmp;
          $list.append(itemTmp.replace(/{{content}}/, content));
          this.prepend($list);
        },
        dialog: function (e, data, status, request) {
          var content = parseSuccess(data), dialogTmp, $dialog;
          if (typeof content === 'undefined' || content == null) return;
          dialogTmp = this.options.success.reporting.dialog.tmp;
          $dialog = $(dialogTmp.replace(/{{content}}/, content));
          $dialog.find('[data-ujsh-dialog-close]').on('click', dialogCloseHandler.bind($dialog));
          $('body').prepend($dialog);
        }
      }
    }
    
    var defaultOptions = {
      before: {
        handler: beforeHandler,
      },
      error: {
        handler: errorHandler,
        beforeFilter: null,
        afterFilter: null,
        redirect: false,
        reload: false,
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
        handler: successHandler,
        beforeFilter: null,
        afterFilter: null,
        redirect: false,
        reload: false,
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
      var $list = $(this.options.error.reporting.list.tmp);
      var itemTmp = this.options.error.reporting.list.itemTmp;
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
      var errors = request.responseJSON ? (request.responseJSON.errors || request.responseJSON.error || request.responseJSON.alert || request.responseJSON) : request.responseText || DEFAULT_ERR_MSG;
      if (typeof errors === 'string') {
        errors = {'': [errors]};
      }
      return errors;
    }

    function parseSuccess (data) {
      if (typeof data === 'string') {
        return data;
      }
      return data && data.notice;
    }

    function redirect (request, reload) {
      var location = request.getResponseHeader('Location') || (request.responseJSON && request.responseJSON.location);
      if (reload) {
        window.location.reload();
      } else if (location) {
        window.location.href = location;
      }
    }

    function beforeHandler (e) {
      var className;
      if (this.options.error.reporting.style === HINT) {
        className = this.options.error.className;
        this.find(
          'input.' + className + ', ' +
          'select.' + className + ', ' +
          'textarea.' + className
        ).toggleClass(className, false);
      }
      $('.ujsh-' + this.options.error.reporting.style).remove();
      $('.ujsh-' + this.options.success.reporting.style).remove();
    }

    function errorHandler () {
      var event = ERROR;
      var reporter = reporters[event][this.options[event].reporting.style];
      var beforeFilter = this.options[event].beforeFilter;
      var redirectTo = this.options[event].redirect;
      var reload = this.options[event].reload;      
      var afterFilter = this.options[event].afterFilter;
    
      if (typeof beforeFilter === 'function' && !beforeFilter.apply(this, arguments)) return;
      if (redirectTo) return redirect(arguments[event === ERROR ? 1 : 3], reload);
      if (typeof reporter === 'function') reporter.apply(this, arguments);
      if (typeof afterFilter === 'function') afterFilter.apply(this, arguments);
    }

    function successHandler () {
      var event = SUCCESS;

      // handle 401 but with 200 status code 
      var _arguments = arguments;
      if (_arguments[3].responseText === '{"error":"You need to sign in or sign up before continuing."}') {
        event = ERROR
        _arguments[3].status = 401
        _arguments = [_arguments[0], _arguments[3], 'error', 'Unauthenticated']
      }

      var reporter = reporters[event][this.options[event].reporting.style];
      var beforeFilter = this.options[event].beforeFilter;
      var redirectTo = this.options[event].redirect;
      var reload = this.options[event].reload;
      var afterFilter = this.options[event].afterFilter;
      console.log('successHandler beforeFilter', beforeFilter)
      if (typeof beforeFilter === 'function' && !beforeFilter.apply(this, _arguments)) return;
      console.log('successHandler redirectTo', redirectTo, _arguments[event === ERROR ? 1 : 3], reload)
      if (redirectTo) return redirect(_arguments[event === ERROR ? 1 : 3], reload);
      if (typeof reporter === 'function') reporter.apply(this, _arguments);
      if (typeof afterFilter === 'function') afterFilter.apply(this, _arguments);
    }

    return this.each(function() {
      var $element = $(this), 
      element = this;

      $element.options = $.extend(true, {}, defaultOptions, options || {});

      if (typeof $element.data('error-redirect') !== 'undefined') $element.options.error.redirect = $element.data('error-redirect');
      if (typeof $element.data('success-redirect') !== 'undefined') $element.options.success.redirect = $element.data('success-redirect');
      if (typeof $element.data('error-reload') !== 'undefined') $element.options.error.reload = $element.data('error-reload');
      if (typeof $element.data('success-reload') !== 'undefined') $element.options.success.reload = $element.data('success-reload');
      if ($element.data('error-reporting-style')) $element.options.error.reporting.style = $element.data('error-reporting-style');
      if ($element.data('success-reporting-style')) $element.options.success.reporting.style = $element.data('success-reporting-style');

      $element
      .on('ajax:before', $element.options.before.handler.bind($element))
      .on('ajax:error', $element.options.error.handler.bind($element))
      .on('ajax:success', $element.options.success.handler.bind($element));
    });
  }
})( jQuery );