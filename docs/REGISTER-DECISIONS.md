# Register Decisions — the two open design questions, decided and reopenable

*2026-07-17, v3.32.0. The register program left two ledgered design questions ([REGISTER-PROGRAM.md](REGISTER-PROGRAM.md), open flags 1–2). This document decides both — the v3.19.0 pattern: a register decision is made out loud, with its reasons and its reopening conditions, rather than left ambient. No code changes; the evaluator is byte-identical to v3.31.0.*

## Decision 1: the flagship count-route residue is an accepted, monitored boundary

**The residue:** on the KEP register, a handful of `OPERATIONALLY SOUND` verdicts minted by the count-based routes retain 4–9 of 20 word-shuffles (pooled retention 4.9%, worst 9/20) — under the program's standing criteria (pooled < 20%; per-text 10/20 reference) but visibly softer than every other register.

**The design space for local fixes is closed by measurement, not by fatigue.** Three structurally different fix families were taken to numbers, each under pre-stated acceptance criteria:

| Attempt | Mechanism | Result |
|---|---|---|
| The witness (v3.27.0, [OBJECT-RATIO-WINDOWING.md](OBJECT-RATIO-WINDOWING.md)) | binary lexical: threshold + corrective-action lexeme in one sentence | **rejected** — killed 49/56 earned verdicts, missed the worst offender |
| The corroboration (v3.31.1, [FLAGSHIP-SYNTAX-BUDGET.md](FLAGSHIP-SYNTAX-BUDGET.md)) | binary syntactic: conditional connective before a threshold expression in one sentence | **rejected** — killed 40/71 + 4 collateral, two texts still ≥ 4/20 |
| Graded scaling (this document) | effective counts = raw × REF/words feeding the presence conditions | **foreclosed by arithmetic + measurement** — at the tuned register (REF = 150) it loses **71 of 71** KEP positives; at REF = 300, 70; even at an unprincipled REF = 600 it loses 49, matching the witness slaughter. A presence condition (≥ 1) under density scaling demands `raw ≥ words/REF` — 20+ threshold tokens for a 3,000-word plan — which genuine plans do not carry. |

The lesson of the three, stated once: **written-out plans bind thresholds to responses in arrangements too diverse — lexically, syntactically, and in density — for any local rule to separate from shuffle noise without destroying the sensitivity the KEP register established.** And the remaining conceivable move — an instrument that detects shuffled text *itself* — is ruled out on principle: the shuffle is the program's proxy control for vocabulary-versus-structure; building detection of the proxy would Goodhart the control and corrupt every retention number after it.

**The decision:** the residue is accepted at its measured magnitude as a known boundary of the count-based flagship routes. It is **monitored, not forgotten**: every fresh-register run already reports pooled retention and per-text worst against the 10/20 reference, and continues to.

**Reopening conditions (any one suffices):** a fresh register measures a per-text retention ≥ 10/20, or pooled retention ≥ 20%; or a genuinely new fix principle emerges that is neither a binary local pattern, a density scaling of presence conditions, nor shuffle detection. Absent those, a fourth local attempt is not warranted — the three post-mortems above are the fence.

## Decision 2: the verdict credits the plan as written — template provenance is outside the design space

**The question ([OPENSHIFT-ENHANCEMENT-VALIDATION.md](OPENSHIFT-ENHANCEMENT-VALIDATION.md)):** the KEP register's 11.6% family rate is carried by the mandated PRR questionnaire (the ablation: removing that section drops 53 of 71 positives). Should the flagship distinguish *mandated* from *voluntary* operational binding?

**The decision: no.** Three reasons, in the project's own terms:

1. **Provenance is not in the text.** Whether a section exists because a template demanded it is a fact about a community's process, not about the document's content. A deterministic text evaluator cannot know it without consuming metadata beyond the text — and the project's founding rule cuts both ways: verify structure, and claim nothing the text cannot carry. "Mandatedness" is precisely such a claim.
2. **The mandated section contains real structure, not boilerplate.** The ablation removed *bound content*, not vocabulary — and the shuffle control confirms it: the PRR-carried positives overwhelmingly retain 0–3/20. If a template ever produced sections that mint verdicts *without* surviving structure, that would be a measurable defect with the standard fix path, not this decision's subject.
3. **The interpretive burden belongs to the reader documentation, and is already placed there.** A high family rate on a template-mandated register measures that community's enforcement of written plans. [REGISTER-PROGRAM.md](REGISTER-PROGRAM.md) and the README state this; the rate is a fact about the register, correctly measured.

**Reopening condition:** evidence of a template whose mandated sections earn operational-family verdicts that *fail* the shuffle control — mandated boilerplate credited without structure. That is a defect report, and it reopens this as an instrument question, not a design question.

## Decision 3: the self-calibration loop acts autonomously, checked by an exogenous anchor it cannot author

*2026-07-18, v3.40.0. Follows the v3.39.0 fully-autonomous loop (both tiers, no human gate). This decision closes the structural weakness the autonomy exposes, and names the accountability mechanism.*

**The structural weakness:** The progression loop's win signal is endogenous. A pattern "wins" when its proposal (`PROPOSALS[name]`) matches the final verdict — a verdict the pattern itself helped produce by contributing to Parliament's confidence synthesis. The loop therefore optimizes internal consensus, not external correctness. The ±20% clamp (`CLAMP_LO = 0.8`, `CLAMP_HI = 1.2`, `progression.js:48`) bounds how far this can go but cannot say which direction is wrong. A fully-autonomous loop without an external standard can drift, in small well-evidenced steps, until it disagrees with the humans who built the instrument.

**The structural fix:** `anchor-cases.js` is the exogenous check — eight texts with expected verdicts fixed by humans in the regression suite, frozen in git, spanning five verdict families. The loop had no hand in writing them and cannot revise them at runtime. Before `act()` applies a self-calibration candidate, it passes the candidate to the validator function. `checkCalibration` runs the factory analyzer under the candidate multipliers against all eight anchor texts; if any verdict diverges from the pinned expectation, the candidate is **rejected automatically, without a human in the loop, against a standard the loop does not own.** The rejection is itself an append-only ledger entry carrying the evidence (`why`: which anchor case would have flipped, what it would have read, what it was pinned to). The change is not applied.

**The principle:** Autonomy with ground truth, not autonomy as self-agreement. The loop still acts on its own memory without asking — nothing about that changes. What changes is that it has an external standard it cannot rewrite, and its rejections are as loud as its acceptances. January's named crime was silence, not autonomy; the anchor does not add a human gate, it adds a floor the loop cannot silently undercut.

**Anchor honesty conditions:** (a) The eight cases are verbatim to the regression suite; drift between the two is a bug. (b) The anchor texts are development data — they are a floor, not a benchmark, and they may never be fed back to train the calibration. `checkCalibration` reads verdicts and writes nothing. (c) The anchor stays small: it is a veto right, not a performance specification, and adding texts to it carries the risk of over-constraining a loop that is functioning correctly.

**Reopening conditions (any one suffices):** A registered corpus produces an expected verdict family that the anchor cases do not cover, and a candidate calibration useful on the new corpus is routinely rejected by cases that have no bearing on it (over-constraint by stale coverage); or a new instrument version changes the factory verdicts on anchor texts (anchor requires maintenance, not reopening). Neither condition warrants removing the anchor — they warrant revising which texts it carries. Removal is warranted only if an alternative external standard with equal or stronger coverage is introduced.

## The ledger after these decisions

Open flags remaining in the register program: **(a)** the successor authorship flag — LLM-*written* operational documents and adversarially prompted text with a modern generator in the loop; **(b)** the standing pattern — the nine corpora are development data for any future core change, and a tenth register validates it. Everything else measured by the program is either established on ≥ 2 registers, fixed and validated out-of-sample, published as a rejection with its numbers, or decided above with reopening conditions.
