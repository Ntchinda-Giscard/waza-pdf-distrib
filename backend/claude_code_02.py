import sqlite3
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class PricingContext:
    """Context object containing all information needed for pricing calculation"""
    customer_code: str
    item_code: str
    quantity: Decimal
    currency: str = 'CRC'
    unit_of_measure: str = 'UN'
    site: str = ''
    sales_rep: str = ''
    order_date: datetime = None
    customer_category: str = ''
    item_category: str = ''
    
    def __post_init__(self):
        if self.order_date is None:
            self.order_date = datetime.now()

@dataclass
class PriceAdjustment:
    """Represents a single price adjustment (discount or fee) with complete Sage X3 semantics"""
    index: int
    value: Decimal
    adjustment_type: str  # 'discount' (minoration) or 'fee' (majoration)
    calculation_type: str  # 'amount', 'percentage_cumulative', 'percentage_cascading'
    calculation_basis: str  # 'unit', 'line', 'document'
    description: str = ''
    
    # Internal fields for calculation
    incdcr_flag: str = '0'  # Original INCDCR value
    valtyp_flag: str = '0'  # Original VALTYP value  
    clcrul_flag: str = '0'  # Original CLCRUL value

@dataclass
class PricingResult:
    """Result object containing calculated pricing information"""
    unit_price: Decimal = Decimal('0')
    base_price: Decimal = Decimal('0')  # Price before adjustments
    adjustments: List[PriceAdjustment] = None  # All adjustments (discounts + fees)
    free_items: List[Dict[str, Any]] = None
    commission_coefficient: Decimal = Decimal('1')
    pricing_rule_code: str = ''
    reason_code: str = ''
    currency: str = ''
    unit_of_measure: str = ''
    price_structure_code: str = ''  # The structure code used
    debug_info: Dict[str, Any] = None  # Debug information
    
    def __post_init__(self):
        if self.adjustments is None:
            self.adjustments = []
        if self.free_items is None:
            self.free_items = []
        if self.debug_info is None:
            self.debug_info = {}
    
    @property
    def discounts(self) -> List[PriceAdjustment]:
        """Get only discount adjustments for backward compatibility"""
        return [adj for adj in self.adjustments if adj.adjustment_type == 'discount']
    
    @property
    def fees(self) -> List[PriceAdjustment]:
        """Get only fee adjustments"""
        return [adj for adj in self.adjustments if adj.adjustment_type == 'fee']

class SageX3PricingEngine:
    """
    Revised Sage X3 Pricing Engine Implementation with Enhanced Debugging
    
    This version includes better error handling, comprehensive logging, and fixes
    for common issues that cause zero pricing results.
    """
    
    def __init__(self, db_path: str, debug_mode: bool = True):
        """
        Initialize the pricing engine with database connection
        
        Args:
            db_path: Path to the SQLite database file
            debug_mode: Enable detailed debugging output
        """
        self.db_path = db_path
        self.debug_mode = debug_mode
        self.connection = None
        self._price_structures_cache = {}  # Cache for price structures
        
    def connect(self):
        """Establish database connection with validation"""
        try:
            self.connection = sqlite3.connect(self.db_path)
            self.connection.row_factory = sqlite3.Row
            
            # Validate database structure
            self._validate_database_structure()
            
            logger.info(f"Connected to database: {self.db_path}")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    def _validate_database_structure(self):
        """Validate that required tables and columns exist"""
        required_tables = ['SPRICCONF', 'SPRICLIST', 'PRICSTRUCT', 'ITMMASTER']
        cursor = self.connection.cursor()
        
        # Check if tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        missing_tables = [table for table in required_tables if table not in existing_tables]
        if missing_tables:
            logger.warning(f"Missing tables: {missing_tables}")
        
        # Check table contents
        for table in required_tables:
            if table in existing_tables:
                cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                count = cursor.fetchone()[0]
                logger.info(f"Table {table}: {count} records")
                
                if count == 0:
                    logger.warning(f"Table {table} is empty - this may cause pricing issues")
    
    def disconnect(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
    
    def __enter__(self):
        self.connect()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
    
    def debug_database_content(self):
        """Debug method to inspect database content"""
        if not self.debug_mode:
            return
            
        cursor = self.connection.cursor()
        
        print("\n=== DATABASE CONTENT DEBUG ===")
        
        # Check pricing configurations
        cursor.execute("SELECT COUNT(*) as count FROM SPRICCONF")
        total_configs = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) as count FROM SPRICCONF WHERE PLIENAFLG_0 = '2'")
        active_configs = cursor.fetchone()[0]
        
        print(f"Pricing configurations: {active_configs}/{total_configs} active")
        
        # Show sample active config
        cursor.execute("SELECT * FROM SPRICCONF WHERE PLIENAFLG_0 = '2' ORDER BY PIO_0 LIMIT 1")
        sample_config = cursor.fetchone()
        if sample_config:
            config_dict = dict(sample_config)
            print(f"Sample active config: {config_dict['PLI_0']} (Priority: {config_dict['PIO_0']})")
            
            # Check pricing lines for this config
            cursor.execute("SELECT COUNT(*) as count FROM SPRICLIST WHERE PLI_0 = ?", (config_dict['PLI_0'],))
            line_count = cursor.fetchone()[0]
            print(f"  - Has {line_count} pricing lines")
            
            # Show sample pricing line
            cursor.execute("SELECT * FROM SPRICLIST WHERE PLI_0 = ? LIMIT 1", (config_dict['PLI_0'],))
            sample_line = cursor.fetchone()
            if sample_line:
                line_dict = dict(sample_line)
                print(f"  - Sample line price: {line_dict.get('PRI_0', 'NOT_FOUND')}")
                print(f"  - Sample line currency: {line_dict.get('CUR_0', 'NOT_FOUND')}")
                print(f"  - Sample line UOM: {line_dict.get('UOM_0', 'NOT_FOUND')}")
        else:
            print("No active pricing configurations found!")
        
        # Check price structures
        cursor.execute("SELECT COUNT(*) as count FROM PRICSTRUCT")
        struct_count = cursor.fetchone()[0]
        print(f"Price structures: {struct_count}")
        
        print("=" * 40)
    
    def get_pricing_configurations(self) -> List[Dict[str, Any]]:
        """
        Get all pricing configurations ordered by priority with enhanced validation
        
        Returns:
            List of pricing configuration dictionaries
        """
        cursor = self.connection.cursor()
        
        # More flexible query - try different possible active flag values
        query = """
        SELECT * FROM SPRICCONF 
        WHERE PLIENAFLG_0 IN ('2', 'Y', 'Yes', '1', 'True', 'Active')
        ORDER BY PIO_0 ASC
        """
        
        try:
            cursor.execute(query)
            results = cursor.fetchall()
        except sqlite3.Error as e:
            logger.error(f"Error querying SPRICCONF: {e}")
            # Try fallback query without active flag filter
            logger.info("Trying fallback query without active flag filter...")
            cursor.execute("SELECT * FROM SPRICCONF ORDER BY PIO_0 ASC")
            results = cursor.fetchall()
        
        configs = []
        for row in results:
            config = dict(row)
            
            if self.debug_mode:
                logger.debug(f"Found pricing config: {config.get('PLI_0', 'NO_CODE')} with priority {config.get('PIO_0', 'NO_PRIORITY')}")
            
            configs.append(config)
        
        if not configs:
            logger.warning("No pricing configurations found in database!")
            
        return configs
    
    def get_base_price_from_item_master(self, item_code: str) -> Decimal:
        """
        Get the base price for an item from ITMMASTER table with fallback options
        
        Args:
            item_code: Item reference code
            
        Returns:
            Base price as Decimal
        """
        cursor = self.connection.cursor()
        
        # Try different possible price field names
        price_fields = ['BASPRI_0', 'BASE_PRICE', 'PRICE', 'UNIT_PRICE', 'STD_PRICE']
        
        for price_field in price_fields:
            try:
                query = f"SELECT {price_field} FROM ITMMASTER WHERE ITMREF_0 = ?"
                cursor.execute(query, (item_code,))
                result = cursor.fetchone()
                
                if result and result[0] is not None:
                    price = Decimal(str(result[0]))
                    if price > 0:
                        if self.debug_mode:
                            logger.debug(f"Found base price {price} in field {price_field} for item {item_code}")
                        return price
            except (sqlite3.Error, KeyError, ValueError) as e:
                if self.debug_mode:
                    logger.debug(f"Field {price_field} not found or invalid: {e}")
                continue
        
        # If no price found in ITMMASTER, try to get from a pricing line
        logger.warning(f"No base price found in ITMMASTER for item {item_code}")
        return Decimal('0')
    
    def find_applicable_pricing_lines_simple(self, context: PricingContext, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Simplified method to find applicable pricing lines with less restrictive criteria
        
        Args:
            context: Pricing context
            config: Pricing configuration
            
        Returns:
            List of applicable pricing line dictionaries
        """
        cursor = self.connection.cursor()
        
        # Start with basic criteria
        where_conditions = ["PLI_0 = ?"]
        params = [config.get('PLI_0')]
        
        # Add currency match if specified
        if context.currency:
            where_conditions.append("(CUR_0 = ? OR CUR_0 IS NULL OR CUR_0 = '')")
            params.append(context.currency)
        
        # Add unit of measure match if specified
        if context.unit_of_measure:
            where_conditions.append("(UOM_0 = ? OR UOM_0 IS NULL OR UOM_0 = '')")
            params.append(context.unit_of_measure)
        
        # Relaxed date range check
        if context.order_date:
            current_date = context.order_date.strftime('%Y-%m-%d')
            where_conditions.append("(PLISTRDAT_0 IS NULL OR PLISTRDAT_0 <= ?)")
            where_conditions.append("(PLIENDDAT_0 IS NULL OR PLIENDDAT_0 >= ?)")
            params.extend([current_date, current_date])
        
        # Relaxed quantity range check
        where_conditions.append("(MINQTY_0 IS NULL OR MINQTY_0 = 0 OR MINQTY_0 <= ?)")
        where_conditions.append("(MAXQTY_0 IS NULL OR MAXQTY_0 = 0 OR MAXQTY_0 >= ?)")
        params.extend([float(context.quantity), float(context.quantity)])
        
        query = f"""
        SELECT * FROM SPRICLIST 
        WHERE {' AND '.join(where_conditions)}
        ORDER BY PLILIN_0 ASC
        """
        
        if self.debug_mode:
            logger.debug(f"Simplified pricing query: {query}")
            logger.debug(f"Query parameters: {params}")
        
        try:
            cursor.execute(query, params)
            results = cursor.fetchall()
            
            applicable_lines = []
            for row in results:
                line = dict(row)
                applicable_lines.append(line)
                
                if self.debug_mode:
                    logger.debug(f"Found applicable pricing line with price: {line.get('PRI_0', 'NO_PRICE')}")
            
            return applicable_lines
            
        except sqlite3.Error as e:
            logger.error(f"Error executing pricing query: {e}")
            return []
    
    def calculate_price_from_line_enhanced(self, context: PricingContext, line: Dict[str, Any], config: Dict[str, Any]) -> Decimal:
        """
        Enhanced price calculation with multiple fallback strategies
        
        Args:
            context: Pricing context
            line: Pricing line dictionary
            config: Pricing configuration
            
        Returns:
            Calculated price as Decimal
        """
        if self.debug_mode:
            logger.debug(f"Calculating price from line: {dict(line)}")
        
        # Try to get price treatment from config
        price_treatment = config.get('PRIPRO_0', '2')  # Default to 'Value'
        
        if self.debug_mode:
            logger.debug(f"Price treatment: {price_treatment}")
        
        # Method 1: Direct value from pricing line
        if price_treatment in ['2', 'Value', 'value']:
            price_fields = ['PRI_0', 'PRICE', 'UNIT_PRICE', 'BASE_PRICE']
            
            for price_field in price_fields:
                if price_field in line and line[price_field] is not None:
                    try:
                        price = Decimal(str(line[price_field]))
                        if price > 0:
                            if self.debug_mode:
                                logger.debug(f"Found price {price} in field {price_field}")
                            return price
                    except (ValueError, TypeError) as e:
                        if self.debug_mode:
                            logger.debug(f"Invalid price in field {price_field}: {e}")
                        continue
        
        # Method 2: Coefficient-based calculation
        elif price_treatment in ['1', 'Coefficient', 'coefficient']:
            base_price_field = config.get('PRIFLD_0', '')
            if base_price_field:
                # This would require more complex implementation
                # For now, get base price from item master
                base_price = self.get_base_price_from_item_master(context.item_code)
                coefficient_fields = ['PRI_0', 'COEFF', 'COEFFICIENT']
                
                for coeff_field in coefficient_fields:
                    if coeff_field in line and line[coeff_field] is not None:
                        try:
                            coefficient = Decimal(str(line[coeff_field]))
                            if coefficient > 0 and base_price > 0:
                                calculated_price = base_price * coefficient
                                if self.debug_mode:
                                    logger.debug(f"Calculated price: {base_price} * {coefficient} = {calculated_price}")
                                return calculated_price
                        except (ValueError, TypeError):
                            continue
        
        # Method 3: Formula calculation (simplified)
        elif price_treatment in ['3', 'Calcul', 'Formula', 'formula']:
            # For now, treat as direct value
            if 'PRI_0' in line and line['PRI_0'] is not None:
                try:
                    price = Decimal(str(line['PRI_0']))
                    if price > 0:
                        return price
                except (ValueError, TypeError):
                    pass
        
        # Fallback: Try to get base price from item master
        base_price = self.get_base_price_from_item_master(context.item_code)
        if base_price > 0:
            if self.debug_mode:
                logger.debug(f"Using fallback base price from item master: {base_price}")
            return base_price
        
        if self.debug_mode:
            logger.warning(f"No valid price found - returning 0")
        
        return Decimal('0')
    
    def calculate_pricing_enhanced(self, context: PricingContext) -> PricingResult:
        """
        Enhanced main pricing calculation method with comprehensive debugging
        
        Args:
            context: Pricing context containing all necessary information
            
        Returns:
            PricingResult object with calculated pricing information and debug data
        """
        if self.debug_mode:
            print(f"\n{'='*60}")
            print(f"STARTING ENHANCED PRICING CALCULATION")
            print(f"{'='*60}")
            print(f"Item: {context.item_code}")
            print(f"Customer: {context.customer_code}")
            print(f"Quantity: {context.quantity}")
            print(f"Currency: {context.currency}")
            print(f"UOM: {context.unit_of_measure}")
            print(f"Date: {context.order_date}")
        
        result = PricingResult()
        result.currency = context.currency
        result.unit_of_measure = context.unit_of_measure
        result.debug_info = {
            'context': context,
            'configs_checked': 0,
            'lines_found': 0,
            'price_sources': []
        }
        
        # Debug database content first
        self.debug_database_content()
        
        # Get all pricing configurations
        configs = self.get_pricing_configurations()
        result.debug_info['configs_checked'] = len(configs)
        
        if not configs:
            logger.warning("No pricing configurations found")
            result.debug_info['error'] = 'No pricing configurations found'
            return result
        
        if self.debug_mode:
            print(f"\nFound {len(configs)} pricing configurations to check")
        
        # Process each configuration by priority
        for i, config in enumerate(configs):
            config_code = config.get('PLI_0', f'CONFIG_{i}')
            
            if self.debug_mode:
                print(f"\n--- Checking Config {i+1}: {config_code} ---")
                print(f"Priority: {config.get('PIO_0', 'UNKNOWN')}")
                print(f"Active Flag: {config.get('PLIENAFLG_0', 'UNKNOWN')}")
            
            # Find applicable pricing lines with simplified approach
            applicable_lines = self.find_applicable_pricing_lines_simple(context, config)
            result.debug_info['lines_found'] += len(applicable_lines)
            
            if self.debug_mode:
                print(f"Found {len(applicable_lines)} applicable lines")
            
            if not applicable_lines:
                if self.debug_mode:
                    print("No applicable lines - trying next config")
                continue
            
            # Process the first applicable line
            line = applicable_lines[0]
            
            if self.debug_mode:
                print(f"Using first applicable line:")
                print(f"  Line Code: {line.get('PLICRD_0', 'NO_CODE')}")
                print(f"  Price Field: {line.get('PRI_0', 'NO_PRICE')}")
            
            # Calculate base price with enhanced method
            base_price = self.calculate_price_from_line_enhanced(context, line, config)
            
            if self.debug_mode:
                print(f"Calculated base price: {base_price}")
            
            if base_price > 0:
                result.base_price = base_price
                result.unit_price = base_price
                result.pricing_rule_code = config_code
                result.reason_code = config.get('PRIREN_0', config.get('PLISTC_0', ''))
                result.price_structure_code = config.get('PLISTC_0', '')
                
                result.debug_info['price_sources'].append({
                    'config': config_code,
                    'line': line.get('PLICRD_0', 'UNKNOWN'),
                    'base_price': float(base_price),
                    'method': 'enhanced_calculation'
                })
                
                if self.debug_mode:
                    print(f"SUCCESS: Found valid price {base_price} from config {config_code}")
                
                # For now, skip complex adjustments and free items calculation
                # to focus on getting basic pricing working
                
                break
            else:
                if self.debug_mode:
                    print(f"Base price is 0 - checking next config")
        
        # Final fallback: try to get any price from item master
        if result.base_price == 0:
            fallback_price = self.get_base_price_from_item_master(context.item_code)
            if fallback_price > 0:
                result.base_price = fallback_price
                result.unit_price = fallback_price
                result.pricing_rule_code = 'FALLBACK_ITEM_MASTER'
                result.debug_info['price_sources'].append({
                    'config': 'FALLBACK',
                    'line': 'ITEM_MASTER',
                    'base_price': float(fallback_price),
                    'method': 'item_master_fallback'
                })
                
                if self.debug_mode:
                    print(f"Using fallback price from item master: {fallback_price}")
        
        # Summary
        if self.debug_mode:
            print(f"\n{'='*60}")
            print(f"PRICING CALCULATION SUMMARY")
            print(f"{'='*60}")
            print(f"Final Unit Price: {result.unit_price} {result.currency}")
            print(f"Base Price: {result.base_price} {result.currency}")
            print(f"Pricing Rule: {result.pricing_rule_code}")
            print(f"Configs Checked: {result.debug_info['configs_checked']}")
            print(f"Lines Found: {result.debug_info['lines_found']}")
            print(f"Price Sources: {len(result.debug_info['price_sources'])}")
            
            if result.unit_price == 0:
                print("\nWARNING: Final price is 0!")
                print("Possible causes:")
                print("1. No active pricing configurations")
                print("2. No matching pricing lines")
                print("3. All price fields contain 0 or null")
                print("4. Date/quantity ranges don't match")
                print("5. Currency/UOM mismatch")
            
            print(f"{'='*60}\n")
        
        return result

    def get_price_structure(self, structure_code: str) -> Dict[int, Dict[str, str]]:
        """
        Get price structure configuration from PRICSTRUCT table
        """
        if structure_code in self._price_structures_cache:
            return self._price_structures_cache[structure_code]
        
        cursor = self.connection.cursor()
        
        try:
            query = "SELECT * FROM PRICSTRUCT WHERE PLISTC_0 = ?"
            cursor.execute(query, (structure_code,))
            result = cursor.fetchone()
        except sqlite3.Error as e:
            logger.error(f"Error querying PRICSTRUCT: {e}")
            return {}
        
        structure_config = {}
        
        if result:
            row_dict = dict(result)
            
            # Process each of the 9 discount/fee columns (0-8)
            for i in range(9):
                incdcr_field = f'INCDCR_{i}'
                valtyp_field = f'VALTYP_{i}'
                clcrul_field = f'CLCRUL_{i}'
                landessho_field = f'LANDESSHO_{i}'
                
                incdcr = row_dict.get(incdcr_field, '0')
                valtyp = row_dict.get(valtyp_field, '0')
                clcrul = row_dict.get(clcrul_field, '0')
                description = row_dict.get(landessho_field, f'Adjustment {i}')
                
                # Only include columns that are actually configured
                if incdcr != '0' and valtyp != '0' and clcrul != '0':
                    structure_config[i] = {
                        'incdcr': incdcr,
                        'valtyp': valtyp,
                        'clcrul': clcrul,
                        'description': description
                    }
        
        self._price_structures_cache[structure_code] = structure_config
        return structure_config

# Test functions
def create_test_context() -> PricingContext:
    """Create a test pricing context"""
    return PricingContext(
        customer_code="FR001",
        item_code="DIS008", 
        quantity=Decimal("100"),
        currency="EUR",
        unit_of_measure="UN",
        order_date=datetime(2024, 7, 31)
    )

def test_enhanced_pricing_engine(db_path: str):
    """Test the enhanced pricing engine"""
    print("=== TESTING ENHANCED SAGE X3 PRICING ENGINE ===\n")
    
    with SageX3PricingEngine(db_path, debug_mode=True) as engine:
        context = create_test_context()
        result = engine.calculate_pricing_enhanced(context)
        
        print("\n=== FINAL TEST RESULTS ===")
        print(f"Unit Price: {result.unit_price} {result.currency}")
        print(f"Base Price: {result.base_price} {result.currency}")
        print(f"Pricing Rule: {result.pricing_rule_code}")
        print(f"Success: {'YES' if result.unit_price > 0 else 'NO'}")
        
        if result.debug_info['price_sources']:
            print("\nPrice Sources Found:")
            for source in result.debug_info['price_sources']:
                print(f"  - {source['config']}: {source['base_price']} ({source['method']})")

def run_database_diagnosis(db_path: str):
    """Run comprehensive database diagnosis"""
    print("=== SAGE X3 DATABASE DIAGNOSIS ===\n")
    
    with SageX3PricingEngine(db_path, debug_mode=True) as engine:
        # This will automatically run debug_database_content()
        context = create_test_context()
        
        # Just check configurations without full pricing
        configs = engine.get_pricing_configurations()
        print(f"\nDiagnosis Summary:")
        print(f"- Found {len(configs)} pricing configurations")
        
        if configs:
            print("- Sample configuration details:")
            for i, config in enumerate(configs[:3]):  # Show first 3
                print(f"  {i+1}. {config.get('PLI_0', 'NO_CODE')}")
                print(f"     Priority: {config.get('PIO_0', 'UNKNOWN')}")
                print(f"     Active: {config.get('PLIENAFLG_0', 'UNKNOWN')}")

if __name__ == "__main__":
    db_path = "sagex3_seed.db"
    
    # Run diagnosis first
    run_database_diagnosis(db_path)
    
    print("\n" + "="*80 + "\n")
    
    # Run full test
    test_enhanced_pricing_engine(db_path)