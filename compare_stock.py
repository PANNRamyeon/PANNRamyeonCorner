"""
Product Stock Comparison Tool
==============================
Compares product stock between:
1. What PANNRamyeonCorner customer API returns (customer_product_views.py)
2. What's actually stored in the cloud MongoDB database (products collection)
3. Calculated stock from batch system (batches collection)

This helps identify stock mismatches and data inconsistencies.
"""

import sys
import os
from pymongo import MongoClient
import requests
from datetime import datetime
from tabulate import tabulate
import json

# Configuration
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'pos_system')
API_BASE_URL = os.getenv('API_BASE_URL', 'https://pann-pos.netlify.app/api')

class StockComparison:
    def __init__(self, mongodb_uri=MONGODB_URI, db_name=DATABASE_NAME, api_url=API_BASE_URL):
        """Initialize connection to MongoDB and API"""
        try:
            self.client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client[db_name]
            self.products_collection = self.db.products
            self.batches_collection = self.db.batches
            self.categories_collection = self.db.category
            self.api_url = api_url
            
            # Test connection
            self.client.server_info()
            print(f"✅ Connected to MongoDB: {db_name}")
            print(f"✅ API URL: {api_url}")
            print("=" * 80)
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            sys.exit(1)
    
    def get_cloud_products(self, include_deleted=False):
        """Get all products directly from MongoDB (cloud database)"""
        try:
            query = {'isDeleted': {'$ne': True}} if not include_deleted else {}
            products = list(self.products_collection.find(query))
            
            print(f"📦 Found {len(products)} products in cloud database")
            return products
        except Exception as e:
            print(f"❌ Error fetching cloud products: {e}")
            return []
    
    def get_api_products(self):
        """Get products from customer-facing API (what PANNRamyeonCorner sees)"""
        try:
            all_products = []
            page = 1
            limit = 100
            
            while True:
                url = f"{self.api_url}/customer/products/"
                params = {'page': page, 'limit': limit}
                
                response = requests.get(url, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and data.get('data'):
                        products = data['data'].get('products', [])
                        all_products.extend(products)
                        
                        pagination = data['data'].get('pagination', {})
                        if not pagination.get('has_next', False):
                            break
                        page += 1
                    else:
                        break
                else:
                    print(f"⚠️  API returned status {response.status_code}")
                    break
            
            print(f"🌐 Found {len(all_products)} products from customer API")
            return all_products
        except Exception as e:
            print(f"❌ Error fetching API products: {e}")
            return []
    
    def calculate_batch_stock(self, product_id):
        """Calculate actual stock from active batches (FIFO system)"""
        try:
            now = datetime.utcnow()
            
            # Get all active batches for this product
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
                    # Handle both datetime and string dates
                    if isinstance(expiry_date, str):
                        try:
                            from dateutil import parser
                            expiry_date = parser.parse(expiry_date)
                        except Exception:
                            non_expired_batches.append(batch)
                            continue
                    
                    if isinstance(expiry_date, datetime) and expiry_date >= now:
                        non_expired_batches.append(batch)
            
            # Calculate total stock from non-expired batches
            total_stock = sum(batch['quantity_remaining'] for batch in non_expired_batches)
            
            return {
                'total_stock': total_stock,
                'active_batches': len(non_expired_batches),
                'expired_batches': len(batches) - len(non_expired_batches)
            }
        except Exception as e:
            print(f"❌ Error calculating batch stock for {product_id}: {e}")
            return {'total_stock': 0, 'active_batches': 0, 'expired_batches': 0}
    
    def compare_stocks(self, show_matches=False, export_file=None):
        """Compare stock across all three sources"""
        print("\n🔍 Starting Stock Comparison...\n")
        
        # Fetch data from all sources
        cloud_products = self.get_cloud_products()
        api_products = self.get_api_products()
        
        # Create lookup dictionaries
        cloud_dict = {str(p['_id']): p for p in cloud_products}
        api_dict = {str(p['_id']): p for p in api_products}
        
        # Comparison results
        mismatches = []
        matches = []
        missing_from_api = []
        
        print(f"\n📊 Analyzing {len(cloud_dict)} products...\n")
        
        for product_id, cloud_product in cloud_dict.items():
            api_product = api_dict.get(product_id)
            
            # Get stock values
            cloud_stock = int(cloud_product.get('stock', 0))
            cloud_total_stock = int(cloud_product.get('total_stock', cloud_stock))
            
            # Calculate batch stock
            batch_info = self.calculate_batch_stock(product_id)
            batch_stock = batch_info['total_stock']
            
            product_name = cloud_product.get('product_name', 'Unknown')
            sku = cloud_product.get('SKU', 'N/A')
            
            # Check if product appears in customer API
            if api_product:
                api_stock = int(api_product.get('stock', 0))
                
                # Check for mismatches
                has_mismatch = False
                mismatch_type = []
                
                if cloud_stock != api_stock:
                    has_mismatch = True
                    mismatch_type.append('cloud_vs_api')
                
                if cloud_stock != batch_stock:
                    has_mismatch = True
                    mismatch_type.append('cloud_vs_batch')
                
                if cloud_stock != cloud_total_stock:
                    has_mismatch = True
                    mismatch_type.append('stock_vs_total_stock')
                
                comparison = {
                    'product_id': product_id,
                    'product_name': product_name,
                    'sku': sku,
                    'cloud_stock': cloud_stock,
                    'cloud_total_stock': cloud_total_stock,
                    'api_stock': api_stock,
                    'batch_stock': batch_stock,
                    'active_batches': batch_info['active_batches'],
                    'expired_batches': batch_info['expired_batches'],
                    'status': cloud_product.get('status', 'N/A'),
                    'has_mismatch': has_mismatch,
                    'mismatch_type': ', '.join(mismatch_type) if mismatch_type else 'none'
                }
                
                if has_mismatch:
                    mismatches.append(comparison)
                else:
                    matches.append(comparison)
            else:
                # Product exists in cloud but not in API
                # This could be normal if stock is 0 or status is not active
                if cloud_stock > 0 and cloud_product.get('status') == 'active':
                    missing_from_api.append({
                        'product_id': product_id,
                        'product_name': product_name,
                        'sku': sku,
                        'cloud_stock': cloud_stock,
                        'cloud_total_stock': cloud_total_stock,
                        'batch_stock': batch_stock,
                        'status': cloud_product.get('status', 'N/A'),
                        'reason': 'Missing from customer API despite having stock > 0'
                    })
        
        # Display results
        self._display_results(mismatches, matches, missing_from_api, show_matches)
        
        # Export if requested
        if export_file:
            self._export_results(mismatches, matches, missing_from_api, export_file)
        
        return {
            'mismatches': mismatches,
            'matches': matches,
            'missing_from_api': missing_from_api,
            'total_checked': len(cloud_dict),
            'mismatch_count': len(mismatches),
            'match_count': len(matches),
            'missing_count': len(missing_from_api)
        }
    
    def _display_results(self, mismatches, matches, missing_from_api, show_matches):
        """Display comparison results in a formatted table"""
        
        print("\n" + "=" * 80)
        print("📊 STOCK COMPARISON SUMMARY")
        print("=" * 80)
        
        print(f"\n✅ Matching Products: {len(matches)}")
        print(f"❌ Mismatched Products: {len(mismatches)}")
        print(f"⚠️  Missing from API: {len(missing_from_api)}")
        
        if mismatches:
            print("\n" + "=" * 80)
            print("❌ STOCK MISMATCHES FOUND")
            print("=" * 80)
            
            table_data = []
            for item in mismatches:
                table_data.append([
                    item['product_name'][:30],
                    item['sku'],
                    item['cloud_stock'],
                    item['cloud_total_stock'],
                    item['api_stock'],
                    item['batch_stock'],
                    item['active_batches'],
                    item['mismatch_type']
                ])
            
            headers = ['Product Name', 'SKU', 'Cloud Stock', 'Total Stock', 'API Stock', 'Batch Stock', 'Batches', 'Mismatch Type']
            print(tabulate(table_data, headers=headers, tablefmt='grid'))
        
        if missing_from_api:
            print("\n" + "=" * 80)
            print("⚠️  PRODUCTS MISSING FROM CUSTOMER API (but have stock > 0)")
            print("=" * 80)
            
            table_data = []
            for item in missing_from_api:
                table_data.append([
                    item['product_name'][:30],
                    item['sku'],
                    item['cloud_stock'],
                    item['batch_stock'],
                    item['status'],
                    item['reason']
                ])
            
            headers = ['Product Name', 'SKU', 'Cloud Stock', 'Batch Stock', 'Status', 'Reason']
            print(tabulate(table_data, headers=headers, tablefmt='grid'))
        
        if show_matches and matches:
            print("\n" + "=" * 80)
            print("✅ MATCHING PRODUCTS")
            print("=" * 80)
            
            table_data = []
            for item in matches[:20]:  # Show first 20 matches
                table_data.append([
                    item['product_name'][:30],
                    item['sku'],
                    item['cloud_stock'],
                    item['api_stock'],
                    item['batch_stock']
                ])
            
            headers = ['Product Name', 'SKU', 'Cloud Stock', 'API Stock', 'Batch Stock']
            print(tabulate(table_data, headers=headers, tablefmt='grid'))
            
            if len(matches) > 20:
                print(f"\n... and {len(matches) - 20} more matching products")
    
    def _export_results(self, mismatches, matches, missing_from_api, filename):
        """Export comparison results to a JSON file"""
        try:
            results = {
                'generated_at': datetime.utcnow().isoformat(),
                'summary': {
                    'total_mismatches': len(mismatches),
                    'total_matches': len(matches),
                    'total_missing_from_api': len(missing_from_api)
                },
                'mismatches': mismatches,
                'matches': matches,
                'missing_from_api': missing_from_api
            }
            
            with open(filename, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            
            print(f"\n💾 Results exported to: {filename}")
        except Exception as e:
            print(f"❌ Error exporting results: {e}")
    
    def check_specific_product(self, product_id):
        """Check stock for a specific product ID"""
        print(f"\n🔍 Checking product: {product_id}\n")
        
        # Get from cloud
        cloud_product = self.products_collection.find_one({'_id': product_id})
        if not cloud_product:
            print(f"❌ Product {product_id} not found in cloud database")
            return
        
        # Get from API
        try:
            url = f"{self.api_url}/customer/products/{product_id}/"
            response = requests.get(url, timeout=10)
            api_product = response.json().get('data', {}).get('product') if response.status_code == 200 else None
        except Exception as e:
            print(f"❌ Error fetching from API: {e}")
            api_product = None
        
        # Calculate batch stock
        batch_info = self.calculate_batch_stock(product_id)
        
        # Display details
        print("=" * 80)
        print(f"Product: {cloud_product.get('product_name')}")
        print(f"SKU: {cloud_product.get('SKU')}")
        print(f"Status: {cloud_product.get('status')}")
        print("=" * 80)
        print(f"\n📦 Cloud Database:")
        print(f"   Stock: {cloud_product.get('stock', 0)}")
        print(f"   Total Stock: {cloud_product.get('total_stock', 0)}")
        print(f"   Low Stock Threshold: {cloud_product.get('low_stock_threshold', 0)}")
        
        print(f"\n🌐 Customer API:")
        if api_product:
            print(f"   Stock: {api_product.get('stock', 0)}")
            print(f"   Status: Visible in API")
        else:
            print(f"   Status: NOT visible in API")
        
        print(f"\n📊 Batch System:")
        print(f"   Calculated Stock: {batch_info['total_stock']}")
        print(f"   Active Batches: {batch_info['active_batches']}")
        print(f"   Expired Batches: {batch_info['expired_batches']}")
        
        # Check for mismatches
        print(f"\n🔍 Analysis:")
        if cloud_product.get('stock', 0) != batch_info['total_stock']:
            print(f"   ⚠️  MISMATCH: Cloud stock ({cloud_product.get('stock', 0)}) != Batch stock ({batch_info['total_stock']})")
        
        if api_product and cloud_product.get('stock', 0) != api_product.get('stock', 0):
            print(f"   ⚠️  MISMATCH: Cloud stock ({cloud_product.get('stock', 0)}) != API stock ({api_product.get('stock', 0)})")
        
        if not api_product and cloud_product.get('stock', 0) > 0:
            print(f"   ⚠️  ISSUE: Product has stock but not visible in customer API")
        
        print("=" * 80)
    
    def close(self):
        """Close MongoDB connection"""
        self.client.close()
        print("\n✅ Connection closed")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Compare product stock across PANNRamyeonCorner and cloud database')
    parser.add_argument('--mongodb-uri', default=MONGODB_URI, help='MongoDB connection URI')
    parser.add_argument('--db-name', default=DATABASE_NAME, help='Database name')
    parser.add_argument('--api-url', default=API_BASE_URL, help='API base URL')
    parser.add_argument('--show-matches', action='store_true', help='Show matching products too')
    parser.add_argument('--export', type=str, help='Export results to JSON file')
    parser.add_argument('--product-id', type=str, help='Check specific product ID only')
    
    args = parser.parse_args()
    
    # Initialize comparison tool
    comparison = StockComparison(
        mongodb_uri=args.mongodb_uri,
        db_name=args.db_name,
        api_url=args.api_url
    )
    
    try:
        if args.product_id:
            # Check specific product
            comparison.check_specific_product(args.product_id)
        else:
            # Full comparison
            results = comparison.compare_stocks(
                show_matches=args.show_matches,
                export_file=args.export
            )
            
            # Print summary
            print("\n" + "=" * 80)
            print("✅ Comparison Complete!")
            print("=" * 80)
            print(f"Total Products Checked: {results['total_checked']}")
            print(f"Mismatches: {results['mismatch_count']}")
            print(f"Matches: {results['match_count']}")
            print(f"Missing from API: {results['missing_count']}")
            
            if results['mismatch_count'] > 0:
                print(f"\n⚠️  Found {results['mismatch_count']} products with stock mismatches!")
                print("   Please review the detailed report above.")
            else:
                print("\n✅ All product stocks are in sync!")
    
    finally:
        comparison.close()


if __name__ == '__main__':
    main()

