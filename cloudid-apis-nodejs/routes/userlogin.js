const express = require('express');

const https = require('https');
const request = require('request');
const fs = require('fs')
const users_data = '';
const dotenv = require('dotenv');

var app = express();
var router = express.Router();

//Required Endpoints
var passwordEndpoint = '/v2.0/Users/authentication';

// load contents of .env into process.env
dotenv.config();

var tenant_url =  process.env.TENANT_URL;

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
    }, function(error, response, body) {
      if (error) {
        reject(error);
      } else {
        console.log(body);
        resolve(JSON.parse(body));
      }
    });
  });
}

router.get('/', function(req, res, next) {
  res.render('userlogin', {
    title: 'Login'
  });
});


router.post('/', function(req, res, next) {
  if (req.body.username && req.body.password) {

    //Retrieve access_token from the file, access_token.json
    var storedToken = fs.readFileSync('access_token.json');
    var token = JSON.parse(storedToken)["access_token"];
    console.log("Stored Access Token : " + token)

    access_token = token;

    var initializeLoginPromise = passwordLogin(access_token, req.body.username, req.body.password);
    initializeLoginPromise.then(function(body) {
        var userId = body.id;
        var displayName = body.displayName;
        if (!(userId)) {
          res.render('error', {
            message: "Something went wrong",
            status: "400"
          });
        } else {
          res.render('bank', {
            title: 'Bank Operation',
            displayName: displayName,
            balance: '100',
            userid: userId
          });
        }
      },
      function(err) {
        res.render('error', {
          message: "Something went wrong",
          status: "400"
        });
        console.log(err);
      });
    /*
    // Read the user configuration from users.json and convert it to JSON
    users_data = JSON.parse(fs.readFileSync('users.json'));
    var found = false;
    for (var i = 0; i < users_data["users"].length; i++) {
      if (users_data["users"][i]["username"] == req.body.username && users_data["users"][i]["password"] == req.body.password) {
        found = true;
        //Retrieve the bank balance of the current user
        res.render('bank', {
          title: 'Bank Operation',
          balance: users_data["users"][i]["balance"],
          user: users_data["users"][i]["username"]
        });
        break;
      }
    }
    if (!(found)) {
      res.render('error', {
        message: "Invalid username password, try again",
        status: "400"
      });
    }
    */

  } else {
    console.log("Username and password should be provided");
    res.render('error', {
      message: "Both username password should be provided, try again",
      status: "400"
    });
  }
});

module.exports = router;
