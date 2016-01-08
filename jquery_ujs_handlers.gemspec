$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "jquery_ujs_handlers/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "jquery_ujs_handlers"
  s.version     = JqueryUjsHandlers::VERSION
  s.authors     = ["Onur Uyar"]
  s.email       = ["me@onuruyar.com"]
  s.homepage    = "TODO"
  s.summary     = "TODO: Summary of JqueryUjsHandlers."
  s.description = "TODO: Description of JqueryUjsHandlers."
  s.license     = "MIT"

  s.files = Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.rdoc"]
  s.test_files = Dir["test/**/*"]

  s.add_dependency "rails", "~> 4.2.5"

  s.add_development_dependency "jquery-rails"
  s.add_development_dependency "turbolinks"
  s.add_development_dependency "sqlite3"
end
