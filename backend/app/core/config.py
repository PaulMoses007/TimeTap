from dotenv import load_dotenv
import os
import warnings

# Load environment variables from .env
load_dotenv()

# Application Settings
APP_NAME = os.getenv("APP_NAME", "TimeTap")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
DEBUG = os.getenv("DEBUG", "False").strip().lower() in ("1", "true", "yes")

# Security
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY or SECRET_KEY.startswith("change-me"):
    raise RuntimeError(
        "SECRET_KEY is missing. Set a random value, for example: "
        'python -c "import secrets; print(secrets.token_urlsafe(48))"'
    )

if len(SECRET_KEY) < 32:
    warnings.warn("SECRET_KEY is shorter than 32 characters; use a longer random value.")

# Database
DATABASE_URL = os.getenv("DATABASE_URL")

# Extra allowed browser origins (comma separated), e.g. a Vercel preview URL
CORS_EXTRA_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_EXTRA_ORIGINS", "").split(",")
    if origin.strip()
]
