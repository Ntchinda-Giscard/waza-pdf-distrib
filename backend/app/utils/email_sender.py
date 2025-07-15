import smtplib
import ssl
import mimetypes
from pathlib import Path
from email.message import EmailMessage

def send_email(
    email_receiver: str,
    server: str = 'smtp.office365.com',
    email_sender: str = "votre_email@domaine.com",
    email_password: str = "votre_mot_de_passe",
    use_ssl: bool = False,
    port: int = None,
    attachments: list[str] = None
):
    subject = "Votre bulletin de paie"
    body = """Veuillez trouver en pièce jointe votre bulletin de paie pour le mois.

Ce document contient des informations confidentielles concernant votre rémunération. Merci de le conserver en lieu sûr et de ne pas le partager avec des personnes non autorisées.

En cas de question ou de remarque concernant ce bulletin, n'hésitez pas à contacter le service des ressources humaines.

Cordialement,"""

    em = EmailMessage()
    em['From'] = email_sender
    em['To'] = email_receiver
    em['Subject'] = subject
    em.set_content(body)

    # Gestion des pièces jointes
    attachments = attachments or []
    for file_path in attachments:
        path = Path(file_path)
        if not path.is_file():
            print(f"⚠️ Fichier introuvable : {file_path}")
            continue

        mime_type, _ = mimetypes.guess_type(path)
        if not mime_type:
            mime_type = 'application/octet-stream'
        maintype, subtype = mime_type.split('/', 1)

        with open(path, 'rb') as f:
            data = f.read()

        em.add_attachment(
            data,
            maintype=maintype,
            subtype=subtype,
            filename=path.name
        )

    context = ssl.create_default_context()

    try:
        if use_ssl:
            logger.info("🔐 Connexion via SSL...")
            with smtplib.SMTP_SSL(server, port, context=context) as smtp:
                smtp.login(email_sender, email_password)
                smtp.send_message(em)
        else:
            logger.info("🔐 Connexion via STARTTLS...")
            with smtplib.SMTP(server, port) as smtp:
                smtp.ehlo()
                smtp.starttls(context=context)
                smtp.ehlo()
                smtp.login(email_sender, email_password)
                smtp.send_message(em)

        logger.info("✅ Email envoyé avec succès à", email_receiver)

    except Exception as e:
        raise Exception(f"❌ Erreur lors de l'envoi de l'e-mail : {e}")

# 🔧 Exemple d’utilisation
if __name__ == "__main__":
    send_email(
        email_receiver="destinataire@domaine.com",
        email_sender="votre_email@outlook.com",
        email_password="votre_mot_de_passe",  # ou mot de passe d’application
        server="smtp.office365.com",
        use_ssl=False,  # True pour SSL, False pour STARTTLS
        attachments=[
            r"E:\Dossier du fichier a traiter\Base 1\Dossier de traitement journalier\2025-06-19\00381_page_12.pdf",
        ]
    )
