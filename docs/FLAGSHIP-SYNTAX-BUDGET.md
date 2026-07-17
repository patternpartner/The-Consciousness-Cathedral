# Pre-registration: the flagship syntax-bound corroboration fix, and its budget

*2026-07-17. Committed BEFORE the fix is implemented or measured — the budget analogue of gates-before-verdicts. This targets the last measured defect in the core: the flagship count-route shuffle softness ([KEP-VALIDATION.md](KEP-VALIDATION.md) failure 2, sharpened by the rejected witness fix in [OBJECT-RATIO-WINDOWING.md](OBJECT-RATIO-WINDOWING.md)). Current magnitude, from the v3.27.0-era measurement: 3 of 40 KEP control texts retain ≥ 4/20 word-shuffles (8/20 `sig-apps/2255-pod-cost`, 5/20 `sig-node/127-user-namespaces`, 9/20 `sig-node/4960-container-stop-signals`), confined to that register.*

## The design (fixed before measurement)

**Diagnosis being acted on:** the failure-mode engine's `measurableThresholds` and `correctiveAction` are bag-of-words token counts; the Structural Failure Mode Inference Rule accepts their document-level co-presence, so on token-dense long documents the `structural` flag — and with it the levels feeding the two count-based `OPERATIONALLY SOUND` routes — survives word-shuffling. The rejected witness fix proved a *new* fixed-vocabulary co-occurrence rule cannot work. This fix adds no vocabulary: it requires the counts to be **corroborated by the core's own existing syntax**.

**The change, exactly:**

1. In the failure-mode engine, compute `syntaxBoundThresholds`: the number of sentences in which one of the structural extractor's own conditional connectives (`if | when | once` — the same three words as the tier-1 `thresholdPattern`, line ~230) precedes one of `measurableThresholds`' own threshold expressions **within the same sentence**. Both vocabularies already exist in the engine; nothing is added.
2. Past the tuned register (`wordCount > 150`, the same reference the witness attempt used and the house convention for "the register the thresholds were tuned on"), `hasStructuralFailureModes` additionally requires `syntaxBoundThresholds >= 1`. At or under 150 words, byte-identical behavior.
3. No route conditions change. The `structural` flag and the levels derived from it carry the requirement into the promotion rule, the score route, parliament, and the anti-demotion mirror guard automatically — the computation changes once, upstream, so the routes and their mirror stay symmetric by construction (the asymmetry risk that had to be hand-managed in the witness attempt does not arise).

**Why this should work where the witness failed:** the witness demanded a *corrective-action lexeme* next to a threshold — genuine plans use richer response vocabulary, so it slaughtered earned verdicts. This requires only that a threshold be *conditionally framed* somewhere — "if/when X exceeds Y" — which is how written-out plans state thresholds, including every curated positive. And it is shuffle-fragile in the right way: a shuffled pseudo-sentence must re-form connective-before-threshold-expression within one sentence, the same class of event the v3.23.0 same-sentence guard already proved rare.

## The budget (acceptance criteria, fixed before measurement)

- **B1 — efficacy:** on the post-fix KEP positive set, the standing shuffle control (same seed, same draw method) shows **no per-text retention ≥ 4/20**. In particular the three named soft texts must be resolved — by their retention collapsing, or by their original verdict dropping within B2's budget.
- **B2 — sensitivity budget:** at least **61 of the 71** current KEP operational-family positives keep an operational-family verdict (≤ 10 may drop, ~14%).
- **B3 — collateral:** at most **2 of the 22** non-KEP fresh-register positives drop; the V1 instruments (`OUTSIDE DESIGN SPACE`, gaming-flag rates) are unchanged on all nine registers.
- **B4 — floor:** `npm test` fully green (all suites), `run-core-regressions.js` green including new cases pinning both sides; Test 2A, Test 2B, and regression case 4 keep their verdicts verbatim.

**Acceptance rule:** all four hold → the fix ships as v3.32.0. Any one fails → the fix is reverted and published as a rejection with its numbers, alongside the witness rejection. Either way the measurement is reported against this document, and the nine fresh corpora become development data for whatever ships; the tenth register validates it.
