function apply(app, models, configuration) {

	//General error handler -- log error
	app.use(function(err, req, res, next) {
		console.error(req.query);
		console.error(err.stack);
	});

	//config-----
	app.post('/api/setConfigKey', function(req, res){
		console.log("SetKey:");
	 	try {
			var item = {
			      'key': req.body.key,
			      'value': req.body.value
			    };
			var model = models.models._config.model;

			console.log("SetKey: " + item.key + '=' + item.value);

			//delete all entries with the same key.
			model.remove({ 'key': item.key }, function (err, doc) {
				if (err) {
					console.err(err);
				}				
			});

			//create setting
			var newDoc = new model({
			  'key': item.key,
			  'value': item.value
			});
			newDoc.save();

			res.status(200)
			   .set('Content-Type', 'text/json')
			   .send('{}');

		}
		catch (e) {
			res.status(501)
			   .set('Content-Type', 'text/json')
			   .send('{ "error" : "' + e.message + '"}');
		}
	});

	//Get webhooks
	app.get('/api/webhook', function (req, res) {
		try {
		    var WhModel = models.models._webhooks.model;
			WhModel.find({}, function(err, webhooks) {
				if (err) {
					return res.status(412).json({ error: err });
				}
				return res.status(200).json(webhooks);
			});
	 	}
	  	catch (e) {
			res.status(501).json({error: e});
	  	}
	});
	//Save webkhooks ---	
	app.post('/api/webhook', function(req, res){
		try {
		    var hook = req.body;
		    var WhModel = models.models._webhooks.model;

			var newDoc = new WhModel({
				enabled: hook.enabled,
				resource : hook.resource,
				operation : hook.operation,
				httpMethod : hook.httpMethod,
				urlTemplate : hook.urlTemplate,        
				parameters : buildParams(hook.parameters),
				contentType: hook.contentType,
				bodyTemplate: hook.bodyTemplate
			});
			newDoc.save(function(err, savedHook) {
				if (err) {
					return res.status(501).json({ error: err });
				}
				return res.status(200).json(savedHook);
			});
	 	}
	  	catch (e) {
			res.status(501).json({error: e});
	  	}
	});	
	
	app.put('/api/webhook/:id', function(req, res){
		try {
			var id = req.params.id;
		    var hook = req.body;
		    var WhModel = models.models._webhooks.model;
			
			WhModel.findOne({_id: id}, function(err, object) {
				if (err) {
					return res.status(404).json({ error: 'Not found' });
				}
				object.enabled = hook.enabled; 
				object.resource = hook.resource; 
				object.operation = hook.operation; 
				object.httpMethod = hook.httpMethod; 
				object.urlTemplate = hook.urlTemplate; 
				object.parameters = buildParams(hook.parameters); 
				object.contentType = hook.contentType; 
				object.bodyTemplate = hook.bodyTemplate; 
				
				object.save(function(err, updated) {
					if (err) {
						return res.status(412).json({ error: err });
					}
					return res.status(200).json(updated);					
				});
			});
	 	}
	  	catch (e) {
			return res.status(412).json({error: e});
	  	}
	});	
	
	app.delete('/api/webhook/:id', function(req, res){
		try {
			var id = req.params.id;
		    var WhModel = models.models._webhooks.model;
	
			WhModel.findByIdAndRemove({_id: id}, function(err, removed) {
				if (err) {
					return res.status(501).json({ error: err });
				}
				if (!removed) {
					return res.status(404).json({});
				}
				return res.status(200).json(removed);
			});
	 	}
	  	catch (e) {
			return res.status(412).json({error: e});
	  	}
	});	
	
	app.post('/api/saveHooks', function(req, res){
		try {
		    var hooks = req.body.items;
		    var whModel = models.models._webhooks.model;
		    console.log("Save hooks: " + hooks.length + " received.");

		    //delete all previous entries
		    whModel.remove({ }, function (err, doc) {
				if (err) {
					console.err(err);
				}
		    });

			//persist all hooks
			for(var i in hooks) {
				var item = hooks[i];

				console.log(JSON.stringify(item));

				var newDoc = new whModel({
					enabled: item.enabled,
					resource : item.resource,
					operation : item.operation,
					httpMethod : item.httpMethod,
					urlTemplate : item.urlTemplate,        
					parameters : buildParams(item.parameters),
					contentType: item.contentType,
					bodyTemplate: item.bodyTemplate
				});
				newDoc.save();
			}

			res.status(200)
			   .set('Content-Type', 'text/json')
			   .send('{}');
	 	}
	  	catch (e) {
	    	res.status(412)
	       		.set('Content-Type', 'text/json')
	       		.send('{ "error" : ' + e + '}');
	  	}
	});

	function buildParams(params) {
		var result = [];
		if (params != null) {
			params.forEach(function(item) {
				result.push({
					type: item.type,
					key: item.key,
					value: item.value
				});
			});
		}
		return result;
	}

	//Ping service for heartbeat (public) - to check if service is alive
	app.get('/ping', function(req, res) {
		res.status(200)
		   .set('Cache-Control', 'no-cache')
		   .send({ msg: 'pong' })
		   .end();
	});

	//Health Status service: rewrite to verify the health of your microservice
	app.get('/api/status', function(req, res) {
		serviceStatus(function status(err, statusInfo) {
			return res.status(err ? 500 : 200)
				      .set('Cache-Control', 'no-cache')
				      .send(statusInfo)
				      .end();	
		});
	});

	//Rewrite to verify the health of your microservice
	function serviceStatus(callback) {
		if (configuration.error) {
			//fatal error
			return callback(true, {
				status: 'malfunction',
				error: '' + configuration.error,
				version: versionInfo()
			});
		}
		//check mongoDB is available with a simple query
		var configModel = models.models._config.model;
		configModel.findOne({}, function(err, data) {
			if (err) {
				return callback(true, {
					status: 'malfunction',
					error: err,
					version: versionInfo()
				});
			}
			return callback(false, {
					status: 'operational',
					version: versionInfo()
				});
		});
	}

	function versionInfo() {
		return {
			generatorEngine: configuration.versions.generatorEngine,
			generatorVersion: configuration.versions.generatorVersion,
			generatedAt: configuration.versions.generatedAt,
			formula: configuration.versions.formulaName,
			formulaVersion: configuration.versions.formulaVersion
		};
	}

}
module.exports.apply = apply;