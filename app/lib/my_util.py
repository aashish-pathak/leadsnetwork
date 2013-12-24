from conf import Config

class Util(Config):
		
	def __init__(self):
		super(Util, self).__init__()
		self.app_url = self.get_cfg('Application', 'app_url')

	def get_application_url(self):
		return self.app_url
