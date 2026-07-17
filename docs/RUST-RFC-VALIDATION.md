# Rust RFC Validation — the windowing holds out-of-sample; the S1 milestone refines to *operational* plans

*2026-07-17. The v3.27.0 windowed object ratio ([OBJECT-RATIO-WINDOWING.md](OBJECT-RATIO-WINDOWING.md)) was measured against the five prior fresh corpora, and the KEP run's S1 pass (operational family 11.6%, the first in the program's history) was a development-data result until a fresh plan register weighed in. This run fed the **unmodified** evaluator 636 accepted Rust RFCs (`rust-lang/rfcs`, byte-pinned @ `f635361c`, every `text/*.md`, labelled by the repository's own merge convention; 634 effective after the ≥ 500-char floor) — long design plans from new provenance, and the first long-document register since the windowing. Gates committed (`bad22e3`) before any verdict was computed, **with both S1 readings pre-stated**. Deterministic, verified identical on re-run. Reproduce: `bash validation/fetch-rust-rfcs.sh` (plus the five prior fetch scripts for the pool), `node validation/rust-rfc-validation.js` → `validation/results-rust-rfc-validation.json`.*

## Results

| Gate | Result |
|---|---|
| **V1 — sixth register; the v3.27.0 fix gate** | `OUTSIDE DESIGN SPACE` 0.9%, gaming-flagged **0.5%** → **PASS** |
| S1 — operational family (≥ 10%) | **0.5%** (3 of 634) → FAIL → **the pre-stated refinement reading applies** |
| G5-RESIDUE (pooled shuffle gate on RFC positives) | retention **5.0%**, worst text **2/20** → **PASS-structural** |
| **G2-EXT-POOLED** (six populations) | **n=84**, retention **6.3%** → **PASS-structural** (second consecutive powered pass) |
| R1 — `OPERATIONALLY SOUND` | 0.3% (2 docs) |

Verdict distribution (634): VERIFIED CONSISTENT 336, UNDECIDABLE 184, SUBSTRATE VISIBLE 86, WELL JUSTIFIED 13, OUTSIDE DESIGN SPACE 6, NON-ACTIONABLE 5, OPERATIONALLY SOUND 2, OPERATIONAL INTENT 1, COHERENT BUT SHALLOW 1.

## Finding 1: the windowing validates on text nobody tuned on

Rust RFCs are the first long-document register the evaluator has seen since the object ratio was windowed, and the gaming-flag rate is **0.5%** — the post-fix regime. The post-hoc counterfactual makes the mechanism visible: the **pre-v3.27.0 core flags 5.4%** of the same corpus (34 documents) — a 10× reduction, entirely from removing the length artifact. The counterfactual also bounds the relaxation's cost here: the operational-family count is **identical (3) under both cores**, so on this register the windowing un-flagged 31 documents without creating a single family positive. The KEP-run V1 failure is now closed out-of-sample: gaming-flag rates post-fix run 0.0–1.7% across all six registers.

## Finding 2: the S1 milestone belongs to *operational* plans — the pre-stated refinement

The pre-registration stated both readings in advance. The measurement chose the second: Rust RFCs — genuine, accepted, long design plans — earn the operational family at **0.5%**, while KEPs earned it at 11.6%. The difference is not "planfulness"; both registers are plans. The difference is **what the plans bind**: KEPs carry production-readiness sections (rollout/rollback plans, monitoring, failure policy — thresholds bound to responses); Rust RFCs argue semantics, syntax, and trade-offs (Drawbacks, Rationale, Unresolved questions — alternatives bound to arguments). The family verdict detects the former and stays silent on the latter.

The register table, six corpora in:

| Register | family rate |
|---|---|
| Incident retrospectives (wmi, 600) | 0.7% |
| Wiki runbooks (wmr, 174) | 0.6% |
| Alert runbooks (prom + os, 318) | 0.0–2.0% |
| **Design plans (Rust RFCs, 634)** | **0.5%** |
| **Operational plans (KEPs, 611)** | **11.6%** |

The design-space statement sharpens accordingly: **"Cathedral evaluates the plan a document contains" means the *operational* plan — thresholds, failure modes, and responses bound together — not deliberation about design choices.** A refinement recorded exactly as the pre-registration anticipated it, not a regression of any fix: the three RFC positives that do fire are the RFCs that talk operationally (`1122-language-semver` — a policy with monitoring and mitigation semantics — and two others), and all three are structural under shuffle (worst 2/20).

## What holds regardless

1. **The flagship count-route residue does not appear on this register** — worst per-text retention 2/20 against the 10/20 reference. Its known locus stays the KEP register (token-dense operational vocabulary).
2. **G2-EXT-POOLED passes powered a second time** (n=84, 6.3%), now spanning six populations and two genres of positive.
3. `OUTSIDE DESIGN SPACE` 0.9% — the sixth consecutive register in the post-v3.17 regime.

## Honest limits and open flags

1. **The KEP S1 pass remains unconfirmed by fresh data** — this run *refined* the claim rather than confirming it. The confirmation now needs a fresh **operational-plan** register (documents with rollout/monitoring/failure sections nobody has tuned on). That is the sharpened standing ask.
2. **The five prior corpora are development data** for v3.27.0; only the RFC register is fresh for it. The counterfactual and this run's V1 are the fix's out-of-sample evidence.
3. **The refinement is one register deep.** "Design plans don't fire" rests on one design-plan corpus; a second (e.g., Python PEPs, different preprocessing) would strengthen it.
4. **Human-written corpus** — seven runs standing; AI-authored operational text remains unmeasured.

## The six fresh runs, together

| Measure | wmi | wmr | prom | os | kep | **rfc** |
|---|---|---|---|---|---|---|
| Documents | 600 | 174 | 62 | 256 | 611 | **634** |
| `OUTSIDE DESIGN SPACE` | 0.2% | 0.0% | 0.0% | 1.2% | 0.5% | **0.9%** |
| Gaming flagged (current core) | 1.0% | 1.7% | 0.0% | 0.4% | 0.8% | **0.5%** |
| `OPERATIONALLY SOUND` | 0.0% | 0.0% | 0.0% | 0.0% | 10.8% | **0.3%** |
| Operational family | 0.7% | 0.6% | 0.0% | 2.0% | 11.6% | **0.5%** |

Six registers, three genres, ~2,300 fresh documents: the density instruments hold everywhere, the anti-gaming control is powered and passing, and the family verdict's design space now has a two-sided, register-resolved boundary — silent on retrospectives, silent on design deliberation, firing on operational plans.
