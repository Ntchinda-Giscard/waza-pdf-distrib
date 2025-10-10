import smtplib
from typing import Optional
import unicodedata
import ssl
import mimetypes
import sys
from pathlib import Path
from email.message import EmailMessage
import logging

# Ensure UTF-8 encoding for stdout/stderr
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s - %(name)s - %(funcName)s - %(lineno)d - %(threadName)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('fastapi.log')
    ]
)
logger = logging.getLogger(__name__)


def send_email(
    email_receiver: str,
    server: str,
    port: int,
    email_sender: str,
    email_password: str,
    security: str = "tls",  # "ssl", "tls" ou "both"
    attachments: Optional[list[str]] = None
):
    # Vérification du paramètre security
    mode = security.lower()
    if mode not in ("ssl", "tls", "both"):
        raise ValueError(f"Paramètre 'security' invalide : {security}. Attendu : 'ssl', 'tls' ou 'both'.")

    subject = "Votre bulletin de paie"
    # The issue is in this body text - there are invisible non-breaking spaces (\xa0)
    # Let's clean them up while preserving the text content
    body = "Veuillez trouver en piece jointe votre bulletin de paie pour le mois"

    # Création du message with explicit UTF-8 encoding
    em = EmailMessage()
    em["From"] = email_sender
    em["To"] = email_receiver
    em["Subject"] = subject
    em.set_content(body, charset='utf-8')

    # Ajout des pièces jointes
    for file_path in attachments or []:
        path = Path(file_path)
        if not path.is_file():
            logger.info(f"Fichier introuvable : {file_path}")
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
            logger.info(f"Connexion réussie à {server}:{port} avec SSL.")
            smtp.send_message(em)

    def try_tls():
        with smtplib.SMTP(server, port) as smtp:
            smtp.ehlo()
            smtp.starttls(context=context)
            smtp.ehlo()
            smtp.login(email_sender, email_password)
            logger.info(f"Connexion réussie à {server}:{port} avec STARTTLS.")
            smtp.send_message(em)

    # Gestion des différentes options
    try:
        if mode == "ssl":
            logger.info(f"Tentative SSL sur {server}:{port}")
            try_ssl()
            logger.info("Email envoyé avec SSL.")
        elif mode == "tls":
            logger.info(f"Tentative STARTTLS sur {server}:{port}")
            try_tls()
            logger.info("Email envoyé avec STARTTLS.")
        elif mode == "both":
            # Essai SSL puis TLS si échec
            try:
                logger.info(f"[BOTH] Tentative SSL sur {server}:{port}")
                try_ssl()
                logger.info("Email envoyé avec SSL.")
            except Exception as e_ssl:
                logger.info(f"Échec SSL : {e_ssl}")
                try:
                    logger.info(f"[BOTH] Tentative STARTTLS sur {server}:{port}")
                    try_tls()
                    logger.info("Email envoyé avec STARTTLS.")
                except Exception as e_tls:
                    raise RuntimeError(
                        f"Échec des deux méthodes sur {server}:{port}.\n"
                        f"- SSL error: {e_ssl}\n"
                        f"- STARTTLS error: {e_tls}"
                    ) from e_tls
    except Exception as e:
        # Handle Unicode characters in error messages properly
        try:
            error_msg = str(e)
            logger.error(f"Échec de l'envoi : {error_msg}")
        except UnicodeEncodeError:
            # If the error message contains problematic characters, handle them
            error_msg = str(e).encode('utf-8', errors='replace').decode('utf-8')
            logger.error(f"Échec de l'envoi : {error_msg}")
        except Exception as log_error:
            # Last resort: use the original method to clean the error
            clean_error = unicodedata.normalize("NFKD", str(e)).encode("ascii", "ignore").decode()
            logger.error(f"Échec de l'envoi (nettoyé) : {clean_error}")
            logger.error(f"Erreur de logging : {log_error}")
        raise e


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