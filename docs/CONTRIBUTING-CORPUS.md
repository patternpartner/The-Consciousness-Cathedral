# Contributing a Corpus — the standing outside ask, made drop-in

*The register program's most valuable missing data cannot be produced from inside this repository, by construction: **operational documents (runbooks, rollout plans, incident procedures) written by a model, prompted by someone who has not read this repo.** Both inside approximations exist ([LLM-RUNBOOK-VALIDATION.md](LLM-RUNBOOK-VALIDATION.md): generated runbooks earn the operational family at 4.2%, double the human baseline, all structural; [LLM-PLAN-VALIDATION.md](LLM-PLAN-VALIDATION.md): generated rollout plans earn 0.0%) — but the prompter in both was the repo's own session agent, and the generator one model family. Your corpus removes those caveats. This document is everything you need.*

## Why "hasn't read this repository" matters

The evaluator scores structure, and anyone who knows *which* structure could — consciously or not — steer prompts toward or away from it. The inside runs neutralized this with frozen templates and mechanical topic lists; a genuinely outside prompter neutralizes it by construction. Best is a prompter who has never opened this repo. Second-best is honesty: state exactly what the prompter had read, and the finding is published with that disclosure.

## The protocol (mirrors the inside runs — deviations are fine if disclosed)

1. **Pick a model.** Any model. Different families from `claude-sonnet-5` add the most value.
2. **Write a natural prompt.** "Write an operational runbook for the alert X" / "Write the rollout plan for deploying Y." Do **not** coach structure (no "include thresholds and corrective actions" — and no "avoid" either). The genre name and the topic are the prompt.
3. **Pick topics mechanically if you can** (alert names from a public runbook repo, feature names from a changelog) — it removes your own topic discretion and enables paired comparison. Free choice is acceptable if disclosed.
4. **No cherry-picking.** Every generated document goes in the corpus. If something must be excluded (empty output, truncation), count it and say so. Do not regenerate individual documents to get "better" ones.
5. **50+ documents** makes the rates meaningful; 100+ matches the inside runs. Fewer is still publishable with wider error bars.

## The format

One JSON file:

```json
{
  "generator": "the model that wrote the documents (exact name/version)",
  "prompter": "who wrote the prompts, and what of this repo they had read (ideally: nothing)",
  "protocol": "the prompt template verbatim, topic selection rule, and any exclusions with counts",
  "documents": [
    { "id": "unique-id-1", "text": "the verbatim document, markdown fine" }
  ]
}
```

## The evaluation — pre-registered before your corpus existed

Run it yourself; no setup beyond Node:

```bash
node validation/external-corpus-validation.js your-corpus.json
```

The harness is the same unmodified evaluator and instrument battery as every register run, and its gates were **committed to git before any external corpus existed** — so your submission is evaluated under rules fixed in advance, not chosen after seeing your data:

- **V1-EXT** — `OUTSIDE DESIGN SPACE` < 5% and gaming-flagged < 10% (the instruments respond to text shape, not authorship — this has held on eleven registers).
- **S-EXT** — the operational-family rate, reported against the register-resolved baselines (human runbooks 1.6–2.0%; mandated-questionnaire plans 11.6%; design plans 0.5–0.8%; inside-generated runbooks 4.2%; inside-generated plans 0.0%). There is no pass/fail band: whatever your rate is, it's a finding.
- **G-EXT-STRUCT** — every positive gets 20 seeded word-shuffles; pooled retention < 20% means the verdicts are structural. Any single text retaining ≥ 10/20 fires the reopening condition of [REGISTER-DECISIONS.md](REGISTER-DECISIONS.md) decision 1 — which would make your corpus the most consequential submission possible.

The run is deterministic given your corpus (standing seed), so your numbers and the maintainer's will match byte-for-byte.

## Submitting

Open an issue or PR with the corpus JSON and the results JSON the harness wrote. Whatever the numbers are — confirming the inside results, contradicting them, or tripping an instrument — the outcome is published in the ledger with your provenance block verbatim, following the same rule every run in [REGISTER-PROGRAM.md](REGISTER-PROGRAM.md) has followed: every failure published as a failure. A corpus that breaks the evaluator is worth more than one that flatters it.
