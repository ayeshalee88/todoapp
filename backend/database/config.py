from sqlmodel import create_engine
from core.config import settings
import os


print(f"DEBUG: settings.database_url = '{settings.database_url}'")
print(f"DEBUG: DATABASE_URL env var = '{os.getenv('DATABASE_URL')}'")
print(f"DEBUG: All env vars with 'DATABASE': {[k for k in os.environ.keys() if 'DATABASE' in k.upper()]}")

# Ensure we have a valid database URL
database_url = settings.database_url or "sqlite:///./todo.db"

if not database_url or database_url.strip() == "":
    database_url = "sqlite:///./todo.db"
    print(f"WARNING: Using fallback database URL: {database_url}")

print(f"DEBUG: Final database_url = '{database_url}'")


# Create database engine
engine = create_engine(settings.database_url, echo=True)

def get_session():
    from sqlmodel import Session
    with Session(engine) as session:
        yield session