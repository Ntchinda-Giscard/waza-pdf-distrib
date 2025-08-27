from dataclasses import dataclass
import json
from typing import Optional
from datetime import datetime
from sqlite_conn import sqlite_connection


criteria = {
    "ITMMASTER": "Articles",
    "ITMSALES": "Article - Ventes",
    "ITMFACILIT": "Article - Sites",
    "BPARTNER": "Bornes Tiers",
    "BPCUSTOMER": "Clients",
    "BPCUSTMVT": "Mouvements clients",
    "BPDLVCUST": "Clients livrés",
    "SALESREP": "Représentants",
    "SPRICLINK": "Éléments d'en-tête et de pied de document"
}



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
        AND (? BETWEEN PLISTRDAT_0 AND PLIENDDAT_0)
                       AND PLIENAFLG_0 = 2
                       ORDER BY PIO_0
        """, (
            f"{context.product_code}~%",    # start
        f"%~{context.product_code}~%",  # middle
        f"%~{context.product_code}",    # end
        context.order_date.isoformat()  # safely passed as param
    ))

        results = cursor.fetchall()
        for i in results:
            print(dict(i))
            break
        

        return results

def returns_active_criteria(criterias):
    non_null_criteria = ()
    for criteria in criterias:
        if criteria is not None:
            non_null_criteria += (criteria,)

    return non_null_criteria



def calculate_price(context: PosPricingContext):
    pricings = find_pricing(context)
    price = 0
 
    # criteria tables
    for pricing in pricings:
        # print(pricing["PRIQTYFLG_0"])
        
        if pricing["PRIQTYFLG_0"] == "1":
            price = pricing["PRI_0"]
            # has no quantity range
        if pricing["PRIQTYFLG_0"] == "2":
            if context.quantity >= float(pricing["MINQTY_0"]) and context.quantity < float(pricing["MAXQTY_0"]):
                # Extract criteria tables and fields
                print("pricing", pricing["PLICRI_0"])
                pricing_tables = []
                pricing_tables.append(pricing["FIL_0"].strip())
                pricing_tables.append(pricing["FIL_1"].strip())
                pricing_tables.append(pricing["FIL_2"].strip())
                pricing_tables.append(pricing["FIL_3"].strip())
                pricing_tables.append(pricing["FIL_4"].strip())
                pricing_fields = []
                pricing_fields.append(pricing["FLD_0"].strip())
                pricing_fields.append(pricing["FLD_1"].strip())
                pricing_fields.append(pricing["FLD_2"].strip())
                pricing_fields.append(pricing["FLD_3"].strip())
                pricing_fields.append(pricing["FLD_4"].strip())
                print("pricing_tables", pricing_tables)
                tables = [i for i in pricing_tables if len(i) > 0]
                fields = [i for i in pricing_fields if len(i) > 0]
                print("tables", tables)
                print("fields", fields)

                # In Sage X3 database exports, column names usually have "_0"
                fields = [f"{fld}_0" for fld in fields]

                # Build SELECT clause
                select_fields = ", ".join(fields) if fields else "*"

                # Build FROM clause
                from_tables = ", ".join(tables)

                sql = f"SELECT {select_fields} FROM {from_tables} WHERE {select_fields} = {context.product_code} "

                with sqlite_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute(sql)
                    rows = cursor.fetchone()
                    print(len(rows))

                if pricing["PRIPRO_0"] == 0:
                    price = 0
                elif pricing["PRIPRO_0"] == 1:
                    price = pricing["PRI_0"]
                elif pricing["PRIPRO_0"] == 2:
                    price = (pricing["PRI_0"]/pricing["PRIDIV_0"]) * context.quantity
                elif pricing["PRIPRO_0"] == 3:
                    price = (pricing["PRI_0"])





if __name__ == "__main__":
    calculate_price(context)
    