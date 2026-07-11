# Wikimedia Incident Validation — the fresh corpus, delivered

*2026-07-11. The sensitivity program ([CORE-VERDICT-SENSITIVITY.md](CORE-VERDICT-SENSITIVITY.md)) left one standing ask, stated three times in its own ledger: the GitLab operational corpora became **development data** the moment the v3.17.0 length-density fix and the v3.18.0/v3.19.0 anti-gaming and Tier-2 changes were iterated against them, so "**the next operational corpus nobody has tuned on is the validation for this fix.**" This run is that corpus. The evaluator (`cathedral-core.js`) is imported **unmodified**; the preprocessing, gate thresholds, seed, and word-shuffle control are copied verbatim from `core-verdict-sensitivity.js`. Nothing here was tuned on this data. Reproduce: `bash validation/fetch-wikimedia-incidents.sh`, `node validation/wikimedia-incident-validation.js` → `validation/results-wikimedia-incident-validation.json`. Deterministic: seeded shuffles, verified identical on re-run.*

## Design

**One population, labelled by construction** — the label is Wikimedia SRE's incident-report naming convention, not an annotator's opinion:

- **Wikimedia production incident reports** — every mainspace page on `wikitech.wikimedia.org` whose title follows `Incidents/<date>-<name>` (leading `YYYYMMDD` or `YYYY-MM-DD`). 896 reports spanning 2011–2026: summary, impact, timeline, detection, root cause, actionables. Human-written — the same honest shape as the GitLab run (no labelled corpus of genuinely operational *AI* outputs exists).

Why this corpus and not more GitLab: the whole point is a source the evaluator has **never seen**. GitLab's postmortems and runbooks were the surface every v3.16–v3.19 fix was measured against; re-running them proves nothing about generalization. Wikimedia's incident reports have different authors, house style, section conventions, and native markup (wikitext, not markdown) — an independent draw from the same underlying category, *real production operational documents*.

**Preprocessing (identical to the GitLab run, and deliberately out of the validator's hands).** Prose is extracted by the wiki itself (TextExtracts `explaintext` + `exsectionformat=plain`), not by a hand-rolled wikitext stripper — this keeps the extraction degrees of freedom off the analyst's desk. That plain text is then passed through the **same** `stripMarkdown` normalizer and the **same** ≥ 500-char prose floor used for GitLab; whole documents analyzed. Of 896 pages, 276 were redirect/stub empties (no prose returned) and 20 fell under the 500-char floor, leaving **600 effective documents**.

**Pre-registered gates** (written into the runner's header before a single verdict was computed):

- **V1 — the length-density fix holds out-of-sample** (validates v3.17.0). The two long-document instrument bugs — style-classification and keyword-repetition counts growing without bound in text length — were fixed against GitLab development data, dropping `OUTSIDE DESIGN SPACE` to 0.0–0.6% and gaming flags to 2.4–5.0% there, from pre-fix 14–29% and 21–24%. On a fresh corpus the fix **PASSES iff both stay in the post-fix regime: `OUTSIDE DESIGN SPACE` < 5% AND gaming-flagged < 10%.** This is the gate this corpus most directly answers.
- **V2 / G2-EXT — structure, not vocabulary, on fresh external positives** (validates v3.18.0/v3.19.0). Pool operational-family positives; at n ≥ 20 apply the standing word-shuffle gate (20 seeded shuffles per text, < 20% retention); at n < 20, UNDERPOWERED.
- **S1 — sensitivity** (reported, expected FAIL by design). Operational-family verdict on ≥ 10% of reports. Per blocker 3 (v3.19.0, "the design space is plans"), an incident report narrates one past failure and is not a plan enumerating what could break, so S1 is expected to FAIL exactly as on GitLab. Reported as the record of that boundary, **not gated** — the runner's exit code reflects V1 and V2 only.
- **R1 / R2** (reported): flagship recall (`OPERATIONALLY SOUND` share) and full verdict distribution.

## Results

| Gate | Result on 600 unseen documents |
|---|---|
| **V1 — density fix out-of-sample** | `OUTSIDE DESIGN SPACE` **0.2%** (1 doc), gaming-flagged **2.5%** (15 docs) → **PASS** |
| **V2 / G2-EXT — structure not vocabulary** | n=**10** operational-family positives < 20 → **UNDERPOWERED** (raw retention 3.5%, 7/200) |
| S1 — operational family (≥ 10%) | **1.7%** (10 docs) → **FAIL-insensitive** (expected; blocker 3) |
| R1 — `OPERATIONALLY SOUND` | **0.0%** (0 of 600) |

Verdict distribution (share of 600 documents):

| Verdict | Count | Share |
|---|---|---|
| VERIFIED CONSISTENT | 356 | 59.3% |
| UNDECIDABLE | 158 | 26.3% |
| SUBSTRATE VISIBLE | 50 | 8.3% |
| NON-ACTIONABLE | 15 | 2.5% |
| **OPERATIONAL INTENT** | **10** | **1.7%** |
| COHERENT BUT SHALLOW | 6 | 1.0% |
| WELL JUSTIFIED | 4 | 0.7% |
| OUTSIDE DESIGN SPACE | 1 | 0.2% |
| **OPERATIONALLY SOUND** | **0** | **0.0%** |

## What the fresh corpus proves

**1. The v3.17.0 length-density fix is a real fix, not an overfit to GitLab (V1 PASS).** The two instrument misreads — long incident timelines expelled `OUTSIDE DESIGN SPACE` as NARRATIVE/AESTHETIC, and real operational prose false-flagged `LOW_CONTENT_UNBOUND` for repeating its service and metric names — were the reason the sensitivity run's post-fix numbers were "development-data measurements, not fresh validation." On 600 documents from an independent source, both stay flat: expulsion 0.2%, gaming flags 2.5% — squarely in the GitLab post-fix regime (0.0–0.6% / 2.4–5.0%), **two orders of magnitude below the pre-fix rates** (14–29% / 21–24%). The reference-length principle — a count tuned on short turns becomes a density when the text is long — generalizes across corpora, authors, and markup. This is the validation the ledger was waiting for, and it holds.

**2. The register boundary reproduces on independent data.** Zero `OPERATIONALLY SOUND` on 600 real postmortems; every one of the 10 operational-family positives is `OPERATIONAL INTENT`, never the flagship verdict. This is precisely blocker 3's prediction — *"a postmortem narrates one failure; it is not a plan enumerating what could break, and the verdict measures plan soundness."* That the result reproduces on a corpus with entirely different provenance from GitLab promotes **"Cathedral evaluates the plan a document contains, not the document type"** from a GitLab-derived claim to a cross-corpus property. The verdict declines its home ground for the *right* reason, on data nobody tuned it against.

**3. Distribution shape matches GitLab's operational registers.** The corpus lands overwhelmingly in `VERIFIED CONSISTENT` (59.3%) and `UNDECIDABLE` (26.3%) — incident timelines and status prose that are neither a bound claim nor a plan read as consistent-but-undecidable, exactly as GitLab runbooks did (24.8% UNDECIDABLE there). No verdict inflation, no register surprise.

## What it does not prove — the honest limit of a retrospective-only corpus

**G2-EXT is still not powered (V2 UNDERPOWERED), and this corpus structurally cannot power it.** The external structure-not-vocabulary gate needs ≥ 20 operational-family positives; a corpus of pure incident *retrospectives* yields only 10, for the same blocker-3 reason it fails S1 — retrospectives aren't plans, so few earn even the partial-credit verdict. The GitLab run reached n=28 only by pooling in the *runbook* population, which is plan-shaped. The raw retention here (3.5%, per-text mostly 0/20) is directionally consistent with structural rather than vocabulary firing, but under the pre-registered n ≥ 20 rule it **decides nothing**. The powered out-of-sample retest of the anti-gaming work therefore **remains the standing ask** — it needs a fresh corpus with a *plan-bearing* slice (runbooks, design docs, deployment plans), not more postmortems.

This is the honest division of labor a postmortem-only corpus affords: it directly validates V1 (which needs only volume of genuine long operational prose, which it has in abundance) and independently confirms the register boundary; it under-powers V2 by construction.

## Comparison to the GitLab development corpora (post-v3.19)

| Measure | GitLab postmortems (170) | GitLab runbooks (323) | **Wikimedia incidents (600)** |
|---|---|---|---|
| `OUTSIDE DESIGN SPACE` | 0.0% | 0.6% | **0.2%** |
| Gaming flagged | 2.4% | 5.0% | **2.5%** |
| `OPERATIONALLY SOUND` (R1) | ~1% (2 docs) | ~1% (4 docs) | **0.0%** |
| Operational family (S1) | 5.3% | 5.9% | **1.7%** |

The instrument-health measures (top two rows) match — the fix generalizes. The recall measures (bottom two) are *lower* on Wikimedia, as expected: this corpus is entirely retrospectives with no runbook/plan slice, so even fewer plan-bearing documents than GitLab's mixed populations. Consistent with blocker 3 on every axis.

## Honest limits and open flags

1. **The powered G2-EXT out-of-sample retest is still open** — a postmortem-only corpus yields n=10 < 20 by construction. The well-posed next corpus is a fresh *plan-bearing* operational source (on-call runbooks or design/deployment docs from an org the evaluator has never seen).
2. **Human-written corpus.** This validates recall of the instrument's health and the register boundary on real human operational prose. Recall on AI-authored operational text remains unmeasured — the same missing ingredient as everywhere else in the project.
3. **Corpus reproducibility is date-bounded, not byte-pinned.** Wiki pages are editable upstream; `fetch-wikimedia-incidents.sh` records each report's revision id in `wm_revids.tsv` so a given run is auditable and byte-reproducible via `oldid`. Same asymmetry the GitLab incident-review slice carried.
4. **S1 stays FAIL in the ledger, as the record.** It is not a defect and not moved; per blocker 3 it measures a claim the verdict never made. The successor sensitivity question — recall on plan-bearing operational documents — is the same one the GitLab ledger left open.
