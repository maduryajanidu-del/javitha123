"""
Startup script for the Smart Railway Backend API.
Run this from the project root: python run_backend.py
"""

import os
import sys
import uvicorn

# Add the backend directory to Python's module search path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.insert(0, backend_dir)

# Set UTF-8 encoding for Windows console
os.environ["PYTHONIOENCODING"] = "utf-8"

if __name__ == "__main__":
    print("=" * 50)
    print("  Smart Railway Detection System — Backend API")
    print("=" * 50)
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[backend_dir],
    )
