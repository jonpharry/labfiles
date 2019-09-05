const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const OAuthContext = require('ibm-verify-sdk').OAuthContext;
const AuthenticatorContext = require('ibm-verify-sdk').AuthenticatorContext;

const https = require('https');
const request = require('request');
const fs = require('fs');
const dotenv = require('dotenv');

const index = require('./routes/index');
const users = require('./routes/userlogin');
const userlogin = require('./routes/userlogin');
const profile = require('./routes/profile');

var app = express();

// load contents of .env into process.env
dotenv.config();

let apiClientConfig = {
  tenantUrl: process.env.TENANT_URL,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  flowType: 'client_credentials',
  scope: 'none'
};

let authClient = new OAuthContext(apiClientConfig);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/userlogin', userlogin);
app.use('/profile', profile);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//Retrieve access_token from the file, access_token.json
var storedToken = null;
try {storedToken = fs.readFileSync('access_token.json')} catch {};

if (storedToken != null) {
  console.log("Loaded token : " + storedToken);
token = JSON.parse(storedToken);
authClient.introspectToken(token).then(r => {
  var active = r.response.active == true;
  if (!active) {
    console.log("Token expired; getting new token");
    authClient.getToken('foo').then(generated_token => {
      console.log("response : " + JSON.stringify(generated_token));
      //Once a new access token is generated, store it in the repository

      fs.writeFile('access_token.json', JSON.stringify(generated_token), function(err, _result) {
        if (err) console.log('error', err);
      });
    });
  } else { console.log("Token is valid")}
})
} else {
  console.log("Getting new token");
  authClient.getToken('foo').then(generated_token => {
    console.log("response : " + JSON.stringify(generated_token));
    //Once a new access token is generated, store it in the repository

    fs.writeFile('access_token.json', JSON.stringify(generated_token), function(err, _result) {
      if (err) console.log('error', err);
    });
  });
}


module.exports = app;
