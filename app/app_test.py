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

	def test_homepage(self):
		response = self.app.get('/')
		#print response
		self.assertEqual(response.status_code, 200)
		
	def test_search(self):
		response = self.app.get('/search?fname=sangram&lname=kapre&cname=.')
		#print response.data
		self.assertEqual(response.status_code, 200)

	def test_add_account(self):
		response = self.app.get('/add_account')
		#print response.data
		self.assertEqual(response.status_code, 200)

	def test_login(self):
		response = self.app.get('/login')
		#print response.data
		self.assertEqual(response.status_code, 200)

	def test_return_leads(self):
		response = self.app.get('/return_leads')
		#print response.data
		self.assertEqual(response.status_code, 200)

	def test_return_leads_count(self):
		response = self.app.get('/return_leads')
		print len(json.loads(response.data))
		self.
		

if __name__ == '__main__':
    unittest.main()
