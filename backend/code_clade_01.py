import sqlite3
import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from decimal import Decimal
import logging

# Configure logging for debugging the pricing process
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PricingContext:
    """
    Represents all the contextual information needed for pricing calculation.
    This includes item details, customer info, transaction details, etc.
    """
    item_ref: str
    customer_code: str = ""
    site_code: str = ""
    quantity: Decimal = Decimal('1')
    currency: str = "USD"
    unit_of_measure: str = "UN"
    transaction_date: datetime.date = field(default_factory=datetime.date.today)
    sales_rep: str = ""
    customer_category: str = ""
    item_category: str = ""
    # Additional context fields can be added here
    additional_criteria: Dict[str, Any] = field(default_factory=dict)

@dataclass
class PricingResult:
    """
    Contains the complete pricing calculation result including base price,
    discounts, fees, and any additional information like commission rates.
    """
    base_price: Decimal = Decimal('0')
    net_price: Decimal = Decimal('0')
    currency: str = "USD"
    unit_of_measure: str = "UN"
    discounts: List[Dict[str, Any]] = field(default_factory=list)
    fees: List[Dict[str, Any]] = field(default_factory=list)
    applied_rules: List[str] = field(default_factory=list)
    commission_coefficient: Decimal = Decimal('1')
    free_goods: Dict[str, Any] = field(default_factory=dict)
    pricing_reason: str = ""

class SageX3PricingEngine:
    """
    Main pricing engine that replicates Sage X3's sophisticated pricing logic.
    This engine evaluates pricing rules in priority order and applies complex
    business logic to determine final prices, discounts, and fees.
    """
    
    def __init__(self, db_path: str = "sagex3_seed.db"):
        """
        Initialize the pricing engine with database connection.
        
        Args:
            db_path: Path to the SQLite database containing Sage X3 data
        """
        self.db_path = db_path
        self.connection = sqlite3.connect(db_path)
        self.connection.row_factory = sqlite3.Row  # Enable column access by name
        
        # Cache for frequently accessed data
        self._structure_cache = {}
        self._rule_cache = {}
        
    def calculate_price(self, context: PricingContext) -> PricingResult:
        """
        Main entry point for price calculation. This method orchestrates the
        entire pricing process following Sage X3's logic.
        
        Args:
            context: All contextual information needed for pricing
            
        Returns:
            Complete pricing result with all applied rules and calculations
        """
        logger.info(f"Starting price calculation for item {context.item_ref}")
        
        result = PricingResult()
        result.currency = context.currency
        result.unit_of_measure = context.unit_of_measure
        
        try:
            # Step 1: Get all applicable pricing rules, ordered by priority
            applicable_rules = self._get_applicable_pricing_rules(context)
            logger.info(f"Found {len(applicable_rules)} applicable pricing rules")
            
            # Step 2: Process each rule in priority order
            for rule in applicable_rules:
                logger.info(f"Processing rule: {rule['PLI_0']} (Priority: {rule['PIO_0']})")
                
                # Step 3: Find matching price list entries for this rule
                price_entries = self._find_matching_price_entries(context, rule)
                
                # Step 4: Apply the rule logic to calculate pricing components
                if price_entries:
                    self._apply_pricing_rule(context, rule, price_entries, result)
                    result.applied_rules.append(rule['PLI_0'])
                    
                    # For grouped pricing (PLITYP_0 = '2'), stop after first match
                    if rule.get('PLITYP_0') == '2':  # Grouped pricing
                        logger.info("Grouped pricing rule applied, stopping evaluation")
                        break
            
            # Step 5: Calculate final net price
            result.net_price = self._calculate_final_price(result)
            
            logger.info(f"Price calculation completed. Final price: {result.net_price} {result.currency}")
            return result
            
        except Exception as e:
            logger.error(f"Error in price calculation: {str(e)}")
            raise

    def _get_applicable_pricing_rules(self, context: PricingContext) -> List[Dict]:
        """
        Retrieves all pricing rules that could apply to the given context,
        ordered by priority and search group. This is crucial for ensuring
        the correct pricing hierarchy is followed.
        """
        cursor = self.connection.cursor()
        
        # Base query to get active pricing rules
        query = """
        SELECT conf.*, plist.*
        FROM SPRICCONF conf
        JOIN SPRICLIST plist ON conf.PLI_0 = plist.PLI_0
        WHERE conf.PLIENAFLG_0 = '2'  -- Active rules only
        AND plist.PLISTRDAT_0 <= ?     -- Start date check
        AND plist.PLIENDDAT_0 >= ?     -- End date check
        ORDER BY conf.PLISEA_0 ASC,    -- Search group
                 conf.PIO_0 ASC         -- Priority
        """
        
        current_date = context.transaction_date.strftime('%Y-%m-%d 00:00:00')
        cursor.execute(query, (current_date, current_date))
        
        rules = [dict(row) for row in cursor.fetchall()]
        
        # Filter rules based on context criteria
        filtered_rules = []
        for rule in rules:
            if self._rule_matches_context(context, rule):
                filtered_rules.append(rule)
        
        return filtered_rules

    def _rule_matches_context(self, context: PricingContext, rule: Dict) -> bool:
        """
        Determines if a pricing rule is applicable to the given context.
        This involves checking various criteria like customer type, item category, etc.
        """
        # Check customer applicability
        customer_type = rule.get('PLIBPRCNR_0', '1')  # Default to "All customers"
        if customer_type == '2':  # Group customers only
            # Would need to check if customer is in the specific group
            # This is a simplified check - in reality you'd query customer groups
            pass
        elif customer_type == '3':  # Exclude group customers
            # Similar logic for exclusion
            pass
        
        # Check currency matching if specified
        rule_currency = rule.get('CUR_0', '').strip()
        if rule_currency and rule_currency != context.currency:
            return False
        
        # Check unit of measure matching if specified
        rule_uom = rule.get('UOM_0', '').strip()
        if rule_uom and rule_uom != context.unit_of_measure:
            return False
        
        # Check quantity ranges
        min_qty = Decimal(rule.get('MINQTY_0', 0))
        max_qty = Decimal(rule.get('MAXQTY_0', 0))
        
        if min_qty > 0 and context.quantity < min_qty:
            return False
        if max_qty > 0 and context.quantity > max_qty:
            return False
        
        return True

    def _find_matching_price_entries(self, context: PricingContext, rule: Dict) -> List[Dict]:
        """
        Finds specific price list entries that match the context and rule criteria.
        This is where the detailed criteria matching happens (item codes, customer codes, etc.)
        """
        cursor = self.connection.cursor()
        
        # Build dynamic query based on rule criteria
        query_parts = ["SELECT * FROM SPRICLIST WHERE PLI_0 = ?"]
        query_params = [rule['PLI_0']]
        
        # Add date range filter
        query_parts.append("AND PLISTRDAT_0 <= ? AND PLIENDDAT_0 >= ?")
        current_date = context.transaction_date.strftime('%Y-%m-%d 00:00:00')
        query_params.extend([current_date, current_date])
        
        # Add quantity range filter
        query_parts.append("AND (MINQTY_0 = 0 OR MINQTY_0 <= ?)")
        query_parts.append("AND (MAXQTY_0 = 0 OR MAXQTY_0 >= ?)")
        query_params.extend([float(context.quantity), float(context.quantity)])
        
        # Add criteria-specific filters based on rule configuration
        criteria_match = self._build_criteria_filters(context, rule)
        if criteria_match:
            query_parts.append(f"AND {criteria_match['where_clause']}")
            query_params.extend(criteria_match['params'])
        
        # Order by specificity (more specific criteria first)
        query_parts.append("ORDER BY PLILIN_0 ASC")
        
        full_query = " ".join(query_parts)
        cursor.execute(full_query, query_params)
        
        return [dict(row) for row in cursor.fetchall()]

    def _build_criteria_filters(self, context: PricingContext, rule: Dict) -> Optional[Dict]:
        """
        Builds SQL filter conditions based on the rule's defined criteria.
        This handles the complex logic of matching context values against
        the criteria patterns stored in PLICRI fields.
        """
        # The PLICRI_0 field contains the criteria pattern (e.g., "BMS003~~~~~")
        criteria_pattern = rule.get('PLICRI_0', '').strip()
        
        if not criteria_pattern:
            return None
        
        # Parse the criteria pattern - this is simplified
        # In reality, you'd need to parse based on the rule's field definitions
        # For now, assume it's an item code pattern
        if criteria_pattern.replace('~', '').strip():  # Has actual criteria
            item_pattern = criteria_pattern.split('~')[0]
            if item_pattern:
                return {
                    'where_clause': 'PLICRI1_0 = ?',
                    'params': [item_pattern]
                }
        
        return None

    def _apply_pricing_rule(self, context: PricingContext, rule: Dict, 
                          price_entries: List[Dict], result: PricingResult):
        """
        Applies a specific pricing rule to calculate price components.
        This handles different pricing methods (direct price, coefficient, formula).
        """
        if not price_entries:
            return
        
        # Take the most specific entry (first one due to ordering)
        price_entry = price_entries[0]
        
        # Apply base price calculation
        pricing_method = rule.get('PRIPRO_0', '2')  # Default to "Value"
        
        if pricing_method == '2':  # Direct value
            base_price = Decimal(str(price_entry.get('PRI_0', 0)))
            result.base_price = max(result.base_price, base_price)
            
        elif pricing_method == '3':  # Coefficient
            # This would require looking up the base price field and applying coefficient
            coefficient = Decimal(str(price_entry.get('PRI_0', 1)))
            base_price_field = rule.get('PRIFLD_0', '')
            if base_price_field:
                base_value = self._get_base_price_value(context, base_price_field)
                calculated_price = base_value * coefficient
                result.base_price = max(result.base_price, calculated_price)
                
        elif pricing_method == '4':  # Formula calculation
            # This would involve parsing and evaluating the formula
            formula = rule.get('PRIFLD_0', '')
            if formula:
                calculated_price = self._evaluate_pricing_formula(context, formula)
                result.base_price = max(result.base_price, calculated_price)
        
        # Apply discounts and fees from the price structure
        self._apply_discounts_and_fees(price_entry, result)
        
        # Set pricing reason
        if price_entry.get('SPREASON_0'):
            result.pricing_reason = price_entry.get('SPREASON_0')
        
        # Apply commission coefficient
        commission_coef = Decimal(str(price_entry.get('COMCOE_0', 1)))
        if commission_coef != 1:
            result.commission_coefficient = commission_coef

    def _get_base_price_value(self, context: PricingContext, field_reference: str) -> Decimal:
        """
        Retrieves a base price value from item master data for coefficient calculations.
        Field reference format: [F:TABLE]FIELD (e.g., [F:ITS]BASPRI)
        """
        # Parse the field reference
        # This is a simplified parser - full implementation would handle all table types
        if '[F:ITS]' in field_reference:
            field_name = field_reference.replace('[F:ITS]', '')
            cursor = self.connection.cursor()
            cursor.execute(f"SELECT {field_name} FROM ITMMASTER WHERE ITMREF_0 = ?", 
                         (context.item_ref,))
            result = cursor.fetchone()
            if result:
                return Decimal(str(result[0] or 0))
        
        return Decimal('0')

    def _evaluate_pricing_formula(self, context: PricingContext, formula: str) -> Decimal:
        """
        Evaluates a pricing formula. This is a simplified implementation.
        A full implementation would need a proper expression parser.
        """
        # For demonstration, return a default value
        # Real implementation would parse and evaluate the formula
        logger.warning(f"Formula evaluation not fully implemented: {formula}")
        return Decimal('0')

    def _apply_discounts_and_fees(self, price_entry: Dict, result: PricingResult):
        """
        Applies discount and fee values from the price entry to the result.
        This handles the various DCGVAL fields that represent different discount/fee columns.
        """
        # Process discount/fee columns (DCGVAL_0 through DCGVAL_8)
        for i in range(9):
            discount_field = f'DCGVAL_{i}'
            discount_value = Decimal(str(price_entry.get(discount_field, 0)))
            
            if discount_value != 0:
                # You would need to correlate this with the price structure
                # to determine if it's a discount or fee and its description
                discount_info = {
                    'column': i,
                    'value': discount_value,
                    'type': 'discount' if discount_value > 0 else 'fee'
                }
                
                if discount_value > 0:
                    result.discounts.append(discount_info)
                else:
                    result.fees.append(discount_info)

    def _calculate_final_price(self, result: PricingResult) -> Decimal:
        """
        Calculates the final net price by applying all discounts and fees
        to the base price.
        """
        net_price = result.base_price
        
        # Apply discounts (reduce price)
        for discount in result.discounts:
            if discount['value'] > 0:  # Percentage discount
                if discount['value'] <= 100:  # Assume percentage if <= 100
                    net_price = net_price * (Decimal('100') - discount['value']) / Decimal('100')
                else:  # Fixed amount discount
                    net_price = max(Decimal('0'), net_price - discount['value'])
        
        # Apply fees (increase price)
        for fee in result.fees:
            net_price += abs(fee['value'])
        
        return net_price.quantize(Decimal('0.01'))  # Round to 2 decimal places

    def get_pricing_debug_info(self, context: PricingContext) -> Dict:
        """
        Returns detailed debugging information about the pricing calculation.
        Useful for understanding why certain prices were applied.
        """
        debug_info = {
            'context': context.__dict__,
            'applicable_rules': [],
            'rule_evaluation': [],
            'final_calculation_steps': []
        }
        
        # Get applicable rules
        rules = self._get_applicable_pricing_rules(context)
        debug_info['applicable_rules'] = [
            {
                'rule_code': rule['PLI_0'],
                'priority': rule['PIO_0'],
                'type': rule.get('PLITYP_0'),
                'search_group': rule.get('PLISEA_0')
            } for rule in rules
        ]
        
        return debug_info

    def __del__(self):
        """Clean up database connection."""
        if hasattr(self, 'connection'):
            self.connection.close()


# Example usage and testing
if __name__ == "__main__":
    # Initialize the pricing engine
    engine = SageX3PricingEngine("sagex3_seed.db")
    
    # Create a pricing context for testing
    context = PricingContext(
        item_ref="BMS003",
        customer_code="FR001",
        site_code="MAIN",
        quantity=Decimal('150'),  # This should match the 101-200 range in your example
        currency="EUR",
        transaction_date=datetime.date(2025, 8, 15)  # Within the date range
    )
    
    print("=== Sage X3 Pricing Engine Demo ===")
    print(f"Calculating price for item: {context.item_ref}")
    print(f"Quantity: {context.quantity}")
    print(f"Customer: {context.customer_code}")
    print(f"Date: {context.transaction_date}")
    print()
    
    try:
        # Calculate the price
        result = engine.calculate_price(context)
        
        print("=== Pricing Result ===")
        print(f"Base Price: {result.base_price} {result.currency}")
        print(f"Net Price: {result.net_price} {result.currency}")
        print(f"Applied Rules: {', '.join(result.applied_rules)}")
        
        if result.discounts:
            print(f"Discounts Applied: {len(result.discounts)}")
            for i, discount in enumerate(result.discounts):
                print(f"  Discount {i+1}: {discount['value']}")
        
        if result.fees:
            print(f"Fees Applied: {len(result.fees)}")
            for i, fee in enumerate(result.fees):
                print(f"  Fee {i+1}: {fee['value']}")
        
        if result.commission_coefficient != Decimal('1'):
            print(f"Commission Coefficient: {result.commission_coefficient}")
        
        print()
        
        # Show debug information
        debug_info = engine.get_pricing_debug_info(context)
        print("=== Debug Information ===")
        print(f"Number of applicable rules found: {len(debug_info['applicable_rules'])}")
        for rule_info in debug_info['applicable_rules']:
            print(f"  Rule: {rule_info['rule_code']} (Priority: {rule_info['priority']})")
        
    except Exception as e:
        print(f"Error calculating price: {str(e)}")
        import traceback
        traceback.print_exc()