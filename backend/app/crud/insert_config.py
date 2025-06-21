# crud.py
from sqlalchemy.orm import Session

from app.db.models import SubFolderConfig, UserConfig
from app.db.schema import UserConfigCreate

def create_or_update_user_config(db: Session, config: UserConfigCreate):
    # 1) Nuke existing rows
    db.query(SubFolderConfig).delete()
    db.query(UserConfig).delete()
    db.commit()

    # 2) Create the new one
    new = UserConfig(
        db_server=config.db_server,
        db_username=config.db_username,
        db_password=config.db_password,
        folder_name=config.folder_name,
        license_key=config.license_key,
        numner_of_char=config.numner_of_char,
        ref_text=config.ref_text
    )
    for sf in config.subfolders:
        new.subfolders.append(SubFolderConfig(
            subfolder_name=sf.subfolder_name,
            link_database=sf.link_database,
            table=sf.table,
            email_field=sf.email_field,
            license_field=sf.license_field
        ))

    db.add(new)
    db.commit()
    db.refresh(new)
    return new


