#!/bin/bash
# Stock Comparison Tool Runner
# ============================
# This script runs the stock comparison tool to check for mismatches
# between PANNRamyeonCorner frontend and cloud database

echo "========================================"
echo "Stock Comparison Tool"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check if required packages are installed
echo "Checking dependencies..."
if ! python3 -c "import pymongo" &> /dev/null; then
    echo "Installing required packages..."
    pip3 install -r requirements_comparison.txt
fi

echo ""
echo "========================================"
echo "Running Stock Comparison..."
echo "========================================"
echo ""

# Set environment variables (customize these as needed)
export MONGODB_URI="mongodb+srv://your-username:your-password@your-cluster.mongodb.net/"
export DATABASE_NAME="pos_system"
export API_BASE_URL="https://pann-pos.netlify.app/api"

# Run the comparison
python3 compare_stock.py --show-matches --export stock_comparison_report.json

echo ""
echo "========================================"
echo "Comparison Complete!"
echo "========================================"
echo ""
echo "Report saved to: stock_comparison_report.json"
echo ""

