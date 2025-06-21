# app/api/odbc_connect.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import pyodbc

router = APIRouter(prefix="/odbc", tags=["ODBC"])

class ODBCParams(BaseModel):
    driver: str = Field(..., example="ODBC Driver 17 for SQL Server")
    server: str = Field(..., example="my-sql-server.database.windows.net")
    database: str = Field(..., example="MyDatabase")
    uid: str = Field(..., example="username")
    pwd: str = Field(..., example="secretpassword")

@router.post("/connect")
def connect_odbc(params: ODBCParams):
    """
    - Takes connection parameters in the body
    - Opens a pyodbc connection
    - Runs `SELECT 1` to verify
    - Closes the connection
    - Returns the test-query result or an error
    """
    # Build the ODBC connection string
    conn_str = (
        f"DRIVER={{{params.driver}}};"
        f"SERVER={params.server};"
        f"DATABASE={params.database};"
        f"UID={params.uid};"
        f"PWD={params.pwd}"
    )

    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()[0]
    except pyodbc.Error as e:
        # Bubble up any ODBC errors with a 500
        raise HTTPException(status_code=500, detail=f"ODBC error: {e}")
    finally:
        # Ensure we always close the connection
        try:
            conn.close()
        except Exception:
            pass

    return {"status": "connected", "test_query_result": result}
