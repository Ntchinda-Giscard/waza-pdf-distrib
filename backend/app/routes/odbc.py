from fastapi import APIRouter
import winreg

odbc_router = APIRouter(
    prefix="/odbc"
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

@odbc_router.get("/odbc-sources")
async def list_odbc_sources():
    sources = get_odbc_source_names()
    return {"odbc_sources": sources}
