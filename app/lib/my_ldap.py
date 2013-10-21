from conf import Config
import ldap
from flask import jsonify

class MyLDAP(Config):
	
	def __init__(self):
		super(MyLDAP, self).__init__()
		self.baseDN = self.get_cfg("LDAP", "baseDN")
		self.gslab_url_main = self.get_cfg("LDAP", "gslab_url_main")
		self.gslab_url_test = self.get_cfg("LDAP", "gslab_url_test")
		self.username_prefix = self.get_cfg("LDAP", "username_prefix")
		self.username_suffix = self.get_cfg("LDAP", "username_suffix")
		self.application_username = self.get_cfg("LDAP", "application_username")
		self.application_password = self.get_cfg("LDAP", "application_password")
		self.username = None
		self.password = None

	def authenticate(self, username, password):
		self.username = self.username_prefix + username + self.username_suffix
		self.password = password
		print "authenticate()"
		try:
			#l = ldap.open(self.gslab_url_main)
			l = ldap.initialize(self.gslab_url_test)
			l.protocol_version = ldap.VERSION3
			l.simple_bind_s(self.username, self.password)
			l.unbind_s()
			return self.fetch_data(username)
					
		except ldap.LDAPError as e:
			error = e[0]['desc']
			# for testing purpose : admin, admin
			if username == 'admin' and password == 'admin':
				return jsonify({'response':True, 'name':'Admin'})
			if error == 'Can\'t contact LDAP server':
				return jsonify({'response':False, 'name':"Unable to connect to LDAP Server!"})
			if error == 'No such object':
				return jsonify({'response':False, 'name':"Invalid Username!"})
			if error == 'Invalid credentials':
				return jsonify({'response':False, 'name':"Invalid Password!"})
			
			return jsonify({'response':False, 'name':error})

	def fetch_data(self, username):
		print "fetch_data()"
		# authenticate application
		try:
			l = ldap.initialize(self.gslab_url_test)
			l.protocol_version = ldap.VERSION3
			l.simple_bind_s(self.application_username, self.application_password)

			# fetch data from ldap server
			searchScope = ldap.SCOPE_SUBTREE
			retrieveAttributes = None	# to get all attributes
			# Aashish Pathak : gs-0322
			# Amruta Vispute : gs-0646
			# Sangram Kapre  : gs-0668
			searchFilter = "uid=" + username	# get data for username
		
			ldap_result_id = l.search(self.baseDN, searchScope, searchFilter, retrieveAttributes)
			result_set = []
			while 1:
				result_type, result_data = l.result(ldap_result_id, 0)
				if(result_data == []):
					break;
				else:
					if result_type == ldap.RES_SEARCH_ENTRY:
						result_set.append(result_data)
			
			# get employee name
			name = result_set[0][0][1]['cn'][0]
			print name
			l.unbind_s()
			return jsonify({'response':True, 'name':name})
			#print result_set[1]
			#print result_set[2]

		except Exception as e:
			print e
			return jsonify({'response':True, 'name':username})
