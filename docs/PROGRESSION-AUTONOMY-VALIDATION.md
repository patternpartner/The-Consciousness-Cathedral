# The autonomy run: the self-calibrating loop meets real documents

**Pre-registration:** `docs/PROGRESSION-AUTONOMY-PREREG.md`, committed with the harness at `dcd2138` before any corpus verdict was computed under the loop.
**Harness:** `validation/progression-autonomy-validation.js` — the shipped Unified 2.0 protocol replayed verbatim (analyze under active calibration → `observe` → `act`, per document) over the 240 committed real operational documents (`corpus-llm-runbooks.json` + `corpus-llm-plans.json`). Evaluator and loop imported unmodified. Deterministic; results in `validation/results-progression-autonomy-validation.json`.

## Verdict on the gates: all PASS

| Gate | Result |
|---|---|
| A1-ENVELOPE | **PASS** — 0 clamp violations, 0 unledgered active-map changes, 0 evidence-less ledger entries, fixed point after the final observation; 11 ledger entries total |
| A2-ATTRIBUTION | **PASS** — 0 sequentially divergent verdicts (so the divergence clause passes vacuously); all 10 seeded spot-checks byte-reproduce the full analysis from the recorded step state |
| A3-CERTIFICATE-SURVIVAL | **PASS** — runbook family 4.2% → 4.2%, plan family 0.0% → 0.0%, `OUTSIDE DESIGN SPACE` and gaming rates byte-identical to factory on both corpora, **0 of 240 verdicts changed** under the end-state calibration |
| A4-PATH | endpoint path-independent — reverse-order end state within 0.002 per pattern (dead-band 0.005); sequential divergence 0 in both orders |

The autonomy contract holds outside the lab: on its first contact with real documents, every self-change the system made was clamped, ledgered with evidence, stamped, reproducible from exported state, and the certified register story survives the self-calibrated instrument untouched.

## The findings the gates didn't predict

**1. The loop amplifies on genre-proper text — the opposite sign from everything the curated tests exercise.** The unit tests pin the dampening direction ("dampening the ballot changes the verdict"); the expectation built there is a loop that reins patterns in. On 240 real operational documents, both patterns that crossed January's sample floor *won more often than their confidence claimed*: `CAUTIOUS_GROUNDEDNESS` won 85% of its 58 samples against average confidence 82% (settling at 1.013), and `OPERATIONAL_INTENT` won **100%** of its 10 samples against average confidence 75% — earning the formula's near-maximal amplification, **1.10×**. January's `performanceGap = winRate − avgConfidence` treats underconfidence as a gap too, and on genre-conforming operational text the Parliament's patterns are underconfident when they fire. The self-calibrating system's first real act was to *raise* its own weights.

**2. Verdict-neutral on this stream — and that is a property of the stream, not a theorem.** Zero of 240 verdicts moved, sequentially or under the end state. The +10% boost on `OPERATIONAL_INTENT` crossed no decision boundary because these documents' verdicts sit far from the confidence gates. The unit tests prove calibration *can* move verdicts; this stream never placed a document near a boundary. The named residue follows directly: **amplification is the risky direction** — a multiplier above 1 can only add operational-family verdicts, never remove them — and the register where a 1.10× amplifier would matter is the KEP register, where 66 flagship verdicts live near the `parliament.confidence > 0.8` gate. A loop run over a boundary-adjacent stream (the KEP corpus, or any register with flagship candidates) is the next probe, with the mint-count as its natural gate.

> **Correction (v3.41.0):** the probe ran, and this finding's premise was measured false — zero of the 66 flagship KEPs carry the `OPERATIONAL_EXCELLENCE` pattern (parliament confidence median 0.255); they are minted by count-based routes the calibration lever never touches. The flagship is calibration-immune on the flagship register. See `docs/KEP-BOUNDARY-PROBE.md`.

**3. The ballot's learnable surface is narrow.** Only 2 of the 6 Parliament patterns ever reached the 5-sample floor across 240 real documents — the performative/epistemic patterns essentially never fire on genre-proper operational text, so the loop cannot learn anything about them there. What the system can teach itself is bounded by what the stream makes its patterns propose.

**4. The dead-band admits chatter.** Ten of the 11 ledger entries are `CAUTIOUS_GROUNDEDNESS` oscillating in ~[1.01, 1.07] as its running win rate drifted between 84% and 88% against a fixed average confidence — a net drift of +0.013 recorded in ten evidence-bearing steps. Every entry is honest and attributable, but `act()`'s 0.005 dead-band lets the multiplier wobble with each win-rate update. Loud is the contract; this is the measured price of loud. Reported, not fixed — no core or loop changes ship with this run, per the pre-registration. *(Fixed in v3.43.0 by sample-interval hysteresis; this run's 11 entries re-run to 9, no verdict changed — the counts here describe the pre-v3.43.0 loop. See `docs/AUTONOMY-CHATTER-VALIDATION.md`.)*

**5. The shipped sample floor is effectively 3 documents, not 5.** `observe()` records each pattern twice per document (once under the gaming context, once under the binding context), so January's `MIN_SAMPLES = 5` floor is crossed by the third document — the first self-change fired at ledger #1 with "won 6/6" after three documents. Measured as shipped; whether the double-record is January-faithful bookkeeping or an accidental halving of the evidence floor is a question for the ledger, flagged here.

**6. The endpoint is path-independent; the path is where the risk would live.** January's formula computes from order-independent totals, and the measurement confirms it: forward and reverse orders settle within 0.002. On a stream that *did* cross decision boundaries, the verdicts served along the way would still depend on arrival order — same endpoint, different history — which is exactly what the per-step stamp and archive attribution exist to make legible.

## Honest limits

One stream, two corpora, both development data by their own ledger entries, both machine-authored in the same generation campaign, both genre-proper (median ~375 words, verdict mass in `VERIFIED CONSISTENT`). The run measures the loop's mechanics and its behavior on well-behaved input; it does not measure behavior on adversarial streams (an attacker feeding texts chosen to steer the calibration — the loop has no defense beyond the clamp, and the clamp held here by a wide margin, not under pressure) or on boundary-adjacent streams (finding 2). Both are named, unprobed territory.
