import os, csv, datetime, pathlib
from anthropic import Anthropic

# --------- config ---------
MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-4-1-20250805")
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"] 

client = Anthropic()

BASE = pathlib.Path(__file__).resolve().parents[1] 
PROMPTS = BASE / "Prompts"
MATERIALS_PATH = BASE / "Materials" / "Materials.md"

INPUTS_PATH = BASE / "Inputs" / "Usecases_1a1.md"
inputs = INPUTS_PATH.read_text(encoding="utf-8")

OUT_DIR = BASE / "Outputs"
OUT_DIR.mkdir(parents=True, exist_ok=True)
COST_LOG = BASE / "Cost.csv"

def read(p: pathlib.Path) -> str:
    return p.read_text(encoding="utf-8")

def log_usage(llm: str, label: str, input_toks, output_toks, notes: str = ""):
    ts = datetime.datetime.now().isoformat(timespec="seconds")
    new = not COST_LOG.exists()
    with COST_LOG.open("a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["timestamp","llm","mode","input_tokens","output_tokens",
                        "unit_cost_in","unit_cost_out","est_cost_usd","notes"])
        w.writerow([ts, llm, label, input_toks, output_toks, "", "", "", notes])

def run(label: str, *sections: str) -> str:
    content = "\n\n".join(s.strip() for s in sections if s and s.strip())
    resp = client.messages.create(
        model=MODEL,
        max_tokens=4000,
        temperature=0.2,
        messages=[{"role":"user","content": content}],
    )
    text = "".join(part.text for part in resp.content if getattr(part, "type", "") == "text")
    (OUT_DIR / f"Claude_{label}.md").write_text(text, encoding="utf-8")

    usage = getattr(resp, "usage", None)
    input_toks = getattr(usage, "input_tokens", "") if usage else ""
    output_toks = getattr(usage, "output_tokens", "") if usage else ""
    log_usage("Claude", label, input_toks, output_toks, f"model={MODEL}")
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
