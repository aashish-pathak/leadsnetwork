#!flask/bin/python

from flask import Flask, jsonify, abort, request, make_response, send_file, json, redirect, session
import oauth2 as oauth
import time
import ConfigParser
from linkedin import *

Config = ConfigParser.ConfigParser()
Config.read('conf/app.conf')

url_self = Config.get("LinkedIn","url_self")
url_people = Config.get("LinkedIn","url_people")
#url_profile = "http://api.linkedin.com/v1/people/id=LbowShTBOI:(id,first-name,last-name,distance)?format=json"
url_profile = Config.get("LinkedIn","url_profile")
url_connectoins = Config.get("LinkedIn","url_connectoins")
url_search = str(Config.get("LinkedIn","url_search"))


consumer_key = Config.get("LinkedIn","consumer_key")
consumer_secret = Config.get("LinkedIn","consumer_secret")
oauth_token_key = "3ca90774-1d55-4a9d-be55-073e176d3f00"
oauth_token_secret = "4aaaa49b-582f-41da-8e66-09f6aa7a356f"

#oauth_token_key    = "8ad3a274-0438-4224-ac72-8866f977bdf4"
#oauth_token_secret = "30d86c51-5898-4f76-bc61-309e3bb0da8b"

#oauth_token_key    = "3ca90774-1d55-4a9d-be55-073e176d3f00"
#oauth_token_secret = "4aaaa49b-582f-41da-8e66-09f6aa7a356f"

consumer = oauth.Consumer(
     key=consumer_key,
     secret=consumer_secret)
     
token = oauth.Token(
     key=oauth_token_key,
     secret=oauth_token_secret)

client = oauth.Client(consumer, token)

app = Flask(__name__)

#########################__SEND FILES__#################################
"""
@app.route('/jquery_js')
def jquery_js():
	return send_file('static/js/jquery.js')

@app.route('/angular_js')
def angular_js():
	return send_file('static/lib/angular/angular.js')

@app.route('/angular_cookies_js')
def angular_cookies_js():
	return send_file('static/lib/angular/angular-cookies.js')

@app.route('/ui_bootstrap_js')
def ui_bootstrap_js():
	return send_file('static/lib/ui-bootstrap/ui-bootstrap-0.6.0.js')
	
@app.route('/ui_bootstrap_tpls_js')
def ui_bootstrap_tpls_js():
	return send_file('static/lib/ui-bootstrap/ui-bootstrap-tpls-0.6.0.js')

@app.route('/bootstrap_js')
def bootstrap_js():
	return send_file('static/lib/bootstrap/dist/js/bootstrap.js')

@app.route('/app_js')
def app_js():
	return send_file('static/js/app.js')

@app.route('/app_css')
def app_css():
	return send_file('static/css/app.css')

@app.route('/bootstrap_css')
def bootstrap_min_css():
	return send_file('static/lib/bootstrap/dist/css/bootstrap.css')

@app.route('/bootstrap_responsive_css')
def bootstrap_responsive_min_css():
	return send_file('static/lib/ui-bootstrap/assets/bootstrap-responsive.css')

@app.route('/leads13')
def leads13():
	return send_file('static/img/leads13.jpg')
"""

#########################__APP ROUTES__#################################
########################################################################
########################################################################
#########################__RETURN_LEADS__###############################

# create leads_json and return
@app.route('/return_leads')
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

############################__LOG IN__##################################

@app.route('/login', methods=['POST'])
def login():
	
	global Config

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
"""
	if username == 'sangram' and password == 'kapre':
		return jsonify({'response':True, 'name':username})
		
	elif username == 'aashish' and password == 'pathak':
		return jsonify({'response':True, 'name':username})
		
	else:
		return jsonify({'response':False})
"""

############################__ADD ACCOUNT__#############################

@app.route('/add_account')
def add_account():
	
	l = LinkedinAPI(api_key='l1p7t6tnzjwi',
					api_secret='YJX1CKQeGGXsUyOF',
					callback_url='http://localhost:5000/callback',
					permissions=["r_network"])
	
	auth_props = l.get_authentication_tokens()
	auth_url = auth_props['auth_url']

	#Store this token in a session or something for later use in the next step.
	oauth_token_secret = auth_props['oauth_token_secret']

	session['oauth_token_secret'] = oauth_token_secret
#	session['linkedin_session_keys']['oauth_token_secret'] = oauth_token_secret

	print 'Connect with LinkedIn via: %s' % auth_url
	
	return auth_url

############################__CALLBACK__################################

@app.route('/callback')
def callback():
		
	print request.args.get('oauth_token')
	print request.args.get('oauth_verifier')
	
	access_token_url = 'https://api.linkedin.com/uas/oauth/accessToken'
	oauth_token = request.args.get('oauth_token')
	oauth_verifier = request.args.get('oauth_verifier')

	consumer_key = Config.get("LinkedIn","consumer_key")
	consumer_secret = Config.get("LinkedIn","consumer_secret")
#	oauth_token_key = "8ad3a274-0438-4224-ac72-8866f977bdf4"
#	oauth_token_secret = "30d86c51-5898-4f76-bc61-309e3bb0da8b"


	#Initiate the LinkedIn class in your callback.
	l = LinkedinAPI(api_key=consumer_key,
				  api_secret=consumer_secret,
				  oauth_token=oauth_token,
				  oauth_token_secret=session['oauth_token_secret'])

	authorized_tokens = l.get_access_token(oauth_verifier)

	print authorized_tokens

	
	"""
	consumer = oauth.Consumer(
		 key=consumer_key,
		 secret=consumer_secret)
		 
	token = oauth.Token(
		 key=oauth_token_key,
		 secret=oauth_token_secret)

	client = oauth.Client(consumer, token)
	
	resp, content = client.request('%s?oauth_verifier=%s' % (access_token_url, oauth_verifier), 'POST')
	print dict(parse_qsl(content))
	"""
	return make_response(open('static/index.html').read())

########################__PEOPLE SEARCH API__###########################

# /search?fname=sangram&lname=kapre
@app.route('/search')
def people_search():
	
	import random
	import MySQLdb as mdb

	global Config
	global url_search
	
	consumer_key = Config.get("LinkedIn", "consumer_key")
	consumer_secret = Config.get("LinkedIn", "consumer_secret")
	url_search = Config.get("LinkedIn", "url_search")

	con = mdb.connect('localhost','admin','admin123','find_connections')

	with con:

		fname = request.args.get('fname')
		lname = request.args.get('lname')
		cname = request.args.get('cname')
		
		random_lead = 11
		while random_lead == 11:
			random_lead = random.randint(1,20)

		cur = con.cursor()
		cur.execute("select * from people where id=" + str(random_lead))
		row = cur.fetchone()

		name = row[1]
		token_key = row[3]
		token_secret = row[4]
		
		oauth_token_key = token_key
		oauth_token_secret = token_secret
		
		consumer = oauth.Consumer(
			 key=consumer_key,
			 secret=consumer_secret)

		token = oauth.Token(
			 key=oauth_token_key,
			 secret=oauth_token_secret)

		client = oauth.Client(consumer, token)
	
		if cname == "":
			search_query = "&first-name=" + fname + "&last-name=" + lname
		else:
			search_query = "&first-name=" + fname + "&last-name=" + lname + "&company-name=" + cname
			
		resp, content = client.request(url_search + search_query)
		
		return content

########################__FETCH PROFILE API__###########################

# /fetch_profile?lead_number=1&profile_id=abcd
@app.route('/fetch_profile')
def fetch_profile():

	import MySQLdb as mdb
	import json
	
	# read parameters
	lead_number = request.args.get('lead_number')
	profile_id = request.args.get('profile_id')
	fetch_profile_query = profile_id + ":(id,first-name,last-name,distance,relation-to-viewer)?format=json";

	# get access_token and access_secret from database for lead = lead_number
	con = mdb.connect('localhost','admin','admin123','find_connections')

	with con:

		cur = con.cursor()
		cur.execute("select * from people where id=" + lead_number)
		row = cur.fetchone()

		lead_name = row[1]
		oauth_token_key = row[3]
		oauth_token_secret = row[4]

		token = oauth.Token(key=oauth_token_key,secret=oauth_token_secret)

		client = oauth.Client(consumer, token)
		
		resp, content = client.request(url_profile + fetch_profile_query)

		json_content = json.loads(content)
		json_content['row_type'] = "t" + str(json_content[u'distance'])
		json_content['through'] = lead_name

		return json.dumps(json_content)

########################__APPLICATION ROOT__############################

@app.route('/')
def index():

	return make_response(open('static/index.html').read())
	
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'	

if __name__ == '__main__':
	app.run(debug = True, host='0.0.0.0', port=5000)

