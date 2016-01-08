# JqueryUjsHandlers

A thin wrapper on jquery-ujs library which provides built in ajax handler to handle standard RESTful request such as error reporting, redirecting based on Location header, flash message displaying.

# Setup

add `gem "jquery_ujs_handlers"` to your rails project Gemfile. Include `jquery_ujsh` into your application.js manifest after jquery and jquery_ujs libraries.

# Usage

see `test/dummy` app for example usage, check `defaultOptions` in `app/assets/javascripts/jquery_ujsh.js` file for available options.

# ToDo

- Write tests
- Write documentation

This project rocks and uses MIT-LICENSE.