import os, sys, inspect
import ConfigParser
import MySQLdb as mdb

# get Conf file
cfgfile=os.path.dirname(os.path.abspath(__file__))+'/../conf/app.conf'

config = ConfigParser.ConfigParser()
config.read(cfgfile)

domain = config.get('MySql','domain')
user = config.get('MySql','user')
password = config.get('MySql','password')
db = config.get('MySql','db')

print domain, user, password, db

try:
	connection = mdb.connect(domain, user, password, db)
	cursor = connection.cursor()
	
	try:
		print 'drop GROUPS if exists'
		cursor.execute("""DROP TABLE groups""")
	except Exception as e:
		print e
		
	try:
		print 'create GROUPS'
		cursor.execute("CREATE TABLE `groups` (`id` int(10) unsigned NOT NULL AUTO_INCREMENT,`group_name` varchar(50) DEFAULT NULL,`create_ts` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,`modified_ts` timestamp NULL DEFAULT NULL,PRIMARY KEY (`id`))")
	except Exception as e:
		print e

	print 'populate table GROUPS'
	groups = ['Execs', 'Practice Heads', 'LSE', 'SSE', 'SE', 'Others', 'TM', 'Corp']
	for group in groups:
		print group
		try:
			cursor.execute("""INSERT INTO groups (group_name) VALUES (%s);""",(group))
			connection.commit()
		except Exception as e:
			connection.rollback()
		
except Exception as e:
	print e

connection.close()
