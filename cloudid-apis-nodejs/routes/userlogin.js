const express = require('express');

const dotenv = require('dotenv');
const ci = require('../cloudidentity.js');

var router = express.Router();

// load contents of .env into process.env
dotenv.config();

var reg_id = process.env.VERIFY_REG_ID;

router.get('/', function(req, res, _next) {
    ci.initiateQRLogin(reg_id).then((qrTxn) => {
      req.session.qrtxn = qrTxn;
      res.render('userlogin', {
        title: 'Login',
        qrCode: qrTxn.qrCode
      });
    });
});

router.get('/check', function(req, res, _next) {
  console.log("Authenticated: " + req.session.authenticated);
    ci.validateQRLogin(req.session.qrtxn).then((body) => {
      if (body.state) {
        if (body.state == "SUCCESS") {
          req.session.authenticated = true;
          delete req.session.qrtxn
          req.session.userId = body.userId;
          ci.getUser(req.session.userId).then((user) => {
            req.session.username = user.userName;
            if (user.displayName) {
              req.session.displayName = user.displayName;
            } else {
              req.session.displayName = user.userName;
            }
            if (req.session.afterlogin) {
              url = req.session.afterlogin;
              delete req.session.afterlogin;
            } else {
              url = "userhome";
            }
            res.json({
              "state": body.state,
              "next": url
            });
          });
        } else {
          res.json({
            "state": body.state
          });
        }
      } else {
        res.json({
          "state": "error"
        });
      }
    });
});

router.post('/', function(req, res, _next) {
  if (req.body.username && req.body.password) {
      ci.passwordLogin(req.body.username, req.body.password).then((body) => {
          req.session.userId = body.id;
          if (!(req.session.userId)) {
            res.render('error', {
              message: "Something went wrong",
              status: "400"
            });
          } else {
            req.session.authenticated = true
            req.session.username = body.userName;
            if (body.displayName) {
              req.session.displayName = body.displayName;
            } else {
              req.session.displayName = body.userName;
            }
            if (req.session.afterlogin) {
              var url = req.session.afterlogin;
              delete req.session.afterlogin;
              delete req.session.qrtxn;
              res.redirect('/' + url);
            } else {
              res.redirect('/userhome');
            }
          }
        },
        function(err) {
          res.render('error', {
            message: "Something went wrong",
            status: "400"
          });
          console.log(err);
        });
  } else {
    console.log("Username and password should be provided");
    res.render('error', {
      message: "Both username password should be provided, try again",
      status: "400"
    });
  }
});

module.exports = router;
