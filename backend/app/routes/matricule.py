from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.models import MatriculeConfig
from app.db.schema import MatriculeConfigAdd
from app.db.session import get_db

matricule_router = APIRouter(
    prefix="/matricule",
    tags=["matricule"]
)

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