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
		print 'create FNAMES'
		cursor.execute("CREATE TABLE `fnames` (`fname` varchar(20) PRIMARY KEY)")
	except Exception as e:
		print e

	try:
		print 'create LNAMES'
		cursor.execute("CREATE TABLE `lnames` (`lname` varchar(20) PRIMARY KEY)")
	except Exception as e:
		print e
		
	try:
		print 'create CNAMES'
		cursor.execute("CREATE TABLE `cnames` (`cname` varchar(20) PRIMARY KEY)")
	except Exception as e:
		print e

except Exception as e:
	print e

connection.close()
