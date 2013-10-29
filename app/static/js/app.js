/*	Leads' Network
 *	
 *	main module : leadsApp
 *	
 *	controllers  : containerCtrl
 *	
 */

var leadsApp = angular.module('leadsApp', ['ui.bootstrap', 'ngCookies']);

leadsApp.controller('mainCtrl', ['$scope', '$rootScope', '$http', '$cookies', '$window', '$q', '$modal', '$location', function($scope, $rootScope, $http, $cookies, $window, $q, $modal, $location) {

	$scope.show_always = true;
	$scope.is_logged_in = false;
	$scope.is_admin = false;
	$scope.show_search_form = true;
	$scope.show_results = false;
	$scope.show_leads = false;

	$scope.homepage = 'http://localhost:5000/';

	$scope.login_username = '';
	$scope.login_password = '';
	
	$scope.ldap_name;

	$scope.leads_list = [];
	$scope.leads_empty = false;
	$scope.selected_leads_count = 0;
	
	$scope.fname = '';
	$scope.lname = '';
	$scope.cname = '';
	$scope.both_fname_lname = true;
	
	$scope.connections={};
	$scope.connections.all=[];
	$scope.connections.first=[];
	$scope.connections.second=[];
	$scope.connections.third=[];
	$scope.common_connections = [];
	
	$scope.canceler = [];
	
	$scope.progressBar = {};
	$scope.progress = 0;
	$scope.total_xhr = 0;
	$scope.current_xhr = 0;
	$scope.progressBar.value = 0;
	$scope.progressBar.type = 'danger';
	$scope.done_searching = false;

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

	/* ************************ Create Dialogs ************************/
	
	$scope.createDialog = function(msgType) {
		$( msgType ).dialog({
			modal: true,
			buttons: {
				Ok: function() {
					$(this).dialog( "close" );
				}
			}
		});		
	};


	/* ************************ Select Leads **************************/

	$scope.leadsDiv = function() {
		// check that at least one lead is selected
		var none = true;
		for(var i=0;i<$scope.leads_list.length;i++) {
			if($scope.leads_list[i][2] == true) {
				none = false;
				break;
			}
		}
		
		if( none == true)
			$scope.createDialog("#at_least_one_lead");
		else
			$scope.show_leads = !$scope.show_leads;
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
		// check that at least one lead is selected
		var none = true;
		$scope.selected_leads_count = 0;
		for(var i=0;i<$scope.leads_list.length;i++) {
			if($scope.leads_list[i][2] == true) {
				none = false;
				break;
			}
		}
		
		if( none == true)
			$scope.createDialog("#at_least_one_lead");
		else
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
			if($location.absUrl().indexOf("#") != -1 && $location.absUrl().indexOf("linkedin.com") > -1) {
				$scope.goTo($scope.homepage);
			}
		}
	);

	/* *********************** Stop Requests **************************/

	$scope.stopRequests = function() {
		$scope.safeApply(function() {
			
			// abort requests
			for(var i=0;i<$scope.canceler.length;i++)
				$scope.canceler[i].resolve();
				
			// complete progress
			$scope.progress = 100;
			$scope.setProgressBar();
			$scope.done_searching = true;							
		});
		
		$scope.canceler = [];
	};

	/* ************************** Go Back *****************************/

	$scope.goBack = function() {
		$scope.stopRequests();
		$scope.searchAgain();
	};


	/* *********************** Return Leads ***************************/

	// compare between two string (needed for alphabetical sorting)
	$scope.comparatorAlphabetical = function(a,b) {
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
				
			$scope.leads_list = $scope.leads_list.sort($scope.comparatorAlphabetical);
		});
	};
	
	// function for getting list of leads from database
	$scope.returnLeads();

	/* *********************** Check Cookie ***************************/
	
	// function for checking cookie for leadsApp
	$scope.checkCookie = function() {
		if(!$cookies.leadsApp) {
			$scope.is_logged_in = false;
			$scope.is_admin = false;
		}
		else {
			$scope.is_logged_in = true;
			$scope.ldap_name = $cookies.leadsApp;
			if($scope.ldap_name == 'Admin')
				$scope.is_admin = true;
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
		post_data.username = $scope.login_username;
		post_data.password = $scope.login_password;
		
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
				if($scope.login_response.response == 'Admin')
					$scope.is_admin = true;
			}
			
			// unsuccessful login
			else if($scope.login_response.response == false){
				var error = $scope.login_response.name;
				if(error == 'Invalid Username!')
					$scope.createDialog("#invalid_username");
				else if(error == 'Invalid Password!')
					$scope.createDialog("#invalid_password");
				else
					alert($scope.login_response.name);
				
			}
		})
		.error(function() {
				$scope.createDialog("#http_error");
		});
	};

	/* ************************** Sign Out ****************************/
	
	$scope.signOut = function() {
		// delete cookie
		delete $cookies.leadsApp;
		$scope.show_search_form = true;
		$scope.show_results = false;
		$scope.show_leads = false;
		
		$scope.login_username = '';
		$scope.login_password = '';
		$scope.fname = '';
		$scope.lname = '';
		$scope.cname = '';
		$scope.connections = {};		
		
		// stop pending http requests
		$rootScope.safeApply(function() {
			for(var i=0;i<$scope.canceler.length;i++)
				$scope.canceler[i].resolve();
		});

	};

	/* ************************ Search Again **************************/
	$scope.searchAgain = function() {
		$scope.show_search_form = true;
		$scope.show_results = false;		
		$scope.resetProgressBar();
	};

	/* ************************* The Search ***************************/
	$scope.theSearch = function() {
		
		$scope.selected_leads_count = 0;
		// count number of selected leads
		var count = 0;
		for(var i=0;i<$scope.leads_list.length;i++)
			if($scope.leads_list[i][2] == true)
				count++;
		
		$scope.selected_leads_count = count;
		
		$scope.peopleSearch();
	};

	/* *********************** People Search **************************/
	$scope.peopleSearch = function() {
		if($scope.both_fname_lname == true)
			if($scope.fname == '' || $scope.lname == '') {
				$scope.createDialog("#both_fname_lname_error");
				return;
			}

		var search_url = "/search?fname=" + $scope.fname + "&lname=" + $scope.lname + "&cname=" + $scope.cname;
		$http({method:'GET', url:search_url})
		.success(function(data) {
			$scope.data = data;
			if(!$scope.data.numResults) {
				if($scope.cname == '') {
					$scope.createDialog("#not_on_linkedin_without_cname");
				}
				else {
					$scope.createDialog("#not_on_linkedin_with_cname");
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

		$scope.done_searching = false;
		$scope.progress = 0;
		$scope.total_xhr = 0;
		$scope.current_xhr = 0;
		
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
		$scope.searching_message = "";
		$scope.connections.all=[];
		$scope.connections.first=[];
		$scope.connections.second=[];
		$scope.connections.third=[];
		var lead_number=1;

		// find total number of http requests
		$scope.total_xhr = $scope.calculateTotalCalls();

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
				
				// calculate progress before each http request
				
				$http({method:'GET', url:fetch_profile_url, timeout: $scope.canceler[i].promise})
				.success(function(data) {
					
					$scope.safeApply(function() {
						$scope.current_xhr++;
						$scope.progress = ($scope.current_xhr / $scope.total_xhr)*100;
						$scope.setProgressBar();						
						// add default profile picture
						if(!('pictureUrl' in data)) {
							data.pictureUrl = '/static/img/ghost_profile.png';
							console.log(data);
						}
						$scope.current_lead = data.through;
					});
					
					if(data.distance <= 3) {						
						if(data.distance == 1)
							$scope.connections.first.push(data);
						if(data.distance == 2)
							$scope.connections.second.push(data);
						if(data.distance == 3)
							$scope.connections.third.push(data);
					}
					
					if(data.distance >= 1 && data.distance <=3)
					{
						$scope.connections.all.push(data);
					}
					
				})
				.error(function() {
					$scope.safeApply(function() {
						$scope.current_xhr++;
						$scope.progress = ($scope.current_xhr / $scope.total_xhr)*100;
						$scope.setProgressBar();						
					});
				});
			}
		}
	};
	
	/* ************************* View Profile *************************/
	
	$scope.viewProfile = function (connection) {
		window.$windowScope = $scope;
		window.open(connection.publicProfileUrl,
					'frame',
					'resizeable,top=200,left=200,height=500,width=700');
	};
	
	/* ********************** View Connections ************************/

	$scope.viewConnections = function (connection) {
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
			$scope.createDialog("#common_connections");
		}
	};



	/* ********************** Sort Connections ************************/

	// create a watch on result list and sort whenever it changes
	
	// compare between two numbers (needed for numerical sorting)
	$scope.comparatorNumerical = function(a,b) {
		if (a < b) return -1;
		if (a > b) return 1;
		return 0;
	};

	/* ********************** Calculate Progress **********************/
	$scope.calculateTotalCalls = function() {
		
		var selected_leads = 0;
		for(var i = 0; i < $scope.leads_list.length; i++){
			if($scope.leads_list[i][2] == true)
				selected_leads++;
		}
		
		var numResults = $scope.data.numResults;
		if (numResults > 25)
			numResults = 25;
		
		return selected_leads * numResults;
	};

	/* ************************* Progress Bar *************************/

	$scope.setProgressBar = function() {
		
		var value = $scope.progress;

		if (value < 25) {
		  type = 'danger';
		} else if (value < 50) {
		  type = 'warning';
		} else if (value < 75) {
		  type = 'info';
		} else {
		  type = 'success';
		}

		$scope.progressBar = {
			value: value,
			type: type
		};
		
		if($scope.progress == 100)
			$scope.done_searching = true;
	};
	
	/* ********************* Reset ProgressBar ************************/
	
	$scope.resetProgressBar = function() {
		$scope.safeApply(function() {
			
			// reset progress
			$scope.progress = 0;
			$scope.setProgressBar();							
		});
	};
	
}]);
