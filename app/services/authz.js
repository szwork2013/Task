var basicAuth = require('basic-auth');

function createRootAccount(secInfo, models) {
	var apiKeysModel = models.models._apikeys.model;	
	
	apiKeysModel.findOne({ 
		'username': secInfo.rootAccount
  	}, function (err, doc) {
  		if (err == null && doc == null) {
  			//if not found: create
  			createAccount(apiKeysModel, secInfo.rootAccount, secInfo.apiKey, "Admin");
  		}	
  	});
} 

function createAccount(model, accountName, pass, role) {
	var account = new model();
	account.username = accountName;
	account.password = pass;
	account.enabled = true;
	account.role = role;
	account.save(function (err, acc) {
		if (err) {
			console.error(err);
		}
		if (acc) {
			console.log("Account created for user: " + accountName + " with role: " + role);
		}
	});
}

function apply(app, models, configuration) {
	var auth = configuration;

	createRootAccount(configuration.security, models);

	//CORS enabled for allowing 3rd party web-apps to consume Swagger metadata and backend. 
	//Disable it commenting this block if you don not need it. ----------
	app.all('*', function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");  //Change * to your host domain
		res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
		res.header("Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,DELETE");
	    next();
	});
	
	//Basic Auth login with User/pass ------
	app.post('/weblogin', function(req, res, next) {
		basicAuthChecker(req, function (userLogged) {
			req.session.user = userLogged;
			if (userLogged) {
				res.status(200)
				   .cookie('username', userLogged.username)
			       .cookie('password', userLogged.password)
			       .send( {
						"id":  userLogged.id, 
						"user": {
							"id": userLogged.username, 
							"role": userLogged.role 
						}
					});
				next();
			}
			else {
				res.status(401)
		           .cookie('username', null)
				   .cookie('password', null)			   
		           .send('Unauthorized. Invalid credentials.');
				next();
			}
		});
	});

	app.post('/webLogout', function(req, res) {
		req.session.user = null;
		res.status(200)
		   .clearCookie('username')
		   .clearCookie('password')
		   .send({});
	});

	//API Auth ----------
	app.all('*', function(req, res, next) {
		if (!isProtectedContent(req)){
			return next(); //Public content (no protection)
		}
		userIsLoggedIn(req, function(isLogedIn){
			if (!isLogedIn) {
				res.status(401).send('Unauthorized.'); //Not Authenticated
				return;			
			}			
			if (!checkAutorization(req)) {
				res.status(403).send('Forbidden.'); //Not authozired
				return;	
			}
			return next(); //Authorized
		}); 
	});
	
	//Auth helpers-----
	function isProtectedContent(req) {
		return req.url.substr(0,5) === '/api/';
	}
	function userIsLoggedIn(req, callback) {
		if (req.session.user) {
			return callback(true);
		}
		var incomingKey = getHeaderOrParam(req, 'apikey');
		if (incomingKey == auth.security.apiKey){
			return callback(true);
		}
		incomingKey = getHeaderOrParam(req, 'api_key');
		if (incomingKey == auth.security.apiKey){
			return callback(true);
		}
		basicAuthChecker(req, function(userLogged) {
			req.session.user = userLogged;
			return callback(userLogged);
		});			
	}
	function checkAutorization(req) {
		if (req.url.substr(0,10) === '/api/admin') {
			//require 'Admin' role
			var user = req.session.user;
			if (!user) {
				return false;
			}
			if (user.role === "Admin") {
				return true;				
			}
			console.log("Authorization failed:" + req.url + " for user: "+ user.username +  " with role: " + user.role);
			return false;
		}
		return true;
	}

	function basicAuthChecker(req, callback) {
	  	var cred = basicAuth(req);
		if (!cred) {
			callback(false);
			return;
		}
		var model = models.models._apikeys.model;
		var item = model.findOne({ 
			'username': cred.name,
			'enabled': true
	  	}, function (err, doc) {

	        if (doc && !err && doc.password == cred.pass) {
				//update access timestamp
				doc.lastAccessOn = new Date();
				doc.save(function (err) {});
				callback(doc);
				return;
	        }
			callback(null);
			return;
	  	});
	}	
	function getHeaderOrParam(req, key){
		var cookie = req.cookies[key];
		if (cookie !== undefined) { 
	    	return cookie; 
	  	}
		var header = req.headers[key];
		if (header !== undefined) { 
	    	return header; 
	  	}
		return req.query[key];
	}

}
module.exports.apply = apply;