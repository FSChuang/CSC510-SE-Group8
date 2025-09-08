UC-01: Web Order of Prepared Meal with Card (State+County+City Tax)
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
- Address Validation: System standardizes delivery address and confirms campus building.
Alternative Flows
A1 (Card Declined): Payment authorization fails; system prompts for another payment method; order not created.
A2 (Location Unserviceable): Address is outside delivery zone; system blocks checkout.

UC-02: Mobile EBT Order of Grocery Staples (State-Only, Tax-Exempt)
Preconditions
- Customer is logged in on the mobile app with EBT card added.
- Cart contains only EBT-eligible grocery staples.
Main Flow
1) Customer adds bread, milk, and rice to cart.
2) System flags all items as EBT-eligible and shows $0 tax (state-only rules).
3) Customer selects delivery location and window.
4) Customer chooses EBT payment.
5) System performs EBT balance check and authorizes purchase.
6) System confirms order and issues receipt with $0 tax line.
Subflows
- EBT Eligibility Check: System verifies each SKU’s SNAP eligibility.
Alternative Flows
A1 (Ineligible Item Detected): System blocks checkout and highlights ineligible item; customer must remove it.
A2 (Insufficient EBT Balance): System declines EBT authorization; customer may switch to card or edit cart.

UC-03: Mobile Order with Dietary Supplements (Card)
Preconditions
- Customer is logged in on the mobile app.
- Supplements are in stock and age-restricted policy not applicable.
Main Flow
1) Customer adds vitamin D supplement to cart.
2) System displays tax at supplement rate and item warnings.
3) Customer selects delivery location and time.
4) Customer pays by card.
5) System authorizes card and creates order.
6) System sends confirmation with tax breakdown.
Subflows
- Warning Acknowledgment: Customer acknowledges supplement labeling and usage warning.
Alternative Flows
A1 (Supplement Out of Stock): System blocks checkout; suggests similar supplements.

UC-04: Online Coupon Applied at Checkout
Preconditions
- Customer is logged in on the website with items in cart.
- Active coupon code exists for eligible items.
Main Flow
1) Customer opens checkout and enters coupon code.
2) System validates code and eligible line items.
3) System applies discount and updates totals.
4) Customer completes payment by card.
5) System confirms order with discount itemization on receipt.
Subflows
- Promo Code Validation: System checks expiration, usage limit, and item/category eligibility.
Alternative Flows
A1 (Invalid/Expired Coupon): System rejects code; checkout continues without discount.

UC-05: Online Edit Order Before Preparation
Preconditions
- Customer is logged in on the website.
- Order is in “Accepted” state, not yet “In Prep.”
Main Flow
1) Customer opens order details.
2) Customer increases entrée quantity and removes dessert.
3) System recalculates totals and taxes.
4) Customer confirms changes.
5) System updates order and sends revised confirmation.
Subflows
- Reauthorization: If total increases, system performs incremental card authorization.
Alternative Flows
A1 (Order Already In Prep): System blocks edit and displays cutoff message.

UC-06: Mobile Cancel Order Before Preparation
Preconditions
- Customer is logged in on the mobile app.
- Order state is “Accepted,” not “In Prep.”
Main Flow
1) Customer opens order and taps “Cancel.”
2) System shows refund summary (full card reversal).
3) Customer confirms cancellation.
4) System cancels order and issues refund.
5) System sends cancellation confirmation.
Subflows
- Refund Processing: System submits void if same-day settlement not closed; otherwise standard refund.
Alternative Flows
A1 (Past Cancellation Window): System denies cancellation; provides support link.

UC-07: Staff Accepts and Preps Order; Marks Ready
Preconditions
- Staff is logged into the kitchen console.
- New order is assigned to the kitchen queue.
Main Flow
1) Staff opens order ticket.
2) Staff taps “Start Prep”; system sets status to “In Prep.”
3) Staff prepares items per ticket.
4) Staff taps “Ready”; system sets status to “Ready for Pickup/Delivery.”
5) System notifies courier and customer.
Subflows
- Temperature Check: Staff records hot/cold hold temperatures before marking “Ready.”
Alternative Flows
A1 (Missing Ingredient): Staff flags stock-out; triggers substitution subflow (UC-08).

UC-08: Stock-Out Substitution Workflow
Preconditions
- Staff is logged in; an item on an in-prep order is unavailable.
Main Flow
1) Staff opens item line and selects “Propose Substitution.”
2) Staff chooses allowed substitutes and price difference rules.
3) System sends push notification to customer with choices.
4) Customer selects a substitute or declines.
5) System updates order, totals, and prep instructions.
Subflows
- Price Adjustment: System applies equal/lesser price; if higher, prompts for incremental authorization.
Alternative Flows
A1 (No Response in Time Window): System auto-cancels unavailable item and updates receipt.
A2 (Customer Declines All): System removes item and offers partial refund or order cancel.

UC-09: Mark Out-for-Delivery and Delivered with Notifications
Preconditions
- Staff is logged into courier app.
- Order is “Ready.”
Main Flow
1) Courier taps “Pick Up”; system sets status “Out for Delivery.”
2) System sends ETA to customer.
3) Courier arrives at location and confirms recipient.
4) Courier taps “Delivered”; system records timestamp and geolocation.
5) System sends delivery confirmation and receipt.
Subflows
- Contactless Drop-Off: Courier attaches photo proof before “Delivered.”
Alternative Flows
A1 (Recipient Not Present): Courier triggers delivery failure flow (UC-10).

UC-10: Delivery Failure and Reattempt
Preconditions
- Courier is on an active delivery; recipient unavailable.
Main Flow
1) Courier taps “Delivery Attempt Failed.”
2) System notifies customer and offers reattempt windows.
3) Customer selects a new time/location within policy.
4) System updates route and ETA.
5) Courier completes reattempt and marks “Delivered.”
Subflows
- Support Escalation: If multiple failures, system offers support call-back.
Alternative Flows
A1 (Customer Cancels After Failure): System cancels undelivered items and issues refund minus reattempt fee if applicable.

UC-11: Partial Refund for Missing Item (Card)
Preconditions
- Customer has a delivered order paid by card.
- Refund request window is open.
Main Flow
1) Customer opens order and selects “Report Issue.”
2) Customer selects “Missing Item” and identifies line.
3) System calculates pro-rated refund and submits to payment processor.
4) System updates receipt and sends refund confirmation.
Subflows
- Evidence Attachment: Customer uploads photo of delivered bag contents.
Alternative Flows
A1 (Item Found After Report): Customer cancels request; system aborts refund if not settled.

UC-12: EBT Refund/Void for SNAP Order Item Removed
Preconditions
- Delivered EBT order includes a reported spoiled staple item.
- EBT refund policies apply.
Main Flow
1) Customer reports “Spoiled Item” for bread.
2) Staff reviews and approves refund.
3) System initiates EBT credit for eligible amount.
4) System updates order ledger and notifies customer.
Subflows
- Eligibility Recheck: System confirms refunded SKU is SNAP-eligible.
Alternative Flows
A1 (Processor Outage): System queues refund and notifies customer of delay.

UC-13: Return of Sealed Dietary Supplement
Preconditions
- Customer has a delivered supplement item within return window.
- Seal is intact per policy.
Main Flow
1) Customer requests return pickup via web portal.
2) System schedules courier pickup.
3) Courier collects item and marks “Returned.”
4) Staff inspects seal and approves return.
5) System issues refund to original card.
Subflows
- Restock Intake: Staff scans SKU back into inventory if acceptable.
Alternative Flows
A1 (Seal Broken): Staff rejects return; system notifies customer; no refund.

UC-14: Admin Adds Prepared Menu Item with Allergens
Preconditions
- Administrator is logged into the admin console.
- Recipes and allergen data are available.
Main Flow
1) Admin clicks “Add Item” and selects “Prepared/Hot.”
2) Admin enters name, price, and allergens (e.g., nuts).
3) Admin sets tax category and availability windows.
4) Admin publishes the item.
5) System syncs item to web, mobile, and kiosk menus.
Subflows
- Image Upload: Admin adds product photo.
Alternative Flows
A1 (Missing Allergen Data): System blocks publish and prompts for completion.

UC-15: Admin Updates Tax Categories and Jurisdictions
Preconditions
- Admin is logged into tax settings.
- Current tax mappings exist.
Main Flow
1) Admin selects “Tax Categories.”
2) Admin sets “Grocery Staples” as state-only.
3) Admin sets “Prepared Food” as state+county+city.
4) Admin saves and publishes rule version.
5) System timestamps rule version and applies to new orders.
Subflows
- Rule Preview: Admin runs calculator on sample basket.
Alternative Flows
A1 (Validation Error): Overlapping rules detected; system prevents publish and shows conflicts.

UC-16: Soda Surcharge Calculation and Receipt Display
Preconditions
- City soda tax is enabled in rules.
- Customer is ordering a sugary beverage.
Main Flow
1) Customer adds a 20 oz soda to cart online.
2) System calculates city soda surcharge per ounce.
3) System displays surcharge as a separate line item.
4) Customer pays by card and places order.
5) System records surcharge details on receipt.
Subflows
- Size Change: Customer switches size; system recalculates surcharge.
Alternative Flows
A1 (Non-sugary Beverage): System removes surcharge line automatically.

UC-17: Cross-Jurisdiction Tax Selection by Delivery Location
Preconditions
- Campus spans two cities with different local taxes.
- Customer is logged in on mobile app.
Main Flow
1) Customer builds a mixed cart (hot sandwich + chips).
2) Customer enters delivery address in City B.
3) System selects City B tax profile for eligible items.
4) System displays updated tax breakdown.
5) Customer pays by card and submits order.
Subflows
- Geofencing: System resolves address to jurisdiction boundary at checkout.
Alternative Flows
A1 (Ambiguous Address): System prompts for building selection to disambiguate jurisdiction.

UC-18: State Tax Holiday Exemption on Grocery Staples
Preconditions
- State tax holiday window is active.
- Customer is ordering staple items online.
Main Flow
1) Customer adds flour and eggs to cart.
2) System recognizes state tax holiday for staples.
3) System sets sales tax to $0 for eligible lines.
4) Customer pays by card and places order.
5) Receipt shows holiday exemption note and rule version.
Subflows
- Mixed Cart Handling: System taxes non-holiday items normally.
Alternative Flows
A1 (Holiday Window Ended During Session): System refreshes rates and informs customer of tax change before payment.

UC-19: Admin Manual Tax Override on an Order
Preconditions
- Admin is logged in with override permissions.
- An order has an incorrect tax due to misclassification.
Main Flow
1) Admin opens the order ledger entry.
2) Admin selects “Adjust Tax.”
3) Admin inputs corrected tax amount and justification.
4) System recalculates totals and posts adjustment.
5) System records audit entry with user, time, reason.
Subflows
- Customer Notification: System sends revised receipt to customer.
Alternative Flows
A1 (No Permission): System blocks override and logs attempt.

UC-20: Admin Runs Tax Audit Report
Preconditions
- Admin is logged into reporting.
- Orders exist for the selected date range.
Main Flow
1) Admin selects “Tax Audit” report.
2) Admin sets date range and jurisdictions.
3) System compiles item-level taxes, surcharges, and rule versions.
4) Admin downloads CSV and views exceptions list.
Subflows
- Exception Drilldown: Admin opens an exception order to view calculation details.
Alternative Flows
A1 (No Data): System returns empty report with notice.

UC-21: Admin Reviews Delivery Logs and Corrects Timestamp
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
- Evidence Attachment: Admin attaches photo or GPS snapshot to the correction.
Alternative Flows
A1 (Insufficient Evidence): System flags incident for investigation; no change applied.

UC-22: Admin Sets Inventory Threshold; Auto-86 Item
Preconditions
- Admin is logged into inventory settings.
- Items have current stock counts.
Main Flow
1) Admin sets threshold for hot entrée to 5.
2) System enables “auto-86” when count hits 0.
3) Staff marks 5 prepared; inventory decrements in real time.
4) When stock reaches 0, system unpublishes item from menus.
5) Customers see “Sold Out” and cannot add item.
Subflows
- Replenish Stock: Staff updates stock; system republishes item automatically.
Alternative Flows
A1 (Sync Failure): System displays warning to staff; manual publish control remains available.

UC-23: Kiosk Quick Order and Pickup (Card)
Preconditions
- Kiosk is online and authenticated to store.
- Card reader operational.
Main Flow
1) Customer selects “Guest Order” on kiosk.
2) Customer chooses a hot deli combo.
3) System shows price with tax.
4) Customer taps to pay by card.
5) System authorizes payment and prints ticket number.
6) Staff prepares order and calls number for pickup.
Subflows
- Receipt Email: Customer enters email for e-receipt.
Alternative Flows
A1 (Card Declined): Kiosk cancels transaction; no ticket printed.

UC-24: Tip Add/Adjust After Delivery via Mobile
Preconditions
- Customer has a delivered order paid by card.
- Post-delivery tip window is open.
Main Flow
1) Customer opens delivered order in app.
2) Customer selects “Add/Adjust Tip.”
3) Customer chooses tip amount.
4) System charges incremental tip to the original card.
5) System updates receipt and courier payout.
Subflows
- Tip Presets: System displays preset percentages and custom field.
Alternative Flows
A1 (Card No Longer Valid): System prompts for a new card; if declined, tip update fails.

UC-25: Coupon Abuse Investigation and Make-Good Discount Override
Preconditions
- Admin is logged into promotions and support.
- A customer reports invalidated coupon usage; logs show abuse on prior orders.
Main Flow
1) Admin reviews coupon usage logs for the customer.
2) Admin invalidates the customer’s coupon eligibility going forward.
3) Admin opens the affected order and applies a manual goodwill discount.
4) System posts adjustment and updates receipt.
5) System records override in audit log and notifies customer.
Subflows
- Flag Account: System adds internal note for future promotions.
Alternative Flows
A1 (No Abuse Found): Admin reinstates coupon eligibility; no override applied.

UC-26: Staff Scheduling and Acknowledgment
Preconditions
- Admin is logged into scheduling.
- Staff users are active in the system.
Main Flow
1) Admin creates a lunch shift 11:00–14:00 for kitchen and delivery roles.
2) Admin assigns staff to shifts.
3) System sends push notifications to assigned staff.
4) Staff open app and tap “Acknowledge.”
5) System records acknowledgments and highlights unacknowledged shifts.
Subflows
- Swap Request: Staff requests swap; admin approves and reassigns.
Alternative Flows
A1 (Overlapping Shift): System blocks assignment and prompts resolution.

UC-27: Allergen Cross-Contact Incident; Cancel and Refund
Preconditions
- Order includes allergen-sensitive instructions.
- Staff detects cross-contact risk during prep.
Main Flow
1) Staff flags order with “Allergen Risk.”
2) System pauses prep and notifies customer.
3) Customer chooses cancel or remake without allergen item.
4) Staff cancels order on customer request.
5) System issues full refund and sends apology notice.
Subflows
- Remake Path: If customer selects remake, system updates ticket and restarts prep.
Alternative Flows
A1 (No Customer Response): System auto-cancels after policy window and refunds.

UC-28: Split Payment EBT + Card for Mixed Cart
Preconditions
- Customer is logged in on mobile app with EBT card on file.
- Cart contains staples (EBT-eligible) and hot prepared items (ineligible).
Main Flow
1) Customer proceeds to checkout.
2) System splits cart into EBT-eligible and ineligible totals.
3) Customer authorizes EBT for eligible subtotal.
4) Customer pays remaining balance by card.
5) System creates one order with two payment records and sends receipt with split.
Subflows
- Eligibility Display: System labels eligible lines before payment.
Alternative Flows
A1 (EBT Authorization Fails): System allows customer to pay full amount by card or remove ineligible items.

UC-29: Change Delivery Location Mid-Route
Preconditions
- Order is “Out for Delivery.”
- Customer is logged in on mobile app.
Main Flow
1) Customer taps “Change Location.”
2) System checks new address within service area and courier radius.
3) Customer confirms new location.
4) System updates courier route and ETA.
5) Courier delivers to updated location and marks “Delivered.”
Subflows
- Fee Calculation: System applies reroute fee if distance exceeds threshold.
Alternative Flows
A1 (Outside Service Area): System denies change and offers support call.

UC-30: Online Registration and First-Order Discount
Preconditions
- Customer is on the website and not registered.
- First-order discount promo is active.
Main Flow
1) Customer completes registration and email verification.
2) Customer adds items to cart.
3) System auto-applies first-order discount at checkout.
4) Customer pays by card and places order.
5) System sends confirmation and welcome receipt.
Subflows
- Identity Verification: System sends verification email and confirms before checkout.
Alternative Flows
A1 (Promo Exhausted): System does not apply discount and shows message; checkout proceeds normally.

Coverage Mapping
- Roles:
  - Customer → UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-09, UC-10, UC-11, UC-12, UC-13, UC-16, UC-17, UC-18, UC-23, UC-24, UC-28, UC-29, UC-30
  - Staff → UC-07, UC-08, UC-09, UC-10, UC-21, UC-27
  - Administrator → UC-14, UC-15, UC-16, UC-17, UC-18, UC-19, UC-20, UC-21, UC-22, UC-25, UC-26
- Channels:
  - Online → UC-01, UC-04, UC-05, UC-10, UC-11, UC-13, UC-16, UC-18, UC-20, UC-30
  - Mobile app → UC-02, UC-03, UC-06, UC-08, UC-09, UC-12, UC-14 (admin console is web; excluded), UC-17, UC-24, UC-28, UC-29
  - Kiosk → UC-23
- Payment:
  - Card → UC-01, UC-03, UC-04, UC-11, UC-13, UC-16, UC-17, UC-18, UC-23, UC-24, UC-25, UC-28, UC-30
  - EBT/SNAP → UC-02, UC-12, UC-28
  - Coupons/Discounts → UC-04, UC-25, UC-30
- Item Types:
  - Grocery staples → UC-02, UC-18, UC-28
  - Prepared/hot food → UC-01, UC-07, UC-17, UC-23, UC-27
  - Dietary supplements → UC-03, UC-13
- Jurisdictions/Rules:
  - State-only → UC-02, UC-15, UC-18
  - State+County+City → UC-01, UC-15
  - Cross-jurisdiction → UC-17
  - Tax holiday → UC-18
  - Soda surcharge → UC-16
- Events:
  - New order → UC-01, UC-02, UC-03, UC-04, UC-16, UC-17, UC-18, UC-23, UC-28, UC-30
  - Edit/cancel → UC-05, UC-06, UC-27, UC-29
  - Fulfillment → UC-07, UC-08, UC-09, UC-10, UC-23
  - Delivery → UC-09, UC-10, UC-24, UC-29
  - Refund/Return → UC-11, UC-12, UC-13, UC-27, UC-25
  - Manual override → UC-19, UC-25
  - Audit → UC-19, UC-20, UC-21