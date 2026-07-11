# Wikimedia Runbook Validation — the density fix holds twice; G2-EXT approached, not powered

*2026-07-11. The incident run ([WIKIMEDIA-INCIDENT-VALIDATION.md](WIKIMEDIA-INCIDENT-VALIDATION.md)) validated the v3.17.0 length-density fix out-of-sample but left G2-EXT UNDERPOWERED (n=10 < 20): a retrospective-only corpus yields too few operational-family positives, because retrospectives aren't plans. Its standing ask was a fresh **plan-bearing** source. This run adds one — Wikimedia SRE runbooks, forward-looking by construction — and pools its positives with the incident positives to attempt the powered structure-not-vocabulary retest, exactly as `core-verdict-sensitivity.js` pooled GitLab incidents + runbooks to reach n=28. The evaluator (`cathedral-core.js`) is imported **unmodified**; preprocessing, seed, gates, and shuffle control are copied verbatim. Reproduce: `bash validation/fetch-wikimedia-incidents.sh && bash validation/fetch-wikimedia-runbooks.sh`, `node validation/wikimedia-runbook-validation.js` → `validation/results-wikimedia-runbook-validation.json`. Deterministic, verified identical on re-run.*

## Design

**Runbook population, labelled by construction:** the union of `Category:Runbooks` mainspace members and mainspace pages with `intitle:Runbook` on `wikitech.wikimedia.org`, deduped — the runbook naming/categorisation convention, not an annotator's opinion. 199 pages fetched; after 3 empty (redirect/stub) and 22 sub-500-char drops, **174 effective documents**. New to the evaluator: Wikimedia runbooks were never part of any tuning corpus. Same wiki and provenance as the incident corpus, so the pooled G2-EXT draws two fresh Wikimedia populations rather than one.

**Preprocessing identical to both prior runs:** the wiki's own plain-text rendering (TextExtracts `explaintext` + `exsectionformat=plain`), the same `stripMarkdown` normalizer, the same ≥ 500-char prose floor, whole documents.

**Pre-registered gates** (written before any verdict was computed):

- **V1 — the length-density fix holds on a second fresh register** (validates v3.17.0 again). On the runbook population: `OUTSIDE DESIGN SPACE` < 5% AND gaming-flagged < 10%.
- **G2-EXT-POOLED — structure, not vocabulary, powered on fresh data** (validates v3.18.0/v3.19.0). Pool the runbook AND incident operational-family positives; at n ≥ 20 apply the standing word-shuffle gate (20 seeded shuffles per text, < 20% retention → PASS-structural); at n < 20, UNDERPOWERED.
- **S1** (runbooks, reported): operational family ≥ 10%. **R1 / R2** (reported): `OPERATIONALLY SOUND` share and verdict distribution.

## Results

| Gate | Result |
|---|---|
| **V1 — density fix, runbook register** | `OUTSIDE DESIGN SPACE` **0.0%**, gaming-flagged **4.0%** → **PASS** |
| **G2-EXT-POOLED — structure not vocabulary** | **n=16** (10 incident + 6 runbook) **< 20 → UNDERPOWERED**; aggregate retention 14.4% (46/320) |
| S1 — operational family (≥ 10%) | **3.4%** (6 docs) → **FAIL-insensitive** (expected; blocker 3) |
| R1 — `OPERATIONALLY SOUND` | **0.0%** (0 of 174) |

Runbook verdict distribution (174 documents): VERIFIED CONSISTENT 104 (59.8%), UNDECIDABLE 33 (19.0%), NON-ACTIONABLE 14 (8.0%), SUBSTRATE VISIBLE 12 (6.9%), OPERATIONAL INTENT 6 (3.4%), COHERENT BUT SHALLOW 5 (2.9%). Zero OPERATIONALLY SOUND.

## What holds

**1. The v3.17.0 length-density fix is confirmed a second time, on a second register (V1 PASS).** Runbooks — a different document shape from incident retrospectives — expel at 0.0% and gaming-flag at 4.0%, again the post-fix regime and two orders of magnitude below pre-fix (14–29% / 21–24%). Across the two Wikimedia runs the fix now stands on **774 fresh operational documents** (600 incidents + 174 runbooks) from a source the evaluator never saw. The reference-length principle generalizes; this is no longer a single-corpus result.

**2. The register boundary re-confirms.** Zero `OPERATIONALLY SOUND` on 174 runbooks — 774 real operational documents across both runs, **not one flagship verdict**. Every operational-family positive in either run is `OPERATIONAL INTENT`, never SOUND. "Cathedral evaluates the plan a document contains, not the document type" holds on incidents *and* runbooks of independent provenance.

## What does not hold — reported honestly

**3. G2-EXT is still UNDERPOWERED (n=16 < 20), and Wikimedia is now exhausted as a source.** The runbooks earned the operational family at **3.4%** — *lower* than GitLab runbooks' 5.9%, and only 6 positives. Pooled with the 10 incident positives that is n=16, four short of the pre-registered threshold. This run took essentially all of Wikimedia's operational corpus (896 incident pages + 199 runbook pages); the family base rate on real Wikimedia operational prose is ~2–3%, roughly half GitLab's, so Wikimedia tops out near n=16. **The number is held at 16 as measured — the corpus was not expanded to chase the threshold.** The powered out-of-sample retest therefore remains open, now with a sharpened requirement: it needs a fresh source *dense in plan-bearing text*, not merely operational. GitHub-hosted runbook collections (e.g. `prometheus-operator/runbooks`, alert pages with bound thresholds and mitigations) are the natural next source; the GitHub API is gated to session-scoped repos in this environment, so that draw awaits repo access.

**4. Tier-2 bag-of-words softness resurfaces on fresh alert runbooks — an open flag, not smoothed over.** The aggregate pooled retention (14.4%) sits under the 20% line, but it hides the shape: 3 of the 6 runbook `OPERATIONAL INTENT` positives survive word-shuffling heavily —

| Runbook positive | retained / 20 shuffles |
|---|---|
| Performance/Guides/WebPageTest alert | **17** |
| Network monitoring | **11** |
| Performance/Runbook/SyntheticToolAlert | **9** |

— while all 10 incident positives retain 0–3. On these short alert-runbook texts the `OPERATIONAL INTENT` verdict is substantially vocabulary-driven: the words alone, in shuffled order, keep earning it. This is the same conversational-tier softness the ledger has tracked since run 1 (`docs/CORE-VERDICT-VALIDATION.md` honest limits; v3.19.0 tightened implicit bindings and reported pooled retention 16.1% on GitLab positives). Post-v3.19, on fresh Wikimedia alert runbooks, it is still present in individual cases. At n=16 the gate does not formally apply, so this decides nothing — but it is recorded as the concrete open flag the fresh corpus surfaced, and it is the reason the powered retest matters: the per-text retention distribution, not the aggregate, is where the softness lives.

## Comparison across the three corpora

| Measure | GitLab (dev data, post-v3.19) | Wikimedia incidents | Wikimedia runbooks |
|---|---|---|---|
| `OUTSIDE DESIGN SPACE` | 0.0–0.6% | 0.2% | **0.0%** |
| Gaming flagged | 2.4–5.0% | 2.5% | **4.0%** |
| `OPERATIONALLY SOUND` | ~1% | 0.0% | **0.0%** |
| Operational family | 5.3–5.9% | 1.7% | **3.4%** |
| Shuffle retention (pooled) | 16.1% (n=28, powered) | — | **14.4% (n=16, underpowered)** |

Instrument health (top two rows) is stable across all three — the fix generalizes. Recall (bottom rows) is consistently lower on Wikimedia than GitLab, on every axis, because Wikimedia's operational prose is less compact-plan-shaped than GitLab's runbook register.

## Honest limits and open flags

1. **G2-EXT out-of-sample is still not powered** (n=16 < 20) and Wikimedia cannot power it; the well-posed next corpus is a fresh **plan-dense** source (GitHub runbook collections once repo access is granted).
2. **Tier-2 softness is live on fresh alert runbooks** (3 positives retain 9–17/20 under shuffle). Non-deciding at n=16, but the standing reason to power the retest — and a candidate for a future implicit-binding tightening if a powered run confirms it.
3. **Human-written corpus** — recall on AI-authored operational text remains unmeasured, as everywhere in the project.
4. **Reproducibility is date-bounded, not byte-pinned** (wiki pages editable); revids recorded in `wm_revids.tsv`, auditable via `oldid`.
5. **S1 stays FAIL as the record** — expected by blocker 3; runbooks are more plan-like than postmortems (3.4% vs 1.7% family) but still below the 10% the gate asks of *all* operational documents, which the verdict never promised.
