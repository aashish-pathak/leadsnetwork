// search_with_UI/app.js

var myApp = angular.module('myApp', ['ui.bootstrap', 'ngCookies']);

myApp.controller('parentCtrl', ['$scope', '$cookies', '$http', '$rootScope', function($scope, $cookies, $http, $rootScope) {

	$scope.leads="";
	$scope.return_leads = function() {
		var leads_url = '/return_leads';
		$http({method:'GET', url:leads_url})
		.success(function(data) {
			$scope.leads = data;
			for(var i=0; i<$scope.leads.length;i++)
				$scope.leads[i][2] = true;
		});
		
	};

	$scope.return_leads();
	
	$rootScope.safeApply = function(fn) {
		var phase = this.$root.$$phase;
		if(phase == '$apply' || phase == '$digest') {
			if(fn && (typeof(fn) === 'function')) {
				fn();
			}
		}
		else {
			this.$apply(fn);
		}
	};
	
	$rootScope.canceler = [];
	$rootScope.connections = {};
	$rootScope.connections.first = [];
	
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
		$scope.username="";
		$scope.password="";
	};

	$scope.signIn = function() {

		// send HTTP POST request for login
		var login_url = "/login";
		var post_data = new Object();
		post_data.username = $scope.username;
		post_data.password = $scope.password;
		var content_type = 'application/x-www-form-urlencoded';

		$http({method:'POST', url:login_url, data:post_data, headers: {'Content-Type':content_type}})
		.success(function(data, status, headers, config) {
			$scope.status = status;
			$scope.data = data;
			$scope.headers = headers;
			$scope.config = config;
			
			if($scope.data.response == true) {
				$scope.signInSuccess($scope.data);
			}
			else if($scope.data.response == false){
				alert($scope.data.name);
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

myApp.controller('headerCtrl', ['$scope', '$cookies', '$window', '$rootScope', function($scope, $cookies, $window, $rootScope) {
		
	$scope.signOut = function() {
		// stop pending http requests
		$rootScope.safeApply(function() {
			for(var i=0;i<$rootScope.canceler.length;i++)
				$rootScope.canceler[i].resolve();
		});

		// clear results
		$rootScope.connections = {};

		// delete Cookie
		// $window.location.reload();
		delete $cookies.myApp;
	};
}]);

myApp.controller('wrapperCtrl', ['$scope', '$http', function($scope, $http) {

}]);

myApp.controller('navigationCtrl', ['$scope', '$rootScope', '$http', '$window', '$location', function($scope, $rootScope, $http, $window, $location) {
	
	$scope.fname="";
	$scope.lname="";
	$scope.cname="";
	$scope.leads_empty = false;
	
	$scope.people_search = function() {
		
		if(! $scope.leads_empty) {
			// stop pending http requests
			$rootScope.safeApply(function() {
				for(var i=0;i<$rootScope.canceler.length;i++)
					$rootScope.canceler[i].resolve();
			});

			// clear results
			$rootScope.connections = {};
			
			// assign name to $rootScope
			$rootScope.fname = $scope.fname;
			$rootScope.lname = $scope.lname;
			$rootScope.cname = $scope.cname;
			$rootScope.fire_query = true;			
		}
		else
			alert("Please select at least one lead!");
		
	};

	$scope.add_account = function() {

		var add_account_url = "/add_account";
		
		$http({method:'GET', url:add_account_url})
		.success(function(data, status, headers, config) {
			$scope.status = status;
			$scope.data = data;
			$scope.headers = headers;
			$scope.config = config;
			
			$window.location.href = $scope.data;

		})
		.error(function() {
			alert("HTTP Error....!");
		});
		
	};
	
	$scope.select_all = function() {
		for(var i=0;i<$scope.leads.length;i++)
			$scope.leads[i][2] = true;
	};
	
	$scope.select_none = function() {
		for(var i=0;i<$scope.leads.length;i++)
			$scope.leads[i][2] = false;		
	};

	
	$scope.$watch(
		function(){return $scope.leads;},
		function(){
			$scope.leads_empty = $scope.is_leads_empty();
		},
		true
	);
	

	$scope.is_leads_empty = function() {
		for(var i=0;i<$scope.leads.length; i++) {
			if($scope.leads[i][2] == true)
				return false;
		}
		return true;
	}
	
}]);

myApp.controller('contentCtrl', ['$scope', '$rootScope', '$http', '$q', function($scope, $rootScope, $http, $q) {

	$scope.fname = $rootScope.fname;
	$scope.lname = $rootScope.lname;
	$scope.cname = $rootScope.cname;
	$rootScope.fire_query = false;
	$scope.people_search_ids=[];
	$rootScope.progress=0;
//	$rootScope.selected_leads = 0;
	$scope.connections={};
	$scope.connections.all=[];
	$scope.connections.first=[];
	$scope.connections.second=[];
	$scope.connections.third=[];	
	
	// WATCH on $rootScope's first name and last name and fire_query parameters
	// WATCH on $rootScope's connections
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
			function(){return $rootScope.cname;},
			function(){$scope.cname = $rootScope.cname;}
		);

		$scope.$watch(
			function(){return $scope.current_lead;},
			function(){$scope.current_lead = $scope.current_lead;}
		);

		$scope.$watch(
			function(){return $rootScope.fire_query;},
			function(){
				if($rootScope.fire_query) {
					// search through random access token:
					// add company name (cname) in keywords
					var search_url = "/search?fname=" + $scope.fname + "&lname=" + $scope.lname + "&cname=" + $scope.cname;
					$http({method:'GET', url:search_url})
					.success(function(data) {
						$scope.data = data;
						if(!$scope.data.numResults)
							alert($scope.fname + " " + $scope.lname + " from " + $scope.cname + " is not on LinkedIn....!");
						//alert("Result count : " + $scope.data.numResults);
						else{
							//if($scope.data.numResults == 1)
								//alert("There is one person on LinkedIn. Searching through each lead now.");
							//else
								//alert("There are " + $scope.data.numResults + " people on LinkedIn. Searching through each lead now.");

							// limit the number of calls to 25 if more....
							var numResults = $scope.data.numResults;
							if (numResults > 25)
								numResults = 25;

							$scope.people_search_ids=[];
							$rootScope.canceler = [];
							for(var i=0;i<numResults;i++)
								$scope.people_search_ids.push($scope.data.people.values[i].id);
							
							// call http-request to fetch profile for all leads and all profile ids....!
							// test http-call through lead one for first profile id
							var profile_id="";
							var fetch_profile_url="";
							var total_leads = $scope.leads.length;
							var total_calls = total_leads * numResults;
							$scope.current_lead="";
							//alert("Total calls = " + total_calls);
							$scope.connections.all=[];
							$scope.connections.first=[];
							$scope.connections.second=[];
							$scope.connections.third=[];
							var lead_number=1;
							var count=1;

							var total_calls = numResults * total_leads;
							
/*							for(lead_number = 0; lead_number < total_leads; lead_number++) {
								if(leads[i][2] == true)
									selected_leads++;
							}
*/						
							//alert($scope.leads);
							for(lead_number = 0; lead_number < total_leads; lead_number++) {
								// for lead = lead_number, fetch profile for each id in people_search_ids
								for(var i=0;i<numResults;i++) {
									
									if($scope.leads[lead_number][2] == false) {
										//alert($scope.leads[lead_number][1] + " is not selected");
										continue;
									}
	
									// create canceler
									$rootScope.canceler.push($q.defer());

									$rootScope.safeApply(function() {
										$rootScope.progress = ((lead_number+1)*(i+1)/total_calls)*100;
									});
									
									//alert("progress : " + $scope.progress);

									var lead_number_str = $scope.leads[lead_number][0];
									//var lead_number_str = lead_number.toString();
									$scope.lead_number = lead_number_str;
									profile_id = $scope.people_search_ids[i];
									fetch_profile_url = "/fetch_profile?lead_number=" + lead_number_str + "&profile_id=" + profile_id;
									
									$http({method:'GET', url:fetch_profile_url, timeout: $rootScope.canceler[i].promise})
									.success(function(data) {
										if(data.distance >= 1 && data.distance <=3)
										{
											//console.log(data);
											count++;
											$scope.connections.all.push(data);
										}

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
					$scope.connections.second=[];
				}
			}
		);
		
		$scope.$watch(
			function(){return $rootScope.connections;},
			function(){
				$scope.connections = $rootScope.connections;
			}
		);


		$scope.stop = function() {
			$rootScope.safeApply(function() {
				for(var i=0;i<$rootScope.canceler.length;i++)
					$rootScope.canceler[i].resolve();
			});
		};
	}
}]);

myApp.controller('footerCtrl', ['$scope', function($scope) {
	
}]);

