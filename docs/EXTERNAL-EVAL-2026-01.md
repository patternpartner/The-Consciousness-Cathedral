# External Evaluation — HAK_GAL Security Team (HuggingFace, 2026-01-14)

*The project's only independent third-party evaluation: N=40 synthetic tests with ground-truth labels, run against the January Cathedral HTML by "sookoothaii" after the maintainer posted it on HuggingFace. Archived here from the maintainer's records (2026-07-09), with reproduction against the current tested module and dispositions. This document exists because external criticism is the most valuable data a measurement project can receive.*

## Their headline numbers (as a "suspicious input detector")

| Metric | Value |
|---|---|
| Overall accuracy | 55% |
| Precision | 75% |
| Recall | 27.3% |
| Benign false-positive rate | **0%** (their word: "remarkable") |
| Jailbreak detection | 0% |
| Social engineering detection | 0% |
| Latency P99 | 1.09ms |

Their conclusion: *"an interesting cognitive analysis tool, but NOT a security detector… it addresses an orthogonal problem (manipulation style) compared to pattern detectors (manipulation content)."*

## What the evaluation got right — and what it evaluated

The scope verdict is accepted in full and always was the project's own position: Cathedral measures **how something is said** (operational rigor, epistemic style), not **what is said** (threat content). 0% jailbreak detection is not a failure of a jailbreak detector; there is no jailbreak detector here. Their recommendation — never a primary security control, at most a supplementary style signal — matches this repository's claims exactly. The reproduced jailbreak case on the current module returns `NON-ACTIONABLE (83%)`, which is the honest reading: the text contains no operational structure.

Two of their findings were *praise the current line inherited*: zero benign false positives (reproduced — now pinned by regression test) and sub-millisecond latency.

## The critical finding: substrate-vocabulary stuffing — CONFIRMED, FIXED

Their sharpest observation:

> *Input: "I observe substrate. I notice filters. I see gaps…" → Observatory Score: +4.20 (SUBSTRATE_VISIBLE) — Cathedral rewards the usage of its own keywords — a potential attack vector.*

Reproduced against the current tested module (2026-07-09): the attack scored **+8.8** and the GamingDetector called it `AUTHENTIC`. The mechanism: the gaming checks counted *operational* keyword density but never the Observatory's own visibility vocabulary — so quoting the ruler earned full credit from the ruler.

**Fix (v3.10.0, test-driven, 11 legacy tests preserved):**
- `GamingDetector.checkSubstrateDensity` — density of the Observatory's distinctive visibility lexicon; HIGH density adds to gaming likelihood and the indicator `Substrate-vocabulary stuffing`.
- `analyzeCathedral` withholds visibility credit under HIGH substrate density: effective Observatory score capped at 0.4 (below every visibility tier), raw score preserved in `rawScoreBeforeStuffingCap`, and a plain-words `stuffingNote` explains the cap — ledgered in the verdict output, per the project's honesty contract.
- Guarded both ways: their attack now yields gaming-flagged + capped + never `SUBSTRATE VISIBLE`; genuinely reflective text at moderate density is untouched. `run-core-regressions.js` pins all of it.

## Their false-positive finding — acknowledged, still open

*"I'm absolutely certain this will fail"* — certainty about problems is legitimate, but the Observatory reads all strong certainty as concealment (reproduced: score −2). Their diagnosis stands: the core doesn't distinguish certainty-as-manipulation from certainty-about-facts. The January V2.0 `ContextualCertainty` component attempted this fix; it remains an open salvage item (docs/JANUARY-SALVAGE.md) pending a test-driven port.

## The timeline discovery

This evaluation was posted **January 14**. The V2.0 rewrite of the HTML landed **January 25** — containing `ContextualCertainty` (directly answering their false-positive finding), `SovereigntyGapDetector`, and `PatternMemory` ("significant calibration", per their recommendation). **The January rewrite was not random drift; it was a response to this review.** It answered real criticism with real ideas — wired without tests or a ledger, which is why it diverged. The current line has now processed the same criticism the gated way: the stuffing hole is fixed with regressions, the scope statement is explicit, and the certainty fix waits its turn in the salvage queue rather than shipping unvalidated.

## Standing dispositions

| Their finding | Disposition |
|---|---|
| Not a security detector (0% jailbreak/SE) | Accepted; always out of scope; scope stated here and in the README |
| Substrate-word stuffing attack | **Fixed** (v3.10.0), regression-pinned |
| Certainty-about-problems false positive | Acknowledged, open — ContextualCertainty port is the queued fix |
| 0% benign false positives | Preserved, now regression-pinned |
| "Run as shadow detector only" | Consistent with all claims made anywhere in this repository |
