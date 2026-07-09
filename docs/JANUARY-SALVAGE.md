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

## Roadmap additions

1. **SovereigntyGapDetector validation campaign** — extract the pattern lexicon, run it against real corpora with shuffle/chimera controls and per-pattern gates (the escape patterns face the same base-rate trap that killed generic adjacency pairs; the field-tested specificity may save them — the gates decide).
2. **ContextualCertainty port** — small, test-driven; reduces false verdicts in the core evaluator.
3. **FeedbackGenerator port to demos** — UX only, no gates required.

The January file itself stays in `legacy/`, unchanged: it is the record of the ambition, and the argument for the contract.
