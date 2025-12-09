# Product Stock Comparison Tool

## Overview

This tool compares product stock data across three sources to identify mismatches:

1. **Cloud Database (MongoDB)** - The actual product data stored in `products` collection
2. **Customer API** - What PANNRamyeonCorner frontend sees via `/api/customer/products/`
3. **Batch System** - Calculated stock from the FIFO batch inventory system

## Why This Tool?

Stock mismatches can occur due to:
- Sync issues between `stock` and `total_stock` fields
- Batch inventory calculations not matching product stock
- Products not appearing in customer API despite having stock > 0
- Expired batches not being filtered correctly
- Cache inconsistencies

## Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements_comparison.txt
```

Or install manually:
```bash
pip install pymongo requests tabulate python-dateutil
```

### 2. Configure Environment Variables

Edit the batch/shell script or set environment variables:

**Windows (PowerShell):**
```powershell
$env:MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/"
$env:DATABASE_NAME="pos_system"
$env:API_BASE_URL="https://pann-pos.netlify.app/api"
```

**Linux/Mac (Bash):**
```bash
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/"
export DATABASE_NAME="pos_system"
export API_BASE_URL="https://pann-pos.netlify.app/api"
```

## Usage

### Quick Start (Recommended)

**Windows:**
```bash
run_stock_comparison.bat
```

**Linux/Mac:**
```bash
chmod +x run_stock_comparison.sh
./run_stock_comparison.sh
```

### Command Line Options

#### Full Comparison (All Products)
```bash
python compare_stock.py
```

#### Show Matching Products Too
```bash
python compare_stock.py --show-matches
```

#### Export Results to JSON
```bash
python compare_stock.py --export stock_report.json
```

#### Custom MongoDB Connection
```bash
python compare_stock.py --mongodb-uri "mongodb://localhost:27017/" --db-name "pos_system"
```

#### Custom API URL
```bash
python compare_stock.py --api-url "https://your-api.com/api"
```

#### Check Specific Product
```bash
python compare_stock.py --product-id "PROD-00001"
```

### Complete Command with All Options
```bash
python compare_stock.py \
    --mongodb-uri "mongodb+srv://user:pass@cluster.mongodb.net/" \
    --db-name "pos_system" \
    --api-url "https://pann-pos.netlify.app/api" \
    --show-matches \
    --export report.json
```

## Output Examples

### Summary Report
```
================================================================================
📊 STOCK COMPARISON SUMMARY
================================================================================

✅ Matching Products: 45
❌ Mismatched Products: 3
⚠️  Missing from API: 2
```

### Mismatch Details
```
================================================================================
❌ STOCK MISMATCHES FOUND
================================================================================
+----------------------+---------------+-------------+--------------+-----------+-------------+----------+--------------------+
| Product Name         | SKU           | Cloud Stock | Total Stock  | API Stock | Batch Stock | Batches  | Mismatch Type      |
+----------------------+---------------+-------------+--------------+-----------+-------------+----------+--------------------+
| Shin Ramyun          | NOOD-SHIN-001 | 100         | 100          | 95        | 100         | 2        | cloud_vs_api       |
| Kimchi               | SIDE-KIMC-002 | 50          | 45           | 50        | 45          | 1        | cloud_vs_batch     |
| Korean BBQ Sauce     | SAUC-KORE-003 | 30          | 30           | 30        | 25          | 1        | cloud_vs_batch     |
+----------------------+---------------+-------------+--------------+-----------+-------------+----------+--------------------+
```

### Missing from API
```
================================================================================
⚠️  PRODUCTS MISSING FROM CUSTOMER API (but have stock > 0)
================================================================================
+----------------------+---------------+-------------+-------------+--------+------------------------------------------+
| Product Name         | SKU           | Cloud Stock | Batch Stock | Status | Reason                                   |
+----------------------+---------------+-------------+-------------+--------+------------------------------------------+
| Test Product         | TEST-PROD-001 | 10          | 10          | active | Missing from customer API despite stock  |
+----------------------+---------------+-------------+-------------+--------+------------------------------------------+
```

## Understanding Mismatch Types

### `cloud_vs_api`
- **Meaning**: Stock in cloud database doesn't match what customer API returns
- **Common Causes**: 
  - API filtering logic issue
  - Cache not updated
  - Sync delay between database and API

### `cloud_vs_batch`
- **Meaning**: Product's `stock` field doesn't match calculated batch inventory
- **Common Causes**:
  - Batch not created when product was stocked
  - Batch quantity_remaining not updated after sale
  - Expired batches not filtered correctly

### `stock_vs_total_stock`
- **Meaning**: Product's `stock` and `total_stock` fields don't match
- **Common Causes**:
  - Fields not synced during stock update
  - One field updated without updating the other

## Specific Product Check

To investigate a single product in detail:

```bash
python compare_stock.py --product-id "PROD-00001"
```

Output:
```
================================================================================
Product: Shin Ramyun Black
SKU: NOOD-SHIN-001
Status: active
================================================================================

📦 Cloud Database:
   Stock: 100
   Total Stock: 100
   Low Stock Threshold: 10

🌐 Customer API:
   Stock: 95
   Status: Visible in API

📊 Batch System:
   Calculated Stock: 100
   Active Batches: 2
   Expired Batches: 0

🔍 Analysis:
   ⚠️  MISMATCH: Cloud stock (100) != API stock (95)
================================================================================
```

## JSON Export Format

When using `--export`, the tool generates a JSON file with this structure:

```json
{
  "generated_at": "2025-12-09T10:30:00",
  "summary": {
    "total_mismatches": 3,
    "total_matches": 45,
    "total_missing_from_api": 2
  },
  "mismatches": [
    {
      "product_id": "PROD-00001",
      "product_name": "Shin Ramyun",
      "sku": "NOOD-SHIN-001",
      "cloud_stock": 100,
      "cloud_total_stock": 100,
      "api_stock": 95,
      "batch_stock": 100,
      "active_batches": 2,
      "expired_batches": 0,
      "status": "active",
      "has_mismatch": true,
      "mismatch_type": "cloud_vs_api"
    }
  ],
  "matches": [...],
  "missing_from_api": [...]
}
```

## Fixing Mismatches

### Fix Cloud vs API Mismatch
1. Check if product status is 'active'
2. Verify product is not marked as deleted (`isDeleted: false`)
3. Clear API cache if using caching
4. Re-fetch products from customer API

### Fix Cloud vs Batch Mismatch
1. Run batch recalculation:
   ```python
   from app.services.product_service import ProductService
   service = ProductService()
   products = service.get_all_products()
   # Stock will be recalculated from batches
   ```
2. Check if batches were created during product creation
3. Verify FIFO batch system is working correctly

### Fix Stock vs Total Stock Mismatch
1. Update both fields together:
   ```python
   product_collection.update_one(
       {'_id': product_id},
       {'$set': {'stock': new_stock, 'total_stock': new_stock}}
   )
   ```

## Automation

### Scheduled Check (Cron Job)

Add to crontab for daily checks at 2 AM:
```bash
0 2 * * * cd /path/to/PANNRamyeonCorner && python compare_stock.py --export daily_report.json
```

### Windows Task Scheduler

Create a scheduled task to run `run_stock_comparison.bat` daily.

## Troubleshooting

### Connection Errors
```
❌ Failed to connect to MongoDB: ServerSelectionTimeoutError
```
**Solution**: Check MongoDB URI, ensure IP is whitelisted, verify credentials

### API Timeout
```
❌ Error fetching API products: Connection timeout
```
**Solution**: Check API_BASE_URL, verify API is running, increase timeout value

### Missing Dependencies
```
ModuleNotFoundError: No module named 'pymongo'
```
**Solution**: Run `pip install -r requirements_comparison.txt`

## Technical Details

### Data Sources

**1. Cloud Database Query:**
```python
products = db.products.find({'isDeleted': {'$ne': True}})
```

**2. Customer API Query:**
```python
GET /api/customer/products/?page=1&limit=100
```
Returns only products with:
- `status: 'active'`
- `isDeleted: false`
- `stock > 0`

**3. Batch Calculation:**
```python
batches = db.batches.find({
    'product_id': product_id,
    'status': 'active',
    'quantity_remaining': {'$gt': 0}
})
# Filter out expired batches
# Sum quantity_remaining
```

### Performance

- **Full Comparison**: ~5-10 seconds for 1000 products
- **Single Product**: <1 second
- **Memory Usage**: ~50MB for 1000 products

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review PANN_POS backend logs
3. Verify MongoDB connection and API availability
4. Check product data structure in database

## Version History

- **v1.0.0** (2025-12-09): Initial release
  - Full stock comparison
  - Specific product check
  - JSON export
  - Batch system integration

