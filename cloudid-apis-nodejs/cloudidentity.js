const dotenv = require('dotenv');
const oauth = require('./oauth.js');
const request = require('request');

//Required Endpoints
var userEndpoint = '/v2.0/Users';
var otpEndpointEmail = '/v1.0/authnmethods/emailotp/transient/verification';
var otpEndpointSMS = '/v1.0/authnmethods/smsotp/transient/verification';
var passwordEndpoint = '/v2.0/Users/authentication';
var qrEndpoint = '/v2.0/factors/qr/authenticate';

// load contents of .env into process.env
dotenv.config();

var tenant_url = process.env.TENANT_URL;

//Function to lookup user from userID
function getUser(userid) {
  return new Promise(function(resolve, reject) {
            oauth.getAccessToken().then(tokenData => {
    request({
      url: tenant_url + userEndpoint + '/' + userid,
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + tokenData.access_token
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
  });
}

//Function to generate one time password
function generateOTP(login_method, userData) {
  return new Promise(function(resolve, reject) {
            oauth.getAccessToken().then(tokenData => {
    var otpData;
    var otpEndpoint;
    if (login_method == "email") {
      otpData = {
        "otpDeliveryEmailAddress": userData
      }
      otpEndpoint = otpEndpointEmail;
    } else {
      otpData = {
        "otpDeliveryMobileNumber": userData
      }
      otpEndpoint = otpEndpointSMS;
    }
    request({
      url: tenant_url + otpEndpoint,
      method: "POST",
      body: otpData,
      json: true,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + tokenData.access_token
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
});
}

//Function to validate OTP
function validateOTP(otpInitResponse, otp) {
  return new Promise(function(resolve, reject) {
            oauth.getAccessToken().then(tokenData => {
    var postData = {
      "otp": otp
    }
    var otpEndpoint;
    if (otpInitResponse.methodType == "smsotp") {
      otpEndpoint = otpEndpointSMS;
    } else {
      otpEndpoint = otpEndpointEmail;
    }
    request({
      url: tenant_url + otpEndpoint + '/' + otpInitResponse.id,
      method: "POST",
      body: JSON.stringify(postData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + tokenData.access_token
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
});
}

//Function to initiate QRLogin
function initiateQRLogin(regId) {
  return new Promise(function(resolve, reject) {
            oauth.getAccessToken().then(tokenData => {
    request({
      url: tenant_url + qrEndpoint + '?profileId=' + regId,
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + tokenData.access_token
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
});
}

//Function to validate QRLogin
function validateQRLogin(qrInitResponse) {
  return new Promise(function(resolve, reject) {
        oauth.getAccessToken().then(tokenData => {
    qr_id = qrInitResponse.id;
    qr_dsi = qrInitResponse.dsi;
    request({
      url: tenant_url + qrEndpoint + '/' + qr_id + '?dsi=' + qr_dsi,
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + tokenData.access_token
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
    });
}

//Function to check user password and get user
function passwordLogin(uid, pw) {
  return new Promise(function(resolve, reject) {
    oauth.getAccessToken().then(tokenData => {
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
        'Authorization': 'Bearer ' + tokenData.access_token
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
  });
}

module.exports = {
  getUser: getUser,
  generateOTP: generateOTP,
  validateOTP: validateOTP,
  initiateQRLogin: initiateQRLogin,
  validateQRLogin: validateQRLogin,
  passwordLogin: passwordLogin
};
