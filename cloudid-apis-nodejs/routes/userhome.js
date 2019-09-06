const express = require('express');

var app = express();
var router = express.Router();

router.get('/', function(req, res, _next) {

  if (!req.session.authenticated) {
    res.redirect('/userlogin');
  } else {
    res.render('bank', {
      title: 'User Homepage',
      displayName: req.session.displayName,
      balance: '100',
      userid: req.session.userId
    });
  }
});

module.exports = router;
