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
console.log(result.verdict.confidence); // 0.95  (this exact text is pinned by regression case 20)
```

Or open **[`cathedral-demo-standalone.html`](cathedral-demo-standalone.html)** in a browser — one self-contained file, phone-friendly, generated from the tested module — paste text, and hit Analyze.

Or open **[`cathedral-unified-2-standalone.html`](cathedral-unified-2-standalone.html)** — **Cathedral Unified 2.0**: the whole system in one file, and since v3.38.0 a system that **remembers its own progression and acts on it**. Both analyzers; the January build's federated learning restored in full — pattern win-rates recalibrate the Parliament automatically (±20% clamp, five-sample floor), with every self-change appended to a ledger with its evidence, stamped on every verdict it touches, freezable, and reversible; a verdict archive whose drift detector can attribute any changed verdict to the exact self-change that moved it; the exchange notebook; the escape-pattern scan; and report export. As of v3.39.0 **both tiers act on their own memory** — the relational uptake bar moves itself when the notebook's evidence says it stopped discriminating — every self-change announced, ledgered with evidence, stamped, reversible, and covered by one freeze switch: the human is a reader of the record, not a gate in the loop. `analyzeCathedral(text)` without options remains byte-identical to the certified factory instrument (`run-progression-tests.js` pins it), so every validation certificate still describes the shipping analyzer — and every verdict the loop touches says so on its face.

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

Cathedral recognizes narrative reasoning. This falls outside
Cathedral's epistemic design space (operational/scientific/formal).
This is not a judgment of quality — it is honest acknowledgment
of Cathedral's limits.
```

A scorer that knows its boundaries is more trustworthy inside them.

### 3. Specificity reporting

Verdicts come with an account of what's missing, not just a score:

```
Specificity:
  Trigger: IMPLICIT (no numeric threshold)
  Action: GENERIC (category-level)
  Instrumentation: IMPLIED (policy but no metrics)
```

### 4. Zero-trust operational profile

No dependencies. No network calls. No model weights. ~2,000 lines of readable JavaScript, 10–50ms per analysis, identical output for identical input. Suitable as the deterministic layer in a hybrid eval stack, next to (or instead of) an LLM judge.

---

## Verdict tiers

1. **OPERATIONALLY SOUND** — explicit thresholds + actions + monitoring, bound together
2. **OPERATIONAL INTENT** — conversational triggers + actions, uninstrumented
3. **SUBSTRATE VISIBLE** — filter awareness + justification
4. **VERIFIED CONSISTENT** — coherent, no contradictions
5. **UNDECIDABLE** — unresolvable contradictions
6. **OUTSIDE DESIGN SPACE** — narrative / poetic / phenomenological reasoning
7. **NON-ACTIONABLE** — performative without grounding

Each verdict carries a confidence score and a full structural breakdown.

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

- **The instrument measures relation, not fluency or topic.** Real dialogue separates from shuffle-destroyed controls by an order of magnitude, and from maximum-topic-overlap chimeras by ~3× — a keyword or fluency scorer rates all three nearly identically.
- **The echo law.** Near-verbatim reflection orders every population by machine presence — *human–human task 0.4% < human–human casual 2.3% < human–AI 4.0% ≪ machine–machine 16–48%* — robust to turn length, register (a human playing assistant echoes *least*), generation pipeline, and model generation (GPT-3.5 era → Llama-3 era). Machine echo *compounds* with turn length; human echo doesn't. One line: humans move meaning, machines move tokens.
- **The mirror-plus-source signature.** In human–AI transcripts the assistant performs 71% of uptake while humans introduce 69% of round-trip vocabulary — asymmetric circulation, quantified per exchange.
- **Three published negative results.** Surface-pattern and distributional approaches to paraphrase-level uptake both failed their own pre-stated gates and ship opt-in only; the write-ups say why precisely. The instrument's rules apply to its maker.

## What Cathedral is for — and not for

**Designed for** evaluating reasoning about system design, risk analysis, failure modes and mitigations, technical tradeoffs, deployment plans — anywhere "sounds rigorous" and "is rigorous" need to be told apart. Increasingly relevant for evaluating **agent plans** before execution. The boundary, measured and then stated deliberately: **Cathedral evaluates the plan a document contains, not the document type.** A postmortem or runbook earns operational credit exactly for the forward-looking bound structure it carries (thresholds tied to corrective actions), never for narrating an incident well — the sensitivity run is the record of how that boundary was found and drawn ([docs/CORE-VERDICT-SENSITIVITY.md](docs/CORE-VERDICT-SENSITIVITY.md)). Nine fresh external registers later, that claim is register-resolved, literal, and replicated: retrospectives, alert pages, design deliberation (Rust RFCs 0.5%, Python PEPs 0.6%), and machine-authored tutorials all sit at ~0–2% on the operational-family verdicts, while the one register whose template mandates a written-out operational plan (Kubernetes KEPs and their Production Readiness questionnaire) fires at 11.6% — an ablation shows the questionnaire section is precisely what earns it, and a frozen white-box red-team probe confirmed the effect is content-carried, not form-carried: questionnaire structure with vacuous answers earns nothing ([docs/REGISTER-PROGRAM.md](docs/REGISTER-PROGRAM.md)).

**Not designed for** creative writing, phenomenology, subjective experience, or aesthetics — Cathedral will tell you so rather than emit a meaningless number. And despite this repository's name and origin story (see [PHILOSOPHY.md](PHILOSOPHY.md)), **Cathedral does not measure consciousness.** No analysis of output text can — text is precisely the surface a system can produce without anything behind it. That, in fact, is the founding insight of the tool: never trust surface markers, verify structure.

## Testing

```bash
npm test                 # core (11 scenarios) + relational (9 dialogues)
npm run test:core        # operational-rigor suite only
npm run test:relational  # dialogue-structure suite only
npm run test:tier2       # detailed Tier 2 extraction demo
```

Test cases live in [`cathedral-test-cases.md`](cathedral-test-cases.md); results are written to `test-results.txt` / `test-results.json`. Beyond the curated suite, the core's verdicts have now faced external corpora from both directions. **Specificity**: across 3,889 real conversational turns the flagship `OPERATIONALLY SOUND` verdict fired on **zero**, and word-shuffle controls destroyed it in 60/60 trials on the texts that do earn it — structure, not vocabulary, is what's measured ([docs/CORE-VERDICT-VALIDATION.md](docs/CORE-VERDICT-VALIDATION.md)). **Sensitivity**: against 493 real operational documents (GitLab production postmortems and runbooks) the operational verdicts fired on **almost none** (0.0% / 0.9%) — the pre-stated gate failed, and the write-up says exactly why: the flagship verdict recognizes a narrow, forward-looking *planning* register (its intended use on plan-shaped reasoning), not operational documents at large ([docs/CORE-VERDICT-SENSITIVITY.md](docs/CORE-VERDICT-SENSITIVITY.md)). The run also caught two real instrument bugs — style confidence and repetition heuristics misread long documents — fixed same day with the reference-length principle (counts become densities past the register they were tuned on), and one inversion of the project's own principle — the failure-enumeration requirement could only be satisfied by vocabulary, never by bound structure — fixed by accepting two bound failure→threshold→action designs in place of the words "failure mode" twice. The follow-through (v3.19.0) opened the partial-credit tier to instrumented documents, closed the tier's bag-of-words softness (clause-level binding: `OPERATIONAL INTENT` now fires on **0** of 3,889 conversational turns), and **powered the external structure gate for the first time**: n=28 operational-family positives from real operational documents, word-shuffle retention 16.1% against the 20% gate — PASS. The specificity gates were re-verified after every change (G1 0.00% everywhere, curated shuffle controls 0/60). The program then went fully external: **nine fresh registers, ~4,200 documents, six provenances, two authorships, three formats** (Wikimedia incidents and runbooks, prometheus-operator and OpenShift alert runbooks, Kubernetes KEPs, Rust RFCs, OpenShift enhancements, Python PEPs, and Mixtral-authored tutorials), every gate pre-registered in git before any verdict was computed, every failure published as a failure — including two failed gates that each became a diagnosed instrument fix, two attempted fixes rejected by their own numbers, and two design questions decided in the open with reopening conditions ([docs/REGISTER-DECISIONS.md](docs/REGISTER-DECISIONS.md)). Then the program attacked itself: a white-box red-team suite — fourteen attacks written by an LLM generator with full source and ledger access, committed frozen before any evaluation, one shot — and the evaluator held every seam ([docs/REDTEAM-VALIDATION.md](docs/REDTEAM-VALIDATION.md)). The consolidated account is **[docs/REGISTER-PROGRAM.md](docs/REGISTER-PROGRAM.md)**. All of it is in the ledger. The LLM-authorship question itself has now been measured from both sides under disclosed inside conditions: cold-context generated **runbooks** earn the family at 4.2% vs the 1.6–2.0% human baseline, every positive structural ([docs/LLM-RUNBOOK-VALIDATION.md](docs/LLM-RUNBOOK-VALIDATION.md)), while cold-context generated **rollout plans** earn **0.0%** vs the 11.6% mandated-questionnaire baseline ([docs/LLM-PLAN-VALIDATION.md](docs/LLM-PLAN-VALIDATION.md)) — the binding the evaluator credits is carried by genre convention, not authorship, which means an LLM's spontaneous plan output does not reach `OPERATIONALLY SOUND` unless it actually binds thresholds to responses in text. The pure form stands: a labelled corpus of operational AI outputs prompted by someone who hasn't read this repository is still the most valuable possible contribution — and it is now a drop-in pipeline: **[docs/CONTRIBUTING-CORPUS.md](docs/CONTRIBUTING-CORPUS.md)** has the recipe, format, and a pre-registered evaluation harness you can run yourself.

The same discipline has been turned inward, on the system's own runtime adaptation. Since v3.38.0 the operational tier **acts on its own memory** — pattern win-rates recalibrate the Parliament — under a contract of loudness rather than the January monolith's silence: every self-change is ledgered with its evidence, stamped on every verdict it touches, clamped, reversible, and reproducible given the exported state, and the analyzer without a calibration argument is byte-identical to the certified factory instrument ([progression.js](progression.js), pinned by [run-progression-tests.js](run-progression-tests.js)). Three pre-registered runs then took the loop from unit-tested to characterized: replayed over **240** committed real operational documents it moved **zero** verdicts and kept every clause of the loudness contract ([docs/PROGRESSION-AUTONOMY-VALIDATION.md](docs/PROGRESSION-AUTONOMY-VALIDATION.md)); replayed over the **611** Kubernetes KEPs — the one register with flagship verdicts near the decision boundary — it moved **zero**, because all 66 arrive via count routes the calibration lever cannot touch ([docs/KEP-BOUNDARY-PROBE.md](docs/KEP-BOUNDARY-PROBE.md)); and against a **white-box attacker** who engineers the input stream to reach that boundary it minted **nothing** across 49 grooming-target pairs, blocked by three independent walls — an arithmetic ceiling, disjoint firing bands, and pattern coupling ([docs/AUTONOMY-ADVERSARY-VALIDATION.md](docs/AUTONOMY-ADVERSARY-VALIDATION.md)). The consolidated account is **[docs/AUTONOMY-PROGRAM.md](docs/AUTONOMY-PROGRAM.md)**; its one named-but-unfixed residue (ledger chatter) and its out-of-scope boundary (an attacker who edits the exported state directly) are in the ledger.

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
build-demo.js             Generates both standalone demo files from the tested modules
legacy/                   The original all-in-one HTML and its extraction script (untested; see legacy/README.md)
docs/                     Architecture and tier-by-tier findings
experimental/             Exploratory instruments built around the core — see its README
```

The **[`experimental/`](experimental/)** directory contains ~30 heuristic modules (ensembles, drift trackers, session memory, dashboards, an AI-to-AI protocol…) from this project's exploratory phase. They are interesting, unvalidated, and clearly labeled as such. The core evaluator does not depend on any of them.

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
