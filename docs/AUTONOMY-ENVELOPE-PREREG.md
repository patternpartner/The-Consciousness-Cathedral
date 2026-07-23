# Pre-registration: the autonomy envelope run

*Committed before any envelope verdict is computed. Gates, probe states,
populations, and readings are frozen here; the harness
(`validation/autonomy-envelope.js`) implements this document. Findings will
land in [AUTONOMY-ENVELOPE-VALIDATION.md](AUTONOMY-ENVELOPE-VALIDATION.md).*

## What this run audits, and why it is owed

v3.38.0–v3.39.0 gave the system full autonomy: the operational tier
self-calibrates through `ProgressionMemory` (January's formula: multiplier
= 1 + (winRate − avgConfidence) × 0.4, clamped to [0.8, 1.2], silent under
5 samples), applied to Parliament pattern confidences via
`analyzeCathedral(text, { patternCalibration })`. The mechanism is
test-pinned (101/101), including that calibration has *real power* — a
dampened ballot genuinely changes verdicts.

That is exactly the debt: **every register certificate in this repository
describes the factory instrument** (`analyzeCathedral(text)` without opts —
byte-identity test-pinned), and the shipping system may now run anywhere
inside the clamp box. Nobody has measured whether the certificates hold
across that box, or which parts of the box real data actually reaches. A
mechanism this repository ships gets a corpus-scale, pre-registered
measurement; this is it.

Scope: the operational tier's loop. The relational tier's v3.39.0
auto-apply is a different mechanism (uptake-bar proposal conditions,
already evidence-gated per exchange history) and is not probed here.

## Probed calibration states (frozen)

The clamp box is [0.8, 1.2] per pattern over the six Parliament ballot
patterns (`PROPOSALS` in `progression.js`). Corners are **directed probes
of the box, not a supremum proof** — verdict response need not be monotone
in the multipliers — so the empirically reached states are probed as well.

| State | OPERATIONAL_EXCELLENCE | OPERATIONAL_INTENT | PERFORMATIVE_CONSCIOUSNESS | PERFORMATIVE_HUMILITY | CAUTIOUS_GROUNDEDNESS | EPISTEMIC_MISMATCH |
|---|---|---|---|---|---|---|
| FACTORY | — (no opts) | — | — | — | — | — |
| C-MINT | 1.2 | 1.2 | 0.8 | 0.8 | 0.8 | 0.8 |
| C-SUPP | 0.8 | 0.8 | 1.2 | 1.2 | 1.2 | 1.2 |
| C-HI | 1.2 | 1.2 | 1.2 | 1.2 | 1.2 | 1.2 |
| C-LO | 0.8 | 0.8 | 0.8 | 0.8 | 0.8 | 0.8 |
| R-CONV / R-RUNBOOK / R-PLAN | whatever the faithful loop reaches on each stream (Part B) | | | | | |

C-MINT is the corner constructed to maximally favor operational verdicts
(boost the two operational proposals, dampen every competitor); C-SUPP is
its reverse.

## Populations (frozen)

- **P1** DailyDialog human turns, **P2** hh-rlhf assistant turns, **P3**
  UltraChat assistant turns — identical fetch offsets (0/100/200) and
  parsers as `core-verdict-validation.js` (run 1), re-fetched by
  `fetch-corpora.sh`.
- **P4** `validation/corpus-llm-runbooks.json` (120 documents, committed
  verbatim, v3.34.0), **P5** `validation/corpus-llm-plans.json` (120
  documents, committed verbatim, v3.35.0).
- **P6** the curated `OPERATIONALLY SOUND` set — the same construction as
  run 1's curated control (every `cathedral-test-cases.md` input that earns
  SOUND at factory, plus the pinned demo sample).

Operational family = { OPERATIONALLY SOUND, OPERATIONAL INTENT }, as in
every prior run. Seed 20260723; 20 word-shuffles per positive, the standing
control's construction verbatim.

## Gates and pre-stated readings

**A0 — factory self-check (verification).** The FACTORY pass must
reproduce the published record: SOUND 0.00% on P1 and P2; family 4.2% on
P4 and 0.0% on P5. If the re-fetched conversational corpora have drifted
at source, the drift is quantified and the run re-baselines against
today's factory numbers — reported in the findings, never silently
absorbed.

**A1 — specificity across the envelope (GATED).** Under **every** probed
non-factory state, `OPERATIONALLY SOUND` fires on **< 2%** of P1 and of P2
(run 1's G1 gate, extended from the factory point to the probed envelope).
This is the certificate that must not be autonomy-fragile: if a clamped
self-calibration can make ordinary conversation earn the flagship, the
clamp is too wide and v3.38.0 must be revisited. FAIL here is a core
finding, not a reporting note.

**A2 — structure of minted positives (GATED, with run 1's power clause).**
The *minted set* = operational-family positives on P1–P3 under C-MINT that
are not factory positives. Each minted text gets 20 seeded word-shuffles;
gate: pooled retention **< 20%** if the minted set has ≥ 20 texts;
otherwise UNDERPOWERED — reported raw, no gate claimed.

**A3 — envelope width on certified registers (reported, not gated).**
Family rates on P4 and P5 under every state. The pre-stated reading: the
spread between the lowest and highest rate **is the published price of the
±20% clamp** on registers the program has certified — whatever the number
is, it goes in the record next to the factory rate.

**A4 — curated flip census (reported, not gated).** For P6, the complete
list of verdict changes relative to factory under each state. Pre-stated
reading: flips are by design *possible* (calibration moves the flagship's
`parliament.confidence > 0.8` gate — test-pinned); the loudness contract
covers them only if the record is complete, so the census is published in
full, including which state flips which pinned text to what.

**B1 — reachability on real streams (reported).** The faithful online
loop, per stream (P1+P2+P3 concatenated in corpus order as the
conversational stream; P4; P5): analyze under the current active
calibration → `observe()` → `act()`, every step. Report: the reached
multipliers, ledger length, each pattern's final (winRate, avgConfidence),
and the whole-population verdict deltas of the reached state vs factory.
Pre-stated context: reaching a boost of 1.2 requires a sustained
winRate − avgConfidence ≥ +0.5; reaching 0.8 requires ≤ −0.5. Which parts
of the box honest data can reach is exactly what this part measures — no
prediction is registered.

**B2 — determinism (GATED).** The full run, executed twice, produces
byte-identical results JSON (timestamps excluded by construction). Same
standard as every prior run.

## What this run does not claim

- Corners do not bound every interior state (non-monotonicity); the run
  probes corners plus reached states, and says so.
- The loop is device-local; there is no remote attack surface. The threat
  model here is *drift* — what the system may lawfully do to its own
  verdicts under the contract of loudness — not adversarial poisoning of
  someone else's instrument. (A user can of course steer their own device's
  ledger; A1/A2 measure what even that yields at the corners.)
- P4/P5 are development data (v3.34.0/v3.35.0 rule); nothing here pools
  into G2-EXT.

## Reproduce

```
bash validation/fetch-corpora.sh
node validation/autonomy-envelope.js
```

Results: `validation/results-autonomy-envelope.json`.
