"""
Startup script for the Smart Railway AI Detection Pipeline.
Run this from the project root: python run_ai.py
"""

import os
import sys

# Set UTF-8 encoding for Windows console
os.environ["PYTHONIOENCODING"] = "utf-8"

# Ensure the project root is in the path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

if __name__ == "__main__":
    from ai.main import run_pipeline

    print("=" * 50)
    print("  Smart Railway Detection System — AI Pipeline")
    print("=" * 50)
    run_pipeline()
