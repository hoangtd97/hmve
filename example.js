/**
 * @description Test hmve, please install mongoose before run
 */

'use strict';

const mongoose = require('mongoose');
const hmve     = require('./index');

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
  let user_raw = {
    fullName : 'Bi',
    birthday : 'is a date?',
  };
  let user = UsersModel(user_raw);

  //----------------- Handle exist validation error --------------
  user.validate(err => {
    let user_friendly_error = hmve(UsersModel, err);
    if (user_friendly_error) {
      console.log(user_friendly_error.message);
      console.log(JSON.stringify(user_friendly_error, null, 2));
      process.exit(1);
    }
    process.exit(0);
  });

  //----------------- Validate document ---------------------------
  // let user_friendly_error = await hmve.validate(user);
  // if (user_friendly_error) {
  //   console.log(user_friendly_error.message);
  //   console.log(JSON.stringify(user_friendly_error, null, 2));
  //   process.exit(1);
  // }
  // process.exit(0);

  //----------------- Handle update error -----------------------
  // UsersModel
  //   .findOneAndUpdate(user_raw, user_raw, { upsert : true })
  //   .then(user => process.exit(0))
  //   .catch(err => {
  //     let user_friendly_error = hmve(UsersModel, err);
  //     console.log(user_friendly_error.message);
  //     console.log(JSON.stringify(user_friendly_error, null, 2));
  //     process.exit(1);
  //   });

}, 5000);