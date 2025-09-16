# Reflection – Project 1b2 MVP

## Deciding What Not To Do
In Project 1b1, we designed 30 use cases covering a wide range of WolfCafe workflows, including advanced payment types, tax/regulation handling, administrative tasks, and edge cases. For the MVP, our guiding principle was to keep only the workflows essential to learning whether customers will actually use WolfCafe for core ordering and fulfillment.

We excluded:
- **Complex payments** such as SNAP/EBT, split payments, and multi-currency support.  
- **Regulatory and taxation scenarios** like jurisdiction-specific rules or holiday surcharges.  
- **Administrative tasks** such as inventory management, scheduling, and audit logs.  
- **Edge cases** such as allergen incident handling, refunds after delivery, and substitution flows.  

These features add engineering cost but do not increase validated learning at the MVP stage. The minimal system focuses on core customer behavior: placing orders, paying, and receiving them.

## Negative Stakeholder Impacts
Restricting scope introduces several risks:
- **Customers:** Users relying on SNAP/EBT or non-card payments are excluded. Customers with allergies may view the system as unsafe.  
- **Restaurant Staff:** Without inventory or scheduling tools, staff must update availability manually, creating possible mismatches.  
- **Administrators:** No tax or compliance features means management cannot rely on the system for reporting or auditing.  
- **Drivers:** Driver workflows are minimal (assignment and delivery), leaving out substitution or customer communication features.  

These gaps may frustrate certain stakeholders, but they are acceptable tradeoffs for an MVP.

## Adjustments Made to Appease Stakeholders
Some concessions were made to reduce disappointment while keeping the MVP minimal:
- **Promo Codes Retained:** A simple promotion feature supports both marketing needs and customer appeal at low development cost.  
- **Pickup and Delivery Both Supported:** Covering both on-campus and off-campus customers maximizes the learning value of early deployments.  
- **Basic Failure Handling Included:** Payment retry and pre-preparation cancellation flows increase trust without implementing full refund or dispute systems.  

In summary, the MVP is deliberately incomplete, but it delivers the minimal set of workflows necessary to validate core customer demand. Excluded areas are known gaps to be addressed in future iterations once real usage is observed.