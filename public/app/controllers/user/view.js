angular.module('myApp').controller('ViewUserController', ['$scope', '$routeParams', '$location', 'UserService', function($scope, $routeParams, $location, UserService) {

	function init() {
		$scope.user = {
			name : null, 
			lastname : null, 
			age : null, 
			isActive : false 
		
		};
		$scope.dataReceived = false;

		UserService.getDocument($routeParams.id).then(function (httpResponse) {
			$scope.user = httpResponse.data;
			$scope.dataReceived = true;
		});

	}

	$scope.gotoList = function (event) {
		$location.path('/user/');
	};	
	$scope.edit = function (event) {
		$location.path('/user/edit/' + $scope.user._id );
	};

	init();

}]);
