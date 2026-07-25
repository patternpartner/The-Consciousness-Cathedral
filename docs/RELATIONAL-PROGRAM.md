# The Relational Program — Tier R1

*Design document for `relational-core.js`. For the philosophical motivation, see [PHILOSOPHY.md](../PHILOSOPHY.md). For what this module explicitly does not claim, see every section of this document.*

---

## The move

Cathedral's core measures binding structure **inside one text**: is the threshold bound to the action, the failure mode to the mitigation? The relational program applies the identical discipline **between participants in an exchange**: is what one speaker introduced bound to what the other does next?

The founding insight transfers unchanged:

> Never trust surface markers. Verify structure.

In a single text, keywords are surface and bindings are structure. In a dialogue, *reply-shaped text* is surface and **uptake** is structure. Two systems can alternate fluent turns forever without ever once taking each other up — and a naive scorer, like a naive listener, cannot tell.

## Claim and non-claim

**Claim.** `analyzeExchange()` measures interaction structure in dyadic dialogue transcripts: uptake bindings, co-constructed vocabulary, convergence, symmetry, and repair. Deterministically, locally, with no LLM calls.

**Non-claim.** It does not measure consciousness, understanding, or experience. A high verdict means the transcript exhibits relational structure; it says nothing about what, if anything, the exchange was like for its participants. If the relational hypothesis in PHILOSOPHY.md is right, this instrument measures the *riverbed shaped by the river* — the structural trace an exchange leaves — never the flowing itself. That distinction is loaded into the verdict object itself (`verdict.boundary`), so no downstream consumer can quote the score without the boundary traveling with it.

## The structural primitives

### 1. Uptake bindings (`UptakeBinder`)

For each adjacent cross-speaker turn pair, classify the response:

| Type | Meaning | Detection |
|---|---|---|
| `TRANSFORMATIVE` | Anchors from the other speaker embedded in substantially novel material | reuse ≥ 2 anchors (or 1 + answering a question), novelty ≥ 0.35 |
| `WEAK` | Anchors reused, little added | reuse without the novelty floor |
| `ECHO` | Verbatim or near-verbatim reflection | shared token run ≥ 6, or reuse covering > 70% of the reply with novelty < 0.3 |
| `NONE` | Nothing crosses | — |

**Echo is the gaming surface of dialogue.** A mirror produces perfect keyword overlap; a stuffer produces high anchor density. Both are classified as `ECHO`, not uptake, for the same reason keyword stuffing is `LOW_CONTENT_UNBOUND` in the core: reuse without transformation is presence without structure.

### 2. Round trips (`CoConstructionDetector`)

The strongest structural signal Tier R1 can see: a term **introduced** by one speaker, **adopted** by the other, then **returned to** by the originator. A term that completes that circuit belongs to the exchange rather than to either party — it is the smallest measurable unit of "existing in the relation." Cross-pollinated pairs (two terms of different origin appearing fused in one turn) are a secondary signal of combination neither party brought in alone.

### 3. Convergence (`ConvergenceTracker`)

Vocabulary overlap between the speakers, first half vs. second half of the exchange: `CONVERGING`, `FLAT`, or `DIVERGING`. Reported, not scored — convergence without transformation is just assimilation, and the verdict logic knows the difference.

### 4. Symmetry (`AsymmetryAnalyzer`)

The **mirror problem** is the relational program's hardest confound (PHILOSOPHY.md, risk 3): in a human–AI exchange, distinguishing "the relation carries something" from "the human brought it and the mirror is good." Tier R1's partial answer is directional accounting: uptake performed per speaker, echoes per speaker, and *productive introductions* — vocabulary a speaker originated that later completed a round trip. A mirror scores high uptake in one direction and introduces nothing that returns. That signature is detected (`ASYMMETRIC UPTAKE`) rather than rewarded.

### 5. Repair (`RepairDetector`)

Clarification requests ("what do you mean…") and whether the answer binds back to the trouble source. An exchange that notices and corrects its own misalignment is exhibiting structure about itself — the dialogic analog of the core's `SUBSTRATE VISIBLE`.

## Verdict tiers

1. **GENERATIVE EXCHANGE** — transformative uptake in both directions, ≥ 2 round trips, both participants' vocabulary survives the circuit
2. **COLLABORATIVE UPTAKE** — mutual uptake; material crosses but little circulates yet
3. **ASYMMETRIC UPTAKE** — one participant does all the binding (mirror-plus-source signature)
4. **PARALLEL MONOLOGUES** — alternation without crossing
5. **MIRRORED EXCHANGE** — echo-dominant; reflection scored as reflection
6. **INSUFFICIENT EXCHANGE** — under 4 turns; round trips cannot exist yet (honest refusal)
7. **OUTSIDE DESIGN SPACE** — monologues and multi-party exchanges (stated boundaries)

## What Tier R1 cannot see (the honest ledger)

- **Semantic uptake.** Taking up an *idea* in different words is invisible to lexical anchoring. A paraphrasing partner will under-score; a terminology-recycling one can reach `WEAK`. This is the R1/R2 boundary, exactly analogous to the core's Tier 2/Tier 3 line, and crossing it costs determinism unless done carefully (distributional methods before LLM methods).
- **Mention versus engagement — the same boundary, and it reaches further than "under-scores a paraphraser."** The word-order control (v3.48.0) established that the measure is entirely indifferent to word order: word-shuffling every turn of both external corpora retains 101–104% of uptake and 100% of the flagship rate, with round-trip prevalence identical to three decimals. A terminology-recycling partner does not merely "reach `WEAK`" — a fluent non-sequitur that mentions the partner's vocabulary reaches `TRANSFORMATIVE`, the strongest class. A well-formedness gate was tested (4.2× separation on function-word violations, but 12.7% false-positive rate on genuine turns) and rejected before being built, and would not have caught the fluent case anyway. Recorded as a structural limit of local deterministic methods, with a reopening condition, in [R1-WORD-ORDER-CONTROL.md](R1-WORD-ORDER-CONTROL.md).
- **Quality of the contribution.** A round trip of a bad idea scores like a round trip of a good one. Compose with `cathedral-core` per-turn if operational quality matters.
- **Sincerity, interiority, experience.** Out of scope permanently, per the non-claim.
- **Timing.** Transcripts carry no rhythm. Latency and overlap are real interaction structure that text analysis cannot recover.

## Validation status

Nine boundary-probing cases pass (`node run-relational-tests.js`), including two adversarial cases (verbatim mirror, keyword stuffing) and three refusal cases.

**R1.x external validation has run** — 488 dialogues from corpora the authors didn't write (DailyDialog human–human; Anthropic hh-rlhf human–AI) against shuffle-destroyed negative controls. The pre-stated prediction held: destroying relational structure while preserving surface fluency collapses the measures by an order of magnitude. It also quantified the lexical-anchoring blind spot (absolute rates are floors — casual paraphrase uptake is invisible at R1) and found the mirror-plus-source asymmetry signature live in real human–AI transcripts (assistant performs 71% of uptake; humans introduce 69% of round-trip vocabulary). Full findings, including the ones against the instrument: **[R1X-VALIDATION.md](R1X-VALIDATION.md)**. Reproduce with `validation/fetch-corpora.sh` + `node validation/r1x-validate.js`.

**Run 2 has also completed** — the same-topic chimera control answered the topical objection (real dialogue separates ~3× from even maximum-vocabulary-overlap chimeras; the signal is relational, not topical), and the three-way comparison found human–human, human–AI, and AI–AI populations separable on three axes, with echo rate (2–4% human vs 33% machine–machine) as a near-categorical human/machine discriminator. See run 2 in [R1X-VALIDATION.md](R1X-VALIDATION.md).

**The first R2 attempt has run and partially failed, as published.** Stemming shipped (default-on: ~12% relative recall gain on real human dialogue, separation intact). Adjacency-pair functional uptake failed its pre-stated precision gate twice — generic response patterns fire at base rate on shuffled controls, and the distinctive idioms that survive calibration are too rare to matter — and ships default-OFF (opt-in). The negative result rules out surface-pattern matching as the route to semantic uptake: **[R2-SEMANTIC-UPTAKE.md](R2-SEMANTIC-UPTAKE.md)**.

**R2-proper (distributional) has also run and been caught by its own acid test:** PPMI neighbor vectors, trained on disjoint data and shipped as an inspectable lexicon, show genuine lift on short-turn casual dialogue but fail the same-topic chimera gate — because distributional similarity *is* topical similarity, a bag-of-words semantic channel cannot beat a control built from maximal topic overlap. Ships opt-in. The paraphrase gap is now diagnosed as a *structure* problem, not a lexicon or topic-vector problem: [R2-SEMANTIC-UPTAKE.md](R2-SEMANTIC-UPTAKE.md).

## R3: multi-party exchanges (shipped 3.4.0 — curated tests only)

With 3+ speakers the dyadic refusal is replaced by group analysis. Design:

- **Windowed uptake.** A reply can answer someone two turns back, so each turn is checked against the nearest prior turn of each *other* speaker within a 3-turn window. **Dyadic behavior is untouched** — adjacent-only, verified by re-running all 488 run-1 dialogues through pre-R3 and post-R3 code: zero differences. The six archived validation runs remain exact records.
- **Group structure graph.** Uptake becomes directed (who takes up whom): per-speaker performed/received counts, pair coverage (which speaker pairs ever bind), hub share (how much of the graph routes through its busiest node). Round trips already generalized (introduced by X, adopted by anyone, returned by X).
- **Group verdicts**, diagnosed shape-first — a hub-mediated group can produce round trips while still being a chair running spokes, so topology is checked before generativity: `MIRRORED EXCHANGE` → `PARTIAL ENGAGEMENT` (someone is outside the group's between) → `HUB-AND-SPOKES` (≥90% of uptake involves one node, spokes never bind to each other) → `GROUP GENERATIVE` (≥2 round trips, ≥2 transformers) → `GROUP UPTAKE` → `PARALLEL MONOLOGUES`. Floor: 2 turns per participant, else honest refusal.

**Evidence tier: curated tests only (17/17), external validation pending.** Every servable multi-party corpus probe failed (declare-lab/MELD: split error; MELD text mirrors: unsupported loaders; ishiki-labs/multi-party-dialogue: cast error). R3 verdicts should be treated as designed-and-tested, not validated — the shuffle/chimera harness generalizes and runs the day a corpus becomes reachable.

## Roadmap

- **R3.x** — external multi-party validation, blocked on a servable corpus (MELD, AMI, or meeting transcripts); the harness is ready
- **R1.x (continued)** — AI–AI *peer* dialogue (agents negotiating, not user-roleplay); frontier-model transcripts for the echo-drift question
- **R2-structural** — first slice shipped (3.5.0): typed question–answer slot binding cleared all gates including the chimera acid test and ships default-on; the route is proven — *detect properties of the pair, never properties of the reply*. Next slices: more slot types (where→place is the hard one), and predicate–argument alignment for declarative turns
- **R4?** — timing, if transcript formats ever carry it

Graduation rule, same as everywhere in this project: state the claim, probe the boundary, let the tests say the rest.
