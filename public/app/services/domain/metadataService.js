angular.module('myApp').service('MetadataService', [function () {
	var MetadataService = {};


	var metaData = {
		"user" 		: 	["name","lastname","age","isActive"],
		"place" 		: 	["name","description","location","picture"]
	};

	MetadataService.getPropertiesFor = function (className) {
		return (metaData[className] || [] ).slice(0);
	};

	MetadataService.getResourceList = function() {
		return [{
			key: 'users',
			value: 'Users'	
		}, {
			key: 'places',
			value: 'Places'	
		}];
	};

	return MetadataService;

}]);

