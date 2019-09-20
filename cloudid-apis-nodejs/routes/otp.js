const express = require('express');
var router = express.Router();

// Cloud Identity Module makes calls to CI
const ci = require('../cloudidentity.js');

// GET function is called to initiate OTP
router.get('/', function(req, res, _next) {

  console.log("START OTP GET Function");

  // Check user is authenticated.  Redirect to user login if not.
  if (!req.session.authenticated) {
    req.session.afterlogin = "otp";
    res.redirect('/userlogin');
  } else { // User is authenticated

    // Get CI userId from session
    var userId = req.session.userId;

      // Call CI to get user information
      ci.getUser(userId).then(userJson => {

        // Extract e-mail address from SCIM response
        var destination = userJson.emails[0].value;
        var method = "email";

        // Extract mobile number for SCIM response
        var mobileNo = userJson.phoneNumbers[0].value;

        // If mobile number defined, prefer this for OTP
        if (mobileNo) {
          method = "mobile";
          destination = mobileNo;
        }

        // Call CI to initiate OTP.  This will send OTP.
        // Response contains information required for validation
        ci.generateOTP(method, destination).then(body => {

            // Extract hint from response
            var hint = body.correlation;

            // If no hint, this means the OTP send failed
            if (!(hint)) {
              res.render('error', {
                message: "Something went wrong with OTP generation, please re run the flow",
                status: "400"
              });
            } else { // We got a good response
              // Store the response in session.  It is needed for validation.
              req.session.otpInitResponse = body;
              // Render the OTP challenge page for the user.
              // POST from this page will activate POST method below
              res.render('otp', {
                title: 'Login with the One-Time password',
                hint: hint,
                method: method
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

// POST method will receive the OTP that the user has submitted on the
// challenge page.
router.post('/', function(req, res, _next) {
  console.log("START profile POST Function");

  // If an OTP has been submitted
  if (req.body.otp) {

      // Call CI to validate the submitted OTP value
      // This Response from initation is supplied.  It contains the
      // transaction ID needed for validation.
      ci.validateOTP(req.session.otpInitResponse, req.body.otp).then(body => {

        // If a good response was received
        if (body.messageDescription) {
          // If response message contains "successful"
          if (body.messageDescription.search("successful") != -1) {
            // OTP complete.  Mark session
            req.session.otpcomplete = true;
            // Clean up session data
            delete req.session.otpInitResponse
            if (req.session.afterotp) {
              var url = req.session.afterotp;
              delete req.session.afterotp;
              // Redirect to URL stored in session
              res.redirect('/' + url);

            } else { // OTP was called directly.  Nowhere to return to.
              res.render('error', {
                message: "No return URL available",
                status: "400"
              });
            }
          } else { // Message doesn't contain "successful".  OTP Fail.
            res.render('error', {
              message: "OTP Validation failed",
              status: "400"
            });
          }
        } else { // Bad response from server
          res.render('error', {
            message: "OTP Validation failed",
            status: "500"
          });
        }
      });
  } else {
    res.render('error', { // No OTP was submitted in POST
      message: "OTP not found failed",
      status: "400"
    });
  }
  console.log("END profile POST Function");
});

module.exports = router;
