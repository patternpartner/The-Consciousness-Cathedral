# Tier-2 Diversity Tightening (v3.23.0) — acting on the residue the fresh corpora surfaced

*2026-07-12. The prometheus/Wikimedia runbook validation ([PROMETHEUS-RUNBOOK-VALIDATION.md](PROMETHEUS-RUNBOOK-VALIDATION.md), [WIKIMEDIA-RUNBOOK-VALIDATION.md](WIKIMEDIA-RUNBOOK-VALIDATION.md)) confirmed the density fix out-of-sample but left one actionable residue: three short alert runbooks whose `OPERATIONAL INTENT` verdict survived word-shuffling (WebPageTest alert 17/20, Network monitoring 11/20, SyntheticToolAlert 9/20). This is the tier-2 bag-of-words softness the ledger has tracked since run 1. This change acts on it — a real core change, pinned from both sides. Reproduce the tests: `npm test` (80 cases: 11+25+28+7+9), `node run-core-regressions.js` (25/25).*

## Diagnosis

The `OPERATIONAL_INTENT` assessment fires when ≥ 2 implicit bindings form (a failure signal syntactically co-arranged with an action). v3.19.0 required a conditional/causal connective in the clause joining each pair and capped the span at 100 chars. The three offenders defeated it the same way:

- **They bind one signal word repeatedly.** WebPageTest's original bindings were `regression → alert`, `regression → alert`, `regression → revert` — the single concern *regression*, monitored three ways. That is not two enumerated concerns; it is one, and a word-shuffle that keeps the word "regression" and a few action words keeps re-forming the same accidental pairs.
- **Connectives are common tokens.** `if`/`when`/`then` are frequent, so after shuffling a short, vocabulary-dense alert page, the 100-char window of some signal→action pair almost always still contains one. v3.19.0's connective-in-clause guard passes on the shuffle.
- **v3.19.0 allowed one intervening sentence terminator** (adjacent-sentence bindings). In shuffled pseudo-sentences and in cross-sentence proximity, that residual looseness let pairs bind across a sentence boundary.

The distinguishing property between these offenders and the 14 genuinely structural positives is **not** local per-binding geometry (both use loose connective placement) — it is that the offenders enumerate *one* signal, and that their bindings survive a sentence split.

## The fix — two guards, each the mirror of an existing principle

Both live in `validateImplicitBindings` (`cathedral-core.js`). Neither is a new heuristic; each extends a rule the core already applied elsewhere.

1. **Signal-side diversity (the centerpiece).** The core already downgrades `OPERATIONAL_INTENT` when every binding goes to *one action* (`SINGLE_ACTION_BINDING`, the `diversityWarning`). v3.23.0 adds the mirror on the signal side: if every binding shares *one signal* (`uniqueSignals < 2`), the assessment downgrades to `SINGLE_SIGNAL_BINDING` and cannot mint the verdict. This is the implicit-binding analogue of the flagship's ≥ 2-failure-mode requirement: **enumeration means two distinct concerns, not one concern repeated.** It fires on the signal regardless of how many distinct *actions* it is bound to.

2. **Same-sentence binding.** The terminator guard tightens from "≤ 1 intervening terminator" (same or adjacent sentence) to **0** (same sentence only). A genuine conditional/causal binding — "if X, we do Y" — lives inside one sentence; the adjacent-sentence allowance was the residual that let cross-sentence proximity and shuffled pseudo-sentences bind.

## Why this cannot leak specificity

The change is **monotonic**: it only *adds* downgrade conditions to the `OPERATIONAL_INTENT` assessment. No text that previously failed to earn the verdict can now earn it — so conversational specificity (run 1's G1 = 0.00%) cannot regress by construction. The curated floor confirms it empirically: **npm test 80/80**, including the two negative cases the core verdict validation pinned (DailyDialog "took off … warn", hh-rlhf empathy reply) which must *not* be operational intent, and the genuine positives that must be preserved — the curated `OPERATIONAL INTENT` case ("If we see problems, we stop … three things could break: cache, API, edge cases") and Test 2B (`OPERATIONALLY SOUND`), both green.

## Regressions (run-core-regressions.js, cases 22–24)

- **22 — signal diversity, downgrade side:** one repeated signal bound to two *distinct actions* still assesses `SINGLE_SIGNAL_BINDING` (boundCount 2, uniqueSignals 1), verdict not operational-family. Pins that it is the signal, not the action, that must vary.
- **23 — the guard does not over-fire:** two distinct signals each bound still reach `OPERATIONAL_INTENT` (uniqueSignals 2).
- **24 — same-sentence:** a minimal pair sharing the same words — one clause each vs. each signal split from its action by a terminator — assesses `OPERATIONAL_INTENT` (bound 2) vs `NO_INTENT` (bound 0).

## Measured effect (development-data — see note)

| Measure | pre-v3.23.0 | post-v3.23.0 |
|---|---|---|
| Pooled fresh operational-family positives | 17 | **8** |
| Pooled seeded word-shuffle retention | 14.1% (n=17) | **8.8%** (n=8) |
| WebPageTest alert (offender) | INTENT, shuffle 17/20 | **dropped** (single signal) |
| SyntheticToolAlert (offender) | INTENT, shuffle 9/20 | **dropped** (single signal) |
| Network monitoring (offender) | INTENT, shuffle 11/20 | INTENT, shuffle **9/20** (residual) |
| `OPERATIONALLY SOUND` on fresh corpora | 0.0% | **0.0%** (unchanged) |
| V1 instruments (OUTSIDE / gaming) | unchanged | **unchanged** |
| Family rate (incidents / runbooks / prom) | 1.7 / 3.4 / 1.6% | 1.0 / 1.1 / 0.0% |

Two of the three named offenders are eliminated outright — their `OPERATIONAL INTENT` was a single repeated signal, exactly what the guard targets. Pooled shuffle retention drops from 14.1% to 8.8%; genuine-positive shuffle retention (the 14 structural cases) falls from 6.0% to 1.8%. The flagship verdict and the v3.17 density instruments are untouched.

## Honest residue

**Network monitoring stays partly soft (9/20).** It is a 3,100-word document with ~48 *distinct* signals and ~76 actions — genuinely diverse, so the diversity guard correctly does not drop it, yet its sheer size means shuffles keep re-forming two distinct-signal same-sentence bindings ~40% of the time. No local per-binding rule removes it without destroying genuine positives; it is the same length/density frontier the reference-length principle (v3.17.0) addresses for style and repetition counts but that this binding path does not yet. Recorded as the open residue rather than overfit away with a rule aimed at one document.

**Sensitivity cost:** pooled operational-family positives fell 17 → 8 on these corpora. This is acceptable by the project's specificity-over-sensitivity stance and blocker 3 (the verdict's home is plans, and most of this cost is incident-retrospective INTENT verdicts that were not structurally earned). No curated case moved.

**Methodological note:** iterating this fix's threshold against the fresh corpora makes them *development data* for it — the post-fix rates above are honest measurements, not fresh validation. Run 1's conversational specificity gates remain untouched validation (and cannot regress here, by the monotonicity argument). The next operational corpus nobody has tuned on is the validation for this fix — the standing pattern of the program.
