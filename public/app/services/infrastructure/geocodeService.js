angular.module('myApp').service('GeocodeService', ['$http', '$q', '$timeout', function ($http, $q, $timeout) {
	var GeocodeService = {};

	var apiKey;
	GeocodeService.setApiKey = function(apikey) {
		this.apiKey = apiKey;
	};
	GeocodeService.getGeoFromAddress = function (address) {
		var query = 'https://maps.googleapis.com/maps/api/geocode/json?address=' +
		            encodeURIComponent(address);

		if (apiKey!=null) {
			query += '&apikey=' + encodeURIComponent(apiKey);
		}
		return $http.get(query);
	};
	return GeocodeService;
}]);