# CSC 510 – Project 1c1

## Overview
This repository contains the deliverables for **Project 1c1**, which builds on the earlier work from Project 1b1. The goal of this stage was to define a **Minimal Viable Product (MVP)** for the WolfCafe system by narrowing the original 30+ use cases down to 10 core cases. The process emphasized validated learning with minimal engineering effort.

## Deliverables
- **1c1.pdf**  
  Final compiled report containing the 10 MVP use cases in LaTeX/PDF format.

- **reflection.md**  
  Reflection document (≤2 pages) describing:
  - How we decided what not to include in the MVP.  
  - Potential disappointments for stakeholders.  
  - Adjustments made to appease stakeholders.

- **log.txt**  
  Reconstructed prompt history. Documents how commercial LLMs (ChatGPT, Claude) and local runs were used to brainstorm, refine, and converge on the final MVP set. Includes evidence of iteration, disagreements, and corrections.

- **README.md**  
  This project description file.

## Workflow Summary
1. **Review of 1b1**  
   Started with 30+ use cases covering ordering, payments, delivery, staff workflows, admin, and compliance.

2. **Candidate Generation with LLMs**  
   Asked ChatGPT and Claude independently to generate ~15–20 best candidates from 1b1.  

3. **Overlap Selection**  
   Compared results and extracted the 10 overlapping use cases, representing consensus between systems.

4. **Expansion & Formatting**  
   Expanded the 10 selected use cases into structured detail (Preconditions, Main Flow, Subflows, Alternative Flows).  
   Finalized in LaTeX for consistent formatting.

5. **Reflection & Logging**  
   Wrote reflection.md to document reasoning and trade-offs.  
   Logged prompts and responses in log.txt, including reconstruction where necessary.

## MVP Focus
The final MVP includes only essential workflows:
- Customer orders (web, mobile, kiosk)  
- Card payment and promotions  
- Order modification/cancellation  
- Kitchen preparation and delivery fulfillment  
- Scheduling and delay management  
- Delivery instructions and post-delivery tips  

Excluded areas: complex payment types (SNAP/EBT, split), taxation/regulatory cases, refunds, allergens, and admin reporting.

## Authors
Group 08 – CSC 510  
- Christopher Lee (cdlee3)  
- Kunj Patel (kapatel7)  
- Fan-Sheng Chuang (fchuang2)  
- Raj Ajay Vaidya (rvaidya3)  
