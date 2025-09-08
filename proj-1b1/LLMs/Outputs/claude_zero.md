# 30 Use Cases for WolfCafe Food Delivery System

## 1. Register New Customer Account
**Preconditions**: User has valid email and is not already registered
**Main Flow**: User provides email, password, name, campus address, and phone number; system validates and creates account
**Subflows**: Email verification sent; user clicks link to activate account
**Alternative Flows**: If email already exists, prompt to reset password; if campus address invalid, show error and request correction

## 2. Place Standard Food Order
**Preconditions**: Customer logged in, items available in inventory, delivery location open
**Main Flow**: Customer browses menu, adds items to cart, proceeds to checkout, confirms delivery details, submits payment
**Subflows**: System calculates taxes based on item categories; inventory reserved upon order confirmation
**Alternative Flows**: If item becomes unavailable during checkout, notify customer and suggest alternatives; if payment fails, retain cart and prompt retry

## 3. Apply SNAP/EBT Payment
**Preconditions**: Customer has valid EBT card registered, order contains eligible items
**Main Flow**: Customer selects EBT payment method; system identifies eligible staple items and separates from hot/prepared items
**Subflows**: Calculate tax exemption for EBT-eligible items; process EBT payment for eligible amount only
**Alternative Flows**: If order contains only ineligible items, display warning and request alternative payment; if partial eligibility, split payment between EBT and secondary method

## 4. Cancel Order Before Preparation
**Preconditions**: Order status is "placed" or "accepted", not yet "in preparation"
**Main Flow**: Customer selects order from history, clicks cancel, confirms cancellation reason
**Subflows**: System releases reserved inventory; initiates refund to original payment method
**Alternative Flows**: If order already in preparation, deny cancellation and suggest contacting support; if partial preparation started, offer partial cancellation

## 5. Handle Stock-Out During Order
**Preconditions**: Item in cart, inventory depleted before checkout completion
**Main Flow**: System detects stock-out, notifies customer, suggests similar items or wait time
**Subflows**: Update inventory display in real-time; log stock-out event for admin review
**Alternative Flows**: If no alternatives acceptable, allow partial order completion; if customer chooses to wait, create backorder with estimated restock time

## 6. Process Refund for Incorrect Order
**Preconditions**: Order delivered, customer reports issue within refund window
**Main Flow**: Customer submits refund request with reason and photo evidence; staff reviews and approves refund
**Subflows**: Calculate refund amount including taxes; update order status to "refunded"
**Alternative Flows**: If evidence insufficient, request additional information; if partial issue, process partial refund; if refund window expired, offer store credit

## 7. Mark Order Ready for Delivery
**Preconditions**: Staff assigned to order, all items prepared
**Main Flow**: Staff scans/selects order, verifies all items packed, marks as "ready for delivery"
**Subflows**: System notifies assigned delivery person; updates customer with preparation complete status
**Alternative Flows**: If items missing, flag inventory discrepancy and notify admin; if quality issue detected, remake item and adjust prep time

## 8. Apply Tax Holiday Exemption
**Preconditions**: Active tax holiday configured, qualifying items in cart
**Main Flow**: System detects tax holiday dates, identifies exempt categories, removes applicable taxes
**Subflows**: Log tax holiday application with rule version; display savings on receipt
**Alternative Flows**: If holiday ends during checkout, apply current tax rules and notify customer; if partial day holiday, check timestamp for eligibility

## 9. Track Real-Time Delivery Status
**Preconditions**: Order out for delivery, GPS enabled on delivery device
**Main Flow**: Customer views order status page showing delivery person location and ETA
**Subflows**: Update location every 30 seconds; send notification when delivery person arrives
**Alternative Flows**: If GPS signal lost, show last known location with timestamp; if delivery delayed beyond threshold, auto-notify customer with new ETA

## 10. Override Pricing for Special Event
**Preconditions**: Admin privileges, valid override reason
**Main Flow**: Admin selects items, applies temporary price override with expiration date and reason
**Subflows**: Log override action with admin ID and timestamp; notify affected staff of pricing change
**Alternative Flows**: If override conflicts with existing promotion, prompt for resolution; if expiration date invalid, require correction

## 11. Report Allergen Contamination
**Preconditions**: Staff preparing order, allergen risk identified
**Main Flow**: Staff flags order item with contamination risk, selects allergen type, notifies customer
**Subflows**: System checks customer allergen preferences; logs incident for health compliance
**Alternative Flows**: If customer has severe allergy on file, halt order and require confirmation; if alternative preparation possible, offer remake option

## 12. Calculate Local Soda Surcharge
**Preconditions**: Order contains beverages, local surcharge rules configured
**Main Flow**: System identifies sugary beverages, calculates per-ounce surcharge, adds to order total
**Subflows**: Display surcharge as separate line item; update based on size selection
**Alternative Flows**: If diet/sugar-free variant, exempt from surcharge; if bulk order, apply commercial rate if configured

## 13. Schedule Advance Delivery
**Preconditions**: Customer logged in, selected future date within allowed window
**Main Flow**: Customer selects delivery date/time, places order with scheduled status
**Subflows**: Send reminder notification 1 hour before preparation; reserve delivery slot
**Alternative Flows**: If selected time becomes unavailable, notify customer and request reschedule; if menu changes before delivery date, confirm or modify order

## 14. Manage Dietary Restriction Profile
**Preconditions**: Customer account active
**Main Flow**: Customer adds dietary restrictions (vegan, gluten-free, allergies) to profile
**Subflows**: System filters menu display based on restrictions; warns if restricted items added to cart
**Alternative Flows**: If restriction conflicts with saved favorites, prompt to update favorites; if no compliant items available for category, display notice

## 15. Process Split Payment
**Preconditions**: Order total exceeds single payment method limit or customer requests split
**Main Flow**: Customer allocates order total across multiple payment methods
**Subflows**: Validate each payment method; process sequentially with rollback capability
**Alternative Flows**: If one payment fails, reverse successful charges and retry; if partial payment abandoned, save cart state for completion

## 16. Generate Tax Audit Report
**Preconditions**: Admin privileges, date range selected
**Main Flow**: Admin requests tax report for specified period; system compiles all orders with tax calculations
**Subflows**: Include rule versions applied; separate by tax jurisdiction and category
**Alternative Flows**: If data volume exceeds threshold, generate in background and email link; if tax rules changed mid-period, segment report by rule version

## 17. Handle Delivery to Restricted Building
**Preconditions**: Delivery address requires special access
**Main Flow**: System identifies restricted location, prompts customer for access instructions or alternate meeting point
**Subflows**: Notify delivery person of special instructions; add extra time to delivery estimate
**Alternative Flows**: If access denied at delivery, contact customer for resolution; if no response, return order and process refund

## 18. Apply Bulk Order Discount
**Preconditions**: Order meets minimum quantity/amount threshold
**Main Flow**: System automatically applies configured bulk discount percentage or amount
**Subflows**: Display discount on each qualifying item; recalculate if items removed from cart
**Alternative Flows**: If just below threshold, suggest items to add for discount; if multiple discounts available, apply most favorable

## 19. Substitute Unavailable Item
**Preconditions**: Ordered item out of stock, substitution rules configured
**Main Flow**: System suggests equivalent items based on price/category; customer approves substitution
**Subflows**: Adjust price if substitute differs; note substitution on receipt
**Alternative Flows**: If no acceptable substitute, offer partial order or full cancellation; if customer has substitution preferences saved, auto-apply

## 20. Report Equipment Failure
**Preconditions**: Staff logged in, equipment issue affecting orders
**Main Flow**: Staff reports equipment failure, selects affected menu items, estimates repair time
**Subflows**: System marks affected items as temporarily unavailable; notifies customers with pending orders
**Alternative Flows**: If critical equipment, suspend all orders and notify admin; if partial capacity, adjust preparation times

## 21. Process Tax-Exempt Organization Order
**Preconditions**: Organization has tax-exempt certificate on file
**Main Flow**: Authorized user places order under organization account; system applies tax exemption
**Subflows**: Validate certificate expiration; log exemption application for audit
**Alternative Flows**: If certificate expired, prompt for renewal; if partial exemption (some items not covered), apply selectively

## 22. Handle Peak Hour Surge Pricing
**Preconditions**: Time within configured peak hours, surge pricing enabled
**Main Flow**: System applies surge multiplier to delivery fee and/or item prices
**Subflows**: Display surge notification prominently; show regular vs. surge pricing
**Alternative Flows**: If customer has surge-exempt status (staff, VIP), waive surge pricing; if order scheduled outside peak, use normal pricing

## 23. Validate Nutritional Supplement Tax
**Preconditions**: Order contains items classified as dietary supplements
**Main Flow**: System applies appropriate supplement tax rate based on jurisdiction
**Subflows**: Separate supplement items on receipt; include required health disclaimers
**Alternative Flows**: If prescription on file, apply medical exemption; if bulk purchase for resale, apply wholesale exemption

## 24. Manage Delivery Driver Assignment
**Preconditions**: Orders ready for delivery, drivers available
**Main Flow**: System assigns orders to drivers based on location proximity and capacity
**Subflows**: Optimize route for multiple deliveries; send assignment notification to driver app
**Alternative Flows**: If no drivers available, queue orders and notify customers of delay; if driver declines, reassign to next available

## 25. Process Contactless Delivery
**Preconditions**: Customer selects contactless option, delivery location accessible
**Main Flow**: Driver places order at specified location, takes photo confirmation, marks delivered
**Subflows**: Send photo and delivery notification to customer; start timer for customer retrieval
**Alternative Flows**: If location inaccessible, attempt customer contact for alternatives; if no safe drop-off location, return to store

## 26. Apply Student Meal Plan
**Preconditions**: Valid student ID linked to meal plan account
**Main Flow**: Student authenticates with ID, uses meal plan credits for eligible items
**Subflows**: Deduct credits from plan balance; show remaining balance after transaction
**Alternative Flows**: If insufficient credits, offer split payment with secondary method; if plan expired, prompt for renewal or alternative payment

## 27. Handle Multi-Restaurant Order
**Preconditions**: Campus has multiple restaurant partners in system
**Main Flow**: Customer adds items from different restaurants to single order
**Subflows**: Calculate delivery fee based on multiple pickups; coordinate preparation timing
**Alternative Flows**: If restaurants have conflicting delivery windows, split into separate orders; if one restaurant unavailable, offer partial order completion

## 28. Generate Health Inspection Report
**Preconditions**: Admin privileges, health inspection request
**Main Flow**: System compiles food safety data including temperatures, allergen incidents, and compliance logs
**Subflows**: Include staff food safety certifications; highlight any violations or near-misses
**Alternative Flows**: If incomplete data for period, flag gaps and provide partial report; if critical violation found, trigger immediate notification

## 29. Process Catering Order
**Preconditions**: Customer requests catering service, minimum order met
**Main Flow**: Customer specifies event details, selects catering menu items, confirms setup requirements
**Subflows**: Calculate volume pricing; assign dedicated prep team; schedule delivery and setup
**Alternative Flows**: If date conflicts with existing catering, suggest alternatives; if special dietary requirements, customize menu options

## 30. Execute Emergency Store Closure
**Preconditions**: Admin privileges, emergency situation identified
**Main Flow**: Admin initiates emergency closure, system halts new orders, notifies affected customers
**Subflows**: Process automatic refunds for unfulfilled orders; update store status across all channels
**Alternative Flows**: If partial closure (limited menu), update available items only; if temporary closure, allow scheduled reopening with customer notifications