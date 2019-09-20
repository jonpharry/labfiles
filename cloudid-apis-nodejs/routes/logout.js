const express = require('express');
var router = express.Router();

/* Perform Logout */
router.get('/', function(req, res, _next) {
  console.log("Perform Logout");
  req.session.authenticated = false;
  delete req.session.displayName;
  delete req.session.userId;
  delete req.session.username;
  delete req.session.otpcomplete;
  res.redirect('/');
  });

module.exports = router;
