from conf import Config

class Util(Config):
		
	def __init__(self):
		super(Util, self).__init__()

	def get_application_url(self):
		self.app_url = self.get_cfg('Application', 'app_url')
		return self.app_url
