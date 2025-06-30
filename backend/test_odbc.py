import winreg

def list_odbc_sources():
    print("=== Sources ODBC utilisateur ===")
    try:
        user_key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\ODBC\ODBC.INI\ODBC Data Sources")
        i = 0
        while True:
            try:
                name, driver, _ = winreg.EnumValue(user_key, i)
                print(f"Nom : {name}, Pilote : {driver}")
                i += 1
            except OSError:
                break
        winreg.CloseKey(user_key)
    except FileNotFoundError:
        print("Aucune source ODBC utilisateur trouvée.")

    print("\n=== Sources ODBC système ===")
    try:
        system_key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"Software\ODBC\ODBC.INI\ODBC Data Sources")
        i = 0
        while True:
            try:
                name, driver, _ = winreg.EnumValue(system_key, i)
                print(f"Nom : {name}, Pilote : {driver}")
                i += 1
            except OSError:
                break
        winreg.CloseKey(system_key)
    except FileNotFoundError:
        print("Aucune source ODBC système trouvée.")
if __name__ == "__main__":
    list_odbc_sources()
# This script lists ODBC data sources for both user and system levels on a Windows machine.
# It uses the winreg module to access the Windows registry and retrieve the ODBC data sources