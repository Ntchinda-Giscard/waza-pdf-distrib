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





def connect_to_database(dsn, database, tablename, email_field, username=None, password=None):
    """
    Connects to a SQL Server database using either Windows Authentication or SQL Server Authentication.

    Parameters:
    - dsn (str): The Data Source Name configured in ODBC.
    - username (str, optional): The SQL Server username (required for SQL Server Authentication).
    - password (str, optional): The SQL Server password (required for SQL Server Authentication).
    - database (str, optional): The name of the specific database to connect to.

    Returns:
    - pyodbc.Connection: A connection object to the database.
    """
    try:
        connection_str = f'DSN={dsn};'
        if database:
            connection_str += f'DATABASE={database};'
            logger.info(f"====>Database: {database}")

        if username and password:
            logger.info(f"Connecting using SQL Server Authentication. DSN: {dsn}, Username: {username}")
            connection_str += f'UID={username};PWD={password};'
        else:
            logger.info(f"Connecting using Windows Authentication. DSN: {dsn}")
            connection_str += 'Trusted_Connection=yes;'
        
        logger.info(f" Connectioni string: {connection_str} ")
        conn = pyodbc.connect(connection_str)
        cursor = conn.cursor()
        sql = f"SELECT {email_field} FROM {tablename}"
        cursor.execute(sql)
        rows = cursor.fetchall()
    
        logger.info(f"Test connectio to database: {rows}")
        logger.info("Connection established successfully.")
        return conn

    except pyodbc.Error as e:
        logger.error(f"Database connection error: {e}")
        raise Exception(f"Failed to connect to database: {str(e)}")  


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

def extract_pdf_text(file_path, reference, num_chars, folder_path, journal_dir):
    pages_matricules = []
    matricule_with_path = {}
    today = datetime.date.today().isoformat()
    base_dir = os.path.join(folder_path, "Dossier de traitement journalier", today)
    os.makedirs(base_dir, exist_ok=True)
    os.makedirs(journal_dir, exist_ok=True)
    journal_filename = f"journal-{today}.txt"
    journal_path = os.path.join(journal_dir, journal_filename)

    try:
        with fitz.open(file_path) as doc:
            pdf_name = os.path.splitext(os.path.basename(file_path))[0]
            for i, page in enumerate(doc):
                page_text = page.get_text()
                # print(page_text)
                # break
                matricule = extract_text_after_reference(page_text, reference, num_chars)
                
                with open(journal_path, "a", encoding="utf-8") as journal_file:
                    if matricule:
                        log_msg = f"{datetime.datetime.now().isoformat()} - Page {i+1}:  Found matricule '{matricule}'\n"
                        logger.info(f"    Page {i+1}: Found matricule '{matricule}'")
                    else:
                        log_msg = f"{datetime.datetime.now().isoformat()} - Page {i+1}:  No matricule found\n"
                        logger.warning(f"     {datetime.datetime.now().isoformat()} - Page {i+1}: No matricule found")
                    journal_file.write(log_msg)
                new_pdf = fitz.open()
                new_pdf.insert_pdf(doc, from_page=i, to_page=i)

                pdf_filename = f"{matricule}_page_{i+1}.pdf"
                dest_pdf = os.path.join(base_dir, pdf_filename)
                new_pdf.save(dest_pdf)
                new_pdf.close()

                matricule_with_path[matricule] = dest_pdf
                pages_matricules.append(matricule)

    except Exception as e:
        logger.error(f" Error processing {file_path}: {e}")
        return [f" Error processing {file_path}: {e}"], {}

    return pages_matricules, matricule_with_path

# def fetch_by_matricule(
#     conn,
#     database_name,
#     schema_name,
#     table_name,
#     matricule_value,
#     email_field,
#     matricule_field="MatriculeSalarie",
#     journal_dir=None
# ):
#     """
#     Fetches the email for an employee identified by matricule from a fully-qualified SQL Server table.

#     Parameters:
#     - conn: pyodbc.Connection object
#     - database_name (str): Name of the database
#     - schema_name (str): Name of the schema (e.g. 'dbo')
#     - table_name (str): Name of the table (without brackets)
#     - matricule_value (str or int): The value to filter on
#     - email_field (str): Name of the email column
#     - matricule_field (str): Name of the matricule column
#     - journal_dir (str, optional): Directory to write a journal log

#     Returns:
#     - str or None: The email if found, else None
#     """    
#     # Build fully-qualified table identifier
#     fq_table = f"[{database_name.strip()}].[{schema_name.strip()}].[{table_name.strip()}]"

#     # Prepare journal file if needed
#     today = datetime.date.today().isoformat()
#     if journal_dir:
#         os.makedirs(journal_dir, exist_ok=True)
#         journal_path = os.path.join(journal_dir, f"journal-traitement-{today}.txt")

#     cursor = conn.cursor()
#     logger.info(f"Searching for matricule '{matricule_value}' in table '{fq_table}' field '{matricule_field}'")

#     # Normalize parameter and decide on WHERE clause
#     raw = str(matricule_value).strip()
#     try:
#         # If convertible to int, treat as numeric column
#         param = int(raw)
#         where_clause = f"{matricule_field} = ?"
#     except ValueError:
#         # Treat as string: trimmed and case-insensitive
#         param = raw
#         where_clause = (
#             f"LOWER(LTRIM(RTRIM({matricule_field}))) = LOWER(LTRIM(RTRIM(?)))"
#         )

#     # Construct and execute parameterized SQL
#     sql = (
#         f"SELECT {email_field.strip()}, {matricule_field.strip()}"
#         f" FROM {fq_table}"
#         f" WHERE {where_clause}"
#     )
#     logger.info(f"Executing SQL: {sql} with parameter: {param!r}")
#     cursor.execute(sql, (param))

#     # Fetch results
#     cols = [col[0] for col in cursor.description]
#     rows = cursor.fetchall()
#     logger.info(f"Rows found: {rows}")

#     # Convert rows to dicts
#     results = [dict(zip(cols, row)) for row in rows]
#     logger.info(f"Query results as dict: {results}")

#     if not results:
#         msg = f"No employee found with matricule '{matricule_value}'"
#         logger.warning(msg)
#         if journal_dir:
#             with open(journal_path, "a", encoding="utf-8") as jfile:
#                 jfile.write(f"{datetime.datetime.now().isoformat()} - {msg}\n")
#         return None

#     employee = results[0]
#     email = employee.get(email_field)
#     if not email or email.strip() == "":
#         msg = f"Employee found but no email for matricule '{matricule_value}'"
#         logger.warning(msg)
#         if journal_dir:
#             with open(journal_path, "a", encoding="utf-8") as jfile:
#                 jfile.write(f"{datetime.datetime.now().isoformat()} - {msg}\n")
#         return None

#     # Log and return
#     logger.info(f"Email successfully found for matricule '{matricule_value}': {email}")
#     if journal_dir:
#         with open(journal_path, "a", encoding="utf-8") as jfile:
#             jfile.write(f"{datetime.datetime.now().isoformat()} - Email found: {email}\n")

#     return email.strip()

def fetch_by_matricule(
    conn,
    database_name,
    schema_name,
    table_name,
    matricule_value,
    email_field,
    matricule_field="MatriculeSalarie",
    journal_dir=None
):
    """
    Fetches the email for an employee identified by matricule from a fully-qualified SQL Server table using LIKE comparison.

    Parameters:
    - conn: pyodbc.Connection object
    - database_name (str): Name of the database
    - schema_name (str): Name of the schema (e.g. 'dbo')
    - table_name (str): Name of the table (without brackets)
    - matricule_value (str or int): The value to filter on
    - email_field (str): Name of the email column
    - matricule_field (str): Name of the matricule column
    - journal_dir (str, optional): Directory to write a journal log

    Returns:
    - str or None: The email if found, else None
    """    
    # Build fully-qualified table identifier
    fq_table = f"[{database_name.strip()}].[{schema_name.strip()}].[{table_name.strip()}]"

    # Prepare journal file if needed
    today = datetime.date.today().isoformat()
    if journal_dir:
        os.makedirs(journal_dir, exist_ok=True)
        journal_path = os.path.join(journal_dir, f"journal-traitement-{today}.txt")

    cursor = conn.cursor()
    logger.info(f"Searching for matricule '{matricule_value}' in table '{fq_table}' field '{matricule_field}'")

    # Normalize parameter and build WHERE clause using LIKE
    raw = str(matricule_value).strip()
    try:
        param = f"%{int(raw)}%"
        where_clause = f"CAST({matricule_field} AS NVARCHAR) LIKE ?"
    except ValueError:
        param = f"%{raw}%"
        where_clause = (
            f"LOWER(LTRIM(RTRIM({matricule_field}))) LIKE LOWER(LTRIM(RTRIM(?)))"
        )

    # Construct and execute parameterized SQL
    sql = (
        f"SELECT {email_field.strip()}, {matricule_field.strip()}"
        f" FROM {fq_table}"
        f" WHERE {where_clause}"
    )
    logger.info(f"Executing SQL: {sql} with parameter: {param!r}")
    cursor.execute(sql, (param,))

    # Fetch results
    cols = [col[0] for col in cursor.description]
    rows = cursor.fetchall()
    logger.info(f"Rows found: {rows}")

    # Convert rows to dicts
    results = [dict(zip(cols, row)) for row in rows]
    logger.info(f"Query results as dict: {results}")

    if not results:
        msg = f"No employee found with matricule '{matricule_value}'"
        logger.warning(msg)
        if journal_dir:
            with open(journal_path, "a", encoding="utf-8") as jfile:
                jfile.write(f"{datetime.datetime.now().isoformat()} - {msg}\n")
        return None

    employee = results[0]
    email = employee.get(email_field)
    if not email or email.strip() == "":
        msg = f"Employee found but no email for matricule '{matricule_value}'"
        logger.warning(msg)
        if journal_dir:
            with open(journal_path, "a", encoding="utf-8") as jfile:
                jfile.write(f"{datetime.datetime.now().isoformat()} - {msg}\n")
        return None

    # Log and return
    logger.info(f"Email successfully found for matricule '{matricule_value}': {email}")
    if journal_dir:
        with open(journal_path, "a", encoding="utf-8") as jfile:
            jfile.write(f"{datetime.datetime.now().isoformat()} - Email found: {email}\n")

    return email.strip()



def connect_to_mssql(server, database, username, password):
    try:
        conn_str = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};DATABASE={database};UID={username};PWD={password};"
        )
        return pyodbc.connect(conn_str)
    except Exception as e:
        logger.error(f" Failed to connect to {database}: {e}")
        return None

def process_configs():
    session = SessionLocal()
    try:
        user_configs = session.query(UserConfig).all()
        for config in user_configs:
            logger.info(f"\n UserConfig: {config.folder_name}")
            
            for subfolder in config.subfolders:
                logger.info(f"  📁 Subfolder: {subfolder.subfolder_name}")
                number_process = decode_license_key(config.license_key)
                folder_path = os.path.join(config.folder_name, subfolder.subfolder_name)
                logger.info(f"   Looking in: {folder_path}")

                logging.info( f" database user {config.db_username} and password: {config.db_password}" )
                try:
                    conn = connect_to_mssql(config.db_server, subfolder.link_database, config.db_username, config.db_password)
                except Exception as e:
                    raise Exception(f" Error connecting to database {subfolder.link_database}: {e}")
                if not conn:
                    logger.warning(f"   Could not connect to {subfolder.link_database}")
                    continue
                logger.info(f"   Connected to DB: {subfolder.link_database}")

                if os.path.isdir(folder_path):
                    for fname in os.listdir(folder_path):
                        if not fname.lower().endswith(".pdf"):
                            continue

                        pdf_path = os.path.join(folder_path, fname)
                        logger.info(f"\n   File: {fname}")

                        matricules, matricules_w_path = extract_pdf_text(
                            pdf_path, config.ref_text, config.numner_of_char, folder_path
                        )
                        
                        for m in matricules:
                            number_process -= 1
                            logger.info(f"   Remaining processes: {number_process}")
                            if not m:
                                continue
                            logger.info(f"     Found matricule: {m}")
                            results = fetch_by_matricule(
                                conn, subfolder.table, m, subfolder.email_field
                            )
                            if results:
                                email = results[0].get("EMail")
                                if not email:
                                    logger.warning(f" No email found for {m}")
                                    continue
                                logger.info(f"     Query result: {email}")
                                logger.info(f"     File location: {matricules_w_path[m]}")
                                send_email(
                                    email_receiver=email,
                                    attachments=[matricules_w_path[m]],
                                )
                            else:
                                logger.warning(f"     No results for {m}")
                            
                            
                            
                            if number_process <= 0:
                                logger.info("   License limit reached, stopping further processing.")
                                break
                           
                else:
                    logger.warning(f"   Folder not found: {folder_path}")

                conn.close()
                logger.info(f"   Closed connection to {subfolder.link_database}")

    finally:
        session.close()


def ensure_pdf_exists(folder_path):
    """
    Vérifie qu'il existe au moins un fichier .pdf dans le dossier donné.
    Lève une Exception si aucun PDF n'est trouvé.
    """
    if not folder_path:
        logger.warning(" No folder path specified in user configurations.")
        raise Exception("No folder path specified in user configurations.")
    
    if not os.path.isdir(folder_path):
        logger.error(f" The path is not a directory: {folder_path}")
        raise Exception(f"The specified path is not a directory: {folder_path}")

    logger.info(f" Processing folder: {folder_path}")

    # Cherche un PDF
    pdf_found = False
    for entry in os.listdir(folder_path):
        full_path = os.path.join(folder_path, entry)
        # On ne tient compte que des fichiers et uniquement des .pdf
        if os.path.isfile(full_path) and entry.lower().endswith(".pdf"):
            logger.info(f" PDF found: {entry}")
            pdf_found = True
            break

    if not pdf_found:
        logger.error(f" No PDF files found in the folder: {folder_path}")
        raise Exception(f"No PDF files found in the folder: {folder_path}")
    
    # Si besoin, retourne le chemin du PDF trouvé
    return full_path


def run_pdf_automation():
    session = SessionLocal()
    try:
        logger.info(" Fetching user configurations from the database...")
        user_configs = session.query(UserConfig).one()
        if not user_configs:
            logger.warning(" No user configurations found in the database.")
            raise Exception("No user configurations found.")
        logger.info(f" Found {user_configs} user configurations.")
        logger.info(f" Folder name: {user_configs.folder_name}")
        folder_path = user_configs.folder_name
        logger.info(f" Folder path: {folder_path}")
        number_process = decode_license_key(user_configs.license_key)
        logger.info(f" License key decoded, number of processes allowed: {number_process}")
        pdf_path = ensure_pdf_exists(folder_path)
        logger.info(f" PDF file to process: {pdf_path}")                
        
        if user_configs.connection_type == "odbc":
            logger.info(" Starting automation process...")
            conn = connect_to_database(
                user_configs.odbc_source,
                user_configs.db_username,
                user_configs.db_password,
                user_configs.db_name
            )

            matricules, matricules_w_path = extract_pdf_text(
                            pdf_path, user_configs.ref_text, user_configs.number_of_char, folder_path
                        )
            # logger.info(f" Found {(matricules)}")
            logger.info(f" Found {len(matricules)} matricules in {pdf_path}")
            for m in matricules:
                number_process -= 1
                logger.info(f" Remaining processes: {number_process}")
                if not m:
                    continue
                logger.info(f" Found matricule: {m}")
                logger.info(f" Querying database for matricule: {m}")
                results = fetch_by_matricule(
                    conn, user_configs.table_name, m, user_configs.email_field, user_configs.license_field, folder_path
                )
                email = results[0].get("EMail")
                logger.info(f" Queried email: {email}")

                
                if results:
                    email = results[0].get("EMail")
                    if not email:
                        logger.warning(f" No email found for {m}")
                        continue
                    logger.info(f" Queried email: {email}")
                    logger.info(f" File location: {matricules_w_path[m]}")
                    send_email(
                        email_receiver=email,
                        attachments=[matricules_w_path[m]],
                    )
                else:
                    logger.warning(f" No results for {m}")
                
                if number_process <= 0:
                    logger.info("   License limit reached, stopping further processing.")
                    break

            logger.info(" Automation completed successfully.")
    except Exception as e:
        logger.error(f" Automation failed: {e}")
        raise e

if __name__ == "__main__":
    process_configs()
    
