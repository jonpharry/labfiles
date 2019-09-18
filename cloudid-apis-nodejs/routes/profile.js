const express = require('express');
const request = require('request');
const dotenv = require('dotenv');
const oauth = require('../oauth.js');

var app = express();
var router = express.Router();

//Required Endpoints
var userEndpoint = '/v2.0/Users';

// load contents of .env into process.env
dotenv.config();

var tenant_url = process.env.TENANT_URL;

//Global variable definitions
var txnID = '';
var mobile = '';
var email = '';
var method = '';
var username = '';

//Function to lookup user from userID
function getUser(access_token, userid) {
  return new Promise(function(resolve, reject) {
    request({
      url: tenant_url + userEndpoint + '/' + userid,
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    }, function(error, _response, body) {
      if (error) {
        reject(error);
      } else {
        console.log(body);
        resolve(JSON.parse(body));
      }
    });
  });
}

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
        getUser(access_token, userid).then(userJson => {
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
