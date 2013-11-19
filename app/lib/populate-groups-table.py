import ldap
import getpass
import json

print 'Enter LDAP Passwprd for GS-0373 : '

username = "uid=GS-0373,ou=users,ou=gslab.com,dc=gslab"
password = 'secret123'

application_username = "uid=leadsNetwork,ou=applications,dc=gslab"
application_password = "leads_network_!@#"

try:
	# user authentication
	
	gslab_url = 'ldap://172.18.18.17:389'
	l = ldap.initialize(gslab_url)
	l.protocol_version = ldap.VERSION3
	print l.simple_bind_s(username, password)
	l.unbind_s()
	
	# get data for valid user based on his employee_id (username)
	try:
		# application authentication
		gslab_url = 'ldap://172.18.18.17:389'
		l = ldap.initialize(gslab_url)
		l.protocol_version = ldap.VERSION3
		print l.simple_bind_s(application_username, application_password)
		
		# fetch data from ldap server
		baseDN = 'ou=users, ou=gslab.com,dc=gslab'
		searchScope = ldap.SCOPE_SUBTREE
		retrieveAttributes = ['cn', 'sn', 'mail']	# to get all attributes
		 # Aashish Pathak : gs-0322
		 # Amruta Vispute : gs-0646
		 # Sangram Kapre  : gs-0668
		searchFilter = "uid=" + '*'	# get data for all employees
		
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
			
			practice_names = []
			for result in result_set:
				# get practice name from cn
				practice_name = result[0][0].split(',')[1][3:]
					
				if(practice_name == 'users'):
					practice_name = 'others'
				
				if(practice_name not in practice_names):
					practice_names.append(practice_name)
					#print result[0]
			
		except Exception as e:
			print 'inside Application search function'
			print e		
		l.unbind_s()
		
	except Exception as e:
		print 'inside Application credential'
		print e
	
except Exception as e:
	print 'inside User credential'
	print e

print practice_names
print len(practice_names)

import MySQLdb as mdb
con = mdb.connect('localhost','admin','admin123','find_connections')
with con:

	cur = con.cursor()
	
	try:
		print 'delete table GROUPS'
		cur.execute("DROP TABLE groups")
	except Exception as e:
		print e
	
	try:
		print 'create table GROUPS'
		cur.execute("CREATE TABLE `groups` (`id` int(10) unsigned NOT NULL AUTO_INCREMENT,`group_name` varchar(50) DEFAULT NULL,`create_ts` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,`modified_ts` timestamp NULL DEFAULT NULL,PRIMARY KEY (`id`))")
	except Exception as e:
		print e

	print 'populate table GROUPS'
	for practice_name in practice_names:
		cur.execute("""INSERT INTO groups (group_name) VALUES (%s);""",(practice_name))
	
	# update table PEOPLE
	try:
		print 'delete column GROUP_ID if exists'
		cur.execute("""ALTER TABLE people DROP COLUMN group_id;""")
	except Exception as e:
		print e

	try:
		print 'add column GROUP_ID'
		cur.execute("""ALTER TABLE people ADD COLUMN group_id int(10);""")
	except Exception as e:
		print e

	try:
		print 'add foreign key GROUP_ID'
		cur.execute("""ALTER TABLE people ADD FOREIGN KEY people(group_id) REFERENCES groups(id) ON DELETE CASCADE;""")
	except Exception as e:
		print e

	try:
		cur.execute("""SELECT * FROM people;""");
		rows = cur.fetchall()
		for row in rows:
			name = row[1]
			# search for this name in ldap data
			fname, lname = name.split(' ')
			print lname
			try:
				# user authentication
				
				gslab_url = 'ldap://172.18.18.17:389'
				l = ldap.initialize(gslab_url)
				l.protocol_version = ldap.VERSION3
				print l.simple_bind_s(username, password)
				l.unbind_s()
				
				# get data for valid user based on his employee_id (username)
				try:
					# application authentication
					gslab_url = 'ldap://172.18.18.17:389'
					l = ldap.initialize(gslab_url)
					l.protocol_version = ldap.VERSION3
					print l.simple_bind_s(application_username, application_password)
					
					# fetch data from ldap server
					baseDN = 'ou=users, ou=gslab.com,dc=gslab'
					searchScope = ldap.SCOPE_SUBTREE
					retrieveAttributes = ['cn', 'sn', 'mail']	# to get all attributes
					 # Aashish Pathak : gs-0322
					 # Amruta Vispute : gs-0646
					 # Sangram Kapre  : gs-0668
					searchFilter = "cn='" + fname + "'&sn='" + lname + "'"	# get data for fname, lname
					searchFilter = "cn=" + fname + " & " + "sn=" + lname
					searchFilter = "cn=" + fname
					
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
						
						for result in result_set:
							
							last_name = str(result[0][1]).split(',')[2][9:][:-3]
							if last_name == lname:
								print result
						
					except Exception as e:
						print 'inside Application search function'
						print e		
					l.unbind_s()
					
				except Exception as e:
					print 'inside Application credential'
					print e
				
			except Exception as e:
				print 'inside User credential'
				print e
			
		# end of FOR loop
	except Exception as e:
		print e
