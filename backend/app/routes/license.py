from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.models import License
from app.db.schema import LicenseConfigAdd
from app.db.session import get_db
from app.secret_generator import SECRET, decode_license_key

license_router = APIRouter(
    prefix="/license",
    tags=["license"]
)

def verify_license_key(key: str, secret: str = SECRET) -> bool:
    """
    Verify the provided license key.

    Returns True if the key is valid and the decoded count is non-negative.
    Returns False if the key is invalid or signature check fails.
    """
    try:
        count = decode_license_key(key, secret)
        # Additional checks can go here, e.g., count > 0
        return True
    except ValueError:
        return False

@license_router.post("/activate")
async def add_license(input: LicenseConfigAdd, db: Session = Depends(get_db)):
    db.query(License).delete()
    db.commit()
    try:
        if not verify_license_key(input.license):
            raise ValueError("Clé de licence invalide ou signature incorrecte")
        new = License(
            license=input.license
        )
        db.add(new)
        db.commit()
        db.refresh(new)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erreur lors de l'activation de la licence : {e}")
    return new