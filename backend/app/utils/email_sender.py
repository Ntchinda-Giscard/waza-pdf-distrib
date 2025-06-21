import smtplib
import ssl
import mimetypes
from pathlib import Path
from email.message import EmailMessage

def send_email(
    email_receiver: str,
    email_sender="ntchinda1998@gmail.com",
    email_password="adlp aqvr qxek htdh",
    attachments: list[str] = None  # list of file paths to attach
):
    subject="Votre bulletin de paie"
    body=""" Veuillez trouver en pièce jointe votre bulletin de paie pour le mois.

Ce document contient des informations confidentielles concernant votre rémunération. Merci de le conserver en lieu sûr et de ne pas le partager avec des personnes non autorisées.

En cas de question ou de remarque concernant ce bulletin, n'hésitez pas à contacter le service des ressources humaines.

Cordialement,"""
    em = EmailMessage()
    em['From'] = email_sender
    em['To'] = email_receiver
    em['Subject'] = subject
    em.set_content(body)

    # Attach files if any
    attachments = attachments or []
    for file_path in attachments:
        path = Path(file_path)
        if not path.is_file():
            print(f"⚠️ Attachment not found: {file_path}")
            continue

        # Guess MIME type
        mime_type, _ = mimetypes.guess_type(path)
        if not mime_type:
            mime_type = 'application/octet-stream'
        maintype, subtype = mime_type.split('/', 1)

        # Read file
        with open(path, 'rb') as f:
            data = f.read()

        # Attach
        em.add_attachment(
            data,
            maintype=maintype,
            subtype=subtype,
            filename=path.name
        )

    # Send via Gmail SMTP
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
        smtp.login(email_sender, email_password)
        smtp.send_message(em)


if __name__ == "__main__":
    send_email(
        email_receiver="giscardntchinda@gmail.com",
        attachments=[
            r"E:\Dossier du fichier a traiter\Base 1\Dossier de traitement journalier\2025-06-19\00381_page_12.pdf",
        ]
    )