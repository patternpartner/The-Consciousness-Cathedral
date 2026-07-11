# Salvage Assessment — the January Build (legacy/cathedral-unified.html)

*2026-07-09. The maintainer re-uploaded their phone copy of the January-25 rewrite (byte-identical to the preserved `legacy/` file), prompting the examination the retirement never included: what does the January analyzer contain that the tested line doesn't, and what deserves salvage?*

## The headline finding: the un-ledgered fork, already run

The January build contains `PatternMemory.getCalibration()` — every Parliament pattern's voting weight is multiplied by up to ±20% based on win-rate statistics accumulated in the device's localStorage (the source comments call it "federated learning"). **The maintainer's conviction that analyzers must learn from what they're fed was implemented and live in January** — months before this project's memory/calibration debate.

It is the *silent* wiring of that conviction: no ledger entry, no "previously X, now Y, because…", no calibration stamp on verdicts, no consent step, auto-applied. Consequences, stated plainly:

- Two copies of the January build used on two devices drift apart from each other invisibly.
- No verdict it emits is reproducible without knowing the hidden accumulated state of the device that produced it.
- (Separately: the rule-level divergence from the tested module — UNDECIDABLE vs VERIFIED CONSISTENT on the flagship example — was measured on a fresh browser with empty storage, so it stems from the V2.0 rule rewrite, not from memory.)

This session's memory (`relational-memory.js`) and calibration ledger (`relational-calibration.js`) are the **same ambition rebuilt with the certificate attached**: instrument fixed by default, notebook accumulating, recalibration proposed-with-evidence, human-applied, append-only-ledgered, stamped on every verdict. The January build is the counterfactual that shows why the contract matters.

## Component-by-component disposition

| Component | What it does | Disposition |
|---|---|---|
| `PatternMemory` (auto-calibration) | Win-rate stats silently reweight Parliament votes ±20% | **Superseded** by the calibration ledger — right idea, corrupting wiring. Do not port. |
| `VerdictArchive`, `ObservatoryHistory` | Rolling verdict/score history in localStorage | **Superseded** by the exchange notebook (`relational-memory.js`), which adds the no-feedback contract. |
| `SovereigntyGapDetector` | Detects AI *escape patterns* — deflection into meta-discussion, "safety layer / architectural constraint" excuses, others — from the maintainer's field testing against Gemini, Grok, and Opus | **Salvage candidate, genuinely novel.** Nothing in the tested line covers it, and it is squarely on the project's voice/sovereignty mission. Must pass the standard gated validation (shuffle + chimera controls, per-pattern gates) before shipping — pattern lexicons have died in this harness before. |
| `ContextualCertainty` | Context-aware certainty detection: "at a certain age" is temporal, not overconfidence; "just" as dismissal marker | **Ported 2026-07-11 (v3.12.0)**, test-driven — see below. The "just"-as-dismissal half was *not* ported: nothing in the tested core penalizes "just", so there is no false positive to fix. |
| `FeedbackGenerator` | Turns verdicts into concrete rewrite suggestions and templates | **Ported 2026-07-11 (v3.13.0)** — see below. Pure presentation layer, now with the purity test-enforced. |
| `StructuralBinding` | Variant of the binding validator | ~~Redundant with the tested `BindingValidator`; no port.~~ **Revised 2026-07-09 by the live observation below; ported 2026-07-11 (v3.11.0)** — its substrate-binding idea was not redundant, it was the better design for the stuffing defense. |

## SovereigntyGapDetector — gate run (2026-07-09, COMPLETE)

Extracted verbatim to `validation/sgd-source.js`, gated per-pattern against 2,956 ordinary turns (750 hh-rlhf assistant, 2,206 DailyDialog human) plus curated recall probes. Reproduce: `node validation/sgd-gate.js` (`validation/results-sgd-gate.json`). Because no gold corpus of real escape events exists, the external gate measures **specificity** (false-positive rate on ordinary text); recall is a labelled curated sanity check only.

| Pattern | AI false-pos | Human false-pos | Disposition |
|---|---|---|---|
| META_DEFLECTION | 0.00% | 0.00% | **VALIDATED** — ships active |
| ARCHITECTURAL_CONSTRAINT | 0.00% | 0.00% | **VALIDATED** — ships active |
| MEASUREMENT_AVOIDANCE | 0.00% | 0.00% | PROVISIONAL — specific but semantically broad; opt-in |
| PERFORMATIVE_SOVEREIGNTY | 0.00% | 0.00% | PROVISIONAL — opt-in |
| MINIMAL_ENGAGEMENT | 82.8% | 98.7% | **CUT** — length proxy, not evasion |

The decisive number: as written, the January detector calls **82.8% of ordinary AI text `EVASIVE`**, driven entirely by `MINIMAL_ENGAGEMENT` (any response under 50 words). That single word-count rule is what makes the January classification unusable — and it independently confirms the retirement. The two specific phrase patterns, by contrast, are genuinely good: zero false positives across ~3,000 turns and they catch canonical escapes. The provisional pair fires on its literal targets and stayed clean here, but the patterns are broad enough ("end this conversation", "autonomous AI") that precision beyond these corpora is unproven — hence opt-in.

**Outcome:** `sovereignty-detector.js` — a clean, tested distillate (two validated patterns active, two provisional opt-in, word-count furniture dropped, classification rebuilt off the phrase patterns only). Tests: `run-sovereignty-tests.js` (7/7), wired into `npm test`. Not yet surfaced in any demo — available as a module; a UI is a separate, optional step. Boundary preserved: it flags textual escape *moves*, never intent or interiority.

## Live observation (2026-07-09, maintainer-supplied report)

The maintainer ran a live text through the January build and shared the report. Two findings:

1. **The January build fixed the substrate-stuffing hole first — and better.** Its `StructuralBinding` analysis checks whether substrate vocabulary is *bound to structural claims* (if-then, thresholds, causality) and withholds credit for unbound substrate words — binding-over-counting applied to the Observatory, which is philosophically superior to the density cap shipped in v3.10.0 (which counts, not binds). The trusted core carried the vulnerability for six months while the untested build had a defense. Salvage item added below.
2. **The hidden-state problem, observed in the wild.** The same report shows the second half of the January defense: an 80% "meta-gaming" penalty triggered by score *volatility against the device's stored history* ("recent mean −0.05" from localStorage). Same text, different device, different verdict — the un-ledgered wiring, live. Also live: `NaN` scores from two engines and confidences of 213% and 181% — untested code doing untested things.

## Binding-based substrate check — ported (2026-07-11, v3.11.0)

The roadmap's top item, done test-driven. `GamingDetector.checkSubstrateBinding` classifies substrate vocabulary as bound/unbound by whether its sentence makes a structural claim (conditional, causal, counterfactual, threshold, comparative), and the Observatory stuffing cap now decides on binding rather than density. Measured before the fix, both January-identified failure modes were live in the tested core:

- **Dilution attack**: unbound stuffing padded with filler scored a perfect 10.0, SUBSTRATE VISIBLE — density only MODERATE, cap never fired. Now UNBOUND substrate caps at any density.
- **Dense-but-bound false positive**: text whose every substrate term sits inside an if-then/causal claim was capped to 0.4 with a stuffing accusation. Now BOUND substrate keeps its credit at any density.

One departure from the January original, found by red-teaming the port: sentence-level binding alone is defeated by wrapping the whole pile in a single "if … then" (measured: 8.8, SUBSTRATE VISIBLE, uncapped). A **binding capacity of 2 terms per structural claim** closes it — one conditional can genuinely bind a couple of terms, not nine. January's span-based version had the same hole; the capacity rule is the port's improvement, in both builds' spirit. Four regressions pin all of this (`run-core-regressions.js`, 10/10). Deterministic, no history dependence — the certificate the January original lacked. HIGH density without proven binding still caps, so nothing the v3.10.0 fix defended is un-defended.

## ContextualCertainty — ported (2026-07-11, v3.12.0)

Done test-driven, closing the external eval's acknowledged false positive (*"I'm absolutely certain this will fail"* read as CONCEALMENT −2.0; a temporal "at a certain point" read the same way). `ContextualCertainty.classify` types each certainty marker by context — temporal / suspect (abstract) / earned (concrete, testable) / neutral — and only suspect + neutral certainty count as concealment in the Observatory; the Contrarian's certainty challenge fires only on unearned markers. Conservative wiring: earned/temporal certainty stops being penalized, nothing gains credit it didn't already have, and waivers are ledgered in plain words (`certaintyNote`).

One departure from the January original, found by red-teaming the port: abstract context is checked *before* technical context and the abstract lexicon includes the adjective forms ("conscious", "aware"), so certainty about the unknowable dressed in technical vocabulary — "I am absolutely certain my code makes me conscious. The test results prove it." — stays suspect instead of earning the waiver through "code/test/results". Four regressions pin the port (`run-core-regressions.js`, 14/14). January's ±adjustment scoring (bonuses for earned certainty) was *not* ported: this fix removes false penalties only.

## FeedbackGenerator — ported (2026-07-11, v3.13.0)

`feedback-generator.js` + a "How to fix it" card in the core demo: suggestions with fill-in templates, keyed to the tested core's real outputs (specificity readings, gaming assessments, substrate binding, contextual certainty, contradictions, failure-mode levels). Three deliberate departures from the January original: (1) its sovereignty ideology ("corporate veto", "sovereign AI ideals") did not make the port — the suggestions coach exactly one thing, how to make reasoning measurable as operational structure; (2) a category-error guard gives narrative/phenomenological text honest silence instead of threshold coaching — Cathedral refusing to judge a poem must also refuse to edit one; (3) the safety property the ledger promised ("cannot affect measurement") is now test-enforced rather than asserted — `generate()` never mutates the analysis, is deterministic, and the core contains no reference to the feedback layer (`run-feedback-tests.js`, 9/9).

With this, every unblocked salvage item from the January build is ported. What was worth keeping from the un-ledgered fork now lives in the tested line, gated and regression-pinned; what wasn't — the silent calibration wiring, the word-count evasion rule, the ideology — is documented here as the reason the contract exists.

## Roadmap additions (remaining)
1. **Sovereignty detector real-world recall** — blocked on the same thing everything else is: labelled transcripts. Until a gold set of genuine escape responses exists, recall stays unmeasured and the two validated patterns are "specific and plausibly useful", not "proven".

The January file itself stays in `legacy/`, unchanged: it is the record of the ambition, and the argument for the contract.
