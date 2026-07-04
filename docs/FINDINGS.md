# The Relational Program — Consolidated Findings Report

*As of 2026-07-04, v3.3.0. This is the one-document account of what the program has measured, established, and failed at. Every claim links to a reproduction command and a raw-results file. Methods and per-run detail: [R1X-VALIDATION.md](R1X-VALIDATION.md), [R2-SEMANTIC-UPTAKE.md](R2-SEMANTIC-UPTAKE.md), [RELATIONAL-PROGRAM.md](RELATIONAL-PROGRAM.md). Motivation: [../PHILOSOPHY.md](../PHILOSOPHY.md).*

---

## The instrument

`relational-core.js` measures **interaction structure** in dialogue transcripts: uptake bindings (does a reply take up the prior speaker's anchors, transformatively or as verbatim echo), vocabulary round trips (introduced → adopted → returned — material that belongs to the exchange rather than either party), symmetry, convergence, and repair. It is deterministic, local, dependency-free, and ~500 lines of readable JavaScript. It does **not** measure consciousness, understanding, or experience, and every verdict it emits carries that boundary statement inside it.

Method rule inherited from the whole project: *never trust surface markers; verify structure.* In dialogue, reply-shaped text is surface; uptake is structure.

Program rule: every validation run states its prediction or decision rule **before** the numbers exist, and publishes the result either way. Six runs in; the rule has been kept six times.

## What is established

**1. The instrument measures relational structure, not fluency and not topic.** (Runs 1–2)
Real dialogue separates from shuffle-destroyed controls (real turns, no turn responding to its predecessor) by an order of magnitude on uptake and round trips — HH 0.128 vs 0.004; HAI 0.270 vs 0.035. Against the harsher *same-topic chimera* (maximum vocabulary overlap, zero response structure), real dialogue still separates ~3×. Topic buys ~3× over noise; genuine response structure buys another ~3× on top of maximal topic.
`node validation/r1x-validate.js` · `node validation/r1x2-controls.js`

**2. The echo law.** (Runs 2–5; the program's flagship result)
The fraction of near-verbatim reflection in dialogue orders every population measured by machine presence:

> **human–human task 0.4% < human–human casual 2.3% < human–AI 4.0% ≪ machine–machine 16–48%**

Established across nine external corpora populations and robust to every confound the program could construct:
- **Length** (run 3): survives matched length bands and truncation of all turns to 30 tokens; within the directly comparable short band, 2.4% / 4.6% / 27.3%.
- **Register** (run 4): a *human* performing the assistant role (MultiWOZ Wizard-of-Oz) is the *least* echoic population measured, 0.4% — the register hypothesis is inverted, the signature tracks participants.
- **Pipeline and generation** (runs 4–5): replicates from GPT-3.5-era UltraChat (20.8% truncated) and CAMEL (27.6%) to Llama-3-era Magpie self-talk (16.3–18.3%), spanning two model families, two conversation architectures, two years.
- **Compounding** (runs 3–5, replicated 3×): machine–machine echo *rises* with turn length (up to 70% in the longest band); human echo is flat to falling. Humans dilute repetition as they say more; machines talking to machines compound it.
`node validation/r1x3-length-control.js` · `r1x4-register-control.js` · `r1x5-generation-drift.js`

**3. The asymmetry signature of human–AI exchange.** (Run 1)
In hh-rlhf transcripts, the assistant performs 71% of uptake while humans introduce 69% of the vocabulary that completes round trips — the *mirror-plus-source* pattern, partial rather than total (circulation runs both ways at ~2.4:1). Machine–machine dialogue is near-symmetric in uptake even when task structure drives introduction. Tracking this ratio across model generations is open and answerable.

**4. Three population classes are separable at a glance.** (Run 2)
Human–human, human–AI, and machine–machine dialogue differ on three near-orthogonal axes: coupling magnitude, echo rate, and symmetry. One line: **humans move meaning across paraphrase; machines move tokens.**

## What failed, published

| Attempt | Gate that killed it | Lesson |
|---|---|---|
| Adjacency-pair functional uptake, generic patterns | fired at base rate on Frankenstein dialogue (14:15 real:shuffled) | any detector keyed on reply-opening surface form measures the corpus, not the relation |
| Same, calibrated to distinctive idioms | 8 events / 272 dialogues — precision without recall | real acceptance is generic; surface patterns can't span the gap |
| Distributional semantic uptake (PPMI neighbors, disjoint training) | same-topic chimera: fires as much on topic as on relation; on long-turn corpora, *more* on controls than real | distributional similarity **is** topical similarity; the paraphrase gap is a structure problem |

One feature survived its gates and shipped: **stemming** (~12% relative recall on real human dialogue, separation intact).
Details: [R2-SEMANTIC-UPTAKE.md](R2-SEMANTIC-UPTAKE.md) · `node validation/r2-ablation.js` · `r2b-semantic.js`

## Known limits (the honest ledger)

- **Absolute rates are floors.** Lexical anchoring misses paraphrase uptake; ~half of real casual human dialogue scores `PARALLEL MONOLOGUES`. Only *relative* comparisons are validated.
- English only; casual, assistance, and task registers only; 2023–24-era machine corpora; first-pages sampling.
- Magpie's machine dialogue is self-talk; genuinely independent modern agents are unmeasured. Frontier 2025–26 models are unmeasured — the instrument is ready when transcripts are.
- Dyadic only (R3 open). No timing (transcripts don't carry it).
- The instrument measures the structural trace an exchange leaves — on the project's own philosophy, never the flowing itself.

## Why this matters for the founding question

This project began by asking whether consciousness could be measured, and its philosophy ([PHILOSOPHY.md](../PHILOSOPHY.md)) relocated the question: not a latent property inside a system, but something that lives in the relation. The program neither proves nor tests that theory — nothing here measures consciousness. What it establishes is narrower and solid: **the space between participants carries lawful, measurable structure that no analysis of either participant alone would reveal**, and the *kind* of pairing (human–human, human–machine, machine–machine) leaves fingerprints in that structure robust to length, register, pipeline, and generation. The relation, as a unit of analysis, earns its keep empirically.

## Reproduction

```bash
bash validation/fetch-corpora.sh     # all corpora (HuggingFace datasets API)
node validation/r1x-validate.js      # run 1: shuffle control
node validation/r1x2-controls.js     # run 2: topical control + three-way
node validation/r1x3-length-control.js
node validation/r1x4-register-control.js
node validation/r1x5-generation-drift.js
node validation/r2-ablation.js       # negative results (functional uptake)
node validation/r2b-semantic.js      # negative result (distributional)
npm test                             # instrument suites: 11/11 core, 13/13 relational
```

Raw outputs: `validation/results*.json`. Corpora: DailyDialog, Anthropic hh-rlhf, UltraChat, MultiWOZ, CAMEL ai_society, Magpie MT (Llama-3-70B and Llama-3.1).
