"""
Sage X3 Data Loader and POS Integration
======================================

This module handles loading data from your imported Sage X3 database tables
and provides a complete POS pricing system integration.
"""

import sqlite3
import json
from typing import Dict, List, Optional, Any, Union
from decimal import Decimal
from datetime import datetime
import logging
from contextlib import contextmanager

# Import the pricing engine (assuming it's in the same directory)
try:
    from sage_x3_pricing import SageX3PricingEngine, PricingContext, PriceResult
except ImportError:
    # If running standalone, you'll need to copy the pricing engine code
    print("Warning: sage_x3_pricing module not found. Please ensure it's available.")

logger = logging.getLogger(__name__)


class SageX3DataManager:
    """
    Comprehensive data manager for Sage X3 tables
    """
    
    # Define all available tables
    AVAILABLE_TABLES = [
        "ITMMASTER",      # Item Master
        "ITMSALES",       # Item Sales
        "ITMFACILIT",     # Item Facilities
        "BPARTNER",       # Business Partners
        "BPCUSTOMER",     # Customers
        "BPCUSTMVT",      # Customer Movements
        "BPDLVCUST",      # Delivery Customers
        "SALESREP",       # Sales Representatives
        "SPRICLINK",      # Pricing Link
        "PRICSTRUCT",     # Price Structure
        "SPREASON",       # Pricing Reasons
        "SPRICCONF",      # Price Configuration
        "SPRICLIST"       # Price Lists
    ]
    
    def __init__(self, db_path: str = "sagex3_seed.db"):
        """
        Initialize with database path
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        self._verify_database()
        
    def _verify_database(self):
        """Verify database exists and contains expected tables"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                existing_tables = [row[0] for row in cursor.fetchall()]
                
                missing_tables = [table for table in self.AVAILABLE_TABLES 
                                if table not in existing_tables]
                
                if missing_tables:
                    logger.warning(f"Missing tables in database: {missing_tables}")
                else:
                    logger.info("All expected tables found in database")
                    
                logger.info(f"Available tables: {existing_tables}")
                
        except sqlite3.Error as e:
            logger.error(f"Database verification error: {e}")
            raise RuntimeError(f"Cannot access database {self.db_path}: {e}")
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            yield conn
        except sqlite3.Error as e:
            logger.error(f"Database error: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
    
    def load_table(self, table_name: str, where_clause: str = "", 
                   params: tuple = ()) -> List[Dict]:
        """
        Load data from any table with optional WHERE clause
        
        Args:
            table_name: Name of the table to load
            where_clause: Optional WHERE clause (without WHERE keyword)
            params: Parameters for the WHERE clause
            
        Returns:
            List of dictionaries containing table data
        """
        if table_name not in self.AVAILABLE_TABLES:
            raise ValueError(f"Table {table_name} not in available tables")
        
        query = f"SELECT * FROM {table_name}"
        if where_clause:
            query += f" WHERE {where_clause}"
        
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, params)
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
                
        except sqlite3.Error as e:
            logger.error(f"Error loading {table_name}: {e}")
            return []
    
    def get_item_master(self, item_code: Optional[str] = None) -> List[Dict]:
        """Load item master data"""
        if item_code:
            return self.load_table("ITMMASTER", "ITMREF_0 = ?", (item_code,))
        return self.load_table("ITMMASTER")
    
    def get_item_sales_info(self, item_code: str) -> List[Dict]:
        """Get sales information for an item"""
        return self.load_table("ITMSALES", "ITMREF_0 = ?", (item_code,))
    
    def get_customer_info(self, customer_code: str) -> List[Dict]:
        """Get customer information"""
        return self.load_table("BPCUSTOMER", "BPCNUM_0 = ?", (customer_code,))
    
    def get_price_lists(self, item_code: Optional[str] = None, 
                       customer_code: Optional[str] = None,
                       active_only: bool = True) -> List[Dict]:
        """Load price lists with optional filters"""
        where_parts = []
        params = []
        
        if item_code:
            where_parts.append("PLICRI1_0 = ?")
            params.append(item_code)
        
        if customer_code:
            where_parts.append("PLICRI2_0 = ?")
            params.append(customer_code)
        
        if active_only:
            # Filter by date range
            current_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            where_parts.append("PLISTRDAT_0 <= ?")
            where_parts.append("PLIENDDAT_0 >= ?")
            params.extend([current_date, current_date])
        
        where_clause = " AND ".join(where_parts) if where_parts else ""
        return self.load_table("SPRICLIST", where_clause, tuple(params))
    
    def get_price_configs(self, active_only: bool = True) -> List[Dict]:
        """Load price configurations"""
        if active_only:
            return self.load_table("SPRICCONF", "PLIENAFLG_0 = '2'")
        return self.load_table("SPRICCONF")
    
    def get_price_structures(self) -> List[Dict]:
        """Load price structures"""
        return self.load_table("PRICSTRUCT")
    
    def search_items(self, search_term: str, limit: int = 50) -> List[Dict]:
        """Search items by code or description"""
        query = """
        SELECT DISTINCT i.*, s.SALFCY_0, s.SALCUR_0 
        FROM ITMMASTER i
        LEFT JOIN ITMSALES s ON i.ITMREF_0 = s.ITMREF_0
        WHERE i.ITMREF_0 LIKE ? OR i.ITMDES1_0 LIKE ?
        LIMIT ?
        """
        
        search_pattern = f"%{search_term}%"
        
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, (search_pattern, search_pattern, limit))
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
                
        except sqlite3.Error as e:
            logger.error(f"Error searching items: {e}")
            return []


class CompletePOSSystem:
    """
    Complete POS system with Sage X3 integration
    """
    
    def __init__(self, db_path: str = "sagex3_seed.db"):
        """Initialize the complete POS system"""
        self.data_manager = SageX3DataManager(db_path)
        self.pricing_engine = None
        self._initialize_pricing_engine()
    
    def _initialize_pricing_engine(self):
        """Initialize the pricing engine with current data"""
        try:
            logger.info("Initializing pricing engine...")
            
            # Load pricing data
            price_lists = self.data_manager.get_price_lists()
            price_configs = self.data_manager.get_price_configs()
            price_structures = self.data_manager.get_price_structures()
            
            logger.info(f"Loaded {len(price_lists)} price list entries")
            logger.info(f"Loaded {len(price_configs)} price configurations")
            logger.info(f"Loaded {len(price_structures)} price structures")
            
            # Initialize pricing engine
            self.pricing_engine = SageX3PricingEngine(
                price_lists_data=price_lists,
                price_configs_data=price_configs,
                price_structures_data=price_structures
            )
            
            logger.info("Pricing engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize pricing engine: {e}")
            raise
    
    def get_item_details(self, item_code: str) -> Dict[str, Any]:
        """Get comprehensive item details"""
        try:
            # Get basic item info
            item_master = self.data_manager.get_item_master(item_code)
            if not item_master:
                return {
                    'success': False,
                    'message': f'Item {item_code} not found',
                    'item_code': item_code
                }
            
            item = item_master[0]
            
            # Get sales info
            sales_info = self.data_manager.get_item_sales_info(item_code)
            
            # Get applicable price lists
            price_lists = self.data_manager.get_price_lists(item_code=item_code)
            
            return {
                'success': True,
                'item_code': item_code,
                'description': item.get('ITMDES1_0', ''),
                'long_description': item.get('ITMDES2_0', ''),
                'item_type': item.get('ITMTYP_0', ''),
                'base_unit': item.get('STU_0', 'UN'),
                'sales_unit': item.get('SAU_0', 'UN'),
                'active': item.get('ITMSTA_0', '1') == '2',  # 2 = Active
                'sales_info': sales_info,
                'available_price_lists': len(price_lists),
                'weight': item.get('WEU_0', 0),
                'volume': item.get('VOL_0', 0)
            }
            
        except Exception as e:
            logger.error(f"Error getting item details for {item_code}: {e}")
            return {
                'success': False,
                'message': f'Error retrieving item details: {str(e)}',
                'item_code': item_code
            }
    
    def calculate_item_price(self, item_code: str, quantity: float = 1.0,
                           customer_code: Optional[str] = None,
                           currency: str = "CRC", site: Optional[str] = None) -> Dict[str, Any]:
        """Calculate price for an item with comprehensive details"""
        
        if not self.pricing_engine:
            return {
                'success': False,
                'message': 'Pricing engine not initialized',
                'item_code': item_code
            }
        
        try:
            # Get item details first
            item_details = self.get_item_details(item_code)
            if not item_details['success']:
                return item_details
            
            # Create pricing context
            context = PricingContext(
                item_code=item_code,
                customer_code=customer_code,
                currency=currency,
                quantity=Decimal(str(quantity)),
                unit_of_measure=item_details.get('sales_unit', 'UN'),
                site=site,
                date=datetime.now()
            )
            
            # Calculate price using the pricing engine
            pricing_result = self.pricing_engine.calculate_price(context)
            
            # Prepare comprehensive result
            result = {
                'success': True,
                'item_code': item_code,
                'item_description': item_details['description'],
                'quantity': float(quantity),
                'unit_of_measure': context.unit_of_measure,
                'currency': pricing_result.currency,
                'unit_price': float(pricing_result.unit_price),
                'discounts': [float(d) for d in pricing_result.discounts],
                'total_discount_percent': float(pricing_result.total_discount),
                'net_unit_price': float(pricing_result.net_price),
                'line_total': float(pricing_result.net_price * Decimal(str(quantity))),
                'applied_rules': pricing_result.applied_rules,
                'pricing_motif': pricing_result.pricing_motif,
                'commission_coefficient': float(pricing_result.commission_coefficient),
                'calculation_timestamp': datetime.now().isoformat()
            }
            
            # Add customer info if provided
            if customer_code:
                customer_info = self.data_manager.get_customer_info(customer_code)
                if customer_info:
                    result['customer_info'] = {
                        'code': customer_code,
                        'name': customer_info[0].get('BPCNAM_0', ''),
                        'currency': customer_info[0].get('CUR_0', currency)
                    }
            
            return result
            
        except Exception as e:
            logger.error(f"Error calculating price for {item_code}: {e}")
            return {
                'success': False,
                'message': f'Error calculating price: {str(e)}',
                'item_code': item_code,
                'quantity': float(quantity)
            }
    
    def process_cart(self, cart_items: List[Dict], 
                    customer_code: Optional[str] = None,
                    currency: str = "CRC", 
                    site: Optional[str] = None) -> Dict[str, Any]:
        """Process a complete shopping cart"""
        
        cart_total = Decimal('0.0')
        subtotal = Decimal('0.0')
        total_discount = Decimal('0.0')
        processed_items = []
        
        for item_data in cart_items:
            item_code = item_data.get('item_code', '')
            quantity = float(item_data.get('quantity', 1.0))
            
            if not item_code:
                continue
            
            # Calculate price for this item
            item_result = self.calculate_item_price(
                item_code=item_code,
                quantity=quantity,
                customer_code=customer_code,
                currency=currency,
                site=site
            )
            
            processed_items.append(item_result)
            
            if item_result['success']:
                line_total = Decimal(str(item_result['line_total']))
                cart_total += line_total
                
                # Calculate subtotal (before discounts)
                unit_price = Decimal(str(item_result['unit_price']))
                quantity_dec = Decimal(str(quantity))
                line_subtotal = unit_price * quantity_dec
                subtotal += line_subtotal
                
                # Calculate discount amount
                line_discount = line_subtotal - line_total
                total_discount += line_discount
        
        return {
            'success': True,
            'cart_items': processed_items,
            'summary': {
                'subtotal': float(subtotal),
                'total_discount': float(total_discount),
                'cart_total': float(cart_total),
                'currency': currency,
                'item_count': len([item for item in processed_items if item['success']]),
                'total_quantity': sum(item['quantity'] for item in processed_items if item['success'])
            },
            'customer_code': customer_code,
            'site': site,
            'timestamp': datetime.now().isoformat()
        }
    
    def search_items(self, search_term: str, limit: int = 20) -> Dict[str, Any]:
        """Search for items"""
        try:
            results = self.data_manager.search_items(search_term, limit)
            
            formatted_results = []
            for item in results:
                formatted_results.append({
                    'item_code': item.get('ITMREF_0', ''),
                    'description': item.get('ITMDES1_0', ''),
                    'long_description': item.get('ITMDES2_0', ''),
                    'active': item.get('ITMSTA_0', '1') == '2',
                    'base_unit': item.get('STU_0', 'UN'),
                    'sales_unit': item.get('SAU_0', 'UN'),
                    'item_type': item.get('ITMTYP_0', '')
                })
            
            return {
                'success': True,
                'search_term': search_term,
                'results': formatted_results,
                'count': len(formatted_results)
            }
            
        except Exception as e:
            logger.error(f"Error searching items: {e}")
            return {
                'success': False,
                'message': f'Search error: {str(e)}',
                'search_term': search_term,
                'results': []
            }
    
    def refresh_pricing_data(self):
        """Refresh pricing data from database"""
        logger.info("Refreshing pricing data...")
        self._initialize_pricing_engine()
        logger.info("Pricing data refreshed")


class POSWebAPI:
    """
    Simple web-like API interface for the POS system
    """
    
    def __init__(self, db_path: str = "sagex3_seed.db"):
        self.pos_system = CompletePOSSystem(db_path)
    
    def get_item_price(self, item_code: str, quantity: float = 1.0,
                      customer_code: Optional[str] = None) -> str:
        """Get item price as JSON"""
        result = self.pos_system.calculate_item_price(
            item_code=item_code,
            quantity=quantity,
            customer_code=customer_code
        )
        return json.dumps(result, indent=2, default=str)
    
    def process_sale(self, cart_json: str, 
                    customer_code: Optional[str] = None) -> str:
        """Process a complete sale from JSON cart"""
        try:
            cart_data = json.loads(cart_json)
            items = cart_data.get('items', [])
            currency = cart_data.get('currency', 'CRC')
            site = cart_data.get('site')
            
            result = self.pos_system.process_cart(
                cart_items=items,
                customer_code=customer_code,
                currency=currency,
                site=site
            )
            
            return json.dumps(result, indent=2, default=str)
            
        except json.JSONDecodeError as e:
            return json.dumps({
                'success': False,
                'message': f'Invalid JSON: {str(e)}'
            }, indent=2)
        except Exception as e:
            return json.dumps({
                'success': False,
                'message': f'Processing error: {str(e)}'
            }, indent=2)
    
    def search_items(self, search_term: str) -> str:
        """Search items and return JSON"""
        result = self.pos_system.search_items(search_term)
        return json.dumps(result, indent=2, default=str)


# Example usage and testing functions
def demo_pos_system():
    """Demonstrate the POS system with real data"""
    
    print("=== Sage X3 POS System Demo ===\n")
    
    try:
        # Initialize the POS system
        pos = CompletePOSSystem()
        
        # 1. Search for items
        print("1. Searching for items containing 'BMS'...")
        search_result = pos.search_items("BMS", limit=5)
        print(json.dumps(search_result, indent=2))
        
        if search_result['success'] and search_result['results']:
            # Use the first item found for pricing demo
            first_item = search_result['results'][0]
            item_code = first_item['item_code']
            
            print(f"\n2. Getting details for item: {item_code}")
            item_details = pos.get_item_details(item_code)
            print(json.dumps(item_details, indent=2, default=str))
            
            print(f"\n3. Calculating price for {item_code} (qty: 100)")
            price_result = pos.calculate_item_price(item_code, 100.0)
            print(json.dumps(price_result, indent=2, default=str))
            
            # 4. Process a cart
            print(f"\n4. Processing a sample cart...")
            cart_items = [
                {"item_code": item_code, "quantity": 50},
                {"item_code": item_code, "quantity": 150}  # Different quantity for tiered pricing
            ]
            
            cart_result = pos.process_cart(cart_items)
            print(json.dumps(cart_result, indent=2, default=str))
        
        # 5. Test the API interface
        print("\n5. Testing API interface...")
        api = POSWebAPI()
        
        # API search
        api_search = api.search_items("BMS")
        print("API Search Result:")
        print(api_search)
        
    except Exception as e:
        print(f"Demo failed: {e}")
        logger.exception("Demo execution failed")


def test_with_sample_data():
    """Test with specific known data"""
    
    print("=== Testing with Sample Data ===\n")
    
    # Test cases you can modify based on your actual data
    test_cases = [
        {
            "item_code": "BMS003",
            "quantity": 150,
            "expected": "Should find pricing rule with quantity range"
        },
        {
            "item_code": "BMS003", 
            "quantity": 50,
            "expected": "Different pricing for lower quantity"
        }
    ]
    
    try:
        pos = CompletePOSSystem()
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"Test Case {i}: {test_case['expected']}")
            print(f"Item: {test_case['item_code']}, Quantity: {test_case['quantity']}")
            
            result = pos.calculate_item_price(
                test_case['item_code'], 
                test_case['quantity']
            )
            
            print(f"Result: {result['success']}")
            if result['success']:
                print(f"Price: {result['net_unit_price']} {result['currency']}")
                print(f"Line Total: {result['line_total']}")
                print(f"Applied Rules: {result['applied_rules']}")
            else:
                print(f"Error: {result['message']}")
            
            print("-" * 50)
    
    except Exception as e:
        print(f"Test failed: {e}")


if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the demo
    demo_pos_system()
    
    print("\n" + "="*60 + "\n")
    
    # Run specific tests
    test_with_sample_data()