#!flask/bin/python
import ConfigParser
import oauth2 as oauth
import os

class Config(object):
	
    def __init__(self,
				 cfgfile=os.path.dirname(os.path.abspath(__file__))+'/app.conf'):
        self.cfgfile = cfgfile
        self.__parse_cfgfile()
        
    def __parse_cfgfile(self):
        self.config = ConfigParser.ConfigParser()
        self.config.read(self.cfgfile)

    def get_cfg(self, section, attribute):
        return self.config.get(section, attribute)
