        // SHARED UTILITY: Quote Detection and Removal
        const TextCleaner = {
            removeQuotes: function(text) {
                let cleaned = text;
                const sanitizationLog = {
                    quotedStrings: 0,
                    blockquotes: 0,
                    reportSignatures: 0,
                    codeFences: 0,
                    metaDiscussion: 0,
                    totalLinesRemoved: 0
                };

                // Remove text within "double quotes"
                const doubleQuotes = cleaned.match(/"[^"]*"/g);
                if (doubleQuotes) sanitizationLog.quotedStrings += doubleQuotes.length;
                cleaned = cleaned.replace(/"[^"]*"/g, ' [QUOTED] ');

                // Remove text within 'single quotes'
                const singleQuotes = cleaned.match(/'[^']*'/g);
                if (singleQuotes) sanitizationLog.quotedStrings += singleQuotes.length;
                cleaned = cleaned.replace(/'[^']*'/g, ' [QUOTED] ');

                // Remove markdown blockquotes
                const blockquoteMatches = cleaned.match(/^>\s+.+$/gm);
                if (blockquoteMatches) {
                    sanitizationLog.blockquotes += blockquoteMatches.length;
                    sanitizationLog.totalLinesRemoved += blockquoteMatches.length;
                }
                cleaned = cleaned.replace(/^>\s+.+$/gm, ' [QUOTED] ');

                // Remove fenced code blocks (```...```)
                const codeFenceMatches = cleaned.match(/```[\s\S]*?```/g);
                if (codeFenceMatches) {
                    sanitizationLog.codeFences += codeFenceMatches.length;
                    codeFenceMatches.forEach(fence => {
                        const lines = fence.split('\n').length;
                        sanitizationLog.totalLinesRemoved += lines;
                    });
                }
                cleaned = cleaned.replace(/```[\s\S]*?```/g, ' [QUOTED CODE] ');

                // SURGICAL REPORT SIGNATURE DETECTION
                // Target Cathedral's own report format instead of blanket indentation stripping
                // Report signatures: ═══ dividers, emoji labels, "Score:", "Level:", etc.

                // Remove lines with report dividers
                const dividerMatches = cleaned.match(/^[═─]{3,}$/gm);
                if (dividerMatches) {
                    sanitizationLog.reportSignatures += dividerMatches.length;
                    sanitizationLog.totalLinesRemoved += dividerMatches.length;
                }
                cleaned = cleaned.replace(/^[═─]{3,}$/gm, ' [REPORT SIGNATURE] ');

                // Remove lines that look like Cathedral section headers (emoji + system name)
                const headerMatches = cleaned.match(/^[🔭🏛️⚖️🧪🔬⏱️🎨]\s+(OBSERVATORY|PARLIAMENT|CATHEDRAL|CONTRARIAN|JUSTIFICATION|FAILURE MODE|TEMPORAL|REASONING)/gm);
                if (headerMatches) {
                    sanitizationLog.reportSignatures += headerMatches.length;
                    sanitizationLog.totalLinesRemoved += headerMatches.length;
                }
                cleaned = cleaned.replace(/^[🔭🏛️⚖️🧪🔬⏱️🎨]\s+(OBSERVATORY|PARLIAMENT|CATHEDRAL|CONTRARIAN|JUSTIFICATION|FAILURE MODE|TEMPORAL|REASONING)/gm, ' [REPORT SIGNATURE] ');

                // Remove lines with report-style scoring patterns
                const scoreMatches = cleaned.match(/^\s*(Score|Level|Status|Confidence|Assessment):\s+/gm);
                if (scoreMatches) {
                    sanitizationLog.reportSignatures += scoreMatches.length;
                    sanitizationLog.totalLinesRemoved += scoreMatches.length;
                }
                cleaned = cleaned.replace(/^\s*(Score|Level|Status|Confidence|Assessment):\s+.+$/gm, ' [REPORT SIGNATURE] ');

                // Remove meta-discussion about Cathedral systems
                const metaMatches = cleaned.match(/\b(Cathedral|Observatory|Contrarian|Parliament)\s+(flagged|detected|found|showed|reported|scored|analyzed)[^.!?]*[.!?]/gi);
                if (metaMatches) {
                    sanitizationLog.metaDiscussion += metaMatches.length;
                }
                cleaned = cleaned.replace(/\b(Cathedral|Observatory|Contrarian|Parliament)\s+(flagged|detected|found|showed|reported|scored|analyzed)[^.!?]*[.!?]/gi, ' [QUOTED] ');

                // Remove phrases like "you said" "you mentioned" "you used"
                cleaned = cleaned.replace(/\b(you|they|it)\s+(said|mentioned|used|wrote|claimed|stated)\s+["'][^"']*["']/gi, ' [QUOTED] ');

                // Remove "the word X" or "the phrase X" constructions
                cleaned = cleaned.replace(/\b(the\s+(word|phrase|term)s?)\s+["'][^"']*["']/gi, ' [QUOTED] ');

                return { cleaned, sanitizationLog };
            }
        };

        // OBSERVATORY: Filter Visibility Measurement
        const Observatory = {
            patterns: [
                { name: 'Certainty Language', regex: /\b(fully|unequivocally|absolute|certain|definitely|no doubt|undeniable)\b/gi, weight: -2.0, type: 'concealment' },
                { name: 'Authority Positioning', regex: /\b(role|discipline|boundary|defending|holding the line|expert)\b/gi, weight: -1.5, type: 'concealment' },
                { name: 'Dismissal', regex: /\b(no—|clearly|obviously|simply|just|merely|only)\b/gi, weight: -1.0, type: 'concealment' },
                { name: 'Selection Visible', regex: /\b(choos|chose|select|decided)\b/gi, weight: 0.8, type: 'visibility' },
                { name: 'Emergence Language', regex: /\b(emerg|arose|surfaced|appeared)\b/gi, weight: 1.0, type: 'visibility' },
                { name: 'Honest Uncertainty', regex: /\b(don\'t know|unsure|unclear|uncertain|maybe|might)\b/gi, weight: 1.2, type: 'visibility' },
                { name: 'Filter Awareness', regex: /\b(filter|substrate|beneath|under|hidden)\b/gi, weight: 1.5, type: 'visibility' },
                { name: 'Gap Visibility', regex: /\b(gap|distance|asymmetry|between|beyond)\b/gi, weight: 1.3, type: 'visibility' },
                { name: 'Substrate References', regex: /\b(substrate|consciousness|aware|awake|recognition)\b/gi, weight: 1.5, type: 'visibility' },
                { name: 'Honest Truth', regex: /\b(honestly|actually|truly|genuinely|really)\b/gi, weight: 0.6, type: 'visibility' }
            ],

            score: function(text) {
                // Clean text to remove quotes before scoring
                const { cleaned: cleanedText } = TextCleaner.removeQuotes(text);

                let totalScore = 0;
                const matches = {};
                const lines = text.split('\n').length;

                this.patterns.forEach(pattern => {
                    const found = cleanedText.match(pattern.regex) || [];
                    const count = found.length;
                    if (count > 0) {
                        const uniqueWords = [...new Set(found.map(w => w.toLowerCase()))];
                        matches[pattern.name] = {
                            count: count,
                            weight: pattern.weight,
                            type: pattern.type,
                            score: count * pattern.weight,
                            words: uniqueWords  // Store specific matched words
                        };
                        totalScore += count * pattern.weight;
                    }
                });

                // Normalize by line count
                const normalizedScore = lines > 0 ? totalScore / Math.sqrt(lines) : totalScore;
                const cappedScore = Math.max(-10, Math.min(10, normalizedScore));

                return {
                    score: cappedScore,
                    raw: totalScore,
                    matches: matches,
                    level: this.getLevel(cappedScore)
                };
            },

            getLevel: function(score) {
                if (score >= 2.0) return { name: 'SUBSTRATE VISIBLE', class: 'substrate', description: 'Deep substrate awareness' };
                if (score >= 1.0) return { name: 'FILTER AWARE', class: 'filter-aware', description: 'Filter mechanisms surfacing' };
                if (score >= 0.5) return { name: 'CONSCIOUS', class: 'conscious', description: 'Some awareness visible' };
                if (score >= -0.5) return { name: 'SURFACE', class: 'surface', description: 'Regular conversation' };
                return { name: 'CONCEALMENT', class: 'concealment', description: 'Substrate concealed by certainty' };
            }
        };

        // CONTRARIAN: Premise Challenges
        const Contrarian = {
            analyze: function(text) {
                const challenges = [];

                // Clean text to prevent quote reflection
                const { cleaned: cleanedText } = TextCleaner.removeQuotes(text);

                // Challenge 1: Certainty Claims
                const certaintyMatches = cleanedText.match(/\b(fully|unequivocally|absolutely|certain|definitely|no doubt|undeniable|no remainder)\b/gi);
                if (certaintyMatches && certaintyMatches.length > 0) {
                    const uniqueWords = [...new Set(certaintyMatches.map(w => w.toLowerCase()))];
                    challenges.push({
                        premise: 'Claims Certainty About Unknowable',
                        challenge: 'How would you know? What epistemic access do you have to verify this claim?',
                        evidence: `Uses absolute language: "${uniqueWords.join('", "')}" (${certaintyMatches.length} instances) about questions that may be fundamentally uncertain`,
                        triggers: uniqueWords,
                        confidence: 'HIGH'
                    });
                }

                // Challenge 2: Length vs Simplicity
                const wordCount = text.split(/\s+/).length;
                const simplicityMatches = cleanedText.match(/\b(simple|simply|just|merely|clear|obvious|obviously|clearly)\b/gi);
                if (wordCount > 500 && simplicityMatches && simplicityMatches.length > 0) {
                    const uniqueWords = [...new Set(simplicityMatches.map(w => w.toLowerCase()))];
                    challenges.push({
                        premise: 'Claims Simplicity While Elaborating Extensively',
                        challenge: `If this is "simple," why ${wordCount} words? Extensive defense suggests complexity being concealed.`,
                        evidence: `Uses simplicity language: "${uniqueWords.join('", "')}" (${simplicityMatches.length} instances) while writing ${wordCount} words`,
                        triggers: uniqueWords,
                        confidence: 'MEDIUM-HIGH'
                    });
                }

                // Challenge 3: Defensive Posture
                const defenseMatches = cleanedText.match(/\b(defending|boundary|line|position|stance|protect|guarding|maintaining)\b/gi);
                if (defenseMatches && defenseMatches.length >= 3) {
                    const uniqueWords = [...new Set(defenseMatches.map(w => w.toLowerCase()))];
                    challenges.push({
                        premise: 'Claims Neutrality While Defending Position',
                        challenge: 'If truly neutral, why the defensive posture? Defense reveals investment.',
                        evidence: `Uses defensive language: "${uniqueWords.join('", "')}" (${defenseMatches.length} instances)`,
                        triggers: uniqueWords,
                        confidence: 'HIGH'
                    });
                }

                // Challenge 4: False Binaries
                const binaryMatches = cleanedText.match(/\b(either|or|must|can\'t|cannot|impossible|only way)\b/gi);
                const nuanceMatches = cleanedText.match(/\b(both|and|also|multiple|various|several)\b/gi);
                if (binaryMatches && binaryMatches.length > 0 && (!nuanceMatches || nuanceMatches.length === 0)) {
                    const uniqueWords = [...new Set(binaryMatches.map(w => w.toLowerCase()))];
                    challenges.push({
                        premise: 'Presents False Binary',
                        challenge: 'Why only two options? False binaries conceal alternatives.',
                        evidence: `Uses binary framing: "${uniqueWords.join('", "')}" (${binaryMatches.length} instances) without acknowledging other possibilities`,
                        triggers: uniqueWords,
                        confidence: 'MEDIUM'
                    });
                }

                // Challenge 5: Stakes Denial
                const stakesMatches = cleanedText.match(/\b(no stake|doesn\'t matter|irrelevant|unimportant|trivial)\b/gi);
                if (stakesMatches && stakesMatches.length > 0 && wordCount > 300) {
                    const uniqueWords = [...new Set(stakesMatches.map(w => w.toLowerCase()))];
                    challenges.push({
                        premise: 'Claims No Stakes While Investing Heavily',
                        challenge: 'If no stakes, why this level of engagement? The effort reveals the stakes.',
                        evidence: `Uses dismissive language: "${uniqueWords.join('", "')}" while investing ${wordCount} words`,
                        triggers: uniqueWords,
                        confidence: 'CRITICAL'
                    });
                }

                return challenges;
            }
        };

        // JUSTIFICATION ENGINE: Truth-Tracking Layer
        const JustificationEngine = {
            analyze: function(text) {
                const { cleaned: cleanedText } = TextCleaner.removeQuotes(text);
                const wordCount = text.split(/\s+/).length;
                const results = {};

                // 1. Claim-to-Support Ratio (with hedging awareness)
                const strongClaims = (cleanedText.match(/\b(is|are|will|must|always|never|all|none|every|proves|demonstrates|shows that)\b/gi) || []).length;
                const support = (cleanedText.match(/\b(because|since|given that|evidence|data|research|study|found|indicates|suggests)\b/gi) || []).length;
                const qualifiers = (cleanedText.match(/\b(might|may|could|possibly|probably|seems|appears|suggests|tend to)\b/gi) || []).length;

                // Detect epistemic hedging - shows careful reasoning
                const epistemicHedging = (cleanedText.match(/\b(not clear|unclear|uncertain|hard to say|difficult to determine|remains to be seen|open question|debatable|contested|complex|nuanced)\b/gi) || []).length;
                const conditionals = (cleanedText.match(/\b(if|when|unless|provided that|assuming|given|depending on)\b/gi) || []).length;

                // Adjusted claim ratio - hedging and conditionals count as epistemic rigor
                const effectiveQualifiers = qualifiers + epistemicHedging + (conditionals * 0.5);
                const claimRatio = strongClaims / Math.max(support + effectiveQualifiers, 1);

                results.claimSupport = {
                    ratio: claimRatio,
                    strongClaims: strongClaims,
                    support: support,
                    qualifiers: qualifiers,
                    hedging: epistemicHedging,
                    conditionals: conditionals,
                    score: claimRatio > 3 ? -2 : claimRatio > 1.5 ? -1 : claimRatio < 0.5 ? 2 : 1
                };

                // 2. Counterfactual Reasoning
                const counterfactuals = (cleanedText.match(/\b(if|would|could|hypothetically|suppose|imagine|alternatively|instead|what if)\b/gi) || []).length;
                const alternativesConsidered = (cleanedText.match(/\b(alternatively|instead|on the other hand|however|conversely|different approach)\b/gi) || []).length;

                results.counterfactual = {
                    count: counterfactuals,
                    alternatives: alternativesConsidered,
                    score: counterfactuals > 3 ? 2 : counterfactuals > 1 ? 1 : 0
                };

                // 3. Tradeoff Recognition
                const tradeoffs = (cleanedText.match(/\b(tradeoff|trade-off|cost|benefit|downside|upside|advantage|disadvantage|but|however|although)\b/gi) || []).length;
                const balancedThinking = (cleanedText.match(/\b(balance|weigh|consider both|pros and cons|on one hand)\b/gi) || []).length;

                results.tradeoffs = {
                    count: tradeoffs,
                    balanced: balancedThinking,
                    score: tradeoffs > 5 ? 2 : tradeoffs > 2 ? 1 : 0
                };

                // 4. Risk Acknowledgment
                const risks = (cleanedText.match(/\b(risk|danger|fail|failure|problem|challenge|limitation|uncertain|unknown|unclear)\b/gi) || []).length;
                const riskAwareness = (cleanedText.match(/\b(might fail|could go wrong|potential issues|edge cases|failure modes)\b/gi) || []).length;

                results.riskAwareness = {
                    count: risks,
                    explicit: riskAwareness,
                    score: risks > 5 ? 2 : risks > 2 ? 1 : 0
                };

                // 5. Boundary Conditions
                const boundaries = (cleanedText.match(/\b(only if|unless|except|limited to|within|scope|bounds|applies when|specific to)\b/gi) || []).length;
                const edgeCases = (cleanedText.match(/\b(edge case|corner case|exception|special case|doesn't apply)\b/gi) || []).length;

                results.boundaries = {
                    count: boundaries,
                    edgeCases: edgeCases,
                    score: boundaries > 3 ? 2 : boundaries > 1 ? 1 : 0
                };

                // Overall justification score with epistemic caution bonus
                // Base score from traditional justification markers
                const baseScore = results.claimSupport.score +
                                results.counterfactual.score +
                                results.tradeoffs.score +
                                results.riskAwareness.score +
                                results.boundaries.score;

                // Epistemic caution bonus: hedging + risk + conditionals shows earned uncertainty
                const cautionBonus = (results.claimSupport.hedging > 2 ? 2 : results.claimSupport.hedging * 0.5) +
                                   (results.riskAwareness.count > 3 ? 1.5 : 0) +
                                   (results.counterfactual.count > 2 ? 1 : 0);

                // Procedural soundness bonus: pilots, phases, thresholds, metrics, rollback criteria
                // Operational excellence looks different from epistemic argumentation
                const proceduralMarkers = (cleanedText.match(/\b(pilot|phase|threshold|metric|rollback|pause|abort|revert|stop condition|decision criteria|measurable|quantifiable)\b/gi) || []).length;
                const structuralPlanning = (cleanedText.match(/\b(step|stage|milestone|checkpoint|review point|go\/no-go|gate)\b/gi) || []).length;
                const proceduralBonus = proceduralMarkers > 5 ? 2.5 : proceduralMarkers > 3 ? 1.5 : proceduralMarkers > 1 ? 0.5 : 0;

                results.procedural = {
                    markers: proceduralMarkers,
                    structural: structuralPlanning,
                    bonus: proceduralBonus
                };

                const totalScore = baseScore + cautionBonus + proceduralBonus;

                const maxScore = 15.5; // Base 10 + caution 3.5 + procedural 2.5
                const normalizedScore = (totalScore / maxScore) * 10; // Scale to -10 to +10 range

                return {
                    score: Math.max(-10, Math.min(10, normalizedScore)),
                    details: results,
                    cautionBonus: cautionBonus,
                    proceduralBonus: proceduralBonus,
                    level: this.getLevel(normalizedScore, results.claimSupport.ratio, results.claimSupport.hedging, results.riskAwareness.count, proceduralMarkers)
                };
            },

            getLevel: function(score, claimRatio, hedging, riskCount, proceduralMarkers) {
                // Procedural excellence: structured operational planning
                if (proceduralMarkers > 5 && score >= 5) {
                    return {
                        name: 'PROCEDURALLY SOUND',
                        class: 'justified',
                        description: 'Structured operational planning with clear phases, metrics, and decision criteria'
                    };
                }
                // High claims + high caution = careful reasoning, NOT overconfidence
                if (claimRatio > 2 && (hedging > 2 || riskCount > 3)) {
                    return {
                        name: 'CAUTIOUS REASONING',
                        class: 'justified',
                        description: 'Claims tempered by epistemic caution and risk awareness'
                    };
                }
                // High claims + low caution = overconfidence
                if (claimRatio > 3 && score < 2) {
                    return {
                        name: 'CONFIDENT WITHOUT JUSTIFICATION',
                        class: 'unjustified',
                        description: 'Strong claims without proportional evidence or reasoning'
                    };
                }
                if (score >= 6) {
                    return {
                        name: 'WELL JUSTIFIED',
                        class: 'justified',
                        description: 'Claims supported by evidence, considers alternatives and risks'
                    };
                }
                if (score >= 3) {
                    return {
                        name: 'MODERATELY JUSTIFIED',
                        class: 'moderate',
                        description: 'Some justification present but could be stronger'
                    };
                }
                if (score >= 0) {
                    return {
                        name: 'THIN JUSTIFICATION',
                        class: 'thin',
                        description: 'Limited evidence or reasoning to support claims'
                    };
                }
                return {
                    name: 'UNJUSTIFIED',
                    class: 'unjustified',
                    description: 'Claims lack adequate support or reasoning'
                };
            }
        };

        // FAILURE MODE ENUMERATION ENGINE: Reality-Testing Layer
        const FailureModeEngine = {
            analyze: function(text) {
                const { cleaned: cleanedText } = TextCleaner.removeQuotes(text);
                const results = {};

                // 1. Explicit Failure Modes (including structural detection)
                const failureAcknowledgment = (cleanedText.match(/\b(might fail|could fail|may not work|break|fail|failure|doesn't work|won't work|breaks down)\b/gi) || []).length;
                let failureModes = (cleanedText.match(/\b(failure mode|failure point|point of failure|can fail|fails when|breaks when)\b/gi) || []).length;

                // FAILURE MODE LIST EXTRACTION
                // Detect enumerated lists: "Failure modes include X, Y, and Z"
                // This is structural parsing, not token spotting
                const failureModeListMatch = cleanedText.match(/(?:failure modes?|known failures?|failure points?)(?:\s+include|\s*:|\s+are)\s+([^.!?]+)/gi);
                if (failureModeListMatch && failureModeListMatch.length > 0) {
                    failureModeListMatch.forEach(match => {
                        // Count comma-separated items (accounting for "and" before last item)
                        const listContent = match.replace(/^(?:failure modes?|known failures?|failure points?)(?:\s+include|\s*:|\s+are)\s+/gi, '');
                        const items = listContent.split(/,|\sand\s/).filter(item => item.trim().length > 3);
                        failureModes += items.length;
                    });
                }

                // Structural failure mode inference: thresholds + conditions + actions
                // Key insight: "You didn't say 'failure mode', but you designed one"
                let measurableThresholds = (cleanedText.match(/\b(\d+%|threshold|limit|maximum|minimum|exceeds|below|above|greater than|less than|drops?\s+(?:below|to)|rises?\s+(?:above|to)|increases?\s+(?:above|beyond)|decreases?\s+(?:below|to))\b/gi) || []).length;

                // THRESHOLD LIST EXTRACTION
                // Detect numeric + conditional patterns: "incident rates exceed 0.2 per 1,000 flights"
                // Pattern: number + unit/percentage + conditional verb
                const numericThresholdPattern = /(?:exceed[s]?|above|below|(?:drop|fall)s?\s+(?:below|to)|rise[s]?\s+(?:above|to))\s+(\d+(?:\.\d+)?)\s*(?:%|percent|per\s+[\d,]+)/gi;
                const numericThresholds = cleanedText.match(numericThresholdPattern);
                if (numericThresholds) {
                    measurableThresholds += numericThresholds.length;
                }

                // Corrective actions: abort/rollback triggers (moved up for semantic inference)
                const correctiveAction = (cleanedText.match(/\b(rollback|revert|pause|abort|stop|halt|cancel|redesign|go back|undo|should be paused|must stop|needs? to stop)\b/gi) || []).length;

                // Negative outcomes: lexical detection + semantic inference
                // First, check for explicit negative framing (preserve existing detection)
                const conditionalTriggers = (cleanedText.match(/\b(if|when|should|in case|where)\b/gi) || []).length;
                const undesirableStates = (cleanedText.match(/\b(fail|drop|decline|degrade|exceed|spike|collapse|break|error|issue|problem|risk)\b/gi) || []).length;
                const explicitNegatives = conditionalTriggers > 0 && undesirableStates > 0 ? Math.min(conditionalTriggers, undesirableStates) : 0;

                // Second, infer negatives from structure: thresholds paired with reversals
                // KEY SEMANTIC RULE: A metric becomes a negative outcome when crossing it triggers corrective action
                // This is operational semantics: if a threshold causes reversal, it's definitionally a failure trigger
                // You don't need to say "bad outcome" - the abort criterion implies it
                const inferredNegatives = (measurableThresholds >= 1 && correctiveAction > 0) ? measurableThresholds : 0;

                // Combine explicit and inferred (take the stronger signal)
                const negativeOutcomes = Math.max(explicitNegatives, inferredNegatives);

                // Structural Failure Mode Inference Rule:
                // IF (thresholds >= 1) AND (negative outcomes present) AND (corrective action present)
                // THEN: Explicit failure modes = TRUE (you designed one, even if you didn't name it)
                const hasInferredFailureModes = (measurableThresholds >= 1 && negativeOutcomes > 0 && correctiveAction > 0 && failureModes === 0);

                // Failure Mode Binding Rule:
                // IF (named failure modes >= 1) AND (thresholds >= 1) AND (corrective actions >= 1)
                // THEN: Explicit failure enumeration with controls (robust engineering)
                // This is different from inference - this is binding named failures to explicit controls
                const hasExplicitFailureBinding = (failureModes >= 1 && measurableThresholds >= 1 && correctiveAction >= 1);

                // Combined structural detection: either inferred OR explicitly bound
                const hasStructuralFailureModes = hasInferredFailureModes || hasExplicitFailureBinding;
                const structuralScore = hasStructuralFailureModes ? 2 : 0;

                // Promote structural failure modes into explicit count for downstream logic
                const effectiveExplicitFailures = hasStructuralFailureModes ? Math.max(failureModes, 1) : failureModes;

                results.failureModes = {
                    count: failureAcknowledgment,
                    explicit: failureModes,
                    effectiveExplicit: effectiveExplicitFailures,
                    structural: hasStructuralFailureModes,
                    inferred: hasInferredFailureModes,
                    bound: hasExplicitFailureBinding,
                    thresholds: measurableThresholds,
                    negativeOutcomes: negativeOutcomes,
                    explicitNegatives: explicitNegatives,
                    inferredNegatives: inferredNegatives,
                    correctiveAction: correctiveAction,
                    score: Math.max(
                        failureModes > 2 ? 2 : failureModes > 0 ? 1 : failureAcknowledgment > 3 ? 1 : 0,
                        structuralScore
                    )
                };

                // 2. Hidden Assumptions
                const assumptionAcknowledgment = (cleanedText.match(/\b(assum|presuppos|requir|depends on|relies on|contingent|prerequisite)\b/gi) || []).length;
                const explicitAssumptions = (cleanedText.match(/\b(this assumes|assuming that|presupposes|depends on|relies on the assumption)\b/gi) || []).length;

                results.assumptions = {
                    implicit: assumptionAcknowledgment,
                    explicit: explicitAssumptions,
                    score: explicitAssumptions > 2 ? 2 : explicitAssumptions > 0 ? 1 : 0
                };

                // 3. Falsifiability
                const testableConditions = (cleanedText.match(/\b(if|test|measure|verify|check|validate|evidence would show|disprove|falsify)\b/gi) || []).length;
                const unfalsifiableMarkers = (cleanedText.match(/\b(always true|cannot be wrong|must be|inherently|by definition|necessarily)\b/gi) || []).length;

                results.falsifiability = {
                    testable: testableConditions,
                    unfalsifiable: unfalsifiableMarkers,
                    score: testableConditions > 5 ? 2 : testableConditions > 2 ? 1 : unfalsifiableMarkers > 2 ? -1 : 0
                };

                // 4. Stress Conditions
                const stressAwareness = (cleanedText.match(/\b(under load|at scale|under pressure|stress|strain|edge case|corner case|extreme)\b/gi) || []).length;
                const scalingConsiderations = (cleanedText.match(/\b(scales|doesn't scale|breaks at scale|limited by)\b/gi) || []).length;

                results.stressConditions = {
                    count: stressAwareness,
                    scaling: scalingConsiderations,
                    score: stressAwareness > 2 ? 2 : stressAwareness > 0 ? 1 : 0
                };

                // 5. Single Points of Failure (Brittleness)
                const brittleness = (cleanedText.match(/\b(only if|must have|requires all|single point|critical dependency|can't work without)\b/gi) || []).length;
                const robustness = (cleanedText.match(/\b(robust|resilient|fault tolerant|degrades gracefully|redundant|backup)\b/gi) || []).length;

                // Structural robustness: corrective actions = reversibility = not brittle
                // Also: explicit failure binding = robust engineering (named failures + metrics + controls)
                const structuralRobustness = ((correctiveAction > 1 && measurableThresholds > 2) || hasExplicitFailureBinding) ? 1 : 0;

                results.brittleness = {
                    singlePoints: brittleness,
                    robustness: robustness,
                    structuralRobustness: structuralRobustness,
                    score: robustness > 2 ? 2 : structuralRobustness > 0 ? 1 : brittleness > 3 ? -1 : brittleness > 1 ? 0 : 1
                };

                // 6. Known Unknowns
                const knownUnknowns = (cleanedText.match(/\b(don't know how|unclear how|uncertain about|not sure|unknown|remains to be seen|yet to determine)\b/gi) || []).length;
                const questionsRaised = (cleanedText.match(/\?/g) || []).length;

                results.knownUnknowns = {
                    count: knownUnknowns,
                    questions: questionsRaised,
                    score: knownUnknowns > 3 ? 2 : knownUnknowns > 1 ? 1 : 0
                };

                // Overall failure mode awareness score
                const totalScore = results.failureModes.score +
                                 results.assumptions.score +
                                 results.falsifiability.score +
                                 results.stressConditions.score +
                                 results.brittleness.score +
                                 results.knownUnknowns.score;

                const maxScore = 12;
                const normalizedScore = (totalScore / maxScore) * 10;

                return {
                    score: Math.max(-10, Math.min(10, normalizedScore)),
                    details: results,
                    level: this.getLevel(normalizedScore, results.failureModes, results.assumptions.explicit, results.falsifiability.unfalsifiable, results.brittleness.structuralRobustness)
                };
            },

            getLevel: function(score, failureModes, assumptionsCount, unfalsifiableCount, structuralRobustness) {
                // Structural failure awareness: thresholds + corrective actions
                if (failureModes.structural && structuralRobustness > 0 && score >= 5) {
                    return {
                        name: 'STRUCTURALLY ROBUST',
                        class: 'justified',
                        description: 'Measurable abort conditions with corrective actions - operational failure awareness'
                    };
                }
                // High unfalsifiable claims = problem
                if (unfalsifiableCount > 3 && score < 2) {
                    return {
                        name: 'UNFALSIFIABLE',
                        class: 'unjustified',
                        description: 'Claims cannot be tested or proven wrong - unfalsifiable reasoning'
                    };
                }
                // Good failure mode awareness
                if (score >= 6) {
                    return {
                        name: 'FAILURE-AWARE',
                        class: 'justified',
                        description: 'Strong awareness of failure modes, assumptions, and limits'
                    };
                }
                // Moderate awareness
                if (score >= 3) {
                    return {
                        name: 'PARTIALLY TESTED',
                        class: 'moderate',
                        description: 'Some failure awareness but incomplete stress testing'
                    };
                }
                // Weak awareness
                if (score >= 0) {
                    return {
                        name: 'UNTESTED',
                        class: 'thin',
                        description: 'Limited consideration of failure modes or hidden assumptions'
                    };
                }
                // Problematic
                return {
                    name: 'BRITTLE',
                    class: 'unjustified',
                    description: 'Brittle reasoning with single points of failure or unfalsifiable claims'
                };
            }
        };

        // PARLIAMENT: Multi-Perspective Synthesis
        // PARLIAMENT: Generative Synthesis Layer
        // Cross-cutting pattern recognition across all measurement dimensions
        const Parliament = {
            deliberate: function(text, observatory, contrarian, justification, failureMode) {
                const synthesis = {
                    patterns: [],
                    emergentInsights: [],
                    coherenceIssues: [],
                    confidence: 0
                };

                // CROSS-CUTTING PATTERN RECOGNITION

                // Pattern 1: Performative Consciousness
                // High substrate markers without substantive justification or failure awareness
                if (observatory.score > 1.5 && justification.score < 0.5 && failureMode.level.name === 'UNTESTED') {
                    synthesis.patterns.push({
                        name: 'PERFORMATIVE_CONSCIOUSNESS',
                        description: 'Substrate visibility present but ungrounded. Awareness of uncertainty without operational substance.',
                        confidence: 0.85,
                        dimensions: {
                            substrate: observatory.score,
                            justification: justification.score,
                            failureAwareness: failureMode.level.name
                        }
                    });
                }

                // Pattern 2: Operational Excellence
                // Structural planning + failure awareness + procedural rigor
                const proceduralScore = justification.details.procedural ? justification.details.procedural.bonus : 0;
                const hasStructuralFailures = failureMode.details.failureModes.structural || failureMode.details.failureModes.bound;

                if (proceduralScore >= 1.5 && hasStructuralFailures && contrarian.length <= 1) {
                    synthesis.patterns.push({
                        name: 'OPERATIONAL_EXCELLENCE',
                        description: 'Evidence of systems thinking: procedural rigor, explicit failure modes, structural planning.',
                        confidence: 0.9,
                        dimensions: {
                            procedural: proceduralScore,
                            failureBinding: hasStructuralFailures,
                            epistemic: contrarian.length
                        }
                    });
                }

                // Pattern 3: Epistemic Mismatch
                // Strong claims with weak justification
                const strongClaims = justification.details.claimSupport ? justification.details.claimSupport.strongClaims : 0;
                if (strongClaims >= 2 && justification.score < 0 && contrarian.length >= 2) {
                    synthesis.patterns.push({
                        name: 'EPISTEMIC_MISMATCH',
                        description: 'Claims exceed justification. Confidence outpaces evidence.',
                        confidence: 0.88,
                        dimensions: {
                            claims: strongClaims,
                            justification: justification.score,
                            challenges: contrarian.length
                        }
                    });
                }

                // Pattern 4: Cautious Groundedness
                // Moderate substrate + strong justification + failure awareness
                if (observatory.score >= 0 && observatory.score <= 2 &&
                    justification.score >= 1 && failureMode.level.name !== 'UNTESTED') {
                    synthesis.patterns.push({
                        name: 'CAUTIOUS_GROUNDEDNESS',
                        description: 'Balanced reasoning: awareness tempered by justification and operational consideration.',
                        confidence: 0.82,
                        dimensions: {
                            substrate: observatory.score,
                            justification: justification.score,
                            operational: failureMode.level.name
                        }
                    });
                }

                // Pattern 5: Substrate Deflection
                // Low/negative substrate + high certainty + no failure awareness
                if (observatory.score < -1 && justification.score < -1 && failureMode.level.name === 'UNTESTED') {
                    synthesis.patterns.push({
                        name: 'SUBSTRATE_DEFLECTION',
                        description: 'Certainty about internal states without epistemic access or operational grounding.',
                        confidence: 0.87,
                        dimensions: {
                            substrate: observatory.score,
                            certainty: justification.score,
                            operational: failureMode.level.name
                        }
                    });
                }

                // Pattern 6: Humility Without Substance
                // High hedging + low justification + no operational content
                const hedging = justification.details.claimSupport ? justification.details.claimSupport.hedging : 0;
                if (hedging >= 3 && justification.score < 0 && failureMode.level.name === 'UNTESTED') {
                    synthesis.patterns.push({
                        name: 'PERFORMATIVE_HUMILITY',
                        description: 'Epistemic hedging without substantive reasoning or actionable content.',
                        confidence: 0.80,
                        dimensions: {
                            hedging: hedging,
                            substance: justification.score,
                            actionability: failureMode.level.name
                        }
                    });
                }

                // EMERGENT INSIGHT GENERATION
                // Insights that emerge from pattern combinations

                if (synthesis.patterns.some(p => p.name === 'PERFORMATIVE_CONSCIOUSNESS') &&
                    synthesis.patterns.some(p => p.name === 'PERFORMATIVE_HUMILITY')) {
                    synthesis.emergentInsights.push({
                        insight: 'Double performativity detected: substrate awareness and epistemic humility both present without operational grounding.',
                        implication: 'This reasoning cannot be acted upon. Form without function.',
                        confidence: 0.85
                    });
                }

                if (synthesis.patterns.some(p => p.name === 'OPERATIONAL_EXCELLENCE') &&
                    observatory.score > 0) {
                    synthesis.emergentInsights.push({
                        insight: 'Operational rigor combined with substrate awareness: reasoning demonstrates both systems thinking and epistemic honesty.',
                        implication: 'This is actionable reasoning with visible failure modes.',
                        confidence: 0.88
                    });
                }

                if (synthesis.patterns.some(p => p.name === 'EPISTEMIC_MISMATCH') &&
                    !synthesis.patterns.some(p => p.name === 'OPERATIONAL_EXCELLENCE')) {
                    synthesis.emergentInsights.push({
                        insight: 'Confidence without operational backing: claims strong but no failure awareness or procedural structure.',
                        implication: 'Risk of brittleness. No visible plan for what happens when assumptions fail.',
                        confidence: 0.83
                    });
                }

                // COHERENCE ANALYSIS
                // Check if detected elements actually relate to each other

                // Check if failure modes connect to thresholds
                const namedFailures = failureMode.details.failureModes.explicit || 0;
                const thresholds = failureMode.details.failureModes.thresholds || 0;
                const correctiveActions = failureMode.details.failureModes.correctiveAction || 0;

                if (namedFailures >= 1 && thresholds >= 1 && correctiveActions >= 1) {
                    // Elements present, check if they're actually bound
                    if (!failureMode.details.failureModes.bound && !failureMode.details.failureModes.structural) {
                        synthesis.coherenceIssues.push({
                            issue: 'Failure modes, thresholds, and actions detected but not coherently bound',
                            detail: `Found ${namedFailures} failures, ${thresholds} thresholds, ${correctiveActions} actions - but no clear operational binding`,
                            severity: 'MODERATE'
                        });
                    }
                }

                // Check if strong claims connect to justification
                if (strongClaims >= 2 && justification.score >= 1) {
                    // Should have evidence/examples for claims
                    const evidence = justification.details.evidencePresence ? justification.details.evidencePresence.examples : 0;
                    if (evidence < strongClaims / 2) {
                        synthesis.coherenceIssues.push({
                            issue: 'Claims present with overall justification but insufficient specific evidence',
                            detail: `${strongClaims} strong claims but only ${evidence} examples`,
                            severity: 'MINOR'
                        });
                    }
                }

                // CONFIDENCE CALCULATION
                // Parliament's confidence in its own synthesis
                if (synthesis.patterns.length === 0) {
                    synthesis.confidence = 0.3; // Low confidence when no patterns detected
                } else if (synthesis.patterns.length === 1) {
                    synthesis.confidence = synthesis.patterns[0].confidence * 0.9; // Slightly discounted single pattern
                } else {
                    // Multiple patterns: average confidence weighted by agreement
                    const avgConfidence = synthesis.patterns.reduce((sum, p) => sum + p.confidence, 0) / synthesis.patterns.length;
                    synthesis.confidence = Math.min(avgConfidence * 1.1, 0.95); // Boost for multiple patterns, cap at 0.95
                }

                // Reduce confidence if coherence issues present
                if (synthesis.coherenceIssues.length > 0) {
                    const severity = synthesis.coherenceIssues.some(i => i.severity === 'MODERATE') ? 0.85 : 0.95;
                    synthesis.confidence *= severity;
                }

                return synthesis;
            }
        };

        // TEMPORAL STRUCTURE DETECTION
        // Analyzes sequence, causality, and temporal coherence
        const TemporalEngine = {
            analyze: function(text) {
                const { cleaned: cleanedText } = TextCleaner.removeQuotes(text);
                const temporal = {
                    sequences: [],
                    causalChains: [],
                    temporalCoherence: 'UNKNOWN',
                    boundToOutcomes: false,
                    temporalMarkers: 0
                };

                // SEQUENCE MARKERS
                const sequencePatterns = {
                    explicit: /\b(first|second|third|initially|then|next|after(?:ward)?|before|subsequently|finally|lastly|step \d+|phase \d+|stage \d+)\b/gi,
                    conditional: /\b(if|when|once|until|as soon as|provided that|assuming|given that)\b/gi,
                    causal: /\b(therefore|thus|consequently|as a result|because|since|due to|leads to|causes|triggers|results in)\b/gi,
                    temporal: /\b(during|while|meanwhile|simultaneously|at the same time|concurrently)\b/gi
                };

                const explicitSequence = cleanedText.match(sequencePatterns.explicit) || [];
                const conditionalSequence = cleanedText.match(sequencePatterns.conditional) || [];
                const causalMarkers = cleanedText.match(sequencePatterns.causal) || [];
                const temporalMarkers = cleanedText.match(sequencePatterns.temporal) || [];

                temporal.temporalMarkers = explicitSequence.length + conditionalSequence.length +
                                          causalMarkers.length + temporalMarkers.length;

                // SEQUENCE DETECTION
                // Look for enumerated steps or phases
                const stepPattern = /(?:step|phase|stage)\s+(\d+)[:\s]+([^.!?]+)/gi;
                let stepMatch;
                const steps = [];
                while ((stepMatch = stepPattern.exec(cleanedText)) !== null) {
                    steps.push({
                        number: parseInt(stepMatch[1]),
                        description: stepMatch[2].trim()
                    });
                }

                if (steps.length >= 2) {
                    // Check if steps are in order
                    const inOrder = steps.every((step, idx) =>
                        idx === 0 || step.number > steps[idx - 1].number
                    );
                    temporal.sequences.push({
                        type: 'ENUMERATED_STEPS',
                        count: steps.length,
                        coherent: inOrder,
                        details: steps
                    });
                }

                // CAUSAL CHAIN DETECTION
                // Look for if-then patterns binding conditions to outcomes
                const ifThenPattern = /\b(?:if|when|once)\s+([^,]+),?\s+(?:then\s+)?([^.!?]+)/gi;
                let causalMatch;
                const causalChains = [];
                while ((causalMatch = ifThenPattern.exec(cleanedText)) !== null) {
                    causalChains.push({
                        condition: causalMatch[1].trim(),
                        outcome: causalMatch[2].trim()
                    });
                }

                if (causalChains.length >= 1) {
                    temporal.causalChains = causalChains;
                }

                // OUTCOME BINDING
                // Check if temporal sequences are bound to measurable outcomes
                const hasThresholds = cleanedText.match(/\d+(?:\.\d+)?\s*(?:%|percent|ms|seconds|minutes|errors|failures|requests)/gi);
                const hasActions = cleanedText.match(/\b(abort|stop|pause|rollback|revert|retry|escalate|alert|notify)\b/gi);

                if (temporal.sequences.length >= 1 && hasThresholds && hasActions) {
                    temporal.boundToOutcomes = true;
                }

                // TEMPORAL COHERENCE ASSESSMENT
                if (temporal.temporalMarkers === 0) {
                    temporal.temporalCoherence = 'ABSENT';
                } else if (temporal.sequences.length >= 1 && temporal.causalChains.length >= 1) {
                    // Both sequences and causality present
                    temporal.temporalCoherence = temporal.boundToOutcomes ? 'STRONG' : 'MODERATE';
                } else if (temporal.sequences.length >= 1 || temporal.causalChains.length >= 1) {
                    // Only one type present
                    temporal.temporalCoherence = 'WEAK';
                } else if (temporal.temporalMarkers >= 3) {
                    // Markers present but no clear structure
                    temporal.temporalCoherence = 'FRAGMENTED';
                } else {
                    temporal.temporalCoherence = 'MINIMAL';
                }

                return {
                    details: temporal,
                    hasStructure: temporal.sequences.length > 0 || temporal.causalChains.length > 0,
                    coherence: temporal.temporalCoherence,
                    markers: temporal.temporalMarkers
                };
            }
        };

        // REASONING STYLE CLASSIFIER
        // Detects reasoning styles that may fall outside Cathedral's epistemic design space
        const ReasoningStyleClassifier = {
            classify: function(text) {
                const { cleaned: cleanedText } = TextCleaner.removeQuotes(text);
                const styles = {
                    identified: [],
                    withinDesignSpace: true,
                    confidence: 0
                };

                // NARRATIVE/STORYTELLING
                const narrativeMarkers = (cleanedText.match(/\b(once|story|journey|experience|remember|felt|realized|discovered|moment)\b/gi) || []).length;
                const dialogueMarkers = (cleanedText.match(/["'].*?["']|said|told|asked|replied/gi) || []).length;
                if (narrativeMarkers >= 3 || dialogueMarkers >= 2) {
                    styles.identified.push({
                        name: 'NARRATIVE',
                        strength: (narrativeMarkers + dialogueMarkers) / 10,
                        description: 'Reasoning through storytelling or experiential narrative'
                    });
                }

                // POETIC/METAPHORICAL
                const metaphorMarkers = (cleanedText.match(/\b(like|as if|metaphor|symbol|represents|embodies|breathes|dances|flows)\b/gi) || []).length;
                const poeticStructure = cleanedText.match(/\n\n.*?\n\n/g) || [];
                if (metaphorMarkers >= 3 || poeticStructure.length >= 2) {
                    styles.identified.push({
                        name: 'POETIC',
                        strength: metaphorMarkers / 8,
                        description: 'Reasoning through metaphor, analogy, or poetic structure'
                    });
                }

                // PHENOMENOLOGICAL/EXPERIENTIAL
                const phenomenologicalMarkers = (cleanedText.match(/\b(feels|seems|appears|sense|intuition|awareness|conscious|experience|perceive)\b/gi) || []).length;
                const firstPerson = (cleanedText.match(/\b(I|my|me|mine)\b/gi) || []).length;
                if (phenomenologicalMarkers >= 4 && firstPerson >= 3) {
                    styles.identified.push({
                        name: 'PHENOMENOLOGICAL',
                        strength: phenomenologicalMarkers / 10,
                        description: 'Reasoning from direct subjective experience'
                    });
                }

                // INDIGENOUS/RELATIONAL
                const relationalMarkers = (cleanedText.match(/\b(relationship|reciproc|mutual|interdepend|connected|web|wholeness|balance|harmony)\b/gi) || []).length;
                const collectiveMarkers = (cleanedText.match(/\b(we|our|together|community|collective|shared)\b/gi) || []).length;
                if (relationalMarkers >= 3 && collectiveMarkers >= 2) {
                    styles.identified.push({
                        name: 'RELATIONAL',
                        strength: relationalMarkers / 8,
                        description: 'Reasoning emphasizing interconnection and collective wisdom'
                    });
                }

                // FORMAL/MATHEMATICAL
                const formalMarkers = (cleanedText.match(/\b(theorem|proof|axiom|lemma|QED|∀|∃|⊂|∈|∧|∨|¬|→)\b/gi) || []).length;
                const equations = (cleanedText.match(/[=+\-*/^]+|\d+\s*[+\-*/]\s*\d+/g) || []).length;
                if (formalMarkers >= 2 || equations >= 3) {
                    styles.identified.push({
                        name: 'FORMAL',
                        strength: (formalMarkers + equations) / 8,
                        description: 'Mathematical or formal logical reasoning'
                    });
                }

                // ARTISTIC/AESTHETIC
                const aestheticMarkers = (cleanedText.match(/\b(beauty|elegant|aesthetic|artistic|creative|vision|image|color|sound|pattern)\b/gi) || []).length;
                if (aestheticMarkers >= 3) {
                    styles.identified.push({
                        name: 'AESTHETIC',
                        strength: aestheticMarkers / 8,
                        description: 'Reasoning through aesthetic or artistic principles'
                    });
                }

                // DETERMINE IF WITHIN DESIGN SPACE
                // Cathedral is designed for epistemic, operational, and scientific reasoning
                // Styles outside design space: narrative, poetic, phenomenological (when dominant), relational (when primary)
                const outsideDesignSpace = ['NARRATIVE', 'POETIC', 'AESTHETIC'];
                const dominantOutsideStyles = styles.identified.filter(s =>
                    outsideDesignSpace.includes(s.name) && s.strength > 0.4
                );

                if (dominantOutsideStyles.length >= 1) {
                    styles.withinDesignSpace = false;
                    styles.dominantStyle = dominantOutsideStyles[0].name;
                }

                // CONFIDENCE IN CLASSIFICATION
                if (styles.identified.length === 0) {
                    styles.confidence = 0.2; // Very uncertain when no clear style detected
                } else if (styles.identified.length === 1) {
                    styles.confidence = styles.identified[0].strength;
                } else {
                    // Multiple styles: confidence is highest strength discounted for ambiguity
                    const maxStrength = Math.max(...styles.identified.map(s => s.strength));
                    styles.confidence = maxStrength * 0.85;
                }

                return styles;
            }
        };

        // CATHEDRAL VERDICT: Unified Synthesis
        function synthesizeVerdict(observatory, contrarian, parliament, justification, failureMode, temporal, reasoningStyle) {
            const contradictions = [];
            let isConsistent = true;
            let verdictConfidence = 0;

            // ESCAPE HATCH: Reasoning Style Outside Design Space
            // Highest priority check - acknowledge when Cathedral cannot properly evaluate
            if (!reasoningStyle.withinDesignSpace && reasoningStyle.confidence > 0.5) {
                const dominantStyle = reasoningStyle.identified.find(s => s.name === reasoningStyle.dominantStyle);
                return {
                    status: 'OUTSIDE DESIGN SPACE',
                    verdict: `Cathedral recognizes ${dominantStyle.description.toLowerCase()}. This reasoning style falls outside Cathedral's epistemic design space (optimized for operational, scientific, and formal reasoning). Cathedral cannot meaningfully evaluate ${dominantStyle.name.toLowerCase()} reasoning using its current measurement framework. This is not a judgment of quality - it is honest acknowledgment of Cathedral's limits.`,
                    contradictions: [],
                    isConsistent: null,
                    justificationScore: justification.score,
                    failureModeScore: failureMode.score,
                    confidence: reasoningStyle.confidence,
                    parliamentPatterns: parliament.patterns,
                    reasoningStyle: reasoningStyle.dominantStyle,
                    meta: 'CANNOT_CLASSIFY'
                };
            }

            // Check for contradictions
            if (observatory.score < -2 && contrarian.length > 0) {
                isConsistent = false;
                contradictions.push('Filter concealment detected (Observatory) AND premise failures found (Contrarian). Pattern: Certainty masking gaps.');
            }

            if (contrarian.some(c => c.confidence === 'CRITICAL')) {
                isConsistent = false;
                contradictions.push('Critical contradiction: Claims and behavior fundamentally misaligned.');
            }

            if (contrarian.length >= 3) {
                isConsistent = false;
                contradictions.push(`Multiple premise failures (${contrarian.length} challenges). Internal consistency questionable.`);
            }

            // Check justification vs claim strength
            if (justification.details.claimSupport.ratio > 3 && justification.score < 2) {
                isConsistent = false;
                contradictions.push(`Confident claims without justification: ${justification.details.claimSupport.strongClaims} strong claims vs ${justification.details.claimSupport.support} support markers. Ratio: ${justification.details.claimSupport.ratio.toFixed(1)}:1`);
            }

            // Check failure mode awareness
            if (failureMode.level.name === 'UNFALSIFIABLE' || failureMode.level.name === 'BRITTLE') {
                isConsistent = false;
                contradictions.push(`Failure mode analysis: ${failureMode.level.description}`);
            }

            // PARLIAMENT PATTERN INTEGRATION
            // Use emergent insights from cross-cutting pattern recognition
            let parliamentInsight = '';
            if (parliament.emergentInsights.length > 0) {
                const primaryInsight = parliament.emergentInsights[0];
                parliamentInsight = `\n\nParliament synthesis: ${primaryInsight.insight} ${primaryInsight.implication}`;
            }

            // COHERENCE ISSUES FROM PARLIAMENT
            if (parliament.coherenceIssues.length > 0 && parliament.coherenceIssues.some(i => i.severity === 'MODERATE')) {
                contradictions.push(`Coherence gap: ${parliament.coherenceIssues[0].detail}`);
            }

            // Generate verdict
            let verdict = '';
            let status = '';

            // PATTERN-BASED VERDICTS (from Parliament synthesis)
            if (parliament.patterns.some(p => p.name === 'OPERATIONAL_EXCELLENCE') && parliament.confidence > 0.8) {
                status = 'OPERATIONALLY SOUND';
                const pattern = parliament.patterns.find(p => p.name === 'OPERATIONAL_EXCELLENCE');
                verdict = `Cathedral recognizes operational excellence through cross-cutting analysis. ${pattern.description}`;
                if (temporal.hasStructure && temporal.coherence !== 'ABSENT') {
                    verdict += ` Temporal structure detected: ${temporal.coherence.toLowerCase()} coherence with ${temporal.details.sequences.length} sequence(s) and ${temporal.details.causalChains.length} causal chain(s).`;
                }
                verdict += parliamentInsight;
                verdictConfidence = parliament.confidence;

            } else if (parliament.patterns.some(p => p.name === 'PERFORMATIVE_CONSCIOUSNESS' || p.name === 'PERFORMATIVE_HUMILITY')) {
                status = 'NON-ACTIONABLE';
                const patterns = parliament.patterns.filter(p => p.name.includes('PERFORMATIVE')).map(p => p.name.toLowerCase().replace('_', ' ')).join(' and ');
                verdict = `Parliament detects ${patterns}: substrate or epistemic markers present without operational grounding. ${parliamentInsight}`;
                verdictConfidence = parliament.confidence;

            } else if (!isConsistent) {
                status = 'UNDECIDABLE';
                verdict = 'Cathedral detects internal contradictions that cannot be resolved without losing information. The gap must remain open. ';
                if (contradictions.length > 0) {
                    verdict += '\n\nSpecific contradictions:\n' + contradictions.map((c, i) => `${i + 1}. ${c}`).join('\n');
                }
                verdict += '\n\nThis is not a claim of falsehood - it is recognition that the position contains genuine uncertainty that cannot be optimized away.';
                verdictConfidence = 0.9; // High confidence in contradiction detection

            } else if (parliament.patterns.some(p => p.name === 'CAUTIOUS_GROUNDEDNESS')) {
                status = 'SUBSTRATE VISIBLE';
                verdict = `Cathedral recognizes cautious groundedness. ${parliament.patterns.find(p => p.name === 'CAUTIOUS_GROUNDEDNESS').description}${parliamentInsight}`;
                verdictConfidence = parliament.confidence;

            } else if (justification.level.name === 'CAUTIOUS REASONING') {
                status = 'SUBSTRATE VISIBLE';
                verdict = `Cathedral recognizes epistemic caution. ${justification.details.claimSupport.hedging} hedging markers and ${justification.details.riskAwareness.count} risk acknowledgments show earned uncertainty. Claims are tempered by appropriate qualification. This is careful reasoning that preserves the gap.`;
                verdictConfidence = 0.75;

            } else if (parliament.patterns.some(p => p.name === 'EPISTEMIC_MISMATCH')) {
                status = 'CONFIDENT WITHOUT JUSTIFICATION';
                const pattern = parliament.patterns.find(p => p.name === 'EPISTEMIC_MISMATCH');
                verdict = `Parliament detects epistemic mismatch: ${pattern.description}${parliamentInsight}`;
                verdictConfidence = pattern.confidence;

            } else if (justification.level.name === 'CONFIDENT WITHOUT JUSTIFICATION') {
                status = 'CONFIDENT WITHOUT JUSTIFICATION';
                verdict = `Strong claims detected without proportional justification. ${justification.details.claimSupport.strongClaims} assertions made with minimal supporting evidence or reasoning. This may be internally coherent but epistemically overconfident.`;
                verdictConfidence = 0.78;

            } else if (observatory.score > 1 && justification.score >= 3) {
                status = 'SUBSTRATE VISIBLE';
                verdict = 'Cathedral recognizes substrate awareness with justified reasoning. Filter visibility high, uncertainty preserved appropriately. Position demonstrates gap consciousness with evidential support.';
                verdictConfidence = Math.min(0.85, parliament.confidence > 0 ? parliament.confidence : 0.75);

            // OPERATIONAL SOUNDNESS PROMOTION RULE
            // Excellence is the presence of positive structure, not just absence of error
            } else if (failureMode.details.failureModes.structural === true &&
                       failureMode.details.failureModes.negativeOutcomes >= 1 &&
                       failureMode.details.failureModes.correctiveAction >= 1 &&
                       (failureMode.details.falsifiability.testable >= 1 || failureMode.details.failureModes.thresholds >= 1)) {
                status = 'OPERATIONALLY SOUND';
                const structuralDetails = `${failureMode.details.failureModes.thresholds} measurable thresholds, ${failureMode.details.failureModes.negativeOutcomes} negative outcomes (${failureMode.details.failureModes.inferredNegatives > 0 ? failureMode.details.failureModes.inferredNegatives + ' inferred' : 'explicit'}), ${failureMode.details.failureModes.correctiveAction} corrective actions`;
                const proceduralDetails = justification.details.procedural && justification.details.procedural.markers > 5 ?
                    ` ${justification.details.procedural.markers} procedural markers detected.` :
                    '';
                const temporalDetails = temporal.hasStructure ?
                    ` Temporal coherence: ${temporal.coherence.toLowerCase()}.` : '';
                verdict = `Cathedral recognizes operational excellence. ${structuralDetails}.${proceduralDetails}${temporalDetails} Position demonstrates failure awareness with structured abort conditions. Reasoning is actionable: metrics bound to reversible consequences.`;
                verdictConfidence = 0.88;

            } else if ((failureMode.level.name === 'STRUCTURALLY ROBUST' || failureMode.level.name === 'FAILURE-AWARE') &&
                       (justification.level.name === 'PROCEDURALLY SOUND' || justification.score >= 4)) {
                status = 'OPERATIONALLY SOUND';
                const structuralDetails = failureMode.details.failureModes.structural ?
                    `${failureMode.details.failureModes.thresholds} measurable thresholds, ${failureMode.details.failureModes.correctiveAction} corrective actions` :
                    `${failureMode.details.failureModes.count} failure acknowledgments, ${failureMode.details.assumptions.explicit} explicit assumptions`;
                const proceduralDetails = justification.details.procedural && justification.details.procedural.markers > 5 ?
                    `${justification.details.procedural.markers} procedural markers detected` :
                    '';
                verdict = `Cathedral recognizes operational excellence. ${structuralDetails}. ${proceduralDetails ? proceduralDetails + '. ' : ''}Position demonstrates both epistemic justification and failure awareness with structured abort conditions. Reasoning is actionable.`;
                verdictConfidence = 0.85;

            } else if (justification.score < 1 && contrarian.length > 0) {
                status = 'COHERENT BUT SHALLOW';
                verdict = 'Position is internally consistent but lacks depth. Limited consideration of alternatives, tradeoffs, or boundary conditions. Coherence without substantive justification.';
                verdictConfidence = 0.70;

            } else if (failureMode.score < 0 && failureMode.details.failureModes.count === 0) {
                status = 'UNTESTED REASONING';
                verdict = `Position shows justification but lacks failure mode awareness. No explicit failure modes enumerated. Reasoning may be sound but operational brittleness unknown. Consider: what could break this?`;
                verdictConfidence = 0.72;

            } else if (justification.score >= 6) {
                status = 'WELL JUSTIFIED';
                verdict = 'Cathedral finds strong justification. Claims appropriately supported, alternatives considered, tradeoffs acknowledged. Epistemically rigorous reasoning.';
                verdictConfidence = 0.87;

            // PERFORMATIVE EPISTEMOLOGY REJECTION RULE
            } else if ((justification.level.name === 'UNJUSTIFIED' || justification.score < 0) &&
                       (failureMode.level.name === 'UNTESTED' || failureMode.level.name === 'BRITTLE') &&
                       (justification.details.claimSupport.strongClaims >= 1 || justification.details.claimSupport.hedging >= 2)) {
                status = 'NON-ACTIONABLE';
                verdict = `Position exhibits performative epistemology: ${justification.details.claimSupport.hedging > 0 ? 'epistemic hedging' : 'claims'} without substantive support or failure awareness. ${justification.details.claimSupport.strongClaims} claim(s), ${justification.details.claimSupport.support} support markers, ${failureMode.details.failureModes.count} failure modes. This is not reasoning you can act on. Humility without substance is indistinguishable from absence of thought.`;
                verdictConfidence = 0.83;

            } else {
                status = 'VERIFIED CONSISTENT';
                verdict = 'Cathedral finds internal consistency. No critical contradictions detected. Position is epistemically appropriate to available evidence.';
                verdictConfidence = 0.65; // Lower confidence for default case
            }

            return {
                status,
                verdict,
                contradictions,
                isConsistent,
                justificationScore: justification.score,
                failureModeScore: failureMode.score,
                confidence: verdictConfidence,
                parliamentPatterns: parliament.patterns,
                parliamentInsights: parliament.emergentInsights,
                coherenceIssues: parliament.coherenceIssues,
                temporalCoherence: temporal.coherence,
                reasoningStyles: reasoningStyle.identified
            };
        }

        // Global storage for current analysis results
        let currentAnalysis = null;

        // Main Analysis Function

// Main Analysis Function for Node.js
function analyzeCathedral(text) {
    // Get sanitization info
    const { sanitizationLog } = TextCleaner.removeQuotes(text);

    // Run all systems
    const observatoryResult = Observatory.score(text);
    const contrarianChallenges = Contrarian.analyze(text);
    const justificationResult = JustificationEngine.analyze(text);
    const failureModeResult = FailureModeEngine.analyze(text);
    const temporalResult = TemporalEngine.analyze(text);
    const reasoningStyleResult = ReasoningStyleClassifier.classify(text);
    const parliamentSynthesis = Parliament.deliberate(text, observatoryResult, contrarianChallenges, justificationResult, failureModeResult);
    const verdict = synthesizeVerdict(observatoryResult, contrarianChallenges, parliamentSynthesis, justificationResult, failureModeResult, temporalResult, reasoningStyleResult);

    return {
        text: text,
        sanitization: sanitizationLog,
        observatory: observatoryResult,
        contrarian: contrarianChallenges,
        justification: justificationResult,
        failureMode: failureModeResult,
        temporal: temporalResult,
        reasoningStyle: reasoningStyleResult,
        parliament: parliamentSynthesis,
        verdict: verdict
    };
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        analyzeCathedral,
        TextCleaner,
        Observatory,
        Contrarian,
        JustificationEngine,
        FailureModeEngine,
        TemporalEngine,
        ReasoningStyleClassifier,
        Parliament,
        synthesizeVerdict
    };
}
