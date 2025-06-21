# schemas.py
from pydantic import BaseModel
from typing import List

class SubFolderConfigCreate(BaseModel):
    subfolder_name: str
    link_database: str
    table: str
    email_field: str
    license_field: str

class UserConfigCreate(BaseModel):
    db_server: str
    db_username: str
    db_password: str
    folder_name: str
    license_key: str
    numner_of_char: int
    ref_text: str
    subfolders: List[SubFolderConfigCreate]
