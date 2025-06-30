# schemas.py
from pydantic import BaseModel
from typing import List, Optional

from sqlalchemy import Column

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
    odbc_source: str
    connection_type: str
    db_type: Optional[str] = None
    db_server: Optional[str] = None
    db_username: Optional[str] = None
    db_password: Optional[str] = None
    db_name: Optional[str] = None
    db_port: Optional[int] = None
    folder_name: Optional[str] = None
    license_key: Optional[str] = None
    number_of_char: Optional[int] = None
    ref_text: Optional[str] = None
    table_name: Optional[str] = None
    email_field: Optional[str] = None
    license_field: Optional[str] = None

