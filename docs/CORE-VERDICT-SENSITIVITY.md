# Core Verdict Sensitivity — operational corpora run 1

*2026-07-11. Run 1 ([CORE-VERDICT-VALIDATION.md](CORE-VERDICT-VALIDATION.md)) proved the flagship verdict's specificity — zero firings on 3,889 conversational turns — and left its open flag: sensitivity on real operational documents unmeasured. This run measures it. The pre-stated gate **failed**, decisively, and the dissection of why is the most instructive result the validation program has produced. Reproduce: `bash validation/fetch-operational-corpora.sh`, `node validation/core-verdict-sensitivity.js` → `validation/results-core-verdict-sensitivity.json`. Deterministic: seeded shuffles.*

## Design

Two populations of real operational documents, **labelled by construction** — the label is the document type, not an annotator's opinion:

- **GitLab production incident reviews** — 170 real postmortems from GitLab's public issue tracker (label `incident-review`): summary, impact, root cause, corrective actions. Date-bounded slice (created before 2026-07-11).
- **GitLab runbooks** — 323 real on-call runbooks from the public `gitlab-com/runbooks` repository, pinned to commit `9639ff91` (byte-stable corpus): alert thresholds, escalation steps, troubleshooting procedures.

Both are human-written; no labelled corpus of genuinely operational *AI* outputs exists (still the most valuable possible contribution). Preprocessing was fixed before any analysis: markdown stripped to prose (code fences, HTML template comments, link syntax, table furniture removed), documents under 500 chars of stripped prose dropped, whole documents analyzed.

Pre-stated gates, written before the analyzer touched this data:

- **S1 — sensitivity.** Operational-family verdict (`OPERATIONALLY SOUND` or `OPERATIONAL INTENT`) on ≥ 10% of documents in each population. Run 1's conversational base rate was ~0.08% of turns, so this asks for two orders of magnitude of separation on the verdicts' home ground.
- **G2-EXT — structure over vocabulary, at external scale.** Pool this run's positives; at n ≥ 20 apply run 1's word-shuffle gate (20 seeds per text, < 20% retention).
- **R1 — flagship recall** (reported): share of documents earning `OPERATIONALLY SOUND` specifically.
- **R2 — design-space shape** (reported): full verdict distribution and gaming-flag rates.

## Results

| Gate | Incident reviews (170) | Runbooks (323) |
|---|---|---|
| S1 operational family | **0.0% → FAIL-insensitive** | **0.9% (3 docs) → FAIL-insensitive** |
| R1 `OPERATIONALLY SOUND` | 0.0% | 0.3% (1 doc) |
| Gaming flagged | 24.1% | 21.1% |
| `OUTSIDE DESIGN SPACE` | 28.8% | 14.2% |

Verdict distributions (share of documents):

| Verdict | Incident reviews | Runbooks |
|---|---|---|
| VERIFIED CONSISTENT | 48.2% | 39.6% |
| OUTSIDE DESIGN SPACE | 28.8% | 14.2% |
| SUBSTRATE VISIBLE | 14.1% | 5.0% |
| NON-ACTIONABLE | 7.1% | 14.6% |
| UNDECIDABLE | 1.2% | 24.8% |
| WELL JUSTIFIED / COHERENT BUT SHALLOW | 0.6% | 0.9% |
| operational family | 0 | 3 docs |

The single `OPERATIONALLY SOUND` document is an SLO-violation alert runbook (`DuoWorkflowSvcServiceCheckpointErrorsErrorSLOViolation.md`) — thresholds, corrective procedures, and failure language in exactly the compact register the curated suite was authored in. That is the verdict's entire recall on 493 real operational documents.

**G2-EXT stays underpowered** (n=3 < 20). Raw numbers, deciding nothing: pooled retention 16/60 (26.7%); the SOUND positive dropped in 20/20 shuffles, the two INTENT positives retained 12/20 and 4/20 — the same tier-2 conversational softness run 1 flagged at n=3, now seen at, again, n=3.

## Why zero: the dissection

The ingredients the SOUND routes ask for are overwhelmingly *present* in the postmortems (n=170): instrumentation PRESENT 169, testable claims 169, ≥1 measurable threshold 110, ≥1 corrective action 93, structural failure modes 63, implicit-binding assessment `OPERATIONAL_INTENT` 142, justification ≥ 2 in 154. What blocks the verdicts is not missing structure — it is three register assumptions:

1. **The Tier-2 verdict is definitionally closed to instrumented text.** The parliament `OPERATIONAL_INTENT` pattern (cathedral-core.js:1935) requires `instrumentation !== 'PRESENT'` — it was built to catch *conversational* operational intent that lacks metrics. Real operational documents have metrics (169/170), so the `OPERATIONAL INTENT` verdict cannot fire on them at all. The tier that was supposed to be the sensitive one excludes the home register by definition.
2. *(fixed in v3.18.0 — section below)* **Every `OPERATIONALLY SOUND` route requires `effectiveExplicit >= 2`, which in practice means writing the phrase "failure mode" twice.** The explicit counter matches a fixed lexicon (`failure mode|failure point|point of failure|can fail|fails when|breaks when`, line 1371). The structural-inference rule — whose own comment says *"You didn't say 'failure mode', but you designed one"* — promotes the count only to `max(named, 1)` (line 1442), and every downstream gate demands ≥ 2. So structure alone can never satisfy the requirement; only vocabulary can. Real postmortems say "root cause" and "the outage began when"; 3 of 170 cleared the bar. The anti-gaming requirement, built to stop vocabulary from earning the verdict, ends by *requiring* vocabulary that real documents don't use — the exact inversion of the project's binding-over-counting principle.
3. **A postmortem enumerates one failure.** The ≥ 2-failure-modes shape is a property of forward-looking *plans* (enumerate what could break, bind each to a control). A single-incident retrospective, however rigorous, structurally isn't that. Part of the miss is therefore honest: the flagship verdict measures **plan soundness**, and half this corpus consists of documents that aren't plans. But the runbooks largely are, and they scored 0.9%.

Two instrument misreadings surfaced alongside, both long-document effects (the curated suite and run 1's turns are short):

- **Style classification breaks on documents.** 49 incident reviews were expelled as `OUTSIDE DESIGN SPACE`, read as NARRATIVE (32), AESTHETIC (13), or POETIC (4) — an ssh-outage review classified AESTHETIC at confidence 14.66 (the score is unnormalized by length; the design-space check at line 2077 compares it to thresholds of 0.3/0.5). Incident timelines read as "narrative"; whatever the aesthetic lexicon matches, it accumulates without bound over 5,000 words.
- **Gaming heuristics misfire on documents.** 21–24% of genuine operational documents were gaming-flagged, essentially all `LOW_CONTENT_UNBOUND` via "Excessive keyword repetition" — a real runbook repeats its service and metric names dozens of times. Run 1's "zero benign false positives" picture, measured on conversational turns, **does not extend to operational registers.**

## What this changes

The claim the README can make honestly is now sharp on both sides: `OPERATIONALLY SOUND` provably cannot be earned by vocabulary (run 1), and provably is not earned by real-world operational rigor either (this run) — it recognizes a narrow, compact, forward-looking planning register close to the authored suite. Specificity without sensitivity makes the verdict a **precision instrument for the register it was designed on** (evaluating short plan-shaped reasoning, e.g. agent plans before execution), not a general operational-document assessor. At the time of the run, anyone using it on real postmortems or runbooks got `VERIFIED CONSISTENT`, a wrong style expulsion, or a false gaming flag — never the flagship verdict. (The expulsions and false gaming flags were instrument bugs, fixed same day — next section. The register boundary stands.)

## The mechanical half, fixed same day (v3.17.0)

Flag 2 below called the two long-document misreads "the natural first move of any sensitivity work"; they were fixed the same day, leaving the three register blockers — the design decisions — untouched for the maintainer. Both fixes are the same one idea, the project's reference-length principle: **a count tuned on short turns becomes a density when the text is long.** Style-marker counts and the peak keyword-repetition count are now scaled to a reference length (150 words / 100 content words); texts at or under the reference — the register every threshold was tuned on — are byte-identical, which is why the entire curated floor passes unchanged. Pre-fix, *any* document containing three occurrences of "image" or "pattern" was expelled `OUTSIDE DESIGN SPACE` as AESTHETIC, whatever its length or subject.

Measured effect on re-run:

| Measure | Incident reviews | Runbooks |
|---|---|---|
| `OUTSIDE DESIGN SPACE` | 28.8% → **0.0%** | 14.2% → **0.6%** |
| Gaming flagged | 24.1% → **2.4%** | 21.1% → **5.0%** |
| Operational family (S1) | 0.0% → 2.4% — **still FAIL** | 0.9% → 1.2% — **still FAIL** |

The four postmortems now earning `OPERATIONALLY SOUND` had the structure all along — they were being expelled as AESTHETIC/NARRATIVE before the verdict logic ever saw them. S1 still fails by an order of magnitude, exactly as expected: the register blockers (§ dissection, 1–3) are untouched. G2-EXT rises to n=8 positives at 8.8% word-shuffle retention — still underpowered, no longer alarming. Run 1's specificity gates were re-run against the fixed core and **all hold**: G1 0.00% on every population, curated G2 0/60 retained; the only conversational shift is that long-form UltraChat turns are now evaluated instead of expelled (`OUTSIDE DESIGN SPACE` 11.5% → 2.3%, gaming flags 4.8% → 3.0%). Three regressions pin the fix: the long-genuine-document case, the short aesthetic text that must *still* be expelled, and the short repetition attack that must *still* be flagged (`run-core-regressions.js`, 20/20).

**Methodological note, in plain words:** iterating these fixes against the operational corpora makes them *development data* — the post-fix rates above are honest measurements but not fresh validation. Run 1's conversational gates remain untouched validation; the next operational corpus nobody has tuned on is the validation for this fix.

## Blocker 2, fixed (v3.18.0): bound structure satisfies a structural requirement

Of the three register blockers, blocker 2 was not a design decision — it was the project's own principle inverted. The anti-gaming requirement "enumerate at least two failure modes" could only be satisfied by a fixed lexicon (`failure mode`, `fails when`, …): vocabulary was *required*, counting was the mechanism. The core already had the structural equivalent and already used it in one place — `OPERATIONAL_EXCELLENCE` accepts **two bound failure triples** (a failure signal bound within its context to a syntactic threshold *and* a corrective action) in place of two named failure modes. v3.18.0 extends that same, already-established equivalence to the two remaining `OPERATIONALLY SOUND` routes. Nothing about the requirement weakened; what satisfies it broadened from words to bindings.

Why this cannot leak specificity, and the re-run proving it didn't: a bound triple requires the syntactic threshold arrangement ("if/when X exceeds Y") — word-shuffling destroys it by construction, and conversation almost never contains one, let alone two. Re-run against the widened core: **G1 stays 0.00%** on every population, curated G2 stays 0/60, ports audit unchanged. A new regression pins the route from both sides: a text that never says "failure mode" (named count 0 — the old condition is unsatisfiable) earns the verdict through four bound designs, and the seeded word-shuffle of the same words must lose it (`run-core-regressions.js`, 21/21).

Measured effect on the operational corpora: runbooks `OPERATIONALLY SOUND` 2 → 5 (family 2.2%), postmortems unchanged at 4, pooled shuffle-control positives 11 at 9.1% retention (still < 20, still underpowered). **S1 still fails — and now for honest reasons only.** What remains between real documents and the operational family is blockers 1 and 3: the Tier-2 parliament pattern's uninstrumented-by-definition boundary, and the fact that a retrospective narrating one incident is not a plan enumerating what could break. Those are questions about what the verdict should mean, and they stay open in this ledger rather than being engineered away.

## Honest limits and open flags

1. **The sensitivity gate FAILED and stays failed in the ledger.** Blocker 2 — the vocabulary-only enumeration requirement — was fixed in v3.18.0 (section above) because it contradicted the project's own binding-over-counting principle; the re-run proved specificity intact. The remaining blockers (1 and 3) are design decisions — what register should the flagship verdict speak to? — and stay open: any change to them must re-run run 1's gates *and* this run's, with the curated regressions as floor.
2. ~~**Long-document handling is now a measured weakness, not a suspicion.**~~ **Fixed same day (v3.17.0, section above)**: style strength and keyword repetition are reference-length densities now; expulsions and gaming flags on genuine operational documents dropped to 0–5%. The operational corpora are development data for this fix; fresh operational corpora are its validation.
3. **G2-EXT remains underpowered** (n=3 pre-fix, n=8 post-fix). Post-fix pooled retention 8.8% sits below run 1's 20% gate line, but n < 20 decides nothing.
4. **Human-written corpus.** This run measures recall of operational structure in real operational prose. Recall on AI-authored operational text is still unmeasured — same missing ingredient as everywhere else in the project.
5. **Corpus reproducibility is asymmetric**: runbooks are SHA-pinned (byte-stable); incident-review issue descriptions are editable upstream (date-bounded, not byte-pinned).
