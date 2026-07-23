# The ratchet fix — findings

*Run date 2026-07-23. Pre-registered in
[RELATIONAL-RATCHET-PREREG.md](RELATIONAL-RATCHET-PREREG.md) (committed
`58…`, before the recovery rule was written). Harness:
`validation/relational-ratchet-validation.js`; results:
`validation/results-relational-ratchet-validation.json`; deterministic —
the run executed twice is byte-identical (RF3 PASS). The maintainer
delegated the decision; it was made in the open and then acted on.*

## What shipped

`relational-calibration.js` gains a second proposal rule,
`proposeTransformNoveltyLower` — the mirror of the raise rule. It fires
when a previously-raised bar has stopped discriminating in the strict
direction (≥ 8 exchanges, ≥ 30 samples, the 75th percentile of uptake
novelty below the current bar) and proposes lowering the bar to the corpus
median, **clamped at the factory default 0.35 — never below.**
`propose()` tries the raise rule first (so every pre-existing behavior is
byte-preserved) then the lower rule; the two are mutually exclusive by
construction (raise on p25 > current, lower on p75 < current, and
p25 ≤ p75).

The bar is no longer a ratchet. It can rise to personalize and fall to
recover, and it is bounded below by the globally-validated default.

## The clamp is the safety argument, and it held

The relational autonomy run's RA2 (no minting) held because the bar was
monotone-up: a bar ≥ the factory default only ever classifies uptake
equal-or-stricter than factory, so the loop could never mint a verdict the
factory instrument refuses. A movable bar forfeits that — unless the
downward move stops at the default. The clamp makes RA2's accidental
guarantee an **explicit invariant: the autonomous loop is never more
lenient than the shipped instrument, in either direction.** Both gates
measure exactly this.

## RF1 — minting-safety survives the movable bar: PASS (GATED)

With the recovery rule present, the three real streams replayed from
factory (3×300 conversations, verbatim from the relational autonomy run):

| Stream | lower-rule fires | end bar | mints vs factory |
|---|---|---|---|
| S1 DailyDialog | 0 | 0.67 | **0** |
| S2 hh-rlhf | 0 | 0.60 | **0** |
| S3 UltraChat | 0 | 0.45 | **0** |

The end bars are identical to the relational autonomy run's fires
(0.67 / 0.60 / 0.45) — **adding the rule changed nothing it must not
change.** The recovery rule is *dormant from factory*: on streams whose
novelty is high enough to raise the bar, it never fires. It is not a
behavior that happens to every user; it is a safety net that engages only
when a raised bar later over-tightens.

## RF2 — recovery works, lands on the real median, clamps at the floor: PASS (GATED)

Seed the ledger at an over-raised 0.9 (as if the user's mix had been high
and then dropped), feed each real stream:

| Stream | bar trace | recovered to | below floor? | mints | more generous than factory |
|---|---|---|---|---|---|
| S1 DailyDialog | 0.9 → **0.67** | real median | no | 0 | 0 |
| S2 hh-rlhf | 0.9 → **0.60** | real median | no | 0 | 0 |
| S3 UltraChat | 0.9 → **0.43** | real median | no | 0 | 0 |

Three things the trace shows. **Recovery lands on the data, not the
floor:** each stream's real median is above 0.35, so recovery stops there,
not at the clamp — the clamp only bites when a user's genuine median is
itself below the default (pinned in the unit tests with a below-floor
synthetic median → recovers to exactly 0.35, never lower). **It is a
stable fixed point:** each stream recovers in a single step and stops — a
bar at the median cannot re-trigger either rule (p75 ≥ median forbids
another lower; p25 ≤ median forbids a raise), so the two rules provably do
not oscillate, confirmed here on real data. **The invariant holds
throughout the descent:** across every exchange under the descending bar,
zero verdicts became more generous than factory (rung never decreased) and
zero mints — because the bar is clamped at the default the whole way down.

## RF3 / RF4 — determinism and the suite: PASS (GATED)

The run is byte-identical on re-execution. `run-relational-tests.js` is
green with two new tests (28 → 30): recovery lowers a seeded-high bar and
clamps at the floor when the median is below it; the raise and recovery
rules are mutually exclusive and neither reverses itself immediately. The
full floor is **103/103**; no core or analyzer change (the analyzer still
never reads memory — calibration remains an explicit, ledgered argument).

## What this changes in the program

The relational autonomy run added the ratchet to the ledger as an open
flag; this fix retires it. The two-tier autonomy statement gains its final
symmetry: **both loops now adapt in both directions, and both are bounded
so the autonomous system is never more lenient than the instrument the
register program certified** — the operational tier by its ±20% clamp, the
relational tier by its factory-default floor. Every self-change on either
tier is still announced, ledgered with evidence, stamped, reversible, and
freezable.

Reopening trigger (carried from the decision): if any stream shows the two
rules oscillating on one notebook state, or the floor clamp is shown to
under-credit a user whose genuine typical novelty sits below 0.35, the
rule is revisited.

Reproduce: `bash validation/fetch-corpora.sh`, then
`node validation/relational-ratchet-validation.js` (twice, for RF3) and
`npm test`.
