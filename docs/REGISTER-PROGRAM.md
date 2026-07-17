# The Register Program — Consolidated Findings Report

*As of 2026-07-17, v3.30.0. The one-document account of the fresh-register program: eight external register runs and three core changes between v3.20.0 and v3.30.0, every gate pre-registered (from v3.24.0 onward, committed to git before any verdict was computed), every failure published as a failure. Per-run detail: [WIKIMEDIA-INCIDENT-VALIDATION.md](WIKIMEDIA-INCIDENT-VALIDATION.md), [WIKIMEDIA-RUNBOOK-VALIDATION.md](WIKIMEDIA-RUNBOOK-VALIDATION.md), [PROMETHEUS-RUNBOOK-VALIDATION.md](PROMETHEUS-RUNBOOK-VALIDATION.md), [OPENSHIFT-RUNBOOK-VALIDATION.md](OPENSHIFT-RUNBOOK-VALIDATION.md), [KEP-VALIDATION.md](KEP-VALIDATION.md), [RUST-RFC-VALIDATION.md](RUST-RFC-VALIDATION.md), [OPENSHIFT-ENHANCEMENT-VALIDATION.md](OPENSHIFT-ENHANCEMENT-VALIDATION.md), [AI-AUTHORED-VALIDATION.md](AI-AUTHORED-VALIDATION.md). Core changes: [TIER2-DIVERSITY-TIGHTENING.md](TIER2-DIVERSITY-TIGHTENING.md) (v3.23.0), [TIER2-BINDING-DENSITY.md](TIER2-BINDING-DENSITY.md) (v3.25.0), [OBJECT-RATIO-WINDOWING.md](OBJECT-RATIO-WINDOWING.md) (v3.27.0, including one fix rejected by its own numbers).*

## The method

The program alternates two moves. **Validate:** feed the unmodified evaluator an external register nobody tuned on — labelled by construction, byte-pinned where the source is git — under gates committed before any verdict exists. **Act:** when a run names a residue, change the core once, monotonically where possible, pinned by regressions on both sides, measured on what thereby becomes development data — then the next fresh register validates the change. Ten runs and three changes in, the rule has been kept every time, including the two runs whose pre-registered gates failed and the one fix that was implemented, measured, and rejected.

## The eight registers

| Register | authorship | docs | family | `SOUND` | gaming | `OUTSIDE` |
|---|---|---|---|---|---|---|
| Wikimedia incident retrospectives | human | 600 | 0.7% | 0.0% | 1.0% | 0.2% |
| Wikimedia SRE runbooks | human | 174 | 0.6% | 0.0% | 1.7% | 0.0% |
| prometheus-operator alert runbooks | human | 62 | 0.0% | 0.0% | 0.0% | 0.0% |
| OpenShift alert runbooks | human | 256 | 2.0% | 0.0% | 0.4% | 1.2% |
| Kubernetes KEPs (PRR questionnaire) | human | 611 | **11.6%** | 10.8% | 0.8% | 0.5% |
| Rust RFCs (design plans) | human | 634 | 0.5% | 0.3% | 0.5% | 0.9% |
| OpenShift enhancement proposals | human | 596 | 0.8% | 0.7% | 1.2% | 0.8% |
| Cosmopedia wikihow (Mixtral-authored) | machine | 600 | 0.0% | 0.0% | 0.2% | 0.0% |

*(Rates as of v3.30.0; the evaluator current at each run's own record is in its results JSON.)*

## What is established

**1. The instrument regime is register- and authorship-general.** The reference-length principle (v3.17.0: counts become densities past the tuned register; extended v3.25.0 to the implicit-binding count, v3.27.0 to the object-diversity ratio as a windowed statistic) holds on all eight registers — `OUTSIDE DESIGN SPACE` 0.0–1.2%, gaming-flagged 0.0–2.0% everywhere, including the machine-authored register, which is the cleanest of the eight. Each extension was forced by a fresh register that broke the previous state honestly (long wiki documents, then signal-dense runbooks, then 10k-word KEPs), fixed once, and validated on the next register out-of-sample.

**2. Every operational-family verdict that fires on real documents is structural.** The standing word-shuffle control (20 seeded shuffles per positive, < 20% retention) has passed powered on three consecutive pools (n = 70, 84, 89), and the per-register worst has fallen from the 17/20 offenders of the early runs to ≤ 3/20 on six of eight registers. The two tier-2 guards (signal diversity, same-sentence binding — v3.23.0) and the binding-density guard (v3.25.0) each eliminated exactly the verdicts whose bound structure was chance-level for their scale, with zero curated movement and, out-of-sample, zero collateral (the openshift run's counterfactual: all guard fires were pre-fix positives; the KEP run: the guard's one flagged fire cost no verdict).

**3. The family verdict's design space, register-resolved and two-sided.** Retrospectives, alert pages, design plans, and machine tutorials all sit at 0.0–2.0%; the one register above 10% carries a mandated, written-out operational plan in every document — and the ablation proves that is precisely what fires: removing the kubernetes PRR questionnaire section from the KEP positives drops 53 of 71, collapsing 11.6% to ~2.9%. The claim "Cathedral evaluates the plan a document contains" is now literal: **it credits written-out operational plans — thresholds, failure modes, and responses bound in text — wherever they occur, overwhelmingly where a template mandates writing one.** Whether the flagship should distinguish mandated from voluntary operational binding is a ledgered design question, not a bug.

**4. No authorship shortcut.** Machine-authored procedural prose (600 Mixtral tutorials) earns the family at 0.0% and reads 76% `VERIFIED CONSISTENT` — the same fingerprint as human alert runbooks. The instruments respond to what text binds, not to who produced it.

**5. The external anti-gaming control, once structurally unpowerable, is now routine.** v3.22.0 priced a powered external G2-EXT at ~1,000 pooled documents at the then ~2% base rate; the KEP register's positives powered it in one corpus, and it has passed on every pool since.

## What failed, published

- **KEP run, V1 (gaming 15.5%)** — the object-diversity ratio declines with length by construction; diagnosed with the length-band table, fixed in v3.27.0 (windowed statistic), validated out-of-sample on Rust RFCs (counterfactual 5.4% → 0.5%, zero positives created).
- **KEP run, G4-DENS (worst text 11/20)** — the flagship's count-based routes mint `OPERATIONALLY SOUND` with no binding requirement. The obvious fix — a same-sentence threshold+action witness — was implemented, measured, and **rejected by its own numbers** (killed 49 of 56 earned verdicts; missed the worst offender). The residue stays open with the sharpened statement: no fixed-vocabulary witness can work; a future fix must locate the joining sentence without a lexicon or reference-scale the level-feeding counts under a measured sensitivity budget. Current magnitude: 3 of 40 control texts ≥ 4/20, worst 9/20, confined to token-dense KEPs.
- **S1-CONFIRM (OpenShift enhancements, 0.8%)** — the first S1 pass was not a register property; the PRR ablation above is the diagnosis. Recorded on the pre-stated FAIL reading.

## Open flags

1. **The flagship count-route shuffle softness** — open, localized, sharpened (above).
2. **Mandated vs voluntary operational binding** — a design question the ledger owns; any resolution is a register decision to be stated out loud, not a silent core change.
3. **LLM-written operational documents proper and adversarially prompted text** — the successor to the closed authorship flag: a model asked to *write a runbook*, and a modern generator asked to *game the evaluator*, both unmeasured.
4. **All eight corpora are development data** for any future core change; the ninth register validates it. The standing pattern of the program.
