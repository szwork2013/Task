//Data model for Backend-Services  ---------------

var conf = require('./conf/configuration').getConfiguration();
var mongoose = require('mongoose');
var geojson = require('mongoose-geojson');
var crypto = require('crypto');

var ObjectId = mongoose.Schema.Types.ObjectId;

// Create Mongoose schemas
var UserSchema = new mongoose.Schema({
	name: { type: String, required: true },
	lastname: { type: String, required: true },
	age: { type: Number, required: false },
	isActive: { type: Boolean, required: true }
});

var PlaceSchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: { type: String, required: false }/*,
	location: { 
        type: {
          type: String,
          required: false,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: { type: [Number], required: false }
    }*/,
	picture: { type: String, required: false }
});


geojson(PlaceSchema, {
  type: 'Point',
  path: 'location',
  required: false
});

PlaceSchema.index({'location': '2dsphere'});


//Many To Many -----

//Internal setting -----
var ConfigSchemaInternal = new mongoose.Schema({ 
    key: { type: String, required: true },
    value: { type: String, required: false }
});

var WebParameterSchemaInternal = new mongoose.Schema({ 
    type:  { type: String, required: true },
    key:   { type: String, required: true },
    value: { type: String, required: false }
});

var WebhooksSchemaInternal = new mongoose.Schema({
    enabled: { type: Boolean, required: true }, 
    resource: { type: String, required: true },
    operation: { type: String, required: true },
    httpMethod: { type: String, required: true },
    urlTemplate: { type: String, required: true },
    parameters: [ WebParameterSchemaInternal ],
    contentType: { type: String, required: false },
    bodyTemplate: { type: String, required: false }
});

var ApiKeysSchemaInternal = new mongoose.Schema({ 
    username: { type: String, required: true },
    password: { type: String, required: true }, //get: decryptField, set: encryptField
    createdAt: { type: Date, required: true, default: Date.now },
    lastAccessOn: { type: Date, required: false },
    enabled: { type: Boolean, required: true },
    role: { type: String, required: true },
    description: { type: String, required: false }
});


//Create full text indexes (experimental)--- Uncomment only as needed
/*
    UserSchema.index({
    	name: 'text',
		lastname: 'text'    
    });
    PlaceSchema.index({
    	name: 'text',
		description: 'text'    
    });
*/

//--- Encription 
var cryptProtocolPrefix = "_#cryp0:";  //do not change <- constant

function decryptField(text){
    if (text === null || typeof text === 'undefined') {
        return text;
    }
    if (!startsWith(text, cryptProtocolPrefix)) {
        return text; //stored as plain text
    }

    var inputData = text.substr(cryptProtocolPrefix.length);  //retrieve payload
    return decrypt2(inputData);
}

function encryptField(text){
    if (text === null || typeof text === 'undefined') {
        return text;
    }
    if (startsWith(text, cryptProtocolPrefix)) {
        return text; //alredy encrypted
    }
    return cryptProtocolPrefix + encrypt2(text);  //encrypt always
} 

function startsWith(str, substrTarget){
    if (str == null) {
        return false;
    }
    var res = str.substr(0, substrTarget.length) == substrTarget;
    return res;
}

//AES Cryp function AES-256-CBC
function encrypt2(text){
    var cipher = crypto.createCipher('aes-256-cbc', conf.security.serverSecret);
    var crypted = cipher.update(text,'utf8','base64');
    crypted += cipher.final('base64');
    return crypted;
} 

function decrypt2(text){
    if (text === null || typeof text === 'undefined') {
        return text;
    }
    var decipher = crypto.createDecipher('aes-256-cbc', conf.security.serverSecret);
    var dec = decipher.update(text,'base64','utf8');
    dec += decipher.final('utf8');
    return dec;
}



// Sample to inject operations into mongoose schemas
//UserSchema.pre('save', function (next) {
//  console.log('A User was saved to MongoDB: %s.', this.get('firstName'));
//  next();
//});

var propertiesForClass = {
	"user" : ['name', 'lastname', 'age', 'isActive'],
	"place" : ['name', 'description', 'location', 'picture']  
};
 
function buildModelAndControllerForSchema(container, entityName, pluralName, schema) {
  container[entityName] = {
    'name': entityName,
    'plural': pluralName,
    'schema': schema,
    'model': buildEntityModel(entityName, pluralName, schema),
    'hasController': true
  };
}
function buildModelForSchema(container, entityName, pluralName, schema) {
  container[entityName] = {
    'name': entityName,
    'plural': pluralName,
    'schema': schema,
    'model': buildEntityModel(entityName, pluralName, schema),
    'hasController': false
  };
}
function buildEntityModel(entityName, pluralName, schema) {
  var entityModel = mongoose.model(entityName, schema);
  entityModel.plural(pluralName);
  return entityModel;
}
function getModelForClass(className) {
  var item = models[className];
  if (item == null) {
    return null;
  }
  return item.model;
}
function getMetadataForClass(className) {
  var item = models[className];
  return item;
}

//Models --------------------------------
var models = {};

buildModelAndControllerForSchema(models, '_config',   'admin-config',   ConfigSchemaInternal);
buildModelAndControllerForSchema(models, '_webhooks', 'admin-webhooks', WebhooksSchemaInternal);
buildModelAndControllerForSchema(models, '_apikeys',  'admin-apikeys',  ApiKeysSchemaInternal);

// Register the schema and export it
buildModelAndControllerForSchema(models, 'user', 'users', UserSchema);
buildModelAndControllerForSchema(models, 'place', 'places', PlaceSchema);

// Register the schema and export it
module.exports.models         = models;
module.exports.getModelForClass   = getModelForClass;
module.exports.propertiesForClass   = propertiesForClass;
module.exports.getMetadataForClass = getMetadataForClass;

