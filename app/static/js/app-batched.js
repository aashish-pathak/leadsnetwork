/*	Leads' Network
 *	
 *	main module : leadsApp
 *	
 *	controllers  : containerCtrl
 *	
 */

var leadsApp = angular.module('leadsApp', ['ui.bootstrap', 'ngCookies', 'infinite-scroll']);

leadsApp.controller('mainCtrl', ['$scope', '$rootScope', '$http', '$cookies', '$window', '$q', '$modal', '$location', function($scope, $rootScope, $http, $cookies, $window, $q, $modal, $location) {

	// for showing and hiding appropriate DIV elements
	$scope.show_always = true;
	$scope.is_logged_in = false;
	$scope.is_admin = false;
	$scope.show_search_form = true;
	$scope.show_results = false;
	$scope.show_leads = false;
	$scope.leads_filter = '';

	// login credentials
	$scope.login_username = '';
	$scope.login_password = '';
	
	$scope.ldap_name;

	// list of leads
	$scope.leads_list = [];
	$scope.leads_empty = false;
	$scope.selected_leads_count = 0;
	$scope.groups_list = [];
	$scope.groups_of_leads = [];
	
	// invitation details
	$scope.email_address = '';
	$scope.show_invitation_box = false;

	// search parameters
	$scope.fname = '';
	$scope.lname = '';
	$scope.cname = '';
	$scope.enable_search = false;
	
	// people search parameters
	$scope.show_people_search = false;
	$scope.people_search_busy = true;
	$scope.people_search_selected_all = false;
	$scope.people_search_selected_count = 0;

	// result sets
	$scope.connections={};
	$scope.connections.all=[];
	$scope.connections.first=[];
	$scope.connections.second=[];
	$scope.connections.third=[];
	$scope.common_connections = [];
	
	$scope.canceler = [];

	// progress calculation
	$scope.progressBar = {};
	$scope.progress = 0;
	$scope.total_xhr = 0;
	$scope.current_xhr = 0;
	$scope.progressBar.value = 0;
	$scope.progressBar.type = 'danger';
	$scope.done_searching = false;
	$scope.progress_bar_animation = 'progress-striped active';

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
			style: "z-index:1000",
			buttons: {
				Ok: function() {
					$(this).dialog( "close" );
				}
			}
		});		
	};

	/* *********************** Return Groups **************************/

	// get the list groups of leads from backend DB
	$scope.returnGroups = function() {
		
		console.log("returnGroups");
		var groups_url = '/return_groups';
		$http({method:'GET', url:groups_url})
		.success(function(data) {
			$scope.groups_list = data;
			
			$scope.initGroups();
		});
	};

	/* ********************* Initialize Groups ************************/

	$scope.initGroups = function() {
		console.log("initGroups");
		//scan groups list and initialize
		for(var i=0;i<$scope.groups_list.length;i++){
			// create object and push into groups_of_leads
			var group_obj = {};
			group_obj.group_id = $scope.groups_list[i][0];
			group_obj.group_name = $scope.groups_list[i][1];
			group_obj.leads_list = [];
			$scope.groups_of_leads.push(group_obj);
		}
		
		$scope.returnLeads();
	};
	
	/* *********************** Return Leads ***************************/

	// compare between two string (needed for alphabetical sorting)
	$scope.comparatorAlphabetical = function(a,b) {
		if (a[1].toUpperCase() < b[1].toUpperCase()) return -1;
		if (a[1].toUpperCase() > b[1].toUpperCase()) return 1;
		return 0;
	};

	// compare between two numbers (needed for numerical sorting)
	$scope.comparatorNumerical = function(a,b) {
		if (a[2] < b[2]) return -1;
		if (a[2] > b[2]) return 1;
		return 0;
	};

	// compare between two group_ids (needed for sorting based on group_id)
	$scope.comparatorGroupId = function(a,b) {
		if (a[2] < b[2]) return -1;
		if (a[2] > b[2]) return 1;
		
		// for same group_id, sort alphabetically
		if (a[1].toUpperCase() < b[1].toUpperCase()) return -1;
		if (a[1].toUpperCase() > b[1].toUpperCase()) return 1;
		return 0;
	};

	// get the list of leads from backend DB
	$scope.returnLeads = function() {
		console.log("returnLeads");
		
		var leads_url = '/return_leads';
		$http({method:'GET', url:leads_url})
		.success(function(data) {
			$scope.leads_list = data;
			for(var i=0; i<$scope.leads_list.length;i++)
				$scope.leads_list[i].push(true);
		
			$scope.safeApply(function() {
				$scope.leads_list = $scope.leads_list.sort($scope.comparatorGroupId);
			});

			$scope.fillGroups();
		});
	};
	
	/* *********************** Fill Groups ****************************/
	$scope.fillGroups = function() {
		console.log("fillGroups");
		
		// scan global leads_list to fill leads_list of each group
		for(var current_lead=0; current_lead<$scope.leads_list.length; current_lead++){
			
			var group_id = $scope.leads_list[current_lead][2];
			
			for(var current_group=0; current_group<$scope.groups_of_leads.length; current_group++)
				if($scope.groups_of_leads[current_group].group_id == group_id)
					break;
			
			$scope.groups_of_leads[current_group].leads_list.push($scope.leads_list[current_lead]);
		}
		
		// based on leads_list in each group, set it's parameters
		for(var current_group=0; current_group<$scope.groups_of_leads.length; current_group++){
			$scope.groups_of_leads[current_group].visible = false;
			$scope.groups_of_leads[current_group].group_display_name = $scope.getDisplayNameFromName($scope.groups_of_leads[current_group].group_name);
			$scope.groups_of_leads[current_group].leads_count = $scope.groups_of_leads[current_group].leads_list.length;
			$scope.groups_of_leads[current_group].selected_leads_count = $scope.groups_of_leads[current_group].leads_count;
			$scope.groups_of_leads[current_group].select_group = true;

			if(!$scope.groups_of_leads[current_group].leads_count)
				$scope.groups_of_leads[current_group].leads_empty = true;
			else
				$scope.groups_of_leads[current_group].leads_empty = false;
			
			for(var current_lead=0;current_lead<$scope.groups_of_leads[current_group].leads_list.length;current_lead++)
				$scope.groups_of_leads[current_group].leads_list[current_lead].push($scope.groups_of_leads[current_group].group_display_name);
		}
		
		$scope.returnSuggestions();
	};
	
	$scope.getDisplayNameFromName = function(name){
		console.log("getDisplayNameFromName");
		
		var group_display_name = '';
		switch(name)
		{
			case 'Execs':
			  group_display_name = 'Executive';
			  break;
			case 'PracticeHead':
			  group_display_name = 'Practice Head';
			  break;
			case 'LSE':
			  group_display_name = 'Lead Software Engineer';
			  break;
			case 'SSE':
			  group_display_name = 'Senior Software Engineer';
			  break;
			case 'SE':
			  group_display_name = 'Software Engineer';
			  break;
			case 'users':
			  group_display_name = 'Others';
			  break;
			case 'TM':
			  group_display_name = 'Talent Manager';
			  break;
			case 'Corp':
			  group_display_name = 'Corporate Services';
			  break;
		}		
		return group_display_name;
	};

	/* ******************** Return Suggestions ************************/

	// get the list suggestion names from DB
	$scope.returnSuggestions = function() {
		console.log("returnSuggestions");
		
		var suggestions_url = '/return_suggestions';
		$http({method:'GET', url:suggestions_url})
		.success(function(data) {
			$scope.suggestions = data;
	
			//console.log($scope.suggestions);
		});
	};

	/* ************************* Start All ****************************/

	$scope.startAll = function() {
		$scope.returnGroups();
		$scope.initGroups();
		$scope.returnLeads();
		$scope.fillGroups();
		$scope.returnSuggestions();
	};
	
	//$scope.startAll();
	$scope.returnGroups();

	/* ************************ Select Leads **************************/

	$scope.leadsDiv = function() {
		console.log("leadsDiv");
		
		// check that at least one lead is selected
		var none = true;
		for(var i=0;i<$scope.leads_list.length;i++) {
			if($scope.leads_list[i][3] == true) {
				none = false;
				break;
			}
		}
		
		if( none == true)
			$scope.createDialog("#at_least_one_lead");
		else
			$scope.toggleLeadsDiv();
	};
	
	$scope.selectAllLeads = function() {
		console.log("selectAllLeads");
		
		for(var i=0;i<$scope.leads_list.length;i++)
			$scope.leads_list[i][3] = true;
			
		for(var i=0;i<$scope.groups_of_leads.length;i++){
			$scope.groups_of_leads[i].select_group = true;
			$scope.groups_of_leads[i].selected_leads_count = $scope.groups_of_leads[i].leads_list.length;
		}
	};
	
	$scope.selectNoneLeads = function() {
		console.log("selectNoneLeads");
		
		for(var i=0;i<$scope.leads_list.length;i++)
			$scope.leads_list[i][3] = false;		
			
		for(var i=0;i<$scope.groups_of_leads.length;i++){
			$scope.groups_of_leads[i].select_group = false;
			$scope.groups_of_leads[i].selected_leads_count = 0;
		}
	};

	
	$scope.selectBack = function() {
		console.log("selectBack");
		
		// check that at least one lead is selected
		var none = true;
		$scope.selected_leads_count = 0;
		for(var i=0;i<$scope.leads_list.length;i++) {
			if($scope.leads_list[i][3] == true) {
				none = false;
				break;
			}
		}
		
		if( none == true)
			$scope.createDialog("#at_least_one_lead");
		else
			$scope.toggleLeadsDiv();
	};

	$scope.toggleLeadsDiv = function() {
		$scope.show_leads = !$scope.show_leads;
		$scope.leads_filter = '';
		
		// $scope.expandAll();
		
		// scroll to TOP when showing leads' list
		if($scope.show_leads == true)
			$scope.scrollTop();
			
		// hide INVITATION BOX
		$scope.show_invitation_box = false;
	};
	
	/* ************************* Add Account **************************/
	
	$scope.addAccount = function() {
		console.log("addAccount");
		
		// stop pending AJAX requests first
		$scope.stopRequests();

		var add_account_url = "/add_account";
		
		$http({method:'GET', url:add_account_url})
		.success(function(data, status, headers, config) {
			$scope.add_account_response = data;
			$window.location.href = $scope.linkedin_url;
			if($scope.add_account_response.used == true)
				$scope.createDialog("#dead_link");
		})
		.error(function() {
			$scope.createDialog("#http_error");
		});
	};
	
	// reload after adding account
	$scope.$watch(
		function() {return $location.absUrl();},
		function() {
			if($location.absUrl().indexOf("#") != -1) {
				$scope.goTo("/");
			}
		}
	);

	/* *********************** Stop Requests **************************/

	$scope.stopRequests = function() {
		console.log("stopRequests");
		
		$scope.safeApply(function() {
		
			// abort requests
			for(var i=0;i<$scope.canceler.length;i++)
				$scope.canceler[i].resolve();
				
			// complete progress
			$scope.progress = 100;
			$scope.setProgressBar();
			$scope.done_searching = true;
			//console.log("Progress : " + $scope.progress);
		});
	};

	/* ************************** Go Back *****************************/

	$scope.goBack = function() {
		console.log("goBack");
		
		$scope.searchAgain();
		$scope.scrollTop();
	};

	/* *********************** Toggle Group ***************************/
	$scope.toggleGroup = function(group){
		for(var i=0;i<$scope.groups_of_leads.length;i++){
			if($scope.groups_of_leads[i].group_id == group.group_id){
				$scope.groups_of_leads[i].visible = !$scope.groups_of_leads[i].visible;
				break;
			}
		}
	};

	/* *********************** Select Group ***************************/
	$scope.selectGroup = function(group){
		console.log("selectGroup");
		
		if(group.leads_empty)
			return;
			
		for(var i=0; i<$scope.groups_of_leads.length; i++){
			if($scope.groups_of_leads[i].group_id == group.group_id){
				$scope.groups_of_leads[i].select_group = !$scope.groups_of_leads[i].select_group;
				var current_group = i;
				break;
			}
		}
		
		for(i=0; i<$scope.groups_of_leads[current_group].leads_list.length; i++){
			$scope.groups_of_leads[current_group].leads_list[i][3] = $scope.groups_of_leads[current_group].select_group;
		}
		$scope.groups_of_leads[current_group].selected_leads_count = $scope.groups_of_leads[current_group].leads_list.length;
		
		// set selected_leads_count overall
		$scope.setSelectedLeadsCount();

	};

	/* ******************* Test Group for Lead ************************/
	$scope.testGroupForLead = function(lead){
		console.log("testGroupForLead");
		
		// set selected_leads_count for corresponding group
		var group_id = lead[2];
		for(var i=0; i<$scope.groups_of_leads.length; i++){
			if($scope.groups_of_leads[i].group_id == group_id)
				break;
		}

		var current_group = i;
		var all_true = true;
		var all_false = true;
		var selected_leads_count = 0;
		for(var i=0; i<$scope.groups_of_leads[current_group].leads_list.length; i++){
			if($scope.groups_of_leads[current_group].leads_list[i][3] == true){
				all_false = false;
				selected_leads_count++;
			}
			else
				all_true = false;
		}
		
		if(all_false == true)
			$scope.groups_of_leads[current_group].select_group = false;
		else
			$scope.groups_of_leads[current_group].select_group = true;
			
		$scope.groups_of_leads[current_group].selected_leads_count = selected_leads_count;
		
		// set selected_leads_count overall
		$scope.setSelectedLeadsCount();
	};

	/* ****************** Set Selected Leads Count *********************/
	$scope.setSelectedLeadsCount = function(){
		console.log("setSelectedLeadsCount");
		
		selected_leads_count = 0;
		for(var i=0; i<$scope.leads_list.length; i++){
			if($scope.leads_list[i][3] == true)
				selected_leads_count++;
		}
		$scope.selected_leads_count = selected_leads_count;
	};

	/* ******************* Expand-Collapse Group ***********************/
	$scope.expandAll = function(group){
		for(i=0; i<$scope.groups_of_leads.length; i++){
			if(!$scope.groups_of_leads[i].leads_empty)
				$scope.groups_of_leads[i].visible = true;
		}
	};

	$scope.collapseAll = function(group){
		for(i=0; i<$scope.groups_of_leads.length; i++){
			if(!$scope.groups_of_leads[i].leads_empty)
				$scope.groups_of_leads[i].visible = false;
		}
	};

	/* ********************** Invitation Box **************************/
	$scope.toggleInvite = function(){
		$scope.scrollBottom();
		$scope.email_address = '';
		$scope.show_invitation_box = !$scope.show_invitation_box;
	};
	
	$scope.sendInvitation = function() {
		console.log("sendInvitation");
		
		var email_address = $scope.email_address;
		$scope.email_address = '';
		var invitation_url = "/invite?email=" + email_address;
		$http({method:'GET', url:invitation_url})
		.success(function(data) {
			$scope.createDialog("#invitation_sent");
		})
		.error(function() {
			$scope.createDialog("#http_error");
		});
	};

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
		console.log("signIn");

		if($scope.login_username == '' || $scope.login_password == '') {
			$scope.createDialog("#both_username_password_error");
			return;
		}

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
					
				// enable "SEARCH" button again
				$scope.enable_search = false;
				
				// scroll to the TOP of the page
				$scope.scrollTop();
				
				// select all leads initially
				$scope.selectAllLeads();
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
		console.log("signOut");
		
		// delete cookie
		delete $cookies.leadsApp;
		$scope.show_search_form = true;
		$scope.show_people_search = false;
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

		// scroll to the TOP of the page
		$scope.scrollTop();

	};

	/* ************************ Results Back **************************/
	$scope.resultsBack = function() {
		console.log("resultsBack");
		
		// stop pending requests
		$scope.stopRequests();
				
		$scope.show_people_search = true;
		$scope.show_results = false;
	};

	/* ************************ Search Again **************************/
	$scope.searchAgain = function() {
		console.log("searchAgain");
		
		$scope.show_search_form = true;
		$scope.show_people_search = false;
		$scope.show_results = false;		
		$scope.resetProgressBar();
		$scope.stopRequests();
		$scope.enable_search = false;
	};

	/* ********************** PeopleSearchBack ************************/
	$scope.peopleSearchBack = function() {
		console.log("peopleSearchBack");
		
		$scope.show_search_form = true;
		$scope.show_people_search = false;
		$scope.show_results = false;
		$scope.enable_search = false;
		$scope.stopRequests();
		$scope.resetProgressBar();
		
		$scope.people_search_profiles = [];
		$scope.people_search_selected_all = false;
		$scope.people_search_selected_count = 0;
	};

	/* ************************* The Search ***************************/
	$scope.theSearch = function() {
		console.log("theSearch");

		$scope.enable_search = true;
		$scope.selected_leads_count = 0;
		// count number of selected leads
		var count = 0;
		for(var i=0;i<$scope.leads_list.length;i++)
			if($scope.leads_list[i][3] == true)
				count++;
		
		$scope.selected_leads_count = count;
		
		$scope.peopleSearch();
	};
	
	/* *********************** People Search **************************/
	$scope.peopleSearch = function() {
		console.log("peopleSearch");

		// check if required search parameters are provided
		if($scope.cname == '') {
			if($scope.fname == '' || $scope.lname == '') {
				$scope.createDialog("#both_fname_lname_error");
				$scope.enable_search = false;
				return;
			}
		}

		$scope.people_search_busy = true;

		//to store profiles of all people from search results
		$scope.people_search_profiles = [];
		$scope.people_search_start = 0;
		$scope.people_search_end = 0;
		var list_of_ids = [];
		var search_url = "/search?fname=" + $scope.fname + "&lname=" + $scope.lname + "&cname=" + $scope.cname + "&start=" + $scope.people_search_start;
		
		$http({method:'GET', url:search_url})
		.success(function(data) {
			
			// check if Throttle Limit is reached
			if('errorCode' in data)
				if('message' in data && data.message == 'Throttle limit for calls to this resource is reached.') {
					$scope.enable_search = false;
					$scope.createDialog("#throttle_limit_reached");
					return;
				}
			
			$scope.people_search = data;
			$scope.people_search_end = data.people._total;
			if(!$scope.people_search.people._total) {
				$scope.enable_search = false;

				if($scope.cname == '')
					$scope.createDialog("#not_on_linkedin_without_cname");

				else if($scope.fname == '' && $scope.lname == '')
					$scope.createDialog("#not_on_linkedin_only_cname");

				else {
					$scope.createDialog("#not_on_linkedin_with_cname");
				}
			}
			else {
				// change DIVs
				$scope.show_search_form = false;
				$scope.show_people_search = true;
				$scope.done_searching = false;
				
				// create temp array of ids and call getProfiles
				for(var i=0;i<$scope.people_search.people.values.length;i++)
					list_of_ids.push($scope.people_search.people.values[i].id);
				
				$scope.getSearchedPeopleProfiles(list_of_ids);
			}
		})
		.error(function() {
			$scope.createDialog("#http_error");
			$scope.enable_search = false;
		});
	};

	/* ********************* People Search More ************************/
	$scope.peopleSearchMore = function() {
		console.log("peopleSearchMore");
		
		var list_of_ids = [];
		var count = 10;
		$scope.people_search_start = $scope.people_search_start + count;

		if($scope.people_search_start >= $scope.people_search.people._total) {
			$scope.createDialog("#no_more_results");
			return;
		}

		$scope.people_search_busy = true;

		var search_url = "/search?fname=" + $scope.fname + "&lname=" + $scope.lname + "&cname=" + $scope.cname + "&start=" + $scope.people_search_start;
		$http({method:'GET', url:search_url})
		.success(function(data) {

			$scope.people_search = data;
			
			if($scope.people_search_start > data.people._total)
				$scope.people_search_busy = false;
			else {
				// create temp array of ids and call getProfiles
				for(var i=0;i<$scope.people_search.people.values.length;i++)
					list_of_ids.push($scope.people_search.people.values[i].id);
				
				$scope.getSearchedPeopleProfiles(list_of_ids);				
			}
		})
		.error(function() {
			$scope.createDialog("#http_error");
		});
	};
	
	/* ****************** Get PEOPLE_SEARCH Profiles ******************/
	$scope.getSearchedPeopleProfiles = function(list_of_ids) {
		console.log("getSearchedPeopleProfiles");
		//console.log(list_of_ids);
		
		$scope.canceler = [];
		$scope.promises = [];
		var promises = [];

		$scope.canceler.push($q.defer());
		
		for(var i=0;i<list_of_ids.length;i++) {
			var profile_id = list_of_ids[i];
			var fetch_profile_random_url = "/fetch_profile_random?profile_id=" + profile_id;
			
			$scope.canceler.push($q.defer());
			
			var promise = $http({method:'GET', url:fetch_profile_random_url, timeout: $scope.canceler[i].promise})
			.success(function(data) {

				// add default profile picture for connections under degree 3
				if(!('pictureUrl' in data)) {
					data.pictureUrl = '/static/img/ghost_profile.png';
				}
				
				if(!('errorCode' in data)) {
					
					// test for duplicate entry first
					var already_present = false;
					for(var i=0; i<$scope.people_search_profiles.length; i++)
						if($scope.people_search_profiles[i].id == data.id) {
							console.log("duplicate entry");
							already_present = true;
							break;
						}
					
					if(!already_present)
						$scope.people_search_profiles.push(data);
				}
				
			})
			.error(function() {
				// nothing to do....
			});
		
			$scope.promises.push(promise);
		}
		
		$q.all($scope.promises).then(function() {
			$scope.people_search_busy = false;
		});
	};

	/* ****************** Toggle Select Person ************************/
	$scope.toggleSelectPerson = function(person){
		person.selected = !person.selected;
		$scope.testPeopleSearchAllNone();
	};

	/* **************** Test PeopleSearch All None *********************/
	$scope.testPeopleSearchAllNone = function(){
		console.log("testPeopleSearchAllNone");
		
		var current_group = i;
		var all_true = true;
		var all_false = true;
		var selected_persons_count = 0;
		for(var i=0; i<$scope.people_search_profiles.length; i++){
			if($scope.people_search_profiles[i].selected == true){
				all_false = false;
				selected_persons_count++;
			}
			else
				all_true = false;
		}
		
		if(all_false == true)
			$scope.people_search_selected_all = false;
		else
			$scope.people_search_selected_all = true;
			
		$scope.people_search_selected_count = selected_persons_count;
	};

	/* **************** Toggle Select PeopleSearch *********************/
	$scope.toggleSelectPeopleSearch = function(){
		console.log("toggleSelectPeopleSearch");

		$scope.people_search_selected_all = !$scope.people_search_selected_all;
		
		for(var i=0; i<$scope.people_search_profiles.length; i++)
			$scope.people_search_profiles[i].selected = $scope.people_search_selected_all;
			
		if($scope.people_search_selected_all)
			$scope.people_search_selected_count = $scope.people_search_profiles.length;
		else
			$scope.people_search_selected_count = 0;
	};

	/* *********************** PeopleSearchGo *************************/
	$scope.peopleSearchGo = function() {
		console.log("peopleSearchGo");

		if($scope.people_search_selected_count == 0) {
			$scope.createDialog("#at_least_one_person");
			return;
		}
		
		// cancel pending requests of people-search
		$scope.stopRequests();
		
		// reset progressbar
		$scope.finishProgressBar();

		$scope.show_people_search = false;
		$scope.show_results = true;
		
		$scope.findConnections();
	};

	/* ********************** Find Connections ************************/

	$scope.findConnections = function() {
		console.log("findConnections");
		
		$scope.show_search_form = false;
		$scope.show_results = true;

		$scope.done_searching = false;
		$scope.progress = 0;
		$scope.total_xhr = 0;
		$scope.current_xhr = 0;

		$scope.people_search_ids = [];
		for(var i=0; i<$scope.people_search_profiles.length; i++)
			if($scope.people_search_profiles[i].selected == true)
				$scope.people_search_ids.push($scope.people_search_profiles[i].id);
		
		var profile_id="";
		var fetch_profile_url="";
		var total_leads = $scope.selected_leads_count;
		var numResults = $scope.people_search_ids.length;
		var total_calls = total_leads * numResults;
		
		$scope.current_lead="";
		$scope.connections.all=[];
		$scope.connections.first=[];
		$scope.connections.second=[];
		$scope.connections.third=[];
		
		// find total number of http requests
		$scope.total_xhr = $scope.calculateTotalCalls();
		//alert("Total calls : " + $scope.total_xhr);

		// call batched form of findConnections
		$scope.findConnectionsBatched(0, total_leads, numResults);
	};
	
	/* ****************** Find Connections Batched *********************/

	$scope.findConnectionsBatched = function(lead_number, total_leads, numResults) {
		console.log("findConnectionsBatched");

		$scope.canceler = [];
		$scope.promises = [];
		
		console.log("lead_number = " + lead_number)
		console.log("total_leads = " + total_leads)
		
		if(lead_number == total_leads)
			return;

		else {

			for(var i=0; i<numResults; i++) {
				
				var lead_num_str = $scope.leads_list[lead_number][0];
				profile_id = $scope.people_search_ids[i];
				fetch_profile_url = "/fetch_profile?lead_number=" + lead_num_str + "&profile_id=" + profile_id;
					
				$scope.canceler.push($q.defer());
				
				var promise = $http({method:'GET', url:fetch_profile_url, timeout: $scope.canceler[i].promise})
					.success(function(data) {
						
						$scope.safeApply(function() {
							$scope.current_xhr++;
							$scope.progress = ($scope.current_xhr / $scope.total_xhr)*100;
							if(!$scope.done_searching)
								$scope.setProgressBar();					
							
							// add default profile picture for connections under degree 3
							if(!('pictureUrl' in data) && data.distance <= 3 && data.distance > 0) {
								data.pictureUrl = '/static/img/ghost_profile.png';
							}
							$scope.current_lead = data.through;
							
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
						});
					})
					.error(function() {
						$scope.safeApply(function() {
							$scope.current_xhr++;
							$scope.progress = ($scope.current_xhr / $scope.total_xhr)*100;
							
							if(!$scope.done_searching)
								$scope.setProgressBar();					
						});
					});

				$scope.promises.push(promise);
			}
		
			// call next batch of AJAX requests only when all requests from current batch are resolved
			$q.all($scope.promises).then(function() {
				//$scope.setProgressBar();
				lead_number++;
				$scope.findConnectionsBatched(lead_number, total_leads, numResults);
			});
		}
	};
	
	/* ************************* View Profile *************************/
	
	$scope.viewProfile = function (connection) {
		console.log("viewProfile");
		
		if(connection.publicProfileUrl) {
			window.$windowScope = $scope;
			window.open(connection.publicProfileUrl,
						'frame',
						'resizeable,top=200,left=200,height=500,width=700');
		}
		else
			$scope.createDialog("#url_undefined");
	};
	
	/* ********************** View Connections ************************/

	$scope.viewConnections = function (connection) {
		console.log("viewConnections");
		
		var max_connections = 10;
		
		$scope.common_connections = [];
		var count = connection.relationToViewer.connections._total;
		if(count > max_connections)
			count = max_connections;
			
		for(var i=0; i<count; i++) {
			var first_name = connection.relationToViewer.connections.values[i].person.firstName;
			var last_name = connection.relationToViewer.connections.values[i].person.lastName;
			if(first_name != "private" || last_name != "private")
				$scope.common_connections.push(first_name + " " + last_name);
		}

		if($scope.common_connections.length == 0)
			$scope.createDialog("#common_connections_are_private");
		else {
			$scope.createDialog("#common_connections");
		}
	};

	/* ********************** Calculate Progress **********************/
	$scope.calculateTotalCalls = function() {
		console.log("calculateTotalCalls");
		
		return $scope.selected_leads_count * $scope.people_search_ids.length;
	};

	/* ************************* Progress Bar *************************/

	$scope.setProgressBar = function() {
		console.log("setProgressBar");
		
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
			
		//console.log("inside set progressbar with progress = " + $scope.progress);
	};
	
	/* ********************* Reset ProgressBar ************************/
	
	$scope.resetProgressBar = function() {
		console.log("resetProgressBar");
		
		$scope.safeApply(function() {
			
			// reset progress
			$scope.progress = 0;
			$scope.setProgressBar();							
		});
	};
	
	/* ******************* Finish ProgressBar ***********************/
	
	$scope.finishProgressBar = function() {
		console.log("finishProgressBar");
		
		$scope.safeApply(function() {
			
			// finish progress
			$scope.progress = 100;
			$scope.setProgressBar();							
		});
	};

	/* ********************* Clear Search Box *************************/
	
	$scope.clearSearchBox = function() {
		$scope.leads_filter = '';
	};

	/* ******************** Scroll Top Element ************************/
	
	$scope.scrollTop = function() {
		$('html, body').animate({scrollTop: '0px'}, 0);
	};

	/* ******************* Scroll Bottom Element **********************/
	
	$scope.scrollBottom = function() {
		//$('html, body').animate({scrollTop: $(document).height()}, 0);
	};

	/* ********************* Test XHRs *************************/
	
	$scope.testXhrs = function() {

		var test_xhrs_url = '/xhr?parameter=' + 11;
		var init_promise = 
		$http({method:'GET', url:test_xhrs_url})
			.success(function(data, status, headers, config) {
				$scope.test_data = data;
				console.log($scope.test_data);
			})
			.error(function() {
				$scope.createDialog("#http_error");
			});

		init_promise.then(function() {
			var i=0;
			$scope.testSingleXhr(i);
		});

	};
	
	$scope.testSingleXhr = function(i) {

		if(i==5)
			return;

		var test_xhrs_url = '/xhr?parameter=' + i.toString();

		$http({method:'GET', url:test_xhrs_url})
		.success(function(data, status, headers, config) {
			$scope.test_data = data;
			console.log($scope.test_data);
			
			$scope.testSingleXhr(i+1);
		})
		.error(function() {
			$scope.createDialog("#http_error");
			
			$scope.testSingleXhr(i+1);
		});
	};
	
	/* ********************* Typeahead Example ************************/

	$scope.startsWith = function(name, viewValue) {
	  return name.substr(0, viewValue.length).toLowerCase() == viewValue.toLowerCase();
	} 

	$scope.TypeaheadCtrl = function ($scope) {
		$scope.email_address = '';
		$scope.emails = ['sangram.s.kapre@gmail.com', 'sangram.kapre@gslab.com', 'aashish@gslab.com', 'amol.pujari@gslab.com', 'example@gslab.com'];
	};

	/* ********************* Typeahead Example ************************/
	
	$scope.testInfiniteScroll = function() {
		if($scope.show_people_search)
			console.log("reached bottom....");
	};
	
}]);

