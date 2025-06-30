# schemas.py
from pydantic import BaseModel
from typing import List, Optional

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

class UserConfigAdd(BaseModel):
    odbc_source: Optional[str]
    db_type: str
    db_server: Optional[str]
    db_username: str
    db_password: str
    db_name: Optional[str]
    db_port: int
    folder_name: str
    license_key: str
    numner_of_char: int
    ref_text: str
