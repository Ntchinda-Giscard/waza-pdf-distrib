from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserConfig(Base):
    __tablename__ = "userconfigs"

    id = Column(Integer, primary_key=True, index=True)
    odbc_source = Column(String, unique=True)
    db_type = Column(String)
    db_server = Column(String)
    db_username = Column(String)
    db_password = Column(String)
    db_name = Column(String)
    db_port = Column(Integer, default=1433)
    folder_name = Column(String, unique=True)
    license_key = Column(String)
    numner_of_char = Column(Integer)
    ref_text = Column(String)

    # subfolders = relationship("SubFolderConfig", cascade="all, delete", back_populates="user")

# class SubFolderConfig(Base):
#     __tablename__ = "subfolderconfigs"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("userconfigs.id"))
#     subfolder_name = Column(String)
#     link_database = Column(String)
#     table = Column(String)
#     email_field = Column(String)
#     license_field = Column(String)

#     user = relationship("UserConfig", back_populates="subfolders")
