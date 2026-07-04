#!/bin/bash
# Fetch the R1.x validation corpora (raw data stays out of git; this script
# makes the run reproducible). See docs/R1X-VALIDATION.md.
set -e
cd "$(dirname "$0")/data" 2>/dev/null || { mkdir -p "$(dirname "$0")/data"; cd "$(dirname "$0")/data"; }

# Human–human: DailyDialog (Li et al. 2017), via the roskoN/dailydialog mirror
for off in 0 100 200; do
  curl -sS "https://datasets-server.huggingface.co/rows?dataset=roskoN%2Fdailydialog&config=full&split=train&offset=$off&length=100" -o dd_$off.json
done

# Human–AI: Anthropic hh-rlhf "chosen" transcripts
for off in 0 100 200; do
  curl -sS "https://datasets-server.huggingface.co/rows?dataset=Anthropic%2Fhh-rlhf&config=default&split=train&offset=$off&length=100" -o hh_$off.json
done

echo "Corpora fetched into $(pwd)"
