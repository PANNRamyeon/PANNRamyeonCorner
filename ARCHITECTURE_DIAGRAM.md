# Stock System Architecture & Data Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PANNRamyeonCorner (Frontend)                      │
│                                                                       │
│  ┌───────────────┐    ┌──────────────┐    ┌──────────────┐        │
│  │  Menu.vue     │───▶│ useProducts  │───▶│ apiProducts  │        │
│  │  Cart.vue     │    │  composable  │    │   .js        │        │
│  │  Profile.vue  │    └──────────────┘    └──────────────┘        │
│  └───────────────┘                              │                   │
│                                                  │ HTTP GET          │
└──────────────────────────────────────────────────┼───────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PANN_POS Backend (Django)                         │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Customer API Endpoints (/api/customer/products/)            │   │
│  │  - CustomerProductListView                                   │   │
│  │  - CustomerProductDetailView                                 │   │
│  │  - CustomerProductSearchView                                 │   │
│  │  - CustomerProductByCategoryView                             │   │
│  │  - CustomerFeaturedProductsView                              │   │
│  └────────────────────────┬────────────────────────────────────┘   │
│                            │                                         │
│                            ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  CustomerProductService                                      │   │
│  │  - get_all_active_products()                                 │   │
│  │  - get_product_by_id()                                       │   │
│  │  - get_products_by_category()                                │   │
│  │  - search_products()                                         │   │
│  │  - get_featured_products()                                   │   │
│  │                                                               │   │
│  │  Filters:                                                     │   │
│  │  • status = 'active'                                         │   │
│  │  • isDeleted != True                                         │   │
│  │  • stock > 0                                                 │   │
│  └────────────────────────┬────────────────────────────────────┘   │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MongoDB Cloud Database                            │
│                                                                       │
│  ┌──────────────────────┐       ┌──────────────────────┐           │
│  │  products collection │       │  batches collection  │           │
│  ├──────────────────────┤       ├──────────────────────┤           │
│  │ _id                  │       │ _id                  │           │
│  │ product_name         │       │ product_id ───────┐  │           │
│  │ SKU                  │       │ quantity_remaining│  │           │
│  │ stock ◄──────────────┼───────┤ cost_price        │  │           │
│  │ total_stock          │       │ expiry_date       │  │           │
│  │ category_id          │       │ status            │  │           │
│  │ status               │       │ date_received     │  │           │
│  │ isDeleted            │       │ usage_history[]   │  │           │
│  │ cost_price           │       └───────────────────┘  │           │
│  │ selling_price        │                │             │           │
│  │ low_stock_threshold  │                └─────────────┘           │
│  │ created_at           │       FIFO Batch System                  │
│  │ updated_at           │       (calculates actual stock)          │
│  └──────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘
```

## Stock Data Flow

### 1. Product Creation
```
User Creates Product
        │
        ▼
┌───────────────────┐
│ ProductService    │
│ .create_product() │
└─────────┬─────────┘
          │
          ├──▶ Generate PROD-##### ID
          │
          ├──▶ Set stock = initial_stock
          │
          ├──▶ Set total_stock = initial_stock
          │
          ├──▶ Insert into products collection
          │
          └──▶ Create initial batch (if stock > 0)
                    │
                    ▼
              ┌─────────────────┐
              │ BatchService    │
              │ .create_batch() │
              └─────────────────┘
```

### 2. Stock Update
```
Stock Update Request
        │
        ▼
┌──────────────────────┐
│ ProductService       │
│ .update_stock()      │
└──────────┬───────────┘
           │
           ├──▶ Calculate new_stock
           │
           ├──▶ Update stock field
           │
           ├──▶ Update total_stock field
           │
           ├──▶ Add to stock_history[]
           │
           └──▶ Update sync_logs[]
```

### 3. Sale Transaction (FIFO)
```
Customer Places Order
        │
        ▼
┌─────────────────────────────┐
│ BatchService                │
│ .process_sale_fifo()        │
└────────────┬────────────────┘
             │
             ├──▶ Find oldest active batches
             │
             ├──▶ Deduct from batch.quantity_remaining
             │
             ├──▶ Update batch.usage_history[]
             │
             └──▶ Trigger ProductService.update_stock()
                         │
                         ▼
                 Update product.stock
                 Update product.total_stock
```

### 4. Customer Views Product (Frontend)
```
User Opens Menu
        │
        ▼
┌────────────────────┐
│ Menu.vue           │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ useProducts()      │
│ .getProducts()     │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ productsAPI        │
│ .getAll()          │
└────────┬───────────┘
         │
         ▼ HTTP GET /api/customer/products/
┌─────────────────────────────────┐
│ CustomerProductListView         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ CustomerProductService          │
│ .get_all_active_products()      │
└────────┬────────────────────────┘
         │
         ▼ Query: {status: 'active', isDeleted: false, stock: {$gt: 0}}
┌─────────────────────────────────┐
│ MongoDB products collection     │
└────────┬────────────────────────┘
         │
         ▼
     Return products to frontend
```

## Comparison Tool Flow

```
┌─────────────────────┐
│ compare_stock.py    │
└─────────┬───────────┘
          │
          ├──▶ 1. Connect to MongoDB
          │         │
          │         ▼
          │    Query products collection
          │    Get all products (cloud_products)
          │
          ├──▶ 2. Query Customer API
          │         │
          │         ▼
          │    GET /api/customer/products/
          │    Get all visible products (api_products)
          │
          ├──▶ 3. Calculate Batch Stock
          │         │
          │         ▼
          │    Query batches collection
          │    Filter active, non-expired batches
          │    Sum quantity_remaining (batch_stock)
          │
          ├──▶ 4. Compare Values
          │         │
          │         ├──▶ cloud_stock vs api_stock
          │         │
          │         ├──▶ cloud_stock vs batch_stock
          │         │
          │         └──▶ stock vs total_stock
          │
          └──▶ 5. Generate Report
                    │
                    ├──▶ Console output (table format)
                    │
                    └──▶ JSON export (detailed report)
```

## Fix Tool Flow

```
┌──────────────────────────┐
│ fix_stock_mismatches.py  │
└────────────┬─────────────┘
             │
             ├──▶ 1. Load Mismatches
             │         │
             │         ├──▶ From comparison report JSON
             │         │
             │         └──▶ Or run live comparison
             │
             ├──▶ 2. Categorize Issues
             │         │
             │         ├──▶ cloud_vs_batch → sync with batches
             │         │
             │         ├──▶ stock_vs_total_stock → sync fields
             │         │
             │         └──▶ missing_from_api → set status active
             │
             ├──▶ 3. Dry Run (default)
             │         │
             │         └──▶ Show what would change
             │
             └──▶ 4. Apply Fixes (--live)
                       │
                       ├──▶ Update products.stock
                       │
                       ├──▶ Update products.total_stock
                       │
                       ├──▶ Update products.status
                       │
                       └──▶ Log changes
```

## Mismatch Scenarios Illustrated

### Scenario A: cloud_vs_api mismatch
```
MongoDB                    Customer API
┌──────────────┐          ┌──────────────┐
│ Product A    │          │ Product A    │
│ stock: 100   │   ≠      │ stock: 95    │
└──────────────┘          └──────────────┘
     │                           │
     │ Source of Truth?          │ Cached/Stale?
     │                           │
     ▼                           ▼
┌──────────────┐          
│ Batches      │
│ total: 100   │ ◄─── Use this as truth
└──────────────┘

Fix: Clear API cache or verify recent sync
```

### Scenario B: cloud_vs_batch mismatch
```
MongoDB                    Batch System
┌──────────────┐          ┌──────────────┐
│ Product B    │          │ Batch 1: 30  │
│ stock: 50    │   ≠      │ Batch 2: 15  │
│              │          │ Total: 45    │
└──────────────┘          └──────────────┘
     │                           │
     │ Needs update              │ Source of Truth
     │                           │
     └───────────────────────────┘
                 │
                 ▼
Fix: Update stock & total_stock to 45
```

### Scenario C: stock_vs_total_stock mismatch
```
MongoDB products.PROD-00001
┌─────────────────────────┐
│ stock: 100              │ ◄─── Use as source of truth
│ total_stock: 95         │ ◄─── Sync with stock value
└─────────────────────────┘
         │
         ▼
Fix: Set total_stock = stock (100)
```

### Scenario D: Missing from API
```
MongoDB                    Customer API
┌──────────────┐          ┌──────────────┐
│ Product D    │          │              │
│ stock: 10    │    →     │  [MISSING]   │
│ status: inac │          │              │
└──────────────┘          └──────────────┘
     │                           ▲
     │                           │
     └───────────────────────────┘
                 │
                 ▼
Fix: Set status = 'active'
```

## Data Consistency Rules

### Golden Rules
1. **Batch system is source of truth for quantity**
   - Always trust calculated batch stock
   - product.stock should match sum(batch.quantity_remaining)

2. **stock and total_stock must always match**
   - Update both fields together
   - Both represent the same value

3. **Customer API filters products**
   - Only shows: active, not deleted, stock > 0
   - Missing products are filtered for good reason

4. **FIFO is strictly enforced**
   - Sales consume oldest batches first
   - Expired batches are excluded from calculations

### Update Sequence
```
1. Receive Inventory
        ↓
2. Create Batch
        ↓
3. Update product.stock
        ↓
4. Update product.total_stock
        ↓
5. Verify batch total matches product stock
```

## Tool Interaction Map

```
┌──────────────────┐
│ User             │
└────────┬─────────┘
         │
         ├─────▶ run_stock_comparison.bat/sh
         │              │
         │              ▼
         │      ┌──────────────────┐
         │      │ compare_stock.py │
         │      └────────┬─────────┘
         │               │
         │               ├─────▶ MongoDB (read)
         │               │
         │               ├─────▶ Customer API (read)
         │               │
         │               └─────▶ Generate report.json
         │
         ├─────▶ Review report.json
         │
         └─────▶ fix_stock_mismatches.py
                        │
                        ├─────▶ Load report.json
                        │
                        ├─────▶ Dry run (show changes)
                        │
                        └─────▶ --live flag
                                    │
                                    ▼
                                MongoDB (write)
                                    │
                                    ▼
                                Updates applied
                                    │
                                    ▼
                            Run comparison again
                                    │
                                    ▼
                            Verify fixes worked
```

## Security & Access Patterns

```
┌─────────────────┐
│ PANNRamyeonCorner│
│ (Customer)       │
└────────┬─────────┘
         │ READ ONLY
         │
         ▼
┌──────────────────────┐
│ Customer API         │
│ /api/customer/...    │
└────────┬─────────────┘
         │ Filtered
         │ Active only
         │ Stock > 0
         ▼
┌──────────────────────┐
│ MongoDB              │
│ (Cloud)              │
└────────┬─────────────┘
         │ FULL ACCESS
         │
         ▼
┌──────────────────────┐
│ PANN_POS Admin       │
│ Comparison Tools     │
│ Fix Tools            │
└──────────────────────┘
```

---

**Legend:**
- `───▶` : Data Flow
- `◄───` : Reference/Lookup
- `│` : Connection
- `┌─┐` : Component/System
- `≠` : Mismatch
- `=` : Match

