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

def extract_text(file_path, reference, num_chars, archive_path, journal_dir):
    pages_matricules = []
    matricule_with_path = {}
    today = datetime.date.today().isoformat()
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
                dest_pdf = os.path.join(archive_path, pdf_filename)
                new_pdf.save(dest_pdf)
                new_pdf.close()

                matricule_with_path[matricule] = dest_pdf
                pages_matricules.append(matricule)

    except Exception as e:
        logger.error(f" Error processing {file_path}: {e}")
        return [f" Error processing {file_path}: {e}"], {}

    return pages_matricules, matricule_with_path
