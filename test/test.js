'use strict';

const mongoose = require('mongoose');
const util     = require('util');
const _        = require('lodash');
const hmve     = require('../index');

mongoose
  .connect('mongodb://localhost:27017/test')
  .then(() => console.log('MongoDB connected.'))
  .catch(err => console.log('MongoDB connect failed : ', err.message));

const Schema = mongoose.Schema;

const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

// let UsersSchema = new Schema({
//   username  : { type : String, default : '', require : true , minlength : 3, maxlength : 100 },
//   password  : { type : String, default : '', require : true , minlength : 3, maxlength : 100 },
//   email     : { type : String, default : '', require : true , match     : emailRegex         },
//   firstName : { type : String, default : '', require : false, minlength : 3, maxlength : 100 },
//   lastName  : { type : String, default : '', require : false, minlength : 3, maxlength : 100 },
//   age       : { type : Number, default : 0 , require : false, min       : 1, max       : 200 },
// });

let UsersSchema = new Schema({
  username  : { type : String, required : true , minlength : 3, maxlength : 100, $name : 'tên tài khoản' },
  fullName  : { type : String, required : false, minlength : 3, maxlength : 100,  $name : 'họ tên'   },
  age       : { type : Number, required : false, min : 1, max : 200, $name : 'tuổi' },
  email     : { type : String, default : '', require : true , match : emailRegex },
  role      : { type : String, default : '', enum : ['admin', 'normal'], $name : 'quyền' },
  birthday  : { type : Date,   default : null, $name : 'Sinh nhật' },
  logs      : [{
    time    : { type : Date,   default : null, $name : 'Thời gian truy cập' },
  }],
  address   : {
    country  : { type : String, minlength : 2 },
    province : { type : String, minlength : 2 },
    district : { type : String, minlength : 2 },
    ward     : { type : String, minlength : 2 },
    street   : { type : String, minlength : 2 },
  }
});

async function test() {
  const UsersModel = mongoose.model('Users', UsersSchema, 'Users');
  // hmve.setPathNames(UsersModel, 'vi', require('./PATH_NAMES').Users.vi);
  hmve.setMessageTemplates('vi', require('./MESSAGE_TEMPLATES').vi);
  hmve.setTypeNames('vi', require('./TYPE_NAMES').vi);
  hmve.setOptions({ default_package : 'vi', link_to_origin_error : 'origin_error' });

  let user = UsersModel({
    firstName : 'Bi', 
    age       : 1000,
    email     : 'bi.mail.com',
    role      : 'super',
    birthday  : 'AAA',
    logs      : 'AAA',
    address   : {
      country : 1
    }
  });

  // setInterval(testTime, 1000);

  async function testTime() {
    console.time('  hmve');
    user.validate(err => {
      console.timeEnd('  hmve');
    });
  
    console.time('+ hmve');
    user.validate(err => {
      err = hmve(UsersModel, err);
      console.timeEnd('+ hmve');
    });
  }

  let err = await hmve.validate(user);
  if (err) {
    console.log(err.message);
    inspect(err);
    process.exit(1);
  }
  user = await user.save();
  inspect(user);
  process.exit(0);
}

function inspect(val) {
  // console.log(util.inspect(val, false, null, false));
  console.log(JSON.stringify(val, null, 2));
}

setTimeout(test, 8000);
