const dotenv = require('dotenv');
const oauth = require('./oauth.js');
const request = require('request');

//Required Endpoints
var userEndpoint = '/v2.0/Users';
var otpVerifyEndpoint = '/v1.0/authnmethods/emailotp/transient/verification';
var otpVerifyEndpointSMS = '/v1.0/authnmethods/smsotp/transient/verification';
var passwordEndpoint = '/v2.0/Users/authentication';
var qrEndpoint = '/v2.0/factors/qr/authenticate';

// load contents of .env into process.env
dotenv.config();

var tenant_url = process.env.TENANT_URL;

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

//Function to generate one time password
function generateOTP(access_token, login_method, userData) {
  return new Promise(function(resolve, reject) {
    var otpData;
    var otpEndpoint;
    if (login_method == "email") {
      otpData = {
        "otpDeliveryEmailAddress": userData
      }
      otpEndpoint = otpVerifyEndpoint;
    } else {
      otpData = {
        "otpDeliveryMobileNumber": userData
      }
      otpEndpoint = otpVerifyEndpointSMS;
    }
    request({
      url: tenant_url + otpEndpoint,
      method: "POST",
      body: otpData,
      json: true,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + access_token
      }
    }, function(error, _response, body) {
      if (error) {
        reject(error);
      } else {
        console.log(body);
        resolve(body);
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

module.exports = {
  getUser: getUser,
  generateOTP: generateOTP,
  initiateQRLogin: initiateQRLogin,
  validateQRLogin: validateQRLogin,
  passwordLogin: passwordLogin
};
