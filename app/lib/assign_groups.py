import os, sys, inspect
import ConfigParser
import MySQLdb as mdb
import ldap

def getGroupName(roles):
	groups = ['Null Group', 'Execs', 'PracticeHead', 'LSE', 'SSE', 'SE', 'users', 'TM', 'Corp']
	for group in groups:
		if group in roles:
			return int(groups.index(group))
	
# get Conf file
cfgfile=os.path.dirname(os.path.abspath(__file__))+'/../conf/app.conf'

config = ConfigParser.ConfigParser()
config.read(cfgfile)

domain = config.get('MySql','domain')
user = config.get('MySql','user')
password = config.get('MySql','password')
db = config.get('MySql','db')

application_username = config.get('LDAP','application_username')
application_password = config.get('LDAP','application_password')
baseDN = config.get('LDAP','baseDN')
gslab_url = config.get('LDAP','gslab_url_test')

# read names from PEOPLE table and search for their GROUP-NAME from LDAP Server
import MySQLdb as mdb
connection = mdb.connect(domain, user, password, db)
with connection:

	cursor = connection.cursor()
	
	# update table PEOPLE
	try:
		print 'delete column GROUP_ID if exists'
		cursor.execute("""ALTER TABLE people DROP COLUMN group_id;""")
	except Exception as e:
		print e

	try:
		print 'add column GROUP_ID'
		cursor.execute("""ALTER TABLE people ADD COLUMN group_id int(10);""")
	except Exception as e:
		print e

	try:
		print 'add foreign key GROUP_ID'
		cursor.execute("""ALTER TABLE people ADD FOREIGN KEY people(group_id) REFERENCES groups(id) ON DELETE CASCADE;""")
	except Exception as e:
		print e

	try:
		cursor.execute("""SELECT * FROM people;""");
		rows = cursor.fetchall()
		for row in rows:

			name = row[1]

			# search for this name in ldap data
			fname, lname = name.split(' ')
			print fname + " " + lname

			try:
				# application authentication
				l = ldap.initialize(gslab_url)
				l.protocol_version = ldap.VERSION3
				#print l.simple_bind_s(application_username, application_password)
				l.simple_bind_s(application_username, application_password)
				
				# fetch data from ldap server
				searchScope = ldap.SCOPE_SUBTREE
				retrieveAttributes = ['cn', 'sn', 'mail']	# to get all attributes

				# search based on First-Name and Last-Name
				searchFilter = "(&(cn=" + fname + ")(sn=" + lname + "))"
				
				try:
					ldap_result_id = l.search(baseDN, searchScope, searchFilter, retrieveAttributes)
					result_set = []
					while 1:
						result_type, result_data = l.result(ldap_result_id, 0)
						if(result_data == []):
							break;
						else:
							if result_type == ldap.RES_SEARCH_ENTRY:
								result_set.append(result_data)

					if(len(result_set) == 0):
						try:
							belongs_to = getGroupName(['users'])
							cursor.execute("""UPDATE people SET group_id = %s WHERE name = %s;""",(belongs_to, name))
							connection.commit()
						except Exception as e:
							connection.rollback()
							print e
					else:
						roles = []
						for result in result_set:
							last_name = str(result[0][1]).split(',')[2][9:][:-3]
							role = str(result[0][0]).split(',')[1][3:]
							roles.append(role)
						belongs_to = getGroupName(roles)
						print "belongs to : " + str(belongs_to)
						try:
							cursor.execute("""UPDATE people SET group_id = %s WHERE name = %s;""",(belongs_to, name))
							connection.commit()
						except Exception as e:
							connection.rollback()
							print e
					
				except Exception as e:
					print 'inside Application search function'
					print e		
				
			except Exception as e:
				print 'inside Application credential'
				print e

			
		# end of FOR loop
	except Exception as e:
		print e
