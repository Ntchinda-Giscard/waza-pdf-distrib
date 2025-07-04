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
            link_database=input.link_database,
            archive_folder=input.archive_folder,
            log_folder=input.log_folder,
            tablename=input.tablename,
            matricule_field=input.matricule_field,
            email_field=input.email_field
        )
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        return new_config

    return None

@folder_router.put("/update")
async def update_folder_config(input: DatabaseConfigAdd, db: Session = Depends(get_db)):
    """
    Update the folder configuration.
    """
    folder_config = db.query(DatabaseConfig).filter(DatabaseConfig.subfolder_name == input.subfolder_name).first()
    
    if folder_config:
        folder_config.main_folder = input.main_folder
        folder_config.link_database = input.link_database
        folder_config.archive_folder = input.archive_folder
        folder_config.log_folder = input.log_folder
        folder_config.tablename = input.tablename
        folder_config.matricule_field = input.matricule_field
        folder_config.email_field = input.email_field
        
        db.commit()
        db.refresh(folder_config)
        return folder_config

    return {"message": "No folder configuration found."}


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
