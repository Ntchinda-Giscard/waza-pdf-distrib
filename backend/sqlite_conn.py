import sqlite3
from contextlib import contextmanager

DB_PATH = "sagex3_seed.db"

@contextmanager
def sqlite_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()