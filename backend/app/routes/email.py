from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.models import EmailConfig
from app.db.schema import EmailConfigAdd
from app.db.session import get_db

email_router = APIRouter(
    prefix="/email",
    tags=["email"]
)

@email_router.post("/add")
async def add_email(input: EmailConfigAdd, db: Session = Depends(get_db)):
    db.query(EmailConfig).delete()
    db.commit()
    new = EmailConfig(
        smtp_server=input.smtp_server,
        user_name=input.user_name,
        password=input.password,
        port=input.port,
        tls=input.tls,
        ssl=input.ssl
    )
    db.add(new)
    db.commit()
    db.refresh(new)
    return new