# Pre-registration: the autonomy run

**Status:** committed before any corpus verdict is computed under the loop.
**Harness:** `validation/progression-autonomy-validation.js` (committed alongside this document; gates encoded in the exit condition).
**Corpora:** the two committed generation corpora — `validation/corpus-llm-runbooks.json` (120 runbooks, v3.34.0) and `validation/corpus-llm-plans.json` (120 rollout plans, v3.35.0). Both are development data by their own ledger entries; that is fine here, because **this run does not measure a register — it measures the loop.** The corpora serve as a fixed, committed, offline-reproducible stream of real operational documents.

## The question

v3.38.0–v3.39.0 gave the system full autonomy: the progression loop observes every analysis, and when its memory implies a calibration change it applies the change itself — ledgered, stamped, clamped, attributable, reversible. That contract is unit-tested (9 cases in `run-progression-tests.js`), **but it has never been measured on real documents.** Every register certificate in this repository describes the factory instrument; the Unified 2.0 page serves self-calibrated verdicts. The owed measurement is the gap between those two sentences:

> Over a long run of real documents, what does the autonomous loop actually do — how many self-changes, settling where, moving how many verdicts, in which direction — and does the self-calibrated instrument still support the register story the certificates tell?

## Protocol

The harness replays the exact shipped loop (`cathedral-unified-2.html` operational room): for each document, **analyze under the current active calibration → `observe(result)` → `act()`**. Fresh in-memory store; forward order = runbooks in corpus order, then plans in corpus order. Preprocessing (`stripMarkdown`, minimum 500 prose chars) copied verbatim from the two corpus runs. Deterministic given the committed corpora: the core has no clock and no randomness, and the loop's state is a pure function of the observation stream.

Four passes:

1. **Factory pass** — every document through `analyzeCathedral(text)` with no opts. The baseline the certificates describe.
2. **Sequential pass (forward)** — the shipped loop, recording at every step: the active multiplier map, the stamp, the verdict, and every ledger entry `act()` writes.
3. **End-state pass** — every document re-evaluated under the final self-set calibration. This is what a long-lived device would serve.
4. **Sequential pass (reverse)** — the same loop with the document order reversed, end states compared.

## Pre-registered gates

**A1 — ENVELOPE.** The contract's mechanical clauses, pinned on real data rather than curated cases: (a) every multiplier the system ever applies lies in January's clamp `[0.8, 1.2]`; (b) every change to the active map corresponds one-to-one to an appended ledger entry carrying an evidence sentence; (c) after the final observation, a further `act()` is a no-op (the state is a fixed point of its own memory). PASS requires all three.

**A2 — ATTRIBUTION.** No silent change, measured: every document whose sequential verdict differs from its factory verdict must (a) carry a non-factory calibration stamp, and (b) be byte-reproducible — re-analyzing the same text under the recorded step state yields the identical full analysis (`JSON.stringify` equality, the `run-progression-tests.js` idiom). Ten additional seeded non-divergent documents get the same reproducibility check. PASS = 100% of checks.

**A3 — CERTIFICATE SURVIVAL.** Under the end-state calibration: (a) the runbook operational-family rate stays **< 10%** (must not cross into the band the v3.34.0 pre-registration labeled "authorship shortcut suspected"; factory: 4.2%); (b) the plan family rate stays **≤ 3%** (must keep v3.35.0's "binds like design documents" reading; factory: 0.0%); (c) `OUTSIDE DESIGN SPACE` and gaming-flag rates are **byte-identical to factory** on both corpora — calibration touches only Parliament pattern confidences, so the V1 instruments must be calibration-inert by construction; any movement is an instrument finding and a FAIL. Losing family verdicts is **not** gated: the program's stance is specificity over sensitivity, and a deflationary loop is a reportable finding, not a defect. Minting and destruction are both reported in a full factory → end-state transition table.

**A4 — PATH DEPENDENCE (reported, pre-stated readings, no gate).** January's formula computes calibration from order-independent running totals, so the *end-state* multipliers should be path-independent up to `act()`'s 0.005 dead-band: reverse-order end state within ±0.005 per pattern → "endpoint path-independent." The *trajectory* is necessarily path-dependent — which documents were analyzed under which calibration differs — so the per-order sequential divergence counts are reported side by side.

**Reported, no gate:** per-pattern table (samples, win rate, average confidence, final multiplier); step index of each pattern's first self-change; ledger length; the verdict transition table; the count and identity of operational-family verdicts destroyed or minted by the end-state calibration. Also reported honestly: the shipped `observe()` records each pattern twice per document (once under the gaming context, once under the binding context), so January's 5-sample floor is reached within ~3 documents — the run documents the shipped behavior, whatever it is.

## What would count as what

- **All gates PASS** → the autonomy contract holds outside the lab: self-calibration stays inside the clamp, explains every moved verdict, and the certified register story survives the self-calibrated instrument. The measured drift direction and magnitude become the documented cost/benefit of leaving autonomy on.
- **A1 or A2 FAIL** → the loudness contract has a hole the unit tests missed; that is a defect in `progression.js` or the v3.38.0 hook, to be fixed before the page keeps serving self-calibrated verdicts.
- **A3 FAIL** → autonomy corrupts a certified reading on real data; the freeze switch stops being a preference and becomes a recommendation, and the finding goes to the ledger before any fix.

No core changes ship with this run regardless of outcome. Results: `validation/results-progression-autonomy-validation.json`; findings: `docs/PROGRESSION-AUTONOMY-VALIDATION.md`.
