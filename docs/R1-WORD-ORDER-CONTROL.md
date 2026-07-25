# R1 word-order control — a failed prediction, and what it costs

*2026-07-25. The control the relational program never ran, run. Both gates
failed. Reproduce: `bash validation/fetch-corpora.sh`, then
`node validation/r1-word-order-control.js` →
`validation/results-r1-word-order-control.json`.*

## Why this run exists

The boundary program ([BOUNDARY-PROGRAM.md](BOUNDARY-PROGRAM.md)) found four
defects in the core evaluator by asking one question the project had never asked
of itself: *are the gates built by the same method as the interior?* This run
asks the analogous question of the relational tier, and the answer is worse.

The relational tier has six validation runs and nine external populations behind
it. Its negative control is always the same operation: **substitute whole turns
from other dialogues**, so every turn stays internally fluent while nothing
responds to anything (`r1x-validate.js`, `r1x2-controls.js`). That destroys
structure *between* turns and leaves structure *within* a turn untouched.

The core tier's equivalent gate does the opposite, and is stricter for it: G2 in
`core-verdict-validation.js` **word-shuffles** each positive — vocabulary
preserved exactly, word order destroyed — and requires the verdict to collapse.
That is the control that earns the phrase "structure, not vocabulary," because
it is the one that holds vocabulary fixed.

The relational tier's headline claim is *"the instrument measures relation, not
fluency or topic"* (README, [FINDINGS.md](FINDINGS.md)). It had never faced the
control that most directly tests it.

## The control and the prediction

Each dialogue keeps its turns, speakers, pairing and order. **Within each turn,
the words are shuffled** (seeded, reproducible). Per-turn vocabulary is preserved
exactly. Every cross-turn term recurrence the instrument keys on is preserved
exactly. What is destroyed is any sense in which a reply *does* something with
what it adopted.

Stated before the numbers were read:

> If uptake measures a relation, word-shuffling every turn should collapse it
> substantially — a reply that has become word salad has not taken anything up.
> If uptake is term recurrence wearing a relational name, the measures will
> barely move, because nothing the measure keys on has changed.
>
> **W1:** uptake rate on the word-shuffled control falls below 50% of real.
> **W2:** the flagship `GENERATIVE EXCHANGE` rate falls below 50% of real.

Both gates deliberately loose. The published control produces 8–30× separation;
anything short of a 2× drop here means word order is close to irrelevant.

## Results — W1 FAIL, W2 FAIL

| | HH real | HH **word-shuffled** | HH turn-substituted | HAI real | HAI **word-shuffled** | HAI turn-substituted |
|---|---|---|---|---|---|---|
| uptake rate | 0.144 | **0.146** | 0.005 | 0.291 | **0.302** | 0.042 |
| transformative | 0.129 | **0.130** | 0.005 | 0.258 | **0.267** | 0.041 |
| % with round trip | 0.313 | **0.313** | 0.018 | 0.468 | **0.468** | 0.032 |
| `GENERATIVE EXCHANGE` | 0.033 | **0.033** | 0.000 | 0.083 | **0.083** | 0.005 |

Word-shuffling every turn in the corpus **retains 101.4% and 103.8% of uptake,
and 100% of the flagship rate.** Round-trip prevalence is identical to three
decimal places. The published turn-substitution control, on the same corpora,
retains 3.5% and 14.4%.

The measure does not move. Not "moves less than expected" — does not move.

## What this actually means

The two controls, read together, characterize the instrument precisely:

- **Turn substitution collapses it.** So the measure is not topic-in-isolation
  and not fluency: it requires terms to recur across *the specific adjacent
  turns of one conversation*. That is a real property, and the six published
  runs that rest on it — the echo law, the mirror-plus-source signature, the
  population orderings — are measurements of it and are not invalidated here.
- **Word shuffling does not touch it.** So the measure is indifferent to whether
  the reply is a sentence.

Jointly: **R1 measures cross-turn lexical recurrence within a pairing.** It
cannot distinguish a reply that engages a term from a reply that merely contains
it.

That is a weaker claim than "measures relation, not fluency or topic," and the
README and FINDINGS wording is corrected accordingly rather than defended.

## The failure is not confined to word salad

Word salad is an artificial input, and it would be easy to read this run as a
curiosity about an attack nobody would mount. The authored probes (P-section of
the harness, labelled as authored) close that escape:

| probe | verdict | uptake |
|---|---|---|
| P1 genuine co-construction | `GENERATIVE EXCHANGE` | TRANSFORMATIVE ×2 |
| P2 verbatim mirror | `MIRRORED EXCHANGE` | ECHO — correctly defended |
| P3 word salad of the partner's terms | `COLLABORATIVE UPTAKE` | WEAK ×3, **4 round trips** |
| P4 **fluent non-sequitur** containing the partner's terms | `ASYMMETRIC UPTAKE` | **TRANSFORMATIVE**, 1 round trip |
| P5 unrelated fluent replies | `PARALLEL MONOLOGUES` | none — correct |

P4 is the one that matters:

```
A: Maybe we introduce a lease, a lock that carries an expiry.
B: I had lunch near the harbour today. The lease was fine. The gulls were loud.
```

That is grammatical, fluent English with zero engagement, and it earns
`TRANSFORMATIVE` — the *strongest* uptake class, the one documented as
"engaging an anchor… nothing was copied" — plus a round trip on "lease".

## Why this was not fixed

The obvious patch is a well-formedness gate: refuse to credit uptake from a turn
whose word order is not plausibly English. It was tested and rejected on the
numbers, before being built.

A function-word placement checker (determiner/preposition/auxiliary adjacency
violations, per word) separates real from word-shuffled turns by **4.2× on the
mean violation rate** — a real signal. But as a *gate* it is not close: at the
best threshold tried it flags 44.9% of shuffled turns and **12.7% of genuine
ones**. A gate that falsely penalizes an eighth of real dialogue would degrade
the instrument on the text it exists to measure, in exchange for catching under
half of an artificial attack.

And it would not address the finding anyway. **P4 is well-formed.** No word-order
check can catch it, because there is nothing ill-formed about it. The gap is
between *mentioning* a term and *engaging* it, and closing that gap is semantic
work — precisely the Tier 3 this project declines by design
([ARCHITECTURE.md](ARCHITECTURE.md): *"Tier 3 — Semantic Understanding is
deliberately not implemented. It would require an LLM and would cost the
properties that make Cathedral trustworthy. This is a trade, consciously made."*)

So this is recorded as a **structural limit of the method, not a bug awaiting a
patch**. The relational program already has two published negative results where
surface and distributional approaches failed to reach paraphrase-level uptake
([R2-SEMANTIC-UPTAKE.md](R2-SEMANTIC-UPTAKE.md)). This is the third, and it is
the same boundary seen from a new angle: local deterministic methods can see that
a term recurred and cannot see whether it did any work.

**Reopening condition.** If a distributional or n-gram resource is ever admitted
into the default path (today `semantic-neighbors.json` exists but ships opt-in,
as a published negative result), engagement-vs-mention becomes measurable and
this reopens as a fixable defect rather than a boundary.

## What changed as a result

- The word-order control is now a permanent, reproducible run rather than a gap:
  `npm run validate:r1-word-order`.
- The README and `FINDINGS.md` claims are narrowed to what the two controls
  jointly support.
- `RELATIONAL-PROGRAM.md` gains this limit in its honest-limits ledger.

Nothing in the instrument changed. The claim did.
