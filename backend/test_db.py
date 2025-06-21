import pyodbc

# Build your ODBC connection string
conn_str = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=DESKTOP-U5UJ75L\\SQL21STDX3V12;"
    "DATABASE=PAIETEST;"
    "UID=my_superuser;"
    "PWD=StrongPassword123!;"
)

# Open the connection
conn = pyodbc.connect(conn_str, autocommit=True)

try:
    cursor = conn.cursor()
    cursor.execute("SELECT EMail, MatriculeSalarie FROM T_SAL;")
    
    for row in cursor:
        print(row)
finally:
    conn.close()
