angular.module('myApp').controller('SelectUserController', ['$http', '$scope', '$location', '$translate', '$q', '$timeout', 'NavigationService', 'EntityUtilService', 'UserService', function($http, $scope, $location, $translate, $q, $timeout, NavigationService, EntityUtilService, UserService) {

	$scope.dataList = [];
	$scope.selectionContext = {
		allSelected:  false,
		noneSelected: true,
	};
	$scope.searchContext = {
		sort: {},
		pageSize: 12,
		currentPage: 1,
		searchText: '',
		totalItems: 0,
		isSearching: false	
	};
	$scope.sortBy = function(field) {
		EntityUtilService.sortBy($scope.searchContext, field);
		$scope.refresh();
	};
	$scope.select = function(retData) {
		NavigationService.setReturnData(retData);
		$location.path(NavigationService.getReturnUrl());
	};	
	$scope.loadCurrentPage = function () {
		$scope.dataReceived = false;
		$scope.searchContext.isSearching = true;
		UserService.getList({ 
			'page'       : $scope.searchContext.currentPage,
			'pageSize'   : $scope.searchContext.pageSize,
			'searchText' : $scope.searchContext.searchText,
			'sort'		 : $scope.searchContext.sort
		})
		.then(onLoadData)
		.catch(onError)
		.finally(onLoadDataFinally);
	};	

	function onLoadData(httpResponse) {
		$scope.dataList = httpResponse.data;
	} 
	function onError(err) {
		if (err) {
			console.error(err);
		}
	}
	function onLoadDataFinally() {
		$scope.searchContext.isSearching = false;
		$scope.dataReceived = true;
		$scope.$digest();
	} 	
	
	$scope.updateRecordCount = function () {
		$scope.searchContext.totalItems = null;
		UserService.getCount({ 
			'searchText' : $scope.searchContext.searchText
		})
		.then(onUpdateCount, onError);
	};

	function onUpdateCount(httpResponse) {
		$scope.searchContext.totalItems = Number(httpResponse.data);
	} 

	$scope.refresh = function () {
		$scope.updateRecordCount();
		$scope.searchContext.currentPage = 1;
		$scope.loadCurrentPage();
	};

	function init() {
		$scope.refresh();
	}

	init();
}]);
