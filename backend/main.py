# main.py or routers/config.py
import sys
from fastapi import FastAPI, Depends, HTTPException, logger
from sqlalchemy.orm import Session
from app.crud.insert_config import create_or_update_user_config
from app.db.schema import UserConfigCreate
from app.db.session import get_db, engine, Base
from app.routes.odbc import odbc_router
from fastapi.middleware.cors import CORSMiddleware
import logging

from test import process_configs


# Configure logging to help with debugging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('fastapi.log')
    ]
)

logger = logging.getLogger(__name__)

logger.info(f'Creating app.db...')
Base.metadata.create_all(bind=engine)
logger.info(f'Created app.db')
app = FastAPI()

# Set allowed origins (example: React frontend on localhost:3000)
origins = [
    "*"
    # Add other domains as needed, e.g. production URLs
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # or use ["*"] for all origins (not recommended for production)
    allow_credentials=True,
    allow_methods=["*"],    # or restrict to ["GET", "POST", ...]
    allow_headers=["*"],    # or restrict to specific headers
)


app.include_router(odbc_router)

# Health check endpoint (important for Electron startup detection)
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "FastAPI server is running"}

@app.get("/")
async def root():
    return {"message": "FastAPI backend is running", "version": "1.0.0"}

# Add your other endpoints here
@app.get("/api/test")
async def test_endpoint():
    return {"message": "Test endpoint working"}

@app.post("/user-config/")
def create_config(config: UserConfigCreate, db: Session = Depends(get_db)):  # ✅ correct usage
    return create_or_update_user_config(db, config)

@app.post("/run-automtion/")
async def run_automation():

    try:
        process_configs()
        return {"message" : "Automation ran with success"}
    except Exception as e:
        return HTTPException( detail=f"{e}", status_code=500 )


@app.get("/")
def read_root():
    return {"Hello": "World"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)