# WolfCafe — Food Delivery System (Condensed Materials)

## Problem Overview
WolfCafe is a campus food delivery system. Customers place orders online/mobile; staff prepare and deliver; admins manage menus, pricing, and operations. Orders include items, prices, taxes, payment method, delivery location/time, and status tracking.

## Key Roles
- **Customer**: registers/logs in, browses menu, places/edits/cancels orders, pays, tracks delivery, requests refunds.
- **Staff**: views assigned orders, prepares items, marks ready/out-for-delivery/delivered, reports stock issues.
- **Administrator**: manages menu (items, options, prices), tax/health rules, inventory thresholds, staff schedules, reports/audits.

## Functional Scope
- Menu browsing, cart, checkout, payment, receipt.
- Order lifecycle: placed → accepted → in prep → ready → out for delivery → delivered → refund/return.
- Inventory updates on preparation; stock-outs trigger alternatives or delays.
- Delivery to campus locations; ETA tracking and notifications.
- Admin operations: CRUD menu, pricing, tax categories, health/dietary flags; reporting and audit.

## Constraints & Non-Functional
- Tax calculation per item category and jurisdiction; exemptions (e.g., SNAP/EBT items, tax holidays).
- Health/dietary compliance: allergens, prepared/hot vs staple, labeling.
- Peak load (lunch/dinner rush); reliability and auditability (receipts, rule versions, overrides).
- Data privacy and access control by role.

## Concrete Regulatory Examples (for use cases)
- **Prepared/Hot Food**: typically taxable; **Grocery Staples**: often non-taxable or reduced rate.
- **Dietary Supplements**: may be taxed differently from food.
- **SNAP/EBT**: eligible grocery items not taxed under EBT; hot/prepared items ineligible.
- **Local Surcharges**: e.g., city soda tax per ounce; itemized separately from sales tax.
- **Tax Holidays**: certain categories/date windows temporarily exempt.

## Done Criteria (operational)
- Users can register, log in, and place/track orders.
- Itemized receipt with tax breakdown; rule-version recorded.
- Staff can fulfill and mark deliveries; inventory updates recorded.
- Admin can modify menu/pricing/rules; system supports refunds and audits.