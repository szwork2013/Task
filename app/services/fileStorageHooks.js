var metamodel = require('../metamodel'); 
var fs = require('fs');
var path = require('path');
var async = require('async');
var crypto = require('crypto');
var tmp = require('tmp');
var tmpPath = null;
var storage;

function apply(app, models, storageService) {
	storage = storageService;
	createTemporalDirectory();
	addBinaryGetService(app, storage);
	//Intercept resources containing properties with binary types to use the appropiate storage function store/retrieve	
	 Object.keys(models.models).forEach(function(key) { 
        var controller = models.models[key].controller;
		var binaryFields = resourceBinaryFields(key); 
		if (binaryFields.length > 0) {
			//1. Hook on request
			controller.request('post put delete', function(req, res, next) {
				if (isMultiPart(req)) {
					preHook(key, binaryFields, req, res, next);	
				} else {
					next();							
				} 
			});
			//2. Hook on response
			controller.query('post put delete', function(req, res, next) {
				postHook(key, binaryFields, req, res, next);	
			});
		}		
	});
}

function createTemporalDirectory() {
	tmp.dir(function _tempDirCreated(err, path, cleanupCallback) {
		if (err) {
			throw err;
		}
		console.log("Temp directory: ", path);
		tmpPath = path;
	});
	tmp.setGracefulCleanup();	
}

function addBinaryGetService(app, storage) {
	app.get('/api/binary/:resource', function(req, res) {
		var resource = req.params.resource; 
		var targetFileName = tmpPath + '/' + resource;

	 	storage.downloadFile(resource, targetFileName, function(err, file) {
	 		if (err) {
	 			return handleError(err, res);
	 		}
	 		serveFile(file, res);
	 	});
	});
}


function handleError(err, res) {
	res.status(500).json(err).end();
}
function serveFile(file, res) {
	if (file) {	
		res.status(200)
		   .sendFile(file);
	}
	else {
		res.status(404)
		   .mime('application/json')
		   .json({})
		   .end();		
	}
}

function preHook(resourceName, binaryFields, req, res, next) {
	extractPayLoad(req, function(err, payload) {
		if (err) {			
			res.status(422)
			   .json(err)
			   .end();
			return console.error(err);
		}
		if (req.method==='POST') {
			return preHookPost(req, res, next, resourceName, binaryFields, payload);
		}
		else if (req.method==='PUT') {
			return preHookPut(req, res, next, resourceName, binaryFields, payload);
		}
		else {
			return next();
		}
	});
}

function preHookPost(req, res, next, resourceName, binaryFields, payload) {
	persistOnStorage(req, resourceName, binaryFields, payload, function(err, message) {
		if (err) {
			return res.status(422).json(err).end();
		}
		req.body = message;
		return next();
	});
}
function preHookPut(req, res, next, resourceName, binaryFields, payload) {
	//retrieve previous resource.
	var id = req.params.id;
	req.baucis.controller.model().findOne({_id: id}).exec(function (err, resource) {
		if (err) {
			return res.status(422).json(err).end();
		}
		if (!resource) {
			return res.status(404).end();
		}
		//for each new attached file: delete the previous stored one
		deleteOldFilesToOverride(req, resource);
		persistOnStorage(req, resourceName, binaryFields, payload, function(err, message) {
			if (err) {
				return res.status(422).json(err).end();
			}
			req.body = message;
			deleteFilePropertiesSetToNull(message, resource, binaryFields, function (err) {
				if (err) {
					return res.status(422).json(err).end();
				}
				return next();
			});
		});
	});
}

function deleteFilePropertiesSetToNull(newObject, oldObject, binaryFields, cb) {
	try {
		for(var i=0; i<binaryFields.length; i++) {
			var item = binaryFields[i];
			var propName = camelize(item.name);
			var newValue = newObject[propName];
			var oldValue = oldObject[propName];
			if (oldValue && newValue == null) {
				deleteStoredFile(oldValue);
			}
		}
		cb(null);
	}
	catch (err) {
		return cb(err);
	}
}

function deleteStoredFile(key) {
	var targetKey = removePrefix(key);
	storage.deleteFile(targetKey, function(err, data) {
		if (err) {
			console.error(err);
		}
	});		
}

function postHook(resourceName, binaryFields, req, res, next) {
	deleteFiles(req.files);
	if (req.method==='DELETE') {
		return postHookDelete(req, res, next, binaryFields);
	}
	next();
}

function postHookDelete(req, res, next, binaryFields) {
	req.baucis.outgoing(function (context, cb) {
		//retrieve previous resource.
		var obj = context.doc;
		deleteAllFilesForResource(obj, binaryFields);		
	    cb(null, context);
	});
	next();
}

function deleteAllFilesForResource(obj, binaryFields) {
	Object.keys(binaryFields).forEach(function(key) {
		var binField = binaryFields[key];
		var fileKey = obj[camelize(binField.name)];
		if (fileKey) {
			deleteStoredFile(fileKey);
		}	
	});
}

function camelize(s) {
	if (!s) {
		return s;
	}
	if (s.length === 1) {
		return s.toLowerCase();
	}
	return s[0].toLowerCase() + s.substring(1);
}

function deleteOldFilesToOverride(req, resource) {
	Object.keys(req.files).forEach(function(key) {
		var propValue = resource[key];
		if (propValue) {
			var targetKey = removePrefix(propValue);
			storage.deleteFile(targetKey, function(err, data) {
				if (err) {
					console.error(err);
				}
			});					
		} 
	});
}

function removePrefix(uri) {
	if(!uri) {
		return null;
	}
	return uri.replace('/api/binary/', '');
}

function deleteFiles(files) {
	Object.keys(files).forEach(function(key) {
		var file = files[key];
		fs.unlink(file.path, handleDeleteError);		
	});
}
function handleDeleteError(err) {
	if (err) {
		console.error(err);		
	}
}

function extractPayLoad(req, cb) {
	if (req.files && req.files.data) {
		fs.readFile(req.files.data.path , function (err, payload) {
			if (err) {
				return cb(err, null);
			}
			var data = JSON.parse(payload);
			return cb(null, data);
		});
	}
	else if (req.files && req.body.data) {
		var data1 = JSON.parse(req.body.data);
		return cb(null, data1);
	}
	else {
		cb('No payload found', null);
	}
}

function isMultiPart(req) {
	return (req.headers['content-type'] || '').indexOf('multipart/form-data', 0) === 0;	
}

function resourceBinaryFields(resourceName) {
	var cl = metamodel.getClassByName(resourceName, true);
	if (!cl) {
		return [];
	}
	var propFiles = cl.filterPropertiesWithType('file');
	var propImages = cl.filterPropertiesWithType('image');
	return propImages.concat(propFiles);
}

function persistOnStorage(req, resourceName, binaryFields, payload, cb) {
	var uploads = [];
	//1. For each new upload -> store and update the message
	Object.keys(req.files).forEach(function(key) {
		var file = req.files[key];
		var targetName = getUniqueName(file.path);
		if (key !== 'data') {
			var fn = function(callback) {
				storage.uploadFile(file.path, targetName, file.mimeType, function(err, data) {
					if (err) {
						console.error(err);
					}
					payload[key] = storage.getFileResourceName(targetName);
					callback(err, data);
				});
			};
			uploads.push(fn);
		}
	});
	
	async.parallel(uploads, function(err, result) {
		return cb(err, payload);
	});
}

//Provides a unique new name for a file in the storage 	
function getUniqueName(filePath) {
	var ext = path.extname(filePath);
	return randomValueBase64(10) + ext;
}

function randomValueBase64 (len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
        .toString('base64')   // convert to base64 format
        .slice(0, len)        // return required number of characters
        .replace(/\+/g, '0')  // replace '+' with '0'
        .replace(/\//g, '1')  // replace '/' with '1'
        .replace(/\=/g, '2'); // replace '=' with '2'
}


module.exports = {
	apply : apply
}; 