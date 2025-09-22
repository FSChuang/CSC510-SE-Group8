# Reflection on LLM Use in Projects 1a1–1c1

## 1. Pain Points in Using LLMs
One of the biggest problems we ran into with LLMs was inconsistency. Sometimes the same prompt gave different answers, and in the first project when we listed stakeholders, the model included roles that weren’t really useful. Another pain point was how long and wordy outputs were, which meant we had to trim them to fit the assignment. In 1c1, we also had to constantly correct the model when it ignored instructions, like excluding refunds or tax cases, and we spent extra time telling it to shorten sentences so the use cases matched the structured format we wanted.

## 2. Surprises in Using LLMs
Something that surprised us was how detailed the model could get when pointing out conflicts or biases, like customers wanting faster service versus staff preferring a sustainable pace. We also didn’t expect it to bring up so much domain-specific detail about taxes, EBT, and surcharges when writing use cases, even if we had to fact check them. In 1c1, another surprise was how different models approached the same task; ChatGPT and Claude gave different candidate lists for the MVP, and comparing them gave us confidence in the overlap set of 10 use cases we eventually selected.

## 3. What Worked Best
The most effective thing we did was use structured prompts with a clear format of preconditions, main flow, subflows, and alternatives. This made the results consistent and easier to edit. Breaking prompts into smaller categories like customer, staff, and admin also gave us better coverage, and iterating with drafts helped refine outputs. In 1c1, comparing ChatGPT’s and Claude’s lists and only keeping overlaps worked well because it highlighted the truly essential use cases and saved us from debating every single option.

## 4. What Worked Worst
The worst approach was zero-shot prompting, where asking for a list of stakeholders or use cases without context gave vague or repetitive results. Long, multi-part prompts were also ineffective since the model would drop parts of the request or mix them together. In 1c1, the worst strategy was letting the model “pick the best” cases because it ignored our rules and added back things we didn’t want, which forced us to step in and reorganize the MVP manually.

## 5. Useful Pre- and Post-Processing
Pre-processing was really important because summarizing what we wanted and setting constraints kept the model focused, and even role assignment like “act as a requirements engineer” helped. Post-processing was just as critical since we had to condense, remove duplicates, and simplify outputs to make them usable. In 1c1, post-processing also included rewriting every step into one short action per line, and finally formatting the document into LaTeX so it looked consistent and professional.

## 6. Best and Worst Prompting Strategies
The best strategies were few-shot prompting, where showing one or two examples led to better results, and progressive refinement, where we started broad and then narrowed down with follow-ups. The worst strategies were open-ended brainstorming without structure and trying to get the model to do too much at once, which led to messy results. In 1c1, the most effective strategy was forcing the model to stick to a rigid format and rejecting outputs until it complied, while the least effective was asking it to make judgment calls about MVP selection, since it didn’t follow constraints.

## Conclusion
Overall, these projects showed us that LLMs are helpful but far from perfect. They sped up brainstorming and expanding ideas, but they struggled with consistency, prioritization, and avoiding redundancy. We learned that the best way to use them is like a teammate who needs clear instructions, examples, and feedback. When guided with structure and iteration, they saved us time and effort, but when left unguided, they tended to drift or overproduce. The 1c1 project in particular showed how important it was to refine prompts, compare outputs across models, and clean up results with heavy post-processing before they were usable.
