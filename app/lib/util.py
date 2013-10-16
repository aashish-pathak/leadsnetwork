def print_test():
	print "sangramkapre"
	
def get_login_username(post_string):
	return ((post_string.split(',')[0]).split(':')[1]).split('"')[1]

def get_login_password(post_string):
	return ((post_string.split(',')[1]).split(':')[1]).split('"')[1]
	
def add_row_type(profile):
	try:
		profile['row_type'] = "t" + str(profile[u'distance'])
	except KeyError:
		profile['row_type'] = "distance_absent"
	return profile

def add_through(profile, lead_name):
	profile['through'] = lead_name
	return profile
