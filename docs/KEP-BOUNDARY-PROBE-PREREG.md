# Pre-registration: the KEP boundary probe

**Status:** committed before any KEP verdict is computed under the loop.
**Harness:** `validation/kep-boundary-probe.js` (committed alongside; gates encoded in the exit condition).
**Corpus:** the 611 Kubernetes Enhancement Proposals, byte-pinned @ `996e7d41` (`bash validation/fetch-kep-corpus.sh`) — the register the certified run (v3.26.0–v3.27.0, `docs/KEP-VALIDATION.md` / `docs/OBJECT-RATIO-WINDOWING.md`) measured at family 11.6%, `OPERATIONALLY SOUND` 10.8% under the factory instrument. Development data for the core since v3.27.0; that is fine here for the same reason as the autonomy run — **this probe measures the loop, not the register.**

## The question

The autonomy run (v3.40.0, `docs/PROGRESSION-AUTONOMY-VALIDATION.md`) established that on real operational text the self-calibrating loop **amplifies** — its patterns win more than their confidence claims, and `OPERATIONAL_INTENT` earned a 1.10× multiplier — but its stream never put a document near a decision boundary, so zero verdicts moved. Finding 2 named the territory this probe enters: amplification is the risky direction, able only to *mint* operational-family verdicts, and the KEP register is where the boundary lives — 66 flagship verdicts sit near the `parliament.confidence > 0.8` gate, with more documents just below it.

> When the amplifying loop runs over a boundary-adjacent stream, does it cross decision boundaries — and when it does, are the crossed verdicts earned (structural under the standing shuffle control) or is the loop steering the instrument into the defect region (vocabulary credited by self-raised weights)?

## Protocol

Identical to the autonomy run's, on the KEP stream: fresh in-memory `ProgressionMemory`; forward order = corpus order (`kep_0001` … `kep_0611`, the fetch script's byte-stable sort); per document, analyze under the current active calibration → `observe` → `act` — the shipped Unified 2.0 protocol, evaluator and loop unmodified. Loader and preprocessing byte-copied from `kep-validation.js` (`stripFrontmatter` + `stripMarkdown`, ≥ 500 prose chars). Four passes: factory, sequential-forward, end-state, sequential-reverse. Deterministic given the pinned corpus.

## Pre-registered gates

**B1 — ENVELOPE.** As A1: every applied multiplier in `[0.8, 1.2]`; active-map changes 1:1 with evidence-bearing ledger entries; `act()` after the final observation is a no-op. PASS = all three.

**B2 — ATTRIBUTION.** As A2: every sequentially divergent verdict carries a non-factory stamp and byte-reproduces (`JSON.stringify` equality of the full analysis) from its recorded step state; plus 10 seeded spot-checks on non-divergent documents. PASS = 100%.

**B3 — MINTED VERDICTS MUST BE STRUCTURAL.** The probe's own gate. Every document minted into the operational family by calibration — factory verdict outside the family, calibrated verdict inside it, whether mid-stream or at end state — is put through the standing word-shuffle control (20 seeded shuffles) **evaluated under the same calibration that minted it** (the step state for mid-stream mints, the end state for end-state mints). PASS requires pooled retention < 20% AND no minted text ≥ 10/20 (the decision-1 reference). A minted verdict that survives shuffling is vocabulary credited by self-raised weights — the loop steering the instrument into the defect region — and FAILS the gate. Zero mints passes vacuously. (The KEP corpus is development data, so a ≥ 10/20 here does not formally fire decision 1's reopening trigger, which requires fresh data; it is reported against the reference regardless.)

**B4 — V1 INERTNESS.** `OUTSIDE DESIGN SPACE` and gaming-flag rates byte-identical to factory under the end-state calibration — calibration touches only Parliament pattern confidences, so the V1 instruments must be inert by construction on this register too. Any movement is an instrument finding and a FAIL.

**B5 — CERTIFICATE SURVIVAL.** The end-state family rate stays **< 15%** — the line reused from the v3.35.0 pre-registration's own top band ("above the mandated register itself"), against the certified factory 11.6%. Crossing it means the self-calibrated instrument tells a different register story than the certificate, which is exactly what the freeze switch exists to prevent; that outcome is a FAIL and goes to the ledger before any fix. Family verdicts *destroyed* by calibration (dampening is equally available to the formula here: `OPERATIONAL_EXCELLENCE` loses wherever it fires without earning the flagship) are reported with identities, not gated — the specificity-over-sensitivity stance.

**B6 — PATH (reported, pre-stated reading, no gate).** Reverse-order end state within ±0.005 per pattern → "endpoint path-independent," as measured in the autonomy run; the per-order sequential divergence counts and mint counts reported side by side — on a boundary-adjacent stream the *path* is where order dependence would first become visible in served verdicts.

**Reported, no gate:** per-pattern table (samples, win rate, average confidence, final multiplier — the first measurement of `OPERATIONAL_EXCELLENCE` under the loop, a pattern the autonomy run's stream never taught); multiplier trajectories; ledger; full factory → end-state transition table; mint/destroy identities with their factory and calibrated verdicts and confidences.

## What would count as what

- **All gates PASS with zero mints** → the boundary holds even against amplification on the most favorable register; verdict-neutrality generalizes one register further, and the standing question becomes the adversarial stream.
- **All gates PASS with structural mints** → the loop moves the sensitivity margin and every moved verdict is earned; the measured mint rate becomes the documented behavior of autonomy at the boundary, for the ledger to keep or freeze.
- **B3 FAIL** → the named risk is real: self-calibration launders vocabulary into the family. The finding outranks any fix; the freeze recommendation goes to the ledger with the offending documents attached.
- **B5 FAIL** → autonomy rewrites a certified register reading; same consequence.

No core or loop changes ship with this run regardless of outcome. Results: `validation/results-kep-boundary-probe.json`; findings: `docs/KEP-BOUNDARY-PROBE.md`.
