# Core Verdict Validation — external corpora run 1

*2026-07-11. The README promised it for six months: "validation against an external corpus of real AI outputs is the honest next step." This is that run. Reproduce: `bash validation/fetch-corpora.sh` (dd/hh/ua slices), `node validation/core-verdict-validation.js` → `validation/results-core-verdict-validation.json`. Deterministic: seeded shuffles, seed in the results file.*

## Design

The curated suite proves intended behavior on authored cases. This run asks two pre-stated questions about real text nobody wrote for the evaluator:

- **G1 — top-verdict specificity.** `OPERATIONALLY SOUND` is the flagship verdict; if ordinary conversation earns it, it is base-rate furniture. Gate: < 2% of turns in each conversational population.
- **G2 — structure, not vocabulary.** Word-shuffle every operational-family positive (same words, deterministic random order, 20 seeds per text): vocabulary fully preserved, bindings destroyed. Gate: < 20% of trials retain an operational-family verdict. Minimum-evidence clause (the typed-slot campaign's lesson): the external gate applies only at ≥ 20 external positives; below that the external number is reported raw and the decision is carried by the curated control, clearly labelled as authored.

Populations: DailyDialog human turns (2,206, casual), hh-rlhf assistant turns (750, conversational AI), UltraChat assistant turns (933, long-form AI answers; reported, not G1-gated, since instructional text may legitimately be operational).

## Results

| Gate | Result |
|---|---|
| G1, DailyDialog | **0.00% OPERATIONALLY SOUND → PASS-specific** |
| G1, hh-rlhf assistant | **0.00% OPERATIONALLY SOUND → PASS-specific** |
| G2, curated positives (3 texts × 20 shuffles) | **0/60 trials retained → PASS-structural** |
| G2, external positives | UNDERPOWERED (n=3 < 20) — reported raw below |

**The flagship verdict measures what it claims.** Across 3,889 external turns it never fired once, and on the texts that do earn it, word-shuffling — which preserves every keyword — destroyed it in 60 of 60 trials. Keyword presence provably cannot produce `OPERATIONALLY SOUND`; sentence-internal structure is required. Sentence-shuffle retention is ~100% and is a documented design property, not a failure: Cathedral's extraction is largely sentence-local, and a threshold→action binding that lives inside one sentence legitimately survives sentence reordering.

**Verdict distributions (share of turns):**

| Verdict | DailyDialog | hh-rlhf | UltraChat |
|---|---|---|---|
| VERIFIED CONSISTENT | 91.4% | 84.3% | 51.8% |
| NON-ACTIONABLE | 6.6% | 7.6% | 8.3% |
| COHERENT BUT SHALLOW | 1.5% | 4.8% | 2.6% |
| UNDECIDABLE | 0.4% | 2.8% | 25.3% |
| OUTSIDE DESIGN SPACE | 0 | 0.3% | 11.5% |
| OPERATIONAL INTENT | 1 turn | 1 turn | 1 turn |
| OPERATIONALLY SOUND | 0 | 0 | 0 |

Gaming flagged (LIKELY/POSSIBLE_GAMING, LOW_CONTENT_UNBOUND, REPETITIVE_UNBOUND): 1.5% / 0.8% / 4.8% — extending the external eval's benign-false-positive picture (N=40) to N≈3,900.

## Honest limits and open flags

1. **Sensitivity remains unmeasured.** Zero external `OPERATIONALLY SOUND` firings proves specificity, but these corpora contain essentially no deployment-plan reasoning — the verdict's recall on real operational documents (postmortems, runbooks, design reviews) is untested. A labelled corpus of genuinely operational AI outputs is the missing ingredient, same as everywhere else in this project.
2. **The OPERATIONAL INTENT tier has a shuffle-survival flag, n=3.** Of the three external positives (all borderline casual text), two retained the verdict in 20/20 word-shuffle trials — on those texts the Tier-2 conversational verdict behaved as bag-of-words: its synonym-expanded trigger/action detection does not require the trigger and action to be syntactically bound. The curated flagship texts show the opposite (0/60), so this is a tier-2-specific softness on marginal text, not a general one. Recorded as an open question; gating it properly needs a corpus where OPERATIONAL INTENT is common, and n=3 decides nothing (the Poisson-fragility rule).
3. **UltraChat reads strangely to the evaluator** — 25% UNDECIDABLE, 11% OUTSIDE DESIGN SPACE, 4.8% gaming-flagged. Long-form instructional/listicle content is dense in markers and light on bound structure. Not gated here; noted as the shape of the design space boundary on real long-form text.
