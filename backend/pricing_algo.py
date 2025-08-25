"""
ERP Pricing Algorithm Implementation
Supports multiple pricing strategies commonly found in ERP systems like Sage X3
"""

from datetime import datetime, date
from typing import Dict, List, Optional, Union, Tuple
from dataclasses import dataclass
from enum import Enum
import math


class PriceType(Enum):
    BASE = "base"
    CUSTOMER_SPECIFIC = "customer_specific"
    QUANTITY_BREAK = "quantity_break"
    PROMOTIONAL = "promotional"
    CONTRACT = "contract"


class DiscountType(Enum):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    TIERED = "tiered"


@dataclass
class PriceRule:
    """Represents a pricing rule with conditions and pricing logic"""
    rule_id: str
    product_code: str
    price_type: PriceType
    base_price: float
    currency: str = "EUR"
    min_quantity: float = 1.0
    max_quantity: Optional[float] = None
    customer_group: Optional[str] = None
    customer_code: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    priority: int = 0  # Higher number = higher priority


@dataclass
class DiscountRule:
    """Represents a discount rule"""
    rule_id: str
    discount_type: DiscountType
    value: float  # Percentage (0-100) or fixed amount
    min_quantity: float = 1.0
    max_quantity: Optional[float] = None
    customer_group: Optional[str] = None
    product_category: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None


@dataclass
class Customer:
    """Customer information for pricing"""
    customer_code: str
    customer_group: str
    price_category: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[float] = None


@dataclass
class Product:
    """Product information for pricing"""
    product_code: str
    category: str
    base_price: float
    unit_of_measure: str
    cost_price: Optional[float] = None


@dataclass
class PricingContext:
    """Context for pricing calculation"""
    product: Product
    customer: Customer
    quantity: float
    order_date: date
    currency: str = "EUR"
    warehouse: Optional[str] = None


@dataclass
class PricingResult:
    """Result of pricing calculation"""
    unit_price: float
    total_price: float
    base_price: float
    discounts_applied: List[Dict]
    price_rule_used: Optional[str] = None
    currency: str = "EUR"


class PricingEngine:
    """Main pricing engine implementing ERP pricing logic"""
    
    def __init__(self):
        self.price_rules: List[PriceRule] = []
        self.discount_rules: List[DiscountRule] = []
    
    def add_price_rule(self, rule: PriceRule):
        """Add a pricing rule"""
        self.price_rules.append(rule)
        # Sort by priority (descending)
        self.price_rules.sort(key=lambda x: x.priority, reverse=True)
    
    def add_discount_rule(self, rule: DiscountRule):
        """Add a discount rule"""
        self.discount_rules.append(rule)
    
    def calculate_price(self, context: PricingContext) -> PricingResult:
        """
        Calculate price based on context and rules
        Main pricing algorithm implementation
        """
        # Step 1: Find applicable price rule
        applicable_rule = self._find_applicable_price_rule(context)
        
        # Step 2: Get base price
        if applicable_rule:
            base_price = applicable_rule.base_price
            price_rule_id = applicable_rule.rule_id
        else:
            base_price = context.product.base_price
            price_rule_id = None
        
        # Step 3: Apply quantity breaks
        unit_price = self._apply_quantity_breaks(base_price, context)
        
        # Step 4: Apply discounts
        final_price, discounts = self._apply_discounts(unit_price, context)
        
        # Step 5: Calculate total
        total_price = final_price * context.quantity
        
        return PricingResult(
            unit_price=final_price,
            total_price=total_price,
            base_price=base_price,
            discounts_applied=discounts,
            price_rule_used=price_rule_id,
            currency=context.currency
        )
    
    def _find_applicable_price_rule(self, context: PricingContext) -> Optional[PriceRule]:
        """Find the most applicable price rule based on priority and conditions"""
        current_date = context.order_date
        
        for rule in self.price_rules:
            # Check product match
            if rule.product_code != context.product.product_code:
                continue
            
            # Check quantity range
            if context.quantity < rule.min_quantity:
                continue
            if rule.max_quantity and context.quantity > rule.max_quantity:
                continue
            
            # Check customer conditions
            if rule.customer_code and rule.customer_code != context.customer.customer_code:
                continue
            if rule.customer_group and rule.customer_group != context.customer.customer_group:
                continue
            
            # Check date validity
            if rule.valid_from and current_date < rule.valid_from:
                continue
            if rule.valid_to and current_date > rule.valid_to:
                continue
            
            # Rule matches all conditions
            return rule
        
        return None
    
    def _apply_quantity_breaks(self, base_price: float, context: PricingContext) -> float:
        """Apply quantity-based pricing breaks"""
        # Find quantity break rules for this product
        quantity_rules = [
            rule for rule in self.price_rules 
            if (rule.product_code == context.product.product_code and 
                rule.price_type == PriceType.QUANTITY_BREAK and
                rule.min_quantity <= context.quantity)
        ]
        
        if not quantity_rules:
            return base_price
        
        # Get the rule with highest minimum quantity that still applies
        applicable_rule = max(quantity_rules, key=lambda x: x.min_quantity)
        
        return applicable_rule.base_price
    
    def _apply_discounts(self, unit_price: float, context: PricingContext) -> Tuple[float, List[Dict]]:
        """Apply all applicable discount rules"""
        current_price = unit_price
        discounts_applied = []
        current_date = context.order_date
        
        for discount_rule in self.discount_rules:
            # Check if discount applies
            if not self._discount_applies(discount_rule, context, current_date):
                continue
            
            # Calculate discount amount
            if discount_rule.discount_type == DiscountType.PERCENTAGE:
                discount_amount = current_price * (discount_rule.value / 100)
            elif discount_rule.discount_type == DiscountType.FIXED_AMOUNT:
                discount_amount = discount_rule.value
            else:  # TIERED - implement custom logic
                discount_amount = self._calculate_tiered_discount(
                    discount_rule, current_price, context
                )
            
            # Apply discount
            current_price = max(0, current_price - discount_amount)
            
            discounts_applied.append({
                'rule_id': discount_rule.rule_id,
                'type': discount_rule.discount_type.value,
                'value': discount_rule.value,
                'discount_amount': discount_amount
            })
        
        return current_price, discounts_applied
    
    def _discount_applies(self, rule: DiscountRule, context: PricingContext, current_date: date) -> bool:
        """Check if a discount rule applies to the current context"""
        # Check quantity range
        if context.quantity < rule.min_quantity:
            return False
        if rule.max_quantity and context.quantity > rule.max_quantity:
            return False
        
        # Check customer group
        if rule.customer_group and rule.customer_group != context.customer.customer_group:
            return False
        
        # Check product category
        if rule.product_category and rule.product_category != context.product.category:
            return False
        
        # Check date validity
        if rule.valid_from and current_date < rule.valid_from:
            return False
        if rule.valid_to and current_date > rule.valid_to:
            return False
        
        return True
    
    def _calculate_tiered_discount(self, rule: DiscountRule, price: float, context: PricingContext) -> float:
        """Calculate tiered discount based on quantity or amount"""
        # Example tiered discount logic
        quantity = context.quantity
        
        if quantity >= 100:
            return price * 0.15  # 15% for 100+
        elif quantity >= 50:
            return price * 0.10  # 10% for 50-99
        elif quantity >= 20:
            return price * 0.05  # 5% for 20-49
        else:
            return 0  # No discount for < 20


# Example usage and test cases
def create_sample_data():
    """Create sample data for testing"""
    
    # Create pricing engine
    engine = PricingEngine()
    
    # Add price rules
    engine.add_price_rule(PriceRule(
        rule_id="RULE001",
        product_code="PROD001",
        price_type=PriceType.BASE,
        base_price=100.00,
        priority=1
    ))
    
    engine.add_price_rule(PriceRule(
        rule_id="RULE002",
        product_code="PROD001",
        price_type=PriceType.QUANTITY_BREAK,
        base_price=90.00,
        min_quantity=10.0,
        priority=2
    ))
    
    engine.add_price_rule(PriceRule(
        rule_id="RULE003",
        product_code="PROD001",
        price_type=PriceType.CUSTOMER_SPECIFIC,
        base_price=85.00,
        customer_code="CUST001",
        priority=3
    ))
    
    # Add discount rules
    engine.add_discount_rule(DiscountRule(
        rule_id="DISC001",
        discount_type=DiscountType.PERCENTAGE,
        value=5.0,  # 5% discount
        customer_group="VIP"
    ))
    
    engine.add_discount_rule(DiscountRule(
        rule_id="DISC002",
        discount_type=DiscountType.TIERED,
        value=0.0,  # Value handled in tiered logic
        min_quantity=20.0
    ))
    
    return engine


def test_pricing():
    """Test the pricing engine with sample data"""
    engine = create_sample_data()
    
    # Create test context
    product = Product(
        product_code="PROD001",
        category="ELECTRONICS",
        base_price=120.00,
        unit_of_measure="PC"
    )
    
    customer = Customer(
        customer_code="CUST001",
        customer_group="VIP"
    )
    
    context = PricingContext(
        product=product,
        customer=customer,
        quantity=25.0,
        order_date=date.today()
    )
    
    # Calculate price
    result = engine.calculate_price(context)
    
    print("Pricing Calculation Result:")
    print(f"Base Price: {result.base_price:.2f}")
    print(f"Unit Price: {result.unit_price:.2f}")
    print(f"Total Price: {result.total_price:.2f}")
    print(f"Price Rule Used: {result.price_rule_used}")
    print("Discounts Applied:")
    for discount in result.discounts_applied:
        print(f"  - {discount['rule_id']}: {discount['discount_amount']:.2f}")
    
    return result


if __name__ == "__main__":
    # Run test
    test_result = test_pricing()