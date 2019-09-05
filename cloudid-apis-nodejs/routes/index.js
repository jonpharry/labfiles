var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("Display index page");
  res.render('index', {
   title: 'Express'
  });
});

router.get('/userlogin', function(req, res, next) {
  res.render('userlogin', {
    title: 'User Login'
  });
});
module.exports = router;
