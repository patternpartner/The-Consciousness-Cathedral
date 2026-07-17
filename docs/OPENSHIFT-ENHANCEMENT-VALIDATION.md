# OpenShift Enhancement Validation — S1-CONFIRM fails, and the ablation names why: the milestone was the PRR questionnaire

*2026-07-17. The KEP register produced the program's first S1 pass (operational family 11.6%) and the Rust RFC run refined the claim to operational plans; both awaited a fresh operational-plan register. This run fed the **unmodified** evaluator 596 OpenShift enhancement proposals (`openshift/enhancements`, byte-pinned @ `46e0482d`, every `enhancements/**/*.md` except READMEs, labelled by construction) — KEP-template documents (535 of 596 carry a "Risks and Mitigations" section) from a different community. Provenance stated in the pre-registration: Red Hat is already a source (corpus 4), but this is a disjoint population and register no fix was tuned on. Gates committed (`7725c13`) before any verdict, **with both S1-CONFIRM readings pre-stated**. Deterministic, verified identical on re-run. Reproduce: `bash validation/fetch-openshift-enhancements.sh` (plus the six prior fetch scripts), `node validation/openshift-enhancement-validation.js` → `validation/results-openshift-enhancement-validation.json`.*

## Results

| Gate | Result |
|---|---|
| **S1-CONFIRM — family ≥ 10% on a second operational-plan register** | **0.8%** (5 of 596) → **FAIL — the pre-stated unconfirmed reading applies** |
| V1 — seventh register | `OUTSIDE DESIGN SPACE` 0.8%, gaming-flagged 1.2% → **PASS** |
| G5-RESIDUE (pooled shuffle gate) | retention **1.0%**, worst text **1/20** → **PASS-structural** |
| G2-EXT-POOLED (seven populations) | **n=89**, retention **2.6%** → **PASS-structural** (third consecutive powered pass) |
| R1 — `OPERATIONALLY SOUND` | 0.7% (4 docs) |

Verdict distribution (596): VERIFIED CONSISTENT 253, SUBSTRATE VISIBLE 188, UNDECIDABLE 127, WELL JUSTIFIED 11, NON-ACTIONABLE 7, OUTSIDE DESIGN SPACE 5, OPERATIONALLY SOUND 4, OPERATIONAL INTENT 1.

## The finding: the ablation that explains both registers

Two corpora share a template lineage; one fires at 11.6%, the other at 0.8%. The structural difference between them is that kubernetes KEPs embed the **Production Readiness Review questionnaire** — a mandated section that is literally a structured operational plan (how can the rollout fail, what metrics inform a rollback, can the feature be disabled) — while OpenShift's template asks for Risks-and-Mitigations prose without that questionnaire.

The ablation (post-hoc, labeled as such) confirms it directly: **70 of the 71 KEP family positives contain a PRR section, and removing that one section drops 53 of them out of the family.** The KEP rate with PRR removed falls from 11.6% to **~2.9%** — still the highest residual of any register, but nowhere near the gate.

So the S1 milestone decomposes into two true statements:

1. **The verdict does what the register claim says, literally.** The PRR questionnaire *is* the operational plan those documents contain — thresholds, failure modes, and rollback responses bound in text. When a community mandates writing an operational plan into every proposal, the evaluator finds it there. When a community doesn't (OpenShift's five positives — `etcd/protecting-etcd-quorum-during-control-plane-scaling`, `ingress/ingress-fault-detection`, … — wrote their operational binding voluntarily, and all five are structural under shuffle, worst 1/20).
2. **The deflationary statement, recorded without flinching:** sensitivity to operational planning expressed *outside* a mandated questionnaire format is low everywhere — ~0.6–2.9% across all seven registers. The 11.6% was substantially a measurement of one community's template. S1-as-register-property is **unconfirmed**, exactly as the pre-registered FAIL reading anticipated.

## What holds regardless

1. **V1 passes on a seventh consecutive register** (gaming 1.2%, OUTSIDE 0.8%) — the v3.17.0/v3.27.0 instrument regime now stands on ~2,900 fresh documents across seven registers and four provenances.
2. **The flagship count-route residue did not reappear** on the register sharing the KEP template's operational vocabulary — worst per-text retention 1/20 against the 10/20 reference. Its known locus narrows to specific token-dense KEPs, not the template genre.
3. **G2-EXT-POOLED passes powered a third time** (n=89, 2.6%) — and every one of this run's five positives retains ≤ 1/20 under shuffle, the cleanest per-register control of the program.

## Honest limits and open flags

1. **The ablation is post-hoc.** The gate that failed was pre-registered; the PRR decomposition was computed after seeing the result and is the diagnosis, not a reinterpretation into a pass.
2. **The PRR effect itself has a two-sided reading** (above), and choosing between "the verdict correctly credits mandated plans" and "the verdict is template-sensitive" is a design question the ledger now owns: if the flagship should require *voluntary* operational binding, that is a future register decision, not a bug fix.
3. **The seven corpora are all development data now.** The standing pattern continues: any future core change validates on an eighth.
4. **Human-written corpora — eight runs standing**; AI-authored operational text remains unmeasured, the program's oldest open flag.

## The seven fresh runs, together

| Register | docs | family | SOUND | gaming | OUTSIDE |
|---|---|---|---|---|---|
| Incident retrospectives (wmi) | 600 | 0.7% | 0.0% | 1.0% | 0.2% |
| Wiki runbooks (wmr) | 174 | 0.6% | 0.0% | 1.7% | 0.0% |
| Prometheus alerts | 62 | 0.0% | 0.0% | 0.0% | 0.0% |
| OpenShift alerts | 256 | 2.0% | 0.0% | 0.4% | 1.2% |
| KEPs (with PRR questionnaire) | 611 | **11.6%** | 10.8% | 0.8% | 0.5% |
| Rust RFCs (design plans) | 634 | 0.5% | 0.3% | 0.5% | 0.9% |
| **OpenShift enhancements** | **596** | **0.8%** | **0.7%** | **1.2%** | **0.8%** |

The register-resolved boundary, final form for now: the flagship fires where a document carries a *written-out operational plan* — overwhelmingly, where a template mandates one — and stays silent everywhere else. That is a narrower instrument than "detects operational plans," and the program now says so out loud.
