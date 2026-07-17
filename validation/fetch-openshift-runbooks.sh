#!/bin/bash
# Fetch the FRESH terse-alert corpus for the v3.23.0 out-of-sample validation
# (docs/OPENSHIFT-RUNBOOK-VALIDATION.md). Raw data stays out of git
# (validation/data/ is .gitignored); this script makes the run reproducible.
#
# Why this corpus: the v3.23.0 diversity tightening
# (docs/TIER2-DIVERSITY-TIGHTENING.md) was iterated against the pooled fresh
# corpora (Wikimedia incidents, Wikimedia runbooks, prometheus runbooks), which
# made them DEVELOPMENT DATA for that fix. Its methodological note names the
# standing ask: "the next operational corpus nobody has tuned on is the
# validation for this fix." This is that corpus — and it is deliberately the
# SAME text shape the fix targeted (short metric-alert runbooks: Meaning /
# Impact / Diagnosis / Mitigation) from NEW provenance. openshift/runbooks is
# Red Hat's alert-runbook collection: not GitLab, not Wikimedia, not
# prometheus-operator.
#
# Population — openshift/runbooks alert pages, LABELLED BY CONSTRUCTION: every
# `alerts/**/*.md` except the one `README.md` navigation page (the analogue of
# the prometheus run's `_index.md` exclusion). 271 alert runbooks across 18
# operator directories plus one top-level page.
#
# Reproducibility: BYTE-PINNED by commit SHA (git, not a live wiki). Re-running
# checks out the same commit, so the corpus is byte-identical. codeload/tarball
# and api.github.com are gated in this environment; git smart-http clone is
# not, so this uses git clone.
#
# Reproduce: bash fetch-openshift-runbooks.sh, then
# node openshift-runbook-validation.js
set -e

REPO="https://github.com/openshift/runbooks.git"
PIN_SHA="82bd2d9d3789e76f8a8202f8a9ee0f0639cc5b73"
OUT="$(dirname "$0")/data/openshift-runbooks"
TMP="$(dirname "$0")/data/.os-clone"
mkdir -p "$(dirname "$0")/data"
rm -rf "$OUT" "$TMP"
mkdir -p "$OUT"

# --- Clone at the pinned commit (byte-stable) -------------------------------
git clone --quiet "$REPO" "$TMP"
git -C "$TMP" checkout --quiet "$PIN_SHA"
echo "cloned openshift/runbooks @ $PIN_SHA"

# --- Copy alert runbooks (exclude the README.md navigation page) as JSON -----
# {title:"<dir>/<Alert>", ref:<sha>, markdown:<raw file>} — the identical
# record shape to the prometheus corpus, so the validation loader is shared.
i=0
while IFS= read -r f; do
  i=$((i+1))
  rel="${f#$TMP/alerts/}"                    # e.g. cluster-etcd-operator/etcdHighFsyncDurations.md
  title="${rel%.md}"
  node -e '
    const fs=require("fs");
    const rec={title:process.argv[2], ref:process.argv[3], markdown:fs.readFileSync(process.argv[4],"utf8")};
    fs.writeFileSync(process.argv[5], JSON.stringify(rec));
  ' _ "$title" "$PIN_SHA" "$f" "$OUT/os_$(printf '%04d' $i).json"
done < <(find "$TMP/alerts" -name '*.md' ! -name 'README.md' | LC_ALL=C sort)

rm -rf "$TMP"
echo "OpenShift runbook corpus fetched into $OUT"
echo "documents: $(ls "$OUT"/os_*.json | wc -l) (pinned @ $PIN_SHA)"
