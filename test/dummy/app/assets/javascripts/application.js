// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require jquery_ujsh
//= require turbolinks
//= require_tree . 
  
$(document).on('page:change', function () {
  $('form.new_user[data-remote]').ujsh({
    // error:{reporting:{style:'dialog'}},
    success:{redirect: true}
  });
  $('form.edit_user[data-remote]').ujsh({
    error:{reporting:{style:'hint'}},
    success:{reporting:{style:'dialog'}}
  });
  $('a[data-remote]').ujsh({
    error:{reporting:{style:'dialog'}},
    success: {reporting:{style: 'dialog'}, afterFilter: function (e, data, status, request) {
      $(e.currentTarget).parents('tr').remove();
    }}
  });
})