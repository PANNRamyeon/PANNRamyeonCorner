"""
Stock Mismatch Auto-Fix Tool
=============================
Automatically fixes common stock mismatches identified by the comparison tool.

CAUTION: This tool modifies database records. Always backup before running!
"""

import sys
import os
from pymongo import MongoClient
from datetime import datetime
import json

# Configuration
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'pos_system')

class StockFixer:
    def __init__(self, mongodb_uri=MONGODB_URI, db_name=DATABASE_NAME, dry_run=True):
        """Initialize connection to MongoDB"""
        try:
            self.client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client[db_name]
            self.products_collection = self.db.products
            self.batches_collection = self.db.batches
            self.dry_run = dry_run
            
            # Test connection
            self.client.server_info()
            
            mode = "DRY RUN MODE" if dry_run else "LIVE MODE - WILL MODIFY DATABASE"
            print(f"✅ Connected to MongoDB: {db_name}")
            print(f"⚠️  Running in: {mode}")
            print("=" * 80)
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            sys.exit(1)
    
    def calculate_batch_stock(self, product_id):
        """Calculate actual stock from active batches"""
        try:
            now = datetime.utcnow()
            
            batches = list(self.batches_collection.find({
                'product_id': product_id,
                'status': 'active',
                'quantity_remaining': {'$gt': 0}
            }))
            
            # Filter out expired batches
            non_expired_batches = []
            for batch in batches:
                expiry_date = batch.get('expiry_date')
                if not expiry_date:
                    non_expired_batches.append(batch)
                else:
                    if isinstance(expiry_date, str):
                        try:
                            from dateutil import parser
                            expiry_date = parser.parse(expiry_date)
                        except Exception:
                            non_expired_batches.append(batch)
                            continue
                    
                    if isinstance(expiry_date, datetime) and expiry_date >= now:
                        non_expired_batches.append(batch)
            
            total_stock = sum(batch['quantity_remaining'] for batch in non_expired_batches)
            return total_stock
        except Exception as e:
            print(f"❌ Error calculating batch stock for {product_id}: {e}")
            return 0
    
    def sync_stock_with_batches(self, product_id=None):
        """Fix products where stock doesn't match batch calculation"""
        print("\n🔧 Syncing product stock with batch system...\n")
        
        query = {'isDeleted': {'$ne': True}}
        if product_id:
            query['_id'] = product_id
        
        products = list(self.products_collection.find(query))
        
        fixed_count = 0
        errors = []
        
        for product in products:
            try:
                product_id = product['_id']
                current_stock = int(product.get('stock', 0))
                batch_stock = self.calculate_batch_stock(product_id)
                
                if current_stock != batch_stock:
                    print(f"📦 {product.get('product_name', 'Unknown')} ({product.get('SKU', 'N/A')})")
                    print(f"   Current: {current_stock} | Batch Calculated: {batch_stock}")
                    
                    if self.dry_run:
                        print(f"   [DRY RUN] Would update to: {batch_stock}")
                    else:
                        # Update both stock and total_stock
                        result = self.products_collection.update_one(
                            {'_id': product_id},
                            {
                                '$set': {
                                    'stock': batch_stock,
                                    'total_stock': batch_stock,
                                    'updated_at': datetime.utcnow()
                                }
                            }
                        )
                        
                        if result.modified_count > 0:
                            print(f"   ✅ Updated to: {batch_stock}")
                            fixed_count += 1
                        else:
                            print(f"   ⚠️  Update failed")
                    
                    print()
            except Exception as e:
                errors.append({'product_id': product_id, 'error': str(e)})
                print(f"   ❌ Error: {e}\n")
        
        print("=" * 80)
        if self.dry_run:
            print(f"[DRY RUN] Would fix {fixed_count} products")
        else:
            print(f"✅ Fixed {fixed_count} products")
        
        if errors:
            print(f"❌ Errors: {len(errors)}")
            for error in errors[:5]:
                print(f"   - {error['product_id']}: {error['error']}")
        
        return fixed_count
    
    def sync_stock_and_total_stock(self, product_id=None):
        """Fix products where stock and total_stock don't match"""
        print("\n🔧 Syncing stock and total_stock fields...\n")
        
        query = {'isDeleted': {'$ne': True}}
        if product_id:
            query['_id'] = product_id
        
        products = list(self.products_collection.find(query))
        
        fixed_count = 0
        errors = []
        
        for product in products:
            try:
                product_id = product['_id']
                stock = int(product.get('stock', 0))
                total_stock = int(product.get('total_stock', stock))
                
                if stock != total_stock:
                    print(f"📦 {product.get('product_name', 'Unknown')} ({product.get('SKU', 'N/A')})")
                    print(f"   stock: {stock} | total_stock: {total_stock}")
                    
                    # Use stock as the source of truth
                    if self.dry_run:
                        print(f"   [DRY RUN] Would set both to: {stock}")
                    else:
                        result = self.products_collection.update_one(
                            {'_id': product_id},
                            {
                                '$set': {
                                    'total_stock': stock,
                                    'updated_at': datetime.utcnow()
                                }
                            }
                        )
                        
                        if result.modified_count > 0:
                            print(f"   ✅ Set both to: {stock}")
                            fixed_count += 1
                        else:
                            print(f"   ⚠️  Update failed")
                    
                    print()
            except Exception as e:
                errors.append({'product_id': product_id, 'error': str(e)})
                print(f"   ❌ Error: {e}\n")
        
        print("=" * 80)
        if self.dry_run:
            print(f"[DRY RUN] Would fix {fixed_count} products")
        else:
            print(f"✅ Fixed {fixed_count} products")
        
        if errors:
            print(f"❌ Errors: {len(errors)}")
        
        return fixed_count
    
    def fix_missing_from_api(self, product_id=None):
        """Fix products that should appear in API but don't"""
        print("\n🔧 Fixing products missing from customer API...\n")
        
        query = {
            'isDeleted': {'$ne': True},
            'stock': {'$gt': 0}
        }
        
        if product_id:
            query['_id'] = product_id
        
        products = list(self.products_collection.find(query))
        
        fixed_count = 0
        
        for product in products:
            try:
                product_id = product['_id']
                status = product.get('status', 'unknown')
                
                # Check if status is not 'active' but has stock
                if status != 'active':
                    print(f"📦 {product.get('product_name', 'Unknown')} ({product.get('SKU', 'N/A')})")
                    print(f"   Status: {status} | Stock: {product.get('stock', 0)}")
                    
                    if self.dry_run:
                        print(f"   [DRY RUN] Would set status to: active")
                    else:
                        result = self.products_collection.update_one(
                            {'_id': product_id},
                            {
                                '$set': {
                                    'status': 'active',
                                    'updated_at': datetime.utcnow()
                                }
                            }
                        )
                        
                        if result.modified_count > 0:
                            print(f"   ✅ Set status to: active")
                            fixed_count += 1
                        else:
                            print(f"   ⚠️  Update failed")
                    
                    print()
            except Exception as e:
                print(f"   ❌ Error: {e}\n")
        
        print("=" * 80)
        if self.dry_run:
            print(f"[DRY RUN] Would fix {fixed_count} products")
        else:
            print(f"✅ Fixed {fixed_count} products")
        
        return fixed_count
    
    def load_comparison_report(self, report_file):
        """Load mismatches from comparison report and fix them"""
        print(f"\n📂 Loading comparison report: {report_file}\n")
        
        try:
            with open(report_file, 'r') as f:
                data = json.load(f)
            
            mismatches = data.get('mismatches', [])
            missing_from_api = data.get('missing_from_api', [])
            
            print(f"Found {len(mismatches)} mismatches and {len(missing_from_api)} missing products\n")
            
            # Fix each mismatch based on type
            for mismatch in mismatches:
                product_id = mismatch['product_id']
                mismatch_type = mismatch['mismatch_type']
                
                if 'cloud_vs_batch' in mismatch_type:
                    print(f"Fixing batch mismatch for {product_id}...")
                    self.sync_stock_with_batches(product_id)
                
                if 'stock_vs_total_stock' in mismatch_type:
                    print(f"Fixing stock/total_stock mismatch for {product_id}...")
                    self.sync_stock_and_total_stock(product_id)
            
            # Fix missing products
            for missing in missing_from_api:
                product_id = missing['product_id']
                print(f"Fixing missing product {product_id}...")
                self.fix_missing_from_api(product_id)
            
        except FileNotFoundError:
            print(f"❌ Report file not found: {report_file}")
        except json.JSONDecodeError:
            print(f"❌ Invalid JSON in report file")
        except Exception as e:
            print(f"❌ Error loading report: {e}")
    
    def close(self):
        """Close MongoDB connection"""
        self.client.close()
        print("\n✅ Connection closed")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fix stock mismatches in database')
    parser.add_argument('--mongodb-uri', default=MONGODB_URI, help='MongoDB connection URI')
    parser.add_argument('--db-name', default=DATABASE_NAME, help='Database name')
    parser.add_argument('--live', action='store_true', help='Execute fixes (default is dry-run)')
    parser.add_argument('--product-id', type=str, help='Fix specific product ID only')
    parser.add_argument('--from-report', type=str, help='Load and fix from comparison report JSON file')
    parser.add_argument('--fix-batches', action='store_true', help='Sync stock with batch calculations')
    parser.add_argument('--fix-fields', action='store_true', help='Sync stock and total_stock fields')
    parser.add_argument('--fix-missing', action='store_true', help='Fix products missing from API')
    parser.add_argument('--fix-all', action='store_true', help='Run all fixes')
    
    args = parser.parse_args()
    
    # Determine dry-run mode
    dry_run = not args.live
    
    if dry_run:
        print("\n" + "=" * 80)
        print("⚠️  DRY RUN MODE - No changes will be made to the database")
        print("   Use --live flag to execute actual fixes")
        print("=" * 80 + "\n")
    else:
        print("\n" + "=" * 80)
        print("🚨 LIVE MODE - This will modify the database!")
        print("=" * 80)
        response = input("\nAre you sure you want to continue? (yes/no): ")
        if response.lower() != 'yes':
            print("Aborted.")
            sys.exit(0)
        print()
    
    # Initialize fixer
    fixer = StockFixer(
        mongodb_uri=args.mongodb_uri,
        db_name=args.db_name,
        dry_run=dry_run
    )
    
    try:
        if args.from_report:
            # Fix from report file
            fixer.load_comparison_report(args.from_report)
        elif args.fix_all:
            # Run all fixes
            fixer.sync_stock_with_batches(args.product_id)
            fixer.sync_stock_and_total_stock(args.product_id)
            fixer.fix_missing_from_api(args.product_id)
        else:
            # Run specific fixes
            if args.fix_batches:
                fixer.sync_stock_with_batches(args.product_id)
            
            if args.fix_fields:
                fixer.sync_stock_and_total_stock(args.product_id)
            
            if args.fix_missing:
                fixer.fix_missing_from_api(args.product_id)
            
            if not (args.fix_batches or args.fix_fields or args.fix_missing):
                print("No fix option specified. Use --help to see available options.")
                print("\nQuick examples:")
                print("  Dry run batch fix:     python fix_stock_mismatches.py --fix-batches")
                print("  Live batch fix:        python fix_stock_mismatches.py --fix-batches --live")
                print("  Fix all:               python fix_stock_mismatches.py --fix-all --live")
                print("  Fix from report:       python fix_stock_mismatches.py --from-report report.json --live")
    
    finally:
        fixer.close()


if __name__ == '__main__':
    main()

