# # read_configs.py
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker

# from app.db.models import UserConfig

# # SQLite DB path
# DATABASE_URL = "sqlite:///./app.db"  # adjust if needed

# # Create engine and session
# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(bind=engine)

# def read_all_configs():
#     session = SessionLocal()

#     try:
#         configs = session.query(UserConfig).all()
#         for config in configs:
#             print("📁 UserConfig:")
#             print(f"  ID: {config.id}")
#             print(f"  Folder Name: {config.folder_name}")
#             print(f"  DB Server: {config.db_server}")
#             print(f"  Username: {config.db_username}")
#             print(f"  Ref Text: {config.ref_text}")
#             print("  🔗 Subfolders:")

#             for sf in config.subfolders:
#                 print(f"    - Subfolder: {sf.subfolder_name}")
#                 print(f"      DB: {sf.link_database}")
#                 print(f"      Table: {sf.table}")
#                 print(f"      Email Field: {sf.email_field}")
#                 print(f"      License Field: {sf.license_field}")
#             print("-" * 40)

#     finally:
#         session.close()

# if __name__ == "__main__":
#     read_all_configs()


from test import process_configs


process_configs()