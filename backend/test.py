import os
import pyodbc
import logging
import datetime
import fitz  # PyMuPDF
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.db.models import UserConfig
from app.db.session import SessionLocal
from app.secret_generator import decode_license_key
from app.utils.email_sender import send_email

# 🔗 Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def extract_text_after_reference(full_text: str, reference: str, num_chars: int, ignore_spaces_in_count: bool = False) -> str:
    idx = full_text.find(reference)
    if idx == -1:
        return ""
    post = full_text[idx + len(reference):].lstrip()
    if not ignore_spaces_in_count:
        return post[:num_chars]
    else:
        result = []
        count = 0
        for ch in post:
            result.append(ch)
            if not ch.isspace():
                count += 1
                if count >= num_chars:
                    break
        return "".join(result)

def extract_pdf_text(file_path, reference, num_chars, folder_path):
    pages_matricules = []
    matricule_with_path = {}
    today = datetime.date.today().isoformat()
    base_dir = os.path.join(folder_path, "Dossier de traitement journalier", today)
    os.makedirs(base_dir, exist_ok=True)

    try:
        with fitz.open(file_path) as doc:
            pdf_name = os.path.splitext(os.path.basename(file_path))[0]
            for i, page in enumerate(doc):
                page_text = page.get_text()
                matricule = extract_text_after_reference(page_text, reference, num_chars)

                new_pdf = fitz.open()
                new_pdf.insert_pdf(doc, from_page=i, to_page=i)

                pdf_filename = f"{matricule}_page_{i+1}.pdf"
                dest_pdf = os.path.join(base_dir, pdf_filename)
                new_pdf.save(dest_pdf)
                new_pdf.close()

                matricule_with_path[matricule] = dest_pdf
                pages_matricules.append(matricule)

    except Exception as e:
        logger.error(f"❌ Error processing {file_path}: {e}")
        return [f"❌ Error processing {file_path}: {e}"], {}

    return pages_matricules, matricule_with_path

def fetch_by_matricule(conn, table, matricule_value, email_field):
    cursor = conn.cursor()
    sql = f"SELECT {email_field} FROM {table} WHERE MatriculeSalarie = ?"
    cursor.execute(sql, (matricule_value,))
    cols = [col[0] for col in cursor.description]
    rows = cursor.fetchall()
    return [dict(zip(cols, row)) for row in rows]

def connect_to_mssql(server, database, username, password):
    try:
        conn_str = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};DATABASE={database};UID={username};PWD={password};"
        )
        return pyodbc.connect(conn_str)
    except Exception as e:
        logger.error(f"❌ Failed to connect to {database}: {e}")
        return None

def process_configs():
    session = SessionLocal()
    try:
        user_configs = session.query(UserConfig).all()
        for config in user_configs:
            logger.info(f"\n🔧 UserConfig: {config.folder_name}")
            
            for subfolder in config.subfolders:
                logger.info(f"  📁 Subfolder: {subfolder.subfolder_name}")
                number_process = decode_license_key(config.license_key)
                folder_path = os.path.join(config.folder_name, subfolder.subfolder_name)
                logger.info(f"  📂 Looking in: {folder_path}")

                logging.info( f" database user {config.db_username} and password: {config.db_password}" )
                try:
                    conn = connect_to_mssql(config.db_server, subfolder.link_database, config.db_username, config.db_password)
                except Exception as e:
                    raise Exception(f" ❌ Error connecting to database {subfolder.link_database}: {e}")
                if not conn:
                    logger.warning(f"  ❌ Could not connect to {subfolder.link_database}")
                    continue
                logger.info(f"  ✅ Connected to DB: {subfolder.link_database}")

                if os.path.isdir(folder_path):
                    for fname in os.listdir(folder_path):
                        if not fname.lower().endswith(".pdf"):
                            continue

                        pdf_path = os.path.join(folder_path, fname)
                        logger.info(f"\n  📄 File: {fname}")

                        matricules, matricules_w_path = extract_pdf_text(
                            pdf_path, config.ref_text, config.numner_of_char, folder_path
                        )
                        
                        for m in matricules:
                            number_process -= 1
                            logger.info(f"  🔢 Remaining processes: {number_process}")
                            if not m:
                                continue
                            logger.info(f"    🔎 Found matricule: {m}")
                            results = fetch_by_matricule(
                                conn, subfolder.table, m, subfolder.email_field
                            )
                            if results:
                                email = results[0].get("EMail")
                                if not email:
                                    logger.warning(f"    ⚠️ No email found for {m}")
                                    continue
                                logger.info(f"    ✅ Query result: {email}")
                                logger.info(f"    ✅ File location: {matricules_w_path[m]}")
                                send_email(
                                    email_receiver=email,
                                    attachments=[matricules_w_path[m]],
                                )
                            else:
                                logger.warning(f"    ⚠️ No results for {m}")
                            
                            
                            
                            if number_process <= 0:
                                logger.info("  🔒 License limit reached, stopping further processing.")
                                break
                           
                else:
                    logger.warning(f"  ⚠️ Folder not found: {folder_path}")

                conn.close()
                logger.info(f"  🔒 Closed connection to {subfolder.link_database}")

    finally:
        session.close()

if __name__ == "__main__":
    process_configs()
    
