// search_with_UI/app.js

var myApp = angular.module('myApp', ['ui.bootstrap', 'ngCookies']);

myApp.controller('parentCtrl', ['$scope', '$cookies', '$http', function($scope, $cookies, $http) {

	$scope.leads="";
	$scope.return_leads = function() {
		var leads_url = '/return_leads';
		$http({method:'GET', url:leads_url})
		.success(function(data) {
			$scope.leads = data;
		});
	};

	$scope.return_leads();
	
}]);

myApp.controller('loginCtrl', ['$scope', '$cookies', '$http', function($scope, $cookies, $http) {

	$scope.data="";
	// STORE COOKIE IN $SCOPE
	$scope.is_old_user = $cookies.myApp;
	$scope.$watch(
		function() {return $cookies.myApp;},
		function() {$scope.is_old_user = $cookies.myApp;}
	);


	$scope.username="";
	$scope.password="";

	$scope.signInSuccess = function(data) {
		alert("Welcome " + data.name);
		$cookies.myApp = $scope.username;
	};

	$scope.signIn = function() {

		// call HTTP request for login
		var login_url = "/login?username=" + $scope.username + "&password=" + $scope.password;
		$http({method:'GET', url:login_url})
		.success(function(data, status, headers, config) {
			$scope.status = status;
			$scope.data = data;
			$scope.headers = headers;
			$scope.config = config;
			
			if($scope.data.response == true) {
				$scope.signInSuccess($scope.data);
			}
			else {
				alert("Invalid user name or password!");
			}
		})
		.error(function() {
			alert("HTTP Error....!");
		});
	};
	
}]);

myApp.controller('pageCtrl', ['$scope', '$cookies', function($scope, $cookies) {

	// check for a cookie
	$scope.name = $cookies.myApp;
	$scope.is_old_user = $cookies.myApp;

	$scope.$watch(
		function(){return $cookies.myApp;},
		function(){$scope.is_old_user = $cookies.myApp;$scope.name = $cookies.myApp;}
	);	

}]);

myApp.controller('headerCtrl', ['$scope', '$cookies', function($scope, $cookies) {
		
	$scope.signOut = function() {
		// delete Cookie
		delete $cookies.myApp;
	};
}]);

myApp.controller('wrapperCtrl', ['$scope', '$http', function($scope, $http) {

}]);

myApp.controller('navigationCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
	
	$scope.fname="";
	$scope.lname="";
	
	$scope.people_search = function() {
		// assign name to $rootScope
		$rootScope.fname = $scope.fname;
		$rootScope.lname = $scope.lname;
		$rootScope.fire_query = true;
	};
	
}]);

myApp.controller('contentCtrl', ['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {

	$scope.fname = $rootScope.fname;
	$scope.lname = $rootScope.lname;
	$rootScope.fire_query = false;
	$scope.people_search_ids=[];
	$scope.connections={};
	$scope.connections.first=[];
	$scope.connections.second=[];
	$scope.connections.third=[];	
	
	// WATCH on $rootScope's first name and last name and fire_query parameters
	{
		$scope.$watch(
			function(){return $rootScope.fname;},
			function(){
				$scope.fname = $rootScope.fname;
			}
		);
		
		$scope.$watch(
			function(){return $rootScope.lname;},
			function(){$scope.lname = $rootScope.lname;}
		);


		$scope.$watch(
			function(){return $scope.current_lead;},
			function(){$scope.current_lead = $scope.current_lead;}
		);

		$scope.$watch(
			function(){return $rootScope.fire_query;},
			function(){
				if($rootScope.fire_query) {
					// search through 1st access token:
					var search_url = "/search?fname=" + $scope.fname + "&lname=" + $scope.lname;
					$http({method:'GET', url:search_url})
					.success(function(data) {
						$scope.data = data;
						if(!$scope.data.numResults)
							alert($scope.fname + " " + $scope.lname + " is not on LinkedIn....!");
						//alert("Result count : " + $scope.data.numResults);
						else{
							if($scope.data.numResults == 1)
								alert("There is one person on LinkedIn. Searching through each lead now.");
							else
								alert("There are " + $scope.data.numResults + " people on LinkedIn. Searching through each lead now.");

							// limit the number of calls to 25 if more....
							var numResults = $scope.data.numResults;
							if (numResults > 25)
								numResults = 25;
							$scope.people_search_ids=[];
							for(var i=0;i<numResults;i++)
								$scope.people_search_ids.push($scope.data.people.values[i].id);
							
							// call http-request to fetch profile for all leads and all profile ids....!
							// test http-call through lead one for first profile id
							var profile_id="";
							var fetch_profile_url="";
							var count=1;
							var total_leads = $scope.leads.length;
							var total_calls = total_leads * numResults;
							$scope.current_lead="";
							alert("Total calls = " + total_calls);
							$scope.connections.first=[];
							$scope.connections.second=[];
							$scope.connections.third=[];
							var lead_number=1;
							for(lead_number = 1; lead_number <= total_leads; lead_number++) {
								// for lead = lead_number, fetch profile for each id in people_search_ids
								for(var i=0;i<numResults;i++) {
									lead_number = lead_number.toString();
									$scope.lead_number = lead_number;									
									profile_id = $scope.people_search_ids[i];
									fetch_profile_url = "/fetch_profile?lead_number=" + lead_number + "&profile_id=" + profile_id;
									$http({method:'GET', url:fetch_profile_url})
									.success(function(data) {
										//alert(data.distance);
										if(data.distance <= 3) {
											if(data.distance == 1)
												$scope.connections.first.push(data);
											if(data.distance == 2)
												$scope.connections.second.push(data);
											if(data.distance == 3)
												$scope.connections.third.push(data);
										}
									});
								}
							}
						}
						
					});
					$rootScope.fire_query = false;
				}
			}
		);
	}
}]);

myApp.controller('footerCtrl', ['$scope', function($scope) {
	
}]);

