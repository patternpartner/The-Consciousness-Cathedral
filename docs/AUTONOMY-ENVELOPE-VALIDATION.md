# The autonomy envelope run — findings

*Run date 2026-07-23. Pre-registered in
[AUTONOMY-ENVELOPE-PREREG.md](AUTONOMY-ENVELOPE-PREREG.md) (committed
`0b8479a`, before any envelope verdict was computed). Harness:
`validation/autonomy-envelope.js`; results:
`validation/results-autonomy-envelope.json`; seed 20260723; deterministic —
the full run executed twice produced byte-identical results (B2 PASS).*

## The question

v3.38.0–v3.39.0 let the system recalibrate itself: `ProgressionMemory`
multiplies Parliament pattern confidences inside a hard clamp box
[0.8, 1.2]. Every register certificate describes the factory instrument;
the shipping system may lawfully run anywhere in the box. This run measured
(A) whether the load-bearing certificates hold across the probed box, and
(B) which parts of the box real data actually drives the loop to.

## Headline

**The clamp box is verdict-safe where it matters, nearly toothless on the
certified registers, and honest data barely enters it.** Across every
probed state — four corners plus the three states real streams reached —
the flagship fired on 0 of 2,956 gated conversational turns; the minting
corner minted nothing anywhere in 3,889 turns; family rates on the two
committed LLM registers did not move by a single document; and the faithful
loop, run over 4,129 real texts, reached multipliers of at most 1.1×
(half the clamp's allowance) and changed **zero** verdicts. The one probe
with teeth ran in the *strict* direction: full-ballot dampening (C-LO)
demoted the curated flagship sample `OPERATIONALLY SOUND` →
`SUBSTRATE VISIBLE` — the exact behavior the mechanism test pins as
"calibration has real power," now located in corpus context.

## A0 — factory self-check: REPRODUCED

| Population | n | published | measured |
|---|---|---|---|
| P1 DailyDialog SOUND | 2,206 | 0.00% | 0.00% |
| P2 hh-rlhf assistant SOUND | 750 | 0.00% | 0.00% |
| P4 LLM runbooks family | 120 | 4.2% | 4.17% |
| P5 LLM rollout plans family | 120 | 0.0% | 0.00% |

The conversational corpora were re-fetched at run 1's exact offsets; no
source drift. One harness-fidelity note for the record: the first draft of
the loader fed P4/P5 raw markdown and measured 3.33% family on P4 — the
certified 4.17% is measured on `stripMarkdown`-preprocessed text (the
register program's standing preprocessing, ported verbatim from
`llm-runbook-validation.js`). The loader was corrected to match the
certifying runs before the definitive run; no gate was moved.

## A1 — flagship specificity across the probed envelope: PASS (GATED)

`OPERATIONALLY SOUND` fired on **0 of 2,206** DailyDialog turns and
**0 of 750** hh-rlhf assistant turns under *every* probed state — C-MINT,
C-SUPP, C-HI, C-LO, R-CONV, R-RUNBOOK, R-PLAN — against the < 2% gate.
Run 1's G1 certificate extends from the factory point to the entire probed
box: **the flagship's specificity is not autonomy-fragile.** The mechanism
is visible in the routes: every `OPERATIONALLY SOUND` path requires
structural preconditions (bound failure→threshold→action designs, the
effective-explicit floor) that a confidence multiplier cannot conjure.
Calibration moves confidence; it does not create structure. The
confidence gates it can move only matter for texts that already hold the
structure — and ordinary conversation does not.

## A2 — what the minting corner mints: NOTHING (vacuous)

The minted set — operational-family positives under C-MINT that are not
factory positives, across all 3,889 conversational turns including
ungated UltraChat — is **empty** (n = 0). The pre-registered shuffle gate
is therefore UNDERPOWERED by emptiness, which is the strongest available
form of the result: there was nothing to test because the maximally
minting corner created no positive anywhere. Reported per the power
clause; no gate claimed.

## A3 — envelope width on the certified registers: 0.00% (reported)

Family rates under all eight states (factory + seven probed):

| Register | FACTORY | C-MINT | C-SUPP | C-HI | C-LO | R-* | width |
|---|---|---|---|---|---|---|---|
| P4 LLM runbooks | 4.17% | 4.17% | 4.17% | 4.17% | 4.17% | 4.17% | **0.00%** |
| P5 LLM rollout plans | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% | **0.00%** |

Not one of the 240 documents changed family membership at any probed
state. The published price of the ±20% clamp on the certified registers,
measured at the corners: zero. Same mechanism as A1 — on real registers
the family verdicts ride structural routes, not the confidence continuum.

## A4 — curated flip census: one flip, in the strict direction (reported)

Curated `OPERATIONALLY SOUND` set (n = 3 — the pinned demo sample plus the
test-case inputs that earn SOUND at factory): across all seven probed
states, exactly **one** verdict change — under **C-LO** (everything ×0.8),
the pinned flagship sample demotes `OPERATIONALLY SOUND` →
`SUBSTRATE VISIBLE`. C-MINT, C-SUPP, and C-HI flip nothing.

Two things worth saying plainly. First, this is the behavior
`run-progression-tests.js` pins as *real power* — the census locates it:
the box's teeth exist, they bite texts that genuinely hold the flagship's
structure, and they bite in the direction of **withholding** an earned
verdict, not granting an unearned one. Second, the census is small
(n = 3); it enumerates the repo's own pinned SOUND texts, no more.

**The asymmetry, stated:** on every population probed, the autonomy loop
can make the instrument stricter (demote earned verdicts under dampening)
but was nowhere observed to make it more generous (no minting at any
state, on any corpus). The risk the loudness contract actually carries is
suppression — and a suppressed verdict is stamped with the calibration
that suppressed it, which is exactly what the contract is for.

## B1 — what honest data actually does: almost nothing (reported)

The faithful online loop (analyze under current active calibration →
`observe` → `act`, every step, corpus order):

| Stream | reached state | ledger | verdict deltas vs factory |
|---|---|---|---|
| R-CONV (P1+P2+P3, 3,889 turns) | PERFORMATIVE_CONSCIOUSNESS × 1.016 | 7 entries | **0** / 3,889 |
| R-RUNBOOK (P4, 120 docs) | CAUTIOUS_GROUNDEDNESS × 1.009, OPERATIONAL_INTENT × **1.10** | 7 entries | **0** / 120 |
| R-PLAN (P5, 120 docs) | CAUTIOUS_GROUNDEDNESS × 1.028 | 3 entries | **0** / 120 |

January's formula (gap × 0.4) is nearly inert on honest data because
firing patterns win at roughly their own confidence: the largest observed
gap was OPERATIONAL_INTENT on the runbook stream (win rate 100% vs average
confidence 75% over 10 samples → 1.10×, the biggest multiplier any real
stream reached — still half the clamp's allowance), and even that boost
changed zero verdicts on its own stream. Reaching the 1.2 corner requires
a sustained gap of +0.5; no honest stream came within a factor of four of
it. The dampening corner (0.8) requires a pattern that keeps proposing
confidently and keeps losing — also unobserved. **The corners are
reachable only by construction, not by data**; and per A1–A3, even by
construction they mint nothing.

The ledger discipline held throughout: every reached state above is the
last entry of an append-only ledger whose entries carry their evidence
("won 10/10 (100%) against average confidence 75%"), and the whole run is
reproducible from the exported state (B2).

## B2 — determinism: PASS (GATED)

The complete run, executed twice, produced byte-identical
`results-autonomy-envelope.json` (no timestamps are written by
construction).

## Honest limits

- Corners plus reached states are **directed probes of the clamp box, not
  a supremum proof** — verdict response need not be monotone in the
  multipliers. What is claimed is exactly what was measured: eight states,
  five populations, zero minting, one strict-direction flip.
- The curated census is n = 3; A2's cleanliness is vacuous (nothing
  minted to test). Both reported as such.
- P4/P5 remain development data (v3.34.0/v3.35.0 rule); nothing here
  pools into G2-EXT.
- The relational tier's v3.39.0 auto-apply is out of scope here; its
  evidence conditions are per-device exchange history and were verified at
  the mechanism level in v3.39.0. A corpus-scale audit of that tier would
  need a stream of real paste-history, which only usage produces.

## What this changes

The v3.38.0 reopening shipped on a contract of loudness; this run adds the
measurement the contract was owed: **within its clamp, on every population
the program has certified, the autonomous loop cannot mint an unearned
operational verdict — at worst it withholds an earned one, loudly.** The
register certificates, written for the factory instrument, now carry a
measured statement about the whole probed envelope rather than a hope.

Reproduce: `bash validation/fetch-corpora.sh`, then
`node validation/autonomy-envelope.js` (twice, to check B2).
