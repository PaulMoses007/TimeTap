from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Application Settings
APP_NAME = os.getenv("APP_NAME")
APP_VERSION = os.getenv("APP_VERSION")
DEBUG = os.getenv("DEBUG")

# Security
SECRET_KEY = os.getenv("SECRET_KEY")

# Database
DATABASE_URL = os.getenv("DATABASE_URL")