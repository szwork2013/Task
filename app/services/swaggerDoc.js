var models = require('../model');
var xlsx = require('xlsx');

//Add export functionality  ----

function addExportDoc(controller) {
	var model = controller.model();
	var baseFileName = model.plural();
	var modelName = model.singular();

    if (!controller.swagger) {
        //init swagger docs
        controller.generateSwagger();
    }

    addMimeTypesToSwaggerDoc(controller, 'GET', '', [
        'application/json',
        'text/csv', 
        'text/xml', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]);

    addSwaggerModelArrayId(controller);
    addSwaggerCustomRoute(controller, 'POST', '/deleteByIds', null, 'deleteByIds', 
                    'Deletes the documents matching the specified IDs (passed by POST data)',
                    null);
  
    enableHints(controller);
}

function enableHints(controller) {
    controller.hints(true);
}

//swagger build helpers ------------------------------
function addSwaggerModelArrayId(controller) {
    var name ="ArrayOfIds";
    
    controller.swagger.apis.models = controller.swagger.apis.models || [];
    
    var model = locateModel(controller.swagger.apis.models, name);
    if (!model) {
        var newModel = {
            "id": name,
            properties: [{
                key: "ids",
                value: {
                    required: "true",
                    type: "Array"  //"string[]" //todo: see how swaggers deals with typed arrays
                    //type: "string[]" 
                }
            }]
        };
        controller.swagger.apis.models.push(newModel);
    }
}
function locateModel(col, key) {
    for(var i=0; i<col.length; i++) {
        var item = col[i];
        if (item.id === key) {
            return item;
        }
    }
    return null;
}

function addMimeTypesToSwaggerDoc(controller, verb, route, mimeTypes) {
    var fullRoute = '/' + controller.model().plural() + route;
    var operation = locateOperation(controller.swagger.apis, verb, fullRoute);
    if (operation) {
        //add extra mime/types
        operation.produces = mimeTypes;
    }
}

function locateOperation(apis, httpVerb, path) {
    for(var i=0; apis.length; i++) {
        var item = apis[i];
        if (item.path === path) {
            for(var j=0; item.operations.length; j++) {
                var op = item.operations[j];
                if (op.httpMethod === httpVerb) {
                    return op;
                }
            }
        }        
    }
    return null;
}

function addSwaggerRoute(controller, httpVerb, route, mimeTypes, operationName, description) {

	controller.swagger.apis.push({
    	path: '/' + controller.model().plural() + route,
    	description: description,
    	operations: generateSwaggerOperation(controller, httpVerb, mimeTypes, operationName, description)
	});

}
function generateSwaggerOperation(controller, httpVerb, mimeTypes, operationName, description) {
 	var operations = [];

	var operation = {};
	var plural = capitalize(controller.model().plural());
	var singular = capitalize(controller.model().singular());

	operation.httpMethod = httpVerb.toUpperCase();
	operation.nickname = operationName;
	operation.responseClass =  singular;  //see arrays in swagger 
	operation.summary = description;
	operation.parameters = generateParameters(httpVerb, singular, plural);
	operation.errorResponses = generateErrorResponses(plural);
	if (mimeTypes) {
		operation.produces = mimeTypes;		
	}
	operations.push(operation);

    return operations;
}

function generateParameters(httpVerb, singular, plural) {
    var parameters = [];

    // Parameters available for singular routes
    if (!plural) {
      parameters.push({
        paramType: 'path',
        name: 'id',
        description: 'The ID of a ' + controller.singular(),
        dataType: 'string',
        required: true,
        allowMultiple: false
      });

      parameters.push({
        paramType: 'header',
        name: 'X-Baucis-Update-Operator',
        description: '**BYPASSES VALIDATION** May be used with PUT to update the document using $push, $pull, or $set.',
        dataType: 'string',
        required: false,
        allowMultiple: false
      });
    }

    // Parameters available for plural routes
    if (plural) {
      parameters.push({
        paramType: 'query',
        name: 'skip',
        description: 'How many documents to skip.',
        dataType: 'int',
        required: false,
        allowMultiple: false
      });

      parameters.push({
        paramType: 'query',
        name: 'limit',
        description: 'The maximum number of documents to send.',
        dataType: 'int',
        required: false,
        allowMultiple: false
      });

      parameters.push({
        paramType: 'query',
        name: 'count',
        description: 'Set to true to return count instead of documents.',
        dataType: 'boolean',
        required: false,
        allowMultiple: false
      });

      parameters.push({
        paramType: 'query',
        name: 'conditions',
        description: 'Set the conditions used to find or remove the document(s).',
        dataType: 'string',
        required: false,
        allowMultiple: false
      });

      parameters.push({
        paramType: 'query',
        name: 'sort',
        description: 'Set the fields by which to sort.',
        dataType: 'string',
        required: false,
        allowMultiple: false
      });
    }

    // Parameters available for singular and plural routes
    parameters.push({
      paramType: 'query',
      name: 'select',
      description: 'Select which paths will be returned by the query.',
      dataType: 'string',
      required: false,
      allowMultiple: false
    });

    parameters.push({
      paramType: 'query',
      name: 'populate',
      description: 'Specify which paths to populate.',
      dataType: 'string',
      required: false,
      allowMultiple: false
    });

    if (httpVerb === 'post') {
      // TODO post body can be single or array
      parameters.push({
        paramType: 'body',
        name: 'document',
        description: 'Create a document by sending the paths to be updated in the request body.',
        dataType: capitalize(singular),
        required: true,
        allowMultiple: false
      });
    }

    if (httpVerb === 'put') {
      parameters.push({
        paramType: 'body',
        name: 'document',
        description: 'Update a document by sending the paths to be updated in the request body.',
        dataType: capitalize(singular),
        required: true,
        allowMultiple: false
      });
    }

    return parameters;
}
function generateErrorResponses(plural) {
	return [{
		'code': 404,
		'reason': 'No ' + plural + ' matched that query.'  
	}];
}

// A method for capitalizing the first letter of a string
function capitalize (s) {
	if (!s) {
		return s;
	}
	if (s.length === 1) {
		return s.toUpperCase();
	}
	return s[0].toUpperCase() + s.substring(1);
}


function addSwaggerCustomRoute(controller, httpVerb, route, mimeTypes, operationName, description, outType) {
    controller.swagger.apis.push({
        path: '/' + controller.model().plural() + route,
        description: description,
        operations: generateSwaggerCustomOperation(controller, httpVerb, mimeTypes, operationName, 
                                                   description, outType)
    });
}
function generateSwaggerCustomOperation(controller, httpVerb, mimeTypes, operationName, description, outType) {
    var operations = [];

    var operation = {};
    var plural = capitalize(controller.model().plural());
    var singular = capitalize(controller.model().singular());

    operation.httpMethod = httpVerb.toUpperCase();
    operation.nickname = operationName;
    operation.responseClass = outType;   
    operation.summary = description;
    operation.parameters = generateArrayIdsParameters();
    operation.errorResponses = generateErrorResponses(plural);
    if (mimeTypes) {
        operation.produces = mimeTypes;     
    }
    operations.push(operation);

    return operations;
}
function generateArrayIdsParameters() {
    var parameters = [];
     
    parameters.push({
        paramType: 'body',
        name: 'ids',
        description: 'Array of Ids: {"ids": [...]}  / string[]).',
        dataType: 'ArrayOfIds',
        required: true,
        allowMultiple: false
    });
    
    return parameters;
}

//----- Export helpers for CSV
function getCsvHeader(className) {
	var res="_id"; prefix=",";
	var props = models.propertiesForClass[className];
	if (props) {
		for(var index in props) {
			res += prefix + csvEncode(props[index]);
		}
		return res+"\r\n";
	}
	return null;
}
function toCsv(objects, className) {
	var res = "sep=,\r\n" + getCsvHeader(className);
	var props = models.propertiesForClass[className];
	if (props) {
		for(var j in objects) {
			var item = objects[j];
			res += item._id;
			var prefix = ",";
			for(var index in props) {
				res += prefix + csvEncode(item[props[index]]);
			}
			res +="\r\n";
		}
	}
	return res;
}
function isObjectId(obj) {
 	return (typeof obj === 'object' && obj._bsontype === 'ObjectID');
}
function csvEncode(data) {
	var text;
	if (data == null) {
	   return '';
	}
	if (isObjectId(data)) {
	   return data.toString();
	}
  if (data.type === 'Point') {
    if (data.coordinates && data.coordinates[0] && data.coordinates[1]) {
      return '"[' + data.coordinates[1] + ', ' + data.coordinates[0] +']"';
    } else {
      return null;
    }
  }

	text = data.toString();

	if ((text.indexOf(',') >= 0) || (text.indexOf('.') >= 0) || (text.indexOf(' ') >= 0)) {
	   return '"' + text + '"';
	}   
	return text;
}

//----- Export helpers for XML
function toXml(objects, className) {
	var res = '<?xml version="1.0" encoding="UTF-8"?>\r\n<data>\r\n';
	var props = models.propertiesForClass[className];
	if (props) {
		for(var j in objects) {
			var item = objects[j];
			res += '  <' + className + '><id>' + item._id + '</id>';
			for(var index in props) {
				var prop = props[index];
				res += '<'+ prop + '>' + xmlEncode(item[prop]) + '</' + prop + '>';
			}
			res +='</' + className + '>\r\n';
		}
	}
	return res + "</data>\r\n";
}
function xmlEncode(data) {
  if (data == null) {
  		return '';
  }
  if (data.type === 'Point') {
    if (data.coordinates && data.coordinates[0] && data.coordinates[1]) {
      return '<lat>' + data.coordinates[1] + '</lat><lng>' + data.coordinates[0] +'</lng>';
    } else {
      return null;
    }
  } 
  var res = data.toString().replace(/&/g, '&amp;')
                .replace(/'/g, '&apos;')
                .replace(/"/g, '&quot;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
  ;
  return res;
}

//----- Export helpers for XLSX
function toXlsx(objects, className) {
  var ws_name = className;
  var wb = {
    SheetNames: [],
    Sheets: {}
  };

  var properties = models.propertiesForClass[className];

  var data = [];
  //add labels
  var headers = [ "_id" ];
  for(var z in properties) {
    headers.push(properties[z]);
  }
  data.push(headers);

  for(var i in objects) {
    var row = objects[i];
    var rowItem = [ row._id ];

    for(var key in properties) {
      var value = xlsxEncode(row[properties[key]]);
      rowItem.push(value);
    }
    data.push(rowItem);
  }
  
  var ws = sheetFromArrayOfArrays(data);
  wb.SheetNames.push(ws_name);
  wb.Sheets[ws_name] = ws;

  var wbbuf = xlsx.write(wb, { type: 'buffer' });
  return wbbuf;
} 

function xlsxEncode(data) {
  if (!data) {
    return null;
  } 
  if (data.type === 'Point') {
    if (data.coordinates && data.coordinates[0] && data.coordinates[1]) {
      return '"[' + data.coordinates[1] + ', ' + data.coordinates[0] +']"';
    } else {
      return null;
    }
  }
  return data;
}

 
function sheetFromArrayOfArrays(data, opts) {
  var ws = {};
  var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
  for(var R = 0; R != data.length; ++R) {
    for(var C = 0; C != data[R].length; ++C) {
      if(range.s.r > R) { range.s.r = R; }
      if(range.s.c > C) { range.s.c = C; }
      if(range.e.r < R) {  range.e.r = R; }
      if(range.e.c < C) {  range.e.c = C; }
      var cell = {v: data[R][C] };
      if(cell.v == null) { continue; }
      var cell_ref = xlsx.utils.encode_cell({c:C,r:R});
      
      if(typeof cell.v === 'number') { cell.t = 'n'; }
      else if(typeof cell.v === 'boolean') { cell.t = 'b'; }
      else if(cell.v instanceof Date) {
        cell.t = 'n'; cell.z = xlsx.SSF._table[14];
        cell.v = datenum(cell.v);
      }
      else {
      	cell.t = 's';
      }
      ws[cell_ref] = cell;
    }
  }
  if(range.s.c < 10000000) { 
  	ws['!ref'] = xlsx.utils.encode_range(range);
  }
  return ws;
}

function datenum(v, date1904) {
	if(date1904) {
		v+=1462;
	}
	var epoch = Date.parse(v);
	return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function apply(controllers) {
    controllers.forEach(function(controller) { 
        addExportDoc(controller); 
    });
}

//Export module 
module.exports.apply = apply;
