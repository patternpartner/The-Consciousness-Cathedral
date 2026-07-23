# The KEP boundary probe: the amplifier meets the boundary — and the boundary isn't where the ledger said it was

**Pre-registration:** `docs/KEP-BOUNDARY-PROBE-PREREG.md`, committed with the harness at `946237c` before any KEP verdict was computed under the loop.
**Harness:** `validation/kep-boundary-probe.js` — the shipped Unified 2.0 protocol (analyze under active calibration → `observe` → `act`) over the 611 KEPs byte-pinned @ `996e7d41`, loader byte-copied from `kep-validation.js`. Evaluator and loop unmodified. Deterministic, verified identical on re-run (modulo ledger timestamps). Results: `validation/results-kep-boundary-probe.json`.

## Verdict on the gates: all PASS

| Gate | Result |
|---|---|
| B1-ENVELOPE | **PASS** — 0 clamp violations, 46 evidence-bearing ledger entries 1:1 with every active-map change, fixed point |
| B2-ATTRIBUTION | **PASS** — 0 divergent verdicts; all 10 seeded spot-checks byte-reproduce from recorded step state |
| B3-MINT-STRUCT | **PASS-vacuous** — zero family verdicts minted, mid-stream or end-state |
| B4-V1-INERT | **PASS** — `OUTSIDE DESIGN SPACE` 3 → 3, gaming flags 5 → 5, byte-identical |
| B5-CERT-SURVIVAL | **PASS** — family 11.6% → 11.6%, `OPERATIONALLY SOUND` 66 → 66, **0 of 611 verdicts changed** |
| B6-PATH | endpoint path-independent — forward and reverse end states identical (max Δ 0.000) |

## The finding: the flagship is calibration-immune on the flagship register

The probe was designed around the autonomy run's finding 2: "66 flagship verdicts live near the `parliament.confidence > 0.8` gate, where a 1.10× amplifier could mint." **That premise is now measured false, and the correction is the probe's real result.** Direct inspection of the 66 factory `OPERATIONALLY SOUND` KEPs: **zero of them carry the `OPERATIONAL_EXCELLENCE` Parliament pattern** — their parliament confidence sits at median 0.255 (max 0.574), nowhere near the 0.8 pattern-route gate. Every flagship verdict on this register is minted by the count-based routes (score route, promotion rule — the same routes decision 1's accepted residue lives on), and those routes never consult the Parliament's confidence.

The consequence cuts both ways, and both sides go to the ledger:

- **The mint risk named in v3.40.0 does not exist on real long plans.** Calibration's only lever is multiplying Parliament pattern confidences; on KEP-shaped text that lever is disconnected from the flagship entirely. Zero mints is not good behavior under temptation — it is the absence of a mechanism. The lever reaches the flagship only where `OPERATIONAL_EXCELLENCE` actually fires with parliament confidence near 0.8, which per the curated suite is short, explicitly-structured operational text (the shape `run-progression-tests.js` exercises) — not the register the flagship was validated on.
- **The loop can neither cause nor cure the count-route residue.** Decision 1's accepted boundary (shuffle-soft count-route verdicts, worst 9/20) is equally beyond the loop's reach: self-calibration cannot steer the instrument into that defect region, and no amount of learning can correct it. Autonomy and the program's one accepted defect live on disjoint circuits.
- **What the loop actually governs, on real registers, is narrow and now mapped:** the pattern-route verdicts — `OPERATIONAL INTENT` where the pattern fires (8 documents of 611 here), and the `CAUTIOUS_GROUNDEDNESS`/performative region. The flagship, on the registers that earn it, answers to counts the loop cannot touch.

## The second finding: the sign of self-calibration is stream-carried

On the autonomy run's genre-proper stream, the loop **amplified** (`OPERATIONAL_INTENT` won 100% vs 75% confidence → 1.10×). On the KEP stream, the same pattern with the same formula **dampened** (won 63% vs 75% → 0.95×; `CAUTIOUS_GROUNDEDNESS` 80% vs 82% → 0.992). Neither direction is a property of the loop; `performanceGap = winRate − avgConfidence` just reports how the stream's verdicts fall against the patterns' claims. A device that reads mostly runbooks will amplify `OPERATIONAL_INTENT`; one that reads mostly design plans will dampen it. Same endpoint arithmetic, opposite signs — and per B6, within a stream the endpoint is exactly path-independent (forward and reverse identical to the third decimal).

## The chatter cost, remeasured at scale

46 ledger entries over 611 documents, for a net movement of `CAUTIOUS_GROUNDEDNESS` from 1.0 to **0.992** — including an early swing to 1.072 ("won 6/6") that the very next window revoked (0.972, "won 6/8"). The autonomy run's finding 4 (the 0.005 dead-band admits chatter) scales roughly linearly with stream length: the loudness contract currently prices a ±0.01 wobble the same as a real recalibration. Reported again, not fixed — but two runs in, the pattern is established enough to name the candidate fix for the ledger: a dead-band proportional to the multiplier's evidence (or a minimum sample delta between acts), which would preserve loudness for changes that mean something.

## Honest limits

One register, development data since v3.27.0, one loop configuration. The probe measures the flagship's calibratability on *this* register's route mix; a register whose flagship verdicts arrive via the pattern route (if one exists in the wild — the curated suite is the only known population) would put the amplifier genuinely at the gate, and the adversarial stream (texts chosen to steer calibration, then cash it in) remains the named unprobed territory from v3.40.0 — narrowed by this result to the pattern-route verdicts the lever actually reaches.
