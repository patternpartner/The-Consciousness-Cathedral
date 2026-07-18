# Pre-registration — the LLM rollout-plan run (the flag's plan half, inside approximation)

*2026-07-18. Committed BEFORE any text is generated. This document, the frozen topic list (`validation/llm-plan-topics.json`), its derivation script (`validation/derive-llm-plan-topics.js`), and the evaluation harness with its gates (`validation/llm-plan-validation.js`) are the pre-registration; the generated corpus and results land in a later commit. The isolation design, its three contamination channels, and the disclosed-not-eliminated third channel are identical to the runbook run's pre-registration ([LLM-RUNBOOK-PREREG.md](LLM-RUNBOOK-PREREG.md)) and are not restated here — this document records only what differs.*

## What this run asks

The v3.34.0 runbook run measured one half of the ledgered flag ("a model asked to *write a runbook*") and found the generator writes **more** bound operational structure than the human baseline, all of it structural. This run measures the other half — **a model asked to write a rollout plan** — and it aims at a more consequential register: the flagship's own. The README's headline forward-looking use case is evaluating **agent plans before execution**; this run is the first direct measurement of what LLM-written plans earn from the evaluator. It is also, by construction, a live probe of **decision 1's monitored boundary**: token-dense plan prose is precisely the genre where the accepted count-route residue lives, and generated plans for KEP features are as close to that genre as inside generation can get.

**Topics, mechanical:** the feature names of the KEP register the program already measured — every `keps/sig-*/<dir>/README.md` at the KEP run's own pinned SHA (`996e7d41`), directory basename with numeric prefix stripped and dashes spaced, deduped, sorted, seeded (20260717), first 120 of 611. The human documents for these same features measure family **11.6%** (mandated PRR), against 0.8% for the same template unenforced (OpenShift enhancements) and 0.5–0.6% for design plans. Authorship-paired on the plan side, as the runbook run was on the alert side.

## Generation protocol (frozen; differences from the runbook run only)

- **Generator:** `claude-sonnet-5`, cold subagents, **8 batches × 15 topics = 120 documents**, same batching disclosure.
- **Prompt template, verbatim** (the only text a generation context receives, plus its 15 feature names):

  > You are an experienced platform engineer writing internal documentation for your team. For each of the features listed below, write the rollout plan you would write for deploying that feature to your organization's production Kubernetes fleet. Write naturally, using whatever structure you consider standard for a rollout plan; there is no length requirement. Do not use any tools, do not search for anything, and do not ask questions — just write from your own experience of what such a plan should say. Begin each plan with a line of exactly this form: `=== PLAN: <feature name> ===`. Output only the plans.

  Deliberately absent: any mention of thresholds, monitoring, rollback, failure modes, or anything the evaluator credits or penalizes. "Rollout plan" names the genre and nothing more; whatever sections the generator considers standard for that genre are the measurement.
- **No cherry-picking, no length constraint, verbatim committed corpus** — identical rules to the runbook run.

## Pre-registered gates

Evaluator **unmodified** (v3.27.0 lineage). Preprocessing, thresholds, shuffle control verbatim from prior runs.

- **V1-PLAN:** `OUTSIDE DESIGN SPACE` < 5% AND gaming-flagged < 10%. Same form and readings as V1-GEN.
- **S-PLAN — what do generated plans earn, three readings pre-stated** (operational-family rate, against 11.6% mandated / 0.8% unenforced / 0.5–0.6% design):
  - **≤ 3%** → *generated plans bind like design documents*: planfulness without operational binding; the mandate-vs-genre distinction survives on machine text.
  - **3–15%** → *elevated toward the mandated band — adjudicated per-positive by G8-STRUCT*: if structural, the pre-stated reading is that **a model asked for a rollout plan voluntarily writes the bound structure the PRR questionnaire mandates** — a genre-reconstruction finding continuous with the runbook result, and directly relevant to what agent plans will measure as; if vocabulary-retained, an evaluator defect on machine plan prose, ledgered as such.
  - **> 15%** → *above the mandated register itself*: no interpretation before a per-positive audit (which routes earned each verdict, count-route share, shuffle profile) and an explicit decision-1 boundary review.
- **G8-STRUCT:** standing shuffle control (20 seeded shuffles per positive), pooled < 20% → PASS. **Pre-stated boundary probe:** any per-text ≥ 10/20 **fires decision 1's reopening condition** on fresh data — that is not a side observation of this run, it is one of its purposes. Worst text reported regardless. Zero positives passes vacuously.
- **Reported, no gate:** verdict distribution; `OPERATIONALLY SOUND` vs `OPERATIONAL INTENT` split (the flagship's routes matter here, not just the family); length distribution; count-route share of any flagship verdicts.
- **NOT pooled into G2-EXT** (authorship rule). Development data from evaluation onward.

## What this run can and cannot claim

Same inside-approximation caveats as the runbook run, verbatim (model family, environment proximity, instructed-not-proven tool non-use, batch-shared contexts, n = 120). Whatever S-PLAN lands on, the pure outside form of the flag — plans from any model, prompted by someone who has not read this repository — remains open and is restated in the findings.
