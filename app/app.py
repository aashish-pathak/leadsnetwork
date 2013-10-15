from flask import Flask, jsonify, abort, request, make_response, send_file, json, redirect, session, render_template

app = Flask(__name__)

#########################__RETURN_LEADS__###############################
@app.route('/return_leads')
def return_leads():

	# read all leads from 'people' table and return their names
	from lib import MySQL
	lead = []
	leads = []
	sql = "select * from people"
	mysql = MySQL()
	rows = mysql.fetch_all(sql)
	for row in rows:
		table_id = row[0]
		name = row[1]
		lead = [table_id, name]
		leads.append(lead)
		
	return json.dumps(leads)

############################__LOG IN__##################################
@app.route('/login', methods=['POST'])
def login():
	
	post_string = request.form.items()[0][0]
	
	username = ((post_string.split(',')[0]).split(':')[1]).split('"')[1]
	password = ((post_string.split(',')[1]).split(':')[1]).split('"')[1]

	from lib import MyLDAP
	ldp = MyLDAP()
	return ldp.authenticate(username, password)

############################__ADD ACCOUNT__#############################
@app.route('/add_account')
def add_account():
	
	from lib import MyLinkedIn
	lnkdin = MyLinkedIn()
	auth_url = lnkdin.get_auth_url()
	print auth_url
	return auth_url	

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
		
		# insert into db
		if 'id' in json_profile.keys():
			linkedin_id = json_profile['id']
			firstName = json_profile['firstName']
			lastName = json_profile['lastName']
			name = firstName + " " + lastName
					
			from lib import MySQL
			mysql = MySQL()
			mysql.insert_into_people(name, linkedin_id, access_token_key, access_token_secret)
			
	return make_response(open('static/index.html').read())

########################__PEOPLE SEARCH API__###########################
@app.route('/search')
def people_search():
	

	# get parameters : fname, lname and cname
	fname = request.args.get('fname')
	lname = request.args.get('lname')
	cname = request.args.get('cname')
	
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
	searched_people = lnkdin.call_people_search(token_key, token_secret, fname, lname, cname)

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

