const express = require('express');
const dotenv = require('dotenv');
const oauth = require('../oauth.js');
const ci = require('../cloudidentity.js');

var app = express();
var router = express.Router();

// load contents of .env into process.env
dotenv.config();

var mobile = '';
var email = '';
var method = '';
var username = '';

router.get('/', function(req, res, _next) {

  if (!req.session.authenticated) {
    req.session.afterlogin = "profile";
    res.redirect('/userlogin');
  } else {
    if (!req.session.otpcomplete) {
      req.session.afterotp = "profile";
      res.redirect('/otp');
    } else {
      console.log("START profile GET Function");

      var userid = req.session.userId;

      oauth.getAccessToken().then((tokenData) => {
        var access_token = tokenData.access_token;
        ci.getUser(access_token, userid).then(userJson => {
          username = userJson.userName;
          mobile = userJson.phoneNumbers[0].value;
          email = userJson.emails[0].value;

          if (mobile) {
            method = "mobile";
          } else {
            method = "email";
          }

          res.render('profile', {
            title: 'User Profile',
            username: username,
            email: email,
            mobile: mobile,
            otpMethod: method
          });
        });
      });
    }
  }
});

module.exports = router;
