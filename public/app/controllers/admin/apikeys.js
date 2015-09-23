angular.module('myApp').controller('AdminApiKeysController', ['$scope', '$location', 'WebHooksService', 'ConfigService', 'ApikeysService', function ($scope, $location, WebHooksService, ConfigService, ApikeysService) {

	var cidSeq = 4;

	var EditorStatus = {
		none: 0,
		addNew: 1,
		edit: 2
	};

	$scope.roles = [ 
		{ id:1, key:"User"  }, 
		{ id:2, key:"Admin" }
	];


	function init() {
		loadData();
	}

	function loadData() {
		$scope.currentAccount = null;	
		$scope.isDirty = false;	
		$scope.editorStatus = EditorStatus.none;

		ApikeysService.getList().then(bindData);
	}
	function bindData(response){
		$scope.accounts = response.data;
	}

	$scope.isAdding = function() {
		return $scope.editorStatus === EditorStatus.addNew;
	};
	$scope.isEditing = function() {
		return $scope.editorStatus === EditorStatus.edit;
	};
	$scope.isNone = function() {
		return $scope.editorStatus === EditorStatus.none;
	};

	$scope.showDetail = function(account) {
		$scope.currentAccount = account; 
		$scope.isDirty = false;
		$scope.editorStatus = EditorStatus.none;
	};

	$scope.newUser = function() {
		$scope.currentAccount = {
			cid: cidSeq++,
			_id: null,
			username: null,
			password: ApikeysService.getRandomPass(26),
			role: 'User',
			createdAt: null,
			lastAccessOn: null,
			description: null,
			enabled: true
		}; 
		$scope.editorStatus = EditorStatus.addNew;
		$scope.isDirty = true;
	};
	
	$scope.setDirty = function() {
		$scope.isDirty = true;
	};

	$scope.updateUser = function(account) {
		if (account._id == null) {
			account.createdAt = new Date();
			ApikeysService.add(account)
			              .then(loadData);
		} else {
			//update
			ApikeysService.update(account)
			              .then(loadData);
		}		
	};

	$scope.deleteUser = function(account) {
		ApikeysService.delete(account._id)
		              .then(loadData);
	};

	$scope.setEnable = function(account, enable) {
		$scope.isDirty = true;
	};
	$scope.newPassword = function(account) {
		account.password = ApikeysService.getRandomPass(26);
		$scope.isDirty = true;
	};
	$scope.cancelEdit = function() {
		$scope.isDirty = false;
		$scope.editorStatus = EditorStatus.none;
		$scope.currentAccount = null;
	};

	init();

}]);
