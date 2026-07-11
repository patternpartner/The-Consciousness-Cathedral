#!/bin/bash
# Fetch the operational-document corpora for the core verdict SENSITIVITY run
# (docs/CORE-VERDICT-SENSITIVITY.md). Raw data stays out of git; this script
# makes the run reproducible.
#
# Two populations, both genuinely operational by construction:
#
#   1. GitLab production incident reviews — real postmortems written by the
#      GitLab infrastructure team for real production incidents (public
#      issue tracker, label "incident-review"). Summary, impact, root cause,
#      corrective actions.
#   2. GitLab runbooks — real on-call runbooks (public gitlab-com/runbooks
#      repo): alert thresholds, escalation steps, troubleshooting procedures.
#      Pinned to a fixed commit so the corpus is byte-stable.
#
# Note: issue descriptions are editable upstream, so the incident-review
# slice is date-bounded (created_before) but not byte-pinned; the runbook
# slice is byte-pinned by SHA. Fetch date for the recorded run: 2026-07-11.
set -e
cd "$(dirname "$0")/data" 2>/dev/null || { mkdir -p "$(dirname "$0")/data"; cd "$(dirname "$0")/data"; }

# --- Population 1: incident reviews (gitlab-com/gl-infra/production) -------
# 2 pages x 100 = up to 200 most recent reviews created before the run date.
PROJ="gitlab-com%2Fgl-infra%2Fproduction"
for page in 1 2; do
  curl -sS "https://gitlab.com/api/v4/projects/$PROJ/issues?labels=incident-review&state=all&order_by=created_at&sort=desc&created_before=2026-07-11T00:00:00Z&per_page=100&page=$page" \
    -o "ir_$page.json"
  sleep 0.3
done

# --- Population 2: runbooks (gitlab-com/runbooks @ pinned SHA) --------------
RUNBOOKS_SHA="9639ff9163619042fca281fe36bffaf295221336"
RB="gitlab-com%2Frunbooks"

# Enumerate docs/**/*.md via the recursive tree API (paginate until empty),
# then deterministically sample every 2nd path (sorted) — ~420 documents.
: > rb_paths_all.txt
page=1
while :; do
  out=$(curl -sS "https://gitlab.com/api/v4/projects/$RB/repository/tree?recursive=true&per_page=100&path=docs&page=$page&ref=$RUNBOOKS_SHA")
  n=$(node -e "const d=JSON.parse(process.argv[1]);console.log(d.length);for(const x of d)if(x.type==='blob'&&x.path.endsWith('.md'))console.error(x.path)" "$out" 2>> rb_paths_all.txt)
  [ "$n" -lt 100 ] && break
  page=$((page+1))
  sleep 0.2
done
sort rb_paths_all.txt | awk 'NR % 2 == 1' > rb_paths.txt
echo "runbook paths sampled: $(wc -l < rb_paths.txt)"

mkdir -p runbooks
i=0
while IFS= read -r p; do
  i=$((i+1))
  curl -sS "https://gitlab.com/gitlab-com/runbooks/-/raw/$RUNBOOKS_SHA/$p" -o "runbooks/rb_$(printf '%03d' $i).md"
  sleep 0.15
done < rb_paths.txt

echo "Operational corpora fetched into $(pwd)"
