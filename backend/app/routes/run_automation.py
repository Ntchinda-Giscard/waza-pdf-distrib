import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import extract_text
from app.db.models import DatabaseConfig, DatabaseServer, EmailConfig, License, MatriculeConfig
from app.db.session import get_db
import logging
import datetime
from fastapi.responses import StreamingResponse
import asyncio
import json


from app.secret_generator import decode_license_key
from app.utils.email_sender import send_email
from test import connect_to_database, ensure_pdf_exists, fetch_by_matricule

run_router = APIRouter(
    prefix="/run"
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# @run_router.post("/automation")
# async def distribution_automation(db: Session = Depends(get_db)):
#     try:
#         # Get connection details
#         # Connect the subfolder linked database
#         # Connect to each database
#         # Read the pdf in each folder
#         # extract the matricule in each page
#         # Connect to the subdatabase
#         # get the mail for every matricule in that database
#         logger.info(f"Querying database server infos")
#         server_info = db.query(DatabaseServer).one()
#         logger.info(f"Got server information: {server_info}")

#         logger.info(f"Querying database folder config")
#         subfolders = db.query(DatabaseConfig).all()
#         logger.info(f"Subfolder database {subfolders}")

#         logger.info(f"Querying email config...")
#         email_config = db.query(EmailConfig).one()
#         logger.info(f"Email results {email_config.smtp_server} ")

#         logger.info(f"Querying license...")
#         license = db.query(License).one()
#         license_key = license.license
#         number_process = decode_license_key(license_key)
#         logger.info(f"License key: {license_key}")

#         logger.info(f"Querying matricule config...")
#         matricule_config = db.query(MatriculeConfig).one()
#         logger.info(f"MAtricule config results {matricule_config.ref_text} ")


#         for subfolder in subfolders:

#             logger.info(f'Connecting to database linked {subfolder.subfolder_name} - {subfolder.link_database}')
#             today = datetime.date.today().isoformat()
#             if(server_info.connection_type == "odbc"):
#                 conn = connect_to_database(
#                     dsn=server_info.odbc_source,
#                     database= subfolder.link_database,
#                     username=server_info.db_username,
#                     password=server_info.db_password
#                 )
#                 base_dir = os.path.join(subfolder.main_folder, subfolder.subfolder_name)
#                 archive_dir = os.path.join(subfolder.main_folder, subfolder.subfolder_name,subfolder.archive_folder, today)
#                 journal_dir = os.path.join(subfolder.main_folder, subfolder.subfolder_name, subfolder.log_folder, today)
#                 file_path = ensure_pdf_exists(base_dir)
#                 matricules, matricules_w_path = extract_text(
#                     file_path=file_path,
#                     archive_path=archive_dir,
#                     journal_dir=journal_dir,
#                     num_chars=matricule_config.number_of_character,
#                     reference=matricule_config.ref_text
#                 )

#                 for matricule in matricules:
#                     number_process -= 1
#                     logger.info(f" Remaining processes: {number_process}")
#                     if not matricule:
#                         continue
#                     results = fetch_by_matricule(
#                     conn, subfolder.tablename, matricule, subfolder.email_field, subfolder.matricule_field, subfolder.log_folder
#                     )
#                     email = results[0].get("EMail")
#                     logger.info(f" Queried email: {email}")
                    
#                     if not email:
#                         logger.warning(f" No email found for {matricule}")
#                         continue
#                     else:
#                         logger.info(f" Queried email: {email}")
#                         logger.info(f" File location: {matricules_w_path[matricule]}")
#                         send_email(
#                             email_receiver=email,
#                             attachments=[matricules_w_path[matricule]],
#                             email_sender=email_config.user_name,
#                             email_password=email_config.password,
#                             server=email_config.smtp_server
#                         )
#                     if number_process <= 0:
#                         logger.info("   License limit reached, stopping further processing.")
#                         break



#     except Exception as e:
#         raise HTTPException(status_code=400, detail=f"Erreur lors de la distibution des bulletin : {e}")
#     return {"message": "Success"}



@run_router.post("/automation")
async def distribution_automation(db: Session = Depends(get_db)):
    async def event_stream():
        try:
            # 1. Get base config and license
            server_info = db.query(DatabaseServer).one()
            subfolders = db.query(DatabaseConfig).all()
            email_config = db.query(EmailConfig).one()
            license = db.query(License).one()
            number_process = decode_license_key(license.license)
            matricule_config = db.query(MatriculeConfig).one()

            logger.info(f"Number of processes: {number_process}")
            logger.info(f"Matricule config: {matricule_config}")
            logger.info(f"Email config: {email_config}")
            logger.info(f"Server info: {server_info}")
            logger.info(f"Subfolders: {subfolders}")

            total_to_process = number_process
            processed = 0

            async def emit_progress(matricule=None, email=None, error=None):
                nonlocal processed
                if error:
                    msg = {"error": error}
                else:
                    processed += 1
                    progress = int((processed / total_to_process) * 100)
                    msg = {
                        "progress": progress,
                        "matricule": matricule,
                        "email": email
                    }
                yield (json.dumps(msg) + "\n").encode("utf-8")
                await asyncio.sleep(0.01)  # small delay to ensure async flush

            # 2. Iterate through subfolders and matricules
            for subfolder in subfolders:
                if server_info.connection_type != "odbc":
                    continue

                conn = connect_to_database(
                    dsn=server_info.odbc_source,
                    database=subfolder.link_database,
                    username=server_info.db_username,
                    password=server_info.db_password,
                    tablename=subfolder.tablename,
                    email_field=subfolder.email_field
                )

                today = datetime.date.today().isoformat()
                base_dir = os.path.join(subfolder.main_folder, subfolder.subfolder_name)
                archive_dir = os.path.join(subfolder.main_folder, subfolder.subfolder_name,subfolder.archive_folder, today)
                journal_dir = os.path.join(subfolder.main_folder, subfolder.subfolder_name, subfolder.log_folder, today)
                # file_path = ensure_pdf_exists(base_dir)

                try:
                    file_path = ensure_pdf_exists(base_dir)
                except Exception as e:
                    async for msg in emit_progress(error=f"Aucun PDF trouvé dans {base_dir} : {e}"):
                        yield msg
                    continue

                matricules, matricules_w_path = extract_text(
                    file_path=file_path,
                    archive_path=archive_dir,
                    archive_file_dir=subfolder.archive_folder,
                    journal_dir=journal_dir,
                    num_chars=matricule_config.number_of_character,
                    reference=matricule_config.ref_text
                )

                logger.info(f"matricules: {matricules}")

                for matricule in matricules:
                    if number_process <= 0:
                        async for msg in emit_progress(error="⛔ Limite de licence atteinte."):
                            yield msg
                        return

                    number_process -= 1
                    result = fetch_by_matricule(
                        conn=conn,
                        database_name=subfolder.link_database,
                        schema_name='dbo',
                        table_name=subfolder.tablename,
                        matricule_value=matricule,
                        email_field=subfolder.email_field, 
                        matricule_field=subfolder.matricule_field, 
                        journal_dir=subfolder.log_folder
                    )

                    if not result:
                        async for msg in emit_progress(matricule=matricule, email=None):
                            yield msg
                        continue
                    if email_config.ssl:
                        security= "ssl"
                    elif email_config.tls:
                        security="tls"
                    elif email_config.ssl and email_config.tls:
                        security="both"
                    else:
                        security="tls"
                    send_email(
                        email_receiver=result,
                        attachments=[matricules_w_path[matricule]],
                        email_sender=email_config.user_name,
                        email_password=email_config.password,
                        server=email_config.smtp_server,
                        port=email_config.port,
                        security=security
                    )

                    async for msg in emit_progress(matricule=matricule, email=result):
                        yield msg

            # Final message
            yield (json.dumps({"progress": 100, "message": "✅ Terminé"}) + "\n").encode("utf-8")

        except Exception as e:
            yield (json.dumps({"error": f"❌ Erreur lors de l'automatisation : {str(e)}"}) + "\n").encode("utf-8")

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")
