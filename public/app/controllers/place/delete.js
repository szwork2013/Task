angular.module('myApp').controller('DeletePlaceController', ['$scope', '$routeParams', '$location', 'PlaceService', function($scope, $routeParams, $location, PlaceService) {

	function init() {
		$scope.place = {};
		$scope.dataReceived = false;

		if($location.path() !== '/place/delete') {
			PlaceService.getDocument($routeParams.id).then(function (httpResponse) {
				$scope.place = httpResponse.data;
				$scope.dataReceived = true;
			});
		} else {
			$scope.dataReceived = true;
		}
	}

	$scope.delete = function () {
		PlaceService.delete($scope.place._id).then(function () {
			$location.path('/place/');
		});
	};

	$scope.cancel = function () {
		$location.path('/place/');
	};

	init();

}]);
