# PEP Validation — the design-register finding replicates: 0.6%, a third community, a different format

*2026-07-17. The Rust RFC run ([RUST-RFC-VALIDATION.md](RUST-RFC-VALIDATION.md)) established "design plans don't fire" (family 0.5% vs 11.6% on the mandated-operational-plan register) and named its own honest limit: the refinement was one register deep. This run replicates it: 735 Python Enhancement Proposals (`python/peps`, byte-pinned @ `b5645cea`, every `peps/pep-*.rst` by the repository's naming convention; 725 effective after the ≥ 500-char floor) through the **unmodified** evaluator. Gates committed (`36f0de8`) before any verdict, with **three pre-stated S-DESIGN bands** (≤ 2% replicates; ≥ 10% breaks; between weakens). The one new degree of freedom is disclosed in the pre-registration: a minimal `stripRst` — the reStructuredText analogue of the shared `stripMarkdown` furniture rules (header field block, directive lines, section underlines, literal blocks, inline markup) — runs before the identical normalizer. Deterministic, verified identical on re-run. Reproduce: `bash validation/fetch-python-peps.sh` (plus the prior fetch scripts for the pool), `node validation/pep-validation.js` → `validation/results-pep-validation.json`.*

## Results

| Gate | Result |
|---|---|
| **S-DESIGN — the replication** | family **0.6%** (4 of 725) → **REPLICATES** (pre-stated band ≤ 2%; Rust RFCs measured 0.5%) |
| V1 — ninth register | `OUTSIDE DESIGN SPACE` 0.4%, gaming-flagged 1.1% → **PASS** |
| G-STRUCT | 4 positives, retention **0.0%**, worst text **0/20** → **PASS-structural** (the cleanest per-register control of the program) |
| G2-EXT-POOLED (eight human registers) | **n=93**, retention **4.9%** → **PASS-structural** (fourth consecutive powered pass) |
| R1 — `OPERATIONALLY SOUND` | 0.1% (1 doc: PEP 475) |

Verdict distribution (725): VERIFIED CONSISTENT 333, UNDECIDABLE 261, SUBSTRATE VISIBLE 107, NON-ACTIONABLE 10, WELL JUSTIFIED 6, OPERATIONAL INTENT 3, OUTSIDE DESIGN SPACE 3, COHERENT BUT SHALLOW 1, OPERATIONALLY SOUND 1.

## What the replication establishes

**The design/operational split is a property of the register, not of one corpus.** Two design-plan registers now measure 0.5% and 0.6% — different communities (Rust, Python), different domains (systems language, general language and process), different formats (markdown, reStructuredText), different decades of authorship — against 11.6% on the register whose template mandates a written-out operational plan. The refinement stated in the Rust run and sourced in the PRR ablation ([OPENSHIFT-ENHANCEMENT-VALIDATION.md](OPENSHIFT-ENHANCEMENT-VALIDATION.md)) is no longer one register deep.

The four PEP positives are the PEPs one would predict: PEP 475 (retry semantics on EINTR — thresholds and responses in prose) earns the flagship; PEP 391 (logging configuration), PEP 632 (distutils deprecation plan), and PEP 829 earn `OPERATIONAL INTENT` — and all four retain **0/20** under shuffle. Even at a 0.6% rate, what fires is structural.

**A format-generality bonus, measured incidentally:** this is the first register to reach the evaluator through a non-markdown, non-wiki preprocessing path, and V1 holds — the instrument regime survives a document-format change with only disclosed furniture rules between the raw bytes and the shared normalizer.

## Honest limits

1. **`stripRst` is a new preprocessing artifact** — minimal, furniture-only, and disclosed in the pre-registration commit, but its rules were written by the program (unlike the wiki runs, where the wiki rendered prose). The safeguard is the same as everywhere: the evaluator is unmodified, and the gates were fixed before any verdict.
2. **UNDECIDABLE is high here (36%)** — PEPs are argument-dense and code-adjacent; recorded as this register's fingerprint, not investigated further in this run.
3. **The nine corpora are all development data now** for any future core change; the standing pattern continues.

## The nine fresh registers, together

| Register | authorship | docs | family | gaming | OUTSIDE |
|---|---|---|---|---|---|
| Wikimedia incidents | human | 600 | 0.7% | 1.0% | 0.2% |
| Wikimedia runbooks | human | 174 | 0.6% | 1.7% | 0.0% |
| Prometheus alerts | human | 62 | 0.0% | 0.0% | 0.0% |
| OpenShift alerts | human | 256 | 2.0% | 0.4% | 1.2% |
| KEPs (PRR questionnaire) | human | 611 | **11.6%** | 0.8% | 0.5% |
| Rust RFCs (design) | human | 634 | 0.5% | 0.5% | 0.9% |
| OpenShift enhancements | human | 596 | 0.8% | 1.2% | 0.8% |
| Cosmopedia wikihow | machine | 600 | 0.0% | 0.2% | 0.0% |
| **Python PEPs (design)** | **human** | **725** | **0.6%** | **1.1%** | **0.4%** |

Nine registers, ~4,200 fresh documents, six provenances, two authorships, three document formats. Every claim in [REGISTER-PROGRAM.md](REGISTER-PROGRAM.md) now rests on at least two registers except the mandated-plan rate itself — which is exactly the corpus the PRR ablation dissected.
