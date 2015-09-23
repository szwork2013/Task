angular.module('myApp').service('UserErrorService', [function () {
	
	var Service = {};	

	Service.translateErrors = function (httpError, operationType) {
		if (httpError == null || httpError.data == null) {
			return null;
		}
		var errors = [];
		if (typeof httpError.data === 'string') {
			if (httpError.status == 404 && operationType == "delete") {
				errors.push("The object you are trying to delete doesn't exits.");			
				return errors;
			}
			if (httpError.status == 404) {
				errors.push("Object not found.");	
				return errors;		
			}


			//Other errors
			errors.push(httpError.data); 	
			return errors;		
		} 
		else {
			if (httpError.data && httpError.data.message && httpError.status === 500) {
				errors.push(httpError.data.message);	
				return errors;
			}

			Object.keys(httpError.data).forEach(function(key) {
				var errItem = httpError.data[key];
				errors.push(processError(operationType, httpError.status, httpError.statusText, errItem));
			});			
		}
		return errors;
	};

	var requiredErrorRegex = /Path `(\w+)` is required./;

	function processError(operationType, statusCode, statusText, error) {
		if (statusCode == 422 && error.type === "unique" && error.name === "MongoError") {
			return "Duplicate key found. Already found and entry with the same data.";
		}

		var match = requiredErrorRegex.exec(error.message);
		if (match) {
			return "The field " + translateSymbol(match[1]) + " is compulsory.";
		}
		return error.message;
	}

	function translateSymbol(symbol) {
		var data = symbols[symbol];
		if (data != null) {
			return data;
		}
		return symbol;
	}

	function stringContains(text, substring) {
		return text.indexOf(substring) > -1;
	}

	//Localized:: Symbol table : User labels
	var symbols = {
		//sample "postalCode" : "Postal Code",
	};

	return Service;
}]);
