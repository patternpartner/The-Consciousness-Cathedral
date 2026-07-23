# The ledger-chatter fix: sample-interval hysteresis, measured

**Pre-registration + harness:** `docs/AUTONOMY-CHATTER-PREREG.md` and `validation/autonomy-chatter-validation.js`, committed at `758a9ed` before the fix was implemented.
**The fix:** `progression.js` — `act()` now requires `HYSTERESIS_INTERVAL = MIN_SAMPLES = 5` fresh samples for a pattern between commits (symmetric re-eligibility), building the active map incrementally so a pattern that isn't yet due holds its applied value. The January formula (`calibrationFor`) is untouched. Deterministic, verified identical on re-run. Results: `validation/results-autonomy-chatter-validation.json`.

## Verdict on the gates: all four strict gates PASS; the fix ships (v3.43.0)

| Gate | Result |
|---|---|
| H1 — VERDICT PRESERVATION (strict) | **PASS** — 0 verdicts change vs factory on both streams (autonomy 240 docs, KEP 611), matching the v3.40.0/v3.41.0 baselines |
| H2 — CONTRACT INTACT (strict) | **PASS** — all 9 `run-progression-tests.js` cases green, factory inertness byte-exact, `calibrationFor` unchanged |
| H3 — FIXED POINT (strict) | **PASS** — `act()` after the final observation is a no-op on both streams |
| H4 — CHATTER REDUCED (strict + reported) | **PASS** — no same-pattern entries within the interval on either stream; **KEP 46 → 30 (−34.8%), autonomy 11 → 9 (−18.2%)** |
| H5 — PATH DEPENDENCE (reported) | **FLAGGED** — KEP endpoint max Δ **0.086** > the 0.05 concern threshold (autonomy Δ 0.004, within bound) |

The chatter transient is collapsed: on KEP, `CAUTIOUS_GROUNDEDNESS`'s thirteen consecutive every-document entries become at most one per five samples, and the total drops by a third. No verdict moves, the contract and fixed point hold, and re-running the two prior harnesses confirms every strict gate (A1–A3, B1–B5) still passes under the changed loop — only their reported path metric moved.

## The H5 flag, honored: what it is, and why the fix still ships

H5 was pre-registered as reported, not a revert trigger, but I committed that crossing 0.05 "would prompt reconsideration of the interval." Here is the reconsideration, done rather than deferred.

**What crossed the line.** The entire 0.086 is on `OPERATIONAL_INTENT`, a **sparse** pattern (16 samples on KEP): forward order settles it at 0.90, reverse at 0.986. `CAUTIOUS_GROUNDEDNESS` (394 samples) agrees to 0.003 across orders. The mechanism is exactly the accepted tradeoff seen at its worst: hysteresis lets the applied multiplier lag its order-independent target by up to one interval's drift, and for a 16-sample pattern one interval (5 samples) is a large fraction of the total evidence, so *which* samples fall on the near side of the last checkpoint — order-dependent — moves the endpoint materially. The old loop's 0.005 dead-band committed every step, so it had no lag and measured Δ 0.000; that zero was bought with the chatter.

**Why it does not bite.** The flag is on the multiplier, not the output. Measured directly: under **both** the forward endpoint (`OPERATIONAL_INTENT` 0.90) and the reverse endpoint (0.986), verdicts change on **0 of 611** KEPs relative to factory. Whether the loop settles the sparse pattern high or low, no verdict differs. This is consistent with the arc's established mechanism — `OPERATIONAL_INTENT`'s multiplier reaches a verdict *status* only through the flagship gate `parliament.confidence > 0.8` when it co-fires with `OPERATIONAL_EXCELLENCE`, which on the KEP register (flagship via count routes; the two patterns rarely co-fire) it does not do near any boundary. The 0.086 is a visible number in the ledger with no consequence in the verdicts the ledger explains.

**Why the reconsideration does not change the interval.** The pre-registration forbids tuning the interval to these development corpora — so "reduce the interval until Δ < 0.05 on KEP" is exactly the move the program's cardinal rule prohibits; it would be overfitting the fix to the stream that surfaced the flag. The two corpus-independent alternatives were considered and rejected for this fix: a smaller a-priori interval trades away the chatter reduction that is the fix's entire purpose (and would still be a guess), and a "final flush" that commits the exact target on the last document has no point of application in a streaming loop that never knows which analysis is last. The honest resolution is to ship the principled interval, disclose the path-dependence as the measured cost, and record it — which is what the maintainer accepted in directing the fix.

## The net change to the loop's contract

One property is deliberately relaxed and now bounded-and-measured rather than exactly zero: **endpoint path-independence.** Before, forward and reverse orders agreed to Δ 0.000–0.002; now they agree to Δ 0.003 on well-sampled patterns and up to 0.086 on sparse ones, verdict-inert on the measured streams. Everything else the autonomy arc certified is preserved exactly — the loudness envelope (clamp, 1:1 evidence-bearing ledger, stamping), the fixed point, verdict preservation, factory inertness, and reproducibility given the exported state (which now includes `lastAct`). The reproducibility contract is in fact unchanged in kind: same text + same exported state → same verdict, because the exported state carries the hysteresis bookkeeping.

## The interval decision (v3.43.1), with its reopening trigger

The maintainer delegated the interval choice after the H5 flag. **Decision: `HYSTERESIS_INTERVAL` stays at 5.** Reasons, in the open: (1) the flag is verdict-inert — a concern threshold triggers investigation, and the investigation cleared it (both endpoints change 0 of 611 verdicts); (2) path-dependence is not an artifact of the value 5 but the defining property of *any* hysteresis, which is the mechanism that was chosen — the number does not remove it, it only trades its magnitude against the chatter reduction; (3) 5 is the principled point on that monotone curve — it breaks the every-document cluster (the actual pathology) without over-dampening legitimately-spaced drift, and it is the code's own eligibility floor rather than a corpus-fit value.

**Reopens if:** a stream ever shows the forward and reverse endpoints disagreeing on *any* verdict (path-dependence becoming verdict-consequential, the thing the 0.05 threshold was proxying for) — that would be a defect, not a preference; or a fresh operational stream shows the every-document chatter cluster recurring despite the interval (the fix failing its purpose out-of-sample). The interval also remains a maintainer dial revisable on a stated preference for a different point on the chatter/lag curve; that is a preference change, not a reopening.

## Honest residue

- **The reduction is development-data measurement.** −34.8% / −18.2% are what interval-5 produces on these two corpora; the interval was fixed a priori, so these numbers are outcomes, not targets, and a genuinely fresh operational stream validates the reduction — the register program's standing pattern, now applied to the loop.
- **The interval is a single exposed constant.** `HYSTERESIS_INTERVAL` larger than 5 would suppress more chatter at the cost of more endpoint lag (the H5 quantity); the tradeoff curve is monotone and the choice is the maintainer's, deferred out of this fix rather than guessed from the corpus.
- **The double-record is untouched.** `observe()` still records each pattern twice per document; the interval counts samples, so its document-cadence is ~2.5 documents for a co-firing pattern. Noted, unchanged — a separate ledgered question.
