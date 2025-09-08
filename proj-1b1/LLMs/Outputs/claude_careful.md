## UC-01: Customer Places Standard Order
**Preconditions**
- Customer is logged in
- Menu items are available
- Payment method on file

**Main Flow**
1. Customer selects delivery location
2. Customer adds items to cart
3. System displays subtotal with tax preview
4. Customer proceeds to checkout
5. System calculates final taxes based on jurisdiction
6. Customer confirms payment method
7. Customer submits order
8. System generates order confirmation and receipt

**Subflows**
- Item customization: Customer modifies size/options before adding to cart

**Alternative Flows**
- A1: Item out of stock → System suggests alternatives or removes item
- A2: Payment fails → System prompts for different payment method

## UC-02: Staff Fulfills Order
**Preconditions**
- Order is accepted and paid
- Staff is logged in
- Ingredients available

**Main Flow**
1. Staff views assigned order details
2. Staff marks order "in preparation"
3. Staff prepares each item
4. System decrements inventory quantities
5. Staff marks order "ready for delivery"
6. Staff assigns to delivery person
7. Delivery person marks "out for delivery"
8. Delivery person marks "delivered"

**Subflows**
- Batch preparation: Staff prepares multiple orders simultaneously

**Alternative Flows**
- A1: Ingredient shortage → Staff marks item unavailable and notifies customer
- A2: Customer not at location → Delivery person marks "delivery attempted"

## UC-03: Administrator Updates Menu Pricing
**Preconditions**
- Administrator has menu management permissions
- System not processing active orders for affected items

**Main Flow**
1. Administrator selects menu category
2. Administrator chooses item to modify
3. Administrator updates base price
4. Administrator sets effective date/time
5. System validates pricing rules
6. Administrator confirms changes
7. System logs price change for audit

**Subflows**
- Bulk update: Administrator applies percentage change to multiple items

**Alternative Flows**
- A1: Price violates min/max constraints → System rejects update
- A2: Effective date conflicts → System prompts for resolution

## UC-04: Customer Pays with EBT/SNAP
**Preconditions**
- Customer has valid EBT card registered
- Cart contains SNAP-eligible items

**Main Flow**
1. Customer selects EBT payment at checkout
2. System identifies SNAP-eligible items
3. System separates eligible/ineligible totals
4. Customer enters EBT PIN
5. System processes EBT payment for eligible items
6. Customer provides alternate payment for remaining balance
7. System generates itemized receipt with payment breakdown

**Subflows**
- Split tender: Multiple payment methods in single transaction

**Alternative Flows**
- A1: Insufficient EBT balance → System prompts for partial payment amount
- A2: No eligible items → System prevents EBT selection

## UC-05: Customer Requests Refund
**Preconditions**
- Order was completed within refund window
- Customer provides order number

**Main Flow**
1. Customer selects order from history
2. Customer indicates refund reason
3. Customer selects items for refund
4. System calculates refund amount including tax
5. Staff reviews refund request
6. Staff approves refund
7. System processes payment reversal
8. System sends refund confirmation

**Subflows**
- Partial refund: Only specific items refunded

**Alternative Flows**
- A1: Order outside refund window → System denies request
- A2: Delivered order disputed → Administrator reviews before approval

## UC-06: System Applies Tax Holiday
**Preconditions**
- Tax holiday configured for date range
- Applicable item categories defined

**Main Flow**
1. System detects current date within holiday period
2. Customer adds qualifying items to cart
3. System identifies tax-exempt categories
4. System applies zero tax rate to qualifying items
5. System displays tax savings notification
6. Customer completes checkout
7. System records tax holiday application in receipt

**Subflows**
- Mixed cart: Some items qualify, others don't

**Alternative Flows**
- A1: Holiday ends mid-order → System applies regular tax if checkout after expiry
- A2: Multiple holidays overlap → System applies most favorable rate

## UC-07: Customer Orders via Mobile App
**Preconditions**
- Mobile app installed and authenticated
- GPS location services enabled

**Main Flow**
1. App detects customer's campus location
2. Customer browses location-specific menu
3. Customer adds items using touch gestures
4. App stores cart locally
5. Customer initiates checkout
6. App syncs with server for final calculation
7. Customer completes payment in-app
8. App displays real-time order tracking

**Subflows**
- Quick reorder: Customer selects from previous orders

**Alternative Flows**
- A1: No network connection → App queues order for later submission
- A2: Location outside delivery zone → App restricts to pickup only

## UC-08: Administrator Configures Soda Surcharge
**Preconditions**
- Administrator has tax configuration access
- City soda tax rate published

**Main Flow**
1. Administrator navigates to tax rules
2. Administrator creates surcharge rule
3. Administrator specifies rate per ounce
4. Administrator maps to beverage categories
5. Administrator sets jurisdiction boundaries
6. System validates against existing rules
7. Administrator activates surcharge
8. System updates all affected item calculations

**Subflows**
- Exemption list: Administrator excludes diet/zero-sugar variants

**Alternative Flows**
- A1: Overlapping surcharge exists → System prevents duplicate
- A2: Invalid rate format → System requires correction

## UC-09: Staff Reports Inventory Shortage
**Preconditions**
- Staff preparing order
- Actual quantity below system record

**Main Flow**
1. Staff identifies shortage during preparation
2. Staff opens inventory adjustment screen
3. Staff selects affected ingredient
4. Staff enters actual quantity
5. System calculates discrepancy
6. Staff provides shortage reason
7. System updates inventory level
8. System notifies administrator

**Subflows**
- Substitute suggestion: System recommends alternatives

**Alternative Flows**
- A1: Critical item depleted → System auto-disables menu items
- A2: Discrepancy exceeds threshold → System requires manager approval

## UC-10: Customer Uses Coupon Code
**Preconditions**
- Valid coupon code available
- Customer has items in cart

**Main Flow**
1. Customer enters coupon code at checkout
2. System validates code eligibility
3. System checks item/category restrictions
4. System applies discount calculation
5. System displays updated total
6. Customer reviews savings
7. Customer completes purchase
8. System marks coupon as used

**Subflows**
- Stacked coupons: Multiple codes applied if allowed

**Alternative Flows**
- A1: Expired code → System shows expiration message
- A2: Minimum not met → System indicates required amount

## UC-11: Administrator Generates Tax Report
**Preconditions**
- Administrator has reporting permissions
- Completed orders exist for period

**Main Flow**
1. Administrator selects report type "Tax Summary"
2. Administrator specifies date range
3. Administrator selects jurisdictions
4. System aggregates tax collected by category
5. System calculates totals by tax type
6. Administrator reviews summary
7. Administrator exports report
8. System logs report generation

**Subflows**
- Detailed breakdown: Drill into specific tax categories

**Alternative Flows**
- A1: No data for period → System displays empty report
- A2: Concurrent tax rule changes → System shows effective dates

## UC-12: Customer Edits Order Before Preparation
**Preconditions**
- Order placed but not started
- Within modification window

**Main Flow**
1. Customer accesses active order
2. Customer selects "Modify Order"
3. Customer adds/removes items
4. System recalculates total
5. Customer confirms changes
6. System processes payment adjustment
7. System updates order details
8. System notifies assigned staff

**Subflows**
- Quick add: Customer adds forgotten items

**Alternative Flows**
- A1: Order already in preparation → System denies modification
- A2: Price increased → System requests additional payment

## UC-13: System Processes Cross-Jurisdiction Delivery
**Preconditions**
- Delivery crosses tax boundaries
- Multiple tax rates configured

**Main Flow**
1. Customer enters delivery address
2. System geocodes location
3. System identifies all applicable jurisdictions
4. System retrieves tax rates for state/county/city
5. System calculates cumulative tax
6. System displays jurisdiction breakdown
7. Customer acknowledges tax calculation
8. Order proceeds with correct tax

**Subflows**
- Rate lookup: System queries tax database by location

**Alternative Flows**
- A1: Address ambiguous → System requests clarification
- A2: New jurisdiction → System applies default state rate

## UC-14: Staff Marks Delivery Completed
**Preconditions**
- Order out for delivery
- Staff at delivery location

**Main Flow**
1. Staff arrives at delivery location
2. Staff confirms customer identity
3. Staff hands over order
4. Staff marks "Delivered" in app
5. System records delivery timestamp
6. System sends delivery confirmation to customer
7. System updates order status
8. Staff returns to pickup next order

**Subflows**
- Contactless delivery: Staff photographs placement

**Alternative Flows**
- A1: Customer unavailable → Staff attempts contact
- A2: Wrong address → Staff contacts dispatch

## UC-15: Administrator Sets Dietary Flags
**Preconditions**
- Administrator has menu permissions
- Item exists in system

**Main Flow**
1. Administrator selects menu item
2. Administrator opens dietary properties
3. Administrator marks allergens present
4. Administrator sets dietary categories
5. Administrator indicates preparation method
6. System validates against regulations
7. Administrator saves changes
8. System updates item display flags

**Subflows**
- Bulk tagging: Apply flags to multiple items

**Alternative Flows**
- A1: Conflicting flags → System requires resolution
- A2: Missing required allergen info → System prevents save

## UC-16: Customer Schedules Future Delivery
**Preconditions**
- Customer logged in
- Scheduling enabled for location

**Main Flow**
1. Customer selects "Schedule Order"
2. Customer chooses delivery date
3. Customer selects time window
4. System confirms availability
5. Customer completes order details
6. System holds payment authorization
7. System sends confirmation
8. System triggers preparation at scheduled time

**Subflows**
- Recurring order: Customer sets weekly schedule

**Alternative Flows**
- A1: Time slot full → System suggests alternatives
- A2: Item discontinued → System notifies before scheduled date

## UC-17: Administrator Performs Manual Tax Override
**Preconditions**
- Administrator has override authority
- Specific order requires adjustment

**Main Flow**
1. Administrator locates order
2. Administrator selects "Tax Override"
3. Administrator enters corrected amount
4. Administrator provides override reason
5. System logs override details
6. Administrator approves adjustment
7. System updates order total
8. System issues adjusted receipt

**Subflows**
- Exemption application: Full tax removal for special case

**Alternative Flows**
- A1: Override exceeds limit → System requires higher approval
- A2: Order already delivered → System processes as refund

## UC-18: Customer Orders at Kiosk
**Preconditions**
- Kiosk operational
- Network connection active

**Main Flow**
1. Customer approaches kiosk
2. Customer selects "Start Order"
3. Customer browses menu on touchscreen
4. Customer adds items to cart
5. Customer inserts payment card
6. System processes payment
7. System prints receipt with order number
8. Customer waits for preparation

**Subflows**
- Guest checkout: No account required

**Alternative Flows**
- A1: Card reader error → Kiosk suggests mobile payment
- A2: Printer jam → System sends receipt via email

## UC-19: System Enforces Prepared Food Tax
**Preconditions**
- Hot/prepared items in cart
- Tax rules configured

**Main Flow**
1. Customer adds hot sandwich to cart
2. System identifies as prepared food
3. System retrieves prepared food tax rate
4. System applies standard sales tax
5. System adds local prepared food tax
6. System displays tax breakdown
7. Customer sees total with all taxes
8. Transaction continues with correct tax

**Subflows**
- Mixed temperature: Some items hot, others cold

**Alternative Flows**
- A1: Tax exemption certificate → System waives prepared food tax
- A2: Take-and-bake item → System applies grocery rate

## UC-20: Staff Updates Preparation Time
**Preconditions**
- Order in preparation
- Delay identified

**Main Flow**
1. Staff encounters preparation delay
2. Staff opens order details
3. Staff adjusts estimated ready time
4. Staff selects delay reason
5. System calculates new delivery ETA
6. System notifies customer of delay
7. Customer receives updated timeline
8. Staff continues preparation

**Subflows**
- Batch delay: Multiple orders affected

**Alternative Flows**
- A1: Delay exceeds threshold → System offers cancellation
- A2: Customer rejects delay → Order cancelled with refund

## UC-21: Administrator Audits Order History
**Preconditions**
- Administrator has audit permissions
- Order records exist

**Main Flow**
1. Administrator accesses audit interface
2. Administrator sets search criteria
3. System retrieves matching orders
4. Administrator reviews order details
5. Administrator checks tax calculations
6. Administrator verifies payment records
7. Administrator notes any discrepancies
8. System logs audit activity

**Subflows**
- Export audit trail: Download for external review

**Alternative Flows**
- A1: Missing records → System flags data gap
- A2: Calculation error found → System creates correction task

## UC-22: Customer Cancels Before Preparation
**Preconditions**
- Order placed and paid
- Preparation not started

**Main Flow**
1. Customer opens active order
2. Customer selects "Cancel Order"
3. System checks order status
4. Customer confirms cancellation
5. System reverses payment
6. System removes from queue
7. System sends cancellation confirmation
8. Customer receives refund notification

**Subflows**
- Partial cancellation: Remove specific items only

**Alternative Flows**
- A1: Preparation started → System denies cancellation
- A2: Payment reversal fails → System creates refund ticket

## UC-23: System Applies Dietary Supplement Tax
**Preconditions**
- Dietary supplements in cart
- Supplement tax rate configured

**Main Flow**
1. Customer adds protein powder to order
2. System identifies as dietary supplement
3. System retrieves supplement tax rate
4. System calculates supplement-specific tax
5. System adds to order total
6. System itemizes on receipt
7. Customer sees supplement tax line
8. Order completes with proper tax

**Subflows**
- Medical exemption: Customer provides exemption number

**Alternative Flows**
- A1: Supplement reclassified as food → System applies food rate
- A2: Multi-jurisdictional rates → System uses delivery location rate

## UC-24: Administrator Creates Staff Schedule
**Preconditions**
- Administrator has scheduling permissions
- Staff roster available

**Main Flow**
1. Administrator opens scheduling module
2. Administrator selects week to schedule
3. Administrator assigns staff to shifts
4. Administrator sets break times
5. System checks for conflicts
6. Administrator reviews coverage
7. Administrator publishes schedule
8. System notifies staff of assignments

**Subflows**
- Template application: Use previous week's pattern

**Alternative Flows**
- A1: Understaffed period → System warns of coverage gap
- A2: Staff unavailable → System suggests alternatives

## UC-25: Customer Provides Delivery Instructions
**Preconditions**
- Customer placing order
- Delivery address selected

**Main Flow**
1. Customer reaches delivery details
2. Customer selects "Add Instructions"
3. Customer enters specific directions
4. Customer adds gate code if needed
5. Customer specifies contact preference
6. System attaches to order
7. Delivery staff sees instructions
8. Staff follows special directions

**Subflows**
- Saved instructions: Reuse from profile

**Alternative Flows**
- A1: Instructions exceed limit → System truncates text
- A2: Restricted delivery area → System flags for review

## UC-26: System Handles Payment Failure
**Preconditions**
- Order submitted for payment
- Payment method selected

**Main Flow**
1. System attempts payment processing
2. Payment gateway returns failure
3. System identifies failure reason
4. System notifies customer
5. Customer selects alternate payment
6. System retries payment
7. Payment succeeds
8. Order proceeds