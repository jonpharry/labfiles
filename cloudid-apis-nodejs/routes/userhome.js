const express = require('express');
var router = express.Router();

router.get('/', function(req, res, _next) {

  // If session is not authenticated, redirect to login page
  if (!req.session.authenticated) {
    req.session.afterlogin="userhome";
    res.redirect('/userlogin');
  } else { // session is authenticated

    // Display Home Page
    res.render('userhome', {
      title: 'User Homepage',
      displayName: req.session.user.name.formatted,
      userid: req.session.userId
    });
  }
});

module.exports = router;
