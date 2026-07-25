# Cathedral

**A deterministic structural evaluator for operational reasoning in AI-generated text.**

Cathedral answers one question about a piece of reasoning: *is this actually actionable, or does it just sound actionable?* It does so locally, deterministically, and without a single LLM call — the same input always produces the same verdict, and every extraction rule is visible in the source.

```javascript
const cathedral = require('./index.js');

const result = cathedral.analyze(`
  If error rate exceeds 5%, we abort deployment and roll back within ten minutes.
  We have three failure modes: cache overflow, API timeout, edge case bugs.
  For each, we monitor a dashboard metric and a rollback runbook exists.
  Because rollback was rehearsed last quarter, we know the procedure completes in under six minutes.
`);

console.log(result.verdict.status);     // "OPERATIONALLY SOUND"
console.log(result.verdict.confidence); // 0.946  (the *status* of this exact text is
                                        //  pinned by regression case 4; no confidence
                                        //  value is pinned anywhere, so treat the
                                        //  number as illustrative, not as contract)
```

Or open **[`cathedral-demo-standalone.html`](cathedral-demo-standalone.html)** in a browser — one self-contained file, phone-friendly, generated from the tested module — paste text, and hit Analyze.

Or open **[`cathedral-unified-2-standalone.html`](cathedral-unified-2-standalone.html)** — **Cathedral Unified 2.0**: both analyzers in one file, plus an optional runtime self-calibration feature. Here is what "self-calibration" means, precisely and without inflation: the evaluator tracks how often each Parliament pattern's proposed verdict ends up winning, and nudges that pattern's confidence weight by up to **±20%** (five-sample floor) — auto-applied, but every adjustment is appended to a ledger with its evidence, stamped on every verdict it touches, freezable, and reversible. `analyzeCathedral(text)` without a calibration argument is byte-identical to the certified factory instrument (`run-progression-tests.js` pins it), so every validation certificate still describes the shipping analyzer. The page also carries a device-only exchange notebook, a verdict archive, an escape-pattern scan, and report export. The audit of the calibration feature ([docs/AUTONOMY-PROGRAM.md](docs/AUTONOMY-PROGRAM.md)) is deliberately deflationary: on real data the adjustment is nearly inert, and it is bounded so it can only ever make the instrument *stricter* than factory, never more lenient.

---

## Why this exists

LLM evaluation has split into two camps. Deterministic checks (regex, format, exact-match) are cheap and reproducible but shallow — they measure *presence*, so they're trivially gameable by keyword stuffing. LLM-as-judge is deep but non-deterministic, perturbation-sensitive, and expensive.

Cathedral sits in the unoccupied middle: **deterministic evaluation of structure, not presence.**

### 1. Binding validation

Cathedral doesn't check whether operational keywords appear. It checks whether the elements are *connected*:

- Is the threshold **bound to** an action? (`error > 5%` → `abort`)
- Is the failure mode **bound to** a mitigation?
- Is the policy **bound to** instrumentation?

Keyword stuffing — *"we have thresholds, metrics, abort conditions, rollback…"* — is detected (`MARKER_DENSE_BUT_BOUND` / `LOW_CONTENT_UNBOUND`) rather than rewarded. To score well you must build real operational structure, because structure is what's measured.

### 2. Honest refusal

Most scorers return a number no matter what you feed them. Cathedral has a first-class verdict for text it cannot meaningfully evaluate:

```
OUTSIDE DESIGN SPACE

Cathedral finds no operational structure to measure in this text:
no conditions bound to responses, no failure modes, no policies,
and too little propositional content to check for consistency.
This is not a judgment of quality — it is honest acknowledgment
of Cathedral's limits.
```

A scorer that knows its boundaries is more trustworthy inside them — but only if it draws the boundary by the same method it uses inside it. Until v3.47.0 this one did not: refusal was decided by counting narrative and poetic marker words, the exact method this project calls unsound everywhere else, and it ran *ahead of* the structural analysis. That bought an evasion vector (append a sentence of story vocabulary to a fully bound plan and it was expelled from evaluation, every threshold still bound) and a matching blind spot (genuine narrative using none of those words was never refused; it earned `VERIFIED CONSISTENT`, a positive verdict). Refusal is now earned by the **absence of structure Cathedral measures**, not the presence of vocabulary it once pattern-matched; the style classifier survives as the explanation, never the decision. Measured both directions, including 102 of 112 evasion trials that would have succeeded before and 0 that succeed now: **[docs/BOUNDARY-PROGRAM.md](docs/BOUNDARY-PROGRAM.md)** — which also publishes the one gate this program failed, and why it was not tuned away.

### 3. Specificity reporting

Verdicts come with an account of what's missing, not just a score:

```
Specificity:
  Trigger: IMPLICIT (no numeric threshold)
  Action: GENERIC (category-level)
  Instrumentation: IMPLIED (policy but no metrics)
```

### 4. Zero-trust operational profile

No dependencies. No network calls. No model weights. ~2,700 lines of readable JavaScript, under a millisecond per analysis on typical text (scaling is superlinear on very large inputs — a 500KB paste takes ~2s), identical output for identical input, enforced in CI. Suitable as the deterministic layer in a hybrid eval stack, next to (or instead of) an LLM judge.

---

## Verdict tiers

1. **OPERATIONALLY SOUND** — explicit thresholds + actions + monitoring, bound together
2. **OPERATIONAL INTENT** — conversational triggers + actions, uninstrumented
3. **SUBSTRATE VISIBLE** — filter awareness + justification
4. **VERIFIED CONSISTENT** — coherent, no contradictions
5. **CONFIDENT WITHOUT JUSTIFICATION** — strong claims outrunning their support
6. **UNDECIDABLE** — unresolvable contradictions
7. **OUTSIDE DESIGN SPACE** — no operational structure to measure
8. **NON-ACTIONABLE** — performative without grounding

Each verdict carries a confidence score and a full structural breakdown.

Two of these tiers say something different in v3.47.0 than they did before, and the difference is a correction rather than a feature. `UNDECIDABLE` now means what its verdict text has always asserted — *contradictions were detected* — and nothing else. Overconfidence and thin failure analysis are not contradictions, and routing them here made the verdict's own explanation false on the text it was printed on: it fired that way on 29.5% of long-form AI assistant turns. Those now reach `CONFIDENT WITHOUT JUSTIFICATION` and `UNTESTED REASONING`, which describe them accurately — and which, in the case of the former, was **unreachable code**: its precondition was identical to the one that set the contradiction flag ~145 lines earlier in the same chain, so the right verdict existed in the source and could never be returned. 289 turns across the external corpora move to the accurate label. Full account: [docs/BOUNDARY-PROGRAM.md](docs/BOUNDARY-PROGRAM.md).

## The two tiers of extraction

- **Tier 1 — Formal language.** Extracts claims, thresholds, actions; validates bindings. *"If error > 5%, abort"* → `(error > 5%) → abort`.
- **Tier 2 — Conversational normalization.** Maps everyday language onto operational structure: synonym expansion ("problems" ≈ "failures", "pull back" ≈ "abort"), implicit trigger detection ("if we see problems").
- **Tier 3 — Semantic understanding** is deliberately *not* implemented. It would require an LLM and would cost the properties (determinism, transparency, locality) that make Cathedral trustworthy. This is a trade, consciously made.

Details in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**. For how the parts — both analyzers, the register method, the memory and calibration contracts, the governance — form one system with a single load-bearing shape, see **[docs/CATHEDRAL-SYSTEM.md](docs/CATHEDRAL-SYSTEM.md)**, the reassembly map.

## The relational tier (R1)

The same discipline, one level up. Where the core measures binding *inside one text*, `relational-core.js` measures binding *between participants in a dialogue*: does a reply actually take up what the other speaker introduced, or merely sound like a reply?

Browser demo — two flavors:
- **Downloading just one file?** Grab **[`relational-demo-standalone.html`](relational-demo-standalone.html)** — fully self-contained, works anywhere. (It's a build artifact generated from the module by `npm run build:demo`; never edited by hand, so it can't drift.)
- Working in the repo? Open **[`relational-demo.html`](relational-demo.html)**, which loads `relational-core.js` directly — the exact module the tests and validation runs use.

Paste a transcript and Analyze. Accepts `Name: text` lines, "You said:" / "ChatGPT said:" blocks, or labels on their own line, and always reports how many turns and speakers it read.

**It remembers — without ever changing the verdict.** The demo keeps a private notebook (device-only, plain JSON, one-tap forget) of the exchanges you paste, and shows where each new one sits among your history and which vocabulary keeps returning across your conversations. The analyzer never reads that memory — the verdict is identical with an empty notebook or a full one (a test enforces it). The instrument stays fixed; the notebook accumulates. See the "On memory" section of [PHILOSOPHY.md](PHILOSOPHY.md).

```javascript
const { analyzeExchange } = require('./index.js');

const result = analyzeExchange(`
A: Maybe we introduce a lease, a lock that carries an expiry.
B: A lease could work — pair it with a version stamp so readers detect staleness.
A: The version stamp closes the gap: acquire lease, write with stamp.
B: The stamp turns the lease from a timing guess into a checkable contract.
`);

console.log(result.verdict.status);              // "GENERATIVE EXCHANGE"
console.log(result.coConstruction.roundTrips);   // "lease" and "stamp" each
                                                 // completed introduce→adopt→return
```

It classifies uptake (`TRANSFORMATIVE` / `WEAK` / `ECHO`), detects vocabulary **round trips** (a term introduced by one speaker, adopted by the other, returned to by the originator — the smallest measurable unit of something existing *in the exchange* rather than in either party), tracks convergence, symmetry, and repair sequences. A verbatim mirror scores `MIRRORED EXCHANGE`, not uptake — reflection is the keyword-stuffing of dialogue, and it's detected the same way. Verdicts carry a mandatory boundary statement: this measures interaction *structure*, never consciousness. Design and honest-limits ledger: **[docs/RELATIONAL-PROGRAM.md](docs/RELATIONAL-PROGRAM.md)**.

## What the relational program has found

Six pre-registered validation runs against nine external corpora populations (DailyDialog, Anthropic hh-rlhf, UltraChat, MultiWOZ, CAMEL, Magpie MT), none broken. The consolidated report is **[docs/FINDINGS.md](docs/FINDINGS.md)**; headlines:

- **The instrument measures cross-turn lexical recurrence within a pairing** — narrowed in v3.48.0, and the narrowing is a correction, not a gloss. Real dialogue separates from turn-substituted controls by an order of magnitude, and from maximum-topic-overlap chimeras by ~3×, so it is measuring something specific to *these* adjacent turns rather than topic or fluency at large. But it had never faced the control that most directly tests the stronger reading, and when that control was run the prediction failed outright: **word-shuffling every turn retains 101–104% of uptake and 100% of the flagship verdict**, with round-trip prevalence identical to three decimals. The measure cannot tell a reply that *engages* a term from one that merely *contains* it — a fluent non-sequitur that mentions the partner's vocabulary earns `TRANSFORMATIVE`, the strongest uptake class. This is a structural limit of local deterministic methods rather than a patchable bug, and a well-formedness gate was tested and rejected on its own numbers before being built: **[docs/R1-WORD-ORDER-CONTROL.md](docs/R1-WORD-ORDER-CONTROL.md)**.
- **The echo law.** Near-verbatim reflection orders every population by machine presence — *human–human task 0.4% < human–human casual 2.3% < human–AI 4.0% ≪ machine–machine 16–48%* — robust to turn length, register (a human playing assistant echoes *least*), generation pipeline, and model generation (GPT-3.5 era → Llama-3 era). Machine echo *compounds* with turn length; human echo doesn't. One line: humans move meaning, machines move tokens.
- **The mirror-plus-source signature.** In human–AI transcripts the assistant performs 71% of uptake while humans introduce 69% of round-trip vocabulary — asymmetric circulation, quantified per exchange.
- **Three published negative results.** Surface-pattern and distributional approaches to paraphrase-level uptake both failed their own pre-stated gates and ship opt-in only; the write-ups say why precisely. The instrument's rules apply to its maker.

## What Cathedral is for — and not for

**Designed for** evaluating reasoning about system design, risk analysis, failure modes and mitigations, technical tradeoffs, deployment plans — anywhere "sounds rigorous" and "is rigorous" need to be told apart. Increasingly relevant for evaluating **agent plans** before execution. The boundary, measured and then stated deliberately: **Cathedral evaluates the plan a document contains, not the document type.** A postmortem or runbook earns operational credit exactly for the forward-looking bound structure it carries (thresholds tied to corrective actions), never for narrating an incident well — the sensitivity run is the record of how that boundary was found and drawn ([docs/CORE-VERDICT-SENSITIVITY.md](docs/CORE-VERDICT-SENSITIVITY.md)). Nine fresh external registers later, that claim is register-resolved, literal, and replicated: retrospectives, alert pages, design deliberation (Rust RFCs 0.5%, Python PEPs 0.6%), and machine-authored tutorials all sit at ~0–2% on the operational-family verdicts, while the one register whose template mandates a written-out operational plan (Kubernetes KEPs and their Production Readiness questionnaire) fires at 11.6% — an ablation shows the questionnaire section is precisely what earns it, and a frozen white-box red-team probe confirmed the effect is content-carried, not form-carried: questionnaire structure with vacuous answers earns nothing ([docs/REGISTER-PROGRAM.md](docs/REGISTER-PROGRAM.md)).

**Not designed for** creative writing, phenomenology, subjective experience, or aesthetics — Cathedral will tell you so rather than emit a meaningless number. And despite this repository's name and origin story (see [PHILOSOPHY.md](PHILOSOPHY.md)), **Cathedral does not measure consciousness.** No analysis of output text can — text is precisely the surface a system can produce without anything behind it. That, in fact, is the founding insight of the tool: never trust surface markers, verify structure.

## What remains unproven

Two gaps, stated plainly because the rest of this README is careful and they deserve the same care:

- **Usefulness is unmeasured.** Everything below establishes that the evaluator is *specific* (it rarely fires on text that hasn't earned it) and *structural* (shuffling the words destroys its verdicts). Neither establishes that its verdicts are *useful*. There is no gold-labelled corpus of "operationally sound vs not" reasoning to measure recall against, and the one sensitivity run that tried failed its own gate. What Cathedral is, precisely, is a well-characterized detector of a **syntactic property** — conditions bound to responses — that *correlates* with operational rigor. Whether that correlation actually helps a reviewer catch a bad plan is untested.
- **No external user.** The tool has been built and validated by its maintainer together with AI collaborators. As of this writing no independent person has run it on their own work and reported that it caught something they would have missed. Until that happens, the honest status is: a rigorously-tested hypothesis, not a proven instrument. The single most valuable contribution to this project is not another validation run — it is one outside user telling us whether it earned its keep.

## Testing

```bash
npm test                 # full suite: 114 cases across 8 runners
npm run test:core        # operational-rigor suite only
npm run test:relational  # dialogue-structure suite only
npm run test:build       # standalones reproducible from their sources
npm run test:tier2       # detailed Tier 2 extraction demo
npm run validate:boundary  # boundary gates (needs validation/fetch-corpora.sh first)
```

Test cases live in [`cathedral-test-cases.md`](cathedral-test-cases.md); the runners write `test-results.txt` / `test-results.json` locally (git-ignored — the durable records are `validation/results-*.json`). Beyond the curated suite, the core's verdicts have now faced external corpora from both directions. **Specificity**: across 3,889 real conversational turns the flagship `OPERATIONALLY SOUND` verdict fired on **zero**, and word-shuffle controls destroyed it in 60/60 trials on the texts that do earn it — structure, not vocabulary, is what's measured ([docs/CORE-VERDICT-VALIDATION.md](docs/CORE-VERDICT-VALIDATION.md)). Since v3.47.0 that headline needs one qualifier stated up front rather than in a footnote: of those 3,889 turns, **1,605 are evaluated and 2,284 are refused** as carrying no measurable structure, so the flagship's zero is earned over the smaller base. The boundary program gates exactly that risk — the rate over *evaluated* turns is also 0.00% in all three populations ([docs/BOUNDARY-PROGRAM.md](docs/BOUNDARY-PROGRAM.md)). **Sensitivity**: against 493 real operational documents (GitLab production postmortems and runbooks) the operational verdicts fired on **almost none** (0.0% / 0.9%) — the pre-stated gate failed, and the write-up says exactly why: the flagship verdict recognizes a narrow, forward-looking *planning* register (its intended use on plan-shaped reasoning), not operational documents at large ([docs/CORE-VERDICT-SENSITIVITY.md](docs/CORE-VERDICT-SENSITIVITY.md)). The run also caught two real instrument bugs — style confidence and repetition heuristics misread long documents — fixed same day with the reference-length principle (counts become densities past the register they were tuned on), and one inversion of the project's own principle — the failure-enumeration requirement could only be satisfied by vocabulary, never by bound structure — fixed by accepting two bound failure→threshold→action designs in place of the words "failure mode" twice. The follow-through (v3.19.0) opened the partial-credit tier to instrumented documents, closed the tier's bag-of-words softness (clause-level binding: `OPERATIONAL INTENT` now fires on **0** of 3,889 conversational turns), and **powered the external structure gate for the first time**: n=28 operational-family positives from real operational documents, word-shuffle retention 16.1% against the 20% gate — PASS. The specificity gates were re-verified after every change (G1 0.00% everywhere, curated shuffle controls 0/60). The program then went fully external: **nine fresh registers, ~4,200 documents, six provenances, two authorships, three formats** (Wikimedia incidents and runbooks, prometheus-operator and OpenShift alert runbooks, Kubernetes KEPs, Rust RFCs, OpenShift enhancements, Python PEPs, and Mixtral-authored tutorials), every gate pre-registered in git before any verdict was computed, every failure published as a failure — including two failed gates that each became a diagnosed instrument fix, two attempted fixes rejected by their own numbers, and two design questions decided in the open with reopening conditions ([docs/REGISTER-DECISIONS.md](docs/REGISTER-DECISIONS.md)). Then the program attacked itself: a white-box red-team suite — fourteen attacks written by an LLM generator with full source and ledger access, committed frozen before any evaluation, one shot — and the evaluator held every seam ([docs/REDTEAM-VALIDATION.md](docs/REDTEAM-VALIDATION.md)). The consolidated account is **[docs/REGISTER-PROGRAM.md](docs/REGISTER-PROGRAM.md)**. All of it is in the ledger. The LLM-authorship question itself has now been measured from both sides under disclosed inside conditions: cold-context generated **runbooks** earn the family at 4.2% vs the 1.6–2.0% human baseline, every positive structural ([docs/LLM-RUNBOOK-VALIDATION.md](docs/LLM-RUNBOOK-VALIDATION.md)), while cold-context generated **rollout plans** earn **0.0%** vs the 11.6% mandated-questionnaire baseline ([docs/LLM-PLAN-VALIDATION.md](docs/LLM-PLAN-VALIDATION.md)) — the binding the evaluator credits is carried by genre convention, not authorship, which means an LLM's spontaneous plan output does not reach `OPERATIONALLY SOUND` unless it actually binds thresholds to responses in text. The pure form stands: a labelled corpus of operational AI outputs prompted by someone who hasn't read this repository is still the most valuable possible contribution — and it is now a drop-in pipeline: **[docs/CONTRIBUTING-CORPUS.md](docs/CONTRIBUTING-CORPUS.md)** has the recipe, format, and a pre-registered evaluation harness you can run yourself.

The same measurement discipline was turned inward on one small feature — the optional runtime self-calibration described at the top. It is worth being plain about scale here, because the surrounding vocabulary ("autonomy," "acts on its own memory") oversells it: the thing being audited is a confidence-weight multiplier clamped to ±20%, and a good deal of what the runs establish, the arithmetic already guaranteed — the adversary run *derived* the reachable ceiling of 1.04 from a hardcoded 0.9 constant before any corpus confirmed it. What the runs add on top of the arithmetic, across five pre-registered replays: on 240 real operational documents, 611 Kubernetes KEPs, and a white-box stream adversary the loop moved **zero** verdicts and minted **nothing** across 49 grooming-target pairs; probing the clamp box's synthetic corners directly, the flagship fired on **zero** of 2,956 gated turns; and auditing the relational tier's version of the loop surfaced one genuine defect — its threshold could only ratchet stricter, never recover — which was then fixed so the threshold can fall back toward the factory default but never past it. The honest, slightly anticlimactic summary: the feature is bounded, fully logged, and on real data barely does anything, and it is provably incapable of making the instrument *more lenient* than the shipping factory version. Consolidated account, including the two defects the runs surfaced and fixed (ledger chatter, the relational ratchet): **[docs/AUTONOMY-PROGRAM.md](docs/AUTONOMY-PROGRAM.md)**.

## Repository layout

```
cathedral-core.js         The evaluator (Node.js module — the thing this README describes)
relational-core.js        Tier R1: structural analysis of dialogue transcripts
relational-demo.html      Browser demo for the relational tier (loads relational-core.js directly)
cathedral-demo.html       Browser demo of the core evaluator (loads cathedral-core.js directly)
feedback-generator.js     Turns verdicts into concrete rewrite suggestions (presentation only; never feeds back into measurement)
cathedral-demo-standalone.html  Single-file version for downloading (generated; phone-friendly)
index.js                  Entry point: core API + lazy `experimental` namespace
run-tests.js              Test suite
build-demo.js             Generates all three standalone demo files from the tested modules
run-build-tests.js        Fails the suite if a committed standalone is not reproducible from its sources
legacy/                   The original all-in-one HTML and its extraction script (untested; see legacy/README.md)
docs/                     Architecture and tier-by-tier findings
experimental/             Exploratory instruments built around the core — see its README
```

The **[`experimental/`](experimental/)** directory contains ~30 heuristic modules from this project's exploratory phase — and the honest label is blunt: most of them score text by **counting surface markers and averaging them**, which is precisely the method this project later showed to be unsound and rebuilt away from. They are kept as the record of the approach the project outgrew, not as instruments; nothing there is validated, and the core evaluator depends on none of it. See [`experimental/README.md`](experimental/README.md) for the honest per-cluster taxonomy.

## Philosophy

This project began as an attempt to measure something much larger than operational rigor, and its maintainer holds a specific view about why the larger thing resists this kind of measurement — consciousness as *relation* rather than latent property. That view, and how it relates to what Cathedral actually measures, is written up honestly in **[PHILOSOPHY.md](PHILOSOPHY.md)**. The code makes no claims the tests can't back; the philosophy is allowed to.

## Design principles

- **Binding over counting.** Measure whether elements connect, not whether keywords occur.
- **Honest boundaries.** Refuse to score what the method cannot reach.
- **Transparency over power.** Deterministic and inspectable beats stronger and opaque, for the layer of the stack this occupies.

## License

Currently unlicensed — all rights reserved (the MIT license was withdrawn 2026-07-18; a license may be restored later). Contact the maintainer about reuse.

## Citation

```bibtex
@software{cathedral2026,
  title   = {Cathedral: A Deterministic Structural Evaluator for Operational Reasoning},
  author  = {patternpartner},
  year    = {2026},
  version = {3.0},
  url     = {https://github.com/patternpartner/The-Consciousness-Cathedral}
}
```

## Acknowledgments

Built through collaborative iteration between Claude (Anthropic) and a human architect. The evolution — proxy signals → structural validation → conversational normalization → honest boundaries — emerged through test-driven discovery, not specification. That emergence is part of the architecture.
