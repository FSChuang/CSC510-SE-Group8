# Project 1b1 — Problem Amplification (CSC 326)

This repository contains the deliverables and supporting workflow for **Project 1b1**, which expands on Project 1a1 by amplifying the scope of use cases for the WolfCafe food delivery system.

---

## Project Overview

- **Objective:**  
  Extend the baseline set of 10 use cases from Project 1a1 into a comprehensive set of 30+ use cases.  
  Use Large Language Models (LLMs) to identify missing scenarios, generate new use cases, and compare results under different prompting strategies.

- **LLMs Used:**  
  - ChatGPT (OpenAI)  
  - Claude (Anthropic)  

- **Prompting Strategies Compared:**  
  - **Zero-shot:** Directly requesting use cases with minimal instruction.  
  - **Careful prompting:** Providing LLMs with training on use case format, detailed materials, and explicit coverage requirements.

- **Focus Areas:**  
  - Core WolfCafe operations (ordering, delivery, staff workflows).  
  - Payment variations (card, EBT/SNAP, split payments, promotions).  
  - Regulatory/taxation rules (jurisdictions, exemptions, surcharges, holidays).  
  - Administrative tasks (menu, inventory, scheduling, audits).  
  - Edge cases (refunds, substitutions, allergen incidents, delays).

---

## Repository Structure

proj-1b1/
├── LLMs/ # Working directory with prompts, scripts, and raw outputs
├── p1b1.pdf # Final deliverable with 30+ curated use cases
└── README.md # Project documentation (this file)


---

## Workflow Summary

1. **Materials preparation**  
   WolfCafe system description and tax/health rules were compiled into a structured `Materials.md` file.

2. **Prompt engineering**  
   Prompts were written in Markdown (`Prompts/`) to train LLMs on what a use case is and to request both zero-shot and careful outputs.

3. **LLM experiments**  
   Scripts (`Scripts/Run_openai.py`, `Run_anthropic.py`) called the APIs for ChatGPT and Claude, generating:  
   - `*_zero.md` → zero-shot results  
   - `*_careful.md` → careful prompting results  
   - `*_missing.md` → gap analysis results

4. **Merging & deduplication**  
   A dedupe prompt/script combined outputs into one list, ensuring at least 30 distinct use cases.

5. **Curation**  
   Final outputs were edited for clarity, format compliance, and coverage, then compiled into `p1b1.pdf`.

---

## Cost

- **Claude (Anthropic):** $0.67  
- **ChatGPT (OpenAI):** $0.47  
- **Total:** **$1.14**  

This is well below the $80 budget guideline (≈$20 per team member).

---

## Deliverables

- **p1b1.pdf** → Final curated set of 30+ use cases, with preconditions, main flows, subflows, and alternative flows.  
- **LLMs/** → Supporting materials, prompts, scripts, raw outputs, and cost logs (not required for submission but included for reproducibility).  

---

## Reflection (Summary)

- **ChatGPT:** Stronger at format compliance; careful prompting yielded consistent four-section outputs.  
- **Claude:** Broader coverage and creativity; careful prompting improved structure but produced overlaps.  
- **Zero-shot vs careful:** Careful prompting clearly outperformed zero-shot in both structure and completeness.  
- **Conclusion:** Best results came from using ChatGPT for structure and Claude for coverage, then merging the two.