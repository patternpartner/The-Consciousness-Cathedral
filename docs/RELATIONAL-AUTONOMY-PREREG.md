# Pre-registration: the relational autonomy run

*Committed before any verdict is computed under the relational loop. Gates,
streams, probe states, and readings are frozen here; the harness
(`validation/relational-autonomy-validation.js`) implements this document.
Findings will land in
[RELATIONAL-AUTONOMY-VALIDATION.md](RELATIONAL-AUTONOMY-VALIDATION.md).*

## What this run audits, and why it is owed

The autonomy program ([AUTONOMY-PROGRAM.md](AUTONOMY-PROGRAM.md)) has four
runs — all on the **operational** tier's loop. The relational tier got full
autonomy in the same release (v3.39.0: the page auto-accepts the
`CalibrationLedger` proposal instead of waiting for a human) with
mechanism-level verification only. The envelope run's findings named the
gap and excused it with "a corpus-scale audit would need a stream of real
paste-history, which only usage produces" — but the register program's own
idiom accepts found corpora as disclosed proxies, and real dialogue
corpora are exactly what a user pastes into the relational room. The
excuse doesn't survive its own program. This run retires it.

One more reason it is owed: `relational-calibration.js`'s header still
argues *against* auto-apply ("an instrument that auto-applies its own
proposals can be steered by whoever controls what it's fed — the chimera
lesson"). v3.39.0 overrode that warning deliberately; nobody has measured
what the override costs on real streams. This run measures it.

## The loop under audit (as shipped, replayed verbatim)

The unified page's v3.39.0 wiring (`cathedral-unified-2.html`), per
exchange: analyze under the ledger's current overrides
(`RelationalCathedral.analyzeExchange(turns, { calibration, calibrationLabel })`)
→ `ExchangeMemory.record(result)` → `CalibrationLedger.propose(mem.data)`
→ if a proposal exists, `accept()` it — no human step. Modules unmodified.
The only proposal rule is TRANSFORM_NOVELTY personalization: fires when
≥ 8 exchanges / ≥ 30 pooled uptake samples and the 25th percentile of
uptake novelty clears the current bar; proposes the corpus median.

**Construction claim to be tested, stated in advance:** the rule can only
*raise* the bar (it fires only when p25 > current), and a higher bar can
only reclassify TRANSFORMATIVE uptake to WEAK (SEMANTIC is
novelty-independent) — so the relational tier's self-calibration should be
strictly tightening: it can demote `GENERATIVE EXCHANGE` (which requires
transformative uptake in both directions), never mint it. The gates below
turn that argument into a measurement.

## Streams (frozen)

Real dialogues, conversation-level, from the corpora already fetched at
run 1's offsets (0/100/200; `fetch-corpora.sh`):

- **S1** DailyDialog: 300 human–human conversations (speakers A/B
  alternating).
- **S2** hh-rlhf: 300 human–AI conversations (`chosen` transcripts,
  Human/Assistant turns).
- **S3** UltraChat: 300 user–AI conversations (messages, User/Assistant).

Each stream runs with fresh device state (empty notebook, empty ledger),
in corpus order. Exchanges too short for round-trip structure receive the
analyzer's honest refusal verdicts; they stay in the stream (the notebook
records what the page would record).

## Probed states beyond the loop

- **End-state per stream:** the final ledger overrides, applied to the
  whole stream (envelope-style census).
- **C-MAX:** `TRANSFORM_NOVELTY = 1.01` — the suppression corner, above
  the novelty metric's range, unreachable by the proposal rule (which
  proposes an observed median ≤ 1.0). The analogue of the operational
  box's corners: what full suppression of novelty-based transformative
  uptake costs, regardless of how the bar got there.

## Gates and pre-stated readings

**RA0 — factory baseline (reported).** Verdict distributions per stream at
factory calibration. No published conversation-level baseline exists for
these streams; this run's factory pass becomes that baseline.

**RA1 — loudness contract (GATED).**
(a) Every self-applied change appends exactly one evidence-bearing ledger
entry (changes and entries 1:1, evidence fields populated);
(b) every verdict computed after a change carries the calibration stamp
(`result.calibration.source` = the ledger's label), and every verdict
before the first change carries no calibration field;
(c) reproducibility: re-analyzing any exchange under the overrides active
at its position reproduces its verdict byte-identically;
(d) determinism: the full run executed twice produces byte-identical
results JSON (ledger timestamps excluded by construction).

**RA2 — no minting, anywhere (GATED).** Relative to the factory pass, no
exchange gains `GENERATIVE EXCHANGE` under the online loop, under any
stream's end-state, or under C-MAX. This is the construction claim as a
gate: a single upgrade anywhere falsifies the "strictly tightening"
argument and is a core finding against v3.39.0.

**RA3 — fire census (reported).** Whether, where, and how often the
proposal fires on each real stream; the evidence sentences verbatim; the
reached bar values. No prediction registered — whether real dialogue
novelty distributions ever satisfy the rule is exactly what this measures.

**RA4 — demotion census (reported).** Verdict deltas vs factory per
stream under the online loop, the end-states, and C-MAX — each delta
listed with from → to. The C-MAX census is the relational tier's envelope
width: the published price of the bar's extreme, whatever it is. The
pre-stated reading of a nonzero census: demotions are the strict
direction, covered by the loudness contract (stamped, ledgered,
reversible); their *rate* is the number the record was missing.

## What this run does not claim

- One proposal rule exists today; this audits it, not future rules.
- The streams are found corpora standing in for paste-history — disclosed
  proxy, same status as every register corpus.
- Device-local threat model, as in the envelope run: steering one's own
  ledger is self-inflicted and loudly recorded; what this run bounds is
  what any stream (honest or engineered) can make the tier do — which,
  if RA2 holds, is only: become stricter, visibly.

## Reproduce

```
bash validation/fetch-corpora.sh
node validation/relational-autonomy-validation.js
```

Results: `validation/results-relational-autonomy-validation.json`.
