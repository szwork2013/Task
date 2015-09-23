angular.module('myApp').service('UrlService', ['baseUrl', 'documentationUrl', '$http', '$rootScope', function(baseUrl, documentationUrl, $http, $rootScope) {
	
	var UrlService = {};	

	$http.defaults.headers.common.apikey = $rootScope.apikey;
	var apiDoc = $http.get(baseUrl + documentationUrl);

	var getApi = function (apiDocumentation, resource) {
		var api;
		if (apiDocumentation !== undefined) {
			api = findApi(apiDocumentation.apis, resource);
		}
		return api ? removeProtocol(apiDocumentation.basePath + api.path) : undefined;		
	};
	
	function findApi(apiArray, resource){
		for(var index in apiArray){
			if (apiArray[index].description.search(resource) != -1){
				return apiArray[index];
			}
		}
		return undefined;
	}

	function removeProtocol(uri) {
		return uri.replace("http://", "//")
		          .replace("https://", "//");
	}


	UrlService.userUrl = apiDoc.then(function (apiDocumentation) {
		return getApi(apiDocumentation.data, 'users');
	});

	UrlService.placeUrl = apiDoc.then(function (apiDocumentation) {
		return getApi(apiDocumentation.data, 'places');
	});


	//admin api -------------------
	UrlService.adminWebhooksUrl = apiDoc.then(function (apiDocumentation) {
		return getApi(apiDocumentation.data, 'admin-webhooks');
	});
	UrlService.adminConfigUrl = apiDoc.then(function (apiDocumentation) {
		return getApi(apiDocumentation.data, 'admin-config');
	});
	UrlService.adminApiKeysUrl = apiDoc.then(function (apiDocumentation) {
		return getApi(apiDocumentation.data, 'admin-apikeys');
	});
	
	return UrlService;

}]);
