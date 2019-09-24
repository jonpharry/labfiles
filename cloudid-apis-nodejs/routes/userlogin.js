const express = require('express');
var router = express.Router();

// dotenv is used to read properties from .env file
const dotenv = require('dotenv');

// load contents of .env into process.env
dotenv.config();

// Handle GET request for login page
router.get('/', function(req, res, _next) {
    // Render the login page.
    res.render('userlogin', {
      title: 'Login',
    });
  });

// Handle POST to /userlogin/pwdcheck
// This is where username/password is submitted for validation
router.post('/pwdcheck', function(req, res, _next) {

  // Check both username and password fields are available
  if (req.body.username && req.body.password) {

      // Need to Check Username and Password here

      // Hard-coded user information
      var userJson = {
        "id": "12345",
        "userName": "fixeduser",
        "name": {"formatted": "Fixed User"},
        "emails": [{
          "value": "user@example.com"
        }],
        "phoneNumbers": [{
          "value": "+15551234"
        }]
      }

      req.session.userId = userJson.id;

      // If userId in session not populated (authentication failed)
      if (!(req.session.userId)) {
        // Return an error page
        res.render('error', {
          message: "Something went wrong",
          status: "400"
        });
      } else { // Authentication was successful.
        // Mark session authenticated
        req.session.authenticated = true
        // Populate user in session
        req.session.user= userJson;

        // If a post-authentication target available in session
        if (req.session.afterlogin) {
          // set url variable with this target
          var url = req.session.afterlogin;
          // clean up data in session
          delete req.session.afterlogin;
          // Redirect to the target URL
          res.redirect('/' + url);
        } else { // No target available in session
          // Redirect to user home page
          res.redirect('/userhome');
        }
      }
  } else { // username and/or password missing from POST body
    console.log("Username and password should be provided");
    res.render('error', {
      message: "Both username password should be provided, try again",
      status: "400"
    });
  }
});

module.exports = router;
