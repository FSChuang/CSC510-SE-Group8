# LLMs — CSC 326 Project 1b1

This repository contains the full workflow for generating, analyzing, and curating use cases for the **WolfCafe food delivery system** using Large Language Models (LLMs).

---

## Directory Structure
```text
LLMs/
├── Materials/               # Context materials provided to LLMs
│   └── Materials.md         # WolfCafe system description + tax/health rules
│
├── Prompts/                 # Prompt templates for different runs
│   ├── Training_usecase.md
│   ├── Zero_shot_prompt.md
│   ├── Careful_prompt.md
│   ├── Gap_analysis_prompt.md
│   └── Dedupe_prompt.md
│
├── Inputs/                  # Our deliverables from Project 1a1
│   └── Usecases_1a1.md
│
├── Scripts/                 # Python scripts to run API experiments
│   ├── Run_openai.py        # Calls ChatGPT (OpenAI)
│   ├── Run_anthropic.py     # Calls Claude (Anthropic)
│   └── Run_dedupe.py        # Merges/deduplicates outputs
│
├── Outputs/                 # Raw model outputs
│   ├── Chatgpt_zero.md
│   ├── Chatgpt_careful.md
│   ├── Chatgpt_missing.md
│   ├── Claude_zero.md
│   ├── Claude_careful.md
│   ├── Claude_missing.md
│   └── Merged_final.md
│
├── Use_cases_v2.md          # Final curated list of ≥30 use cases
├── Reflection.md            # Half-page reflection comparing models/prompts
├── Cost.csv                 # Token/cost log
└── README.md                # This file
javascript
Copy code

---

## Setup

### Requirements
- Python 3.9+
- Install dependencies:
  ```bash
  pip install openai anthropic
API keys:

OpenAI API Key

Anthropic API Key

Temporary environment variables (Anaconda Prompt on Windows)
cmd
Copy code
set OPENAI_API_KEY=sk-...
set ANTHROPIC_API_KEY=sk-ant-...
(These are temporary and last only for the session — safe for testing.)

Running the workflow
1. Generate use cases
cmd
Copy code
python Scripts\Run_openai.py
python Scripts\Run_anthropic.py
Produces zero-shot, careful, and gap-analysis outputs for ChatGPT and Claude.

Saves results in Outputs/.

Appends token counts to Cost.csv.

2. Merge & deduplicate
cmd
Copy code
python Scripts\Run_dedupe.py
Merges ChatGPT and Claude outputs using Prompts/Dedupe_prompt.md.

Saves final merged set to Outputs/Merged_final.md.


Cost Expectation
Estimated total usage for all APIs runs is <$1 (well under the $80 team budget).
Cost.csv provides actual token counts for transparency.
