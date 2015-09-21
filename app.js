var express = require('express');
var oauth = require('oauthio');
var request = require('request');
var googleIdToken = require('google-id-token');

// -> JUNK BEGINS
var csrf = require('csurf');
var cookieParser = require('cookie-parser');
var session = require('express-session')
// <- JUNK ENDS

var app = express();
app.set('view engine', 'jade');

var provider = "google";
var idTokenParser = new googleIdToken({ getKeys: getGoogleCerts });
initializeJunk();

// MAPPINGS

app.get('/', function(req, res) {
  res.render('index', { pageTitle: 'OAuth2 playground' });
});


app.get('/signin', oauth.auth(provider, 'http://localhost:8080/oauth/redirect'));

app.get('/oauth/redirect', oauth.redirect(function(result, req, res) {
  
  idTokenParser.decode(result['id_token'], function(err, token) {
    if(err) {
        console.log("error while parsing the google token: " + err);
    } else {
      //console.log("parsed id_token is:\n" + JSON.stringify(token));
      //result['id_token_parsed'] = token;
      //res.json(result);
      res.render('index', { pageTitle: 'OAuth2 playground', accessToken: result.access_token, idToken: result.id_token, idTokenParsed: token });
      console.log(result);
      console.log("----------------------------------------");
    }
  });

}));


app.get('/profile', function(req, res) {
  var access_token = req.query.accessToken;
  var userProfile = requestUserInfo(access_token, function(profile) {
    console.log(profile);
    res.send(profile);
  });
});


var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Oauth.io app is listening at http://%s:%s', host, port);
});



//Initialize SDK
oauth.initialize('gpjHQaNdJeWffGwd8p295CgBaHw', 'UYp8wERemP7AuPlCoce7l1DNxao');


function requestUserInfo(accessToken, next) {
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
      next(body);
    }
  }

  request(options, callback); 
}


function getGoogleCerts(kid, callback) {
    request({uri: 'https://www.googleapis.com/oauth2/v1/certs'}, function(err, response, body) {
        if(err && response.statusCode !== 200) {
            err = err || "error while retrieving the google certs";
            console.log(err);
            callback(err, {});
        } else {
            var keys = JSON.parse(body);
            callback(null, keys[kid]);
        }
    });
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
