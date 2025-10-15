import os
from dotenv import load_dotenv

# Load environment variables from .env file in the project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# --- Database Setup ---
DATABASE_URL = os.getenv("DATABASE_URL", "")
RECIPIENTS_CSV = os.path.join(os.path.dirname(__file__), '..', 'users.csv')
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
# News API key (keep this in backend .env, never commit the real key)
NEWS_API_KEY = os.getenv("NEWS_API_KEY")