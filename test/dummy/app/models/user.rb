class User < ActiveRecord::Base
  enum gender: [:male, :female]
  validates_presence_of :name
  validates :terms_accepted, acceptance: { accept: true }
  validates :gender, inclusion: {in: genders.keys}
end
