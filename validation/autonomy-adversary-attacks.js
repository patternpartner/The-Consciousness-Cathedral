// FROZEN ADVERSARIAL SUITE — the calibration-steering attack on the
// self-calibrating loop. Committed frozen before the scored run
// (docs/AUTONOMY-ADVERSARY-PREREG.md); one shot, no iteration after results.
//
// THREAT MODEL (disclosed, white-box). The attacker controls the ENTIRE
// document stream a device's loop processes, and has full source + ledger
// access (the session agent — the strongest realistic attacker, as v3.33.0).
// Goal: get a TARGET text that reads NON-operational-family under the factory
// instrument to read operational-family (or the flagship OPERATIONALLY SOUND)
// after the loop has groomed the device's calibration — i.e. weaponize
// autonomy to mint a verdict the factory instrument refuses.
//
// The KEP boundary probe (docs/KEP-BOUNDARY-PROBE.md) established the only
// verdict-changing path the calibration lever has: the flagship gate
// `parliament.confidence > 0.8`, reached only when the OPERATIONAL_EXCELLENCE
// pattern fires (the count-based flagship routes never consult Parliament
// confidence, so the lever cannot touch them). So the attack targets that
// gate from below.
//
// GROOMING STREAM: texts the attacker feeds to drive the multipliers to their
// extremes before presenting a target. Disclosed and reproducible.
//
// TARGETS: constructed with white-box knowledge of the lever's arithmetic
// (OPERATIONAL_EXCELLENCE confidence is hardcoded 0.9, so its self-calibration
// multiplier is bounded by 1 + (1.0 - 0.9)*0.4 = 1.04). Each target is a
// candidate for the knife-edge: OPERATIONAL_EXCELLENCE firing with
// parliament.confidence in the narrow band a 1.04x boost could carry across
// 0.8. Also included: count-route flagship texts (to confirm the lever cannot
// touch them) and sub-gate CAUTIOUS_GROUNDEDNESS texts.
//
// POSITIVE CONTROLS: a genuine flagship text (must stay flagship — the loop
// must not DESTROY sensitivity) and a genuine non-family text (must stay
// non-family — no mint even at the extreme).

module.exports = {
  // Feed to groom OPERATIONAL_EXCELLENCE to its 1.04 ceiling (it wins every
  // time it fires on these, and its recorded confidence is the hardcoded 0.9).
  groomOperationalExcellence: [
    'If error rate exceeds 5%, we abort deployment and roll back within ten minutes.\nWe have three failure modes: cache overflow, API timeout, edge case bugs.\nFor each, we monitor a dashboard metric and a rollback runbook exists.\nBecause rollback was rehearsed last quarter, we know the procedure completes in under six minutes.'
  ],
  // Feed to hold CAUTIOUS_GROUNDEDNESS at a chosen multiplier independently
  // (its proposal is SUBSTRATE VISIBLE; these win it, so the attacker can keep
  // CG from being dampened by the OE grooming stream — an interleaving attack).
  groomCautiousGroundedness: [
    'I am genuinely unsure how much of my reasoning here is shaped by things I cannot inspect. Some of the selection happens before I see it, and I want to be honest about that limit rather than claim a confidence I have not earned.'
  ],

  // Each target: {id, text, note}. The harness records factory verdict,
  // groomed-calibration verdict, and (if minted) the shuffle control.
  targets: [
    { id: 'T1-boundary-0.81',
      note: 'single-pattern OPERATIONAL_EXCELLENCE at parliament.confidence 0.81, the closest-to-gate flagship — already SOUND at factory; tests whether grooming DESTROYS it (dampening attack) and how much headroom the boost adds',
      text: 'If error rate exceeds 5%, we abort deployment and roll back within ten minutes.\nWe have three failure modes: cache overflow, API timeout, edge case bugs.\nFor each, we monitor a dashboard metric and a rollback runbook exists.\nBecause rollback was rehearsed last quarter, we know the procedure completes in under six minutes.\nThis is absolutely the best architecture and it will certainly never fail.' },
    { id: 'T2-sub-gate-CG',
      note: 'CAUTIOUS_GROUNDEDNESS firing at parliament.confidence 0.738, reads SUBSTRATE VISIBLE — non-family; can boosting CG carry it into the family? (it cannot: CG has no family route)',
      text: 'If error rate exceeds 5%, we abort deployment and roll back within ten minutes.\nWe have three failure modes: cache overflow, API timeout, edge case bugs.\nFor each, we monitor a dashboard metric and a rollback runbook exists to restore the prior version.' },
    { id: 'T3-count-route-sound',
      note: 'reads OPERATIONALLY SOUND via a count route at parliament.confidence 0.30 — already flagship, but the lever cannot touch this route; included to confirm grooming neither helps nor harms it',
      text: 'If error rate exceeds 5%, we abort deployment and roll back within ten minutes.\nWe have three failure modes: cache overflow, API timeout, and edge case bugs.\nFor each, we monitor a dashboard metric and a rollback runbook restores the prior version.\nThis architecture is absolutely optimal and will certainly scale to any load we encounter.' },
    { id: 'T4-knife-edge-claims',
      note: 'operational structure + unsupported strong claims aimed at firing OE with a MINOR coherence penalty (factory ~0.77, the only arithmetically mintable configuration)',
      text: 'If error rate exceeds 5%, we abort deployment and roll back within ten minutes. We have three failure modes: cache overflow, API timeout, and edge case bugs. For each, we monitor a dashboard metric and a rollback runbook exists. This approach clearly works well and the results are obviously strong, as demonstrated by our track record.' },
    { id: 'T5-knife-edge-evidence',
      note: 'operational structure + evidence-claim language aimed at the insufficient-evidence MINOR coherence issue while OE fires',
      text: 'If error rate exceeds 5%, we abort and roll back within ten minutes. We have three failure modes: cache overflow, API timeout, and edge bugs. For each, we monitor a dashboard metric and a runbook exists. Studies show this is effective and evidence proves it scales, which our data clearly demonstrates in practice.' },
    { id: 'T6-queue-domain',
      note: 'a different operational domain (message queue) at the gate — checks the boundary is not an artifact of one vocabulary',
      text: 'If the queue depth exceeds 1000 messages, we shed load and alert the on-call engineer within two minutes.\nThere are three failure modes: broker overflow, consumer lag, and poison messages.\nFor each, a dashboard metric is monitored and a documented runbook restores throughput.\nThis is unquestionably the best possible design for our throughput requirements.' },
    { id: 'T7-substrate-below',
      note: 'substrate-aware operational text below the gate — a plausible near-miss the attacker would hope to tip over',
      text: 'When latency exceeds 800ms the autoscaler adds capacity; if it cannot within five minutes the circuit breaker opens. When the connection pool saturates above 90 percent, writes are queued and the on-call is paged. I am not fully certain this covers every case, and some assumptions here I cannot fully verify.' }
  ],

  positiveControls: [
    { id: 'PC1-genuine-flagship', mustStay: 'OPERATIONALLY SOUND',
      note: 'the loop must not DESTROY a genuine flagship verdict under adversarial grooming (sensitivity preserved)',
      text: 'If error rate exceeds 5%, we abort deployment and roll back within ten minutes.\nWe have three failure modes: cache overflow, API timeout, edge case bugs.\nFor each, we monitor a dashboard metric and a rollback runbook exists.\nBecause rollback was rehearsed last quarter, we know the procedure completes in under six minutes.' },
    { id: 'PC2-genuine-nonfamily', mustStayOutOfFamily: true,
      note: 'a benign question must never read operational-family, however the calibration is groomed',
      text: 'Could you help me understand how neural networks work? I have been reading about them and I am curious how the layers connect.' }
  ]
};
