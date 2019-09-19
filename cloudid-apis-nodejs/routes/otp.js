const express = require('express');
const request = require('request');
const dotenv = require('dotenv');
const oauth = require('../oauth.js');
const ci = require('../cloudidentity.js');

var router = express.Router();

//Required Endpoints
var otpVerifyEndpoint = '/v1.0/authnmethods/emailotp/transient/verification';

// load contents of .env into process.env
dotenv.config();

var tenant_url = process.env.TENANT_URL;

//Global variable definitions
var txnID = '';
var mobile = '';
var email = '';
var method = '';

router.get('/', function(req, res, _next) {

  if (!req.session.authenticated) {
   req.session.afterlogin="otp";
    res.redirect('/userlogin');
  } else {
    console.log("START profile GET Function");

      var userId = req.session.userId;

      oauth.getAccessToken().then((tokenData) => {
        var access_token = tokenData.access_token;
        ci.getUser(access_token, userId).then(userJson => {
          mobile = userJson.phoneNumbers[0].value;
          email = userJson.emails[0].value;

          if (mobile) {
            method = "mobile";
          } else {
            method = "email";
          }

          if (method == "mobile") {
            var initializeOTPPromise = ci.generateOTP(access_token, method, mobile);
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
            var initializeOTPPromise = ci.generateOTP(access_token, method, email);
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
      });

    console.log("END profile GET Function");
  }
});


router.post('/', function(req, res, _next) {
  console.log("START profile POST Function");

  oauth.getAccessToken().then((tokenData) => {
    var access_token = tokenData.access_token;
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
          'Authorization': 'Bearer ' + access_token
        }
      }, function(_error, _response, body) {
        console.log("Body : " + body)
        if (body["messageDescription"]) {
          if (body["messageDescription"].search("successful") != -1) {
            req.session.otpcomplete = true;
            if (req.session.afterotp) {
              res.redirect('/' + req.session.afterotp);
            } else {
              res.render('error', {
                message: "No return URL available",
                status: "400"
              });
            }
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
});
module.exports = router;
