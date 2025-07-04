from hashlib import new
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.models import DatabaseConfig
from app.db.schema import DatabaseConfigAdd, DatabaseConfigDelete
from app.db.session import get_db


folder_router = APIRouter(
    prefix="/folder-config"
)

@folder_router.post("/add")
async def get_folder_config(input: DatabaseConfigAdd, db: Session = Depends(get_db)):
    """
    Retrieve the folder configuration.
    """
    if(input.main_folder):
        # Add new folder configuration
        new_config = DatabaseConfig(
            main_folder=input.main_folder,
            subfolder_name=input.subfolder_name,
            link_database=input.link_database
        )
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        return new_config

    return None


@folder_router.delete("/delete")
async def delete_folder_config(input: DatabaseConfigDelete, db: Session = Depends(get_db)):
    """
    Delete the folder configuration.
    """
    folder_config = db.query(DatabaseConfig).filter(DatabaseConfig.subfolder_name == input.subfolder_name).first()
    if folder_config:
        db.delete(folder_config)
        db.commit()
        return {"message": "Folder configuration deleted successfully."}

    return {"message": "No folder configuration found."}
