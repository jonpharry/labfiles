const express = require('express');

const request = require('request');
const dotenv = require('dotenv');
const oauth = require('../oauth.js');

var app = express();
var router = express.Router();

//Required Endpoints
var passwordEndpoint = '/v2.0/Users/authentication';

// load contents of .env into process.env
dotenv.config();

var tenant_url = process.env.TENANT_URL;

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

router.get('/', function(_req, res, _next) {
  res.render('userlogin', {
    title: 'Login'
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
            res.redirect('/userhome');
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
