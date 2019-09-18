const express = require('express');

const request = require('request');
const dotenv = require('dotenv');
const oauth = require('../oauth.js');

var app = express();
var router = express.Router();

//Required Endpoints
var passwordEndpoint = '/v2.0/Users/authentication';
var qrEndpoint = '/v2.0/factors/qr/authenticate';
var userEndpoint = '/v2.0/Users';

// load contents of .env into process.env
dotenv.config();

var tenant_url = process.env.TENANT_URL;
var reg_id = process.env.VERIFY_REG_ID;

//Function to lookup user from userID
function getUser(access_token, userid) {
  return new Promise(function(resolve, reject) {
    request({
      url: tenant_url + userEndpoint + '/' + userid,
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    }, function(error, _response, body) {
      if (error) {
        reject(error);
      } else {
        console.log(body);
        resolve(JSON.parse(body));
      }
    });
  });
}

//Function to initiate QRLogin
function initiateQRLogin(access_token, regId) {
  return new Promise(function(resolve, reject) {
    request({
      url: tenant_url + qrEndpoint + '?profileId=' + regId,
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    }, function(error, _response, body) {
      if (error) {
        reject(error);
      } else {
        console.log(body);
        resolve(JSON.parse(body));
      }
    });
  });
}

//Function to validate QRLogin
function validateQRLogin(access_token, qrInitResponse) {
  return new Promise(function(resolve, reject) {
    qr_id = qrInitResponse.id;
    qr_dsi = qrInitResponse.dsi;
    request({
      url: tenant_url + qrEndpoint + '/' + qr_id + '?dsi=' + qr_dsi,
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    }, function(error, _response, body) {
      if (error) {
        reject(error);
      } else {
        console.log(body);
        resolve(JSON.parse(body));
      }
    });
  });
}

//Function to check user password and get userID
function passwordLogin(access_token, uid, pw) {
  return new Promise(function(resolve, reject) {
    var postData = {
      "userName": uid,
      "password": pw,
      "schemas": ["urn:ietf:params:scim:schemas:ibm:core:2.0:AuthenticateUser"]
    }
    request({
      url: tenant_url + passwordEndpoint + '?returnUserRecord=true',
      method: "POST",
      body: JSON.stringify(postData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    }, function(error, _response, body) {
      if (error) {
        reject(error);
      } else {
        console.log(body);
        resolve(JSON.parse(body));
      }
    });
  });
}

router.get('/', function(req, res, _next) {
  oauth.getAccessToken().then((tokenData) => {
    initiateQRLogin(tokenData.access_token, reg_id).then((qrTxn) => {
      req.session.qrtxn = qrTxn;
      res.render('userlogin', {
        title: 'Login',
        qrCode: qrTxn.qrCode
      });
    });
  });
});

router.get('/check', function(req, res, _next) {
  console.log("Authenticated: " + req.session.authenticated);
  oauth.getAccessToken().then((tokenData) => {
    validateQRLogin(tokenData.access_token, req.session.qrtxn).then((body) => {
      if (body.state) {
        if (body.state == "SUCCESS") {
          req.session.authenticated = true;
          req.session.userId = body.userId;
          getUser(tokenData.access_token, req.session.userId).then((user) => {
            req.session.username = user.userName;
            if (user.displayName) {
              req.session.displayName = user.displayName;
            } else {
              req.session.displayName = user.userName;
            }
            if (!req.session.afterlogin) {
              req.session.afterlogin = "userhome";
            }
            res.json({
              "state": body.state,
              "next": req.session.afterlogin
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
});

router.post('/', function(req, res, _next) {
  if (req.body.username && req.body.password) {
    oauth.getAccessToken().then((tokenData) => {
      passwordLogin(tokenData.access_token, req.body.username, req.body.password).then((body) => {
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
              res.redirect('/' + req.session.afterlogin);
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
