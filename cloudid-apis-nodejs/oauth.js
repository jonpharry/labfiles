// This module provides a function for obtaining an
// Access Token from Cloud Identity using client credentials

// Using IBM Verify SDK to get OAuth functions
// These could easily be written natively if preferred
const OAuthContext = require('ibm-verify-sdk').OAuthContext;

// fs is used for filesystem access
const fs = require('fs');

// dotenv loads configuration from .env file
const dotenv = require('dotenv');
dotenv.config();

// Setup configuration for Verify SDK API Client
// Initialised for client credentials flow
// Tenant URL, Client ID, and Client Secret come from .env file
var apiClientConfig = {
  tenantUrl: process.env.TENANT_URL,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  flowType: 'client_credentials',
  scope: 'none'
};

// Initialize an OAuth Client helper
var authClient = new OAuthContext(apiClientConfig);

// Initialize a Date helper
var date = new Date();

// Define global variable to store token data
var storedToken = null;

// Function which gets a new Access Token from CI
// Uses IBM Verify SDK Helper
function callTokenEndpoint() {
  return new Promise((resolve, _reject) => {
    console.log("Getting new token");
    // Call the SDK Auth Client to get a token
    // Requires one input so send dummy value
    authClient.getToken('foo').then(generated_token => {

      // Add absolute expiry time to the token data
      // Calculated from current time and expires_in
      generated_token.expirytime = date.getTime() + (generated_token.expires_in * 1000);

      console.log("response : " + JSON.stringify(generated_token));

      // Persist the token information on filesystem
      fs.writeFile('access_token.json', JSON.stringify(generated_token), function(err, _result) {
        if (err) console.log('error', err);
      });

      // Store the token in global variable and resolve Promise
      storedToken = generated_token;
      resolve(generated_token);
    });
  });
}

// Function to get an Access Token from Cloud Identity
// The token is only retrieved if current stored token has expired
function getAccessToken() {
  return new Promise((resolve, _reject) => {

    // If stored token exists
    if (storedToken) {
      // If stored token is good for at least 30 seconds...
      if (storedToken.expirytime > date.getTime() + 30000) {
        console.log("Token in memory is good");
        // Resolve Promise with stored token
        resolve(storedToken);
      } else { // Stored token is no good
        console.log("Token in memory is bad");
        // Get a new token and resolve Promise with that
        callTokenEndpoint().then((token) => resolve(token))
      }
    } else { // No stored token exists
      var stringToken = null
      try { //Attempt to read token data from file
        stringToken = fs.readFileSync('access_token.json')
      } catch {}; //Do nothing on failure
      // If a token was read from file
      if (stringToken) {
        console.log("Loaded token : " + stringToken);
        // Parse file contents and store in global variable
        storedToken = JSON.parse(stringToken);

        // If token is good for at least 30 seconds
        if (storedToken.expirytime > date.getTime() + 30000) {
          console.log("Loaded token lifetime is good");

          // Run an introspection to make sure it is really OK
          authClient.introspectToken(storedToken).then(r => {

            // If introspection returns active then return this token
            if (r.response.active == true) {
              console.log("Token is active");
              resolve(storedToken);
            } else { // If token is not active
              console.log("Token expired");
              // Get a new token and return that one.
              callTokenEndpoint().then((token) => resolve(token));
            }
          });
        } else { // Token has expired
          console.log("Loaded token lifefime is bad");
          // Get a new token and return that one.
          callTokenEndpoint().then((token) => resolve(token))
        }
      } else {  // If no stored token
        console.log("No stored token");
        // Get a new token and return that one.
        callTokenEndpoint().then((token) => resolve(token));
      }
    }
  });
}

module.exports = {
  getAccessToken: getAccessToken
};
