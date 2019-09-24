// Handle GET request for /userlogin/qrcheck
// This endpoint is intended to be accessed by client-side JavaScript
// on the login page which polls to see if QRLogin has been completed
router.get('/qrcheck', function(req, res, _next) {

  // Call QRLogin validation function.
  // Pass in the response from initation which includes transaction id
  // and DSI needed for the validation check.
  ci.validateQRLogin(req.session.qrtxn).then((body) => {
    // Check if response contains state parameter
    if (body.state) {
      // If state is "SUCCESS" it means QRLogin has completed
      if (body.state == "SUCCESS") {
        // Mark the session as authenticated
        req.session.authenticated = true;
        // Clean up data from session
        delete req.session.qrtxn
        // Save userId of user identified by QRCode Login
        req.session.userId = body.userId;

        // Call getUser function to get user information
        ci.getUser(req.session.userId).then((user) => {
          // Add user to session
          req.session.user = user;

          // If a post-authentication target is set in session
          if (req.session.afterlogin) {
            // set url to this value and clean from session
            url = req.session.afterlogin;
            delete req.session.afterlogin;
          } else { // no target in session
            // set url to userhome
            url = "userhome";
          }
          // Respond to caller with SUCCESS
          // Also provide indication of post-authentication target
          res.json({
            "state": "SUCCESS",
            "next": url
          });
        });
      } else { // state is not SUCCESS
        // Return the state to the caller
        res.json({
          "state": body.state
        });
      }
    } else { // bad response
      // return error state to the caller
      res.json({
        "state": "error"
      });
    }
  });
});
