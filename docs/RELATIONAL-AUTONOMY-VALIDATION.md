# The relational autonomy run — findings

*Run date 2026-07-23. Pre-registered in
[RELATIONAL-AUTONOMY-PREREG.md](RELATIONAL-AUTONOMY-PREREG.md) (committed
`426a91b`, before any verdict was computed under the loop). Harness:
`validation/relational-autonomy-validation.js`; results:
`validation/results-relational-autonomy-validation.json`; deterministic —
the full run executed twice produced byte-identical results (RA1(d) PASS).
Fifth run of [AUTONOMY-PROGRAM.md](AUTONOMY-PROGRAM.md); the first aimed
at the relational tier's v3.39.0 auto-apply.*

## Headline

**The relational loop is the live one.** Four runs found the operational
tier's self-calibration nearly inert on real data — clamped, narrow,
zero verdicts moved. The same audit aimed at the relational tier finds
the opposite temperament: the auto-apply **fired on every real stream**,
within the first 15–46 exchanges, and it **costs real verdicts** — 4, 11,
and 35 of 300 exchanges per stream read stricter under the loop than at
factory. Every change ran in the strict direction (RA2 PASS: nothing
minted anywhere, including at the suppression corner — the
strictly-tightening construction claim is now a measurement), through
exactly one demotion channel (`GENERATIVE EXCHANGE` →
`COLLABORATIVE UPTAKE`, one rung), and every clause of the loudness
contract held (RA1 PASS). What v3.39.0 shipped without a number now has
one: on real streams, removing the human gate replaces one click per
stream — and buys a measured, announced, reversible strictness drift.

## RA0 — factory baselines (reported)

300 conversations per stream, conversation-level, run 1's offsets:

| Verdict | S1 DailyDialog | S2 hh-rlhf | S3 UltraChat |
|---|---|---|---|
| GENERATIVE EXCHANGE | 9 | 18 | 125 |
| COLLABORATIVE UPTAKE | 45 | 49 | 74 |
| ASYMMETRIC UPTAKE | 87 | 92 | 12 |
| PARALLEL MONOLOGUES | 131 | 57 | — |
| MIRRORED EXCHANGE | — | — | 89 |
| INSUFFICIENT EXCHANGE | 28 | 84 | — |

(First conversation-level baseline for these streams; the relational
validation runs used different units. The AI–AI register's mirror
signature shows up again unprompted: 89 of 300 UltraChat conversations
read `MIRRORED EXCHANGE`.)

## RA3 — the fire census: it fires everywhere (reported)

One fire per stream, early:

| Stream | fired after | bar | evidence |
|---|---|---|---|
| S1 DailyDialog | exchange 46 | 0.35 → **0.67** | 43 exchanges, 30 samples, p25 = 0.50 |
| S2 hh-rlhf | exchange 36 | 0.35 → **0.60** | 21 exchanges, 37 samples, p25 = 0.50 |
| S3 UltraChat | exchange 15 | 0.35 → **0.45** | 15 exchanges, 54 samples, p25 = 0.36 |

The rule behaved exactly as designed — and that is the finding. Real
dialogue's uptake novelty sits broadly above the factory bar (25th
percentiles 0.36–0.50 against 0.35), so the personalization rationale
("a bar nearly everything clears no longer discriminates") is satisfied
by *ordinary* streams, not unusual ones. Corollary: **under v3.39.0,
essentially every real user's device will self-recalibrate within their
first few dozen pastes.** This is not drift-in-theory; it is near-certain
self-recalibration in ordinary use. No further fires occurred after the
first on any stream (the raised bar discriminates again).

## RA2 — no minting, anywhere: PASS (GATED)

Zero exchanges gained `GENERATIVE EXCHANGE` relative to factory — under
the online loop, under every end-state, and under C-MAX (bar 1.01, above
the metric's range). The pre-registered construction argument (the rule
only raises the bar; a higher bar only reclassifies TRANSFORMATIVE →
WEAK; SEMANTIC is novelty-independent) survived its measurement. The
relational tier's autonomy, like the operational tier's, can only make
the instrument stricter — but see the temperament contrast below.

## RA4 — the demotion census: real, single-channel, one rung (reported)

Every observed delta on every pass of every stream is
`GENERATIVE EXCHANGE` → `COLLABORATIVE UPTAKE` (verified over full delta
sets, not samples):

| Pass | S1 | S2 | S3 |
|---|---|---|---|
| online loop | 4 | 11 | 35 |
| end-state over whole stream | 4 | 13 | 38 |
| C-MAX (bar 1.01) | **9 of 9** | **18 of 18** | **125 of 125** |

Two facts worth stating plainly. First, the loop's real cost: on the
UltraChat-like stream, 35 of 300 verdicts (28% of the stream's factory
`GENERATIVE` population) read one rung stricter than the factory
instrument would have said — each stamped `personal calibration v1`, each
attributable to the single ledger entry that moved the bar. Second, the
corner: at C-MAX the census equals the factory `GENERATIVE` count exactly
on all three streams — **zero of 152 `GENERATIVE` verdicts survive on
SEMANTIC-only transformative uptake.** The tier's top verdict is entirely
novelty-carried; the envelope width at the corner is 100% of it.

## RA1 — loudness contract: PASS (GATED), with one prereg deviation ledgered

Entries 1:1 with fires and evidence-bearing; per-step reproducibility 0
failures (every verdict reproduces byte-identically under the overrides
active at its position); whole-run determinism byte-identical.

The deviation: the prereg's RA1(b) said factory verdicts carry "no
calibration field." The module's actual contract is **stronger** — every
result names its ruler, factory included (`calibration.source:
'defaults'`; relational-core.js: "Every result declares which ruler
measured it"). The first harness draft encoded the prereg's wrong
expectation and flagged all pre-fire verdicts; the check was corrected to
the module's stronger contract before the definitive run (both runs in
this session's log). No gate moved in a lenient direction: the corrected
check demands a stamp on *every* verdict.

## The temperament contrast, and what bounds each tier

| | Operational tier | Relational tier |
|---|---|---|
| lever | pattern-confidence multipliers | the TRANSFORM_NOVELTY bar |
| hard bound | clamp [0.8, 1.2] | **none** — bounded only by the fed corpus's median (≤ ~1.0) |
| reachable by real streams | ≤ 1.10× (half the clamp) | 0.45–0.67 in 300 exchanges; the corner is approachable by construction |
| fires on real data | rarely (2 of 6 patterns ever cross the floor) | **every stream, within 15–46 exchanges** |
| verdict cost measured | 0 everywhere | 4–35 per 300 exchanges |
| direction | strict only (measured) | strict only (measured + construction) |
| blast radius | flagship gate on curated-shape text | exactly one rung of one verdict |

`relational-calibration.js`'s header warns that an instrument
auto-applying its own proposals "can be steered by whoever controls what
it's fed — the chimera lesson." On this tier the warning is *live* in the
suppression direction: with no clamp, a fed stream can push the bar
toward extinguishing `GENERATIVE EXCHANGE` for subsequent verdicts (the
C-MAX column is that endpoint, and unlike the operational corners it is
approachable). What keeps this inside the v3.39.0 contract: the change is
strictly tightening (RA2), one rung wide, announced at the verdict,
ledgered with its evidence, stamped on everything it touches, reversible,
and freezable — and device-local, so the only instrument a steerer can
tighten is their own. The residue that is *not* covered by any mechanism:
the rate. A user who pastes ordinary exchanges gets a stricter instrument
within dozens of pastes, and nothing in the design ever loosens it again
(no rule proposes lowering the bar). Named for the ledger: **the bar is a
ratchet** — monotone by construction, with reset as the only way down.

## Honest limits

- Found corpora as paste-history proxies (disclosed in the prereg);
  conversation-level parsing choices (alternating A/B for DailyDialog)
  are the harness's, not the corpora's.
- One proposal rule exists; this run audits it, not future rules.
- Demotions are *changes*, not errors: no gold labels exist for
  "transformative on your data," so this run measures the cost and
  direction of personalization, not its quality. Whether the raised bar
  is better calibration for the user is the design's claim and remains
  untested — it would need human judgment against the same exchanges.
- S3's census dominates because UltraChat is GENERATIVE-heavy at factory
  (125/300); the rate on a user's own mix depends on their mix.

## What this changes

The autonomy program's scope statement — "the relational tier would need
real paste-history, which only usage produces" — is retired; found
dialogue corpora audit the loop fine. The program now covers both tiers,
and the two-tier statement gets its measured form: **same contract,
opposite temperaments.** The operational loop is clamped, narrow, and
nearly inert; the relational loop is unclamped, single-channel, and live
on every real stream. Both only tighten; both say so on every verdict.
The ratchet residue is the open item this run adds to the ledger.

Reproduce: `bash validation/fetch-corpora.sh`, then
`node validation/relational-autonomy-validation.js` (twice, for RA1(d)).
