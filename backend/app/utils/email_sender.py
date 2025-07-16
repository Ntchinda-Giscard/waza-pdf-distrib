import smtplib
import ssl
import mimetypes
from pathlib import Path
from email.message import EmailMessage
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def send_email(
    email_receiver: str,
    server: str,
    port: int,
    email_sender: str,
    email_password: str,
    security: str = "tls",  # "ssl", "tls" ou "both"
    attachments: list[str] = None
):
    # Vérification du paramètre security
    mode = security.lower()
    if mode not in ("ssl", "tls", "both"):
        raise ValueError(f"Paramètre 'security' invalide : {security}. Attendu : 'ssl', 'tls' ou 'both'.")

    subject = "Votre bulletin de paie"
    body = """Veuillez trouver en pièce jointe votre bulletin de paie pour le mois.

Ce document contient des informations confidentielles concernant votre rémunération.
Merci de le conserver en lieu sûr et de ne pas le partager avec des personnes non autorisées.

Cordialement,"""

    # Création du message
    em = EmailMessage()
    em["From"] = email_sender
    em["To"] = email_receiver
    em["Subject"] = subject
    em.set_content(body)

    # Ajout des pièces jointes
    for file_path in attachments or []:
        path = Path(file_path)
        if not path.is_file():
            logger.info(f"⚠️ Fichier introuvable : {file_path}")
            continue
        mime_type, _ = mimetypes.guess_type(path)
        if not mime_type:
            mime_type = "application/octet-stream"
        maintype, subtype = mime_type.split("/", 1)
        with open(path, "rb") as f:
            em.add_attachment(f.read(), maintype=maintype, subtype=subtype, filename=path.name)

    context = ssl.create_default_context()

    # Fonctions internes pour tenter une connexion
    def try_ssl():
        with smtplib.SMTP_SSL(server, port, context=context) as smtp:
            smtp.login(email_sender, email_password)
            smtp.send_message(em)

    def try_tls():
        with smtplib.SMTP(server, port) as smtp:
            smtp.ehlo()
            smtp.starttls(context=context)
            smtp.ehlo()
            smtp.login(email_sender, email_password)
            smtp.send_message(em)

    # Gestion des différentes options
    try:
        if mode == "ssl":
            logger.info(f"🔐 Tentative SSL sur {server}:{port}")
            try_ssl()
            logger.info("✅ Email envoyé avec SSL.")
        elif mode == "tls":
            logger.info(f"🔐 Tentative STARTTLS sur {server}:{port}")
            try_tls()
            logger.info("✅ Email envoyé avec STARTTLS.")
        elif mode == "both":
            # Essai SSL puis TLS si échec
            try:
                logger.info(f"🔐 [BOTH] Tentative SSL sur {server}:{port}")
                try_ssl()
                logger.info("✅ Email envoyé avec SSL.")
            except Exception as e_ssl:
                logger.info(f"⚠️ Échec SSL : {e_ssl}")
                try:
                    logger.info(f"🔐 [BOTH] Tentative STARTTLS sur {server}:{port}")
                    try_tls()
                    logger.info("✅ Email envoyé avec STARTTLS.")
                except Exception as e_tls:
                    raise RuntimeError(
                        f"❌ Échec des deux méthodes sur {server}:{port}.\n"
                        f"- SSL error: {e_ssl}\n"
                        f"- STARTTLS error: {e_tls}"
                    ) from e_tls
    except Exception as e:
        raise RuntimeError(f"❌ Échec de l'envoi : {e}")

# Exemple d'utilisation
if __name__ == "__main__":
    send_email(
        email_receiver="destinataire@exemple.com",
        server="smtp.exemple.com",
        port=587,  # Port fourni par l'utilisateur
        email_sender="utilisateur@exemple.com",
        email_password="votre_mdp",
        security="both",  # "ssl", "tls", "both"
        attachments=[
            r"C:\chemin\fichier.pdf"
        ]
    )
