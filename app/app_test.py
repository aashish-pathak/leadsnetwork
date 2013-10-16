import app
import functions
import unittest
import json
from flask import request

class Test_app(unittest.TestCase):
    
    def setUp(self):
        pass

    def test_return_leads(self):
        # make sure the the returned list of leads is not empty
        self.leads = functions.return_leads()
        self.total = len(json.loads(self.leads))
        self.assertNotEquals(self.total,0)

    def test_login(self):
		self.assertEqual(1,1)
		
if __name__ == '__main__':
    unittest.main()
