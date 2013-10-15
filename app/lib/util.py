def get_login_username(post_string):
	return ((post_string.split(',')[0]).split(':')[1]).split('"')[1]

def get_login_password(post_string):
	return ((post_string.split(',')[1]).split(':')[1]).split('"')[1]
