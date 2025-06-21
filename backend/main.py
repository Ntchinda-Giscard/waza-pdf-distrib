# main.py or routers/config.py
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.crud.insert_config import create_or_update_user_config
from app.db.schema import UserConfigCreate
from app.db.session import get_db, engine, Base
from fastapi.middleware.cors import CORSMiddleware
from test import process_configs

Base.metadata.create_all(bind=engine)

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
    uvicorn.run(app, host="127.0.0.1", port=8000)