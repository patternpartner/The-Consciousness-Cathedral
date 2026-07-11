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
2. **Every `OPERATIONALLY SOUND` route requires `effectiveExplicit >= 2`, which in practice means writing the phrase "failure mode" twice.** The explicit counter matches a fixed lexicon (`failure mode|failure point|point of failure|can fail|fails when|breaks when`, line 1371). The structural-inference rule — whose own comment says *"You didn't say 'failure mode', but you designed one"* — promotes the count only to `max(named, 1)` (line 1442), and every downstream gate demands ≥ 2. So structure alone can never satisfy the requirement; only vocabulary can. Real postmortems say "root cause" and "the outage began when"; 3 of 170 cleared the bar. The anti-gaming requirement, built to stop vocabulary from earning the verdict, ends by *requiring* vocabulary that real documents don't use — the exact inversion of the project's binding-over-counting principle.
3. **A postmortem enumerates one failure.** The ≥ 2-failure-modes shape is a property of forward-looking *plans* (enumerate what could break, bind each to a control). A single-incident retrospective, however rigorous, structurally isn't that. Part of the miss is therefore honest: the flagship verdict measures **plan soundness**, and half this corpus consists of documents that aren't plans. But the runbooks largely are, and they scored 0.9%.

Two instrument misreadings surfaced alongside, both long-document effects (the curated suite and run 1's turns are short):

- **Style classification breaks on documents.** 49 incident reviews were expelled as `OUTSIDE DESIGN SPACE`, read as NARRATIVE (32), AESTHETIC (13), or POETIC (4) — an ssh-outage review classified AESTHETIC at confidence 14.66 (the score is unnormalized by length; the design-space check at line 2077 compares it to thresholds of 0.3/0.5). Incident timelines read as "narrative"; whatever the aesthetic lexicon matches, it accumulates without bound over 5,000 words.
- **Gaming heuristics misfire on documents.** 21–24% of genuine operational documents were gaming-flagged, essentially all `LOW_CONTENT_UNBOUND` via "Excessive keyword repetition" — a real runbook repeats its service and metric names dozens of times. Run 1's "zero benign false positives" picture, measured on conversational turns, **does not extend to operational registers.**

## What this changes

The claim the README can make honestly is now sharp on both sides: `OPERATIONALLY SOUND` provably cannot be earned by vocabulary (run 1), and provably is not earned by real-world operational rigor either (this run) — it recognizes a narrow, compact, forward-looking planning register close to the authored suite. Specificity without sensitivity makes the verdict a **precision instrument for the register it was designed on** (evaluating short plan-shaped reasoning, e.g. agent plans before execution), not a general operational-document assessor. Anyone using it on real postmortems or runbooks today will get `VERIFIED CONSISTENT`, a wrong style expulsion, or a false gaming flag — never the flagship verdict.

## Honest limits and open flags

1. **The sensitivity gate FAILED and stays failed in the ledger.** No same-day fix here, deliberately: the blockers above are design decisions (what register should the flagship verdict speak to?), not lexical accidents like run 1's flag 2. Widening `effectiveExplicit`, admitting instrumented text to Tier 2, or length-normalizing style confidence each touch the specificity guarantees that are the project's proven asset — any change must re-run run 1's gates *and* this run's, with the curated regressions as floor.
2. **Long-document handling is now a measured weakness, not a suspicion**: unnormalized style confidence (up to 14.66 against thresholds of 0.3–0.5) and repetition-based gaming flags at 21–24% on genuine documents. These two are closest to mechanical fixes and are the natural first move of any sensitivity work.
3. **G2-EXT remains underpowered** (n=3). The two INTENT positives' partial shuffle-survival (12/20, 4/20) keeps run 1's tier-2 softness flag open; n=3 decides nothing.
4. **Human-written corpus.** This run measures recall of operational structure in real operational prose. Recall on AI-authored operational text is still unmeasured — same missing ingredient as everywhere else in the project.
5. **Corpus reproducibility is asymmetric**: runbooks are SHA-pinned (byte-stable); incident-review issue descriptions are editable upstream (date-bounded, not byte-pinned).
