1) Web Order of Prepared Meal with Card (State+County+City Tax)
Preconditions
- Customer is logged in on the website.
- Menu is published and items in stock.
Main Flow
1) Customer adds a hot entrée and a drink to cart.
2) System displays item prices and estimated taxes (state+county+city).
3) Customer selects delivery location and ASAP time.
4) Customer chooses card payment and enters CVV.
5) System authorizes card and confirms payment.
6) System creates order with status “Accepted” and sends confirmation.
Subflows
- Address validation: System standardizes delivery address and confirms building.
Alternative Flows
- Card declined: Payment authorization fails; system prompts for another method; order not created.
- Location unserviceable: Address outside delivery zone; system blocks checkout.

2) Mobile EBT Order of Grocery Staples (State-Only, Tax-Exempt)
Preconditions
- Customer is logged in on the mobile app with EBT card added.
- Cart contains only EBT-eligible grocery staples.
Main Flow
1) Customer adds bread, milk, and rice to cart.
2) System flags all items as EBT-eligible and shows $0 tax (state-only rules).
3) Customer selects delivery location and window.
4) Customer chooses EBT payment and enters PIN if required.
5) System performs balance check and authorizes EBT purchase.
6) System confirms order and issues receipt with $0 tax line.
Subflows
- EBT eligibility check: System verifies each SKU’s SNAP eligibility.
Alternative Flows
- Ineligible item detected: System blocks checkout and highlights ineligible item.
- Insufficient EBT balance: System declines EBT; customer may switch to card or edit cart.

3) Mobile Order with Dietary Supplements (Card)
Preconditions
- Customer is logged in on the mobile app.
- Supplements in stock; age-restriction policy not applicable.
Main Flow
1) Customer adds a vitamin supplement to cart.
2) System displays supplement tax rate and item warnings.
3) Customer selects delivery location and time.
4) Customer pays by card.
5) System authorizes card and creates order.
6) System sends confirmation with tax breakdown.
Subflows
- Warning acknowledgment: Customer acknowledges supplement labeling and usage warning.
Alternative Flows
- Supplement out of stock: System blocks checkout; suggests similar items.

4) Promotions at Checkout (Coupon or First-Order Discount)
Preconditions
- Customer is logged in with items in cart.
- Either a valid coupon exists or customer qualifies for first-order promo.
Main Flow
1) Customer opens checkout; system auto-detects first-order eligibility and/or accepts coupon entry.
2) System validates promo (eligibility, expiration, usage limits).
3) System applies discount and updates totals.
4) Customer completes payment by card.
5) System confirms order with discount itemization on receipt.
Subflows
- Promo validation: Check code rules, stacking policy, and item/category eligibility.
- Identity verification (first order): System sends and confirms email before discount applies.
Alternative Flows
- Invalid/expired code or promo exhausted: System shows message; checkout continues without discount.
- Minimum not met: System indicates required amount; customer edits cart or proceeds without discount.

5) Modify or Cancel Order Before Preparation
Preconditions
- Customer is logged in (web or mobile).
- Order state is “Accepted,” not yet “In Prep.”
Main Flow
1) Customer opens active order and chooses Modify or Cancel.
2) If Modify: Customer adds/removes items or changes quantities.
3) System recalculates totals/taxes and presents delta to customer.
4) If Cancel: System shows refund summary (full reversal if eligible).
5) Customer confirms action.
6) System updates order and sends revised confirmation or cancellation notice.
Subflows
- Reauthorization: If total increases, system performs incremental card authorization.
- Refund processing: System submits void if same-day settlement open; otherwise standard refund.
Alternative Flows
- Order already in prep: System blocks change/cancel and shows cutoff message.
- Past cancellation window: System denies cancellation; provides support link.

6) Kitchen Fulfillment Through Delivery Completion
Preconditions
- Staff is logged into kitchen console and courier app as applicable.
- Order is assigned to the kitchen queue and paid/accepted.
Main Flow
1) Staff opens order ticket and taps “Start Prep” → status “In Prep.”
2) Staff prepares items; system decrements inventory as configured.
3) Staff taps “Ready” → status “Ready for Pickup/Delivery”; customer notified.
4) Courier taps “Pick Up” → status “Out for Delivery”; ETA sent to customer.
5) Courier arrives, confirms recipient, and taps “Delivered”; timestamp and geo recorded.
6) System sends delivery confirmation and receipt.
Subflows
- Temperature check: Staff records hot/cold hold temps before “Ready.”
- Contactless drop-off: Courier attaches photo proof before “Delivered.”
Alternative Flows
- Missing ingredient: Staff triggers substitution workflow; order updated based on customer choice.
- Recipient not present: Courier triggers delivery failure flow for reattempt/next steps.

7) Stock-Out Substitution Workflow
Preconditions
- Staff is logged in; an item on an in-prep order is unavailable.
Main Flow
1) Staff opens line item and selects “Propose Substitution.”
2) Staff chooses allowed substitutes and price difference rules.
3) System sends push notification to customer with choices.
4) Customer selects a substitute or declines.
5) System updates order, totals, payment, and prep instructions.
Subflows
- Price adjustment: Equal/lesser price auto-applies; if higher, system prompts for incremental authorization.
Alternative Flows
- No response in time window: System auto-removes item and updates receipt.
- Customer declines all: System removes item and offers partial refund or full cancel.

8) In-Route Delivery Changes and Failures
Preconditions
- Order status is “Out for Delivery.”
- Customer is logged into the mobile app; courier is active on the route.
Main Flow
1) Customer requests address change or courier reports failed attempt.
2) For address change: System validates new address within service area and courier radius; shows any fees.
3) Customer confirms change; system updates route and ETA.
4) For failed attempt: System notifies customer and offers reattempt windows; customer selects a new time/location.
5) Courier completes delivery and marks “Delivered.”
Subflows
- Fee calculation: System applies reroute fee if distance/time exceeds threshold.
- Support escalation: If multiple failures, system offers call-back and flags incident.
Alternative Flows
- Outside service area: System denies change and offers support.
- Customer cancels after failure: System cancels undelivered items and issues refund minus reattempt fee if applicable.

9) Card-Based Post-Delivery Refunds and Returns
Preconditions
- Delivered order paid by card; within the refund/return window.
Main Flow
1) Customer opens order and selects “Report Issue/Return.”
2) For missing item: Customer selects line; system calculates pro-rated refund and submits reversal.
3) For sealed supplement return: Customer requests pickup; courier collects item; staff inspects seal.
4) System updates receipt and sends refund/return confirmation.
Subflows
- Evidence attachment: Customer uploads photo of delivered contents or issue.
- Restock intake: Staff scans acceptable returns back into inventory.
Alternative Flows
- Item found after report: Customer cancels request; system aborts refund if not settled.
- Seal broken on supplement: Staff rejects return; system notifies customer; no refund.

10) EBT Refund/Void for SNAP Item Removed
Preconditions
- Delivered EBT order includes a reported spoiled/damaged staple item.
- EBT refund policies apply.
Main Flow
1) Customer reports issue for an eligible staple.
2) Staff reviews and approves refund.
3) System initiates EBT credit for eligible amount.
4) System updates order ledger and notifies customer.
Subflows
- Eligibility recheck: System confirms refunded SKU is SNAP-eligible.
Alternative Flows
- Processor outage: System queues refund and notifies customer of delay.

11) Admin Adds Prepared Menu Item with Allergens
Preconditions
- Administrator is logged into the admin console.
- Recipes and allergen data available.
Main Flow
1) Admin clicks “Add Item” and selects “Prepared/Hot.”
2) Admin enters name, price, allergens, and dietary flags.
3) Admin sets tax category and availability windows.
4) Admin publishes the item.
5) System syncs item to web, mobile, and kiosk menus.
Subflows
- Image upload: Admin adds product photo.
Alternative Flows
- Missing allergen/dietary data: System blocks publish and prompts for completion.

12) Admin Updates Tax Categories and Jurisdictions
Preconditions
- Admin is logged into tax settings; current mappings exist.
Main Flow
1) Admin selects “Tax Categories.”
2) Admin sets “Grocery Staples” as state-only.
3) Admin sets “Prepared Food” as state+county+city.
4) Admin saves and publishes a new rule version.
5) System timestamps and applies rules to new orders.
Subflows
- Rule preview: Admin tests calculator on a sample basket.
Alternative Flows
- Validation error (overlaps/conflicts): System prevents publish and shows conflicts.

13) Soda Surcharge Calculation and Receipt Display
Preconditions
- City soda tax is enabled in rules.
- Customer is ordering a sugary beverage.
Main Flow
1) Customer adds a 20 oz soda to cart.
2) System calculates city soda surcharge per ounce.
3) System displays surcharge as a separate line item.
4) Customer pays by card and places order.
5) System records surcharge details on receipt.
Subflows
- Size change: Customer switches size; system recalculates surcharge.
Alternative Flows
- Non-sugary beverage: System removes surcharge line automatically.

14) Admin Configures Soda Surcharge
Preconditions
- Administrator has tax configuration access.
- City soda tax rate published.
Main Flow
1) Admin navigates to tax rules and creates a surcharge rule.
2) Admin specifies rate per ounce and maps to beverage categories.
3) Admin sets jurisdiction boundaries and effective dates.
4) System validates against existing rules and activates surcharge.
5) System updates affected item calculations.
Subflows
- Exemption list: Admin excludes diet/zero-sugar variants.
Alternative Flows
- Overlapping surcharge exists: System prevents duplicate.
- Invalid rate format: System requires correction.

15) Cross-Jurisdiction Tax Selection by Delivery Location
Preconditions
- Delivery area spans multiple local jurisdictions with different taxes.
- Customer is logged in on mobile app or web.
Main Flow
1) Customer builds a mixed cart (e.g., hot sandwich + chips).
2) Customer enters a delivery address.
3) System geocodes address and selects applicable jurisdiction tax profile(s).
4) System displays updated, itemized tax breakdown.
5) Customer pays and submits order.
Subflows
- Geofencing: System resolves address to jurisdiction boundaries at checkout.
Alternative Flows
- Ambiguous address: System prompts for building/unit to disambiguate.

16) State Tax Holiday Exemption on Grocery Staples
Preconditions
- State tax holiday window is active and configured.
- Customer is ordering staple items online or via app.
Main Flow
1) Customer adds qualifying staples to cart.
2) System recognizes state tax holiday for eligible categories.
3) System sets sales tax to $0 for those lines.
4) Customer places order; receipt shows holiday exemption note and rule version.
Subflows
- Mixed cart handling: System taxes non-holiday items normally.
Alternative Flows
- Holiday ended during session: System refreshes rates and informs customer of tax change before payment.

17) Admin Manual Tax Override on an Order
Preconditions
- Admin is logged in with override permissions.
- An order has incorrect tax due to misclassification or exception.
Main Flow
1) Admin opens the order ledger entry and selects “Adjust Tax.”
2) Admin inputs corrected tax amount and justification.
3) System recalculates totals and posts the adjustment.
4) System records audit entry with user, time, and reason.
5) System issues adjusted receipt to the customer.
Subflows
- Exemption application: Admin applies full tax removal for a special case when authorized.
Alternative Flows
- No permission or limit exceeded: System blocks override or requests higher approval.

18) Admin Runs Tax Audit Report
Preconditions
- Admin has reporting permissions.
- Orders exist for the selected date range.
Main Flow
1) Admin selects “Tax Audit” report and sets date range/jurisdictions.
2) System compiles item-level taxes, surcharges, and rule versions.
3) Admin reviews summary and exceptions list.
4) Admin exports CSV; system logs report generation.
Subflows
- Exception drilldown: Admin opens an exception order to view calculation details.
Alternative Flows
- No data: System returns empty report with notice.

19) Admin Reviews Delivery Logs and Corrects Timestamp
Preconditions
- Admin has access to delivery audit tools.
- A delivery shows inconsistent GPS/timestamp data.
Main Flow
1) Admin opens delivery audit screen.
2) Admin reviews courier GPS trail and event times.
3) Admin edits “Delivered” timestamp based on evidence.
4) System updates audit log and recalculates SLA metrics.
5) System notifies staff of correction.
Subflows
- Evidence attachment: Admin attaches photo/GPS snapshot to the correction.
Alternative Flows
- Insufficient evidence: System flags incident for investigation; no change applied.

20) Admin Sets Inventory Threshold; Auto-86 Item
Preconditions
- Admin is logged into inventory settings.
- Items have current stock counts.
Main Flow
1) Admin sets threshold for a hot entrée to 5.
2) System enables auto-86 when count hits 0.
3) Staff marks prepared quantities; inventory decrements in real time.
4) When stock reaches 0, system unpublishes item from menus.
5) Customers see “Sold Out” and cannot add the item.
Subflows
- Replenish stock: Staff updates stock; system republishes item automatically.
Alternative Flows
- Sync failure: System displays warning to staff; manual publish control remains available.

21) Kiosk Quick Order and Pickup (Card)
Preconditions
- Kiosk is online and authenticated to store.
- Card reader operational.
Main Flow
1) Customer selects “Guest Order” on kiosk.
2) Customer chooses a hot deli combo.
3) System shows price with tax.
4) Customer taps/inserts card to pay.
5) System authorizes payment and prints ticket number.
6) Staff prepares order and calls number for pickup.
Subflows
- Receipt email: Customer enters email for e-receipt.
Alternative Flows
- Card declined: Kiosk cancels transaction; no ticket printed.

22) Tip Add/Adjust After Delivery via Mobile
Preconditions
- Customer has a delivered order paid by card.
- Post-delivery tip window is open.
Main Flow
1) Customer opens delivered order in app.
2) Customer selects “Add/Adjust Tip” and chooses an amount.
3) System charges incremental tip to the original card.
4) System updates receipt and courier payout.
Subflows
- Tip presets: System displays preset percentages and custom field.
Alternative Flows
- Card no longer valid: System prompts for a new card; if declined, tip update fails.

23) Coupon Abuse Investigation and Make-Good Discount Override
Preconditions
- Admin is logged into promotions/support.
- Customer reports invalidated coupon; logs indicate potential abuse.
Main Flow
1) Admin reviews coupon usage logs for the customer.
2) Admin invalidates the customer’s coupon eligibility going forward.
3) Admin opens the affected order and applies a goodwill discount.
4) System posts adjustment, updates receipt, and records an audit log.
5) System notifies customer of resolution.
Subflows
- Flag account: System adds internal note for future promotions.
Alternative Flows
- No abuse found: Admin reinstates coupon eligibility; no override applied.

24) Staff Scheduling and Acknowledgment
Preconditions
- Admin is logged into scheduling.
- Staff users are active in the system.
Main Flow
1) Admin creates a lunch shift (e.g., 11:00–14:00) for kitchen and delivery roles.
2) Admin assigns staff to shifts and publishes.
3) System sends push notifications to assigned staff.
4) Staff open app and tap “Acknowledge.”
5) System records acknowledgments and highlights unacknowledged shifts.
Subflows
- Swap request: Staff requests swap; admin approves and reassigns.
Alternative Flows
- Overlapping shift: System blocks assignment and prompts resolution.

25) Allergen Cross-Contact Incident; Cancel and Refund
Preconditions
- Order includes allergen-sensitive instructions.
- Staff detects cross-contact risk during prep.
Main Flow
1) Staff flags order with “Allergen Risk.”
2) System pauses prep and notifies customer.
3) Customer chooses cancel or remake without allergen item.
4) Staff cancels on customer request.
5) System issues full refund and sends apology notice.
Subflows
- Remake path: If customer selects remake, system updates ticket and restarts prep.
Alternative Flows
- No customer response: System auto-cancels after policy window and refunds.

26) Split Payment EBT + Card for Mixed Cart
Preconditions
- Customer is logged in with EBT card on file.
- Cart contains both EBT-eligible staples and ineligible hot/prepared items.
Main Flow
1) Customer proceeds to checkout.
2) System splits cart into EBT-eligible and ineligible totals.
3) Customer authorizes EBT for eligible subtotal.
4) Customer pays remaining balance by card.
5) System creates one order with two payment records and sends itemized receipt.
Subflows
- Eligibility display: System labels eligible lines before payment.
Alternative Flows
- EBT authorization fails: Customer may pay full amount by card or remove ineligible items.

27) Admin Updates Menu Pricing
Preconditions
- Administrator has menu management permissions.
- No active prep on affected items.
Main Flow
1) Admin selects menu category and item.
2) Admin updates base price and sets effective date/time.
3) System validates pricing rules and constraints.
4) Admin confirms changes; system logs price change for audit.
Subflows
- Bulk update: Admin applies percentage change to multiple items.
Alternative Flows
- Price violates min/max constraints: System rejects update.
- Effective date conflicts: System prompts for resolution.

28) Customer Schedules Future Delivery
Preconditions
- Customer logged in; scheduling enabled for location.
Main Flow
1) Customer selects “Schedule Order.”
2) Customer chooses delivery date and time window.
3) System confirms slot availability and holds payment authorization.
4) Customer completes order details and receives confirmation.
5) System triggers preparation and delivery workflow at scheduled time.
Subflows
- Recurring order: Customer sets weekly schedule.
Alternative Flows
- Time slot full: System suggests alternatives.
- Item discontinued before date: System notifies customer to edit or cancel.

29) Staff Updates Preparation Time (Delay Management)
Preconditions
- Order is “In Prep.”
- Delay is identified.
Main Flow
1) Staff opens order details and adjusts estimated ready time.
2) Staff selects delay reason.
3) System recalculates delivery ETA and notifies customer.
4) Customer sees updated timeline; staff continues preparation.
Subflows
- Batch delay: Staff applies delay to multiple affected orders.
Alternative Flows
- Delay exceeds threshold: System offers cancellation to customer.
- Customer rejects delay: Order cancelled with refund per policy.

30) Customer Provides Delivery Instructions
Preconditions
- Customer placing an order.
- Delivery address selected.
Main Flow
1) Customer opens delivery details and selects “Add Instructions.”
2) Customer enters directions, gate code, and contact preferences.
3) System attaches instructions to the order.
4) Delivery staff view and follow instructions.
Subflows
- Saved instructions: Customer reuses instructions from profile.
Alternative Flows
- Instructions exceed length or contain restricted content: System truncates or flags for review.