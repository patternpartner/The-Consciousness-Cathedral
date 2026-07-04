# R1.x Validation — First Run Against External Transcripts

*2026-07-04. Corpora the authors did not write, scored by `relational-core.js` exactly as shipped (no threshold tuning before or after seeing results). Reproduce with `validation/fetch-corpora.sh` then `node validation/r1x-validate.js`; full numbers in `validation/results.json`.*

---

## Setup

**Populations:**

- **HH-real** — 272 human–human dialogues (DailyDialog, Li et al. 2017; casual conversation, ≥4 turns)
- **HAI-real** — 216 human–AI dialogues (Anthropic hh-rlhf "chosen" transcripts, ≥4 turns)
- **HH-shuffled / HAI-shuffled** — negative controls built from the same corpora: each dialogue keeps its length and speaker pattern, but every turn is drawn from a *different* randomly chosen dialogue (seeded, reproducible). Every turn is real, fluent dialogue text; no turn is a response to the one before it. Surface preserved, relational structure destroyed by construction.

**The pre-stated prediction** (docs/RELATIONAL-PROGRAM.md, written before this run): real dialogue must show more uptake and more round trips than its shuffled control. If not, the measures fail, and the failure is published.

## Result: the prediction held, decisively

| Population | n | Uptake rate | Round-trip dialogues | Mean round trips |
|---|---|---|---|---|
| HH-real | 272 | **0.128** | **28.3%** | 0.47 |
| HH-shuffled | 272 | 0.004 | 1.5% | 0.02 |
| HAI-real | 216 | **0.270** | **44.0%** | 0.80 |
| HAI-shuffled | 216 | 0.035 | 4.2% | 0.06 |

Destroying relational structure while preserving surface fluency collapses the measures by an order of magnitude or more (≈30× uptake separation for HH, ≈8× for HAI; ≈19× and ≈10× on round-trip prevalence). **The instrument is measuring something real about exchanges that is not present in fluent turn-alternation alone.** A keyword-density or fluency-based scorer would rate the shuffled controls nearly identically to the originals; this one does not.

## Finding 2: the asymmetry signature appears in real human–AI dialogue

In HAI-real, the modal verdict is `ASYMMETRIC UPTAKE` (94/216). Direction analysis:

- Uptake performed: **Assistant 214, Human 87** (71% / 29%)
- Round-trip vocabulary introduced: **Human 118, Assistant 54** (69% / 31%)

This is precisely the *mirror-plus-source signature* the philosophy document flagged as the relational program's hardest confound: in these 2022-era assistant transcripts, the human predominantly introduces and the assistant predominantly takes up. But the signature is partial, not total — humans do perform uptake (87 events) and assistant-introduced terms do complete round trips (54) — so material circulates in both directions at roughly a 2.4:1 asymmetry. The instrument can now put a number on how mirror-like a given human–AI exchange is. Tracking that ratio across model generations is an open, answerable question.

## Finding 3 (against the instrument): lexical anchoring under-detects casual uptake

52% of *real* human–human dialogues scored `PARALLEL MONOLOGUES`. Human casual conversation obviously has more uptake than that — *"How about a few beers after dinner?" / "Sounds great"* is genuine uptake with zero lexical overlap. Tier R1's lexical anchoring cannot see semantic uptake, exactly as the honest ledger predicted; this run quantifies the cost: **absolute R1 rates are floors, not measurements.** Short-turn casual talk suffers most (HAI's longer turns give anchoring more surface, which partly explains its higher rates).

Consequences:

1. **Only relative comparisons are validated.** Real vs. shuffled separation is solid; "this dialogue has uptake rate 0.13" as an absolute claim is not.
2. **R2 (semantic uptake) is now motivated by data**, not just by roadmap: closing the paraphrase gap is worth roughly a 4–8× recall improvement on casual dialogue if the *beers→sounds-great* class of uptake is representative.

## Finding 4: verbatim echo is rare in the wild

Echo rates: 2–4% in real populations, ~0% in shuffled. Real interlocutors — human and AI — almost never mirror verbatim. The `ECHO`/`MIRRORED EXCHANGE` machinery therefore functions as an adversarial defense (against gaming and degenerate loops) rather than a common-case classifier, matching its design intent.

## Threats to validity

- DailyDialog and hh-rlhf are English; casual and assistance registers only. No claim beyond those.
- 300 rows sampled per corpus (first pages, not random). Positional bias is possible but implausible as an explanation for order-of-magnitude separations.
- The shuffled control destroys *all* cross-turn structure (topical and relational at once). A stricter control — same-topic turns shuffled across dialogues — would isolate relational from topical coherence, and is the right next control to build.
- One author-family of instruments and corpora choices; independent replication welcome — the run is two commands.

## Status after run 1

R1 graduates from "validates intended behavior on curated cases" to "separates real from structurally-destroyed dialogue on external corpora, with quantified blind spots."

---

# Run 2 — Same-Topic Control and the Three-Way Comparison

*Same date. Two questions run 1 left open. Reproduce: `node validation/r1x2-controls.js`; numbers in `validation/results-run2.json`. Predictions P1/P2 were committed to code before the numbers existed.*

## Q1: Is the signal relational, or just topical coherence?

The run-1 shuffle destroyed topic and response structure together. Run 2 adds a **same-topic chimera**: each dialogue is paired with its most lexically similar *other* dialogue (nearest neighbor by vocabulary Jaccard — a deliberately harsh pairing that maximizes shared vocabulary), then one speaker's turns are swapped for the partner's. Same subject, maximal word overlap, zero response structure.

| Population | Uptake | Round-trip dialogues |
|---|---|---|
| HH-real | **0.128** | **28.3%** |
| HH same-topic chimera | 0.043 | 11.0% |
| HH random shuffle | 0.004 | 1.5% |
| HAI-real | **0.270** | **44.0%** |
| HAI same-topic chimera | 0.102 | 16.2% |
| HAI random shuffle | 0.035 | 4.2% |

**P1 held. P2 held.** The clean three-step gradient is the result: topic overlap alone buys roughly a 3× lift over random (P2 — the control is doing its job), and real response structure buys a further ~2.6–3× over even maximum-vocabulary-overlap chimeras (P1). The measures are substantially relational, not just topical. The topical objection is answered with data.

## Q2: Are human–human, human–AI, and AI–AI exchanges separable?

Third population: UltraChat — an LLM roleplaying a user in conversation with an LLM assistant; both sides machine-generated (n=300, ≥4 turns).

| Population | Uptake | Echo | Round-trip dialogues | Mean round trips |
|---|---|---|---|---|
| HH (DailyDialog) | 0.128 | 0.021 | 28.3% | 0.47 |
| HAI (hh-rlhf) | 0.270 | 0.039 | 44.0% | 0.80 |
| AIAI (UltraChat) | 0.611 | **0.331** | 97.7% | 7.72 |

Separable at a glance, on three near-orthogonal axes:

1. **Lexical coupling ladder.** HH < HAI < AIAI on every uptake measure. Partly a turn-length confound (longer turns give lexical anchoring more surface — noted below), but the size of the AIAI jump exceeds what length alone plausibly buys.
2. **The echo axis — the sharpest discriminator found so far.** A third of AI–AI cross-turn responses are near-verbatim echoes, against 2–4% for any population containing a human. 85/300 AIAI dialogues verdict `MIRRORED EXCHANGE`; approximately zero human dialogues do. The ECHO machinery was designed as an adversarial defense against gaming; in the wild it turns out to be a live natural signature of machine-to-machine dialogue. Run 1's conclusion ("echo is rare in the wild") holds only for humans — and that restriction *is* the finding: **humans move meaning across paraphrase; these models move tokens.** Human uptake is lexically loose and semantically tight; LLM uptake is lexically sticky.
3. **The symmetry axis.** HH mildly asymmetric (positional), HAI strongly asymmetric (assistant does 71% of uptake — the mirror-plus-source signature), AIAI nearly perfectly symmetric in uptake (464 vs 493) while the simulated user still drives introduction (1411 vs 906 round-trip terms) — task structure surviving even when both parties are the same kind of machine.

The AIAI verdict split is itself diagnostic: 128 `GENERATIVE EXCHANGE` alongside 85 `MIRRORED EXCHANGE`. Machine dialogue is lexically hyper-coupled, and R1 splits that coupling into circulation (transformed reuse) and reflection (verbatim reuse) — precisely the distinction it was built to make.

## Additional threats to validity (run 2)

- **Turn length** differs enormously across populations (UltraChat turns are essay-length). The echo *ratio* is less length-sensitive than raw uptake, but long turns do raise the chance of ≥6-token verbatim runs; a length-controlled comparison is the right follow-up.
- **Register confound**: casual chat vs. assistance vs. instruction-following aren't the same speech genre. Population differences bundle genre with participant type.
- UltraChat's "user" is an LLM *prompted to act like a user* — a genuine AI–AI exchange, but not a symmetric free dialogue between peers. AI–AI peer conversation (e.g., two agents negotiating) remains unmeasured.

## Status after run 2

Both pre-stated predictions held; the three-way separability question is answered **yes**, with the echo axis as an unexpected, near-categorical human/machine discriminator. Next: length-controlled comparison, AI–AI peer dialogue, and R2 semantic uptake — whose absence is now quantified from both directions (it under-counts humans, and its lexical proxy over-counts machines).

---

# Run 3 — Length Control: the Echo Discriminator Is Not an Artifact

*Same date. Run 2 flagged its own confound: UltraChat turns are essay-length, and longer adjacent turns give a ≥6-token verbatim run more chances to occur. This run controls for it two ways, with the prediction stated first: the AIAI-vs-human echo separation must survive within matched length bands and under truncation, or the flagship finding gets downgraded here, prominently. Reproduce: `node validation/r1x3-length-control.js`; numbers in `validation/results-run3.json`.*

## Matched bands — echo rate by min(prev, cur) turn tokens

| Band | HH | HAI | AIAI |
|---|---|---|---|
| 3–15 tokens | 2.4% [n=1475] | 4.6% [n=818] | **27.3%** [n=161] |
| 15–40 tokens | 0.9% [n=326] | 3.1% [n=196] | **30.8%** [n=1045] |
| 40–100 tokens | 0.0% [n=7]\* | 0.0% [n=9]\* | 43.6% [n=307] |
| 100+ tokens | — | — | 69.8% [n=53] |

\* below the pre-stated n≥30 comparability floor; not scored.

**All four comparable cells passed** (AIAI > 3× the human rate at matched length), and truncating every turn to its first 30 tokens across all populations leaves the separation intact (2.2% / 3.1% / **20.8%**). The prediction held: the echo discriminator is a property of *who is talking*, not of how long they talk.

## The bonus finding: echo grows with length — in machines only

Within AIAI, echo climbs monotonically with turn length: 27% → 31% → 44% → 70%. Within the human populations it is flat to *falling* (HH: 2.4% → 0.9%). Longer human turns add novel material; longer machine turns add more of each other. This sharpens run 2's one-liner into something quantitative: **human dialogue dilutes repetition with length; machine–machine dialogue compounds it.** The 100+ band — where 70% of long AI-to-AI replies are near-verbatim reflections of long prior turns — is the purest picture of lexical hyper-coupling in the data.

The lexical-coupling ladder also survives length control: within the 3–15 band, uptake runs HH 11.9% < HAI 24.9% < AIAI 60.2% — the run-2 ordering at matched length.

## Status after run 3

The flagship finding is hardened: the run-2 threat-to-validity ("turn length differs enormously across populations") is now retired for the echo axis and the coupling ladder. Remaining open fronts: AI–AI *peer* dialogue (UltraChat's user-side is a roleplaying LLM, not a peer), register confounds, and R2-structural.

---

# Run 4 — Participant vs Register: the 2×2 Completed

*Same date. Every machine–machine sample so far was in the assistant register, so "machines echo" and "assistants echo" were not yet separable. Two new populations complete the decomposition: MultiWOZ (human–human Wizard-of-Oz task dialogues — a HUMAN plays the assistant; assistant register, zero machines) and CAMEL ai_society (two LLM agents collaborating on tasks — machines, different register, different generation pipeline than UltraChat). Predictions stated first; reproduce with `node validation/r1x4-register-control.js`; numbers in `validation/results-run4.json`.*

## Results

| Population | Echo | Echo (trunc-30) | Band 3–15 | Band 15–40 |
|---|---|---|---|---|
| HH-task (MultiWOZ, human assistant) | **0.4%** | 0.4% | 0.6% [n=1769] | 0.0% [n=292] |
| HH-casual (DailyDialog) | 2.3% | 2.2% | 2.4% | 0.9% |
| HAI (hh-rlhf) | 4.0% | 3.1% | 4.6% | 3.1% |
| AIAI-assist (UltraChat) | 34.3% | 20.8% | 27.3% | 30.8% |
| AIAI-task (CAMEL) | **48.1%** | 27.6% | 35.2% [n=349] | 46.9% [n=616] |

**P1 held, inverted for emphasis:** the human in the assistant role is not machine-like — human task dialogue is the *least* echoic population measured, five times below casual human conversation. Whatever the assistant register does to a human, it is the opposite of what generation does to a machine. **P2 held:** CAMEL, from an entirely different pipeline, shows the machine signature at full strength — stronger than UltraChat, in every control condition.

## The finding, in its final form

Echo rate now orders five external populations **perfectly by machine presence, across two registers, two machine pipelines, all length bands, and truncation**:

> human–human task 0.4% < human–human casual 2.3% < human–AI 4.0% ≪ machine–machine 34–48%

The signature is participant-driven, replicated, and robust to every confound the program has been able to construct against it. As a bonus, CAMEL also replicates run 3's compounding effect: machine–machine echo *rises* with turn length (35.2% → 46.9% across bands) while human echo falls (2.4% → 0.9%; MultiWOZ 0.6% → 0.0%).

## Threats to validity (run 4)

- MultiWOZ operators compose responses under a Wizard-of-Oz protocol with time to type — a *deliberate* register, which may suppress echo below natural human assistance. This strengthens P1's rejection of the register hypothesis but means 0.4% should not be quoted as "natural human assistant" behavior.
- CAMEL conversations carry heavy task-prompt boilerplate ("Instruction: … Output: …") that may inflate machine echo; the matched-band and truncation controls limit but do not eliminate this.
- Both machine corpora are 2023-era GPT-3.5-family generations. Whether current-generation models still carry the signature is an open, answerable question — the instrument is sitting here, deterministic, waiting for transcripts.

## Status after run 4

The echo discriminator graduates to the program's first **replicated, multiply-controlled empirical law**: *at fixed turn length, in any register tested, the fraction of near-verbatim reflection in a dialogue rises by roughly an order of magnitude when both participants are machines, and falls to near zero when both are humans working a task.* Remaining fronts: R2-structural (the paraphrase gap), model-generation drift of the echo signature, multi-party (R3).

---

# Run 5 — The Signature Across Model Generations

*Same date. Run 4 flagged that both machine–machine corpora were 2023-era GPT-3.5-family output and called the generational question "open and answerable." This run answers it with 2024-era Llama-3-family corpora: the Magpie MT datasets, where a single model generates **both** sides of each conversation. No directional prediction — a pre-stated decision rule instead: truncation-controlled echo >15% = signature present, <10% = substantially drifted, between = attenuated. Reproduce: `node validation/r1x5-generation-drift.js`; numbers in `validation/results-run5.json`.*

## Results

| Machine–machine population | Echo | Echo (trunc-30) | Verdict per rule |
|---|---|---|---|
| 2023 UltraChat (GPT-3.5, two-instance) | 34.3% | 20.8% | PRESENT |
| 2023 CAMEL (GPT-3.5, two-agent) | 48.1% | 27.6% | PRESENT |
| 2024 Magpie (Llama-3-70B, self-talk) | 26.9% | 18.3% | PRESENT |
| 2024 Magpie (Llama-3.1, self-talk) | 35.0% | 16.3% | PRESENT |

**The signature persists.** A mild attenuation is visible in the truncation-controlled numbers (2024: 16–18% vs 2023: 21–28%), but every 2024 population sits 3–4× above the human ceiling (5%) and well inside "present." The length-compounding effect also replicates in the Llama corpora (Llama-3.1: 27.7% → 30.4% → 45.9% across bands).

Two scope extensions come free: the law now spans **two model families** (GPT-3.5, Llama-3/3.1), **two conversation architectures** (two separate instances talking; one model playing both sides), and **two years of model progress**. Whatever produces machine lexical hyper-coupling, it is not a quirk of one vendor, one setup, or one training year.

## Threats to validity (run 5)

- Magpie's "user" side is the same model as the assistant side — self-talk may inflate echo relative to genuinely independent agents. Points at the still-unmeasured cell: two *different* modern models in free peer dialogue.
- All four machine corpora are instruction/assistance-flavored. A modern casual machine–machine register remains unmeasured.
- Frontier 2025–2026 models are not represented; the instrument is ready when transcripts are.

## Status after run 5

The empirical law from run 4 gains a generational clause: *machine–machine dialogue exhibits an order-of-magnitude elevation in near-verbatim reflection over any human-involved dialogue, at matched turn length, in every register, model family, conversation architecture, and model generation measured so far.* Five runs, all pre-registered, none broken. Remaining fronts: R2-structural, frontier-model transcripts, mixed-model peer dialogue, R3.
