angular.module('myApp').service('ApikeysService', ['$http', '$q', 'UrlService', 'baseApi', function ($http, $q, UrlService, baseApi) {

	var ApikeysService = {};

	var resourceUrl;
	var docUrl;
	var docUrlReceived;
	var resourceUrlReceived;

	// Getting the country API documentation URL and a promise to know when it's loaded.
	docUrlReceived = UrlService.adminApiKeysUrl.then(function (url) {
		docUrl = url;
	});

	// When the documentation is received, getting the countrys resource URL and a promise to know when it's loaded.
	docUrlReceived.then(function () {
		resourceUrlReceived = $http.get(docUrl).success(function (response) {
			resourceUrl = baseApi + response.resourcePath;
		});
	});

	// Function wrapper verifying URL is available before any API call.
	var safeCall = function (functionToCall) {
		return function () {
			var args = Array.prototype.slice.call(arguments);
			var deferred = $q.defer();

			// When the doc URL is available.
			docUrlReceived.then(function () {
				// When the resource URL is available.
				resourceUrlReceived.then(function () {
					deferred.resolve(functionToCall.apply(this, args));
				});
			});

			return deferred.promise;
		};
	};

	//-- Public API -----

	var alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

	ApikeysService.getRandomPass = function(charSize) {
		var char1;
		var res ='';
		for(var i=0; i<charSize; i++) {
			res += alphabet[Math.floor((Math.random() * alphabet.length))];
		}
		return res;
	};
	
	ApikeysService.getToEdit = safeCall(function (id) {
		return CountryService.get(resourceUrl + '/' + id );
	});

	ApikeysService.getList = safeCall(function () {
		return $http.get(resourceUrl);
	});

	ApikeysService.add = safeCall(function (item) {
		return $http.post(resourceUrl, JSON.stringify(item));
	});

	ApikeysService.update = function (item) {
		return $http.put(resourceUrl + '/' + item._id, JSON.stringify(item));
	};

	ApikeysService.delete = safeCall(function (id) {
		return $http.delete(resourceUrl + '/' + id);
	});

	return ApikeysService;
}]);
