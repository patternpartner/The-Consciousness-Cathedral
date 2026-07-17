# OpenShift Runbook Validation — v3.23.0 holds on a corpus nobody tuned on

*2026-07-17. The v3.23.0 diversity tightening ([TIER2-DIVERSITY-TIGHTENING.md](TIER2-DIVERSITY-TIGHTENING.md)) was iterated against the pooled fresh corpora, making them development data; its methodological note named the standing ask: "the next operational corpus nobody has tuned on is the validation for this fix." This is that corpus — deliberately the SAME text shape the fix targeted (terse metric-alert runbooks: Meaning / Impact / Diagnosis / Mitigation) from NEW provenance: `openshift/runbooks` (Red Hat). Not GitLab, not Wikimedia, not prometheus-operator. The evaluator (`cathedral-core.js`) is imported **unmodified**; preprocessing, gates, and shuffle control are copied verbatim. The gates were committed to history (`e6a1893`) BEFORE any verdict was computed on the corpus — the pre-registration is in git, not just claimed. Reproduce: `bash validation/fetch-openshift-runbooks.sh` (plus the three prior fetch scripts for the pool), `node validation/openshift-runbook-validation.js` → `validation/results-openshift-runbook-validation.json`. Deterministic, verified identical on re-run.*

## Design

**Population, labelled by construction and BYTE-PINNED:** every `alerts/**/*.md` in `openshift/runbooks` except the one `README.md` navigation page (the analogue of the prometheus run's `_index.md` exclusion), pinned to commit `82bd2d9d`. 271 alert runbooks across 18 operator directories; after the ≥ 500-char prose floor, **256 effective documents**. The loader is byte-identical to the prometheus loader (`stripFrontmatter` is a no-op here — these files carry no YAML frontmatter — retained so the path is identical).

**Pre-registered gates** (committed before any verdict was computed):

- **V1 — density fix holds on a FOURTH fresh register** (validates v3.17.0): `OUTSIDE DESIGN SPACE` < 5% AND gaming-flagged < 10%.
- **G3-DIV — the v3.23.0 guards hold out-of-sample** (the fix-specific gate). On this population's operational-family positives, the standing word-shuffle control (20 seeded shuffles/text) must show pooled retention < 20% AND no single text retaining ≥ 10/20 — the pre-fix offender signature was 17/20 and 11/20. Zero positives passes vacuously.
- **Guard activity** (reported, not gated): documents whose implicit-binding assessment is `SINGLE_SIGNAL_BINDING` — the new guard firing in the wild.
- **G2-EXT-POOLED** (standing): pool operational-family positives across all four fresh populations; n ≥ 20 applies the < 20% retention gate; n < 20 is UNDERPOWERED.
- **S1 / R1 / R2** (reported): family rate, `OPERATIONALLY SOUND` share, verdict distribution.

## Results

| Gate | Result |
|---|---|
| **V1 — density fix, openshift register** | `OUTSIDE DESIGN SPACE` **1.2%**, gaming-flagged **2.0%** → **PASS** |
| **G3-DIV — v3.23.0 out-of-sample** | 5 positives, retention **9.0%** (9/100), worst text **4/20** → **PASS-structural** |
| Guard activity | `SINGLE_SIGNAL_BINDING` fired on **4** documents; `SINGLE_ACTION_BINDING` 0 |
| G2-EXT-POOLED | **n=13** (6 wmi + 2 wmr + 0 prom + 5 os) **< 20 → UNDERPOWERED**; retention 7.7% |
| S1 — operational family (≥ 10%) | **2.0%** (5 docs) → **FAIL-insensitive** (expected; blocker 3) |
| R1 — `OPERATIONALLY SOUND` | **0.0%** (0 of 256) |

Verdict distribution (256 documents): VERIFIED CONSISTENT 171 (66.8%), UNDECIDABLE 54 (21.1%), SUBSTRATE VISIBLE 10 (3.9%), NON-ACTIONABLE 8 (3.1%), OPERATIONAL INTENT 5 (2.0%), COHERENT BUT SHALLOW 5 (2.0%), OUTSIDE DESIGN SPACE 3 (1.2%). Zero `OPERATIONALLY SOUND`.

## The finding: the fix works on fresh text, and the counterfactual shows exactly what it removed

G3-DIV passes on the register the fix targeted: five `OPERATIONAL INTENT` positives, all structurally earned — pooled shuffle retention 9.0%, worst text 4/20. The pre-fix offender signature (a verdict surviving ≥ half its shuffles) does not appear.

To see the mechanism, the **pre-fix evaluator (v3.22, `fdf8ded`) was run on the same corpus** — a post-hoc check, clearly not part of the pre-registration:

| Measure | pre-fix v3.22 | post-fix v3.23.0 |
|---|---|---|
| Operational-family positives | **21** (8.2%) | **5** (2.0%) |
| Pooled shuffle retention | **19.5%** (82/420) | **9.0%** (9/100) |
| Worst per-text retention | **11/20** (NodeClockNotSynchronising) | **4/20** |

Out-of-sample, on text nobody tuned on, the tightening removes 16 of 21 positives, halves shuffle retention, and eliminates the offender shape outright — pre-fix, this fresh corpus contained a new 11/20 offender (`NodeClockNotSynchronising`), exactly the signature the Wikimedia runbooks had surfaced; post-fix, nothing survives above 4/20.

**The guard fires on exactly the documents it was built for.** All four `SINGLE_SIGNAL_BINDING` downgrades (`etcdHighNumberOfFailedGRPCRequests`, `CephClusterErrorState`, `CephClusterWarningState`, `CephXattrSetLatency`) were pre-fix operational-family positives — each a short alert page binding one signal word repeatedly. None was a post-fix positive that the guard clipped; the guard's activity is all removal of the targeted defect, no collateral.

**Cross-provenance replication on one text.** The upstream `etcd/etcdHighNumberOfFailedGRPCRequests` was the prometheus corpus's *sole* pre-fix positive; `openshift/runbooks` vendors an adapted variant of the same page. Post-fix, both variants are stopped — the upstream one by the same-sentence guard (its second binding no longer forms; `WEAK_INTENT`, bound 1), the Red Hat adaptation by the signal-diversity guard (bound 2, uniqueSignals 1 → `SINGLE_SIGNAL_BINDING`). Two independently edited versions of one defective text, caught by the two different v3.23.0 guards.

## What holds regardless

**1. V1 confirmed a fourth time — the density fix generalizes again.** `OUTSIDE DESIGN SPACE` 1.2%, gaming-flagged 2.0%, both comfortably inside the post-fix regime. Across four runs the v3.17.0 length-density fix now stands on **1,092 fresh operational documents** of four distinct shapes from three independent provenances.

**2. Register boundary confirmed a fourth time.** Zero `OPERATIONALLY SOUND` on all 1,092 fresh operational documents; every operational-family positive across every fresh run is `OPERATIONAL INTENT`, never the flagship.

**3. The family base rate stays low and flat — now lower, by design.** 2.0% here (8.2% pre-fix); post-v3.23.0 the four fresh registers run 0.0–2.0%. The specificity-over-sensitivity stance bought exactly this trade.

## Honest limits and open flags

1. **The counterfactual and the overlap analysis are post-hoc.** The gates (V1, G3-DIV, G2-EXT-POOLED) were committed before any verdict was computed; the pre-fix re-run and the vendoring check below were performed after seeing results, and are labeled as mechanism checks, not gates.
2. **The corpus is not perfectly disjoint from the prometheus dev corpus.** 33 of 269 alert names (12%) are vendored from the same upstream (sampled textual similarity jaccard 0.25–0.73). Gate-robust: **none of the five positives is in the shared set**, so G3-DIV's result is unchanged if the overlap is excluded; one of the four guard fires (the etcd page) is the vendored variant, reported above as replication rather than hidden.
3. **G2-EXT-POOLED recedes rather than approaches: n=13, held as measured, not chased.** v3.23.0 removed soft positives from the dev corpora (17 → 8, reproduced exactly by this re-fetch: 6+2+0) and the fresh corpus adds 5. The fix *lowered* the family base rate — the powered external control now needs even more pooled documents than v3.22's estimate. The passing structure evidence remains the curated G2 (0/60) plus this run's G3-DIV.
4. **The Wikimedia pool members are live-wiki re-fetches** (date-bounded, revids recorded). The prior-corpora positive count matched the v3.23.0 post-fix measurement exactly (8), so drift did not affect the pool.
5. **Per-text retention counts vary between controls** for the same text (each control draws its own seeded shuffles; e.g. TelemeterClientFailures 2/20 in G3-DIV, 5/20 in the pooled draw). Gates are on pooled rates; per-text lists are diagnostic.
6. **The known residual is unchanged:** Network monitoring (the 3,100-word, ~48-signal Wikimedia runbook) retains 8/20 in this pooled draw — the length/density frontier recorded in v3.23.0, still open, still not overfit away.
7. **Human-written corpus**; AI-authored operational text still unmeasured.

## The four fresh runs, together

| Measure | Wikimedia incidents (600) | Wikimedia runbooks (174) | Prometheus runbooks (62) | **OpenShift runbooks (256)** |
|---|---|---|---|---|
| `OUTSIDE DESIGN SPACE` | 0.2% | 0.0% | 0.0% | **1.2%** |
| Gaming flagged | 2.5% | 4.0% | 0.0% | **2.0%** |
| `OPERATIONALLY SOUND` | 0.0% | 0.0% | 0.0% | **0.0%** |
| Operational family (post-v3.23.0) | 1.0% | 1.1% | 0.0% | **2.0%** |

The density fix generalizes on every register; the flagship never fires on real operational documents; and the diversity tightening now has what its own findings document said it needed — validation on a corpus nobody tuned on, on the exact text shape it was built to harden.
