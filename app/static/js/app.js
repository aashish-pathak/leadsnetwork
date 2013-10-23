/*	Leads' Network
 *	
 *	main module : leadsApp
 *	
 *	controllers  : containerCtrl
 *	
 */

var leadsApp = angular.module('myApp', ['ui.bootstrap', 'ngCookies']);




leadsApp.controller('mainCtrl', ['$scope', '$rootScope', '$http', '$cookies', '$window', '$q', '$modal', '$location', function($scope, $rootScope, $http, $cookies, $window, $q, $modal, $location) {

	$scope.show_always = true;
	$scope.is_logged_in = false;
	$scope.show_search_form = true;
	$scope.show_results = false;
	$scope.show_leads = false;

	$scope.homepage = 'http://localhost:5000/';

	$scope.login_name = '';
	$scope.login_password = '';
	
	$scope.ldap_name;

	$scope.leads_list = [];
	$scope.leads_empty = false;
	$scope.selected_leads_count = 0;
	
	$scope.fname = '';
	$scope.lname = '';
	$scope.cname = '';
	
	$scope.connections={};
	$scope.connections.all=[];
	$scope.connections.first=[];
	$scope.connections.second=[];
	$scope.connections.third=[];
	
	$scope.canceler = [];

	/* ************************* Safe Apply ***************************/

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

	/* ************************ Select Leads **************************/

	$scope.leadsDiv = function() {
		// check for multiple clicks and copy after first click only
		if(!$scope.show_leads) {
			
		}

		$scope.show_leads = true;
	};
	
	$scope.selectAll = function() {
		for(var i=0;i<$scope.leads_list.length;i++)
			$scope.leads_list[i][2] = true;
	};
	
	$scope.selectNone = function() {
		for(var i=0;i<$scope.leads_list.length;i++)
			$scope.leads_list[i][2] = false;		
	};

	
	$scope.selectBack = function() {
		$scope.show_leads = false;
	};
	
	/* ************************* Add Account **************************/
	
	$scope.addAccount = function() {

		var add_account_url = "/add_account";
		
		$http({method:'GET', url:add_account_url})
		.success(function(data, status, headers, config) {
			$scope.linkedin_url = data;
			$window.location.href = $scope.linkedin_url;
		})
		.error(function() {
			$( "#add_account_http_error" ).dialog({
				modal: true,
				buttons: {
					Ok: function() {
						$(this).dialog( "close" );
					}
				}
			});
		});
	};
	
	// reload after adding account
	$scope.$watch(
		function() {return $location.absUrl();},
		function() {
			if($location.absUrl().indexOf("#") != -1) {
				$scope.goTo($scope.homepage);
			}
		}
	);

	/* *********************** Stop Requests **************************/

	$scope.stopRequests = function() {
		$scope.safeApply(function() {
			for(var i=0;i<$scope.canceler.length;i++)
				$scope.canceler[i].resolve();
		});
		
		$scope.canceler = [];
	};


	/* *********************** Return Leads ***************************/

	// compare between two string (needed for alphabetical sorting)
	$scope.comparator = function(a,b) {
		if (a[1].toUpperCase() < b[1].toUpperCase()) return -1;
		if (a[1].toUpperCase() > b[1].toUpperCase()) return 1;
		return 0;
	};

	// get the list of leads from backend DB
	$scope.returnLeads = function() {
		
		var leads_url = '/return_leads';
		$http({method:'GET', url:leads_url})
		.success(function(data) {
			$scope.leads_list = data;
			for(var i=0; i<$scope.leads_list.length;i++)
				$scope.leads_list[i][2] = true;
				
			$scope.leads_list = $scope.leads_list.sort($scope.comparator);
		});
	};
	
	// function for getting list of leads from database
	$scope.returnLeads();

	/* *********************** Check Cookie ***************************/
	
	// function for checking cookie for leadsApp
	$scope.checkCookie = function() {
		if(!$cookies.leadsApp)
			$scope.is_logged_in = false;
		else {
			$scope.is_logged_in = true;
			$scope.ldap_name = $cookies.leadsApp;
		}
	};

	// calling checkCookie() at each refresh
	$scope.checkCookie();

	// call checkCookie() whenever cookie is changed
	$scope.$watch(
		function(){ return $cookies.leadsApp;},
		function(){$scope.checkCookie();}
	);

	/* *********************** Page Refresh ***************************/
	
	// reloads the entire page
	$scope.goTo = function(url) {
		if(url == 'reload')
			$window.location.reload();
		else
			$window.location.href = url;
	};

	/* ************************** Sign In *****************************/

	$scope.signIn = function() {
				
		var login_url = "/login";
		
		var post_data = new Object();
		post_data.username = $scope.username;
		post_data.password = $scope.password;
		
		var content_type = 'application/x-www-form-urlencoded';

		$http({method:'POST', url:login_url, data:post_data, headers: {'Content-Type':content_type}})
		.success(function(data, status, headers, config) {
			$scope.login_response = data
			
			// successful login
			if($scope.login_response.response == true) {
				$cookies.leadsApp = $scope.login_response.name;
				$scope.login_username = '';
				$scope.login_password = '';
				$scope.is_logged_in = true;
			}
			
			// unsuccessful login
			else if($scope.login_response.response == false){
				alert($scope.login_response.name);
			}
		})
		.error(function() {
				$( "#http_error" ).dialog({
				modal: true,
				buttons: {
					Ok: function() {
						$(this).dialog( "close" );
					}
				}
			});
		});
	};

	/* ************************** Sign Out ****************************/
	
	$scope.signOut = function() {
		// delete cookie
		$cookies.leadsApp = '';
		$scope.show_search_form = true;
		$scope.show_results = false;
		$scope.show_leads = false;
	};

	/* ************************ Search Again **************************/
	$scope.searchAgain = function() {
		$scope.show_search_form = true;
		$scope.show_results = false;
	};

	/* ************************* The Search ***************************/
	$scope.theSearch = function() {
		
		// list of selected list must not be empty
		if(!$scope.leads_empty) {
			$scope.peopleSearch();
		}
		else {
			alert("please select at least one lead..!");
		}
	};

	/* *********************** People Search **************************/
	$scope.peopleSearch = function() {
		var search_url = "/search?fname=" + $scope.fname + "&lname=" + $scope.lname + "&cname=" + $scope.cname;
		$http({method:'GET', url:search_url})
		.success(function(data) {
			$scope.data = data;
			if(!$scope.data.numResults) {
				if($scope.cname == '') {
					$( "#not_on_linkedin_without_cname" ).dialog({
						modal: true,
						buttons: {
							Ok: function() {
								$(this).dialog( "close" );
							}
						}
					});
				}
				else {
					$( "#not_on_linkedin_with_cname" ).dialog({
						modal: true,
							buttons: {
								Ok: function() {
									$(this).dialog( "close" );
								}
							}
					});
				}
			}
			else {
				$scope.findConnections();
			}			
		});
	};
	
	/* ********************** Find Connections ************************/

	$scope.findConnections = function() {
		$scope.show_search_form = false;
		$scope.show_results = true;

		// limit the number of calls to 25 if more....
		var numResults = $scope.data.numResults;
		if (numResults > 25)
			numResults = 25;

		$scope.people_search_ids=[];
		$scope.canceler = [];
		for(var i=0;i<numResults;i++)
			$scope.people_search_ids.push($scope.data.people.values[i].id);
		
		var profile_id="";
		var fetch_profile_url="";
		var total_leads = $scope.leads_list.length;
		var total_calls = total_leads * numResults;
		$scope.current_lead="";
		$scope.connections.all=[];
		$scope.connections.first=[];
		$scope.connections.second=[];
		$scope.connections.third=[];
		var lead_number=1;

		for(lead_number = 0; lead_number < total_leads; lead_number++) {
			for(var i=0;i<numResults;i++) {
				
				if($scope.leads_list[lead_number][2] == false) {
					// current lead is not selected
					continue;
				}

				// create canceler
				$scope.canceler.push($q.defer());

				var lead_number_str = $scope.leads_list[lead_number][0];
				//var lead_number_str = lead_number.toString();
				$scope.lead_number = lead_number_str;
				profile_id = $scope.people_search_ids[i];
				fetch_profile_url = "/fetch_profile?lead_number=" + lead_number_str + "&profile_id=" + profile_id;
				
				$http({method:'GET', url:fetch_profile_url, timeout: $scope.canceler[i].promise})
				.success(function(data) {
					if(data.distance >= 1 && data.distance <=3)
					{
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
	};
}]);


/*

myApp.controller('parentCtrl', ['$scope', '$cookies', '$http', '$rootScope', '$location', '$window', function($scope, $cookies, $http, $rootScope, $location, $window) {

	$scope.comparator = function(a,b) {
		if (a[1].toUpperCase() < b[1].toUpperCase()) return -1;
		if (a[1].toUpperCase() > b[1].toUpperCase()) return 1;
		return 0;
	};

	$scope.leads="";
	$scope.return_leads = function() {
		var leads_url = '/return_leads';
		$http({method:'GET', url:leads_url})
		.success(function(data) {
			$scope.leads = data;
			for(var i=0; i<$scope.leads.length;i++)
				$scope.leads[i][2] = true;
				
			$scope.leads = $scope.leads.sort($scope.comparator);
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

	$scope.current_path = $location.absUrl();
	
	$scope.$watch(
		function() {return $location.absUrl();},
		function() {
			if($location.absUrl().indexOf("#") != -1) {
				$window.location.href = "http://localhost:5000/";
			}
		}
	);

}]);

myApp.controller('loginCtrl', ['$scope', '$cookies', '$http', '$rootScope', function($scope, $cookies, $http, $rootScope) {

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
		//alert("Welcome " + data.name);
		$cookies.myApp = data.name;
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
				$( "#http_error" ).dialog({
				modal: true,
				buttons: {
					Ok: function() {
						$(this).dialog( "close" );
					}
				}
			});
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

		// clear fname
		$rootScope.fname = "";

		// clear results
		$rootScope.connections = {};

		// delete Cookie
		// $window.location.reload();
		delete $cookies.myApp;
		
	};
	
	$scope.reload = function() {sig
		$window.location.reload();
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
			$( "#at_least_one_lead" ).dialog({
				modal: true,
				buttons: {
					Ok: function() {
							$(this).dialog( "close" );
						}
					}
			});
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
			$( "#add_account_http_error" ).dialog({
				modal: true,
				buttons: {
					Ok: function() {
						$(this).dialog( "close" );
					}
				}
			});
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
	$scope.common_connections = [];
	
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
						if(!$scope.data.numResults) {
							if($scope.cname == '') {
								$( "#not_on_linkedin_without_cname" ).dialog({
									modal: true,
									buttons: {
										Ok: function() {
											$(this).dialog( "close" );
										}
									}
								});
							}
							else {
								$( "#not_on_linkedin_with_cname" ).dialog({
									modal: true,
										buttons: {
											Ok: function() {
												$(this).dialog( "close" );
											}
										}
								});
							}
						}
						else {
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
							
//							for(lead_number = 0; lead_number < total_leads; lead_number++) {
//								if(leads[i][2] == true)
//									selected_leads++;
//							}
						
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
											count++;
											$scope.connections.all.push(data);
											console.log(data);
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

	$scope.view_profile = function (connection) {
		window.$windowScope = $scope;
		window.open(connection.publicProfileUrl,
					'frame',
					'resizeable,top=200,left=200,height=500,width=700');
	};
	
	$scope.view_connections = function (connection) {
		$scope.common_connections = [];
		var count = connection.relationToViewer.connections._total;
		if(count > 10)
			count = 10;
			
		for(var i=0; i<count; i++) {
			var first_name = connection.relationToViewer.connections.values[i].person.firstName;
			var last_name = connection.relationToViewer.connections.values[i].person.lastName;
			if(first_name != "private" || last_name != "private")
				$scope.common_connections.push(first_name + " " + last_name);
		}

		if($scope.common_connections.length == 0)
			alert("Names of common connections are private!");
		else {
			$( "#common_connections" ).dialog({
				modal: true,
				buttons: {
					Ok: function() {
						$(this).dialog( "close" );
					}
				}
			});
		}
	};

}]);

myApp.controller('footerCtrl', ['$scope', function($scope) {
	
}]);

*/
