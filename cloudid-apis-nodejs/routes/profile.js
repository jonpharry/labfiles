const express = require('express');
const https = require('https');
const request = require('request');
const fs = require('fs')
const dotenv = require('dotenv');

var app = express();
var router = express.Router();

//Required Endpoints
var userEndpoint = '/v2.0/Users';
var otpVerifyEndpoint = '/v1.0/authnmethods/emailotp/transient/verification';
var otpVerifyEndpointSMS = '/v1.0/authnmethods/smsotp/transient/verification';

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

//Function to generate one time password
function generateOTP(access_token, login_method, userData) {
  return new Promise(function(resolve, reject) {
    var otpData;
    var otpEndpoint;
    if (login_method == "email") {
      otpData = {
        "otpDeliveryEmailAddress": userData
      }
      otpEndpoint = otpVerifyEndpoint;
    } else {
      otpData = {
        "otpDeliveryMobileNumber": userData
      }
      otpEndpoint = otpVerifyEndpointSMS;
    }
    request({
      url: tenant_url + otpEndpoint,
      method: "POST",
      body: otpData,
      json: true,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    }, function(error, response, body) {
      if (error) {
        reject(error);
      } else {
        console.log(body);
        resolve(body);
      }
    });
  });
}

router.get('/', function(req, res, next) {
  console.log("START profile GET Function");
  if (req.query) {
    var user = req.query.user;

    //Retrieve access_token from the file, access_token.json
    var storedToken = fs.readFileSync('access_token.json');
    var token = JSON.parse(storedToken)["access_token"];
    console.log("Stored Access Token : " + token)

    access_token = token;

    getUser(access_token, user).then(userJson => {
      username = userJson.userName;
      mobile = userJson.phoneNumbers[0].value;
      email = userJson.emails[0].value;
      method = "mobile";

      if (method == "mobile") {
        var initializeOTPPromise = generateOTP(access_token, method, mobile);
        initializeOTPPromise.then(function(body) {
            txnID = body['id'];
            hint = body['correlation'];
            if (!(txnID)) {
              res.render('error', {
                message: "Something went wrong with OTP generation, please re run the flow",
                status: "400"
              });
            } else {
              res.render('otp', {
                title: 'Login with the One-Time password',
                hint: body['correlation'],
                method: 'mobile'
              });
            }
          },
          function(err) {
            res.render('error', {
              message: "Something went wrong with OTP generation",
              status: "400"
            });
            console.log(err);
          });
      } else {
        var initializeOTPPromise = generateOTP(access_token, method, email);
        initializeOTPPromise.then(function(body) {
            txnID = body['id'];
            hint = body['correlation'];
            if (!(txnID)) {
              res.render('error', {
                message: "Something went wrong with OTP generation, please re run the flow",
                status: "400"
              });
            } else {
              res.render('otp', {
                title: 'Login with the One-Time password',
                hint: body['correlation'],
                method: 'email'
              });
            }
          },
          function(err) {
            res.render('error', {
              message: "Something went wrong with OTP generation",
              status: "400"
            });
            console.log(err);
          });
      }
    });
  } else {
    console.log("Unable to retrieve user from the query string");
    res.render('error', {
      message: "Unable to retrieve user",
      status: "404"
    });
  }
  console.log("END profile GET Function");
});


router.post('/', function(req, res, next) {
  console.log("START profile POST Function");
  //Retrieve access_token from the file, access_token.json
  var storedToken = fs.readFileSync('access_token.json');
  var token = JSON.parse(storedToken)["access_token"];
  if (req.body.otp) {
    var otpData = {
      "otp": req.body.otp
    }
    request({
      url: tenant_url + otpVerifyEndpoint + '/' + txnID,
      method: "POST",
      body: otpData,
      json: true,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    }, function(_error, _response, body) {
      console.log("Body : " + body)
      if (body["messageDescription"]) {
        if (body["messageDescription"].search("successful") != -1) {
          res.render('profile', {
            title: 'User Profile',
            username: username,
            email: email,
            mobile: mobile,
            preferred_login: method
          });
        } else {
          res.render('error', {
            message: "OTP Validation failed",
            status: "400"
          });
        }
      } else {
        res.render('error', {
          message: "OTP Validation failed",
          status: "400"
        });
      }
    });
  } else {
    res.render('error', {
      message: "OTP not found failed",
      status: "404"
    });
  }
  console.log("END profile POST Function");
});
module.exports = router;
