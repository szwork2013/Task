angular.module('myApp').controller('DeleteUserController', ['$scope', '$routeParams', '$location', 'UserService', function($scope, $routeParams, $location, UserService) {

	function init() {
		$scope.user = {};
		$scope.dataReceived = false;

		if($location.path() !== '/user/delete') {
			UserService.getDocument($routeParams.id).then(function (httpResponse) {
				$scope.user = httpResponse.data;
				$scope.dataReceived = true;
			});
		} else {
			$scope.dataReceived = true;
		}
	}

	$scope.delete = function () {
		UserService.delete($scope.user._id).then(function () {
			$location.path('/user/');
		});
	};

	$scope.cancel = function () {
		$location.path('/user/');
	};

	init();

}]);
