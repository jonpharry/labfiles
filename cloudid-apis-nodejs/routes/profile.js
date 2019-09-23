const express = require('express');
var router = express.Router();

// Handle GET request to /profile
router.get('/', function(req, res, _next) {
  console.log("START profile GET Function");
  // If session is unauthenticated, redirect to user login
  if (!req.session.authenticated) {
    req.session.afterlogin = "profile";
    res.redirect('/userlogin');
  } else { // user is authenticated

    // If OTP has not been completed in this session, redirect for OTP
    if (!req.session.otpcomplete) {
      req.session.afterotp = "profile";
      res.redirect('/otp');
    } else { // User has performed OTP in this session

      // Hard-coded user information
      var userJson = {
        "userName": req.session.username,
        "emails": [{
          "value": "user@example.com"
        }],
        "phoneNumbers": [{
          "value": "+15551234"
        }]
      }

      // Display Profile page with data extracted from response
      res.render('profile', {
        title: 'User Profile',
        username: userJson.userName,
        email: userJson.emails[0].value,
        mobile: userJson.phoneNumbers[0].value || "Not Provided",
      });
    }
  }
});

module.exports = router;
