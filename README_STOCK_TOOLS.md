# Stock Comparison & Fix Tools

## 🎯 Purpose

This toolkit helps you identify and fix stock mismatches between what customers see on PANNRamyeonCorner and what's actually stored in the cloud database.

## 📁 Quick Navigation

| Document | Purpose |
|----------|---------|
| **[STOCK_TOOLS_SUMMARY.md](STOCK_TOOLS_SUMMARY.md)** | **START HERE** - Quick reference and common commands |
| [STOCK_COMPARISON_README.md](STOCK_COMPARISON_README.md) | Complete tool documentation with examples |
| [STOCK_AUDIT_WORKFLOW.md](STOCK_AUDIT_WORKFLOW.md) | Step-by-step workflow guide |
| [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) | System architecture and data flow diagrams |

## 🚀 Quick Start (3 Steps)

### 1. Install
```bash
pip install -r requirements_comparison.txt
```

### 2. Configure
Set your MongoDB connection details in environment variables or edit the runner scripts:
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
DATABASE_NAME=pos_system
API_BASE_URL=https://pann-pos.netlify.app/api
```

### 3. Run
**Windows:**
```bash
run_stock_comparison.bat
```

**Linux/Mac:**
```bash
chmod +x run_stock_comparison.sh
./run_stock_comparison.sh
```

## 🛠️ Available Tools

### 1. Stock Comparison Tool (`compare_stock.py`)
Identifies stock mismatches across three sources:
- Cloud MongoDB database
- Customer API (what PANNRamyeonCorner sees)
- Batch FIFO system

**Usage:**
```bash
# Full comparison
python compare_stock.py --export report.json

# Check specific product
python compare_stock.py --product-id "PROD-00001"
```

### 2. Stock Fix Tool (`fix_stock_mismatches.py`)
Automatically fixes identified mismatches.

**Usage:**
```bash
# Dry run (safe, no changes)
python fix_stock_mismatches.py --fix-all

# Apply fixes
python fix_stock_mismatches.py --fix-all --live

# Fix from report
python fix_stock_mismatches.py --from-report report.json --live
```

## 📊 What Gets Checked

✅ Cloud database stock values  
✅ Customer API visibility  
✅ Batch system calculations  
✅ stock vs total_stock field sync  
✅ Product status and deletion flags  

## ⚠️ Safety First

- ✅ **Dry run by default** - no changes unless you add `--live`
- ✅ **Confirmation required** - must type "yes" in live mode
- ✅ **Backup reminder** - docs include backup commands
- ✅ **Detailed logging** - all changes are tracked

## 📈 Typical Workflow

```
1. Run comparison  →  2. Review report  →  3. Dry run fixes
                ↓
4. Backup database  →  5. Apply fixes  →  6. Verify success
```

## 🆘 Need Help?

| Issue | Where to Look |
|-------|--------------|
| How to use tools | [STOCK_TOOLS_SUMMARY.md](STOCK_TOOLS_SUMMARY.md) |
| Step-by-step guide | [STOCK_AUDIT_WORKFLOW.md](STOCK_AUDIT_WORKFLOW.md) |
| Detailed options | [STOCK_COMPARISON_README.md](STOCK_COMPARISON_README.md) |
| Understanding system | [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) |
| Connection errors | Check MongoDB URI and credentials |
| API errors | Verify API URL and endpoint availability |

## 📦 Files Included

```
PANNRamyeonCorner/
├── compare_stock.py                 # Main comparison tool
├── fix_stock_mismatches.py          # Auto-fix tool
├── requirements_comparison.txt       # Python dependencies
├── run_stock_comparison.bat         # Windows runner
├── run_stock_comparison.sh          # Linux/Mac runner
├── README_STOCK_TOOLS.md           # This file
├── STOCK_TOOLS_SUMMARY.md          # Quick reference (START HERE)
├── STOCK_COMPARISON_README.md      # Detailed documentation
├── STOCK_AUDIT_WORKFLOW.md         # Workflow guide
└── ARCHITECTURE_DIAGRAM.md         # System diagrams
```

## 🎓 Examples

### Example 1: Daily Health Check
```bash
python compare_stock.py --export daily_report.json
# Review report
# Fix if needed: python fix_stock_mismatches.py --from-report daily_report.json --live
```

### Example 2: After Bulk Import
```bash
python compare_stock.py --export post_import.json
python fix_stock_mismatches.py --fix-batches --live
python compare_stock.py --export verify.json
```

### Example 3: Single Product Investigation
```bash
python compare_stock.py --product-id "PROD-00001"
python fix_stock_mismatches.py --product-id "PROD-00001" --fix-all --live
```

## ✅ Success Indicators

You'll know it's working when:
- Comparison runs without errors
- Mismatches are identified and categorized
- Fixes resolve the issues
- Follow-up comparison shows improvements
- Customer frontend displays correct stock

## 🔧 Maintenance

### Daily
```bash
python compare_stock.py --export daily_$(date +%Y%m%d).json
```

### Weekly
Review patterns in mismatches to identify root causes

### After Updates
Run comparison after code deployments or bulk operations

## 📞 Support

Created: 2025-12-09  
Version: 1.0.0

For questions or issues:
1. Read the documentation files above
2. Check troubleshooting sections
3. Verify MongoDB and API connectivity
4. Review Python dependencies

---

**⭐ Pro Tip**: Always start with `STOCK_TOOLS_SUMMARY.md` for the quickest path to running your first comparison!

