from conf import Config
from linkedin import *
from flask import session
import oauth2 as oauth

class MyLinkedIn(Config):
	
	def __init__(self):
		super(MyLinkedIn, self).__init__()
		self.consumer_key = self.get_cfg("LinkedIn", "consumer_key")
		self.consumer_secret = self.get_cfg("LinkedIn", "consumer_secret")
		self.__create_consumer()
    
	def __create_consumer(self):
		self.consumer = oauth.Consumer(
						key    = self.consumer_key,
						secret = self.consumer_secret)

	def create_token(self, oauth_key, oauth_secret):
		self.token = oauth.Token(
				key    = oauth_key,
				secret = oauth_secret)
		print "create_token()"

	def prepare_client(self):
		self.client = oauth.Client(self.consumer, self.token)
		print "prepare_client()"

	def call_people_search(self, oauth_key, oauth_secret, first_name, last_name, company_name):
		self.url_search = self.get_cfg("LinkedIn", "url_search")
		self.create_token(oauth_key, oauth_secret)
		self.prepare_client()
		search_query = ""
		
		if first_name != "":
			search_query += "&first-name=" + first_name 
		if last_name != "":
			search_query += "&last-name=" + last_name
		if company_name != "":
			search_query += "&company-name=" + company_name
			
		resp, content = self.client.request(self.url_search + search_query)
		print "call_people_search()"
		return content

	def get_profile_using_id(self, oauth_key, oauth_secret, profile_id):
		self.url_profile = self.get_cfg("LinkedIn", "url_profile")
		self.create_token(oauth_key, oauth_secret)
		self.prepare_client()
		self.fetch_profile_query = profile_id + ":(id,first-name,last-name,distance,relation-to-viewer,public-profile-url,picture-url::(original))?format=json"
		resp, content = self.client.request(self.url_profile + self.fetch_profile_query)
		print "get_profile_using_id()"
		return content

	def get_profile_using_token(self, oauth_key, oauth_secret):
		self.url_self = self.get_cfg("LinkedIn", "url_self")
		self.create_token(oauth_key, oauth_secret)
		self.prepare_client()
		resp, content = self.client.request(self.url_self + ":(id,first-name,last-name)?oauth2_access_token=%@?&format=json")
		print "get_profile_using_token()"
		return content

	def get_auth_url(self):
		l = LinkedinAPI(api_key=self.consumer_key,
						api_secret=self.consumer_secret,
						callback_url='http://localhost:5000/callback',
						permissions=["r_network"])
		auth_props = l.get_authentication_tokens()
		auth_url = auth_props['auth_url']
		#Store this token in a session to use it in callback function
		oauth_token_secret = auth_props['oauth_token_secret']
		session['oauth_token_secret'] = oauth_token_secret
		print "get_auth_url()"
		
		return auth_url
		
		
	def get_authorized_tokens(self, oauth_token, oauth_verifier):
		self.url_access_token = self.get_cfg("LinkedIn", "url_access_token")				
		l = LinkedinAPI(api_key=self.consumer_key,
						api_secret=self.consumer_secret,
						permissions=["r_fullprofile"],
						oauth_token=oauth_token,		# from URL
						oauth_token_secret=session['oauth_token_secret'])	# from session
		authorized_tokens = l.get_access_token(oauth_verifier)
		print "get_authorized_tokens()"
		return authorized_tokens
