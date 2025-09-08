1) Register and Log In
- Preconditions
  - User has access to WolfCafe web or mobile app.
  - Registration is open; authentication service is operational.
- Main Flow
  - User selects Sign Up, enters email, name, password.
  - System validates and creates account.
  - User logs in and is redirected to menu.
- Subflows
  - Verify email link is sent and confirmed before ordering.
- Alternative Flows
  - Duplicate email: system prompts to log in or reset password.
  - Weak password: system enforces policy and requests stronger password.
  - Auth service down: user sees maintenance message and cannot proceed.

2) Browse Menu and Apply Filters
- Preconditions
  - User is logged in or guest browsing permitted.
  - Menu and categories are published and active.
- Main Flow
  - User opens Menu and selects categories (e.g., Entrees, Beverages).
  - User applies filters (price, popularity).
  - System displays available items with prices and badges.
- Subflows
  - User searches by keyword; system returns matching items.
- Alternative Flows
  - No items match filters: system suggests clearing filters or related categories.
  - Menu service latency: system shows loading state with retry.

3) Build Cart with Item Options
- Preconditions
  - Menu items with configurable options exist (size, add-ons).
  - User session has an active cart.
- Main Flow
  - User selects an item and chooses options.
  - System updates price based on selections.
  - User adds item to cart and sees updated subtotal.
- Subflows
  - Quantity stepper allows increasing/decreasing item count with stock check.
- Alternative Flows
  - Option conflict (e.g., mutually exclusive add-ons): system enforces valid combinations.
  - Option out-of-stock: system disables option and shows note.

4) Apply Allergen and Dietary Preferences
- Preconditions
  - Items are tagged with allergen/dietary flags (nuts, dairy-free, vegan).
- Main Flow
  - User sets preferences (avoid nuts; vegetarian only).
  - System filters or labels items accordingly.
  - User adds compliant items to cart.
- Subflows
  - Item detail page shows allergen disclosure and cross-contact warning.
- Alternative Flows
  - No compliant items in a category: system suggests substitutes or customizations.
  - User attempts to add flagged item: system prompts to confirm risk or choose alternative.

5) Checkout and Place Order
- Preconditions
  - Cart has at least one item.
  - Delivery windows and locations are available.
- Main Flow
  - User reviews cart, selects delivery location/time.
  - System calculates taxes, surcharges, and fees.
  - User selects payment method and confirms order.
  - System creates order, sends confirmation, and transitions to Accepted.
- Subflows
  - Promo code entry validates and applies discount.
- Alternative Flows
  - Payment authorization fails: system prompts for another method.
  - Delivery window unavailable after selection: system requests a new time.

6) Pay with Credit/Debit Card
- Preconditions
  - Payment gateway is operational.
  - User has valid card information.
- Main Flow
  - User selects Card, enters details or uses saved token.
  - System tokenizes and authorizes the amount.
  - Order is placed upon successful authorization.
- Subflows
  - 3-D Secure challenge completes and returns success.
- Alternative Flows
  - CVV/AVS mismatch: system declines and requests correction.
  - Gateway timeout: system retries or asks user to retry later.

7) Pay with Campus Dining Dollars
- Preconditions
  - User account is linked to campus wallet with sufficient balance.
- Main Flow
  - User selects Campus Dollars at checkout.
  - System verifies balance and places an authorization hold.
  - Order is placed; balance is debited on fulfillment.
- Subflows
  - Partial hold for pre-auth and capture on delivery.
- Alternative Flows
  - Insufficient balance: system prompts to switch or split with card.
  - Wallet service unavailable: system blocks method and suggests alternatives.

8) Pay with SNAP/EBT for Eligible Items
- Preconditions
  - EBT processing integration is enabled.
  - Cart contains only EBT-eligible items (no hot/prepared foods).
- Main Flow
  - User selects EBT, reviews eligibility summary.
  - System authorizes EBT amount for eligible items (tax-exempt as applicable).
  - Order is placed.
- Subflows
  - Eligibility engine validates each line item against EBT rules.
- Alternative Flows
  - Ineligible item detected: system blocks and prompts removal.
  - EBT terminal offline: system prevents EBT checkout and suggests other methods.

9) Split Tender: EBT + Card for Mixed Basket
- Preconditions
  - Cart contains mix of EBT-eligible and ineligible items.
  - Both EBT and card methods are available.
- Main Flow
  - System splits cart into eligible and ineligible subtotals.
  - User authorizes EBT for eligible subtotal.
  - User authorizes card for remaining amount, taxes, and fees.
  - Order is placed with both authorizations recorded.
- Subflows
  - Receipt itemizes tender allocation per line item.
- Alternative Flows
  - EBT portion fails: system offers to move eligible items to card or remove them.
  - Card portion fails: system allows reattempt or removal of ineligible items.

10) Tax Calculation: Prepared vs Grocery Staples
- Preconditions
  - Tax rules configured by category and jurisdiction.
  - Items categorized as prepared/hot or grocery staple.
- Main Flow
  - At checkout, system classifies each line item.
  - System applies appropriate tax rate per item and sums tax.
  - Tax breakdown shown on receipt.
- Subflows
  - Bundled meals are split into taxable and non-taxable components if configured.
- Alternative Flows
  - Missing category mapping: system applies default tax and flags for admin review.
  - Jurisdiction service unavailable: system uses last-known rates and logs a warning.

11) Tax Calculation: Dietary Supplements
- Preconditions
  - Items tagged as dietary supplements.
  - Supplement tax rules configured (may differ from food).
- Main Flow
  - System detects supplement items and applies correct tax.
  - Receipt lists supplement tax separately if required.
- Subflows
  - Rule version stamped on order for audit.
- Alternative Flows
  - Ambiguous item tag: system blocks checkout for that item or requests admin override.
  - Mid-order rule update: system locks rule version at time of calculation.

12) Local Surcharge: Soda/SSB Tax per Ounce
- Preconditions
  - SSB surcharge configured per ounce for specified beverages.
- Main Flow
  - User adds a sugary beverage; system calculates surcharge by size.
  - Surcharge is itemized separately at checkout and on receipt.
- Subflows
  - Refill or ice exclusions handled per configuration.
- Alternative Flows
  - Size missing: system uses default and notes estimate.
  - Surcharge not applicable at delivery location: system suppresses fee.

13) Tax Holiday Handling
- Preconditions
  - Active tax holiday configured for specified categories/date range.
  - System time in holiday window.
- Main Flow
  - User checks out; system identifies items eligible for holiday exemption.
  - Taxes reduced/removed accordingly; receipt notes holiday.
- Subflows
  - Cap thresholds applied per item or per order where defined.
- Alternative Flows
  - Holiday ends during checkout: system recalculates and informs user.
  - Conflicting promotions: system applies precedence rules and logs decision.

14) Select and Validate Delivery Location
- Preconditions
  - Campus map and deliverable zones are configured.
- Main Flow
  - User selects building/room or GPS pin within campus.
  - System validates address against deliverable zones.
  - User saves instructions and proceeds.
- Subflows
  - Accessibility or security checkpoint notes displayed as needed.
- Alternative Flows
  - Outside delivery zone: system suggests pickup or alternate address.
  - Ambiguous location: system prompts for clarification or uses last valid location.

15) Schedule Delivery Time Window
- Preconditions
  - Delivery slots exist with capacity limits.
- Main Flow
  - User selects an available time window.
  - System reserves slot capacity and confirms ETA.
- Subflows
  - User opts for ASAP; system provides estimated window.
- Alternative Flows
  - Slot fills before confirmation: system asks user to pick another window.
  - Curfew/quiet hours restrictions: system blocks and suggests next available.

16) Peak Load Queueing and ETA Management
- Preconditions
  - High demand period; queueing thresholds active.
- Main Flow
  - System throttles acceptance and extends ETAs.
  - User sees real-time prep queue status during checkout.
- Subflows
  - Notifications sent on status changes (Accepted, In Prep, Ready).
- Alternative Flows
  - Queue exceeds max: system temporarily pauses new orders.
  - User abandons due to long ETA: cart persists for later.

17) Inventory Reservation at Order Acceptance
- Preconditions
  - Inventory levels tracked per ingredient/item.
- Main Flow
  - Upon order acceptance, system reserves required inventory.
  - Reservation reduces available counts across channels.
- Subflows
  - Substitute mappings used to fulfill variants without depleting core stock.
- Alternative Flows
  - Inventory below threshold: order is routed for manual review before acceptance.
  - Concurrency conflict: system rolls back and notifies customer of delay.

18) Mid-Prep Stock-Out and Replan
- Preconditions
  - Order is In Prep; one or more ingredients deplete unexpectedly.
- Main Flow
  - Staff flags stock-out on kitchen screen.
  - System proposes alternatives or partial fulfillment plan.
  - Customer is notified to approve choice.
- Subflows
  - Timer escalates to auto-cancel affected item if no response.
- Alternative Flows
  - Customer declines all alternatives: system issues refund for affected items.
  - Staff locates last-minute stock: item prep resumes and notification sent.

19) Customer-Approved Item Substitution
- Preconditions
  - Original item unavailable; substitutes configured.
- Main Flow
  - System sends substitution proposal with price impact.
  - Customer approves in-app.
  - System updates order, price, taxes, and inventory reservations.
- Subflows
  - Price decrease triggers immediate partial refund/hold reduction.
- Alternative Flows
  - Price increase rejected: system offers second-choice substitute or removal.
  - No response within window: system defaults to remove-and-refund.

20) Kitchen Prep and Quality Check
- Preconditions
  - Order Accepted; all required inventory reserved.
- Main Flow
  - Staff opens order ticket and begins prep.
  - Items are marked Prepared and pass QC checklist.
  - Order marked Ready for Pickup by driver.
- Subflows
  - Temperature and allergen cross-contact checks recorded.
- Alternative Flows
  - QC fail: item remade; prep time updated.
  - Equipment failure: order paused and ETA recalculated.

21) Driver Assignment and Routing
- Preconditions
  - Order marked Ready; drivers online.
- Main Flow
  - System assigns driver based on proximity and capacity.
  - Driver accepts task and views optimized route.
  - Driver collects order and departs.
- Subflows
  - Batch multiple nearby orders into a single route if SLAs allow.
- Alternative Flows
  - Driver declines or times out: system reassigns to next best driver.
  - No drivers available: system delays order and notifies customer.

22) Contactless Proof of Delivery
- Preconditions
  - Order Out for Delivery; contactless option selected or required.
- Main Flow
  - Driver arrives, places order at designated spot.
  - Driver captures photo and geo-timestamp; customer notified.
  - System marks Delivered.
- Subflows
  - PIN or code confirmation used for sensitive orders as configured.
- Alternative Flows
  - Customer unreachable; building locked: driver follows fallback (call, wait, return).
  - Wrong location detected: driver corrects and updates proof.

23) Customer Cancels Before Prep
- Preconditions
  - Order in Placed/Accepted state; not yet In Prep.
- Main Flow
  - Customer requests cancellation.
  - System verifies status and reverses payment authorization.
  - Order marked Canceled; notifications sent.
- Subflows
  - Promo codes return to available state if unused.
- Alternative Flows
  - Prep already started: system offers partial cancellation per line item.
  - Non-refundable promotional items: system warns and requires confirmation.

24) Cancel After Prep: Restocking and Partial Refund
- Preconditions
  - Order In Prep or Ready; customer requests cancellation or cannot receive.
- Main Flow
  - Staff evaluates which items can be restocked or reused.
  - System computes refundable portion and processes partial refund.
  - Order marked Canceled with disposition notes.
- Subflows
  - Food safety rules applied to determine restock eligibility.
- Alternative Flows
  - Delivery already en route: system attempts recall; if unsuccessful, mark as waste and refund per policy.
  - Perishable-only order: no restock; refund policy applied accordingly.

25) Missing/Damaged Item Partial Refund Post-Delivery
- Preconditions
  - Order Delivered; customer reports issue within policy window.
- Main Flow
  - Customer selects items with issues and submits evidence (photo/notes).
  - Staff reviews and approves partial refund or redelivery.
  - System issues refund and updates inventory/waste logs.
- Subflows
  - Automated credit for low-cost items below threshold.
- Alternative Flows
  - Insufficient evidence or late claim: system denies with rationale.
  - Redelivery chosen: new order created with zero charge and priority routing.

26) Admin Update Menu and Prices with Versioned Rollout
- Preconditions
  - Admin authenticated with required permissions.
  - Draft menu changes prepared.
- Main Flow
  - Admin edits items/prices/dietary tags and schedules rollout.
  - System versions the menu and activates at scheduled time.
  - Orders created reference the active version at time of placement.
- Subflows
  - Canary release to subset of locations for validation.
- Alternative Flows
  - Validation fails (missing tax category): system blocks publish and lists errors.
  - Rollback initiated: system reverts to prior version and logs event.

27) Admin Tax Rule Override on Specific Item (Audited)
- Preconditions
  - Admin with tax override privilege; justification required.
  - Item has existing tax mapping.
- Main Flow
  - Admin applies override (e.g., set item non-taxable).
  - System records reason, approver, and effective time window.
  - New orders apply override; receipts show rule version.
- Subflows
  - Dual-approval workflow for high-risk overrides.
- Alternative Flows
  - Override conflicts with jurisdiction constraints: system blocks and requests legal review.
  - Override expired: system reverts automatically and notifies admin.

28) Generate Audit Report for Orders and Rules
- Preconditions
  - Admin/reporting role; reporting service available.
- Main Flow
  - Admin selects date range and filters (tax, EBT, surcharges).
  - System compiles orders, applied rule versions, and overrides.
  - Report exported with immutable hash/signature.
- Subflows
  - Drill-down to line-item level with tender allocation.
- Alternative Flows
  - Large dataset timeout: system delivers asynchronously with download link.
  - Missing data segments: system flags gaps and suggests re-index.

29) Allergen Incident Report and Escalation
- Preconditions
  - Delivered order allegedly caused allergen exposure.
- Main Flow
  - Customer submits incident report.
  - Admin triggers incident workflow: freeze related menu items, review prep logs.
  - System alerts compliance and schedules follow-up.
- Subflows
  - Pull kitchen station logs and cross-contact checklist from order record.
- Alternative Flows
  - False attribution suspected: system documents findings and closes case.
  - Confirmed issue: system issues refunds, notifies impacted customers, and updates training.

30) System Outage Fallback and Order Recovery
- Preconditions
  - Partial system outage detected (e.g., payment or routing).
- Main Flow
  - System enters degraded mode with limited features.
  - New orders paused or routed to manual phone line.
  - On recovery, system reconciles payments, inventory, and statuses.
- Subflows
  - Pending authorizations re-checked; orphaned holds released.
- Alternative Flows
  - Recovery fails for specific orders: manual admin intervention with audit trail.
  - Duplicate charges detected: system auto-refunds and notifies affected users.