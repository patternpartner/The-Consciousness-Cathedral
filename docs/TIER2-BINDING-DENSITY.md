# Tier-2 Binding Density (v3.25.0) — closing the length/density frontier the diversity tightening recorded

*2026-07-17. The v3.23.0 tightening ([TIER2-DIVERSITY-TIGHTENING.md](TIER2-DIVERSITY-TIGHTENING.md)) named its honest residue: Network monitoring (3,100 words, ~48 distinct signals) kept an `OPERATIONAL INTENT` verdict that survived word-shuffling 8–9/20, "the same length/density frontier the reference-length principle (v3.17.0) addresses for style and repetition counts but that this binding path does not yet." This change is that sentence made mechanical — no per-binding rule aimed at one document, but the core's own reference-length principle extended to the one count that still lacked it. Reproduce: `npm test` (83 cases: 11+28+28+7+9 — the regression suite grew by the three cases below), `node run-core-regressions.js` (28/28).*

## Diagnosis

`OPERATIONAL_INTENT` requires ≥ 2 implicit bindings — a threshold tuned on short conversational turns (~5 extracted signals; the curated case binds 4 of 5). In a signal-dense document the same absolute count is chance-level: with 48 distinct failure signals and ~76 actions, two same-sentence distinct-signal bindings keep re-forming even under word-shuffling (~40% of shuffles), which is why v3.23.0's per-binding and diversity guards — all correct — could not remove the residue without harming genuine positives. The offending quantity was never the bindings' local geometry; it was an absolute count read as meaningful at any scale.

The openshift validation run ([OPENSHIFT-RUNBOOK-VALIDATION.md](OPENSHIFT-RUNBOOK-VALIDATION.md)) supplied the measurement that makes the boundary visible: **every genuinely structural fresh positive extracts 5–18 signals** (binding ratios 0.11–0.80), while the chance-level verdicts sit at **26–48 signals with ratios 0.05–0.08** — bound counts within noise of their own shuffled baselines (Network monitoring's original binds 3; its shuffles re-form 2).

## The fix — the v3.17.0 principle, applied to the binding path

In `validateImplicitBindings` (`cathedral-core.js`):

```
BIND_REF_SIGNALS = 20
bindScale = totalSignals > 20 ? 20 / totalSignals : 1
effectiveBoundCount = boundCount × bindScale
if (effectiveBoundCount < 2 && assessment === 'OPERATIONAL_INTENT')
    assessment = 'SPARSE_BINDING'
```

Exactly the `checkRepetition` / reasoning-style pattern: scale the raw count to a reference so the threshold means *density*; texts at or under the reference — the register the threshold was tuned on — are byte-identical. The reference (20) sits above the largest genuinely structural positive observed (18 signals) and below the smallest chance-level one (26). The guard **scales, it does not cap**: a 30-signal document with 4 bound conditionals still earns the assessment (effective 2.67).

Why this also kills the *shuffle* residue: a word-shuffle preserves the signal population, so a shuffled Network monitoring still extracts ~48 signals and now needs ~5 accidental same-sentence distinct-signal bindings to mint the verdict, not 2.

## Why this cannot leak specificity

Monotonic — the guard only prevents the verdict, never grants it, so run 1's G1 = 0.00% conversational specificity cannot regress by construction. The curated floor confirms: **npm test 83/83**, all conversational negatives and the genuine `OPERATIONAL INTENT` / Test 2B positives green (all curated texts sit far under the reference, so the guard is inert on them by construction — case 27 pins this).

## Regressions (run-core-regressions.js, cases 25–27)

- **25 — downgrade side:** two genuine bindings buried under 20+ lexicon signals assess `SPARSE_BINDING`; verdict not operational-family.
- **26 — preserve side:** the same signal-dense furniture with four bound conditionals keeps `OPERATIONAL_INTENT` (effective ≥ 2) — the guard scales rather than caps.
- **27 — inertness:** at or under 20 signals, `bindScale` = 1 and `effectiveBoundCount` = `boundCount` — the tuned register untouched.

## Measured effect (development data — see note)

| Measure | pre-v3.25.0 | post-v3.25.0 |
|---|---|---|
| Pooled fresh operational-family positives (4 corpora) | 13 | **10** |
| Pooled seeded shuffle retention | 7.7% | **6.0%** |
| Worst per-text retention | **8/20** (Network monitoring) | **3/20** |
| Network monitoring (the recorded residue) | INTENT, shuffle 8/20 | **dropped** (48 signals, bound 3, effective 1.25) |
| `SPARSE_BINDING` fires across 1,092 fresh docs | — | **3** (exactly the three chance-level verdicts) |
| openshift positives (the v3.23.0 validation set) | 5 | **5** (untouched) |
| `OPERATIONALLY SOUND` on fresh corpora | 0.0% | **0.0%** |
| V1 instruments (OUTSIDE / gaming), all four registers | unchanged | **unchanged** |

The guard fires on exactly three of 1,092 fresh operational documents — Network monitoring (48 signals, bound 3), TranslationNotifications (42, bound 2), and the 2020-07-23 wdqs outage (26, bound 2) — the three whose ratios (0.05–0.08) the openshift run had already identified as chance-level. No other document moves. All five openshift positives — the set that validated v3.23.0 out-of-sample — keep their verdicts, and every remaining positive retains ≤ 3/20 under shuffle. The recorded 8/20 residue is eliminated.

The three downgraded documents land in `SUBSTRATE VISIBLE` via the existing verdict ladder — reported as observed; this change decides only that their binding count is not a plan, not where the ladder routes them next.

## Honest residue and notes

- **Sensitivity cost: 3 long-document `OPERATIONAL INTENT` verdicts, all at chance-level binding ratios.** Acceptable under the specificity-over-sensitivity stance and blocker 3 (the verdict's home is compact plans; a 1,400–3,300-word document with 2–3 incidental bindings is not one). No curated case moved; no openshift positive moved.
- **The reference (20 signals) is calibrated on development data.** The separation it encodes (18 vs 26) comes from the four fresh corpora, which are development data for this fix from this moment on. The post-fix rates above are honest measurements, not fresh validation. **The next operational corpus nobody has tuned on is the validation for this fix** — the standing pattern of the program.
- **The committed v3.24.0 results JSON is untouched** — it remains the byte record of the v3.23.0-era run; this document carries the post-v3.25.0 numbers.
