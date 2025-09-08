## Gap Analysis of 1a1 Use Cases

Issue | Evidence (quote/line from materials) | Impact | Fix (new UC title or change)
--|--|--|--
Missing core ordering functionality | "Customers place orders online/mobile" and "Menu browsing, cart, checkout, payment, receipt" | Critical - no use case covers basic order placement flow | Add UC: Place Order
Missing order tracking | "tracks delivery" and "Order lifecycle: placed → accepted → in prep → ready → out for delivery → delivered" | High - customers cannot track order status | Add UC: Track Order Status
Missing refund process | "requests refunds" and "system supports refunds and audits" | High - no mechanism for handling refunds | Add UC: Request Refund
Missing staff order fulfillment | "Staff: views assigned orders, prepares items, marks ready/out-for-delivery/delivered" | Critical - staff cannot process orders | Add UC: Staff Order Fulfillment
Missing menu management | "Administrator: manages menu (items, options, prices)" and "Admin can modify menu/pricing/rules" | High - admins cannot manage menu | Add UC: Admin Menu Management
Missing inventory management | "Inventory updates on preparation; stock-outs trigger alternatives or delays" and "reports stock issues" | High - no inventory tracking mechanism | Add UC: Inventory Management
Missing tax calculation | "Tax calculation per item category and jurisdiction" with multiple specific rules | High - orders cannot calculate proper taxes | Add UC: Tax Calculation
UC3 incomplete allergen handling | "Health/dietary compliance: allergens, prepared/hot vs staple, labeling" | Medium - missing dietary restrictions beyond allergens | UC3: Expand to include all dietary flags
UC5 missing delivery confirmation | "out for delivery → delivered" | Medium - handoff confirmation doesn't cover delivery | UC5: Add delivery confirmation flow
UC8 missing tax-based pricing | "Local Surcharges: e.g., city soda tax per ounce" and "Tax Holidays" | Medium - dynamic pricing doesn't handle tax variations | UC8: Include tax-based price adjustments