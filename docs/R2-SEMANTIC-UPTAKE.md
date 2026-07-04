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

## R2-proper: the distributional channel — built, gated, and caught by the acid test

The obvious next move was built in full: PPMI co-occurrence vectors over a training corpus **disjoint from all evaluation data** (corpus rows 300+ vs evaluation rows 0–300; ~62k turns), context-distribution smoothing (Levy et al. 2015), cosine similarity, distilled into a 356KB inspectable neighbor lexicon (`semantic-neighbors.json`, e.g. *money → account, bank, cash, pay*; built by `validation/build-vectors.js`). Runtime is a lookup — determinism intact. Semantic uptake: a reply engaging the prior turn's anchors through neighbors instead of repeats.

Four pre-stated gates, including a new one — **G4, the acid test**: a semantic detector is topically excitable by construction, so it must beat the *same-topic chimera*, not just the random shuffle. Results (`node validation/r2b-semantic.js`):

| | Semantic rate | vs shuffle | vs chimera |
|---|---|---|---|
| HH-real (short casual turns) | 0.042 | **3.8×** ✓ | 1.75× ✓ (thin) |
| HAI-real (long assistant turns) | 0.036 | **0.75×** ✗ | 0.82× ✗ |

**G1 failed (one corpus of two), G4 failed. G2/G3 held.** On long-turn dialogue the channel fires *more* on Frankenstein controls than on real exchanges: long random turns hit distributional neighbors of the prior turn's many anchors at base rate. (One measurement caveat recorded for fairness: the semantic channel only runs where lexical uptake didn't fire, so strongly-coupled real dialogues offer it only leftover pairs — a selection effect that depresses the "real" rate. The chimera result stands regardless.)

The conclusion generalizes past this implementation, and it is the finding of the campaign:

> **Distributional similarity is topical similarity.** PPMI neighbors encode "about the same things" — and the same-topic chimera maximizes "about the same things" while destroying response structure. A bag-of-words semantic channel therefore *cannot* beat the chimera gate, not because of tuning, but by construction. Closing the paraphrase gap relationally requires structure-aware semantics — who-did-what-to-whom alignment, discourse relations — which is exactly where the determinism constraint gets genuinely expensive.

**Disposition:** the semantic channel ships **default-OFF** (`semanticUptake: true` opts in; the injected-lexicon hook keeps tests data-independent). It shows honest signal on short-turn casual dialogue and users analyzing that register may enable it with the stated caveat. The lexicon and builder stay in-repo: the negative result is only reproducible if its artifacts are.

## Scoreboard for the R2 campaign

| Candidate | Gate outcome | Disposition |
|---|---|---|
| Stemming | G2, G3 held | **shipped, default-on** |
| Adjacency-pair functional uptake | G1 failed twice | opt-in, documented |
| Distributional semantic uptake | G1 split, G4 failed | opt-in, documented |

The instrument's rules rejected its maker's designs three times in one campaign, each time saying *why* precisely enough to aim the next attempt. The paraphrase gap survives R2 with its price tag now legible: it is not a lexicon problem and not a topic-vector problem; it is a structure problem. That is the program working.
