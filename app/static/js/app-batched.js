/*	Leads' Network
 *	
 *	main module : leadsApp
 *	
 *	controllers  : containerCtrl
 *	
 */

var leadsApp = angular.module('leadsApp', ['ui.bootstrap', 'ngCookies']);

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
	$scope.both_fname_lname = true;
	$scope.enable_search = false;

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


	/* ************************ Select Leads **************************/

	$scope.leadsDiv = function() {
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
	
	$scope.selectAll = function() {
		for(var i=0;i<$scope.leads_list.length;i++)
			$scope.leads_list[i][3] = true;
			
		for(var i=0;i<$scope.groups_of_leads.length;i++){
			$scope.groups_of_leads[i].select_group = true;
			$scope.groups_of_leads[i].selected_leads_count = $scope.groups_of_leads[i].leads_list.length;
		}
	};
	
	$scope.selectNone = function() {
		for(var i=0;i<$scope.leads_list.length;i++)
			$scope.leads_list[i][3] = false;		
			
		for(var i=0;i<$scope.groups_of_leads.length;i++){
			$scope.groups_of_leads[i].select_group = false;
			$scope.groups_of_leads[i].selected_leads_count = 0;
		}
	};

	
	$scope.selectBack = function() {
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
	
	/* ************************* Add Account **************************/
	
	$scope.addAccount = function() {

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
		$scope.searchAgain();
		$scope.scrollTop();
	};

	/* *********************** Return Groups **************************/

	// get the list groups of leads from backend DB
	$scope.returnGroups = function() {
		
		var groups_url = '/return_groups';
		$http({method:'GET', url:groups_url})
		.success(function(data) {
			$scope.groups_list = data;
			
			$scope.initGroups();
		});
	};

	/* ********************* Initialize Groups ************************/

	$scope.initGroups = function() {
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
		
		//console.log($scope.groups_of_leads);
	};
	
	$scope.getDisplayNameFromName = function(name){
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
	};

	/* ******************* Test Group for Lead ************************/
	$scope.testGroupForLead = function(lead){
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

	/* ************************* Start All ****************************/

	$scope.startAll = function() {
		$scope.returnGroups();
		$scope.initGroups();
		$scope.returnLeads();
		$scope.fillGroups();
	};
	
	//$scope.startAll();
	$scope.returnGroups();

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
				$scope.selectAll();
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

		// scroll to the TOP of the page
		$scope.scrollTop();

	};

	/* ************************ Search Again **************************/
	$scope.searchAgain = function() {
		$scope.show_search_form = true;
		$scope.show_results = false;		
		$scope.resetProgressBar();
		$scope.stopRequests();
		$scope.enable_search = false;
	};

	/* ************************* The Search ***************************/
	$scope.theSearch = function() {

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
		if($scope.both_fname_lname == true)
			if($scope.fname == '' || $scope.lname == '') {
				$scope.createDialog("#both_fname_lname_error");
				$scope.enable_search = false;
				return;
			}

		var search_url = "/search?fname=" + $scope.fname + "&lname=" + $scope.lname + "&cname=" + $scope.cname;
		$http({method:'GET', url:search_url})
		.success(function(data) {
			$scope.data = data;
			if(!$scope.data.numResults) {
				$scope.enable_search = false;
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
		})
		.error(function() {
			$scope.createDialog("#http_error");
			$scope.enable_search = false;
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
		
		// find total number of http requests
		$scope.total_xhr = $scope.calculateTotalCalls();
		//alert("Total calls : " + $scope.total_xhr);

		// call batched form of findConnections
		$scope.findConnectionsBatched(0, total_leads, numResults);
	};
	
	/* ****************** Find Connections Batched *********************/

	$scope.findConnectionsBatched = function(lead_number, total_leads, numResults) {

		$scope.canceler = [];
		$scope.promises = [];
		
		if(lead_number==total_leads)
			return;
		
		else if($scope.leads_list[lead_number][3] == true){
			
			// initialize canceler and promises
			
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
		
		else {
			// current lead is not selected, move on to next lead
			lead_number++;
			$scope.findConnectionsBatched(lead_number, total_leads, numResults);
		}
	};
	
	/* ************************* View Profile *************************/
	
	$scope.viewProfile = function (connection) {
		
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
			alert("Names of common connections are private!");
		else {
			$scope.createDialog("#common_connections");
		}
	};

	/* ********************** Calculate Progress **********************/
	$scope.calculateTotalCalls = function() {
		
		var selected_leads = 0;
		for(var i = 0; i < $scope.leads_list.length; i++){
			if($scope.leads_list[i][3] == true)
				selected_leads++;
		}
		
		var numResults = $scope.data.numResults;
		if (numResults > 25)
			numResults = 25;
		
		return selected_leads * (numResults);
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
			
		//console.log("inside set progressbar with progress = " + $scope.progress);
	};
	
	/* ********************* Reset ProgressBar ************************/
	
	$scope.resetProgressBar = function() {
		$scope.safeApply(function() {
			
			// reset progress
			$scope.progress = 0;
			$scope.setProgressBar();							
		});
	};
	
	/* ******************* Finish ProgressBar ***********************/
	
	$scope.finishProgressBar = function() {
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

	/* ********************* Toggle Leads Div *************************/
	
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
	
}]);
