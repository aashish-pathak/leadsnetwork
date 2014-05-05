from flask import Flask, jsonify, abort, request, make_response, send_file, json, redirect, session, render_template

app = Flask(__name__)
app.debug = True

@app.route('/test')
def test():
  return "Server is OK!"

#########################__RETURN_GROUPS__##############################
@app.route('/return_groups')
def return_groups():

	# read all leads from 'people' table and return their names
	from lib import MySQL
	group = []
	groups = []
	sql = "select * from groups"
	mysql = MySQL()
	rows = mysql.fetch_all(sql)
	for row in rows:
		group_id = row[0]
		group_name = row[1]
		group = [group_id, group_name]
		groups.append(group)
		
	return json.dumps(groups)

#########################__RETURN_LEADS__###############################
@app.route('/return_leads')
def return_leads():

	# read all leads from 'people' table and return their names
	from lib import MySQL
	lead = []
	leads = []
	sql = "SELECT * FROM people WHERE is_token_expired='no';"
	mysql = MySQL()
	rows = mysql.fetch_all(sql)
	for row in rows:
		table_id = row[0]
		name = row[1]
		group_id = row[7]
		lead = [table_id, name, group_id]
		leads.append(lead)
		
	return json.dumps(leads)

#######################__RETURN_SUGGESTIONS__###########################
@app.route('/return_suggestions')
def return_suggestions():

	# read all leads from 'people' table and return their names
	from lib import MySQL
	mysql = MySQL()
	
	suggestions = {}

	suggestions['fnames'] = []
	sql = "select * from fnames"
	rows = mysql.fetch_all(sql)
	for row in rows:
		suggestions['fnames'].append(row[0])

	suggestions['lnames'] = []
	sql = "select * from lnames"
	rows = mysql.fetch_all(sql)
	for row in rows:
		suggestions['lnames'].append(row[0])

	suggestions['cnames'] = []
	sql = "select * from cnames"
	rows = mysql.fetch_all(sql)
	for row in rows:
		suggestions['cnames'].append(row[0])
			
	return json.dumps(suggestions)

############################__LOG IN__##################################
@app.route('/login', methods=['POST'])
def login():
	
	post_string = request.form.items()[0][0]
	
	username = ((post_string.split(',')[0]).split(':')[1]).split('"')[1]
	password = ((post_string.split(',')[1]).split(':')[1]).split('"')[1]

	from lib import MyLDAP
	ldp = MyLDAP()
	return ldp.authenticate(username, password)

#########################__INVITE PEOPLE__##############################
@app.route('/invite')
def invite():

	email = request.args.get('email')
	
	# check for unused random_string for this email
	from lib import MySQL
	mysql = MySQL()
	query = "SELECT * FROM invitations WHERE email='" + email + "'"
	random_string = ''
	try:
		rows = mysql.fetch_all(query)
		for row in rows:
			if(row[3] == False):
				random_string = row[2]
	except Exception as e:
		print e

	if(random_string == ''):
		import random
		import string
		add_account_parameter = ''.join(random.choice(string.ascii_lowercase + string.ascii_uppercase + string.digits) for x in range(64))
		mysql.insert_into_invitations(email, add_account_parameter)
	else:
		add_account_parameter = random_string

	# generate add_account url
	from lib import Util
	u = Util()
	add_account_url = u.get_application_url() + "add_account/" + add_account_parameter
	
	print add_account_url
	
	# send invitation email
	from lib import Alerts
	emailer = Alerts()
	subject = "Invitation to join \"Leads' In!\""
	text = "Hello, \nPlease follow the link given below to be a part of leads, through which \"Leads' In!\" will try to find nearest possible connections on LinkedIn.\n\n" + add_account_url + "\n\n (You may need to authenticate yourself, if you are not already signed in to LinkedIn.)\n\nThank You, \n\"Leads' In!\" Team."
	emailer.send_invitation_email(email, subject, text)
	
	return jsonify({'response':True, 'email':email})

############################__ADD ACCOUNT__#############################
@app.route('/add_account/<add_account_parameter>')
def add_account(add_account_parameter):

	# auth_url is allowed to be used multiple times
	from lib import MyLinkedIn
	lnkdin = MyLinkedIn()
	auth_url = lnkdin.get_auth_url()
	print auth_url
	return redirect(auth_url)
	
	"""
	# auth_url is allowed to be used only once
	from lib import MySQL
	mysql = MySQL()
	query = "SELECT * FROM invitations WHERE random_string='" + add_account_parameter + "'"
	try:
		row = mysql.fetch_one(query)
		if(row[3] == True):
			return redirect('static/dead_link.html')
		else:
			from lib import MySQL
			mysql = MySQL()
			mysql.update_invitations_set_used(add_account_parameter)

			from lib import MyLinkedIn
			lnkdin = MyLinkedIn()
			auth_url = lnkdin.get_auth_url()
			print auth_url
			return redirect(auth_url)
	except Exception as e:
		print e
	
	return make_response(open('static/dead_link.html').read())
	"""

############################__CALLBACK__################################
@app.route('/callback')
def callback():

	# get oauth token and verifier from http query string
	oauth_token = request.args.get('oauth_token')
	oauth_verifier = request.args.get('oauth_verifier')

	# get authorized_tokens from linkedin
	from lib import MyLinkedIn
	lnkdin = MyLinkedIn()
	authorized_tokens = lnkdin.get_authorized_tokens(oauth_token, oauth_verifier)
		
	# check for oauth_problem and insert into db accordingly
	if 'oauth_problem' in authorized_tokens.keys():
		pass
	else:
		# fetch linkedin profile to get user's info
		access_token_key = authorized_tokens['oauth_token']
		access_token_secret = authorized_tokens['oauth_token_secret']
		lnkdin = MyLinkedIn()
		profile = lnkdin.get_profile_using_token(access_token_key, access_token_secret)
		json_profile = json.loads(profile)
				
		if 'id' in json_profile.keys():
			
			# set parameters
			linkedin_id = json_profile['id']
			firstName = json_profile['firstName']
			lastName = json_profile['lastName']
			name = firstName + " " + lastName
			email = json_profile['emailAddress']
			
			# set current time as token_birth_ts
			import datetime
			token_birth_ts = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

			# insert into db
			from lib import MySQL
			mysql = MySQL()
			mysql.insert_into_people(name, linkedin_id, access_token_key, access_token_secret, token_birth_ts, email)
			
			# get his group-name from ldap server
			from lib import MyLDAP
			ldp = MyLDAP()
			belongs_to = ldp.fetch_data_group_id(name)
			
			# update his/her group_id in database
			mysql.update_group_id(name, belongs_to)
			
			
	return make_response(open('static/index.html').read())

########################__PEOPLE SEARCH API__###########################
@app.route('/search')
def people_search():

	# get parameters : fname, lname and cname
	fname = request.args.get('fname')
	lname = request.args.get('lname')
	cname = request.args.get('cname')
	start = request.args.get('start')
	
	# fetch random lead through which a people_search api will be called	
	from lib import MySQL
	mysql = MySQL()
	row = mysql.fetch_random()
	
	name = row[1]
	token_key = row[3]
	token_secret = row[4]

	# call linkedin api to get the profile
	from lib import MyLinkedIn
	lnkdin = MyLinkedIn()
	lnkdin.create_token(token_key, token_secret)
	lnkdin.prepare_client()
	searched_people = lnkdin.call_people_search(token_key, token_secret, fname, lname, cname, start)

	# insert names into suggestion tables
	searched_people_json = json.loads(searched_people)
	if(u'numResults' in searched_people_json):
		if(searched_people_json[u'numResults'] > 0):
			if(len(fname) > 1):
				mysql.insert_into_fnames(fname)
			if(len(lname) > 1):
				mysql.insert_into_lnames(lname)
			if(len(cname) > 1):
				mysql.insert_into_cnames(cname)

	return searched_people

########################__FETCH PROFILE API__###########################
# /fetch_profile?lead_number=1&profile_id=abcd
@app.route('/fetch_profile')
def fetch_profile():

	# read parameters : lead_number and profile_id
	lead_number = request.args.get('lead_number')
	profile_id = request.args.get('profile_id')

	# get lead's access tokens from 'people' table
	from lib import MySQL
	sql = "select * from people where id=" + lead_number
	mysql = MySQL()
	row = mysql.fetch_one(sql)
	lead_name = row[1]
	oauth_token_key = row[3]
	oauth_token_secret = row[4]

	# fetch profile with 'profile_id' through corresponding lead's 'access_tokens'
	from lib import MyLinkedIn
	lnkdin = MyLinkedIn()
	profile = lnkdin.get_profile_using_id(oauth_token_key, oauth_token_secret, profile_id)
	json_profile = json.loads(profile)
	
	# add 'row_type' and 'through'
	try:
		json_profile['row_type'] = "t" + str(json_profile[u'distance'])
	except KeyError:
		json_profile['row_type'] = "distance_absent"
		
	json_profile['through'] = lead_name
	
	return json.dumps(json_profile)

#####################__FETCH PROFILE RANDOM API__#######################
# /fetch_profile_random?profile_id=abcd
@app.route('/fetch_profile_random')
def fetch_profile_random():

	# read parameter : profile_id
	profile_id = request.args.get('profile_id')

	# fetch random lead through which a profile will be fetched
	from lib import MySQL
	mysql = MySQL()
	row = mysql.fetch_random()
	
	name = row[1]
	oauth_token_key = row[3]
	oauth_token_secret = row[4]

	# fetch profile with 'profile_id' through corresponding lead's 'access_tokens'
	from lib import MyLinkedIn
	lnkdin = MyLinkedIn()
	profile = lnkdin.get_profile_using_id_random(oauth_token_key, oauth_token_secret, profile_id)
	json_profile = json.loads(profile)
	
	json_profile['selected'] = False

	return json.dumps(json_profile)


#########################__GENERATE REPORT__############################
@app.route('/report', methods=['POST'])
def generate_report():
	
	# extract post_string from HTTP request
	post_string = request.form.items()[0][0]

	# convert it to JSON
	json_post_string = json.loads(post_string)

	# extract query_name (which will be a filename too)
	query_name = str(json_post_string[u'query_name'])

	# extract record data in JSON format
	json_record_data = json.loads(json_post_string[u'report_data'])

	# store final result in a list result_set
	result_set = []
	result_single = []

	# for each record in record_data, extract distance, through and connections and push them a in LIST
	import unicodedata
	for json_record in json_record_data:
		result_single = []

		result_single.append(json_record[u'distance'])

		result_single.append(unicodedata.normalize('NFKD', json_record[u'through']).encode('ascii','ignore'))		

		result_single_connections = []
		for connection in json_record[u'relationToViewer'][u'connections'][u'values']:
			connection_string = unicodedata.normalize('NFKD', connection[u'person'][u'firstName'] + ' ' + connection[u'person'][u'lastName']).encode('ascii','ignore')
			if(connection_string != 'private private'):
				result_single_connections.append(connection_string)
		
		result_single.append(result_single_connections)

		result_set.append(result_single)

	# sort result_set based on distance
	from operator import itemgetter
	result_set.sort(key=itemgetter(0))

	# write to a file
	report_url = 'static/reports/' + query_name.replace(' ','-') + '.csv'
	report_file = open(report_url, 'w')
	report_file.write("Degree,Connected through,Reachable via\n")
	for record in result_set:
		report_file.write(str(record[0]) + ',' + record[1] + ',')
		for connection_string in record[2]:
			report_file.write(connection_string + ';  ')
		report_file.write('\n')

	return jsonify({'report_url' : report_url})

###########################__For Testing Multiple AJAX Requests__###############################
@app.route('/xhr')
def xhr():
	
	import time
	time.sleep(2)
	
	parameter = request.args.get('parameter')	
	return jsonify({'parameter' : parameter})

###########################__Index Page__###############################
@app.route('/')
def index():
	
	return make_response(open('static/index.html').read())

########################__APPLICATION ROOT__############################

app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'	
@app.route('/', defaults={'path':''})
@app.route('/<path:path>')
def catch_all(path):
	return make_response(open('static/index.html').read())

if __name__ == '__main__':
	app.run(debug = True, host='0.0.0.0', port=5000)

