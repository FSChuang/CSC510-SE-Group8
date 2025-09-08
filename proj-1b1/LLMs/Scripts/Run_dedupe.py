from openai import OpenAI
import pathlib, os

BASE = pathlib.Path(__file__).resolve().parents[1]
PROMPTS = BASE / "Prompts"
OUT_DIR = BASE / "Outputs"
client = OpenAI()

dedupe_prompt = (PROMPTS / "Dedupe_prompt.md").read_text(encoding="utf-8")

set_a = (OUT_DIR / "Chatgpt_careful.md").read_text(encoding="utf-8")
set_b = (OUT_DIR / "Claude_careful.md").read_text(encoding="utf-8")

combined = f"""{dedupe_prompt}

Inputs:
Set A:
{set_a}

Set B:
{set_b}
"""

resp = client.chat.completions.create(
    model="gpt-5",
    messages=[{"role": "user", "content": combined}],
)

final = resp.choices[0].message.content
(OUT_DIR / "Merged_final.md").write_text(final, encoding="utf-8")