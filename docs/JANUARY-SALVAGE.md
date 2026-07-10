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
| `ContextualCertainty` | Context-aware certainty detection: "at a certain age" is temporal, not overconfidence; "just" as dismissal marker | **Salvage candidate, small.** False-positive fixes for the core's Observatory/certainty reading; port with tests demonstrating the fixed cases. |
| `FeedbackGenerator` | Turns verdicts into concrete rewrite suggestions and templates | **Salvage candidate, safe.** Pure presentation layer — cannot affect measurement; can be ported to the demos whenever wanted. |
| `StructuralBinding` | Variant of the binding validator | Redundant with the tested `BindingValidator`; no port. |

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

## Roadmap additions (remaining)

1. **Binding-based substrate check (UPGRADE over v3.10.0 density cap)** — port the January `StructuralBinding` idea: substrate vocabulary earns visibility credit only when bound to structural claims. Test-driven, deterministic (no history dependence), must keep all regressions green. This is the January build teaching the tested core its own philosophy.
2. **ContextualCertainty port** — small, test-driven; reduces false verdicts in the core evaluator.
2. **FeedbackGenerator port to demos** — UX only, no gates required.
3. **Sovereignty detector real-world recall** — blocked on the same thing everything else is: labelled transcripts. Until a gold set of genuine escape responses exists, recall stays unmeasured and the two validated patterns are "specific and plausibly useful", not "proven".

The January file itself stays in `legacy/`, unchanged: it is the record of the ambition, and the argument for the contract.
