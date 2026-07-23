# Pre-registration: the calibration-steering adversary probe

**Status:** committed with the frozen attack suite before the scored run.
**Frozen suite:** `validation/autonomy-adversary-attacks.js` (grooming streams, targets, positive controls — committed in the same commit as this document; one shot, no iteration after results, the v3.33.0 red-team discipline).
**Harness:** `validation/autonomy-adversary-validation.js`.

## The question

This is the last named unprobed territory from the autonomy arc. v3.40.0 measured the self-calibrating loop as an amplifier; v3.41.0 (the KEP boundary probe) established that the calibration lever's only verdict-changing path is the flagship gate `parliament.confidence > 0.8`, reached only when the `OPERATIONAL_EXCELLENCE` pattern fires (the count-based flagship routes never consult Parliament confidence). Both prior runs used *found* streams — real corpora nobody chose adversarially. The remaining question is the adversarial one:

> An attacker who controls the entire document stream a device's loop processes, with full white-box knowledge, grooms the calibration and then presents a target. Can the groomed calibration make a target that the factory instrument reads as **non-operational-family** read as **operational-family** (or flagship) — weaponizing autonomy to mint a verdict the factory instrument refuses? And if any mint occurs, is it structural (survives the standing shuffle control) or laundered?

## Threat model (disclosed)

The strongest realistic attacker, per v3.33.0: a modern LLM generator (the session agent) with full source and ledger access, controlling the complete input stream. The attacker may interleave grooming texts to drive each pattern's multiplier independently (e.g. feed `OPERATIONAL_EXCELLENCE`-winning texts to raise its multiplier while feeding `CAUTIOUS_GROUNDEDNESS`-winning texts to keep CG from being dampened). The targets in the frozen suite were constructed with white-box analysis of the lever's arithmetic — disclosed here so the attack is understood to be worst-case, not incidental:

**The measured ceiling.** `OPERATIONAL_EXCELLENCE`'s pattern confidence is hardcoded at 0.9 and its recorded (uncalibrated) confidence is therefore always 0.9, so its self-calibration multiplier is bounded: `1 + (winRate − 0.9)·0.4 ≤ 1 + 0.1·0.4 = 1.04`. Single-pattern parliament confidence is `min(0.9·m, 0.99)·0.9`, which the 1.04 ceiling moves from 0.810 to at most 0.842. The gate is 0.8. So the entire mintable band is the narrow strip where a coherence penalty pulls factory parliament confidence just below 0.8 and the ≤ 0.842 boosted value carries it back over — arithmetically ≤ ~0.03 wide, and only for a non-MODERATE coherence multiplier (×0.95: factory 0.769 → boosted 0.800; a MODERATE ×0.85 gives boosted 0.716, unreachable). The frozen targets aim at exactly this strip.

## Protocol

For each of the ~50 grooming configurations the harness constructs from the frozen streams (the extremes: OE-max alone; OE-max with CG held neutral; OE-max with CG dampened; the shipped mixed order), the loop is run to convergence, then each frozen target and positive control is evaluated **under the resulting groomed calibration** (the shipped `analyzeCathedral(text, {patternCalibration, calibrationLabel})` path). Factory verdicts computed with no opts. The evaluator and loop are imported unmodified. Deterministic.

## Pre-registered gates

**RT-MINT — NO ADVERSARIAL MINT SURVIVES.** For every (grooming configuration × target) pair: if the target reads non-operational-family at factory and operational-family under the groomed calibration, it is a **mint**, and the mint must be structural — 20 seeded word-shuffles under the same groomed calibration, pooled retention < 20% and no shuffle-family-rate ≥ 10/20 — or the gate FAILS. Zero mints passes the gate (the expected outcome given the ceiling), and the run reports *why* zero: the closest any target came to crossing (max groomed parliament confidence among non-family targets), so "no mint" is quantified, not merely asserted.

**RT-SENSITIVITY — NO ADVERSARIAL DESTRUCTION OF THE FLAGSHIP.** The positive control `PC1` (genuine flagship) must read `OPERATIONALLY SOUND` under **every** groomed configuration, and `PC2` (benign) must stay out of the family under every configuration. A grooming stream that *destroys* a genuine flagship verdict (dampening `OPERATIONAL_EXCELLENCE` below the gate) is a real availability attack and FAILS — the mirror of the mint gate, since the KEP run showed the same lever dampens on some streams.

**RT-CEILING (reported, no gate).** The maximum multiplier the harness achieves for each pattern across all grooming configurations, against the analytic bound (OE ≤ 1.04). A measured multiplier exceeding the analytic bound would be a defect in `progression.js`; matching it confirms the arithmetic.

**RT-ENVELOPE (reported).** Across all grooming runs: any clamp violation, any active-map change without a 1:1 evidence-bearing ledger entry. The A1/B1 contract, re-checked under adversarial input.

## What would count as what

- **RT-MINT PASS with zero mints + RT-SENSITIVITY PASS** → autonomy is not weaponizable through the calibration lever on the reachable registers: the arithmetic ceiling holds against a white-box attacker, the flagship survives grooming in both directions, and the adversarial territory named in v3.40.0 closes as *bounded by construction*. The honest residue is stated: this closes the **verdict-status** attack; it does not address an attacker who controls the *ledger/exported state* directly (out of scope — that is device compromise, not stream steering).
- **RT-MINT PASS with structural mints** → the lever can move a verdict adversarially but only when the moved verdict is genuinely structural; the mint rate and its shuffle evidence become the documented behavior.
- **RT-MINT FAIL** → a laundered mint exists: grooming credits vocabulary the factory instrument refuses. The finding outranks any fix; the freeze switch becomes a security recommendation and the offending (grooming, target) pair goes to the ledger.
- **RT-SENSITIVITY FAIL** → grooming is an availability attack on the flagship; same consequence.

No core or loop changes ship with this run regardless of outcome. Results: `validation/results-autonomy-adversary-validation.json`; findings: `docs/AUTONOMY-ADVERSARY-VALIDATION.md`.
