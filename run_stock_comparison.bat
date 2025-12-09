@echo off
REM Stock Comparison Tool Runner
REM ============================
REM This script runs the stock comparison tool to check for mismatches
REM between PANNRamyeonCorner frontend and cloud database

echo ========================================
echo Stock Comparison Tool
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Check if required packages are installed
echo Checking dependencies...
pip show pymongo >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    pip install -r requirements_comparison.txt
)

echo.
echo ========================================
echo Running Stock Comparison...
echo ========================================
echo.

REM Set environment variables (customize these as needed)
set MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/
set DATABASE_NAME=pos_system
set API_BASE_URL=https://pann-pos.netlify.app/api

REM Run the comparison
python compare_stock.py --show-matches --export stock_comparison_report.json

echo.
echo ========================================
echo Comparison Complete!
echo ========================================
echo.
echo Report saved to: stock_comparison_report.json
echo.
pause

