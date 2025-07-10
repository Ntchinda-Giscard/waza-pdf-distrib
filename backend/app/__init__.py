import logging
import os
import datetime
import fitz

from test import extract_text_after_reference  # PyMuPDF


# 🔗 Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def extract_text(file_path, reference, num_chars, archive_path, journal_dir, archive_file_dir):
    pages_matricules = []
    matricule_with_path = {}
    today = datetime.date.today().isoformat()
    journal_filename = f"journal-{today}.txt"
    journal_path = os.path.join(journal_dir, journal_filename)

    # Create directories if they don't exist
    os.makedirs(archive_path, exist_ok=True)
    os.makedirs(journal_dir, exist_ok=True)

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
                
                # Create new PDF for this page
                new_pdf = fitz.open()
                new_pdf.insert_pdf(doc, from_page=i, to_page=i)

                # Use a default name if matricule is None or empty
                matricule_safe = matricule if matricule else "NO_MATRICULE"
                pdf_filename = f"{matricule_safe}_page_{i+1}.pdf"
                dest_pdf = os.path.join(archive_path,archive_file_dir, pdf_filename)
                new_pdf.save(dest_pdf)
                new_pdf.close()

                matricule_with_path[matricule] = dest_pdf
                pages_matricules.append(matricule)

            # move the file to the archive_file_dir without renaming it
            os.rename(file_path, os.path.join(archive_file_dir, os.path.basename(file_path)))  
    except Exception as e:
        logger.error(f" Error processing {file_path}: {e}")
        return [f" Error processing {file_path}: {e}"], {}

    return pages_matricules, matricule_with_path

def extract_text(file_path, reference, num_chars, archive_path, journal_dir, archive_file_dir):
    """Extract matricule from PDF pages and save each page to a new PDF file
    with a filename based on the matricule and the original PDF filename.
    If the extraction fails, log an error message in the journal file and
    return an empty list and an empty dictionary.
    """
    pages_matricules = []
    matricule_with_path = {}
    today = datetime.date.today().isoformat()
    journal_filename = f"journal-{today}.txt"
    journal_path = os.path.join(journal_dir, journal_filename)

    # Create directories if they don't exist
    os.makedirs(archive_path, exist_ok=True)
    os.makedirs(journal_dir, exist_ok=True)
    milis = datetime.datetime.now().microsecond // 1000

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
                        logger.info(f"     Page {i+1}: Found matricule '{matricule}'")
                    else:
                        log_msg = f"{datetime.datetime.now().isoformat()} - Page {i+1}:  No matricule found\n"
                        logger.warning(f"      {datetime.datetime.now().isoformat()} - Page {i+1}: No matricule found")
                    journal_file.write(log_msg)

                # Create new PDF for this page
                new_pdf = fitz.open()
                new_pdf.insert_pdf(doc, from_page=i, to_page=i)

                # Use a default name if matricule is None or empty
                matricule_safe = matricule if matricule else "NO_MATRICULE"
                pdf_filename = f"{matricule_safe}_page_{i+1}.pdf"
                dest_pdf = os.path.join(archive_path,archive_file_dir, pdf_filename)
                new_pdf.save(dest_pdf)
                new_pdf.close()

                matricule_with_path[matricule] = dest_pdf
                pages_matricules.append(matricule)

        # move the file to the archive_file_dir without renaming it
        # try:
        #     os.rename(file_path, os.path.join(archive_file_dir, os.path.basename(file_path)))
        # except Exception as e:
        #     logger.error(f" Error moving {file_path}: {e}")
        #     pass
    except Exception as e:
        logger.error(f" Error processing {file_path}: {e}")
        return [f" Error processing {file_path}: {e}"], {}

    return pages_matricules, matricule_with_path
