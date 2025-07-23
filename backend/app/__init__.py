import logging
import os
import datetime
import fitz
import os
import time
import stat
import shutil
from pathlib import Path
from test import extract_text_after_reference  # PyMuPDF
from app.utils import text_extractor

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
    logger.info(f"Journal file: {journal_filename}")
    journal_path = os.path.join(journal_dir, journal_filename)
    logger.info(f"Journal path: {journal_path}")

    # Create directories if they don't exist
    os.makedirs(archive_path, exist_ok=True)
    os.makedirs(journal_dir, exist_ok=True)
    logger.info(f"Archive path: {archive_path}")
    logger.info(f"Journal directory: {journal_dir}")
    
    # Create the full archive directory path
    full_archive_path = os.path.join(archive_path, archive_file_dir)
    os.makedirs(full_archive_path, exist_ok=True)
    logger.info(f"Full archive path: {full_archive_path}")

    # Keep track of created files for cleanup if needed
    created_files = []
    doc = None
    
    try:
        # Open the PDF document
        doc = fitz.open(file_path)
        pdf_name = os.path.splitext(os.path.basename(file_path))[0]
        
        logger.info(f"Processing PDF: {file_path} with {len(doc)} pages")
        
        for i, page in enumerate(doc):
            new_pdf = None
            try:
                # Extract text from the current page
                page_text = page.get_text()
                # logger.info(f"Text: {page_text}")
                logger.info(f"Reference text: {reference}, number of chars: {num_chars}")
                matricule = text_extractor(page_text, reference, num_chars)
                pages_matricules.append(matricule)
                
                # # Log the matricule finding result
                with open(journal_path, "a", encoding="utf-8") as journal_file:
                    if matricule:
                        log_msg = f"{datetime.datetime.now().isoformat()} - Page {i+1}: Found matricule '{matricule}'\n"
                        logger.info(f"Page {i+1}: Found matricule '{matricule}'")
                    else:
                        log_msg = f"{datetime.datetime.now().isoformat()} - Page {i+1}: No matricule found\n"
                        logger.warning(f"Page {i+1}: No matricule found")
                    journal_file.write(log_msg)
                
                # Create new PDF for this page
                new_pdf = fitz.open()  # Create a new empty PDF
                new_pdf.insert_pdf(doc, from_page=i, to_page=i)  # Insert current page
                
                # Generate safe filename
                matricule_safe = matricule if matricule else "NO_MATRICULE"
                pdf_filename = f"{matricule_safe}_page_{i+1}.pdf"
                dest_pdf = os.path.join(full_archive_path, pdf_filename)
                logger.info(f"Destination PDF: {dest_pdf}")
                # Save the new PDF
                new_pdf.save(dest_pdf)
                
                # Store the matricule and path mapping
                matricule_with_path[matricule] = dest_pdf
                
                
                logger.info(f"Created page PDF: {dest_pdf}")
                
            except Exception as page_error:
                logger.error(f"Error processing page {i+1}: {page_error}")
                
            finally:
                # Always close the new_pdf object to free resources
                if new_pdf:
                    new_pdf.close()
                    new_pdf = None
                
    except Exception as e:
        logger.error(f"Error opening or processing PDF {file_path}: {e}")
        return [f"Error processing {file_path}: {e}"], {}
        
    finally:
        # Always close the main document to free file handles
        if doc:
            doc.close()
            doc = None
            
        # Give the system a moment to release file handles
        time.sleep(0.1)

    logger.info(f"Successfully processed {len(pages_matricules)} pages from {file_path}")
    return pages_matricules, matricule_with_path


def safe_file_operation(source_path, dest_path, operation="move", max_retries=3, retry_delay=1):
    """
    Safely perform file operations with retry logic and permission handling.
    
    Args:
        source_path: Path to the source file
        dest_path: Path to the destination 
        operation: "move", "copy", or "delete"
        max_retries: Number of retry attempts
        retry_delay: Delay between retries in seconds
    
    Returns:
        bool: True if successful, False otherwise
    """
    
    for attempt in range(max_retries):
        try:
            # Ensure the source file exists
            if not os.path.exists(source_path):
                logger.error(f"Source file does not exist: {source_path}")
                return False
            
            # Try to remove read-only attribute if it exists
            try:
                if os.path.exists(source_path):
                    os.chmod(source_path, stat.S_IWRITE)
            except Exception as chmod_error:
                logger.warning(f"Could not change file permissions: {chmod_error}")
            
            # Perform the requested operation
            if operation == "move":
                # Ensure destination directory exists
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                shutil.move(source_path, dest_path)
                logger.info(f"Successfully moved {source_path} to {dest_path}")
                
            elif operation == "copy":
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                shutil.copy2(source_path, dest_path)
                logger.info(f"Successfully copied {source_path} to {dest_path}")
                
            elif operation == "delete":
                os.remove(source_path)
                logger.info(f"Successfully deleted {source_path}")
            
            return True
            
        except PermissionError as perm_error:
            logger.warning(f"Permission error on attempt {attempt + 1}: {perm_error}")
            
        except Exception as general_error:
            logger.warning(f"General error on attempt {attempt + 1}: {general_error}")
        
        # If not the last attempt, wait before retrying
        if attempt < max_retries - 1:
            logger.info(f"Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
    
    # All attempts failed
    logger.error(f"Failed to perform {operation} operation after {max_retries} attempts")
    return False


def archive_original_file(file_path, archive_file_dir):
    """
    Safely archive the original file after processing.
    
    Args:
        file_path: Path to the original file
        archive_file_dir: Directory where the file should be archived
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create the archive directory if it doesn't exist
        os.makedirs(archive_file_dir, exist_ok=True)
        
        # Generate the destination path
        filename = os.path.basename(file_path)
        dest_path = os.path.join(archive_file_dir, filename)
        
        # Handle case where file already exists in archive
        if os.path.exists(dest_path):
            base_name, ext = os.path.splitext(filename)
            counter = 1
            while os.path.exists(dest_path):
                new_filename = f"{base_name}_{counter}{ext}"
                dest_path = os.path.join(archive_file_dir, new_filename)
                counter += 1
            logger.info(f"File already exists in archive, using new name: {new_filename}")
        
        # Use the safe file operation function
        return safe_file_operation(file_path, dest_path, "move")
        
    except Exception as e:
        logger.error(f"Error archiving file {file_path}: {e}")
        return False
