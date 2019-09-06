const OAuthContext = require('ibm-verify-sdk').OAuthContext;
//const AuthenticatorContext = require('ibm-verify-sdk').AuthenticatorContext;

const fs = require('fs');
const dotenv = require('dotenv');

// load contents of .env into process.env
dotenv.config();

var apiClientConfig = {
  tenantUrl: process.env.TENANT_URL,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  flowType: 'client_credentials',
  scope: 'none'
};

var storedToken = null;
var authClient = new OAuthContext(apiClientConfig);
var date = new Date();

function getAccessToken() {
  return new Promise((resolve, _reject) => {

    if (storedToken) {
      if (storedToken.expirytime > date.getTime() + 30000) {
				console.log("Token in memory is good");
        resolve(storedToken);
      } else {
				console.log("Token in memory is bad");
        callTokenEndpoint().then((token) => resolve(token))
      }
    } else {
			var stringToken=null
      try {
        stringToken = fs.readFileSync('access_token.json')
      } catch {};
      if (stringToken) {
        console.log("Loaded token : " + stringToken);
        storedToken = JSON.parse(stringToken);
				if (storedToken.expirytime > date.getTime() + 30000) {
					console.log("Loaded token lifetime is good");
				  authClient.introspectToken(storedToken).then(r => {
          if (r.response.active == true) {
						console.log("Token is active");
            resolve(storedToken);
          } else {
		  			console.log("Token expired");
            callTokenEndpoint().then((token) => resolve(token));
          }
        });
			} else {
				console.log("Loaded token lifefime is bad");
				callTokenEndpoint().then((token) => resolve(token))
			}
		} else {
				console.log("No stored token");
        callTokenEndpoint().then((token) => resolve(token));
      }
    }
  });
}

function callTokenEndpoint() {
  return new Promise((resolve, _reject) => {
    console.log("Getting new token");
    authClient.getToken('foo').then(generated_token => {

      //Store expiry time with token data
      generated_token.expirytime = date.getTime() + (generated_token.expires_in * 1000);

      console.log("response : " + JSON.stringify(generated_token));

      //Once a new access token is generated, store it in the repository
      fs.writeFile('access_token.json', JSON.stringify(generated_token), function(err, _result) {
        if (err) console.log('error', err);
      });
      storedToken = generated_token;
      resolve(generated_token);
    });
  });
}

module.exports = {
	getAccessToken : getAccessToken
};
