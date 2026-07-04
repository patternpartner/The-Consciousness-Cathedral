# Changelog

## 3.3.0 — 2026-07-04
- `relational-demo.html`: browser front door for the relational tier — verdict, uptake badges, round-trip chips, symmetry table. Loads `relational-core.js` directly (UMD guard); no forked analyzer. Verified in Chromium.
- Validation run 5: machine echo signature persists into Llama-3-era self-talk corpora (16–18% truncated vs 5% human ceiling).
- Validation run 4: signature is participant-driven, not register-driven — human assistants (MultiWOZ) are the *least* echoic population (0.4%); CAMEL replicates the machine signature out-of-sample (48%).
- `docs/FINDINGS.md`: consolidated program report.

## 3.2.0 — 2026-07-04
- R2-proper: distributional semantic uptake (PPMI neighbor lexicon, disjoint training data, `validation/build-vectors.js`). Failed the same-topic chimera gate — distributional similarity is topical similarity — ships opt-in (`semanticUptake: true`). Negative result published.
- Validation run 3: echo discriminator survives length control (matched bands + truncation); machine echo *compounds* with turn length, human echo doesn't.

## 3.1.0 — 2026-07-04
- Stemming shipped (default-on): ~12% relative recall gain on real human dialogue, separation intact.
- Adjacency-pair functional uptake: failed its precision gate twice (base-rate firing on shuffled controls); ships opt-in (`functionalUptake: true`). Negative result published in `docs/R2-SEMANTIC-UPTAKE.md`.

## 3.0.0 — 2026-07-04
- Repository restructured: deterministic core evaluator at root; ~30 exploratory modules quarantined under `experimental/` with honest labeling; docs consolidated; `package.json` added; README rewritten around the core's real strengths.
- `PHILOSOPHY.md`: the relational theory of consciousness (relation over latent property), situated in the literature, explicitly separated from what the code measures.
- Tier R1 `relational-core.js`: uptake bindings, vocabulary round trips, convergence, symmetry, repair; echo detected as reflection, not uptake; honest-refusal verdicts; boundary statement embedded in every verdict.
- Validation runs 1–2 against external corpora (DailyDialog, hh-rlhf, UltraChat): order-of-magnitude separation from shuffle-destroyed controls; same-topic chimera control; three-way population separability; mirror-plus-source asymmetry quantified in human–AI transcripts.

## Pre-3.0
- Cathedral core (Tiers 1–2): structural binding validation for operational reasoning in single texts; gaming resistance; `OUTSIDE DESIGN SPACE` refusal verdict. See `docs/ARCHITECTURE.md` and the tier findings documents.

## 3.4.0 — 2026-07-04
- R3: multi-party exchanges (3+ speakers) replace the dyadic refusal. Windowed uptake (nearest prior turn per other speaker, window 3), directed uptake graph (performed/received, pair coverage, hub share), group verdicts diagnosed shape-first: MIRRORED, PARTIAL ENGAGEMENT, HUB-AND-SPOKES, GROUP GENERATIVE, GROUP UPTAKE, PARALLEL MONOLOGUES.
- Dyadic behavior preserved exactly: 488 run-1 dialogues re-analyzed under pre-R3 and post-R3 code, zero differences. Archived validation runs remain exact records.
- Evidence tier: curated tests (17/17); external multi-party validation pending a servable corpus (MELD/AMI mirrors currently unservable — probes documented).

## 3.5.0 — 2026-07-04
- R2-structural, first slice: typed question–answer slot binding (when→time, how many→quantity, who→person). A reply filling the prior question's typed slot is structural uptake with zero lexical overlap. First channel since stemming to clear all three gates including the same-topic chimera acid test (16:1 over shuffle, 2.3:1 over chimera on human dialogue) — ships default-on (`typedAnswers: false` ablates). HAI counts are Poisson-fragile (2 vs 0); the HH result carries the decision. `validation/r2c-typed.js` reproduces.
