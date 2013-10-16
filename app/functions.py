#########################__RETURN_LEADS__###############################
def return_leads():
	import MySQLdb as mdb
	import json

	con = mdb.connect('localhost','admin','admin123','find_connections')
	
	with con:

		cur = con.cursor()
		cur.execute("select * from people")
		rows = cur.fetchall()

		names = []
		lead = []
		leads = []

		for row in rows:
			lead = [row[0], row[1]]
			leads.append(lead)

		return json.dumps(leads)
		
	return [-1]

############################__LOG IN__##################################
def login():

	from flask import request, jsonify
	import ConfigParser

	Config = ConfigParser.ConfigParser()
	Config.read('conf/app.conf')
	
	post_string = request.form.items()[0][0]
	username = ((post_string.split(',')[0]).split(':')[1]).split('"')[1]
	password = ((post_string.split(',')[1]).split(':')[1]).split('"')[1]

	#for LDAP credentials
	import ldap

	try:
		ldap_gslab_url = Config.get("LDAP","gslab_url")
		#ldap_url = "ldap.gslab.com"
		ldap_username = "uid=" + username + ",ou=users,ou=gslab.com,dc=gslab"
		ldap_password = password
		l = ldap.open(ldap_gslab_url)
		l.protocol_version = ldap.VERSION3
		l.simple_bind_s(ldap_username, ldap_password)
		l.unbind_s()
		return jsonify({'response':True, 'name':username})
	except ldap.LDAPError as e:
		error = e[0]['desc']

		# for testing purpose
		if username == 'admin' and password == 'admin':
			return jsonify({'response':True, 'name':'Admin'})
			
		if error == 'Can\'t contact LDAP server':
			return jsonify({'response':False, 'name':"Unable to connect to LDAP Server!"})
		if error == 'No such object':
			return jsonify({'response':False, 'name':"Invalid Username!"})
		if error == 'Invalid credentials':
			return jsonify({'response':False, 'name':"Invalid Password!"})
		
		return jsonify({'response':False, 'name':error})

##########################__ADD ACCOUNT__###############################
def add_account():
	pass

##########################__CALLBACK__##################################
def callback():
	pass

##########################__PEOPLE SEARCH__#############################
def people_search():
	pass

##########################__FETCH PROFILE__#############################
def fetch_profile():
	pass

##########################__ADD ACCOUNT__###############################
def add_account():
	pass
