const express = require('express');
var router = express.Router();

// GET function is called to initiate OTP
router.get('/', function(req, res, _next) {

  console.log("START OTP GET Function");

  // Check user is authenticated.  Redirect to user login if not.
  if (!req.session.authenticated) {
    req.session.afterlogin = "otp";
    res.redirect('/userlogin');
  } else { // User is authenticated

    // Get user from session
    var userJson = req.session.user;

    // Extract e-mail address from userJson
    var destination = userJson.emails[0].value;
    var method = "email";

    // Extract mobile number from userJson
    var mobileNo = userJson.phoneNumbers[0].value;

    // If mobile number defined, prefer this for OTP
    if (mobileNo) {
      method = "mobile";
      destination = mobileNo;
    }

    // Hard-coded hint
    var hint = "1234";

    res.render('otp', {
      title: 'Login with the One-Time password',
      hint: hint,
      method: method
    });
  }

  console.log("END profile GET Function");
});

// POST method will receive the OTP that the user has submitted on the
// challenge page.
router.post('/', function(req, res, _next) {
  console.log("START profile POST Function");

  // If an OTP has been submitted
  if (req.body.otp) {

    // Need to check OTP is valid here

    req.session.otpcomplete = true;
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
  } else {
    res.render('error', { // No OTP was submitted in POST
      message: "OTP not found failed",
      status: "400"
    });
  }
  console.log("END profile POST Function");
});

module.exports = router;
