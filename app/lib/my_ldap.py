from conf import Config
import ldap
from flask import jsonify

class MyLDAP(Config):
	
	def __init__(self):
		super(MyLDAP, self).__init__()
		self.gslab_url = self.get_cfg("LDAP", "gslab_url")
		self.username = None
		self.password = None
		self.username_prefix = "uid="
		self.username_suffix = ",ou=users,ou=gslab.com,dc=gslab"

	def authenticate(self, username, password):
		self.username = self.username_prefix + username + self.username_suffix
		self.password = password
		
		try:
			l = ldap.open(self.gslab_url)
			l.protocol_version = ldap.VERSION3
			l.simple_bind_s(self.username, self.password)
			l.unbind_s()
			print "authenticate()"
			return jsonify({'response':True, 'name':username})			
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
