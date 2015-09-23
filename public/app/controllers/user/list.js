angular.module('myApp').controller('ListUserController', ['$http', '$scope', '$location', '$q', '$timeout', '$modal', 'NavigationService', 'EntityUtilService', 'UserService', function($http, $scope, $location, $q, $timeout, $modal, NavigationService, EntityUtilService, UserService) {

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
	$scope.ui = {
		dropdown : {
			isOpen : false
		}
	};

	$scope.sortBy = function(field) {
		EntityUtilService.sortBy($scope.searchContext, field);
		$scope.refresh();
	};

	$scope.add = function () {
		$location.path('/user/add');
	};

	$scope.edit = function (obj) {
		$location.path('/user/edit/' + obj._id);
	};
	$scope.view = function (obj) {
		$location.path('/user/view/' + obj._id);
	};
	$scope.delete = function (obj) {
		$location.path('/user/delete/' + obj._id);
	};

	//masive deletion -----
	$scope.deleteByQuery = function() {
		$scope.ui.dropdown.isOpen = false;
		var modalInstance = $modal.open({
			templateUrl: '/views/confirmDeletionDialog.html',
			controller: 'ConfirmDeletionDialogController',
			resolve: {
				data: function() {
					return {
						titleKey: 'dialog.confirm.delete.title',
						messageKey: 'dialog.confirm.delete.message.filtered',
						count: $scope.searchContext.totalItems
					};
				}
			}
		});
		modalInstance.result.then(function (selectedItem) {
			doDeleteByQuery();
		}, function () {
			//Cancel - Nothing to do.
		});
	};
		
	function doDeleteByQuery() {
		var searchCriteria = {
			'searchText' : $scope.searchContext.searchText
		};
		return EntityUtilService.deleteByQuery(UserService, searchCriteria, $scope.refresh);  		
	}

	$scope.deleteSelected = function() {
		$scope.ui.dropdown.isOpen = false;
		var modalInstance = $modal.open({
			templateUrl: '/views/confirmDeletionDialog.html',
			controller: 'ConfirmDeletionDialogController',
			resolve: {
				data: function() {
					return {
						titleKey: 'dialog.confirm.delete.title',
						messageKey: 'dialog.confirm.delete.message.selected',
						count: $scope.getSelectedItems().length
					};
				}
			}
		});
		modalInstance.result.then(function (selectedItem) {
			doDeleteSelected();
		}, function () {
			//Cancel - Nothing to do.
		});			
	};
	
	function doDeleteSelected() {
		EntityUtilService.deleteSelected(UserService, $scope.dataList, $scope.refresh);  
	}

	//selection -----
	$scope.getSelectedItems = function() {
		return EntityUtilService.getSelectedItems($scope.dataList);  
	};
	$scope.selectItem = function (item, event) {
		return EntityUtilService.selectItem($scope.dataList, $scope.selectionContext, item, event);  
	};
	$scope.selectAll = function (event) {
		return EntityUtilService.selectAll($scope.dataList, $scope.selectionContext, event);  
	};

	// import / export ----
	$scope.importData = function () {
		$scope.ui.dropdown.isOpen = false;
		NavigationService.push($location.path());
		$location.path('/import/user');		
	};
	$scope.exportAs = function (format) { 
		EntityUtilService.exportAsFormat(
			format, { 
				'paginate'   : false,
				'searchText' : $scope.searchContext.searchText,
				'sort'		 : $scope.searchContext.sort
			},
			UserService, "users", $scope);
		$scope.ui.dropdown.isOpen = false;
	};
	//-----------------------------

	
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
