"""
Test Script for Order History Database Synchronization
Run this to verify that orders are correctly synced from MongoDB to the frontend.
"""

import requests
import json
from datetime import datetime

# Configuration
import os
API_BASE_URL = os.getenv("API_BASE_URL", "https://pann-pos.onrender.com/api/v1")
CUSTOMER_EMAIL = os.getenv("CUSTOMER_EMAIL", "customer@gmail.com")
CUSTOMER_PASSWORD = os.getenv("CUSTOMER_PASSWORD")  # Set via environment variable

# Test Results
results = {
    "passed": [],
    "failed": [],
    "warnings": []
}


def print_header(text):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def print_result(test_name, passed, message=""):
    """Print test result."""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {test_name}")
    if message:
        print(f"    → {message}")
    
    if passed:
        results["passed"].append(test_name)
    else:
        results["failed"].append((test_name, message))


def print_warning(message):
    """Print a warning."""
    print(f"⚠️  WARNING: {message}")
    results["warnings"].append(message)


def login_customer():
    """Login as customer and get access token."""
    print_header("Test 1: Customer Login")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/customer/login/",
            json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get("access_token")
            
            if access_token:
                print_result("Customer Login", True, f"Token received")
                return access_token
            else:
                print_result("Customer Login", False, "No access token in response")
                return None
        else:
            print_result("Customer Login", False, f"Status {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        print_result("Customer Login", False, str(e))
        return None


def test_order_history(access_token):
    """Test fetching order history."""
    print_header("Test 2: Fetch Order History")
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            f"{API_BASE_URL}/online/orders/history/",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success"):
                orders = data.get("results", [])
                count = len(orders)
                
                print_result("Fetch Order History", True, f"Retrieved {count} orders")
                
                if count > 0:
                    return orders[0]  # Return first order for further testing
                else:
                    print_warning("No orders found in database")
                    return None
            else:
                print_result("Fetch Order History", False, "API returned success=false")
                return None
        else:
            print_result("Fetch Order History", False, f"Status {response.status_code}")
            return None
            
    except Exception as e:
        print_result("Fetch Order History", False, str(e))
        return None


def test_order_structure(order):
    """Test order structure and required fields."""
    print_header("Test 3: Order Structure Validation")
    
    if not order:
        print_result("Order Structure", False, "No order to validate")
        return False
    
    # Required fields
    required_fields = [
        "order_id",
        "order_status",
        "status_history",
        "status_info",
        "items",
        "customer_id",
        "total_amount",
        "created_at"
    ]
    
    all_present = True
    for field in required_fields:
        if field in order:
            print_result(f"Field '{field}' present", True, f"Value: {order.get(field, 'N/A') if field != 'items' else f'{len(order.get(field, []))} items'}")
        else:
            print_result(f"Field '{field}' present", False, "Field missing")
            all_present = False
    
    return all_present


def test_order_id_format(order):
    """Test that order ID matches database format."""
    print_header("Test 4: Order ID Format")
    
    if not order:
        print_result("Order ID Format", False, "No order to validate")
        return False
    
    order_id = order.get("order_id", "")
    
    # Check if it's the correct format (ONLINE-XXXXXX)
    if order_id.startswith("ONLINE-"):
        print_result("Order ID Format", True, f"Order ID: {order_id}")
        return True
    else:
        print_result("Order ID Format", False, f"Expected 'ONLINE-XXXXXX', got '{order_id}'")
        return False


def test_status_history(order):
    """Test status history structure."""
    print_header("Test 5: Status History")
    
    if not order:
        print_result("Status History", False, "No order to validate")
        return False
    
    status_history = order.get("status_history", [])
    
    if not status_history:
        print_warning("Status history is empty")
        return False
    
    print_result("Status History Present", True, f"{len(status_history)} entries")
    
    # Check structure of first entry
    if len(status_history) > 0:
        entry = status_history[0]
        has_status = "status" in entry
        has_timestamp = "timestamp" in entry
        
        print_result("History Entry Structure", has_status and has_timestamp,
                    f"Status: {entry.get('status')}, Timestamp: {entry.get('timestamp')}")
        
        # Print all status changes
        print("\n   Order Timeline:")
        for i, entry in enumerate(status_history, 1):
            status = entry.get('status', 'unknown')
            timestamp = entry.get('timestamp', 'unknown')
            print(f"      {i}. {status} - {timestamp}")
    
    return len(status_history) > 0


def test_status_info(order):
    """Test status info structure."""
    print_header("Test 6: Status Display Info")
    
    if not order:
        print_result("Status Info", False, "No order to validate")
        return False
    
    status_info = order.get("status_info", {})
    
    if not status_info:
        print_result("Status Info Present", False, "Status info missing")
        return False
    
    # Check required fields
    required = ["label", "icon", "progress", "color"]
    all_present = all(field in status_info for field in required)
    
    if all_present:
        print_result("Status Info Structure", True,
                    f"{status_info.get('icon')} {status_info.get('label')} - {status_info.get('progress')}%")
    else:
        print_result("Status Info Structure", False, "Missing required fields")
    
    return all_present


def test_order_status_endpoint(access_token, order_id):
    """Test individual order status endpoint."""
    print_header("Test 7: Individual Order Status Endpoint")
    
    if not order_id:
        print_result("Order Status Endpoint", False, "No order ID to test")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            f"{API_BASE_URL}/online/orders/{order_id}/status/",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success"):
                status_data = data.get("data", {})
                current_status = status_data.get("current_status")
                status_history = status_data.get("status_history", [])
                
                print_result("Order Status Endpoint", True,
                            f"Status: {current_status}, History: {len(status_history)} entries")
                return True
            else:
                print_result("Order Status Endpoint", False, "API returned success=false")
                return False
        else:
            print_result("Order Status Endpoint", False, f"Status {response.status_code}")
            return False
            
    except Exception as e:
        print_result("Order Status Endpoint", False, str(e))
        return False


def print_summary():
    """Print test summary."""
    print_header("Test Summary")
    
    total = len(results["passed"]) + len(results["failed"])
    passed = len(results["passed"])
    failed = len(results["failed"])
    warnings = len(results["warnings"])
    
    print(f"\nTotal Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"⚠️  Warnings: {warnings}")
    
    if failed > 0:
        print("\n" + "=" * 60)
        print("Failed Tests:")
        for test_name, message in results["failed"]:
            print(f"  ❌ {test_name}")
            if message:
                print(f"      → {message}")
    
    if warnings > 0:
        print("\n" + "=" * 60)
        print("Warnings:")
        for warning in results["warnings"]:
            print(f"  ⚠️  {warning}")
    
    print("\n" + "=" * 60)
    if failed == 0:
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed. Please review the results above.")
    print("=" * 60 + "\n")


def main():
    """Run all tests."""
    print("\n")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║     Order History Database Synchronization Test Suite     ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    print(f"\nAPI Base URL: {API_BASE_URL}")
    print(f"Customer Email: {CUSTOMER_EMAIL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if not CUSTOMER_PASSWORD:
        print("\n❌ ERROR: CUSTOMER_PASSWORD environment variable is not set")
        print("   Set it using: export CUSTOMER_PASSWORD='your_password'")
        print_summary()
        return
    
    # Run tests
    access_token = login_customer()
    
    if not access_token:
        print("\n❌ Cannot proceed without access token")
        print_summary()
        return
    
    order = test_order_history(access_token)
    
    if order:
        test_order_structure(order)
        test_order_id_format(order)
        test_status_history(order)
        test_status_info(order)
        
        order_id = order.get("order_id")
        if order_id:
            test_order_status_endpoint(access_token, order_id)
    else:
        print_warning("Cannot run further tests without an order")
    
    print_summary()


if __name__ == "__main__":
    main()


