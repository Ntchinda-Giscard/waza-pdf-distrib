from fastapi import APIRouter, Depends
import winreg
from sqlalchemy.orm import Session
from app.db.models import DatabaseServer
from app.db.schema import DatabaseServerAdd
from app.db.session import get_db

odbc_router = APIRouter(
    prefix="/odbc",
    tags=["odbc"]
)

def get_odbc_source_names():
    sources = []

    # Sources utilisateur
    try:
        user_key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\ODBC\ODBC.INI\ODBC Data Sources")
        i = 0
        while True:
            try:
                name, driver, _ = winreg.EnumValue(user_key, i)
                sources.append({"name": name, "description": driver})
                i += 1
            except OSError:
                break
        winreg.CloseKey(user_key)
    except FileNotFoundError:
        pass

    # Sources système
    try:
        system_key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"Software\ODBC\ODBC.INI\ODBC Data Sources")
        i = 0
        while True:
            try:
                name, driver, _ = winreg.EnumValue(system_key, i)
                if name not in sources:
                    sources.append({"name": name, "description": driver})
                i += 1
            except OSError:
                break
        winreg.CloseKey(system_key)
    except FileNotFoundError:
        pass

    return sources

def add_database_server(input: DatabaseServerAdd, db: Session):
    db.query(DatabaseServer).delete()
    db.commit()
    
    new = DatabaseServer(
        odbc_source = input.odbc_source,
        connection_type = input.connection_type,
        db_type = input.db_type,  
        db_server = input.db_server,  
        db_username = input.db_username,
        db_password = input.db_password
    )
    db.add(new)
    db.commit()
    db.refresh(new)
    db.close()
    return new

@odbc_router.get("/odbc-sources")
async def list_odbc_sources():
    sources = get_odbc_source_names()
    return {"odbc_sources": sources}


@odbc_router.delete("/delete")
async def delete_odbc_source(db: Session = Depends(get_db)):
    db.query(DatabaseServer).delete()
    db.commit()
    db.close()

@odbc_router.post("/add-odbc")
async def add_database(input: DatabaseServerAdd, db: Session = Depends(get_db)):
    result = add_database_server(input, db)

    return {"server", result}