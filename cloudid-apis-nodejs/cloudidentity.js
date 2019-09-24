// This module provides Cloud Identity functions

// dotenv is used to read properties from .env file
const dotenv = require('dotenv');

// The OAuth module is used to get an Access Token
const oauth = require('./oauth.js');

// The request-promise-native module is used to make HTTP requests
// Response is a promise (vs a callback)
const requestp = require('request-promise-native');

// Required CI Endpoints
var userEndpoint = '/v2.0/Users';
var otpEndpointEmail = '/v1.0/authnmethods/emailotp/transient/verification';
var otpEndpointSMS = '/v1.0/authnmethods/smsotp/transient/verification';
var passwordEndpoint = '/v2.0/Users/authentication';
var qrEndpoint = '/v2.0/factors/qr/authenticate';

// load contents of .env into process.env
dotenv.config();

// Read CI Tenant URL from properties
var tenant_url = process.env.TENANT_URL;

// Function to lookup user information using userID
// Function returns a Promise which will resolve to the user SCIM data
function getUser(userid) {
  return new Promise(function(resolve, reject) {
    // Get an Access Token
    oauth.getAccessToken().then(tokenData => {
      // Make a request to SCIM endpoint
      requestp({
        url: tenant_url + userEndpoint + '/' + userid,
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + tokenData.access_token
        }
      }).then(body => {
          console.log(body);
          // Return the SCIM response as a JSON object
          resolve(JSON.parse(body));
      }).catch(e => reject(e));
    }).catch(e => reject(e));
  });
}

// Function to generate one time password
// Function returns a Promise which will resolve to CI response body
function generateOTP(login_method, userData) {
  return new Promise(function(resolve, reject) {
    // Get an Access Token
    oauth.getAccessToken().then(tokenData => {
      var otpData;
      var otpEndpoint;

      // If OTP method is e-mail
      if (login_method == "email") {
        // Set OTP Data for e-mail
        otpData = {
          "otpDeliveryEmailAddress": userData
        }
        // Use Email OTP endpoint
        otpEndpoint = otpEndpointEmail;
      } else { //method is SMS
        // Set OTP Data for SMS
        otpData = {
          "otpDeliveryMobileNumber": userData
        }
        // Use SMS OTP Endpoint
        otpEndpoint = otpEndpointSMS;
      }
      // POST to the to the OTP endpoint sending OTP Data
      requestp({
        url: tenant_url + otpEndpoint,
        method: "POST",
        body: otpData,
        json: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + tokenData.access_token
        }
      }).then(body => {
          console.log(body);
          //Resolve Promise to returned body
          resolve(body);
      }).catch(e => reject(e));
    }).catch(e => reject(e));
  });
}

// Function to validate OTP
// It returns a Promise which resolves to the CI Response body
// It needs the response from initate call which contains method
// and the transaction ID
function validateOTP(otpInitResponse, otp) {
  return new Promise(function(resolve, reject) {
    // Get an Access Token
    oauth.getAccessToken().then(tokenData => {
      // Build POST Data
      var postData = {
        "otp": otp
      }

      //Set the OTP Endpoint to SMS or E-mail based on methodType
      var otpEndpoint;
      if (otpInitResponse.methodType == "smsotp") {
        otpEndpoint = otpEndpointSMS;
      } else {
        otpEndpoint = otpEndpointEmail;
      }

      // Make call to the REST endpoint for the transaction
      // Pass in the OTP that was received
      requestp({
        url: tenant_url + otpEndpoint + '/' + otpInitResponse.id,
        method: "POST",
        body: JSON.stringify(postData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + tokenData.access_token
        }
      }).then(body => {
          console.log(body);
          // Resolve the Promise to the response body.
          resolve(JSON.parse(body));
      }).catch(e => reject(e));
    }).catch(e => reject(e));
  });
}

// Function to initiate QRLogin
// Returns a Promise which resolves to the CI Response Body
// Input is the Verify Registration Id
function initiateQRLogin(regId) {
  return new Promise(function(resolve, reject) {
    // Get an Access Token
    oauth.getAccessToken().then(tokenData => {
      //Make a call to initate QR Code Login
      requestp({
        url: tenant_url + qrEndpoint + '?profileId=' + regId,
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + tokenData.access_token
        }
      }).then(body => {
          console.log(body);
          // Resolve Promise to the response body
          resolve(JSON.parse(body));
      }).catch(e => reject(e));
    }).catch(e => reject(e));
  });
}

// Function to validate QRLogin
// Returns a Promise which resolves to the CI Response Body
// Takes the response from the initiation which contains transaction ID
// and DSI
function validateQRLogin(qrInitResponse) {
  return new Promise(function(resolve, reject) {
    // Get an Access Token
    oauth.getAccessToken().then(tokenData => {
      // Extract tranaction ID and DSI from input data
      qr_id = qrInitResponse.id;
      qr_dsi = qrInitResponse.dsi;
      // Make a call to transaction endpoint passing in DSI
      requestp({
        url: tenant_url + qrEndpoint + '/' + qr_id + '?dsi=' + qr_dsi,
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        }
      }).then(body => {
          console.log(body);
          //Resolve Promise to the response body
          resolve(JSON.parse(body));
      }).catch(e => reject(e));
    }).catch(e => reject(e));
  });
}

// Function to check user password (and get user information)
// This function returns a Promise which resolves to the response from CI
// It takes uid and pw to be checked against CI Cloud Directory
function passwordLogin(uid, pw) {
  return new Promise(function(resolve, reject) {
    // Get an Access Token
    oauth.getAccessToken().then(tokenData => {
      // Built the request POST Data for the call to CI
      var postData = {
        "userName": uid,
        "password": pw,
        "schemas": ["urn:ietf:params:scim:schemas:ibm:core:2.0:AuthenticateUser"]
      }
      // Make call to CI Password endpoint
      // The returnUserRecord=true means user data is returned if login
      // is successful.
      requestp({
        url: tenant_url + passwordEndpoint + '?returnUserRecord=true',
        method: "POST",
        body: JSON.stringify(postData),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + tokenData.access_token
        }
      }).then(body => {
        console.log(body);
        // Resolve Promise to the response from CI
        // This will contain user data if login was successful
        resolve(JSON.parse(body));
      }).catch(e => reject(e));
    }).catch(e => reject(e));
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
