const express = require('express');
var router = express.Router();

const dotenv = require('dotenv');

// load contents of .env into process.env
dotenv.config();

/* GET home page. */
router.get('/', function(req, res, _next) {
  console.log("Logout");
  req.session.authenticated = false;
  delete req.session.displayName;
  delete req.session.userId;
  delete req.session.username;
  delete req.session.otpcomplete;
  res.redirect('/');
  });

module.exports = router;
