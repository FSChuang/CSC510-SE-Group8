import os, csv, datetime, pathlib
from openai import OpenAI

# --------- config ---------
MODEL = os.getenv("OPENAI_MODEL", "gpt-5") 
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"] 

client = OpenAI()

BASE = pathlib.Path(__file__).resolve().parents[1]  # -> LLMs/
PROMPTS = BASE / "Prompts"
MATERIALS_PATH = BASE / "Materials" / "Materials.md"

INPUTS_PATH = BASE / "Inputs" / "Usecases_1a1.md"
inputs = INPUTS_PATH.read_text(encoding="utf-8")

OUT_DIR = BASE / "Outputs"
OUT_DIR.mkdir(parents=True, exist_ok=True)
COST_LOG = BASE / "Cost.csv"

def read(p: pathlib.Path) -> str:
    return p.read_text(encoding="utf-8")

def log_usage(llm: str, label: str, prompt_tokens, completion_tokens, notes: str = ""):
    ts = datetime.datetime.now().isoformat(timespec="seconds")
    new = not COST_LOG.exists()
    with COST_LOG.open("a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["timestamp","llm","mode","input_tokens","output_tokens",
                        "unit_cost_in","unit_cost_out","est_cost_usd","notes"])
        w.writerow([ts, llm, label, prompt_tokens, completion_tokens, "", "", "", notes])

def run(label: str, *sections: str) -> str:
    content = "\n\n".join(s.strip() for s in sections if s and s.strip())
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role":"user","content": content}],
    )
    text = resp.choices[0].message.content or ""
    (OUT_DIR / f"Chatgpt_{label}.md").write_text(text, encoding="utf-8")

    usage = getattr(resp, "usage", None)
    if usage:
        log_usage("ChatGPT", label,
                  getattr(usage, "prompt_tokens", ""),
                  getattr(usage, "completion_tokens", ""),
                  f"model={MODEL}")
    return text

if __name__ == "__main__":
    materials = read(MATERIALS_PATH)

    # Zero-shot
    zs_prompt = read(PROMPTS / "Zero_shot_prompt.md")
    run("zero", zs_prompt, "## Materials\n" + materials)

    # Careful (training + careful + materials)
    training = read(PROMPTS / "Training_usecase.md")
    careful = read(PROMPTS / "Careful_prompt.md")
    run("careful", training, careful, "## Materials\n" + materials)

    # Gap analysis
    gap = read(PROMPTS / "Gap_analysis_prompt.md")
    run("missing", gap, "## 1a1 Baseline\n" + inputs, "## Materials\n" + materials)
