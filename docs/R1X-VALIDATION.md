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

## Status

R1 graduates from "validates intended behavior on curated cases" to "separates real from structurally-destroyed dialogue on external corpora, with quantified blind spots." Next per roadmap: the same-topic shuffle control, an AI–AI population, and R2 semantic uptake under the determinism constraint.
