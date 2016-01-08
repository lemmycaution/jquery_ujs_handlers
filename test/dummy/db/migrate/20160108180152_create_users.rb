class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
      t.string :name
      t.string :email
      t.integer :age
      t.integer :gender
      t.boolean :terms_accepted

      t.timestamps null: false
    end
  end
end
