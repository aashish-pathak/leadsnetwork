
from conf import Config
import MySQLdb as mdb

class MySQL(Config):
    def __init__(self):
        super(MySQL, self).__init__()
        self.domain = self.get_cfg('mysql', 'domain')
        self.user   = self.get_cfg('mysql', 'user')
        self.db     = self.get_cfg('mysql', 'db')
        self.password = self.get_cfg('mysql', 'password')
        self.__connect_db()
        self.__create_cusrsor()
 
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

    def fetch_all(self, sql):
        self.cursor.execute(sql)
        return self.cursor.fetchall()

    def fetch_one(self, sql):
        self.cursor.execute(sql)
        return self.cursor.fetchone()
