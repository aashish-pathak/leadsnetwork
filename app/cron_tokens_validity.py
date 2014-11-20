import sys, os
import time, datetime

from lib import Alerts

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from conf import Config
import MySQLdb as mdb

config_file = Config()
domain = config_file.get_cfg('MySql', 'domain')
user   = config_file.get_cfg('MySql', 'user')
db     = config_file.get_cfg('MySql', 'db')
password = config_file.get_cfg('MySql', 'password')
days_before_sending_notification = int(config_file.get_cfg('LinkedIn', 'days_before_sending_notification'))

connection = mdb.connect(domain, user, password, db)

with connection:

	# fetch name, linkedin_id, and token_birth_ts for all leads from people
	fetch_cursor = connection.cursor()
	fetch_cursor.execute("SELECT name, linkedin_id, unix_timestamp(token_birth_ts), email FROM people")
	rows = fetch_cursor.fetchall()

	print "************************************************************"
	print "The current time is : " + str(datetime.datetime.now()) + "\n"

	for row in rows:
		
		name = row[0]
		linkedin_id = row[1]
		
		# for each lead, calculate elapsed time of tokens since their birth timestamp
		current_unix_timestamp = time.mktime(datetime.datetime.now().timetuple())
		token_birth_unix_timestamp = float(row[2])
		elapsed_seconds = current_unix_timestamp - token_birth_unix_timestamp

		# alert will be sent after 'days_before_sending_notification' number of days
		allowed_seconds = 60 * 60 * 24 * days_before_sending_notification
		
		# LinkedIn access tokens are valid for 60 days (so stop using them after 59 days)
		lifetime = 60 * 60 * 24 * 59
		
		# check if alert is needed to be sent
		if(elapsed_seconds > allowed_seconds):
			print "Send alert email to " + row[0] + " (" + row[3] + ")"
		else:
			print "Access token for " + row[0] + " is NOT expired!"
			
		# check if token is expired
		if(elapsed_seconds > lifetime):
			update_cursor = connection.cursor()
			update_cursor.execute("UPDATE people SET is_token_expired='yes' WHERE linkedin_id='" + row[1] + "'")
		else:
			update_cursor = connection.cursor()
			update_cursor.execute("UPDATE people SET is_token_expired='no' WHERE linkedin_id='" + row[1] + "'")

	print "\n"
