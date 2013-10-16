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

	def insert_into_people(self, name, linkedin_id, access_token_key, access_token_secret):
		try:
			self.cursor.execute("""insert into people (name, linkedin_id, access_token, access_secret) values (%s,%s,%s,%s);""",(name, linkedin_id, access_token_key, access_token_secret))
			print "insert_into_people()"
		except Exception as e:
			print "unable to insert.........!!!!!!!!!!!!!!!!!!!!!!!"
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
		print "fetch_random()"
		return row
