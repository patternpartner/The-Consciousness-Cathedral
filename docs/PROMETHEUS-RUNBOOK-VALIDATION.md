# Prometheus Runbook Validation — the density fix holds a third time; why G2-EXT won't power on real documents

*2026-07-11. The runbook run ([WIKIMEDIA-RUNBOOK-VALIDATION.md](WIKIMEDIA-RUNBOOK-VALIDATION.md)) left G2-EXT at pooled n=16 < 20 and sharpened the ask to a source *dense in plan-bearing text*. `prometheus-operator/runbooks` is that source — each alert page is Meaning / Impact / Diagnosis / Mitigation, a threshold semantics bound to a mitigation — and it was added specifically to power the retest. It did not: the pooled count reached only n=17, and the reason is the finding. The evaluator (`cathedral-core.js`) is imported **unmodified**; preprocessing, seed, gates, and shuffle control are copied verbatim. Reproduce: `bash validation/fetch-wikimedia-incidents.sh && bash validation/fetch-wikimedia-runbooks.sh && bash validation/fetch-prometheus-runbooks.sh`, `node validation/prometheus-runbook-validation.js` → `validation/results-prometheus-runbook-validation.json`. Deterministic, verified identical on re-run.*

## Design

**Plan-dense population, labelled by construction and BYTE-PINNED:** every `content/runbooks/<category>/<Alert>.md` (excluding `_index.md` landing pages) in `prometheus-operator/runbooks`, pinned to commit `a685d14c` — the strongest reproducibility of the three fresh corpora (git, not a live wiki). 108 alert runbooks across 8 categories (kubernetes, prometheus, node, etcd, alertmanager, …); after the ≥ 500-char prose floor, **62 effective documents** (these pages are terse — median 600 chars). New to the evaluator; not GitLab, not Wikimedia.

**Preprocessing:** the only corpus-specific step is stripping Hugo YAML frontmatter (`--- title … ---`, the markdown-file analogue of the wiki template comments `stripMarkdown` already removes) before the **identical** `stripMarkdown` normalizer and the same ≥ 500-char floor. `stripMarkdown` itself is byte-identical to every prior run.

**Pre-registered gates** (written before any verdict was computed):

- **V1 — density fix holds on a third fresh register** (validates v3.17.0): `OUTSIDE DESIGN SPACE` < 5% AND gaming-flagged < 10%.
- **G2-EXT-POOLED — structure, not vocabulary, powered on fresh data.** Pool the operational-family positives of all three fresh populations (Wikimedia incidents + Wikimedia runbooks + prometheus runbooks); at n ≥ 20 apply the standing word-shuffle gate (20 seeded shuffles/text, < 20% retention → PASS-structural); at n < 20, UNDERPOWERED.
- **S1 / R1 / R2** (reported): family rate, `OPERATIONALLY SOUND` share, verdict distribution.

## Results

| Gate | Result |
|---|---|
| **V1 — density fix, prometheus register** | `OUTSIDE DESIGN SPACE` **0.0%**, gaming-flagged **0.0%** → **PASS** (cleanest of the three) |
| **G2-EXT-POOLED** | **n=17** (10 wmi + 6 wmr + 1 prom) **< 20 → UNDERPOWERED**; retention 14.1% (48/340) |
| S1 — operational family (≥ 10%) | **1.6%** (1 doc) → **FAIL-insensitive** (expected; blocker 3) |
| R1 — `OPERATIONALLY SOUND` | **0.0%** (0 of 62) |

Prometheus verdict distribution (62 documents): VERIFIED CONSISTENT 46 (74.2%), UNDECIDABLE 8 (12.9%), NON-ACTIONABLE 3 (4.8%), SUBSTRATE VISIBLE 2 (3.2%), COHERENT BUT SHALLOW 2 (3.2%), OPERATIONAL INTENT 1 (1.6%). Zero OPERATIONALLY SOUND.

## The finding: external power is bounded by an intrinsically low base rate

The retest was designed to power G2-EXT by adding a plan-dense source. It moved the pooled count from 16 to **17** — the plan-dense corpus contributed exactly **one** operational-family positive. That near-zero contribution *is* the result:

| Fresh corpus | documents | operational family | positives |
|---|---|---|---|
| Wikimedia incidents | 600 | 1.7% | 10 |
| Wikimedia runbooks | 174 | 3.4% | 6 |
| **prometheus-operator/runbooks** | 62 | **1.6%** | **1** |
| **pooled (all fresh)** | **836** | **2.0%** | **17** |

The operational-family verdict fires at ~1.6–3.4% across every real operational register, and — the decisive point — **even a corpus built entirely of plan-bearing alert runbooks earns it at 1.6%**, no denser than incident retrospectives. The bottleneck was never source *selection*; it is that real operational documentation, whatever its type, rarely earns the family verdict at all. 74% of the prometheus alerts land in `VERIFIED CONSISTENT` — the evaluator reads them as consistent and testable but not as compact forward-looking plans with bound thresholds-to-actions. **This is the register boundary (blocker 3) restated from the positive side:** the verdict recognizes a narrow compact-plan register, and real-world operational prose mostly sits outside it. Powering an external control to n ≥ 20 at a ~2% base rate needs ~1,000 pooled documents across many sources; three fresh corpora and 836 documents reach 17.

## What holds regardless

**1. V1 confirmed a third time — the density fix is not corpus-specific.** Prometheus alert runbooks expel `OUTSIDE DESIGN SPACE` at 0.0% and gaming-flag at 0.0% — the cleanest of the three fresh registers. Across all three runs the v3.17.0 length-density fix now stands on **836 fresh operational documents** of three distinct shapes (incident retrospectives, wiki runbooks, Hugo alert pages) from independent provenance. It generalizes.

**2. Register boundary confirmed a third time.** Zero `OPERATIONALLY SOUND` on all 836 fresh operational documents; every operational-family positive across every run is `OPERATIONAL INTENT`, never the flagship.

**3. Tier-2 softness is localized, not general.** Of the 17 pooled positives, **14 retain 0–3 of 20** word-shuffles (structural); the prometheus positive (`etcd/etcdHighNumberOfFailedGRPCRequests`) retains 2/20. Essentially all shuffle-retention comes from the same **3 short Wikimedia alert-runbook INTENT cases** flagged in the runbook run (WebPageTest alert 17/20, Network monitoring 11/20, SyntheticToolAlert 9/20). The aggregate 14.1% is "14 solid positives + 3 soft ones," not diffuse softness. Non-deciding at n=17, but it localizes the open flag to a specific text shape (terse metric-alert prose) rather than the tier at large.

## Honest limits and open flags

1. **G2-EXT out-of-sample is still not powered (n=17 < 20), and the reason is structural, not logistical.** The pooled count was **held at 17 as measured** — not chased across still more sources to cross 20. The register boundary makes the positive base rate ~2%; a formally powered external control is a ~1,000-document undertaking. The already-passing evidence for structure-not-vocabulary is the **curated G2** (0/60 retained, `run-core-regressions.js`) and the GitLab-era external G2-EXT (n=28, 16.1%, development data); this run adds that on 836 fresh documents the positives are 82% fully structural under shuffle, with softness confined to 3 identifiable alert texts.
2. **The localized tier-2 softness is the actionable residue** — 3 short metric-alert texts whose `OPERATIONAL INTENT` survives shuffling. A future implicit-binding tightening could target that shape specifically; this run is its pre-registered evidence.
3. **Human-written corpus**; AI-authored operational text still unmeasured.
4. **S1 stays FAIL as the record** — expected by blocker 3 on all three registers.

## The three fresh runs, together

| Measure | Wikimedia incidents (600) | Wikimedia runbooks (174) | Prometheus runbooks (62) |
|---|---|---|---|
| `OUTSIDE DESIGN SPACE` | 0.2% | 0.0% | **0.0%** |
| Gaming flagged | 2.5% | 4.0% | **0.0%** |
| `OPERATIONALLY SOUND` | 0.0% | 0.0% | **0.0%** |
| Operational family | 1.7% | 3.4% | **1.6%** |

V1 holds on every register; the flagship never fires on real operational documents; the family base rate is low and flat everywhere. The density fix generalized; the register boundary generalized; the external anti-gaming control remains structurally hard to power, which is itself the boundary seen from the other side.
