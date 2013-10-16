describe( "Parent Controller", function () {
	
	
	var mockService = {
		someAsyncCall: function (x){
		return 'test_string';
		}
	}
	
	beforeEach(module('myApp'));

	beforeEach(inject(function($rootScope, $controller) {

		this.rootScope = $rootScope;
		$scope = $rootScope.$new();

		ctrl = $controller('parentCtrl', {
		  $scope: $scope,
		  someService: mockService
		});
	}));
	
	it('should start with empty list of leads', function() {
		expect($scope.leads).toEqual("");
	});
	
	it('should get non-empty list of leads after calling return_leads()', function() {
		$scope.return_leads();
		expect($scope.leads).not.toEqual({});
	});
	
	it('should have no canceler at start', function() {
		expect(this.rootScope.canceler.length).toEqual(0);
	});
	
	it('should have no connections fetched initially', function() {
		expect(this.rootScope.connections.first).toEqual({});
	});
	
	it('should open localhost:5000/ on load', function() {
		expect($scope.current_path).toEqual("http://server/");
	});

});

describe( "Login Controller", function () {
	
	var mockService = {
		someAsyncCall: function (x){
		return 'test_string';
		}
	}
	
	beforeEach(module('myApp'));
	
	beforeEach(inject(function($rootScope, $controller) {
		$scope = $rootScope.$new();

		ctrl = $controller('loginCtrl', {
		  $scope: $scope,
		  someService: mockService
		});
	}));
	
	it('should start with empty $scope.data', function() {
		expect($scope.data).toEqual("");
	});
	
	it('should start with empty username', function() {
		expect($scope.username).toEqual("");
	});
	
	it('should start with empty password', function() {
		expect($scope.password).toEqual("");
	});
	
});

describe( "Header Controller", function () {
	
	var mockService = {
		someAsyncCall: function (x){
		return 'test_string';
		}
	}
	
	beforeEach(module('myApp'));
	
	beforeEach(inject(function($rootScope, $controller, $cookies) {
		this.cookies = $cookies;
		this.rootScope = $rootScope;
		$scope = $rootScope.$new();

		ctrl = $controller('headerCtrl', {
		  $scope: $scope,
		  someService: mockService
		});
	}));
	
	it('should clear cookie for an application', function() {
		
	});
});

describe( "Navigation Controller", function () {
	
	var mockService = {
		someAsyncCall: function (x){
		return 'test_string';
		}
	}
	
	beforeEach(module('myApp'));
	
	beforeEach(inject(function($rootScope, $controller) {
		$scope = $rootScope.$new();

		ctrl = $controller('navigationCtrl', {
		  $scope: $scope,
		  someService: mockService
		});
	}));

	it('should start with empty first name', function() {
		expect($scope.fname).toEqual("");
	});
	
	it('should start with empty last name', function() {
		expect($scope.lname).toEqual("");
	});
	
	it('should start with empty company name', function() {
		expect($scope.cname).toEqual("");
	});
	
	beforeEach(inject(function($rootScope, $controller) {
		$scope = $rootScope;
		ctrl = $controller('navigationCtrl', {
		  $scope: $scope,
		  someService: mockService
		});
	}));	

	it('should be able to select all the leads on clicking "Select All"', function() {
		
	});	
	
});

describe( "Content Controller", function () {
	
	var mockService = {
		someAsyncCall: function (x){
		return 'test_string';
		}
	}
	
	beforeEach(module('myApp'));
	
	beforeEach(inject(function($rootScope, $controller) {
		this.rootScope = $rootScope;
		$scope = $rootScope.$new();

		ctrl = $controller('contentCtrl', {
		  $scope: $scope,
		  someService: mockService
		});
	}));

	it('should have no result in result set', function() {
		expect($scope.connections.all.length).toEqual(0);
	});
	
	// create a mock result with test linkedin url.
	var connection = {};
	connection.test_public_url = "http://www.linkedin.com/pub/sangram-kapre/35/282/962";
	
	it('should not progress without starting first http request', function(connection) {
		expect(this.rootScope.progress).toBe(0);
	});
		
	it('should not fire a search query immediately', function(connection) {
		expect(this.rootScope.fire_query).toBe(false);
	});

	it('should not have initial fire_query as true', function(connection) {
		expect(this.rootScope.fire_query).not.toBe(true);
	});
	
	it('should assign rootScope_fname to scope_fname', function(connection) {
		expect(this.rootScope.fname).toBe($scope.fname);
	});

	it('should assign rootScope_lname to scope_lname', function(connection) {
		expect(this.rootScope.lname).toBe($scope.lname);
	});

	it('should assign rootScope_cname to scope_cname', function(connection) {
		expect(this.rootScope.fname).toBe($scope.cname);
	});
	
});
