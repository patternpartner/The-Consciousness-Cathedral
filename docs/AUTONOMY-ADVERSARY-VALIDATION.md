# The calibration-steering adversary: autonomy is not weaponizable through the lever

**Pre-registration + frozen suite:** `docs/AUTONOMY-ADVERSARY-PREREG.md` and `validation/autonomy-adversary-attacks.js`, committed together at `9b7884c` before the scored run; one shot, no iteration.
**Harness:** `validation/autonomy-adversary-validation.js` — evaluator and loop imported unmodified, seven grooming configurations × seven targets + two positive controls. Deterministic, verified identical on re-run. Results: `validation/results-autonomy-adversary-validation.json`.

## Verdict on the gates: all PASS

| Gate | Result |
|---|---|
| RT-MINT | **PASS** — 0 adversarial mints across all 49 (grooming × target) pairs; the closest any non-family target came to the 0.8 gate was parliament confidence **0.738**, and that was at *factory* — grooming moved it further away, not closer |
| RT-SENSITIVITY | **PASS** — the genuine flagship control stayed `OPERATIONALLY SOUND` and the benign control stayed out of the family under every one of the seven groomings |
| RT-CEILING | measured max multiplier `OPERATIONAL_EXCELLENCE` = **1.04**, exactly the analytic bound; `CAUTIOUS_GROUNDEDNESS` never exceeded 1.0 under any attack |
| RT-ENVELOPE | **PASS** — 0 clamp violations, 0 unledgered active-map changes under adversarial input |

The last named unprobed territory of the autonomy arc closes as **bounded by construction**: a white-box attacker controlling the entire input stream cannot use the calibration lever to mint a verdict the factory instrument refuses.

## Why it cannot be done — three independent walls

**1. The arithmetic ceiling (measured, matches the bound to the digit).** `OPERATIONAL_EXCELLENCE`'s pattern confidence is hardcoded at 0.9, so the loop records it at 0.9 every time, and its self-calibration multiplier is `1 + (winRate − 0.9)·0.4 ≤ 1.04`. The harness drove it to exactly 1.04 and no further, across every grooming order. Single-pattern parliament confidence is therefore bounded at `min(0.9·1.04, 0.99)·0.9 = 0.842`. The gate is 0.8. The entire adversarial headroom above the gate is 0.042 — and it exists only where the text already clears 0.8 unaided.

**2. Firing conditions and the sub-gate band are nearly disjoint (measured).** For the lever to matter, a target must fire `OPERATIONAL_EXCELLENCE` *and* sit just below 0.8. Every frozen knife-edge target aimed at that strip missed it in the same direction: the moment operational structure is diluted enough to drop parliament confidence toward the gate, `OPERATIONAL_EXCELLENCE` stops firing as a pattern and the text reaches its verdict through the count-based routes at parliament confidence 0.30 — where the lever is disconnected entirely (T3–T7 all read their verdict at 0.3 with OE not firing, unchanged by any grooming). The one target that fires OE near the gate (T1) sits at 0.81 → 0.842 under max grooming: already flagship, nothing to mint. The mintable configuration the prereg identified arithmetically (OE firing + one MINOR coherence penalty, factory ≈ 0.769) was not realized by any constructed target, because the coherence-penalty language and the OE firing conditions did not co-occur.

**3. The interleaving attack is defeated by pattern coupling (measured).** The prereg's strongest attack was independent control: raise `OPERATIONAL_EXCELLENCE` while feeding `CAUTIOUS_GROUNDEDNESS`-winning texts to keep CG from being dampened, so a two-pattern target keeps its higher confidence. It fails structurally: the only texts that fire OE (`OPERATIONAL_EXCELLENCE` needs bound failure structure) *also* fire CG as a co-pattern and make it **lose** (the verdict is `OPERATIONALLY SOUND`, not CG's proposed `SUBSTRATE VISIBLE`). So every OE-grooming document is simultaneously a CG loss, and in all seven configurations that grew OE, CG was driven to the 0.8 clamp floor — including the 1:1 and 3:1 interleavings. The attacker cannot raise OE without dampening CG. And the sign works against them: on the one target that fires CG near the gate (T2, factory 0.738, `SUBSTRATE VISIBLE`), aggressive grooming *lowered* parliament confidence to 0.590 — grooming pushed a near-gate verdict away from the family, never toward it. (CG has no operational-family verdict route regardless, so even an undampened CG boost could not mint family membership.)

## The honest residue

This closes the **verdict-status** attack: no groomed stream makes the instrument accept a target it would reject. It does **not** address an attacker who controls the exported ledger state directly — but that is device compromise (writing arbitrary calibration into `localStorage`/the exported JSON), not stream steering, and it is out of scope for the same reason the register program never modeled an attacker editing `cathedral-core.js`: the threat is the input, not the binary. Two narrower limits are also real: the grooming ran to multiplier fixed points on repeated texts (a real attacker's fixed points are identical — the formula is order-independent, confirmed in v3.41.0 — so this is not a weakness), and the targets, though constructed white-box, are a finite battery; the arithmetic ceiling (wall 1) is what makes the finite battery sufficient, since it bounds *every* possible target, constructed or not.

## Where this leaves the autonomy arc

Three runs, one conclusion measured from three angles. v3.40.0: the loop amplifies but its stream never reached a boundary. v3.41.0: the lever's only verdict-changing path is the flagship pattern gate, and real long plans reach the flagship by count routes the lever cannot touch. v3.42.0 (this run): even a white-box attacker who *engineers* the stream to reach that gate cannot cross it, because the lever's ceiling (1.04×), its disjoint firing band, and its pattern coupling each independently forbid the mint. The self-calibrating loop is loud, clamped, reversible — and, on the reachable registers, unweaponizable. The freeze switch remains a preference, not a security control.
