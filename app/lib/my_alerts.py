from conf import Config

class Alerts(Config):
		
	def __init__(self):
		super(Alerts, self).__init__()
		self.app_url = self.get_cfg('Application', 'app_url')
		self.leadsin_username = self.get_cfg('LeadsInAccount', 'username')
		self.leadsin_password = self.get_cfg('LeadsInAccount', 'password')

	def send_invitation_email(self, recipient, subject, text):
		import os
		import smtplib
		import mimetypes
		from email.MIMEMultipart import MIMEMultipart
		from email.MIMEBase import MIMEBase
		from email.MIMEText import MIMEText
		from email.MIMEAudio import MIMEAudio
		from email.MIMEImage import MIMEImage
		from email.Encoders import encode_base64
		
		msg = MIMEMultipart()
		msg['From'] = self.leadsin_username
		msg['To'] = recipient
		msg['Subject'] = subject
		msg.attach(MIMEText(text))

		mailServer = smtplib.SMTP('smtp.gmail.com', 587)
		mailServer.ehlo()
		mailServer.starttls()
		mailServer.ehlo()
		mailServer.login(self.leadsin_username, self.leadsin_password)
		mailServer.sendmail(self.leadsin_username, recipient, msg.as_string())
		mailServer.close()
