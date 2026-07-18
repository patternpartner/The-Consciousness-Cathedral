# LLM Rollout-Plan Validation — the flag's plan half: generated plans earn nothing, and the contrast with the runbook run names what carries binding

*2026-07-18. The second inside-approximation run, pre-registered in [LLM-PLAN-PREREG.md](LLM-PLAN-PREREG.md) (committed `5741ef1`, before any generation): 120 rollout plans written by `claude-sonnet-5` in cold generation contexts, for feature names derived mechanically from the KEP register's own pinned SHA (seeded 120 of 611) under a frozen template — the same isolation design, generator, batch structure, and no-cherry-pick rule as the runbook run. One mechanical deviation, reported per the frozen rule: batch 3's generation context title-cased the feature names in its delimiters ("cri pagination" → "CRI Pagination"); all 15 of its documents map 1:1 to its assigned topics and every one is in the corpus — nothing was excluded or regenerated. Corpus committed verbatim (`validation/corpus-llm-plans.json`); evaluation deterministic, verified identical on re-run. Reproduce: `node validation/llm-plan-validation.js`.*

## Results at a glance

| Gate | Result |
|---|---|
| **V1-PLAN — instruments register-driven** | `OUTSIDE DESIGN SPACE` **1.7%** (2 of 120), gaming-flagged **0.0%** → **PASS** |
| **S-PLAN — what do generated plans earn** | family **0.0%** (0 of 120) → **≤ 3% band: generated plans bind like design documents** |
| **G8-STRUCT / decision-1 boundary probe** | **PASS-vacuous** — zero positives, so zero shuffle-soft territory |

Verdict distribution (120): VERIFIED CONSISTENT 63, UNDECIDABLE 39, SUBSTRATE VISIBLE 11, COHERENT BUT SHALLOW 5, OUTSIDE DESIGN SPACE 2. Both family verdicts: zero fires. Word lengths: min 205, median 377, max 608 — again the generator's unconstrained choice, again inside the tuned register.

## The finding: binding is genre-carried

Same generator, same protocol, same isolation, paired against the registers' own topics — two runs, opposite results:

| Asked for… | Generated family rate | Human baseline (same topics) |
|---|---|---|
| a **runbook** (v3.34.0) | **4.2%**, every positive structural | 1.6% / 2.0% |
| a **rollout plan** (this run) | **0.0%** | 11.6% (mandated PRR) / 0.8% (unenforced) |

**The bound structure the evaluator credits follows the genre convention the generator reconstructs, not the model, not authorship, and not planfulness.** The runbook genre's convention is symptom → check → threshold → response for one alert — binding-dense by construction, and the generator reproduces it at twice the human corpus's rate. The rollout-plan genre's convention is phases, canary waves, owners, validation lists, and a separate Rollback section — planful prose whose conditions and responses live in *different sections*, exactly the structure the evaluator declines to credit without textual binding. Reading the generated plans confirms it: they are competent, monitoring-and-rollback-aware documents (63 read `VERIFIED CONSISTENT`, the same reading human operational prose gets), and their "watch X / revert if Y" content is distributed across section boundaries rather than bound in sentences.

This is the third leg of the PRR result. The ablation (v3.29.0) showed the KEP register's 11.6% is carried by the mandated questionnaire, which forces threshold-to-response binding *inline*; the OpenShift enhancements showed the same template unenforced yields 0.8%; this run shows a modern generator freely reconstructing the plan genre yields 0.0%. Mandated questionnaires are one mechanism that forces binding into text; the runbook genre's own convention is another; "write a rollout plan" is not.

**For the tool's headline use case — evaluating agent plans before execution — this is the operative sensitivity fact:** an LLM's spontaneous plan output earns nothing from the operational family. Cathedral will read a typical generated plan as `VERIFIED CONSISTENT` or `UNDECIDABLE`, not `OPERATIONALLY SOUND` — the flagship stays reserved for plans that actually bind thresholds to responses in text, whoever wrote them. That is the specificity-over-sensitivity stance behaving exactly as designed, now measured on the exact input class the use case names.

## Decision 1's boundary, probed and untouched

This run was pre-registered as a live probe of the count-route residue's monitored territory (token-dense plan prose). The probe came back maximally clean: nothing minted, so there is nothing shuffle-soft to measure. The honest limit stands: generated plans at their natural length (median 377 words) are far below the ~3,000-word token-dense regime where the decided boundary lives; the patient-adversary scenario remains monitored, not probed, at that scale.

## Honest limits

Identical inside-approximation caveats to the runbook run (one model family — the disclosed white-box attacker's; repo-adjacent environment; instructed-not-proven tool non-use; batch-shared contexts; n = 120). The two `OUTSIDE DESIGN SPACE` fires (`oci volume source`, `projected service account tokens…`) are within the pre-stated gate and consistent with the instrument's ordinary behavior on short procedural text. **The pure outside ask stands unchanged**: operational documents from any model, prompted by someone who has not read this repository. Not pooled into G2-EXT; the corpus is development data from this run forward. No core changes; the evaluator remains byte-identical to the v3.27.0 lineage.
