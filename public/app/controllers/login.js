angular.module('myApp').controller('LoginController', ['$scope', '$rootScope', '$cookies', 'AuthService', '$location', function ($scope, $rootScope, $cookies, AuthService, $location) {

	$rootScope.isLogged = false;	
	$rootScope.username = null; 

	$scope.credentials = {
		username : null,
		password : null,
		errorMessage: null
	};
	
	$scope.login = function () {
		AuthService.login($scope.credentials)
			       .then(loginOK, loginFailed);
	};
	
	function loginOK(res) {
		$scope.errorMessage = null;
		$rootScope.isLogged = true;
		$rootScope.username = res.username;
		$rootScope.session = res;
		if ($rootScope.requestedRoute) {
			var route = $rootScope.requestedRoute;
			$rootScope.requestedRoute = null;
			$location.path(route);
		} 
		else {
			$location.path('/');
		}				
	}
	function loginFailed(err) {
		$rootScope.isLogged = false;		
		$rootScope.username = null;
		$rootScope.session = {};
		$rootScope.password = null;
		
		//$scope.username = null;
		$scope.password = null;
		$scope.errorMessage = "Invalid user or password.";
	}
	
	$scope.init = function() {
		//autologin if cookies are present
		if ($cookies.username != null && $cookies.username != 'null' && $cookies.username != 'j:null' &&
			$cookies.password != null && $cookies.password != 'null' && $cookies.password != 'j:null'
			) {
			$scope.credentials.password = $cookies.password;
			$scope.credentials.username = $cookies.username;
			$scope.login(); //autologin
		}
	};
	
	$scope.init();
	  
}]);