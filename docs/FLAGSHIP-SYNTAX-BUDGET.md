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

---

## Outcome (measured 2026-07-17, same day): REJECTED — three of four criteria fail

The fix was implemented exactly as designed above, the curated floor stayed fully green (84/84, regressions 29/29 — B4 held), and the budget measurement rendered:

| Criterion | Budget | Measured | Verdict |
|---|---|---|---|
| B1 — no KEP control text ≥ 4/20 | 0 texts | **2 texts** (5/20 `1591-daemonset-surge`, 4/20 `3751-volume-attributes-class`) | **FAIL** |
| B2 — ≥ 61 of 71 KEP positives keep family | ≤ 10 lost | **40 lost** (71 → 31) | **FAIL** |
| B3 — ≤ 2 non-KEP positives lost | ≤ 2 | **4 lost** (Rust RFCs −2, OSE enhancements −2) | **FAIL** |
| B4 — curated floor green, 2A/2B verbatim | green | green | PASS |

**Reverted per the acceptance rule.** The core is byte-identical to its pre-fix state; this document is the record.

## What the second rejection establishes

Two structurally different fixes for the same residue have now been rejected by their own pre-stated numbers:

1. **The witness** (v3.27.0 attempt): threshold + *corrective-action lexeme* in one sentence — killed 49/56, missed the worst offender. Lesson: plans respond with vocabulary far richer than any corrective lexicon.
2. **The corroboration** (this attempt): *conditional connective* + threshold expression in one sentence — killed 40/71 plus 4 collateral, and still left 5/20 retention. Lesson: plans *state* thresholds at least as often as they *conditionalize* them — declaratively ("the metric must stay below 1%", "requires at least 3 replicas") and interrogatively (the PRR Q&A format that carries most KEP positives) — and no small syntactic frame captures those forms without slaughtering earned verdicts.

The residue's true shape, after two rejections: the flagship's count-based routes credit *accumulated operational vocabulary whose arrangement the engine never checks*, and the arrangements genuine plans actually use are too varied for any binary local pattern — lexical or syntactic — to separate from shuffle noise. The remaining untried approach from this document's own preamble is the **graded** one: reference-scale the level-feeding counts themselves (densities, not requirements), which degrades smoothly instead of gating binarily. That attempt would need its own pre-registered budget. Until then the residue stands as recorded: ~3 of 40 control texts at 4–9/20, one register, tracked in every run.
