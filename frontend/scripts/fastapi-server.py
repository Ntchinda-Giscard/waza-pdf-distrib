from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import uvicorn

app = FastAPI(title="ODBC Sources API", version="1.0.0")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock ODBC sources data
ODBC_SOURCES = [
    {
        "name": "SQL Server Native Client 11.0",
        "driver": "SQLNCLI11",
        "description": "Microsoft SQL Server Native Client 11.0"
    },
    {
        "name": "PostgreSQL ODBC Driver (Unicode)",
        "driver": "PostgreSQL Unicode",
        "description": "PostgreSQL ODBC Driver with Unicode support"
    },
    {
        "name": "MySQL ODBC 8.0 Driver",
        "driver": "MySQL ODBC 8.0 Driver",
        "description": "MySQL Connector/ODBC 8.0"
    },
    {
        "name": "Microsoft Access Driver",
        "driver": "Microsoft Access Driver (*.mdb, *.accdb)",
        "description": "Microsoft Access Database Engine"
    },
    {
        "name": "Oracle ODBC Driver",
        "driver": "Oracle in OraClient19Home1",
        "description": "Oracle Database ODBC Driver"
    },
    {
        "name": "SQLite3 ODBC Driver",
        "driver": "SQLite3 ODBC Driver",
        "description": "SQLite ODBC Driver"
    }
]

@app.get("/")
async def root():
    return {"message": "FastAPI ODBC Sources Server", "version": "1.0.0"}

@app.get("/odbc-sources")
async def get_odbc_sources() -> List[Dict[str, str]]:
    """
    Get list of available ODBC data sources
    """
    return ODBC_SOURCES

@app.get("/health")
async def health_check():
    return {"status": "healthy", "sources_count": len(ODBC_SOURCES)}

if __name__ == "__main__":
    print("Starting FastAPI server...")
    print("ODBC Sources API will be available at:")
    print("- http://localhost:8000/odbc-sources")
    print("- http://127.0.0.1:8000/odbc-sources")
    print("\nAPI Documentation available at:")
    print("- http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
