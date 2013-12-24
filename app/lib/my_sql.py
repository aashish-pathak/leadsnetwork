from conf import Config
import MySQLdb as mdb

class MySQL(Config):
		
	def __init__(self):
		super(MySQL, self).__init__()
		self.domain = self.get_cfg('MySql', 'domain')
		self.user   = self.get_cfg('MySql', 'user')
		self.db     = self.get_cfg('MySql', 'db')
		self.password = self.get_cfg('MySql', 'password')
		self.__connect_db()
		self.__create_cursor()

	def __connect_db(self):
		try:
			self.connection = mdb.connect(self.domain,
                                          self.user,
                                          self.password,
                                          self.db)
		except Exception as e:
			print e

	def __create_cursor(self):
		if not self.connection:
			self.__connect_db()
		self.cursor = self.connection.cursor()

	def insert_into_people(self, name, linkedin_id, access_token_key, access_token_secret, token_birth_ts, email):
		try:
			self.cursor.execute("""INSERT INTO people (name, linkedin_id, access_token, access_secret, token_birth_ts, email) VALUES (%s,%s,%s,%s,%s,%s) ON DUPLICATE KEY UPDATE access_token = %s, access_secret = %s, token_birth_ts = %s, email = %s;""",(name, linkedin_id, access_token_key, access_token_secret, token_birth_ts, email, access_token_key, access_token_secret, token_birth_ts, email))
			self.connection.commit()
			print "insert_into_people()"
		except Exception as e:
			print "unable to insert (PEOPLE) !!!!!!!!!!!!!!!!!!!!!!"
			print e

	def update_group_id(self, name, belongs_to):
		try:
			self.cursor.execute("""UPDATE people SET group_id = %s WHERE name = %s;""",(belongs_to, name))
			self.connection.commit()
			print "update_group_id()"
		except Exception as e:
			print "unable to update group id !!!!!!!!!!!!!"
			print e

	def insert_into_invitations(self, email, random_string):
		try:
			self.cursor.execute("""INSERT INTO invitations (email, random_string) VALUES (%s,%s);""",(email, random_string))
			self.connection.commit()
			print "insert_into_invitations()"
		except Exception as e:
			print "unable to insert (INVITATIONS) !!!!!!!!!!!!!!!!!!!!!!"
			print e

	def update_invitations_set_used(self, random_string):
		try:
			self.cursor.execute("""UPDATE invitations SET used = %s WHERE random_string = %s;""",(True, random_string))
			self.connection.commit()
			print "update_invitations_set_used()"
		except Exception as e:
			print "unable to update (INVITATIONS) !!!!!!!!!!!!!!!!!!!!!!"
			print e

	def insert_into_fnames(self, fname):
		try:
			self.cursor.execute("""INSERT INTO fnames (fname) VALUES (%s);""",(fname))
			self.connection.commit()
			print "insert_into_fnames()"
		except Exception as e:
			print "unable to insert (FNAMES) !"
			print e

	def insert_into_lnames(self, lname):
		try:
			self.cursor.execute("""INSERT INTO lnames (lname) VALUES (%s);""",(lname))
			self.connection.commit()
			print "insert_into_lnames()"
		except Exception as e:
			print "unable to insert (LNAMES) !"
			print e

	def insert_into_cnames(self, cname):
		try:
			self.cursor.execute("""INSERT INTO cnames (cname) VALUES (%s);""",(cname))
			self.connection.commit()
			print "insert_into_cnames()"
		except Exception as e:
			print "unable to insert (CNAMES) !"
			print e

	def fetch_all(self, sql):
		self.cursor.execute(sql)
		print "fetch_all()"
		return self.cursor.fetchall()

	def fetch_one(self, sql):
		self.cursor.execute(sql)
		print "fetch_one()"
		return self.cursor.fetchone()
        
	def fetch_random(self):
		import random
		sql = "SELECT COUNT(*) FROM people;"
		row = self.fetch_one(sql)
		
		leads_count = row[0]
		random_number = random.randint(1, leads_count)

		sql = "select * from people"
		rows = self.cursor.execute(sql)
		for x in range(1, random_number):
			row = self.cursor.fetchone()

		row = self.cursor.fetchone()
		
		print 'Random Lead : ' + row[1]
		
		print "fetch_random()"
		return row
		
