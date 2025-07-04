import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import extract_text
from app.db.models import DatabaseConfig, DatabaseServer, EmailConfig, License, MatriculeConfig
from app.db.session import get_db
import logging
import datetime


from app.secret_generator import decode_license_key
from test import connect_to_database, ensure_pdf_exists, fetch_by_matricule

run_router = APIRouter(
    prefix="/run"
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@run_router.post("/automation")
async def distribution_automation(db: Session = Depends(get_db)):
    try:
        # Get connection details
        # Connect the subfolder linked database
        # Connect to each database
        # Read the pdf in each folder
        # extract the matricule in each page
        # Connect to the subdatabase
        # get the mail for every matricule in that database
        logger.info(f"Querying database server infos")
        server_info = db.query(DatabaseServer).one()
        logger.info(f"Got server information: {server_info}")

        logger.info(f"Querying database folder config")
        subfolders = db.query(DatabaseConfig).all()
        logger.info(f"Subfolder database {subfolders}")

        logger.info(f"Querying email config...")
        email = db.query(EmailConfig).one()
        logger.info(f"Email results {email.smtp_server} ")

        logger.info(f"Querying license...")
        license = db.query(License).one()
        license_key = license.license
        number_process = decode_license_key(license_key)
        logger.info(f"License key: {license_key}")

        logger.info(f"Querying matricule config...")
        matricule_config = db.query(MatriculeConfig).one()
        logger.info(f"MAtricule config results {matricule_config.ref_text} ")


        for subfolder in subfolders:

            logger.info(f'Connecting to database linked {subfolder.subfolder_name} - {subfolder.link_database}')
            today = datetime.date.today().isoformat()
            if(server_info.connection_type == "odbc"):
                conn = connect_to_database(
                    dsn=server_info.odbc_source,
                    database= subfolder.link_database,
                    username=server_info.db_username,
                    password=server_info.db_password
                )
                base_dir = os.path.join(subfolder.main_folder, subfolder.subfolder_name)
                file_path = ensure_pdf_exists(base_dir)
                matricules, matricules_w_path = extract_text(
                    file_path=file_path,
                    archive_path=subfolder.archive_folder,
                    journal_dir=subfolder.log_folder,
                    num_chars=matricule_config.number_of_character,
                    reference=matricule_config.ref_text
                )

                for matricule in matricules:
                    number_process -= 1
                    logger.info(f" Remaining processes: {number_process}")
                    if not matricule:
                        continue
                    results = fetch_by_matricule(
                    conn, subfolder.tablename, matricule, subfolder.email_field, subfolder.matricule_field, subfolder.log_folder
                    )



    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la distibution des bulletin : {e}")
    return -1