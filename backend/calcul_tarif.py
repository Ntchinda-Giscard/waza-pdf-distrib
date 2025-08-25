from dataclasses import dataclass
import json
from typing import Optional
from datetime import datetime
from sqlite_conn import sqlite_connection

@dataclass
class PosPricingContext:
    """ Pricing context for the POS """
    product_code: str
    quantity: float
    customer_code: str
    order_date: Optional[datetime] = None

context = PosPricingContext(
    product_code="BMS003",
    quantity=2,
    customer_code="FR001",
    order_date=datetime.now()
)


def find_pricing(context: PosPricingContext):

    with sqlite_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT *
            FROM SPRICLIST
            JOIN SPRICCONF ON SPRICLIST.PLI_0 = SPRICCONF.PLI_0
                       WHERE (
            PLICRI_0 LIKE ?
            OR PLICRI_0 LIKE ?
            OR PLICRI_0 LIKE ?
        )
                       AND PLIENAFLG_0 = 2
                       ORDER BY PIO_0
        """, (
            f"{context.product_code}~%",    # start
        f"%~{context.product_code}~%",  # middle
        f"%~{context.product_code}",    # end
    ))

        results = cursor.fetchall()
        # return results
        for row in results:
            print(dict(row))

if __name__ == "__main__":
    find_pricing(context)
    