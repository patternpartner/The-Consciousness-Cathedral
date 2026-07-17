# Object-Ratio Windowing (v3.27.0) — one residue closed, one fix rejected by its own numbers

*2026-07-17. The KEP validation ([KEP-VALIDATION.md](KEP-VALIDATION.md)) failed two pre-registered gates and named two residues: (a) the object-diversity ratio measures document length past its register (V1 FAIL at 15.5% gaming-flagged), and (b) the flagship's count-based routes mint `OPERATIONALLY SOUND` with no binding requirement (G4-DENS FAIL at 11/20 shuffle retention). This session shipped the fix for (a), and attempted, measured, and **rejected** the obvious fix for (b) — the rejection is published here with its numbers, following the program's precedent for negative results. Reproduce: `npm test` (84 cases: 11+29+28+7+9), `node run-core-regressions.js` (29/29).*

## Fix (a), shipped: the windowed type/token ratio

**Diagnosis (from the KEP run):** `extractObjects` returned unique/total content words over the whole document, and `checkObjectRatio` flags LOW below 0.3 — but a whole-document type/token ratio *declines with length by construction* (vocabulary saturation): KEP medians fell 0.52 → 0.21 across length bands, with 100% of 10k+-word documents below the threshold. The instrument measured length, not padding. 91 of the 95 KEP gaming flags traced to it.

**The fix:** the ratio is now the **mean type/token ratio over consecutive 100-content-word windows** — the standard length-stable form of the statistic. Texts at or under one window (the register the 0.3/0.5 thresholds were tuned on) are byte-identical. Mechanical repetition stays LOW in *every* window; long diverse prose does not. Regression case 28 pins both sides with a constructed pair past one window.

**Honest character of the change:** unlike v3.23/v3.25 this is a *relaxation* — it removes false flags rather than adding downgrades — so the specificity risk is on the gaming side, not the conversational side. The exposure is bounded: conversational turns sit under one window (unchanged by construction), every curated attack case still flags (`npm test` 84/84, including the stuffing, dilution, and repetition attacks), and a padding attack with genuinely varied vocabulary was never caught by this instrument anyway.

**Measured effect (all five corpora are development data for this fix):**

| Register | gaming-flagged before | after |
|---|---|---|
| Wikimedia incidents (600) | 2.5% | **1.0%** |
| Wikimedia runbooks (174) | 4.0% | **1.7%** |
| Prometheus runbooks (62) | 0.0% | **0.0%** |
| OpenShift runbooks (256) | 2.0% | **0.4%** |
| **KEPs (611)** | **15.5%** | **0.8%** |

`OUTSIDE DESIGN SPACE` unchanged everywhere. V1 would now pass on all five registers.

**The consequential side effect:** the false flags had been *blocking* verdicts (`isLikelyGaming` gates the parliament pattern; the NON-ACTIONABLE branch intercepts flagged documents before the SOUND routes). Removing them raises KEP `OPERATIONALLY SOUND` from 56 to **66** (10.8%) and the operational family to **71 (11.6%) — past the S1 sensitivity gate (≥ 10%) for the first time in the program's history.** On development data: the fresh-corpus confirmation is owed, per the standing pattern. The register story sharpens to: retrospectives ~1%, plans ~12%.

## Fix (b), attempted and rejected: the binding witness

**The attempt:** mirror v3.23.0's same-sentence principle one tier up — require, past 150 words, at least one sentence joining a threshold token to a corrective-action token (both from the failure-mode engine's own vocabularies) before the two count-based SOUND routes can fire.

**Why it was rejected — measured on the KEP corpus:**

- It killed **49 of the 56** flagship verdicts. KEP prose expresses plans as "when the feature gate is disabled, the kubelet falls back to…" — the corrective vocabulary (`rollback|revert|pause|abort|stop|halt|…`) rarely lands in-sentence with a threshold token in genuine long plans. The casualties were false negatives of *vocabulary*, not structure.
- It failed to remove the worst offender: `sig-node/4960-container-stop-signals` kept 9/20 — the KEP is *about* stop signals, so "stop" saturates the text and shuffles re-form witness sentences by token density alone.

A guard that destroys 49 earned verdicts (by the program's own operative criterion — 31/40 retained 0/20 shuffles) to remove 4 soft ones, and misses the worst, fails on both axes. Reverted from the core; recorded here (the program's precedent: the WHERE/WHY slot rejections of v3.5.1, the R2 negative results).

**What the failed attempt taught — the residue, sharpened:** the flagship's count-route softness is *not* fixable by any same-sentence vocabulary witness, because (i) genuine long plans bind with vocabulary far richer than the corrective lexicon, and (ii) token-dense documents re-form any lexical co-occurrence under shuffle. A future fix must either understand *which* sentence joins trigger to response without a fixed action vocabulary, or scale the level-feeding counts by reference length (the v3.17 treatment, with a measured sensitivity budget). Current magnitude of the open residue, post-(a): 3 of 40 control texts ≥ 4/20, worst 9/20, pooled retention 4.9% — small, localized, honestly carried.

## The floor

`npm test` **84/84** (11+29+28+7+9); `run-core-regressions.js` **29/29** — case 28 new (windowed ratio, both sides). No curated case moved. Standalones rebuilt.

## Standing asks

1. **All five corpora are now development data** for v3.27.0. The next operational corpus nobody has tuned on validates: (i) gaming-flag rates in the post-fix regime on a long-document register, (ii) the S1 pass on a second plan register, (iii) the flagship count-route residue's magnitude out-of-sample.
2. The flagship count-route residue stays open with the sharpened statement above.
3. AI-authored operational text: still unmeasured, six runs standing.
