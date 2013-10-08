from conf import Config

class Linkedin(Config):
    def __init__(self):
        super(Linkedin, self).__init__()
        self.consumer_key = self.get_cfg("LinkedIn", "consumer_key")
        self.consumer_secret = self.get_cfg("Linkedin", "consumer_secret")
        self.__create_consumer()
    
    def __create_consumer(self):
        self.consumer = oauth.Consumer(
                key    = self.consumer_key,
                secret = self.consumer_secret)

    def create_token(self, oauth_key, oauth_secret):
        self.token = oauth.Token(
                key    = self.oauth_key,
                secret = self.oauth_secret)

    def prepare_client(self):
        self.client = oauth.Client(self.consumer, self.token)

