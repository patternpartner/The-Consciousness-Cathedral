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

## The ledger after these decisions

Open flags remaining in the register program: **(a)** the successor authorship flag — LLM-*written* operational documents and adversarially prompted text with a modern generator in the loop; **(b)** the standing pattern — the nine corpora are development data for any future core change, and a tenth register validates it. Everything else measured by the program is either established on ≥ 2 registers, fixed and validated out-of-sample, published as a rejection with its numbers, or decided above with reopening conditions.
