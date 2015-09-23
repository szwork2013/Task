angular.module('myApp').controller('ViewPlaceController', ['$scope', '$routeParams', '$location', 'PlaceService', function($scope, $routeParams, $location, PlaceService) {

	function init() {
		$scope.place = {
			name : null, 
			description : null, 
			location : null, 
			picture : null 
		
		};
		$scope.dataReceived = false;

		PlaceService.getDocument($routeParams.id).then(function (httpResponse) {
			$scope.place = httpResponse.data;
			$scope.dataReceived = true;
		});

	}

	$scope.gotoList = function (event) {
		$location.path('/place/');
	};	
	$scope.edit = function (event) {
		$location.path('/place/edit/' + $scope.place._id );
	};

	init();

}]);
