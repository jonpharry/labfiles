const express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(_req, res, _next) {
  console.log("Display index page");
  res.render('index', {
   title: 'CI API Demo'
  });
});

module.exports = router;
