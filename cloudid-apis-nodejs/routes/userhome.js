const express = require('express');

var router = express.Router();

router.get('/', function(req, res, _next) {

  if (!req.session.authenticated) {
    req.session.afterlogin="userhome";
    res.redirect('/userlogin');
  } else {
    res.render('userhome', {
      title: 'User Homepage',
      displayName: req.session.displayName,
      balance: '100',
      userid: req.session.userId
    });
  }
});

module.exports = router;
