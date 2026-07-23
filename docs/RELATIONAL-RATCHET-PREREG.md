# Pre-registration: the ratchet fix (relational bar recovery)

*Committed before the fix is written. The decision, the mechanism, the
hard invariant, the demonstration, and the revert rule are frozen here;
the implementation follows in `relational-calibration.js` and the
measurement in `validation/relational-ratchet-validation.js`. Findings
will land in [RELATIONAL-RATCHET-VALIDATION.md](RELATIONAL-RATCHET-VALIDATION.md).*

## The decision (delegated, made in the open)

The relational autonomy run ([RELATIONAL-AUTONOMY-VALIDATION.md](RELATIONAL-AUTONOMY-VALIDATION.md))
found the tier's one open defect: the `TRANSFORM_NOVELTY` bar is a
**ratchet**. The only proposal rule raises it; nothing lowers it; on real
streams it fires within dozens of exchanges, so every active user's device
converges on "stricter than the factory instrument, forever," recoverable
only by a manual reset. The maintainer delegated the call ("you decide").

**Decided: fix it, floor-bounded.** A user whose exchanges drift toward
lower novelty is silently and permanently under-credited today; that is a
defect, not personalization. The fix adds a mirror rule that can lower the
bar back *toward* the factory default when the notebook's evidence says it
over-tightened — clamped so it can **never** fall below the default 0.35.

This clamp is load-bearing. The relational autonomy run's RA2 (no minting)
held *because* the bar was monotone-up: a bar ≥ the factory default can
only classify uptake equal-or-stricter than factory, so the loop could
never mint a verdict the factory instrument would refuse. Making the bar
movable in both directions would forfeit that — unless the downward move
is clamped at the default. **The clamp turns RA2's accidental guarantee
into an explicit invariant: the autonomous loop is never more lenient than
the shipped instrument, in either direction of adaptation.**

## The mechanism (frozen)

A second proposal rule, the mirror of the existing one, in
`relational-calibration.js`. `CalibrationLedger.propose` tries the raise
rule first (unchanged, so every existing behavior is byte-preserved), then
the lower rule:

**Rule 2 — TRANSFORM_NOVELTY recovery.** Watches the same pooled uptake
novelties. Fires when: ≥ 8 exchanges, ≥ 30 pooled samples, the current bar
is **above** the factory default, and even the **75th percentile** of
uptake novelty sits **below** the current bar (so < 25% of uptake now
clears it — the bar has stopped discriminating in the strict direction,
labelling almost everything WEAK). Proposes: `to = max(DEFAULT, median)` —
the corpus median, clamped at the factory default. Guarded by the same
"change too small to matter" dead-band (|to − current| ≥ 0.1) as the raise
rule, applied to the clamped target.

Two properties provable from the definitions, to be pinned by tests:
- **Mutual exclusivity.** Raise fires on p25 > current, lower on p75 <
  current; since p25 ≤ p75, at most one fires on any notebook state.
- **No immediate reversal.** After a raise to the median, p75 ≥ median so
  lower cannot fire next; after a lower to the median, p25 ≤ median so
  raise cannot fire next. The two rules cannot oscillate on one state.

## Gates and readings

**RF1 — the hard invariant, minting-safety survives the movable bar
(GATED).** With the lower rule active, on all three real streams from the
relational autonomy run (3×300 conversations) replayed from factory: still
**zero** exchanges gain `GENERATIVE EXCHANGE` vs factory. (They only raise,
so this should be byte-identical to the v3.45.0 result — the check is that
adding the rule changed nothing it must not change.)

**RF2 — recovery works, and clamps (GATED).** Seed the ledger at
TRANSFORM_NOVELTY = 0.9 (an over-raised bar) and feed each real stream:
the lower rule fires, the bar descends to the stream's real median, and it
**never** goes below the factory default 0.35. Every recovery is ledgered
with its evidence and stamped. And the hard invariant holds under
recovery: for every exchange, the verdict under the recovered bar is
equal-or-stricter than the factory verdict — the descending bar never
mints, because it is clamped at the default.

**RF3 — determinism (GATED).** The validation run twice → byte-identical
results JSON.

**RF4 — the existing suite and the raise behavior are unchanged (GATED).**
`run-relational-tests.js` green, including the calibration tests, with the
new rule present; new tests pin the lower rule (fires, clamps at floor via
a below-floor median, mutual exclusivity, no immediate reversal).

**Reported:** whether the lower rule ever fires on the three real streams
run from factory (pre-stated expectation: no — their novelty is high, they
only raise; the rule is dormant until a user's mix actually drops).

## Revert rule

If RF1 shows any mint, or RF2 shows the bar descending below the default,
the rule is reverted and the ratchet stands as a recorded decision
instead. The clamp is the whole safety argument; if it does not hold in
measurement, the fix does not ship.

## Reproduce

```
bash validation/fetch-corpora.sh
node validation/relational-ratchet-validation.js
npm test
```

Results: `validation/results-relational-ratchet-validation.json`.
