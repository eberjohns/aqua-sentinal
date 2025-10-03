
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import os
import email.utils

def send_email_notification(
  receivers,
  subject="വെള്ളപ്പൊക്ക മുന്നറിയിപ്പ്",
  html_body=None,
  image_filename="ariyippu.jpg",
  sender="workonai123@gmail.com",
  password="sxxqyiqvtttnlclq"
):
  image_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), image_filename)
  server = smtplib.SMTP("smtp.gmail.com", 587)
  server.starttls()
  server.login(sender, password)
  for receiver in receivers:
    msg = MIMEMultipart('related')
    msg["From"] = sender
    msg["To"] = receiver
    msg["Subject"] = subject
    msg["Message-ID"] = email.utils.make_msgid()
    msg["In-Reply-To"] = ""
    msg["References"] = ""
    msg["Reply-To"] = sender
    html = html_body or (
      """
      <html>
        <body>
        <p>കനത്ത മഴയിൽ വെള്ളപ്പൊക്കമോ മണ്ണിടിച്ചിലോ ഉണ്ടാകുമെന്നതിനാൽ നിങ്ങൾ വീട് വിട്ട് അഭയകേന്ദ്രത്തിലേക്ക് മാറണം - സർക്കാരിൽ നിന്നുള്ള മുന്നറിയിപ്പ്.</p>
        <img src='cid:ariyippuimage'>
        </body>
      </html>
      """
    )
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    if os.path.exists(image_path):
      with open(image_path, "rb") as image_file:
        image = MIMEImage(image_file.read(), _subtype="jpeg")
        image.add_header('Content-ID', '<ariyippuimage>')
        image.add_header('Content-Disposition', 'inline', filename=image_filename)
        msg.attach(image)
    else:
      print(f"Image file not found: {image_path}")
    server.sendmail(sender, receiver, msg.as_string())
  server.quit()
