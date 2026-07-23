# Pre-registration: the ledger-chatter fix (sample-interval hysteresis)

**Status:** committed with the harness before the fix is implemented or measured.
**Harness:** `validation/autonomy-chatter-validation.js` (committed with this document; gates encoded in its exit condition).
**On the maintainer's direction** — v3.42.1 deferred this fix and named the tradeoff; the maintainer chose sample-interval hysteresis and accepted a small, bounded, measured endpoint path-dependence in exchange for fewer ledger entries. This is that fix, pre-registered in the register program's idiom: gates before measurement, a revert rule, and — if it fails — the rejection published with its numbers ([FLAGSHIP-SYNTAX-BUDGET.md](FLAGSHIP-SYNTAX-BUDGET.md), [OBJECT-RATIO-WINDOWING.md](OBJECT-RATIO-WINDOWING.md) are the precedents).

## The defect

`progression.js` `act()` recomputes the target multiplier from the running win-rate every document and commits any move ≥ 0.005 from the currently applied value. The running win-rate is a mean over an ever-growing sample, so early in a stream a single observation swings it enough to move the multiplier past 0.005 — **on the KEP stream (v3.41.0) `CAUTIOUS_GROUNDEDNESS` wrote an entry on thirteen consecutive documents**, the gaps widening only as the mean stabilized (measured sample-gaps between its 40 entries: `2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,6,…,70,38,14`). 46 entries for a net multiplier movement of −0.008; 11 entries for +0.013 on the autonomy stream (v3.40.0). Every entry is honest and attributable — the measured price of the loudness contract — but the transient is noise: partly-revoking micro-commits that say nothing a single settled entry wouldn't.

## The fix

**Sample-interval hysteresis.** After the loop commits a change to pattern *P*, it does not commit another change to *P* until *P* has accumulated a further `HYSTERESIS_INTERVAL` observations. Between commit points the applied multiplier holds; per-document jitter within the interval is ignored; a sustained drift still commits at the next checkpoint.

**The interval is `HYSTERESIS_INTERVAL = MIN_SAMPLES = 5`** — the one principled anchor already in the code. January gates a pattern's *first* calibration on 5 samples (the eligibility floor); this fix gates each *re-*calibration on another 5 (symmetric re-eligibility). **The interval is deliberately not tuned to the two development corpora** — the register program's cardinal rule. Its value is the eligibility floor, chosen a priori; the reduction it happens to produce on these corpora is a reported measurement, and the fresh-stream validation of that reduction is future work, exactly as every core change in the program.

**What does not change.** The January formula (`calibrationFor`: gap × 0.4, ±20% clamp, silent under `MIN_SAMPLES`) is untouched — the fix gates *when* a computed value commits, never *what* the value is. Factory inertness is untouched (no opts → byte-identical). Each committed value is still the exact current raw target (not an intermediate), so the endpoint is still a function of order-independent totals up to the interval's phase. State gains one field, `lastAct` (name → sample count at last commit), included in `export()`; stored data without it defaults to empty (back-compatible).

## Pre-registered gates

Strict gates are PASS-or-**revert** (the fix is reverted and published as a rejection). Reported gates inform, per the accepted tradeoff.

**H1 — VERDICT PRESERVATION (strict).** Replaying the shipped loop with hysteresis over both committed streams (the 240-document autonomy corpus and the 611 KEPs) changes **zero** verdicts relative to the factory instrument — matching the v3.40.0 and v3.41.0 baselines (both measured 0). Staling the calibration must not, at any document, flip a verdict. FAIL → revert.

**H2 — CONTRACT INTACT (strict).** All 9 `run-progression-tests.js` cases pass, factory inertness is byte-exact, and `calibrationFor` is unchanged for every sample count (the formula is not touched). FAIL → revert.

**H3 — FIXED POINT PRESERVED (strict).** `act()` after the final observation returns zero changes on both streams — the no-op property the A1/B1 envelopes asserted. (Its *meaning* is unchanged: no new samples → no commit.) FAIL → revert.

**H4 — CHATTER REDUCED (strict construction + reported magnitude).** Construction (strict): on both streams, no two committed entries for the same pattern lie within `HYSTERESIS_INTERVAL` samples of each other, and the total entry count is **≤** the v3.40.0/v3.41.0 baseline on each stream (a correct hysteresis can only suppress commits, never add them). A count that rises, or any sub-interval pair, is a bug → revert. Magnitude (reported): entry counts old vs new and the reduction, on each stream — development-data measurement, not a tuned target.

**H5 — PATH DEPENDENCE (reported, pre-stated concern threshold).** Forward vs reverse endpoint per pattern on both streams. The maintainer accepted bounded path-dependence; the pre-stated concern threshold is **max per-pattern |forward − reverse| > 0.05** (a quarter of the full ±0.20 clamp range) — not a hard FAIL, but a magnitude that would mean the endpoint meaningfully depends on order and would prompt reconsideration of the interval. The v3.40.0/v3.41.0 baselines were 0.002 and 0.000.

## What would count as what

- **H1–H4 all PASS** → the fix ships (v3.43.0): the chatter transient is collapsed, no verdict moves, the contract and fixed point hold, and the measured endpoint path-dependence (H5) is disclosed as the accepted cost. The reduction magnitude on these corpora is reported as development data; a fresh stream validates it later.
- **Any strict gate FAILS** → revert to the v3.42.1 loop, byte-identical, and publish "sample-interval hysteresis rejected" with the failing numbers. The chatter stays documented as the loop's open residue.

Results: `validation/results-autonomy-chatter-validation.json`; findings: `docs/AUTONOMY-CHATTER-VALIDATION.md`. The consolidated [AUTONOMY-PROGRAM.md](AUTONOMY-PROGRAM.md) "named but not fixed" entry is updated to the run's outcome.
