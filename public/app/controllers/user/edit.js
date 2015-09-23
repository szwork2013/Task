angular.module('myApp').controller('EditUserController', ['$scope', '$routeParams', '$location', '$translate', 'UserErrorService', 'UserService', function($scope, $routeParams, $location, $translate, UserErrorService, UserService) {

	$scope.isEdition = false;
	$scope.isCreation = false;
	$scope.isDeletion = false;
	$scope.isView = false;
	$scope.readOnly = false;
	$scope.dataReceived = false;
	$scope.obj = {
		name : null, 
		lastname : null, 
		age : null, 
		isActive : false 
		
	};

	$scope.add = function () {
		$scope.uiWorking = true;
		UserService.add(dataToServer($scope.obj))
		              .then(gotoList, errorHandlerAdd, progressNotify);
	};
	$scope.update = function () {
		$scope.uiWorking = true;
		UserService.update(dataToServer($scope.obj))
	              	  .then(gotoList, errorHandlerUpdate, progressNotify);
	};
	$scope.delete = function () {
		$scope.uiWorking = true;
		UserService.delete($scope.obj._id)
		              .then(gotoList, errorHandlerDelete, progressNotify);		
	};
	function progressNotify(update) {
	}
	function errorHandlerAdd(httpError) {
		$scope.uiWorking = false;
		$scope.errors = UserErrorService.translateErrors(httpError, "add");
	}
	function errorHandlerUpdate(httpError) {
		$scope.uiWorking = false;
		$scope.errors = UserErrorService.translateErrors(httpError, "update");
	}
	function errorHandlerDelete(httpError) {
		$scope.uiWorking = false;
		$scope.errors = UserErrorService.translateErrors(httpError, "delete");
	}
	function errorHandlerLoad(httpError) {
		$scope.uiWorking = false;
		$scope.errors = UserErrorService.translateErrors(httpError, "query");
	}

	function dataToServer(obj) {
	
		return obj;
	}	
	function geopointIsEmpty(geopoint) {
		if (!geopoint || !geopoint.coordinates || geopoint.coordinates.length === 0) {
			return true;
		}
		if (geopoint.coordinates.length === 2 &&
		    !geopoint.coordinates[0] &&
		    !geopoint.coordinates[1] 
		) {
			return true;
		}
		return false;
	}
	function geopointEmptyValue() {
		return { type: 'Point', coordinates: [] };
	}
	function loadData(httpResponse) {
		$scope.obj = httpResponse.data;
		$scope.errors = null;
		$scope.dataReceived = true;
		$scope.uiWorking = false;
	}

	$scope.cancel = function () {
		gotoList();
	};
	$scope.gotoEdit = function() {
		$location.path('/user/edit/' + $routeParams.id);		
	};
	$scope.gotoDelete = function() {
		$location.path('/user/delete/' + $routeParams.id);		
	};
	function gotoList() {
		$scope.uiWorking = false;
		$location.path('/user/');		
	}

	function init() {
		$scope.isDeletion = isDeletionContext();
		$scope.isView     = isViewContext();
		$scope.readOnly   = $scope.isDeletion || $scope.isView;

		if ($routeParams.id) {
			$scope.isEdition = !$scope.readOnly;
			$scope.isCreation = false;

			UserService.getDocument($routeParams.id)
				.then(loadData, errorHandlerLoad);
		} else {
			$scope.isEdition = false;
			$scope.isCreation = true;
			$scope.dataReceived = true;
		}
	}
	function isDeletionContext() {
		return stringContains($location.path(), '/delete/');
	}
	function isViewContext() {
		return stringContains($location.path(), '/view/');
	}
	function stringContains(text, substring) {
		return text.indexOf(substring) > -1;
	}

	init();

}]);
