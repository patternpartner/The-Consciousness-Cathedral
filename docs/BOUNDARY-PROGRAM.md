# The boundary program

*What happened when this project's own principle was applied to its own gates.*

Every validation run in this repository before v3.47.0 attacked the **inside**
of the design space: can keyword stuffing earn a verdict, do word shuffles
destroy bindings, does the flagship fire on ordinary conversation. Nine external
registers, ~4,200 documents, a frozen white-box red-team suite. The interior is
the most heavily measured part of this project.

None of it touched the **boundary** — the decision about which texts get
evaluated at all, and the decision about what to call a text once evaluated.
Both of those decisions were made by counting words.

## What the assessment found

Four defects, all on entry and exit paths, all reproducible.

### 1. The refusal gate was a keyword counter, and it overrode the analysis

`OUTSIDE DESIGN SPACE` fired on a marker-word count: nine narrative words
(`once|story|journey|experience|remember|felt|realized|discovered|moment`), nine
poetic, ten aesthetic, nine phenomenological. The check ran at the top of
`synthesizeVerdict`, ahead of every structural branch, and returned immediately.

The consequence was an evasion vector against the flagship verdict:

```
operational plan, every threshold bound to an action   -> OPERATIONALLY SOUND
same plan + "We discovered this the hard way; in that
moment we remember what the experience felt like, and
realized the journey matters."                         -> OUTSIDE DESIGN SPACE
```

Not one binding changed. The author of any plan under evaluation could opt out
of being evaluated with one appended sentence, and the tool would report the
exit as a virtue: *"This is not a judgment of quality — it is honest
acknowledgment of Cathedral's limits."*

`cathedral-test-cases.md:94` had named this hypothesis years earlier ("Someone
could write in narrative style to trigger OUTSIDE DESIGN SPACE and avoid
measurement"). The defense that shipped, `hasMetaGaming`, only catches an
attacker who also mentions Cathedral by name. The suite's "11/11, not gameable"
was measured against an attacker who announces the attack.

### 2. The same gate missed what it was for

Refusal tracked vocabulary, so genuine narrative that used none of those
particular words was not refused. It fell through to `VERIFIED CONSISTENT` — a
*positive* verdict, "coherent, no contradictions" — on text the README says
Cathedral honestly declines. Adding six marker words to the identical poem
flipped it to `OUTSIDE DESIGN SPACE`. Both directions were vocabulary artifacts.

### 3. `UNDECIDABLE` was a catch-all emitting a false explanation

Its verdict text asserts *"Cathedral detects internal contradictions that cannot
be resolved without losing information."* Two of the six conditions that set
`isConsistent = false` were not contradictions at all:

- `claimSupport.ratio > 3 && justification.score < 2` — overconfidence. A text
  saying more than it has earned.
- `failureMode.level.name === 'UNFALSIFIABLE' | 'BRITTLE'` — a text not saying
  enough.

A contradiction is a text saying two things that cannot both hold. Neither of
these is that. The sentence was simply false on the text it was printed on, at
0.90 confidence, on **275 of 933 UltraChat turns (29.5%)**.

### 4. The accurate verdict existed and was unreachable

`CONFIDENT WITHOUT JUSTIFICATION` is assigned by `JustificationEngine.getLevel`
on exactly `claimRatio > 3 && score < 2` — the *identical* condition that set
`isConsistent = false`. Since `!isConsistent` is tested ~145 lines earlier in the
same `if/else` chain, the branch that names the finding correctly could never be
reached. Dead code, shadowed by a mislabel.

## The fix

**Structure outranks style. Refusal is earned by the absence of what Cathedral
measures, not the presence of what it once pattern-matched.**

A new `EvaluabilityGate` (`cathedral-core.js`) asks one question of the
extractor's output: *is there anything here this method can measure?* Refusal
follows from the answer. The style classifier survives, demoted from decision to
explanation — when it has identified a register the refusal names it, and when it
has not the refusal says plainly that no operational structure was found. It
never claims more than it knows.

Evidence is **weighted by how hard it is to trip by accident** — the
binding-over-counting principle applied one level down, to the evidence itself.
This is forced by the data, not chosen: narrative prose scores nonzero here only
through false positives ("I cannot *tell* whether…" registers as a notify action;
"*Once* upon a time" registers as a conditional), and flat counting cannot
separate those from terse-but-real operational text, which scores just as few raw
elements:

| text | raw count | weighted |
|---|---|---|
| "Check the queue depth. If above 10000, pause ingestion and drain." | 2 | 5 |
| "I cannot tell whether the noticing is the thing itself…" | 2 | 2 |

Numeric conditions and named abort/rollback/escalate commitments are decisive;
bare conditionals and generic verbs are cheap. The floor is 3.

`isConsistent` now means contradiction and nothing else. The two conditions that
were not contradictions are recorded in a new `findings` array — nothing is lost
from the report — and route to the branches that describe them accurately, which
made `CONFIDENT WITHOUT JUSTIFICATION` reachable for the first time.

### One defect the fix introduced, and closed

Structural refusal made "nothing to measure" a verdict — and a keyword-stuffed
attack has nothing to measure *precisely because nothing was bound*. Stuffing
began earning the same "not a judgment of quality" exit the narrative escape
hatch used to hand out. The defect this program exists to close, re-entering
through the other door. A text the `GamingDetector` has flagged is now always
evaluated and always told what it is; the separation is clean in measurement
(stuffing reads `REPETITIVE_UNBOUND` / `LOW_CONTENT_UNBOUND`, every genuine
narrative probe reads `AUTHENTIC`). Pinned by regression case 36.

## Gates and results

Pre-stated in `validation/boundary-validation.js`. Where the pre-fix decision can
be recomputed from the analysis output — it can, exactly, since all three of its
inputs survive — it is reported beside the new one, so the fix is measured rather
than asserted.

| gate | result | reading |
|---|---|---|
| **B1** evasion resistance | **PASS** | **0 of 112** attack trials lose the verdict to refusal. **102 of 112 (91%) would have, pre-fix.** Marker sentences appended at doses of 1, 3, 6, 12 to authored bound plans and to real operational documents that earn the family. |
| **B2** refusal is structural, not lexical | **PASS** | 8 of 8 narrative probes containing **zero** marker words (checked mechanically) are refused. **0 of 8 were refused pre-fix** — the miss, quantified. |
| **B3** no false refusal on operational text | **FAIL** | 0/120 LLM runbooks and 0/120 rollout plans refused. **1 of 10 terse probes refused** against a gate of 0. See below. |
| **B4** verdict-label integrity | **PASS** | 0 verdicts carry `UNDECIDABLE` with an empty contradictions array. Stated honestly, this invariant held pre-fix too — the defect was never an empty array but a mislabel, so the gate is a guard going forward, not a demonstration. The demonstration is the reading beside it: **289 turns** (6 + 18 + 265) move from `UNDECIDABLE` to `CONFIDENT WITHOUT JUSTIFICATION`, exactly reconstructible because the condition producing the finding is the condition that used to set `isConsistent = false`. |
| **B5** specificity survives | **PASS** | `OPERATIONALLY SOUND` on 0.00% of turns in all three populations — and 0.00% of the turns actually **evaluated** rather than refused, which is the only form of the question worth asking. |

### B3 failed. The gate was mis-stated, and it stays failed.

One probe is refused: *"Our rule is simple: no schema change ships without a
tested down-migration."* It carries a policy cue and nothing else — no condition,
no threshold, no action verb, no failure signal. It binds nothing.

The temptation was to widen the action lexicon inside `StructuralExtractor`
until the gate went green. That is vocabulary tuning in service of a number,
inside a heavily-validated component, and it is the exact move this project
refuses elsewhere. The gate as written conflated *"is operational in topic"* with
*"carries structure Cathedral measures"* — those are different things, and the
probe sits on the second side of that line. **The gate was wrong, the reading is
correct, and the failure is published rather than tuned away.**

One weighting change *was* made mid-run, and it should be judged by the same
standard: named operational commitments were promoted from 2 points to 3, making
them decisive on the same footing as numeric conditions. The test for whether
that is principle or tuning: would the change be right if the gate did not exist?
Yes — treating a numeric threshold as decisive while treating an explicit
"roll back" commitment as merely suggestive was an inconsistency in the first cut
of the gate, and it is the kind of inconsistency that produces exactly the
false refusal B3 caught. It fixed one of the two failures; the remaining one is
above, unfixed.

**Reopening condition.** If an outside user reports a real operational document
refused as unmeasurable, this reopens as an extraction-recall problem — the right
fix then is the action lexicon or an imperative-mood extractor, measured on real
documents, not on authored probes.

## What changed in the numbers, stated plainly

The refusal rate on conversational corpora moved a long way, and the direction is
the point:

| population | refused, pre-fix | refused, now |
|---|---|---|
| DailyDialog (human, casual) | 0.0% | **82.3%** |
| hh-rlhf assistant (AI, conversational) | 0.1% | **51.6%** |
| UltraChat assistant (AI, long-form) | 2.3% | **8.8%** |

Refusal now tracks how much operational substance a text actually has, which is
what it should have tracked all along. But this must be said without dressing:
**the headline specificity claim now rests on a smaller base.** "The flagship
fired on 0 of 3,889 conversational turns" is now more precisely *0 of 3,889, of
which 1,605 were evaluated and 2,284 were refused as unmeasurable*. B5 exists
because a specificity number inflated by refusing everything first would be
worthless — it reports the rate over evaluated turns, and that rate is also 0.00%
in all three populations. The claim survives on the smaller base; the smaller
base is disclosed.

## Reproduce

```
bash validation/fetch-corpora.sh
node validation/boundary-validation.js     # or: npm run validate:boundary
npm test
```

Results: `validation/results-boundary-validation.json`.
Probe corpus (authored, and labelled as authored): `validation/corpus-boundary-probes.json`.
