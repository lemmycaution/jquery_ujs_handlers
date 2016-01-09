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
        hint: function (request, status, error) {
          var errors = parseErrors(request);
          var field, fieldErrors, $field;
          var hintTmp = this.options.error.reporting.hint.tmp;

          for (field in errors) {
            fieldErrors = errors[field];
            $field = this.find('[type!=hidden][name*="[' + field + ']"]');
            $field.toggleClass(this.options.error.className, true);
            $(hintTmp.replace(/{{content}}/, fieldErrors.join(', '))).insertAfter($field);
          }
        },
        list: function (request, status, error) {
          this.prepend(requestToErrorList.call(this, request));
        },
        dialog: function (request, status, error) {
          var $list = requestToErrorList.call(this, request);
          var dialogTmp = this.options.error.reporting.dialog.tmp;
          var $dialog = $(dialogTmp.replace(/{{content}}/, $list[0].outerHTML));
          $dialog.find('[data-ujsh-dialog-close]').on('click', dialogCloseHandler.bind($dialog));
          $('body').prepend($dialog);
        }
      },
      success: {
        list: function (data, status, request) {
          var $list = $(this.options.error.reporting.list.tmp);
          var itemTmp = this.options.error.reporting.list.itemTmp;
          $list.append(itemTmp.replace(/{{content}}/, data.notice));
          this.prepend($list);
        },
        dialog: function (data, status, request) {
          var dialogTmp = this.options.success.reporting.dialog.tmp;
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
      if (this.options.before.clear) {
        $('.ujsh-' + this.options.error.reporting.style).remove();
        if (this.options.error.reporting.style === HINT) {
          this.find(
            'input.' + this.options.error.className + ', ' +
            'select.' + this.options.error.className + ', ' +
            'textarea.' + this.options.error.className
          ).toggleClass(this.options.error.className, false);
        }

        $('.ujsh-' + this.options.success.reporting.style).remove();
      }
    }

    function errorHandler (e, request, status, error) {
      if (typeof this.options.error.beforeFilter === 'function') {
        if (!this.options.error.beforeFilter.call(this, e, request, status, error)) {
          return;
        }
      }
      if (this.options.error.redirect) {
        return redirect(request);
      }
      reporters.error[this.options.error.reporting.style].call(this, request, status, error);
      if (typeof this.options.error.afterFilter === 'function') {
        this.options.error.afterFilter.call(this, e, request, status, error);
      }
    }

    function successHandler (e, data, status, request) {
      if (typeof this.options.success.beforeFilter === 'function') {
        if (!this.options.success.beforeFilter.call(this, e, data, status, request)) {
          return;
        }
      }
      if (this.options.success.redirect) {
        return redirect(request);
      }
      reporters.success[this.options.success.reporting.style].call(this, data, status, request);
      if (typeof this.options.success.afterFilter === 'function') {
        this.options.success.afterFilter.call(this, e, data, status, request);
      }
    }

    
    
    return this.each(function() {
        var $element = $(this), 
            element = this;

         $element.options = $.extend(true, {}, defaultOptions, options || {});

         if ($element.data('error-redirect')) $element.options.error.redirect = $element.data('error-redirect')
         if ($element.data('success-redirect')) $element.options.success.redirect = $element.data('success-redirect')
         if ($element.data('error-reporting-style')) $element.options.error.reporting.style = $element.data('error-reporting-style')
         if ($element.data('success-reporting-style')) $element.options.error.reporting.style = $element.data('success-reporting-style')

         if (!$element.options.before.disable) $element.on('ajax:before', $element.options.before.handler.bind($element));
         if (!$element.options.error.disable) $element.on('ajax:error', $element.options.error.handler.bind($element));
         if (!$element.options.success.disable) $element.on('ajax:success', $element.options.success.handler.bind($element));
    });
  }
})( jQuery );