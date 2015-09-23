var express = require('express');
var request = require('request');

var app = express();
app.set('view engine', 'jade');


var view = 'github';
var clientId = '2f8b38e00ee043208fb6';
var clientSecret = '01fdb329982b9568503a3c2fb287ef4c8313c3a0';
var redirectUri = 'http://localhost:8080/code';
var state = 'notGoodOne';
var scope = 'repo';


// MAPPINGS

app.get('/', function(req, res) {
  res.render(view, {'clientId': clientId, 'clientSecret': clientSecret, 'redirectUri': redirectUri, 'state': state});
});

app.get('/code', function(req, res) {
  var authorizationCode = req.query.code;
  res.render(view, {'clientId': clientId, 'clientSecret': clientSecret, 'redirectUri': redirectUri, 'state': state, 'authorizationCode': authorizationCode});
});

app.get('/accessToken', function(req, res) {
  var authorizationCode = req.query.authorizationCode;
  console.log(authorizationCode);
  requestAccessToken(authorizationCode, function(body) {
    console.log(body); 
    var accessToken = extractAccessToken(body);
    
    res.render(view, {'clientId': clientId, 'clientSecret': clientSecret, 'redirectUri': redirectUri, 'state': state, 'authorizationCode': authorizationCode, 'accessToken': accessToken});
  });
});


app.get('/createRepository', function(req, res) {
  var repositoryName = req.query.repositoryName;
  var accessToken = req.query.accessToken;
  var authorizationCode = req.query.authorizationCode;
 
  createNewRepository(repositoryName, accessToken, function(body) {

    console.log(body);

    var result = JSON.stringify(body);
     
    res.render(view, {'clientId': clientId, 'clientSecret': clientSecret, 'redirectUri': redirectUri, 'state': state, 'authorizationCode': authorizationCode, 'accessToken': accessToken, 'result': result});
  });

});


//App bootstrap

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('The app is listening at http://%s:%s', host, port);
});


//Helper functions

function requestAccessToken(authorizationCode, next) {

  var options = {
    url: 'https://github.com/login/oauth/access_token',
    form: {
      client_id: clientId,
      client_secret: clientSecret,
      code: authorizationCode,
      redirect_uri: redirectUri,
      'state': state
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


function createNewRepository(repositoryName, accessToken, next) {
/*
curl -X POST 'https://api.github.com/user/repos' -d '{ "name": "TestRepository1", "description": "This is your first repository", "homepage": "https://github.com", "private": false, "has_issues": true, "has_wiki": true, "has_downloads": true }' -H "Authorization: Bearer 81b16df89117a9df34749ee9b590c2fdd827dc04"
*/
  var options = {
    url: 'https://api.github.com/user/repos',
    method: 'POST',
    json: true,
    body: {
      name: repositoryName,
      description: 'Test Repository',
      homepage: 'https://github.com',
      'private': false
    },
    headers: {
      'Authorization': accessToken,
      'User-Agent': 'curl/7.35.0'
    }
  };

  var callback = function (error, response, body) {
    if (error) {
      console.log('ERROR: ' + error);
      next('ERROR: ' + error);
    }

    next(body)
  }

  request(options, callback); 
}


function extractAccessToken(body) {
  var accessToken = '';
    
  var tokens = body.split('&');
  for(var i=0; i<tokens.length; i++) {
    if(tokens[i].startsWith('access_token=')) {
      accessToken = 'Bearer ' + tokens[i].substr(13, tokens[i].length);
    }
  }

  return accessToken;
}

