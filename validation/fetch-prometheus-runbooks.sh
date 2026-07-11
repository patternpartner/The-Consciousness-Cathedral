#!/bin/bash
# Fetch the FRESH plan-DENSE corpus for the powered G2-EXT retest
# (docs/PROMETHEUS-RUNBOOK-VALIDATION.md). Raw data stays out of git
# (validation/data/ is .gitignored); this script makes the run reproducible.
#
# Why this corpus: the Wikimedia runs
# (docs/WIKIMEDIA-INCIDENT-VALIDATION.md, docs/WIKIMEDIA-RUNBOOK-VALIDATION.md)
# validated the v3.17.0 density fix on 774 fresh operational documents but left
# G2-EXT UNDERPOWERED (pooled n=16 < 20): Wikimedia's operational prose earns
# the operational-family verdict at only ~2-3%, half GitLab's rate, and the
# source is exhausted. The sharpened ask: a source *dense in plan-bearing text*.
# The prometheus-operator/runbooks alert pages are exactly that -- each page is
# Meaning / Impact / Diagnosis / Mitigation for a firing alert, i.e. a
# threshold semantics bound to a mitigation. NEW to the evaluator; not GitLab,
# not Wikimedia.
#
# Population -- prometheus-operator/runbooks alert pages, LABELLED BY
# CONSTRUCTION: every `content/runbooks/<category>/<Alert>.md` except the
# `_index.md` category landing pages. 108 alert runbooks across 8 categories.
#
# Reproducibility: BYTE-PINNED by commit SHA (the strongest of the three
# corpora -- git, not a live wiki). Re-running checks out the same commit, so
# the corpus is byte-identical. codeload/tarball and api.github.com are gated
# in this environment; git smart-http clone and raw.githubusercontent.com are
# not, so this uses git clone.
#
# Reproduce: bash fetch-prometheus-runbooks.sh, then
# node prometheus-runbook-validation.js
set -e

REPO="https://github.com/prometheus-operator/runbooks.git"
PIN_SHA="a685d14cf5128bb30e2bf935c3983decd772d885"
OUT="$(dirname "$0")/data/prometheus-runbooks"
TMP="$(dirname "$0")/data/.prom-clone"
mkdir -p "$(dirname "$0")/data"
rm -rf "$OUT" "$TMP"
mkdir -p "$OUT"

# --- Clone at the pinned commit (byte-stable) -------------------------------
git clone --quiet "$REPO" "$TMP"
git -C "$TMP" checkout --quiet "$PIN_SHA"
echo "cloned prometheus-operator/runbooks @ $PIN_SHA"

# --- Copy alert runbooks (exclude _index.md landing pages) as JSON -----------
# {title:"<category>/<Alert>", ref:<sha>, markdown:<raw file>}. Frontmatter is
# stripped in the validation loader (Hugo YAML furniture), keeping stripMarkdown
# byte-identical to the other runs.
i=0
while IFS= read -r f; do
  i=$((i+1))
  rel="${f#$TMP/content/runbooks/}"          # e.g. kubernetes/KubePodCrashLooping.md
  title="${rel%.md}"
  node -e '
    const fs=require("fs");
    const rec={title:process.argv[2], ref:process.argv[3], markdown:fs.readFileSync(process.argv[4],"utf8")};
    fs.writeFileSync(process.argv[5], JSON.stringify(rec));
  ' _ "$title" "$PIN_SHA" "$f" "$OUT/pr_$(printf '%04d' $i).json"
done < <(find "$TMP/content/runbooks" -name '*.md' ! -name '_index.md' | LC_ALL=C sort)

rm -rf "$TMP"
echo "Prometheus runbook corpus fetched into $OUT"
echo "documents: $(ls "$OUT"/pr_*.json | wc -l) (pinned @ $PIN_SHA)"
