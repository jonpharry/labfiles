const express = require('express');
const ci = require('../cloudidentity.js');

var router = express.Router();

router.get('/', function(req, res, _next) {

  if (!req.session.authenticated) {
    req.session.afterlogin = "otp";
    res.redirect('/userlogin');
  } else {
    console.log("START profile GET Function");

    var userId = req.session.userId;

      ci.getUser(userId).then(userJson => {
        var mobile = userJson.phoneNumbers[0].value;
        var email = userJson.emails[0].value;

        if (mobile) {
          method = "mobile";
          destination = mobile;
        } else {
          method = "email";
          destination = email;
        }
        ci.generateOTP(method, destination).then(body => {
            var hint = body.correlation;
            if (!(hint)) {
              res.render('error', {
                message: "Something went wrong with OTP generation, please re run the flow",
                status: "400"
              });
            } else {
              req.session.otpInitResponse = body;
              res.render('otp', {
                title: 'Login with the One-Time password',
                hint: hint,
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
      });

    console.log("END profile GET Function");
  }
});


router.post('/', function(req, res, _next) {
  console.log("START profile POST Function");
  if (req.body.otp) {
      ci.validateOTP(req.session.otpInitResponse, req.body.otp).then(body => {
        if (body.messageDescription) {
          if (body.messageDescription.search("successful") != -1) {
            req.session.otpcomplete = true;
            delete req.session.otpInitResponse
            if (req.session.afterotp) {
              var url = req.session.afterotp;
              delete req.session.afterotp;
              res.redirect('/' + url);

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
module.exports = router;
