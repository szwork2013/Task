angular.module('myApp').controller('MainController', ['$scope', '$location', 'Session', function ($scope, $location, Session) {

	$scope.serviceUriBase = $location.protocol() + '://' + $location.host() + ":" + $location.port();	
	
	$scope.userHasAdminRole = function() {
		return (Session && Session.userHasRole("Admin"));
	};

}]);