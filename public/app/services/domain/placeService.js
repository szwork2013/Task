angular.module('myApp').service('PlaceService', ['$http', '$q', 'baseApi', 'QueryBuilderService', 'EntityUtilService', function ($http, $q, baseApi, QueryBuilderService, EntityUtilService) {

	var PlaceService = {};

	var resourceUrl = baseApi + '/places';
	var fields = null;

	function buildFields() {
		if (!fields) {
			fields = [
				{name: 'name', type: 'string'},
				{name: 'description', type: 'string'},
				{name: 'location', type: 'geopoint'},
				{name: 'picture', type: 'image'}
			];
		}
		return fields;
	}

	//-- Public API -----

	PlaceService.getCount =  function (opts) {
		opts = opts || {};
		opts.fields = opts.fields || buildFields();
		opts.count = true;		
		return QueryBuilderService.buildBaucisQuery(opts).then(function(q) {
		    return $http.get(resourceUrl + q);
		}, function (err) {
		    return $q.reject(err);
		});
	};
	
	PlaceService.getList = function (opts) {
		opts = opts || {};
		opts.fields = opts.fields || buildFields();
		return QueryBuilderService.buildBaucisQuery(opts).then(function(q) {
		    return $http.get(resourceUrl + q);
		}, function (err) {
		    return $q.reject(err);
		});
	};

	function exportQuery(opts) {
		opts = opts || {};
		opts.paginate = false;
		opts.fields = opts.fields || buildFields();
		return QueryBuilderService.buildBaucisQuery(opts).then(function (q) {
		    return q;
		}, function (err) {
		    return $q.reject(err);
		});
	}

	PlaceService.getListAsCsv = function (opts) {
		return exportQuery(opts).then(function (q) {
			return $http({
				method: 'GET', 
				url: resourceUrl + q, 
				headers: {'Accept': 'text/csv'} 
			});
		}, function (err) {
	        return $q.reject(err);
	    });
	};	

	PlaceService.getFileAsCsv = function (opts) {
		return exportQuery(opts).then(function (q) {
			return $http({
				method: 'GET', 
				url: resourceUrl + q, 
				headers: {'Accept': 'text/csv'} 
			});
		}, function (err) {
	        return $q.reject(err);
	    });
	};	
	PlaceService.getFileAsXml = function (opts) {
		return exportQuery(opts).then(function (q) {
			return $http({
				method: 'GET', 
				url: resourceUrl + q, 
				headers: {'Accept': 'text/xml'} 
			});
		}, function (err) {
	        return $q.reject(err);
	    });
	};		
	PlaceService.getFileAsXlsx = function (opts) {
		return exportQuery(opts).then(function (q) {
			return $http({
				method: 'GET', 
				url: resourceUrl + q, 
				headers: {'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},
				responseType: 'blob' 
			});
		}, function (err) {
	        return $q.reject(err);
	    });
	};		
	
	PlaceService.get = function (link) {
		return $http.get(link);
	};
	
	PlaceService.getDocument = function (id) {
		return PlaceService.get(resourceUrl + '/' + id );
	};

	PlaceService.add = function (item) {
		//Multipart/form-data to support files attached
		var multipartMessage = EntityUtilService.buildMultipartMessage('data', item);
		return $http.post(resourceUrl, multipartMessage, {
				 			  headers: { 'Content-Type': undefined },
							  transformRequest: angular.identity
							});
	};

	PlaceService.update = function (item) {
		//Multipart/form-data to support files attached
		var q = resourceUrl + '/' + item._id;
		var multipartMessage = EntityUtilService.buildMultipartMessage('data', item);
		return $http.put(q, multipartMessage, {
				 			  headers: { 'Content-Type': undefined },
							  transformRequest: angular.identity
							});		
	};

	PlaceService.delete = function (id) {
		return $http.delete(resourceUrl + '/' + id);
	};

	PlaceService.deleteMany = function (ids) {
		return $http.post(resourceUrl + '/deleteByIds', JSON.stringify(ids));
	};	

	PlaceService.deleteByQuery = function (opts) {
		opts = opts || {};
		opts.fields = opts.fields || buildFields();
		opts.paginate = false;		
		return QueryBuilderService.buildBaucisQuery(opts).then(function (q) {
			return $http.delete(resourceUrl + q);
		}, function (err) {
		    return $q.reject(err);
		});
	};
	
	return PlaceService;

}]);
