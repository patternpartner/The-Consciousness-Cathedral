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

# AI–AI: UltraChat (LLM-simulated user <-> LLM assistant)
for off in 0 100 200; do
  curl -sS "https://datasets-server.huggingface.co/rows?dataset=HuggingFaceH4%2Fultrachat_200k&config=default&split=train_sft&offset=$off&length=100" -o ua_$off.json
done

# Human–human task register (run 4): MultiWOZ — a human plays the assistant
for off in $(seq 0 100 1400); do
  curl -sS "https://datasets-server.huggingface.co/rows?dataset=pietrolesci%2Fmultiwoz_all_versions&config=default&split=train&offset=$off&length=100" -o mw_$off.json; sleep 0.3
done

# AI–AI task register (run 4): CAMEL ai_society — two LLM agents collaborating
for off in $(seq 0 100 1900); do
  curl -sS "https://datasets-server.huggingface.co/rows?dataset=HydraLM%2Fcamel_society_standardized&config=default&split=train&offset=$off&length=100" -o cm_$off.json; sleep 0.3
done

echo "Corpora fetched into $(pwd)"

# Machine-machine, 2024 generation (run 5): Magpie MT — one model, both sides
for off in 0 100 200; do
  curl -sS "https://datasets-server.huggingface.co/rows?dataset=Magpie-Align%2FMagpie-Llama-3.1-Pro-MT-300K-Filtered&config=default&split=train&offset=$off&length=100" -o mg31_$off.json; sleep 0.3
  curl -sS "https://datasets-server.huggingface.co/rows?dataset=Magpie-Align%2FMagpie-Pro-MT-300K-v0.1&config=default&split=train&offset=$off&length=100" -o mg3_$off.json; sleep 0.3
done
