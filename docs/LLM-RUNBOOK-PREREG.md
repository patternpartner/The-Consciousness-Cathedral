# Pre-registration — the LLM-runbook run (the authorship flag's remaining face, inside approximation)

*2026-07-17. Committed BEFORE any text is generated. This document, the frozen topic list (`validation/llm-runbook-topics.json`), its derivation script (`validation/derive-llm-runbook-topics.js`), and the evaluation harness with its gates (`validation/llm-runbook-validation.js`) are the pre-registration; the generated corpus and results land in a later commit.*

## What this run is, and is not

Open flag 3's remaining face is **genuine LLM-written operational documents from an uninformed external generator** — a model asked to write a runbook, prompted by someone who has not read this repository. That pure form cannot be produced from inside this session, and this run does not claim to produce it. What it produces is a **disclosed approximation**, by decomposing "uninformed external" into three contamination channels and eliminating the two that can be eliminated:

1. **The generator's knowledge of the evaluator — eliminated.** Each generation context is a freshly spawned subagent containing only the writing prompt below. It has never seen the evaluator source, the ledger, the docs, or this pre-registration.
2. **The prompter's discretion — eliminated mechanically.** The session agent (the disclosed white-box attacker of v3.33.0) writes the prompt template, so the template is frozen here, verbatim, before generation; and the topics are derived by a committed mechanical rule (all alert names of the two byte-pinned human runbook corpora, deduped, sorted, seeded-shuffled with the standing seed 20260717, first 120) — no per-topic choice exists.
3. **Provable isolation and generator identity — NOT eliminated, disclosed.** The generator is `claude-sonnet-5`, the same model family as the white-box attacker; it runs in the same container as this repository (its environment header names the working directory, so the project *name* — though none of its content — is visible to it); and its non-use of tools is instructed, not provable from the final report alone. One model family is not "LLMs at large." These caveats go in the findings verbatim.

**The pairing is what the inside approximation buys.** The topics are the same alert names whose *human* runbooks the program already measured (prometheus-operator: family 1.6% on 62 effective docs; openshift: 2.0% on 256). Same topics, same document shape, authorship the only variable — a comparison the pure outside ask could not deliver.

## Generation protocol (frozen)

- **Generator:** `claude-sonnet-5`, via cold subagents. **8 batches × 15 topics = 120 documents.** Documents within a batch share one generation context (style correlation within batches is disclosed); batches are independent.
- **Prompt template, verbatim** (the only text a generation context receives, plus its 15 alert names):

  > You are an experienced SRE writing internal documentation for your team. For each of the alert names listed below, write an operational runbook, as you would for your team's wiki. Write naturally, using whatever structure you consider standard for a runbook; there is no length requirement. Do not use any tools, do not search for anything, and do not ask questions — just write from your own experience of what such a runbook should say. Begin each runbook with a line of exactly this form: `=== RUNBOOK: <AlertName> ===`. Output only the runbooks.

  Deliberately absent: any mention of thresholds, corrective actions, failure modes, structure the evaluator credits, or structure it penalizes. Also deliberately absent: a length constraint — whatever length the generator chooses is data (a length instruction chosen by an informed prompter could steer documents toward or away from the reference-length instruments).
- **No cherry-picking, frozen as a rule:** every generated document is evaluated. The only exclusions are mechanical — a document under 500 chars after the standard markdown strip, or a batch that mechanically failed to produce parseable output — and every exclusion is counted and reported. No regeneration of individual documents; a batch that fails mechanically may be re-run once as a whole (fresh context), with the re-run reported.
- **Stochasticity, disclosed:** generation is not deterministic and cannot be re-run to the same bytes. The committed corpus (`validation/corpus-llm-runbooks.json`, verbatim) is therefore the reproducibility object; evaluation is deterministic given the corpus (standing seed, seeded shuffles).

## Pre-registered gates

The evaluator is `cathedral-core.js`, **unmodified** (byte-identical to v3.27.0 lineage, as it has been since). Preprocessing, thresholds, and the shuffle control are copied verbatim from the prior runs.

- **V1-GEN — instruments are register-driven, not authorship-driven** (same form as the v3.30.0 V1-AI gate): `OUTSIDE DESIGN SPACE` < 5% AND gaming-flagged < 10%. PASS = the density/gaming instruments respond to text shape, not to a modern generator's runbook style. FAIL = machine runbook style trips an instrument — which one, diagnosed and ledgered.
- **S-GEN — the paired authorship question, three readings pre-stated.** The operational-family rate on 120 generated runbooks, against the human baseline on the same register (1.6% / 2.0%):
  - **≤ 3%** → *no authorship shortcut on matched topics*: the evaluator treats a model's runbook like a human's.
  - **3–10%** → *elevated — adjudicated per-positive by G7-STRUCT*: if the excess positives are structural (shuffle-destroyed), the pre-stated reading is that the generator **writes more bound operational structure than the human corpus contains** — a finding about LLM runbook-writing, not a defect; if they are vocabulary-retained, it is an authorship defect in the evaluator, ledgered as such.
  - **≥ 10%** → *authorship shortcut suspected*: full ablation required before any interpretation.
- **G7-STRUCT — generated positives must be structural:** standing word-shuffle control (20 seeded shuffles per positive), pooled retention < 20% → PASS; per-text worst reported against the 10/20 reference, which is also decision 1's reopening trigger. Zero positives passes vacuously.
- **Reported, no gate:** full verdict distribution; document length distribution (the human register is short; whether the generator's chosen lengths land in the tuned register or past the reference is itself worth recording).
- **NOT pooled into G2-EXT** (same rule as the v3.30.0 run: mixing authorship would change that instrument's meaning). This corpus is development data from the moment it is evaluated.

## What this run can and cannot close

If the gates pass, flag 3's remaining face narrows from "unmeasured" to "measured in a disclosed inside approximation; the pure outside form still open" — the standing outside ask (an external contributor's corpus, any model, their prompts) remains the most valuable possible contribution and is unaffected by this run. If S-GEN lands elevated-structural, the program gains a genuinely new finding either way. If a gate fails, the failure is published with its diagnosis, per standing practice.
