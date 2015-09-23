angular.module('myApp').service('UserService', ['$http', '$q', 'baseApi', 'QueryBuilderService', 'EntityUtilService', function ($http, $q, baseApi, QueryBuilderService, EntityUtilService) {

	var UserService = {};

	var resourceUrl = baseApi + '/users';
	var fields = null;

	function buildFields() {
		if (!fields) {
			fields = [
				{name: 'name', type: 'string'},
				{name: 'lastname', type: 'string'},
				{name: 'age', type: 'int'},
				{name: 'isActive', type: 'bool'}
			];
		}
		return fields;
	}

	//-- Public API -----

	UserService.getCount =  function (opts) {
		opts = opts || {};
		opts.fields = opts.fields || buildFields();
		opts.count = true;		
		return QueryBuilderService.buildBaucisQuery(opts).then(function(q) {
		    return $http.get(resourceUrl + q);
		}, function (err) {
		    return $q.reject(err);
		});
	};
	
	UserService.getList = function (opts) {
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

	UserService.getListAsCsv = function (opts) {
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

	UserService.getFileAsCsv = function (opts) {
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
	UserService.getFileAsXml = function (opts) {
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
	UserService.getFileAsXlsx = function (opts) {
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
	
	UserService.get = function (link) {
		return $http.get(link);
	};
	
	UserService.getDocument = function (id) {
		return UserService.get(resourceUrl + '/' + id );
	};

	UserService.add = function (item) {
		return $http.post(resourceUrl, JSON.stringify(item));
	};

	UserService.update = function (item) {
		return $http.put(resourceUrl + '/' + item._id, JSON.stringify(item));
	};

	UserService.delete = function (id) {
		return $http.delete(resourceUrl + '/' + id);
	};

	UserService.deleteMany = function (ids) {
		return $http.post(resourceUrl + '/deleteByIds', JSON.stringify(ids));
	};	

	UserService.deleteByQuery = function (opts) {
		opts = opts || {};
		opts.fields = opts.fields || buildFields();
		opts.paginate = false;		
		return QueryBuilderService.buildBaucisQuery(opts).then(function (q) {
			return $http.delete(resourceUrl + q);
		}, function (err) {
		    return $q.reject(err);
		});
	};
	
	return UserService;

}]);
