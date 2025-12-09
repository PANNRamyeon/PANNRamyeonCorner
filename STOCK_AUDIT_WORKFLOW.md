# Stock Audit & Fix Workflow

## Overview

This workflow helps you identify and fix stock mismatches between PANNRamyeonCorner frontend and the cloud database.

## Step-by-Step Workflow

### Step 1: Run Stock Comparison

First, identify any stock mismatches:

**Windows:**
```bash
run_stock_comparison.bat
```

**Manual:**
```bash
python compare_stock.py --export stock_report.json
```

This will:
- ✅ Compare all products across cloud DB, customer API, and batch system
- ✅ Generate a detailed report (`stock_report.json`)
- ✅ Display mismatches in the console

### Step 2: Review the Report

Look for these issues:

#### ❌ Stock Mismatches
```
Product: Shin Ramyun
  Cloud Stock: 100
  API Stock: 95
  Batch Stock: 100
  Type: cloud_vs_api
```

#### ⚠️ Missing from API
```
Product: Test Product
  Cloud Stock: 10
  Status: active
  Issue: Not visible in customer API
```

### Step 3: Dry Run Fixes

Test fixes without modifying the database:

**Fix batch mismatches (dry run):**
```bash
python fix_stock_mismatches.py --fix-batches
```

**Fix stock/total_stock field mismatches (dry run):**
```bash
python fix_stock_mismatches.py --fix-fields
```

**Fix products missing from API (dry run):**
```bash
python fix_stock_mismatches.py --fix-missing
```

**Fix all issues (dry run):**
```bash
python fix_stock_mismatches.py --fix-all
```

**Fix from comparison report (dry run):**
```bash
python fix_stock_mismatches.py --from-report stock_report.json
```

### Step 4: Apply Fixes (Live)

Once you're confident, apply the fixes:

⚠️ **IMPORTANT: Backup your database first!**

```bash
# Fix specific issue type
python fix_stock_mismatches.py --fix-batches --live

# Fix all issues
python fix_stock_mismatches.py --fix-all --live

# Fix from report
python fix_stock_mismatches.py --from-report stock_report.json --live
```

### Step 5: Verify Fixes

Run the comparison again to verify:

```bash
python compare_stock.py --export stock_report_after_fix.json
```

Compare the before and after reports to ensure mismatches are resolved.

## Common Scenarios

### Scenario 1: API Shows Less Stock Than Database

**Symptoms:**
- Cloud database shows 100 units
- Customer API shows 95 units
- Batch system shows 100 units

**Likely Cause:**
- API cache not updated
- Recent sales not reflected in API

**Fix:**
```bash
# Check specific product
python compare_stock.py --product-id "PROD-00001"

# If database is correct, clear API cache or restart API
# No database fix needed
```

### Scenario 2: Database Stock Doesn't Match Batches

**Symptoms:**
- Cloud database shows 50 units
- Batch calculation shows 45 units

**Likely Cause:**
- Product stock not updated when batch was consumed
- Batch FIFO not working correctly

**Fix:**
```bash
# Sync stock with batch system (dry run first)
python fix_stock_mismatches.py --fix-batches

# If looks good, apply live
python fix_stock_mismatches.py --fix-batches --live
```

### Scenario 3: Stock and Total_Stock Don't Match

**Symptoms:**
- `stock: 100`
- `total_stock: 95`

**Likely Cause:**
- One field updated without updating the other
- Sync issue during stock update

**Fix:**
```bash
# Sync the fields (dry run first)
python fix_stock_mismatches.py --fix-fields

# Apply live
python fix_stock_mismatches.py --fix-fields --live
```

### Scenario 4: Product Has Stock But Not Visible in API

**Symptoms:**
- Product has `stock: 10`
- Status is `inactive` or missing
- Not returned by customer API

**Likely Cause:**
- Product status not set to 'active'
- Product marked as deleted
- API filtering logic excluding it

**Fix:**
```bash
# Fix missing products (dry run first)
python fix_stock_mismatches.py --fix-missing

# Apply live
python fix_stock_mismatches.py --fix-missing --live
```

## Automated Monitoring

### Daily Audit (Recommended)

Set up a daily automated check:

**Windows Task Scheduler:**
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 2:00 AM
4. Action: Start a program
5. Program: `C:\Users\ngjam\Desktop\PANNRamyeonCorner\run_stock_comparison.bat`

**Linux/Mac Cron:**
```bash
# Add to crontab (run daily at 2 AM)
0 2 * * * cd /path/to/PANNRamyeonCorner && python compare_stock.py --export daily_report_$(date +\%Y\%m\%d).json
```

### Alert on Mismatches

Add email notification to the scripts:

```python
# Add to compare_stock.py
if results['mismatch_count'] > 0:
    send_email_alert(
        subject=f"Stock Mismatches Found: {results['mismatch_count']} products",
        body=f"Report: {export_file}"
    )
```

## Prevention Best Practices

### 1. Always Update Both Fields
When updating stock, update both `stock` and `total_stock`:

```python
product_collection.update_one(
    {'_id': product_id},
    {'$set': {
        'stock': new_stock,
        'total_stock': new_stock,
        'updated_at': datetime.utcnow()
    }}
)
```

### 2. Use Batch System Consistently
Always create batches when receiving inventory:

```python
# Create batch first
batch = batch_service.create_batch({
    'product_id': product_id,
    'quantity_received': quantity,
    'cost_price': cost_price,
    'expiry_date': expiry_date
})

# Then update product stock
product_service.update_stock(product_id, {
    'operation_type': 'add',
    'quantity': quantity,
    'reason': 'Restock'
})
```

### 3. Validate Before Sale
Check stock before processing sale:

```python
# Validate stock first
batch_stock = calculate_batch_stock(product_id)
if batch_stock < quantity_to_sell:
    raise ValueError("Insufficient stock")

# Process sale using FIFO
batches_used = batch_service.process_sale_fifo(product_id, quantity_to_sell)
```

### 4. Regular Audits
Run comparison weekly or after bulk operations:

```bash
# After bulk import
python compare_stock.py --export post_import_audit.json

# After major sales
python compare_stock.py --export post_sale_audit.json
```

## Backup Before Fixes

Always backup before running live fixes:

**MongoDB Backup:**
```bash
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/pos_system" --out=backup_$(date +%Y%m%d)
```

**Restore if needed:**
```bash
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/pos_system" backup_20251209/pos_system
```

## Advanced: Custom Fixes

For complex mismatches, create custom fix logic:

```python
from fix_stock_mismatches import StockFixer

fixer = StockFixer(dry_run=True)

# Get product
product = fixer.products_collection.find_one({'_id': 'PROD-00001'})

# Calculate correct stock
batch_stock = fixer.calculate_batch_stock('PROD-00001')

# Apply custom logic
if batch_stock > 0:
    fixer.products_collection.update_one(
        {'_id': 'PROD-00001'},
        {'$set': {
            'stock': batch_stock,
            'total_stock': batch_stock,
            'status': 'active',
            'updated_at': datetime.utcnow()
        }}
    )

fixer.close()
```

## Troubleshooting

### Issue: Fixes Don't Take Effect

**Check:**
1. API cache - may need manual clear
2. Frontend cache - clear browser cache
3. Verify fixes were applied: `python compare_stock.py --product-id "PROD-00001"`

### Issue: Batch Stock Always Wrong

**Check:**
1. Expired batches being included
2. Batch `quantity_remaining` not updated after sales
3. FIFO process working correctly

### Issue: Products Keep Disappearing from API

**Check:**
1. Customer API filter logic in `customer_product_views.py`
2. Product `status` field
3. `isDeleted` flag
4. Stock value (must be > 0 for customer API)

## Support Files

- `compare_stock.py` - Main comparison tool
- `fix_stock_mismatches.py` - Auto-fix tool
- `run_stock_comparison.bat` - Windows runner
- `run_stock_comparison.sh` - Linux/Mac runner
- `requirements_comparison.txt` - Python dependencies
- `STOCK_COMPARISON_README.md` - Detailed tool documentation

## Summary Checklist

Before going live with fixes:

- [ ] Backup database
- [ ] Run comparison and generate report
- [ ] Review all mismatches
- [ ] Test fixes in dry-run mode
- [ ] Verify fix logic is correct
- [ ] Apply fixes with --live flag
- [ ] Run comparison again to verify
- [ ] Check customer frontend
- [ ] Document any custom fixes applied
- [ ] Set up automated monitoring

## Questions?

If you encounter issues:
1. Check the `STOCK_COMPARISON_README.md` for detailed documentation
2. Review the comparison report JSON for details
3. Test with a single product first using `--product-id`
4. Always dry-run before applying fixes

