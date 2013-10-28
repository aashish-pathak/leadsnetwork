import os
import app as leadsApp
import unittest
import tempfile
import json

class LeadsTestCase(unittest.TestCase):

	def setUp(self):
		#self.db_fd, leadsApp.app.config['DATABASE'] = tempfile.mkstemp()
		leadsApp.app.config['TESTING'] = True
		self.app = leadsApp.app.test_client()
		#leadsApp.init_db()

	def tearDown(self):
		pass
		#os.close(self.db_fd)
		#os.unlink(leadsApp.app.config['DATABASE'])

	# homepage
	def test_homepage(self):
		response = self.app.get('/')
		#print response
		self.assertEqual(response.status_code, 200)
		
	# searching
	def test_search(self):
		response = self.app.get('/search?fname=sangram&lname=kapre&cname=.')
		#print response.data
		self.assertEqual(response.status_code, 200)

	def test_search_fname(self):
		response = self.app.get('/search?fname=sangram&lname=''&cname=''')
		people_search_count = (json.loads(response.data)[u'numResults'])
		self.assertGreater(people_search_count, 0)
	
	def test_search_lname(self):
		response = self.app.get('/search?fname=&lname=kapre&cname=')
		people_search_count = (json.loads(response.data)[u'numResults'])
		self.assertGreater(people_search_count, 0)

	def test_search_fname_lname(self):
		response = self.app.get('/search?fname=sangram&lname=kapre&cname=.')
		people_search_count = (json.loads(response.data)[u'numResults'])
		self.assertGreater(people_search_count, 0)
		
	# linkedin account

	def test_add_account(self):
		response = self.app.get('/add_account')
		self.assertEqual(response.status_code, 200)

	def test_add_account_url(self):
		response = self.app.get('/add_account')
		response_prefix = 'https://api.linkedin.com/uas/oauth/authenticate?'
		self.assertTrue(response_prefix in response.data)

	# login
	def test_login(self):
		response = self.app.get('/login')
		#print response.data
		self.assertEqual(response.status_code, 200)

	# return_leads
	def test_return_leads(self):
		response = self.app.get('/return_leads')
		#print response.data
		self.assertEqual(response.status_code, 200)

	def test_return_leads_count(self):
		response = self.app.get('/return_leads')
		number_of_leads = len(json.loads(response.data))
		self.assertGreater(number_of_leads, 0)

	# fetch_profile
	def test_fetch_profile(self):
		response = self.app.get('/fetch_profile?lead_number=1&profile_id=')
		#print response.data
		self.assertEqual(response.status_code, 200)

if __name__ == '__main__':
    unittest.main()
