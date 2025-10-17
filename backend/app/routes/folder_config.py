from hashlib import new
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.models import DatabaseConfig
from app.db.schema import DatabaseConfigAdd, DatabaseConfigDelete
from app.db.session import get_db


folder_router = APIRouter(
    prefix="/folder-config",
    tags=["folder-config"]
)

@folder_router.post("/add")
async def add_folder_config(input: DatabaseConfigAdd, db: Session = Depends(get_db)):
    """
    Add or update a folder configuration.
    Replaces existing configuration if subfolder_name already exists.
    """
    # Validate that main_folder is provided
    if not input.main_folder:
        raise HTTPException(
            status_code=400, 
            detail="main_folder is required and cannot be empty"
        )
    
    try:
        # Check if configuration already exists for this subfolder
        existing_config = db.query(DatabaseConfig).filter(
            DatabaseConfig.subfolder_name == input.subfolder_name
        ).first()
        
        if existing_config:
            # Delete the existing configuration
            db.delete(existing_config)
            # Commit the deletion before adding new record
            db.commit()
        
        # Create new configuration
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
        
        # Add and commit the new configuration
        db.add(new_config)
        db.commit()
        
        # Refresh the new object to get any database-generated fields
        db.refresh(new_config)
        db.close()
        
        return {
            "message": "Folder configuration added successfully",
            "config": new_config
        }
        
    except Exception as e:
        # Rollback any partial changes
        db.rollback()
        db.close()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to add folder configuration: {str(e)}"
        )

@folder_router.put("/update")
async def update_folder_config(input: DatabaseConfigAdd, db: Session = Depends(get_db)):
    """
    Update the folder configuration.
    """
    folder_config = db.query(DatabaseConfig).filter(DatabaseConfig.subfolder_name == input.subfolder_name).first()
    
    if folder_config:
        folder_config.main_folder = input.main_folder
        folder_config.link_database = input.link_database.strip()
        folder_config.archive_folder = input.archive_folder
        folder_config.log_folder = input.log_folder
        folder_config.tablename = input.tablename.strip()
        folder_config.matricule_field = input.matricule_field.strip()
        folder_config.email_field = input.email_field.strip()
        
        db.commit()
        db.refresh(folder_config)
        db.close()
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
        db.close()
        return {"message": "Folder configuration deleted successfully."}

    return {"message": "No folder configuration found."}
