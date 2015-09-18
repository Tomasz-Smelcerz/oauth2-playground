var express = require('express');
var oauth = require('oauthio');
var request = require('request');

// -> JUNK BEGINS
var csrf = require('csurf');
var cookieParser = require('cookie-parser');
var session = require('express-session')
// <- JUNK ENDS

var app = express();

var provider = "google";

initializeJunk();

app.get('/oauth/redirect', oauth.redirect(function(result, req, res) {
  console.log(result.access_token);
  requestUserInfo(result.access_token);
}));


app.get('/signin', oauth.auth(provider, 'http://localhost:8080/oauth/redirect'));

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Oauth.io app is listening at http://%s:%s', host, port);
});



//Initialize SDK
oauth.initialize('junk', 'junk');


function requestUserInfo(accessToken) {
  var options = {
    url: 'https://www.googleapis.com/userinfo/v2/me',
    headers: {
      'Authorization': "Bearer " + accessToken
    }
  };

  var callback = function (error, response, body) {
    if (error) {
      console.log('ERROR: ' + error);
    }

    if (!error && response.statusCode == 200) {
      console.log(body) // Show the HTML for the Google homepage. 
    }

    console.log(response.status);
  }

  request(options, callback); 
}




function initializeJunk() {
    app.use(cookieParser());
    app.use(session({secret: 'vim rulez!'}))
    app.use(csrf());
    app.use(function(req, res, next) {
        res.cookie('XSRF-TOKEN', req.csrfToken());
        next();
    });
}
