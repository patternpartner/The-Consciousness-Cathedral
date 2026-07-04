# R2 — Semantic Uptake: One Feature Shipped, One Negative Result Published

*2026-07-04. The attempt to close the paraphrase gap without LLM calls. Reproduce: `node validation/r2-ablation.js`; numbers in `validation/results-r2-ablation.json`. This document reports a partial failure, on purpose — the program's rule is that gates are stated before the numbers exist and results publish either way.*

---

## The problem being attacked

Run 1 quantified R1's core blind spot: lexical anchoring cannot see uptake that crosses a paraphrase. *"How about a few beers after dinner?" → "Sounds great"* is genuine uptake with zero shared content words, so half of real casual human dialogue scored `PARALLEL MONOLOGUES`. Two deterministic fixes were candidates:

1. **Stemming** — merge inflected forms (`deployments`/`deploying`/`deployed`) into one anchor. Cheap recall on the lexical channel.
2. **Functional uptake via adjacency pairs** (Schegloff & Sacks) — detect a reply that performs the *typed second half* of the prior turn's action: accepting a proposal, declining a request, answering a yes/no question. Conversation analysis has described these structures for fifty years; they are rule-detectable in principle.

Both were built behind flags and sent through the ablation harness with three pre-stated gates: **G1** (precision: functional events on real dialogue > 3× shuffled controls), **G2** (recall: `PARALLEL MONOLOGUES` share on real human dialogue drops), **G3** (the real-vs-shuffled separation that validates the whole instrument survives).

## Round 1: the generic-pattern version failed loudly

The first adjacency-pair lexicon matched what dialogue *actually* looks like — acceptances beginning "sure/okay/yes/yeah", a `YESNO→POLARITY` pair for bare answers. It produced a healthy-looking recall gain (52.2% → 34.6% `PARALLEL MONOLOGUES`) and then failed G1: **the detector fired on shuffle-destroyed Frankenstein dialogue at roughly half its real-dialogue rate.** Per-pair breakdown located the noise precisely:

| Pair | Real | Shuffled | Verdict on the pattern |
|---|---|---|---|
| `PROPOSAL→ACCEPTANCE` (generic openers) | 14 | 15 | pure base rate — measuring nothing |
| `YESNO→POLARITY` | 69 | 26 | 2.7× — real signal, drowning in noise |
| `REQUEST→*`, distinctive rejections | 9 | 3 | small but clean |

The mechanism is worth stating because it generalizes: **a detector keyed on the reply's surface form alone fires at that form's base rate in the corpus, regardless of what preceded it.** Casual turns simply *begin with* "yeah" and "sure" constantly. The shuffle control preserves the population of turn-openings, so any opener-shaped pattern passes through it untouched. The conditional lift — the only thing that is actually *relational* — has to come from somewhere else. (Bare polarity answers also turn out to add nothing even when real: an answer that anchors to the question's terms is already caught by the lexical path; the only new coverage is the unanchored "Yes." — precisely the case indistinguishable from noise.)

## Round 2: the calibrated version failed honestly

Calibrating from the breakdown — cutting `YESNO→POLARITY` and all generic openers, keeping only distinctive idioms ("sounds great", "I'd love to", "I'm afraid…", "tempting… but") — produced a detector that is *probably* precise and *demonstrably* useless at corpus scale: **8 events on 272 real dialogues vs 5 on shuffled.** Distinctive idioms are rare in real usage because real acceptance is usually generic. The precision/recall bind is structural, not a tuning problem:

> Generic patterns have the recall and no precision. Distinctive patterns have the precision and no recall. Surface-pattern matching cannot close the paraphrase gap.

G1 failed in both rounds. Per the program's rules, **functional uptake ships default-OFF** (`analyzeExchange(input, { functionalUptake: true })` opts in; the calibrated lexicon is retained for future work and the tests exercise it opt-in).

## What shipped: stemming

| | HH-real | HH-shuffled | HAI-real | HAI-shuffled |
|---|---|---|---|---|
| Uptake, R1 baseline | 0.128 | 0.004 | 0.270 | 0.035 |
| Uptake, +stemming | **0.144** | 0.005 | **0.291** | 0.050 |
| `PARALLEL MONOLOGUES`, R1 → +stem | 52.2% → **49.6%** | — | 28.2% → **26.4%** | — |

G2 held, G3 held: a ~12% relative recall improvement on real human dialogue, near-zero movement on the controls, separation intact. Stemming is now the default (`stemming: false` ablates it). Round-trip terms report the first surface form encountered, so output stays readable.

## What this means for the roadmap

The negative result is informative in the best way: it rules out the cheap path and points at the real one. The paraphrase gap is a *semantic representation* problem — "sounds great" relates to "go for beers" through meaning, not form — and the deterministic way to represent meaning is distributional: co-occurrence vectors (PPMI + cosine over a fixed reference corpus), computed once, shipped as data, identical output for identical input. That is R2-proper:

- deterministic and local (a lookup table, not a model call)
- transparent (every similarity score traceable to corpus counts)
- gated by the same harness that just killed the pattern-lexicon approach

The instrument's rules did their job on their own maker's design twice today. That is the program working.
