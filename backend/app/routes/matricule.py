from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.models import MatriculeConfig
from app.db.schema import MatriculeConfigAdd
from app.db.session import get_db
from pydantic import BaseModel
from PyPDF2 import PdfReader
from fastapi import UploadFile, File, HTTPException
import io

matricule_router = APIRouter(
    prefix="/matricule",
    tags=["matricule"]
)


class MatriculeTest(BaseModel):
    text: str

@matricule_router.post("/add")
async def add_matricule(input: MatriculeConfigAdd, db: Session = Depends(get_db)):
    db.query(MatriculeConfig).delete()
    db.commit()
    new = MatriculeConfig(
        number_of_character=input.number_of_character,
        ref_text=input.ref_text
    )
    db.add(new)
    db.commit()
    db.refresh(new)
    return new




def read_first_page_text(file_bytes: bytes) -> str:
    """
    Reads and returns the text from the first page of a PDF file in memory.
    """
    try:
        pdf_stream = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_stream)
        if len(reader.pages) == 0:
            return ""
        first_page = reader.pages[0]
        text = first_page.extract_text() or ""
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read PDF: {e}")

@matricule_router.post("/test", response_model=MatriculeTest)
async def get_matricule(file: UploadFile = File(...)):
    """
    Endpoint to extract text from the first page of an uploaded PDF.
    """
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    # Read the file into memory
    file_bytes = await file.read()

    # Extract text
    text = read_first_page_text(file_bytes)

    return MatriculeTest(text=text)
