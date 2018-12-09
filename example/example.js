'use strict';

const mongoose = require('mongoose');
const hmve     = require('../index');

mongoose
  .connect('mongodb://localhost:27017/test')
  .then(() => console.log('MongoDB connected.'))
  .catch(err => console.log('MongoDB connect failed : ', err.message));

const Schema = mongoose.Schema;

let UsersSchema = new Schema({
  username : { type : String, required : true                                  },
  fullName : { type : String, required : false, minlength : 3, maxlength : 100 },
  birthday : { type : Date  , required : false                                 },
});

const UsersModel = mongoose.model('Users', UsersSchema, 'Users');


setTimeout(async () => {
  let user = UsersModel({
    fullName : 'Bi',
    birthday : 'is a date?',
  });

  user.validate(err => {
    let user_friendly_error = hmve(UsersModel, err);
    if (user_friendly_error) {
      console.log(user_friendly_error.message);
      console.log(JSON.stringify(user_friendly_error, null, 2));
      process.exit(1);
    }
    process.exit(0);
  });

  let user_friendly_error = await hmve.validate(user);
  if (user_friendly_error) {
    console.log(user_friendly_error.message);
    console.log(JSON.stringify(user_friendly_error, null, 2));
    process.exit(1);
  }
  process.exit(0);

}, 5000);