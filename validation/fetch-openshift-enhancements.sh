#!/bin/bash
# Fetch the FRESH second operational-plan register for the S1 confirmation run
# (docs/OPENSHIFT-ENHANCEMENT-VALIDATION.md). Raw data stays out of git
# (validation/data/ is .gitignored); this script makes the run reproducible.
#
# Why this corpus: the Rust RFC run (docs/RUST-RFC-VALIDATION.md) refined the
# KEP S1 milestone — the operational family fires on OPERATIONAL plans
# (rollout/monitoring/failure sections), not design plans — and left the
# sharpened standing ask: a fresh operational-plan register to confirm the
# KEP pass out-of-sample. OpenShift enhancement proposals are that register:
# KEP-template documents (Risks and Mitigations, Test Plan, Graduation
# Criteria, Upgrade / Downgrade Strategy; 535 of 596 carry a "Risks and
# Mitigations" section) from a different community than kubernetes/enhancements.
#
# PROVENANCE, stated plainly: Red Hat is already a source (corpus 4,
# openshift/runbooks) — but a disjoint document population and a different
# register, and no evaluator change was ever tuned on these documents. The
# S1 confirmation is about the REGISTER; the freshness that matters is that
# nobody iterated any fix against this population.
#
# Population — LABELLED BY CONSTRUCTION: every `enhancements/**/*.md` except
# `README.md` navigation pages. 596 documents at the pinned commit.
#
# Reproducibility: BYTE-PINNED by commit SHA. codeload/tarball and
# api.github.com are gated in this environment; git smart-http clone is not.
#
# Reproduce: bash fetch-openshift-enhancements.sh, then
# node openshift-enhancement-validation.js
set -e

REPO="https://github.com/openshift/enhancements.git"
PIN_SHA="46e0482d25971a6672ffe1287e42ec0ca68dd0f1"
OUT="$(dirname "$0")/data/openshift-enhancements"
TMP="$(dirname "$0")/data/.ose-clone"
mkdir -p "$(dirname "$0")/data"
rm -rf "$OUT" "$TMP"
mkdir -p "$OUT"

# --- Clone at the pinned commit (byte-stable) -------------------------------
git clone --quiet "$REPO" "$TMP"
git -C "$TMP" checkout --quiet "$PIN_SHA"
echo "cloned openshift/enhancements @ $PIN_SHA"

# --- Copy enhancement proposals (exclude README.md) as JSON ------------------
# {title:"<path>", ref:<sha>, markdown:<raw file>} — the identical record
# shape to the prometheus/openshift/KEP/RFC corpora, so the loader is shared
# (these files carry YAML frontmatter; the shared stripFrontmatter removes it).
i=0
while IFS= read -r f; do
  i=$((i+1))
  rel="${f#$TMP/enhancements/}"
  title="${rel%.md}"
  node -e '
    const fs=require("fs");
    const rec={title:process.argv[2], ref:process.argv[3], markdown:fs.readFileSync(process.argv[4],"utf8")};
    fs.writeFileSync(process.argv[5], JSON.stringify(rec));
  ' _ "$title" "$PIN_SHA" "$f" "$OUT/ose_$(printf '%04d' $i).json"
done < <(find "$TMP/enhancements" -name '*.md' ! -name 'README.md' | LC_ALL=C sort)

rm -rf "$TMP"
echo "OpenShift enhancement corpus fetched into $OUT"
echo "documents: $(ls "$OUT"/ose_*.json | wc -l) (pinned @ $PIN_SHA)"
