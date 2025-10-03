# Aqua Sentinel

Aqua Sentinel is a flood prediction and community reporting platform. It provides risk alerts based on geographical and weather data, and allows users to submit and view community-sourced reports on local conditions.

## Project Structure

The project is organized into a frontend and a modular backend:

```
aqua-sentinal/
├── backend/
│   ├── routers/          # API endpoint groups
│   │   ├── community.py
│   │   └── predictions.py
│   ├── utils/            # Helper functions (geo, weather, etc.)
│   ├── .env.example      # Environment variable template
│   ├── config.py         # Application configuration
│   ├── database.py       # Database session management
│   ├── main.py           # FastAPI app initialization
│   ├── models.py         # SQLAlchemy ORM models
│   ├── schemas.py        # Pydantic data schemas
│   └── requirements.txt  # Python dependencies
├── frontend/
│   └── ...
└── Readme.md
```

## Backend Setup

### 1. Navigate to Backend Directory
Open a terminal and navigate to the `backend` folder:
```bash
cd backend
```

### 2. Create a Virtual Environment (Recommended)
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies
Install all required Python packages.
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
The application uses a `.env` file for configuration.

1.  Create a `.env` file by copying the example template:
    ```bash
    # On Windows
    copy .env.example .env
    # On macOS/Linux
    cp .env.example .env
    ```
2.  Open the newly created `.env` file and set the `DATABASE_URL` to your PostgreSQL connection string. The database requires the **PostGIS** extension to be enabled for geospatial features.

### 5. Run the Server
Start the backend server using Uvicorn. The `--reload` flag will automatically restart the server on code changes.
```bash
uvicorn main:app --reload
```
The backend API will be available at `http://127.0.0.1:8000`.

## Frontend Setup

1. Open a new terminal and navigate to the frontend folder:
```bash
cd frontend
```
2. Install frontend dependencies:
```
npm install
```
3. Start the frontend development server:
```
npm run dev
```
The frontend will be running at http://localhost:5173/

# Troubleshooting Supabase Connection
To check working of supabase:

- Change DNS to:
    - 8.8.8.8
    - 8.8.4.4
- Then run:
```
ipconfig /flushdns
ping db.xyiqiwttgfqgnlfmvijo.supabase.co
```
