from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserConfig(Base):
    __tablename__ = "userconfigs"

    id = Column(Integer, primary_key=True, index=True)
    odbc_source = Column(String, unique=True, nullable=False)
    connection_type = Column(String, nullable=False)
    db_type = Column(String, nullable=True)         # facultatif
    db_server = Column(String, nullable=True)       # facultatif
    db_username = Column(String, nullable=True)     # facultatif
    db_password = Column(String, nullable=True)     # facultatif
    db_name = Column(String, nullable=True)         # facultatif
    db_port = Column(Integer, nullable=True)        # facultatif
    folder_name = Column(String, unique=True, nullable=True)  # facultatif
    license_key = Column(String, nullable=True)     # facultatif
    number_of_char = Column(Integer, nullable=True) # facultatif
    ref_text = Column(String, nullable=True)        # facultatif
    table_name = Column(String, nullable=True)      # facultatif
    email_field = Column(String, nullable=True)     # facultatif
    license_field = Column(String, nullable=True)   # facultatif

    # subfolders = relationship("SubFolderConfig", cascade="all, delete", back_populates="user")

class SubFolderConfig(Base):
    __tablename__ = "subfolderconfigs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("userconfigs.id"))
    subfolder_name = Column(String)
    link_database = Column(String)
    table = Column(String)
    email_field = Column(String)
    license_field = Column(String)

    # user = relationship("UserConfig", back_populates="subfolders")
