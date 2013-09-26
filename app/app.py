#!flask/bin/python

from flask import Flask, jsonify, abort, request, make_response, send_file
import oauth2 as oauth
import time

url_self = "http://api.linkedin.com/v1/people/~"
url_people = "http://api.linkedin.com/v1/people/id=LbowShTBOI:(id,first-name,last-name,distance)?format=json"
#url_profile = "http://api.linkedin.com/v1/people/id=LbowShTBOI:(id,first-name,last-name,distance)?format=json"
url_profile = "http://api.linkedin.com/v1/people/id="
url_connectoins = "http://api.linkedin.com/v1/people/~/connections"
url_search = "http://api.linkedin.com/v1/people-search"

consumer_key = "l1p7t6tnzjwi"
consumer_secret = "YJX1CKQeGGXsUyOF"

#oauth_token_key    = "8ad3a274-0438-4224-ac72-8866f977bdf4"
#oauth_token_secret = "30d86c51-5898-4f76-bc61-309e3bb0da8b"

oauth_token_key    = "3ca90774-1d55-4a9d-be55-073e176d3f00"
oauth_token_secret = "4aaaa49b-582f-41da-8e66-09f6aa7a356f"

consumer = oauth.Consumer(
     key=consumer_key,
     secret=consumer_secret)
     
token = oauth.Token(
     key=oauth_token_key,
     secret=oauth_token_secret)

client = oauth.Client(consumer, token)

app = Flask(__name__)

# /search?fname=sagar&lname=kapare
@app.route('/search')
def get_info_by_name():

	fname = request.args.get('fname')
	lname = request.args.get('lname')

#	fname = 'sagar'
#	lname = 'kapare'

	search_query = "?count=25&format=json&first-name=" + fname + "&last-name=" + lname
	resp, content = client.request(url_search + search_query)
	
	return content

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
		token_keys = []
		token_secrets = []
		leads = []


		for row in rows:
			names.append(row[1])
			token_keys.append(row[3])
			token_secrets.append(row[4])
			lead = [row[1], row[3], row[4]]
			leads.append(lead)

	#	print leads
#		print json.dumps(leads)
		return json.dumps(leads)
#		return leads
"""
		for name in names:
			pass
	#		print name	

		for key in token_keys:
			pass
	#		print key		

		for secret in token_secrets:
			pass
	#		print secret
"""

############################__LOG IN__##################################

@app.route('/login')
def login():
	username = request.args.get('username')
	password = request.args.get('password')
	if username == 'sangram' and password == 'kapre':
		return jsonify({'response':True, 'name':username})
	elif username == 'aashish' and password == 'pathak':
		return jsonify({'response':True, 'name':username})
	else:
		return jsonify({'response':False})


########################__PEOPLE SEARCH API__###########################

# /search?fname=sangram&lname=kapre
@app.route('/search')
def people_search():
	fname = request.args.get('fname')
	lname = request.args.get('lname')
	search_query = "?format=json&first-name=" + fname + "&last-name=" + lname
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
	fetch_profile_query = profile_id + ":(id,first-name,last-name,distance)?format=json";

	# get access_token and access_secret from database for lead = lead_number
	con = mdb.connect('localhost','admin','admin123','find_connections')

	with con:

		cur = con.cursor()
		cur.execute("select * from people where id=" + lead_number)
		row = cur.fetchone()

		oauth_token_key = row[3]
		oauth_token_secret = row[4]
			
	
		token = oauth.Token(key=oauth_token_key,secret=oauth_token_secret)

		client = oauth.Client(consumer, token)
		
		resp, content = client.request(url_profile + fetch_profile_query)
	
		return content

########################__APPLICATION ROOT__############################

@app.route('/')
def index():
	return make_response(open('static/index.html').read())
	
if __name__ == '__main__':
	app.run(debug = True, host='0.0.0.0', port=5000)

