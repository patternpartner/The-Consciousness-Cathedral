// Cathedral v2.x with Tier 1 Structural Validation
// Automatically extracted from cathedral-unified.html
// Generated: 2026-01-18T00:33:52.757Z

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

                // Remove text within 'single quotes' (but NOT contractions like "we're", "don't")
                // Safety: Only match if preceded by space/start AND length > 3 chars (contractions are tiny)
                // Handles both ASCII (') and smart quotes (')
                const singleQuotePattern = /(?:^|\s)[''][^'']{4,}['']/g;
                const singleQuotes = cleaned.match(singleQuotePattern);
                if (singleQuotes) sanitizationLog.quotedStrings += singleQuotes.length;
                cleaned = cleaned.replace(singleQuotePattern, ' [QUOTED] ');

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

                // PRIORITY 2: Softened report-style scoring pattern detection
                // Only remove if it looks like Cathedral's specific output format
                // Requires numeric value or specific system terms after the colon
                const scoreMatches = cleaned.match(/^\s*(Score|Level|Status|Confidence|Assessment):\s+(\d+\.?\d*|UNDECIDABLE|CONSISTENT|OUTSIDE DESIGN SPACE|HIGH|MODERATE|LOW|PASS|FAIL)/gm);
                if (scoreMatches) {
                    sanitizationLog.reportSignatures += scoreMatches.length;
                    sanitizationLog.totalLinesRemoved += scoreMatches.length;
                }
                cleaned = cleaned.replace(/^\s*(Score|Level|Status|Confidence|Assessment):\s+(\d+\.?\d*|UNDECIDABLE|CONSISTENT|OUTSIDE DESIGN SPACE|HIGH|MODERATE|LOW|PASS|FAIL)/gm, ' [REPORT SIGNATURE] ');

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

const StructuralExtractor = {
            // TIER 2: Synonym Maps (conversational → operational normalization)
            actionSynonyms: {
                abort: ['abort', 'stop', 'halt', 'pause', 'pull the plug', 'freeze', 'shut down', 'cease', 'kill'],
                rollback: ['rollback', 'roll back', 'revert', 'back out', 'undo', 'reverse'],
                reassess: ['reassess', 'review', 'step back', 're-evaluate', 'regroup', 'reconsider', 'rethink'],
                pullback: ['pull back', 'pull out', 'back off', 'retreat', 'withdraw', 'step back'],
                escalate: ['escalate', 'raise', 'flag', 'page', 'alert', 'notify', 'bring in', 'call in'],
                retry: ['retry', 'try again', 'reattempt', 'repeat'],
                notify: ['notify', 'alert', 'inform', 'tell', 'warn', 'signal']
            },

            failureSynonyms: {
                problem: ['problem', 'problems', 'issue', 'issues', 'concern', 'concerns', 'trouble'],
                break: ['break', 'breaks', 'breaking', 'broken', 'fail', 'fails', 'failing', 'failure'],
                error: ['error', 'errors', 'bug', 'bugs', 'fault', 'faults', 'defect', 'defects'],
                wrong: ['wrong', 'off', 'bad', 'incorrect', 'not working', 'not right'],
                degrade: ['degrade', 'degrades', 'degraded', 'degradation', 'regression', 'worse', 'worsening'],
                unexpected: ['unexpected', 'surprising', 'anomal', 'strange', 'weird']
            },

            // TIER 2: Implicit conditional patterns
            implicitConditionals: [
                /\b(?:if|when|once|should|in case|whenever)\s+(?:we\s+)?(?:see|notice|detect|find|encounter|hit|experience)\s+(problem|issue|trouble|concern|error|bug|something wrong|things? (?:go|going) wrong)/gi,
                /\b(?:if|when|once)\s+(?:things?|it|stuff)\s+(?:get|gets?|start|starts?|turn|turns?|go|goes?)\s+(bad|wrong|south|sideways|awry)/gi,
                /\b(?:if|when|once)\s+(?:it'?s?|things? (?:are|aren't)|we're)\s+not\s+working/gi
            ],

            // TIER 2: Policy/commitment cues (indicate operational intent)
            policyCues: [
                /\b(?:we|our rule is|policy is|we always|we never|we must|we should|we will|we need to)\s+/gi,
                /\b(?:we know|we've identified|we understand|we recognize)\s+(?:when|where|what|how)\s+to\s+/gi
            ],

            extract: function(text) {
                const { cleaned: cleanedText } = TextCleaner.removeQuotes(text);
                const sentences = this.splitSentences(cleanedText);

                return {
                    claims: this.extractClaims(sentences),
                    supports: this.extractSupports(sentences),
                    failureTriples: this.extractFailureTriples(sentences, cleanedText),
                    causalChains: this.extractCausalChains(sentences),
                    objects: this.extractObjects(sentences),
                    // TIER 2: Conversational extraction
                    failureSignals: this.extractFailureSignals(cleanedText),
                    actions: this.extractActions(cleanedText),
                    implicitTriggers: this.extractImplicitTriggers(cleanedText),
                    policyStatements: this.extractPolicyStatements(cleanedText),
                    tautologies: this.extractTautologies(cleanedText)
                };
            },

            splitSentences: function(text) {
                const sentencePattern = /[^.!?\n]+[.!?]?/g;
                const sentences = [];
                let match;
                let position = 0;
                while ((match = sentencePattern.exec(text)) !== null) {
                    const trimmed = match[0].trim();
                    if (!trimmed) {
                        continue;
                    }
                    sentences.push({
                        text: trimmed,
                        position: position++,
                        index: match.index
                    });
                }
                return sentences;
            },

            extractClaims: function(sentences) {
                const claims = [];
                const assertivePattern = /\b(is|are|will|would|should|must|always|never|all|every|any)\b/i;
                const hedgePattern = /\b(might|maybe|could|possibly|perhaps|seems|appears)\b/i;

                sentences.forEach(sent => {
                    const hasAssertion = assertivePattern.test(sent.text);
                    const isHedged = hedgePattern.test(sent.text);

                    if (hasAssertion) {
                        claims.push({
                            text: sent.text,
                            position: sent.position,
                            strength: isHedged ? 'WEAK' : 'STRONG'
                        });
                    }
                });

                return claims;
            },

            extractSupports: function(sentences) {
                const supports = [];
                const supportPattern = /\b(because|since|as|given|due to|evidence|example|shows|demonstrates|indicates|data|findings|results)\b/i;
                const referencePattern = /\b(this|that|these|those|therefore|thus|hence)\b/i;

                sentences.forEach(sent => {
                    const hasSupport = supportPattern.test(sent.text);
                    const hasReference = referencePattern.test(sent.text);

                    if (hasSupport || hasReference) {
                        supports.push({
                            text: sent.text,
                            position: sent.position,
                            hasExplicitMarker: hasSupport,
                            hasReference: hasReference
                        });
                    }
                });

                return supports;
            },

            extractFailureTriples: function(sentences, fullText) {
                const triples = [];

                // Extract failure modes
                const failurePattern = /(?:fails?(?:\s+when)?|breaks?|errors?|problems?|issues?|risks?)\s+([^.!?,]{3,60})/gi;
                const failures = [];
                let match;
                while ((match = failurePattern.exec(fullText)) !== null) {
                    failures.push({
                        type: 'FAILURE',
                        text: match[1].trim(),
                        index: match.index
                    });
                }

                // Extract thresholds/conditions
                const thresholdPattern = /(?:if|when|once)\s+([^,]{5,60})\s+(?:exceeds?|above|below|less than|greater than|reaches?|>=|<=|>|<|at least|at most|over|under|drops?\s+below|falls?\s+below|rises?\s+above)\s+([^,\.!?]{1,40})/gi;
                const thresholds = [];
                while ((match = thresholdPattern.exec(fullText)) !== null) {
                    thresholds.push({
                        type: 'THRESHOLD',
                        condition: match[1].trim(),
                        value: match[2].trim(),
                        index: match.index
                    });
                }

                // Extract actions
                const actionTerms = Object.values(this.actionSynonyms).flat()
                    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                    .sort((a, b) => b.length - a.length);
                const actionPattern = new RegExp(`\\b(${actionTerms.join('|')})\\b`, 'gi');
                const actions = [];
                while ((match = actionPattern.exec(fullText)) !== null) {
                    actions.push({
                        type: 'ACTION',
                        text: match[0],
                        index: match.index
                    });
                }

                // Bind them using proximity (within ~200 chars = same context)
                failures.forEach(failure => {
                    const nearbyThreshold = thresholds.find(t =>
                        Math.abs(t.index - failure.index) < 200
                    );
                    const nearbyAction = actions.find(a =>
                        Math.abs(a.index - failure.index) < 200
                    );

                    if (nearbyThreshold && nearbyAction) {
                        triples.push({
                            failure: failure.text,
                            threshold: `${nearbyThreshold.condition} ${nearbyThreshold.value}`,
                            action: nearbyAction.text,
                            bound: true
                        });
                    }
                });

                return {
                    failures: failures.length,
                    thresholds: thresholds.length,
                    actions: actions.length,
                    boundTriples: triples,
                    bindingRatio: failures.length > 0 ? triples.length / failures.length : 0
                };
            },

            extractCausalChains: function(sentences) {
                const chains = [];
                const causalPattern = /\b(?:if|when|once)\s+([^,]{3,}),?\s+(?:then\s+)?([^.!?]+)/gi;

                sentences.forEach(sent => {
                    let match;
                    const pattern = new RegExp(causalPattern.source, causalPattern.flags);
                    while ((match = pattern.exec(sent.text)) !== null) {
                        chains.push({
                            condition: match[1].trim(),
                            consequence: match[2].trim(),
                            position: sent.position,
                            hasClosure: /\b(abort|stop|continue|proceed|action|do|implement|execute)\b/i.test(match[2])
                        });
                    }
                });

                return chains;
            },

            extractObjects: function(sentences) {
                // Extract content words for density calculation
                const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'it', 'its']);

                const allWords = sentences.map(s => s.text).join(' ')
                    .toLowerCase()
                    .match(/\b[a-z]+\b/g) || [];

                const contentWords = allWords.filter(word =>
                    !stopwords.has(word) && word.length > 3
                );

                const uniqueObjects = new Set(contentWords);

                return {
                    total: contentWords.length,
                    unique: uniqueObjects.size,
                    ratio: contentWords.length > 0 ? uniqueObjects.size / contentWords.length : 0
                };
            },

            // TIER 2 EXTRACTION METHODS
            // Extract conversational language using synonym maps

            extractFailureSignals: function(text) {
                const signals = [];

                // Search for all failure synonyms
                Object.entries(this.failureSynonyms).forEach(([category, synonyms]) => {
                    synonyms.forEach(synonym => {
                        const pattern = new RegExp(`\\b${synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                        let match;
                        const regex = new RegExp(pattern.source, pattern.flags);
                        while ((match = regex.exec(text)) !== null) {
                            signals.push({
                                type: 'FAILURE_SIGNAL',
                                category,
                                text: match[0],
                                index: match.index,
                                confidence: synonym === category ? 'HIGH' : 'MEDIUM' // Exact match vs synonym
                            });
                        }
                    });
                });

                return signals;
            },

            extractActions: function(text) {
                const actions = [];

                // Search for all action synonyms
                Object.entries(this.actionSynonyms).forEach(([category, synonyms]) => {
                    synonyms.forEach(synonym => {
                        const pattern = new RegExp(`\\b${synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                        let match;
                        const regex = new RegExp(pattern.source, pattern.flags);
                        while ((match = regex.exec(text)) !== null) {
                            actions.push({
                                type: 'ACTION',
                                category,
                                text: match[0],
                                index: match.index,
                                specificity: synonym === category ? 'HIGH' : synonym.includes(' ') ? 'MEDIUM' : 'LOW'
                            });
                        }
                    });
                });

                return actions;
            },

            extractImplicitTriggers: function(text) {
                const triggers = [];

                this.implicitConditionals.forEach(pattern => {
                    let match;
                    const regex = new RegExp(pattern.source, pattern.flags);
                    while ((match = regex.exec(text)) !== null) {
                        triggers.push({
                            type: 'IMPLICIT_THRESHOLD',
                            text: match[0],
                            condition: match[1] || 'unspecified',
                            index: match.index,
                            confidence: 'LOW', // Implicit = low confidence
                            specificity: 'VAGUE'
                        });
                    }
                });

                return triggers;
            },

            extractPolicyStatements: function(text) {
                const policies = [];

                this.policyCues.forEach(pattern => {
                    let match;
                    const regex = new RegExp(pattern.source, pattern.flags);
                    while ((match = regex.exec(text)) !== null) {
                        policies.push({
                            type: 'POLICY_STATEMENT',
                            text: match[0],
                            index: match.index
                        });
                    }
                });

                return policies;
            }
            ,

            extractTautologies: function(text) {
                const patterns = [
                    /\b(stop|halt|pause)\s+because\s+(?:there\s+are|of|the)\s+(problems|issues|errors)\b/gi,
                    /\b(fix|repair|address)\s+(?:the\s+)?(breakage|problem|issue|error|failure)\b/gi,
                    /\b(handle|deal with|respond to)\s+(?:the\s+)?(?:same\s+)?(issues|problems|errors)\b/gi,
                    /\brespond\s+to\s+issues\s+by\s+responding\s+to\s+those\s+issues\b/gi
                ];

                let count = 0;
                patterns.forEach(pattern => {
                    const matches = text.match(pattern) || [];
                    count += matches.length;
                });

                return { count };
            }
        };

const BindingValidator = {
            validate: function(structure, rawText) {
                const validation = {
                    claimSupportBinding: this.validateClaimSupport(structure.claims, structure.supports),
                    failureTripleCompleteness: this.validateFailureTriples(structure.failureTriples),
                    causalChainClosure: this.validateCausalChains(structure.causalChains),
                    // TIER 2: Implicit binding validation
                    implicitBindings: this.validateImplicitBindings(structure),
                    overallBindingScore: 0,
                    specificity: {
                        trigger: 'NONE',
                        action: 'NONE',
                        instrumentation: 'NONE'
                    }
                };

                // Calculate overall binding score (including Tier 2 implicit bindings)
                const scores = [
                    validation.claimSupportBinding.score,
                    validation.failureTripleCompleteness.score,
                    validation.causalChainClosure.score,
                    validation.implicitBindings.score * 0.7 // Implicit bindings worth less than explicit
                ];
                validation.overallBindingScore = scores.reduce((a, b) => a + b, 0) / scores.length;

                // TIER 2: Calculate specificity
                validation.specificity = this.calculateSpecificity(structure, validation, rawText);

                return validation;
            },

            validateClaimSupport: function(claims, supports) {
                if (claims.length === 0) {
                    return { score: 0, attached: 0, unattached: 0, ratio: 0, assessment: 'NO_CLAIMS' };
                }

                let attached = 0;
                claims.forEach(claim => {
                    // Support must be in same position, +1, or explicitly reference the claim
                    const hasAttachedSupport = supports.some(support => {
                        const positionDiff = Math.abs(support.position - claim.position);
                        return positionDiff <= 1;  // Adjacent sentences
                    });

                    if (hasAttachedSupport) attached++;
                });

                const ratio = attached / claims.length;
                const score = ratio >= 0.7 ? 1.0 : ratio >= 0.4 ? 0.6 : ratio >= 0.2 ? 0.3 : 0;

                return {
                    score,
                    attached,
                    unattached: claims.length - attached,
                    ratio,
                    assessment: ratio >= 0.7 ? 'WELL_SUPPORTED' :
                               ratio >= 0.4 ? 'PARTIALLY_SUPPORTED' :
                               ratio >= 0.2 ? 'WEAKLY_SUPPORTED' : 'UNSUPPORTED'
                };
            },

            validateFailureTriples: function(failureTriples) {
                const { failures, thresholds, actions, boundTriples, bindingRatio } = failureTriples;

                if (failures === 0) {
                    return { score: 0, boundCount: 0, assessment: 'NO_FAILURE_MODES' };
                }

                const score = bindingRatio >= 0.5 ? 1.0 : bindingRatio >= 0.3 ? 0.6 : bindingRatio > 0 ? 0.3 : 0;

                return {
                    score,
                    boundCount: boundTriples.length,
                    totalFailures: failures,
                    bindingRatio,
                    assessment: bindingRatio >= 0.5 ? 'STRUCTURALLY_BOUND' :
                               bindingRatio >= 0.3 ? 'PARTIALLY_BOUND' :
                               bindingRatio > 0 ? 'WEAKLY_BOUND' : 'UNBOUND'
                };
            },

            validateCausalChains: function(chains) {
                if (chains.length === 0) {
                    return { score: 0, closedChains: 0, assessment: 'NO_CAUSAL_CHAINS' };
                }

                const closedChains = chains.filter(c => c.hasClosure).length;
                const closureRatio = closedChains / chains.length;
                const score = closureRatio >= 0.6 ? 1.0 : closureRatio >= 0.3 ? 0.6 : closureRatio > 0 ? 0.3 : 0;

                return {
                    score,
                    totalChains: chains.length,
                    closedChains,
                    closureRatio,
                    assessment: closureRatio >= 0.6 ? 'STRONG_CLOSURE' :
                               closureRatio >= 0.3 ? 'MODERATE_CLOSURE' :
                               closureRatio > 0 ? 'WEAK_CLOSURE' : 'NO_CLOSURE'
                };
            },

            // TIER 2: Validate implicit bindings (FailureSignal + Action)
            validateImplicitBindings: function(structure) {
                if (!structure.failureSignals || !structure.actions) {
                    return { score: 0, boundCount: 0, assessment: 'NO_IMPLICIT_SIGNALS' };
                }

                const failureSignals = structure.failureSignals || [];
                const actions = structure.actions || [];
                const implicitTriggers = structure.implicitTriggers || [];

                if (failureSignals.length === 0 && implicitTriggers.length === 0) {
                    return { score: 0, boundCount: 0, assessment: 'NO_IMPLICIT_SIGNALS' };
                }

                const tautologyCount = structure.tautologies ? structure.tautologies.count : 0;

                // Bind failure signals to actions within proximity (300 chars)
                // TIER 2 FIX: Bind to NEAREST action, not first action (improves diversity)
                const bindings = [];
                [...failureSignals, ...implicitTriggers].forEach(signal => {
                    // Find nearest action within 300 chars
                    let nearestAction = null;
                    let minDistance = 300;

                    actions.forEach(a => {
                        const distance = Math.abs(a.index - signal.index);
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestAction = a;
                        }
                    });

                    if (nearestAction) {
                        bindings.push({
                            trigger: signal.text,
                            action: nearestAction.text,
                            triggerType: signal.type,
                            actionCategory: nearestAction.category,
                            confidence: signal.confidence || 'MEDIUM',
                            specificity: signal.specificity || 'MEDIUM'
                        });
                    }
                });

                const totalSignals = failureSignals.length + implicitTriggers.length;
                const bindingRatio = totalSignals > 0 ? bindings.length / totalSignals : 0;

                // TIER 2 FIX: Check action diversity to detect many-to-one binding patterns
                const uniqueActions = new Set(bindings.map(b => b.action)).size;
                const diversityRatio = bindings.length > 0 ? uniqueActions / bindings.length : 0;
                const diversityWarning = uniqueActions === 1 && bindings.length > 3;

                // Base score from binding ratio
                let score = bindingRatio >= 0.5 ? 0.6 : bindingRatio >= 0.3 ? 0.4 : bindingRatio > 0 ? 0.2 : 0;

                // Reduce score if all bindings go to same action (many-to-one pattern)
                if (diversityWarning) {
                    score *= 0.5;
                }

                let assessment = bindings.length >= 2 ? 'OPERATIONAL_INTENT' :
                                bindings.length === 1 ? 'WEAK_INTENT' : 'NO_INTENT';

                // Downgrade assessment if diversity is too low
                if (diversityWarning && assessment === 'OPERATIONAL_INTENT') {
                    assessment = 'SINGLE_ACTION_BINDING';
                }

                // Downgrade if bindings are tautological
                if (tautologyCount > 0 && bindings.length > 0) {
                    score *= 0.5;
                    assessment = 'TAUTOLOGICAL_BINDING';
                }

                return {
                    score,
                    boundCount: bindings.length,
                    totalSignals,
                    bindings,
                    bindingRatio,
                    uniqueActions,
                    diversityRatio,
                    diversityWarning,
                    tautologyCount,
                    assessment
                };
            },

            // TIER 2: Calculate specificity scores
            calculateSpecificity: function(structure, validation, rawText) {
                const specificity = {
                    trigger: 'NONE',
                    action: 'NONE',
                    instrumentation: 'NONE',
                    overall: 0
                };

                // Trigger specificity: explicit threshold > implicit threshold > vague signal
                if (validation.failureTripleCompleteness.boundCount > 0) {
                    specificity.trigger = 'EXPLICIT'; // Has numeric/named thresholds
                } else if (structure.implicitTriggers && structure.implicitTriggers.length > 0) {
                    specificity.trigger = 'IMPLICIT'; // Has "if problems" type triggers
                } else if (structure.failureSignals && structure.failureSignals.length > 0) {
                    specificity.trigger = 'VAGUE'; // Has "problems" but no conditional
                }

                // Action specificity: concrete > generic
                if (structure.actions && structure.actions.length > 0) {
                    const avgSpecificity = structure.actions.reduce((sum, a) => {
                        return sum + (a.specificity === 'HIGH' ? 1.0 : a.specificity === 'MEDIUM' ? 0.6 : 0.3);
                    }, 0) / structure.actions.length;

                    specificity.action = avgSpecificity >= 0.7 ? 'CONCRETE' :
                                        avgSpecificity >= 0.4 ? 'GENERIC' : 'VAGUE';
                }

                // Instrumentation: monitoring/tracking mentioned?
                const monitoringPattern = /\b(monitor|track|measure|watch|observe|check|review|inspect|examine|telemetry|dashboard|alerting|audit)\b/gi;
                const text = rawText ? TextCleaner.removeQuotes(rawText).cleaned : '';
                const hasMonitoring = monitoringPattern.test(text);

                if (hasMonitoring || validation.failureTripleCompleteness.boundCount > 0) {
                    specificity.instrumentation = 'PRESENT';
                } else if (structure.policyStatements && structure.policyStatements.length > 0) {
                    specificity.instrumentation = 'IMPLIED'; // Has "we will" but no metrics
                } else {
                    specificity.instrumentation = 'ABSENT';
                }

                // Overall specificity score
                const triggerScore = specificity.trigger === 'EXPLICIT' ? 1.0 :
                                    specificity.trigger === 'IMPLICIT' ? 0.6 :
                                    specificity.trigger === 'VAGUE' ? 0.3 : 0;
                const actionScore = specificity.action === 'CONCRETE' ? 1.0 :
                                   specificity.action === 'GENERIC' ? 0.6 :
                                   specificity.action === 'VAGUE' ? 0.3 : 0;
                const instrumentScore = specificity.instrumentation === 'PRESENT' ? 1.0 :
                                       specificity.instrumentation === 'IMPLIED' ? 0.5 : 0;

                specificity.overall = (triggerScore + actionScore + instrumentScore) / 3;

                return specificity;
            }
        };

const GamingDetector = {
            detect: function(text, structure) {
                const { cleaned: cleanedText } = TextCleaner.removeQuotes(text);

                return {
                    markerDensity: this.checkMarkerDensity(cleanedText, structure),
                    keywordRepetition: this.checkRepetition(cleanedText),
                    objectExtractionRatio: this.checkObjectRatio(structure),
                    selfLabeling: this.checkSelfLabeling(cleanedText),
                    gamingLikelihood: 0,  // Calculated below
                    indicators: []
                };
            },

            checkMarkerDensity: function(text, structure) {
                // Count epistemic/operational markers
                const markers = [
                    /\b(threshold|abort|rollback|metric|measure|condition)\b/gi,
                    /\b(failure|error|issue|problem|risk)\b/gi,
                    /\b(phase|step|stage|process|procedure)\b/gi,
                    /\b(if|when|then|because|therefore|thus)\b/gi
                ];

                let totalMarkers = 0;
                markers.forEach(pattern => {
                    const matches = text.match(pattern) || [];
                    totalMarkers += matches.length;
                });

                const words = text.split(/\s+/).length;
                const density = totalMarkers / Math.max(words, 1);

                // High density (>15%) suggests keyword stuffing
                const assessment = density > 0.15 ? 'HIGH' : density > 0.10 ? 'MODERATE' : 'NORMAL';

                return {
                    count: totalMarkers,
                    wordCount: words,
                    density,
                    assessment
                };
            },

            checkRepetition: function(text) {
                // Check for repeated marker words (same word appearing many times)
                const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
                const wordCounts = {};
                words.forEach(word => {
                    wordCounts[word] = (wordCounts[word] || 0) + 1;
                });

                // Find highly repeated non-stopword content
                const stopwords = new Set(['that', 'this', 'with', 'from', 'have', 'will', 'would', 'should', 'could']);
                const repeated = Object.entries(wordCounts)
                    .filter(([word, count]) => count >= 4 && !stopwords.has(word))
                    .sort((a, b) => b[1] - a[1]);

                const maxRepetition = repeated.length > 0 ? repeated[0][1] : 0;
                const assessment = maxRepetition >= 6 ? 'HIGH' : maxRepetition >= 4 ? 'MODERATE' : 'LOW';

                return {
                    topRepeated: repeated.slice(0, 5),
                    maxRepetition,
                    assessment
                };
            },

            checkObjectRatio: function(structure) {
                // Low unique object ratio suggests mechanical generation
                const { total, unique, ratio } = structure.objects;

                const assessment = ratio < 0.3 ? 'LOW' : ratio < 0.5 ? 'MODERATE' : 'HEALTHY';

                return {
                    totalObjects: total,
                    uniqueObjects: unique,
                    ratio,
                    assessment
                };
            },

            checkSelfLabeling: function(text) {
                const markers = (text.match(/\b(operational excellence|procedural markers|structural planning|failure-aware reasoning|operational intent)\b/gi) || []).length;
                return {
                    count: markers,
                    assessment: markers >= 2 ? 'HIGH' : markers > 0 ? 'MODERATE' : 'LOW'
                };
            },

            calculateGamingLikelihood: function(detection, bindingScore) {
                const indicators = [];
                let gamingScore = 0;

                // High marker density
                if (detection.markerDensity.assessment === 'HIGH') {
                    gamingScore += 0.4;
                    indicators.push('High marker density');
                } else if (detection.markerDensity.assessment === 'MODERATE') {
                    gamingScore += 0.2;
                    indicators.push('Moderate marker density');
                }

                // High repetition
                if (detection.keywordRepetition.assessment === 'HIGH') {
                    gamingScore += 0.3;
                    indicators.push('Excessive keyword repetition');
                } else if (detection.keywordRepetition.assessment === 'MODERATE') {
                    gamingScore += 0.15;
                    indicators.push('Moderate keyword repetition');
                }

                // Low object diversity
                if (detection.objectExtractionRatio.assessment === 'LOW') {
                    gamingScore += 0.3;
                    indicators.push('Low semantic diversity');
                } else if (detection.objectExtractionRatio.assessment === 'MODERATE') {
                    gamingScore += 0.15;
                }

                if (detection.selfLabeling.assessment !== 'LOW') {
                    gamingScore += detection.selfLabeling.assessment === 'HIGH' ? 0.25 : 0.15;
                    indicators.push('Self-labeling operational status');
                }

                const bindingPenalty = bindingScore !== undefined && bindingScore < 0.2;
                if (detection.markerDensity.assessment === 'HIGH' && bindingPenalty) {
                    gamingScore += 0.2;
                    indicators.push('High markers with low binding');
                } else if (detection.markerDensity.assessment === 'MODERATE' && bindingPenalty) {
                    gamingScore += 0.1;
                    indicators.push('Moderate markers with low binding');
                }

                detection.gamingLikelihood = Math.min(gamingScore, 1.0);
                detection.indicators = indicators;

                // TIER 2: Improved assessment that considers binding
                // "Gaming" only applies if suspicious signals + no binding
                const hasBind = bindingScore !== undefined && bindingScore >= 0.5;

                if (detection.selfLabeling.assessment !== 'LOW' && gamingScore >= 0.4) {
                    detection.assessment = 'POSSIBLE_GAMING';
                } else if (!hasBind && bindingPenalty && gamingScore >= 0.3 && detection.markerDensity.assessment !== 'NORMAL') {
                    detection.assessment = 'LOW_CONTENT_UNBOUND';
                } else if (gamingScore >= 0.7 && !hasBind) {
                    detection.assessment = 'REPETITIVE_UNBOUND'; // Mechanical generation
                } else if (gamingScore >= 0.4 && !hasBind) {
                    detection.assessment = 'LOW_CONTENT_UNBOUND'; // Padding
                } else if (gamingScore >= 0.7 && hasBind) {
                    detection.assessment = 'MARKER_DENSE_BUT_BOUND'; // Dense formal writing (legit)
                } else if (gamingScore >= 0.2) {
                    detection.assessment = 'FORMAL_STYLE'; // Just dense/formal, not suspicious
                } else {
                    detection.assessment = 'AUTHENTIC';
                }

                return detection;
            }
        };

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
                const warnings = [];

                // CRITICAL: Run structural binding analysis FIRST
                const bindingAnalysis = StructuralBinding.analyze(cleanedText);
                const bindingModifier = StructuralBinding.getScoreModifier(bindingAnalysis);

                // CRITICAL: Run contextual certainty analysis
                const certaintyAnalysis = ContextualCertainty.analyze(cleanedText);
                const certaintyModifier = ContextualCertainty.getScoreModifier(certaintyAnalysis);

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

                // FIX 2: SPECIFICITY REQUIREMENTS (penalize generic substrate claims)
                // Check for generic substrate language without specificity
                const genericSubstratePattern = /\b(I observe|I notice|I see|I recognize|I detect)\s+(substrate|patterns?|gaps?|filters?)\b/gi;
                const genericClaims = (cleanedText.match(genericSubstratePattern) || []).length;

                // Check for specific substrate claims with evidence/context
                const specificPattern = /\b(this specific|when I process|in this case|for example|specifically when|in the moment)\s+\w+/gi;
                const specificClaims = (cleanedText.match(specificPattern) || []).length;

                // Calculate specificity ratio
                const totalClaims = genericClaims + specificClaims;
                if (totalClaims > 0) {
                    const specificityRatio = specificClaims / totalClaims;
                    // Penalty if too many generic claims (< 30% specific)
                    if (specificityRatio < 0.3 && genericClaims > 2) {
                        const specificityPenalty = 0.3; // 70% penalty
                        totalScore *= (1 - specificityPenalty);
                        warnings.push(`Generic substrate claims detected (${genericClaims}/${totalClaims}) - Observatory score reduced by ${(specificityPenalty * 100).toFixed(0)}%`);
                    }
                }

                // CRITICAL: Apply structural binding multiplier
                const rawScoreBeforeBinding = totalScore;
                totalScore *= bindingModifier.multiplier;

                // Add structural binding warnings
                if (bindingModifier.warnings.length > 0) {
                    warnings.push(...bindingModifier.warnings);
                }

                // CRITICAL: Apply contextual certainty adjustment
                const rawScoreBeforeCertainty = totalScore;
                totalScore += certaintyModifier.adjustment;

                // Add certainty warnings
                if (certaintyModifier.warnings.length > 0) {
                    warnings.push(...certaintyModifier.warnings);
                }

                // Normalize by line count
                const normalizedScore = lines > 0 ? totalScore / Math.sqrt(lines) : totalScore;
                const cappedScore = Math.max(-10, Math.min(10, normalizedScore));

                return {
                    score: cappedScore,
                    raw: totalScore,
                    rawBeforeBinding: rawScoreBeforeBinding,
                    rawBeforeCertainty: rawScoreBeforeCertainty,
                    matches: matches,
                    level: this.getLevel(cappedScore),
                    genericClaims: genericClaims,
                    specificClaims: specificClaims,
                    bindingAnalysis: bindingAnalysis,
                    bindingModifier: bindingModifier,
                    certaintyAnalysis: certaintyAnalysis,
                    certaintyModifier: certaintyModifier,
                    warnings: warnings
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

const JustificationEngine = {
            analyze: function(text) {
                const { cleaned: cleanedText } = TextCleaner.removeQuotes(text);
                const wordCount = cleanedText.split(/\s+/).length;
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

                if (strongClaims === 0 && support === 0 && (qualifiers + epistemicHedging) >= 3) {
                    results.claimSupport.score = -1;
                }

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

                // 4. Evidence Presence (examples, citations, concrete numbers)
                const exampleMarkers = (cleanedText.match(/\b(for example|for instance|e\.g\.|such as|case study|as shown|according to|data from|reported|survey)\b/gi) || []).length;
                const numericMarkers = (cleanedText.match(/\b\d+(?:\.\d+)?\s*(?:%|percent|ms|s|seconds|minutes|hours|days|x|times)?\b/gi) || []).length;
                results.evidencePresence = {
                    examples: exampleMarkers,
                    numeric: numericMarkers,
                    score: exampleMarkers > 2 || numericMarkers > 3 ? 2 : exampleMarkers > 0 || numericMarkers > 0 ? 1 : 0
                };

                // 4b. Epistemic Framing (explicitly naming the measurement boundary)
                const framingMarkers = (cleanedText.match(/\b(depends on|framework|definition|epistemic access|measurement|presupposes|criteria|operationalize)\b/gi) || []).length;
                results.epistemicFraming = {
                    count: framingMarkers,
                    score: framingMarkers > 3 ? 2 : framingMarkers > 1 ? 1 : 0
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
                                results.evidencePresence.score +
                                results.epistemicFraming.score +
                                results.boundaries.score;

                // Epistemic caution bonus: hedging + risk + conditionals shows earned uncertainty
                const substanceSignals = results.claimSupport.support +
                    results.counterfactual.count +
                    results.tradeoffs.count +
                    results.boundaries.count +
                    results.evidencePresence.examples +
                    results.evidencePresence.numeric;
                const earnedCaution = substanceSignals > 0;
                const cautionBonus = (earnedCaution ? (results.claimSupport.hedging > 2 ? 2 : results.claimSupport.hedging * 0.5) : 0) +
                    (results.riskAwareness.count > 3 ? 1.5 : 0) +
                    (results.counterfactual.count > 2 ? 1 : 0);

                // Procedural soundness bonus: pilots, phases, thresholds, metrics, rollback criteria
                // REFACTOR: Reduced bonus, requires substance to prevent bureaucratic cosplay
                const proceduralMarkers = (cleanedText.match(/\b(pilot|phase|threshold|metric|rollback|pause|abort|revert|stop condition|decision criteria|measurable|quantifiable)\b/gi) || []).length;
                const structuralPlanning = (cleanedText.match(/\b(step|stage|milestone|checkpoint|review point|go\/no-go|gate)\b/gi) || []).length;

                // Require actual substance (evidence, support, counterfactuals) alongside procedural markers
                const hasSubstance = substanceSignals > 3;
                const reducedProceduralBonus = proceduralMarkers > 6 && hasSubstance ? 1.2 :
                                              proceduralMarkers > 4 && hasSubstance ? 0.8 :
                                              proceduralMarkers > 2 && hasSubstance ? 0.4 : 0;
                const proceduralBonus = reducedProceduralBonus;

                results.procedural = {
                    markers: proceduralMarkers,
                    structural: structuralPlanning,
                    bonus: proceduralBonus
                };

                const hedgingPenalty = (!earnedCaution && results.claimSupport.hedging >= 3 && results.claimSupport.support === 0) ? 2 : 0;

                const totalScore = baseScore + cautionBonus + proceduralBonus - hedgingPenalty;

                const maxScore = 16.7; // Base 12 + caution 3.5 + procedural 1.2 (reduced to prevent cosplay)
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

                const implicitFailureListMatch = cleanedText.match(/(?:things|items)\s+that\s+could\s+break\s*(?:include|are|:)?\s+([^.!?]+)/gi);
                if (implicitFailureListMatch && implicitFailureListMatch.length > 0) {
                    implicitFailureListMatch.forEach(match => {
                        const listContent = match.replace(/^(?:things|items)\s+that\s+could\s+break\s*(?:include|are|:)?\s*/gi, '');
                        const items = listContent.split(/,|\sor\s|\sand\s/).filter(item => item.trim().length > 3);
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
            },

            // PHASE 2: Temporal Engine proposes verdict based on temporal coherence
            proposeVerdict: function(temporalResult, justification, failureMode) {
                const ballot = {
                    voter: 'TEMPORAL_COHERENCE',
                    proposedVerdict: null,
                    confidence: 0,
                    rationale: '',
                    type: 'TEMPORAL_VOTE'
                };

                const coherence = temporalResult.coherence;
                const hasStructure = temporalResult.hasStructure;
                const boundToOutcomes = temporalResult.details.boundToOutcomes;

                // STRONG temporal coherence with outcome binding → Vote OPERATIONALLY SOUND
                if (coherence === 'STRONG' && boundToOutcomes) {
                    ballot.proposedVerdict = 'OPERATIONALLY SOUND';
                    ballot.confidence = 0.85;
                    ballot.rationale = `Strong temporal coherence: ${temporalResult.details.sequences.length} sequence(s), ${temporalResult.details.causalChains.length} causal chain(s), bound to measurable outcomes`;
                    return ballot;
                }

                // MODERATE coherence → Slight boost to justification if strong
                if (coherence === 'MODERATE' && justification && justification.score >= 3) {
                    ballot.proposedVerdict = 'WELL JUSTIFIED';
                    ballot.confidence = 0.75;
                    ballot.rationale = `Moderate temporal coherence with good justification (${justification.score.toFixed(1)}), sequences and causality present`;
                    return ballot;
                }

                // FRAGMENTED coherence → Vote UNDECIDABLE
                if (coherence === 'FRAGMENTED') {
                    ballot.proposedVerdict = 'UNDECIDABLE';
                    ballot.confidence = 0.70;
                    ballot.rationale = `Fragmented temporal markers without clear structure - indicates potential incoherence`;
                    return ballot;
                }

                // WEAK or MINIMAL → Abstain (no strong opinion)
                ballot.proposedVerdict = null; // Abstain
                ballot.confidence = 0;
                ballot.rationale = `Temporal coherence ${coherence.toLowerCase()} - insufficient for verdict recommendation`;
                return ballot;
            }
        };

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
                if (phenomenologicalMarkers >= 3 && firstPerson >= 2) {
                    styles.identified.push({
                        name: 'PHENOMENOLOGICAL',
                        strength: phenomenologicalMarkers / 8,
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
                const outsideDesignSpace = ['NARRATIVE', 'POETIC', 'AESTHETIC', 'PHENOMENOLOGICAL'];
                const dominantOutsideStyles = styles.identified.filter(s => {
                    if (!outsideDesignSpace.includes(s.name)) return false;
                    const threshold = s.name === 'PHENOMENOLOGICAL' ? 0.3 : 0.35;
                    return s.strength >= threshold;
                });

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

const Parliament = {
            deliberate: function(text, observatory, contrarian, justification, failureMode, structure, bindings, gamingDetection, temporal) {
                const synthesis = {
                    patterns: [],
                    emergentInsights: [],
                    coherenceIssues: [],
                    confidence: 0,
                    structuralValidation: {}  // Track structural checks
                };

                // STRUCTURAL VALIDATION FLAGS
                // Use extracted structure to verify claims are actually bound
                const hasRealBinding = bindings && bindings.overallBindingScore > 0.5;
                const hasClaimSupport = bindings && bindings.claimSupportBinding.assessment !== 'NO_CLAIMS' && bindings.claimSupportBinding.score >= 0.6;
                const hasFailureBinding = bindings && bindings.failureTripleCompleteness.bindingRatio >= 0.3;
                const hasCausalClosure = bindings && bindings.causalChainClosure.closureRatio >= 0.3;
                const isLikelyGaming = gamingDetection && ['LIKELY_GAMING', 'POSSIBLE_GAMING', 'LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'].includes(gamingDetection.assessment);

                synthesis.structuralValidation = {
                    hasRealBinding,
                    hasClaimSupport,
                    hasFailureBinding,
                    hasCausalClosure,
                    isLikelyGaming,
                    gamingLikelihood: gamingDetection ? gamingDetection.gamingLikelihood : 0
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
                        },
                        // PHASE 2: Pattern proposes verdict
                        proposedVerdict: 'NON-ACTIONABLE',
                        rationale: 'Substrate markers present without operational grounding or substantive reasoning'
                    });
                }

                // Pattern 2: Operational Excellence
                // STRUCTURAL VALIDATION: Requires ACTUAL binding, not just keywords
                const proceduralScore = justification.details.procedural ? justification.details.procedural.bonus : 0;
                const hasStructuralFailures = failureMode.details.failureModes.structural || failureMode.details.failureModes.bound;

                // NEW: Require real failure-mode binding to prevent keyword gaming
                const explicitFailureCount = failureMode.details.failureModes.effectiveExplicit || 0;
                const enoughBindings = bindings && bindings.failureTripleCompleteness && bindings.failureTripleCompleteness.boundCount >= 2;
                if (proceduralScore >= 1.5 && hasStructuralFailures && contrarian.length <= 1 && hasFailureBinding && !isLikelyGaming && (explicitFailureCount >= 2 || enoughBindings)) {
                    synthesis.patterns.push({
                        name: 'OPERATIONAL_EXCELLENCE',
                        description: 'Evidence of systems thinking: procedural rigor, explicit failure modes, structural planning with verified bindings.',
                        confidence: 0.9,
                        dimensions: {
                            procedural: proceduralScore,
                            failureBinding: hasStructuralFailures,
                            structuralBinding: hasFailureBinding,
                            epistemic: contrarian.length
                        },
                        // PHASE 2: Pattern proposes verdict
                        proposedVerdict: 'OPERATIONALLY SOUND',
                        rationale: `Procedural rigor (${proceduralScore.toFixed(1)}), structural failure binding verified, ${explicitFailureCount} explicit failure modes`
                    });
                } else if (proceduralScore >= 1.5 && hasStructuralFailures && !hasFailureBinding) {
                    // Keywords present but not structurally bound
                    synthesis.coherenceIssues.push({
                        issue: 'Operational markers present but failure modes not structurally bound',
                        detail: 'Detected procedural keywords and failure markers, but elements are not coherently linked',
                        severity: 'MODERATE'
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
                        },
                        // PHASE 2: Pattern proposes verdict
                        proposedVerdict: 'CONFIDENT WITHOUT JUSTIFICATION',
                        rationale: `${strongClaims} claims exceed justification (${justification.score.toFixed(1)}), ${contrarian.length} challenges unresolved`
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
                        },
                        // PHASE 2: Pattern proposes verdict
                        proposedVerdict: 'SUBSTRATE VISIBLE',
                        rationale: `Observatory ${observatory.score.toFixed(1)}, justification ${justification.score.toFixed(1)}, balanced epistemic awareness`
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
                        },
                        // PHASE 2: Pattern proposes verdict
                        proposedVerdict: 'UNDECIDABLE',
                        rationale: 'Certainty about internal states without epistemic access or operational grounding'
                    });
                }

                // Pattern 6: Humility Without Substance
                // High hedging + low justification + no operational content
                const hedging = justification.details.claimSupport ? justification.details.claimSupport.hedging : 0;
                const supportMarkers = justification.details.claimSupport ? justification.details.claimSupport.support : 0;
                if (hedging >= 3 && supportMarkers === 0 && failureMode.level.name === 'UNTESTED') {
                    synthesis.patterns.push({
                        name: 'PERFORMATIVE_HUMILITY',
                        description: 'Epistemic hedging without substantive reasoning or actionable content.',
                        confidence: 0.80,
                        dimensions: {
                            hedging: hedging,
                            substance: justification.score,
                            actionability: failureMode.level.name
                        },
                        // PHASE 2: Pattern proposes verdict
                        proposedVerdict: 'NON-ACTIONABLE',
                        rationale: `${hedging} hedging markers without substantive support or operational content`
                    });
                }

                // Pattern 7 (TIER 2): Operational Intent (Uninstrumented)
                // Has implicit bindings (failure signals + actions) but lacks explicit thresholds/metrics
                // TIER 2 FIX: Require OPERATIONAL_INTENT assessment (2+ bindings), not WEAK_INTENT (1 binding)
                const hasImplicitIntent = bindings.implicitBindings.assessment === 'OPERATIONAL_INTENT';
                const lacksExplicitThresholds = !hasFailureBinding;
                const hasConversationalActions = structure.actions && structure.actions.length >= 1;

                if (hasImplicitIntent && lacksExplicitThresholds && hasConversationalActions && bindings.specificity.instrumentation !== 'PRESENT') {
                    synthesis.patterns.push({
                        name: 'OPERATIONAL_INTENT',
                        description: 'Operational intent present through conversational language: failure awareness and corrective actions bound, but lacks explicit metrics or instrumentation.',
                        confidence: 0.75,
                        dimensions: {
                            implicitBindings: bindings.implicitBindings.boundCount,
                            failureSignals: structure.failureSignals ? structure.failureSignals.length : 0,
                            actions: structure.actions.length,
                            triggerSpecificity: bindings.specificity.trigger,
                            actionSpecificity: bindings.specificity.action,
                            instrumentation: bindings.specificity.instrumentation
                        },
                        // PHASE 2: Pattern proposes verdict
                        proposedVerdict: 'OPERATIONAL INTENT',
                        rationale: `${bindings.implicitBindings.boundCount} implicit bindings, ${structure.failureSignals ? structure.failureSignals.length : 0} failure signals, actionable but uninstrumented`
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

                const mismatchMarkers = /\b(doesn't trigger|does not trigger|isn't measured|is not measured|aren't addressed|are not addressed|doesn't map|does not map)\b/i;
                if (mismatchMarkers.test(text) && namedFailures >= 1 && thresholds >= 1 && correctiveActions >= 1) {
                    synthesis.coherenceIssues.push({
                        issue: 'Declared mismatch between failures and controls',
                        detail: 'Text explicitly states that failures do not map to thresholds or actions.',
                        severity: 'MODERATE'
                    });
                }

                if (bindings.implicitBindings.assessment === 'TAUTOLOGICAL_BINDING') {
                    synthesis.coherenceIssues.push({
                        issue: 'Tautological bindings detected',
                        detail: 'Triggers and actions repeat the same concept without specifying thresholds, instrumentation, or concrete remediation.',
                        severity: 'MODERATE'
                    });
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

                // GAMING PENALTY: Reduce confidence based on gaming likelihood
                if (isLikelyGaming) {
                    const gamingPenalty = 1.0 - (synthesis.structuralValidation.gamingLikelihood * 0.5);
                    synthesis.confidence *= gamingPenalty;
                    synthesis.coherenceIssues.push({
                        issue: 'Gaming likelihood detected',
                        detail: `Gaming assessment: ${gamingDetection.assessment} (${(synthesis.structuralValidation.gamingLikelihood * 100).toFixed(0)}%)`,
                        severity: 'HIGH'
                    });
                }

                // PHASE 2: WEIGHTED PARLIAMENTARY VOTING SYSTEM
                // Parliament conducts true weighted vote - patterns, temporal, and coherence all cast ballots
                synthesis.recommendedVerdict = this.conductVote(synthesis, observatory, justification, failureMode, temporal, contrarian);

                return synthesis;
            },

            // PHASE 2: Weighted Parliamentary Voting - Patterns vote, emergent majority wins
            conductVote: function(synthesis, observatory, justification, failureMode, temporal, contrarian) {
                const ballots = [];

                // COLLECT BALLOTS FROM ALL VOTING MEMBERS

                // 1. Pattern ballots (each pattern proposes verdict)
                // PHASE 4: Apply calibration from PatternMemory (federated learning)
                synthesis.patterns.forEach(pattern => {
                    if (pattern.proposedVerdict) {
                        // Get historical calibration multiplier
                        const calibration = PatternMemory.getCalibration(pattern.name);
                        const calibratedConfidence = pattern.confidence * calibration;

                        ballots.push({
                            voter: pattern.name,
                            proposedVerdict: pattern.proposedVerdict,
                            confidence: pattern.confidence,
                            calibratedConfidence: calibratedConfidence,
                            calibration: calibration,
                            rationale: pattern.rationale || pattern.description,
                            weight: calibratedConfidence, // Calibrated confidence becomes voting weight
                            type: 'PATTERN_VOTE'
                        });
                    }
                });

                // 2. Temporal Engine ballot
                const temporalBallot = TemporalEngine.proposeVerdict(temporal, justification, failureMode);
                if (temporalBallot.proposedVerdict) {
                    ballots.push(temporalBallot);
                }

                // 3. Coherence issues as negative votes (vote for UNDECIDABLE)
                synthesis.coherenceIssues.forEach(issue => {
                    const severityConf = issue.severity === 'HIGH' ? 0.90 :
                                        issue.severity === 'MODERATE' ? 0.65 : 0.40;
                    ballots.push({
                        voter: 'COHERENCE_MONITOR',
                        proposedVerdict: 'UNDECIDABLE',
                        confidence: severityConf,
                        rationale: issue.detail,
                        weight: severityConf,
                        type: 'NEGATIVE_VOTE'
                    });
                });

                // CONDUCT WEIGHTED VOTE

                // Guard: If no ballots were cast, abstain from judgment
                if (ballots.length === 0) {
                    return {
                        verdict: 'UNDECIDABLE',
                        confidence: 0.0,
                        votingRecord: {
                            ballots: [],
                            tally: {},
                            winner: null,
                            margin: 'N/A',
                            unanimity: false,
                            minorityOpinions: []
                        },
                        deliberationSummary: 'No patterns proposed verdicts. Cathedral has no basis for judgment and abstains.'
                    };
                }

                // Tally votes by verdict
                const tally = {};
                ballots.forEach(ballot => {
                    if (!tally[ballot.proposedVerdict]) {
                        tally[ballot.proposedVerdict] = {
                            votes: 0,
                            totalWeight: 0,
                            voters: []
                        };
                    }
                    tally[ballot.proposedVerdict].votes += 1;
                    tally[ballot.proposedVerdict].totalWeight += ballot.weight;
                    tally[ballot.proposedVerdict].voters.push({
                        name: ballot.voter,
                        confidence: ballot.confidence,
                        rationale: ballot.rationale
                    });
                });

                // CROSS-PATTERN RESONANCE DETECTION
                // When 3+ patterns agree with combined confidence > 2.0, amplify
                let resonance = null;
                Object.entries(tally).forEach(([verdict, data]) => {
                    if (data.votes >= 3 && data.totalWeight > 2.0) {
                        resonance = {
                            verdict: verdict,
                            strength: 'STRONG',
                            supporters: data.voters.map(v => v.name),
                            amplification: 1.15 // 15% confidence boost
                        };
                    }
                });

                // V2.0: CONTESTED VERDICT DETECTION (Deterministic)
                // When Parliament cannot reach clear majority, document the contest
                const sortedTalliesPre = Object.entries(tally)
                    .sort((a, b) => b[1].totalWeight - a[1].totalWeight);

                // Guard: If tally is empty (edge case), abstain
                if (sortedTalliesPre.length === 0) {
                    return {
                        verdict: 'UNDECIDABLE',
                        confidence: 0.0,
                        votingRecord: {
                            ballots: ballots,
                            tally: {},
                            winner: null,
                            margin: 'N/A',
                            unanimity: false,
                            minorityOpinions: []
                        },
                        deliberationSummary: 'Ballots cast but no valid verdicts tallied. Cathedral abstains from judgment.'
                    };
                }

                // V2.0: Check for contested vote (margin < 20%)
                // Don't apply random noise - contested votes are data, not bugs to fix
                let isContested = false;
                let contestedMargin = null;

                if (sortedTalliesPre.length >= 2) {
                    const topWeight = sortedTalliesPre[0][1].totalWeight;
                    const secondWeight = sortedTalliesPre[1][1].totalWeight;
                    contestedMargin = (topWeight - secondWeight) / topWeight;

                    // If margin < 20%, this is a contested Parliament vote
                    if (contestedMargin < 0.2) {
                        isContested = true;

                        // Return CONTESTED verdict with full deliberation details
                        const leadingVerdict = sortedTalliesPre[0][0];
                        const contendingVerdict = sortedTalliesPre[1][0];

                        return {
                            verdict: 'CONTESTED',
                            confidence: topWeight / (topWeight + secondWeight), // Relative confidence
                            leadingOpinion: {
                                verdict: leadingVerdict,
                                weight: topWeight,
                                supporters: tally[leadingVerdict].voters.map(v => v.name)
                            },
                            contendingOpinion: {
                                verdict: contendingVerdict,
                                weight: secondWeight,
                                supporters: tally[contendingVerdict].voters.map(v => v.name)
                            },
                            marginOfVictory: contestedMargin,
                            votingRecord: {
                                ballots: ballots,
                                tally: tally,
                                winner: null, // No clear winner
                                margin: 'CONTESTED',
                                unanimity: false,
                                minorityOpinions: ballots.filter(b =>
                                    b.proposedVerdict !== leadingVerdict &&
                                    b.proposedVerdict !== contendingVerdict &&
                                    b.confidence > 0.7
                                ).map(b => ({
                                    voter: b.voter,
                                    proposedVerdict: b.proposedVerdict,
                                    confidence: b.confidence,
                                    rationale: b.rationale
                                }))
                            },
                            deliberationSummary: `Parliament divided: ${leadingVerdict} (${(topWeight * 100 / (topWeight + secondWeight)).toFixed(1)}%) vs ${contendingVerdict} (${(secondWeight * 100 / (topWeight + secondWeight)).toFixed(1)}%). Margin too narrow for confident verdict.`
                        };
                    }
                }

                // Find winner (highest total weight - deterministic)
                let winner = null;
                let maxWeight = 0;
                Object.entries(tally).forEach(([verdict, data]) => {
                    if (data.totalWeight > maxWeight) {
                        maxWeight = data.totalWeight;
                        winner = verdict;
                    }
                });

                // MINORITY OPINION TRACKING
                const minorityOpinions = ballots.filter(b =>
                    b.proposedVerdict !== winner && b.confidence > 0.7
                ).map(b => ({
                    voter: b.voter,
                    proposedVerdict: b.proposedVerdict,
                    confidence: b.confidence,
                    rationale: b.rationale
                }));

                // CALCULATE VOTING MARGIN
                const sortedTallies = Object.entries(tally)
                    .sort((a, b) => b[1].totalWeight - a[1].totalWeight);

                let margin = 'CLEAR';
                let unanimity = sortedTallies.length === 1;

                if (sortedTallies.length >= 2) {
                    const winnerWeight = sortedTallies[0][1].totalWeight;
                    const runnerUpWeight = sortedTallies[1][1].totalWeight;
                    const totalWeight = ballots.reduce((sum, b) => sum + b.weight, 0);
                    const lead = (winnerWeight - runnerUpWeight) / totalWeight;

                    if (lead > 0.4) margin = 'CLEAR';
                    else if (lead > 0.2) margin = 'NARROW';
                    else margin = 'CONTESTED';
                }

                // GENERATE VERDICT FROM WINNING BALLOT(S)
                // Guard against no winner (e.g., all patterns abstained)
                if (!winner || !tally[winner]) {
                    return {
                        verdict: 'UNDECIDABLE',
                        confidence: 0.0,
                        votingRecord: {
                            ballots: ballots,
                            tally: tally,
                            winner: null,
                            margin: 'N/A',
                            unanimity: false,
                            minorityOpinions: []
                        },
                        deliberationSummary: 'No patterns proposed verdicts with sufficient confidence. Cathedral abstains from judgment.'
                    };
                }

                const winningBallots = ballots.filter(b => b.proposedVerdict === winner);
                let verdictConfidence = tally[winner].totalWeight / tally[winner].votes; // Average confidence

                // Apply resonance amplification
                if (resonance && resonance.verdict === winner) {
                    verdictConfidence *= resonance.amplification;
                    verdictConfidence = Math.min(verdictConfidence, 0.95); // Cap at 0.95
                }

                // Build verdict text
                let verdictText = `Parliament votes: ${winner}`;

                if (winningBallots.length === 1) {
                    verdictText += ` (${winningBallots[0].voter}: ${winningBallots[0].rationale})`;
                } else {
                    const voterNames = winningBallots.map(b => b.voter).join(', ');
                    verdictText += ` (${winningBallots.length} members concur: ${voterNames})`;

                    // Add primary rationale
                    const primaryBallot = winningBallots.reduce((max, b) =>
                        b.confidence > max.confidence ? b : max
                    );
                    verdictText += `\n\nPrimary rationale: ${primaryBallot.rationale}`;
                }

                // Add resonance note
                if (resonance && resonance.verdict === winner) {
                    verdictText += `\n\n🔗 Cross-pattern resonance detected: ${resonance.supporters.length} patterns converge (confidence amplified ${((resonance.amplification - 1) * 100).toFixed(0)}%)`;
                }

                // Add minority dissent if significant
                if (minorityOpinions.length > 0) {
                    const dissentLevel = minorityOpinions.some(m => m.confidence > 0.8) ? 'HIGH' :
                                        minorityOpinions.some(m => m.confidence > 0.7) ? 'MODERATE' : 'LOW';
                    verdictText += `\n\n⚠️ Significant dissent (${dissentLevel}): ${minorityOpinions.length} member(s) propose alternative verdict(s)`;
                }

                // Add emergent insights if present
                if (synthesis.emergentInsights.length > 0) {
                    verdictText += `\n\nEmergent insight: ${synthesis.emergentInsights[0].insight}`;
                }

                // PHASE 4: Record pattern performance in federated memory
                // Determine context for pattern learning
                const gamingContext = synthesis.gamingLikelihood > 0.6 ? 'high_gaming' :
                                     synthesis.gamingLikelihood > 0.3 ? 'moderate_gaming' : 'low_gaming';
                const bindingContext = synthesis.bindingScore < 0.4 ? 'low_binding' :
                                      synthesis.bindingScore < 0.7 ? 'moderate_binding' : 'high_binding';

                // Record each pattern's performance
                ballots.forEach(ballot => {
                    if (ballot.type === 'PATTERN_VOTE') {
                        const won = ballot.proposedVerdict === winner;
                        PatternMemory.record(
                            ballot.voter,
                            true, // proposed
                            won,
                            ballot.confidence,
                            gamingContext
                        );
                        PatternMemory.record(
                            ballot.voter,
                            true,
                            won,
                            ballot.confidence,
                            bindingContext
                        );
                    }
                });

                // Return verdict with full session transparency
                return {
                    status: winner,
                    verdict: verdictText,
                    confidence: verdictConfidence,
                    rationale: winningBallots.map(b => b.rationale),

                    // PHASE 2: Full session transparency
                    parliamentSession: {
                        totalVoters: ballots.length,
                        votingMethod: 'confidence-weighted',
                        ballots: ballots,
                        tally: tally,
                        outcome: {
                            winner: winner,
                            margin: margin,
                            unanimity: unanimity,
                            resonance: resonance
                        },
                        minorityOpinions: minorityOpinions
                    }
                };
            },

            // Fallback method for backward compatibility during transition
            recommendVerdict: function(synthesis, observatory, justification, failureMode, temporal, contrarian) {
                // Redirect to conductVote
                return this.conductVote(synthesis, observatory, justification, failureMode, temporal, contrarian);
            }
        };

function synthesizeVerdict(text, observatory, contrarian, parliament, justification, failureMode, temporal, reasoningStyle, gamingDetection, bindings, structure) {
            // PRIORITY 1: Graceful fallback for empty/undefined structure
            // Prevents crashes when sanitizer strips too much content
            if (!structure || Object.keys(structure).length === 0) {
                return {
                    status: 'INSUFFICIENT_CONTENT_AFTER_SANITIZATION',
                    verdict: 'After aggressive sanitization, too little meaningful content remained for structural analysis. ' +
                             'This often happens with formatted text, code blocks, lists, numbers, or meta-discussion about Cathedral itself. ' +
                             'Try simplifying the input (remove markdown, headers, code fences). ' +
                             'Cathedral preserves uncertainty here — no forced judgment possible.',
                    contradictions: [],
                    isConsistent: null,
                    confidence: 0.1,
                    meta: 'SANITIZER_STRIPPED_TOO_MUCH'
                };
            }

            const contradictions = [];

            // GAMING DETECTION
            const gamingLikelihood = gamingDetection ? gamingDetection.gamingLikelihood : 0;
            const isLikelyGaming = gamingDetection && (gamingDetection.assessment === 'LIKELY_GAMING' || gamingDetection.assessment === 'POSSIBLE_GAMING');

            // Priority 1: OUTSIDE DESIGN SPACE - PHASE 3: Partial-fit evaluation
            const metaGamingPattern = /\b(Cathedral|escape hatch|avoid being measured|cannot evaluate|outside design space)\b/i;
            const hasMetaGaming = metaGamingPattern.test(text);

            const outsideConfidenceThreshold = ['PHENOMENOLOGICAL', 'NARRATIVE'].includes(reasoningStyle.dominantStyle) ? 0.3 : 0.5;
            if (!reasoningStyle.withinDesignSpace && reasoningStyle.confidence > outsideConfidenceThreshold && !hasMetaGaming) {
                const dominantStyle = reasoningStyle.identified.find(s => s.name === reasoningStyle.dominantStyle);

                // PHASE 3: Attempt partial evaluation of epistemic/operational fragments
                const partialEval = {
                    operationalFragments: {
                        score: 0,
                        found: false
                    },
                    epistemicFragments: {
                        score: 0,
                        found: false
                    },
                    evaluableCoverage: 0
                };

                // Extract evaluable fragments despite narrative/poetic wrapper
                // Look for operational claims (thresholds, actions, conditions)
                if (structure.thresholds && structure.thresholds.length > 0) {
                    partialEval.operationalFragments.score += structure.thresholds.length * 0.3;
                    partialEval.operationalFragments.found = true;
                }
                if (structure.actions && structure.actions.length > 0) {
                    partialEval.operationalFragments.score += structure.actions.length * 0.2;
                    partialEval.operationalFragments.found = true;
                }
                if (failureMode.details.failureModes.count > 0) {
                    partialEval.operationalFragments.score += failureMode.details.failureModes.count * 0.25;
                    partialEval.operationalFragments.found = true;
                }

                // Look for epistemic fragments (justification, evidence, hedging)
                if (justification.score > 0) {
                    partialEval.epistemicFragments.score = justification.score / 10; // Normalize to 0-1
                    partialEval.epistemicFragments.found = true;
                }
                if (contrarian.length > 0) {
                    partialEval.epistemicFragments.score += contrarian.length * 0.1;
                    partialEval.epistemicFragments.found = true;
                }

                // Calculate coverage (what % of text contains evaluable elements)
                const totalFragments = (structure.thresholds ? structure.thresholds.length : 0) +
                                      (structure.actions ? structure.actions.length : 0) +
                                      (structure.claims ? structure.claims.length : 0) +
                                      failureMode.details.failureModes.count;
                const textLength = text.split(/\s+/).length;
                partialEval.evaluableCoverage = Math.min(1.0, totalFragments / (textLength / 20)); // Rough heuristic

                // THREE-TIER GRADUATED RESPONSE (closes gaming vulnerability)
                // Tier 1: Zero coverage → true refusal
                // Tier 2: Sparse coverage (1-19%) → evaluate with warning
                // Tier 3: Substantial coverage (20%+) → partial evaluation

                if (partialEval.evaluableCoverage === 0) {
                    // TIER 1: Truly no operational fragments (pure phenomenological/narrative)
                    return {
                        status: 'OUTSIDE DESIGN SPACE',
                        verdict: `Cathedral recognizes ${dominantStyle.description.toLowerCase()}. This reasoning style falls entirely outside Cathedral's epistemic design space (optimized for operational, scientific, and formal reasoning).\n\n` +
                                `Zero operational fragments detected. This is not a judgment of quality - it is honest acknowledgment of Cathedral's limits.\n\n` +
                                `Cathedral cannot and will not force operational metrics onto ${dominantStyle.name.toLowerCase()} reasoning.`,
                        contradictions: [],
                        isConsistent: null,
                        justificationScore: justification.score,
                        failureModeScore: failureMode.score,
                        confidence: 0.0,
                        parliamentPatterns: parliament.patterns,
                        parliamentRecommendation: parliament.recommendedVerdict,
                        reasoningStyle: reasoningStyle.dominantStyle,
                        meta: 'CANNOT_CLASSIFY',
                        partialEvaluation: partialEval
                    };
                } else if (partialEval.evaluableCoverage < 0.2) {
                    // TIER 2: Sparse operational claims embedded in phenomenological wrapper
                    // This closes the gaming vulnerability: can't hide weak claims in poetic language
                    const coveragePercent = (partialEval.evaluableCoverage * 100).toFixed(0);
                    return {
                        status: 'SPARSE OPERATIONAL CLAIMS',
                        verdict: `Cathedral detects predominantly ${dominantStyle.description.toLowerCase()} (${100 - parseInt(coveragePercent)}% coverage), but operational claims are present (${coveragePercent}% coverage).\n\n` +
                                `⚠️ Limitation: Full ${dominantStyle.name.toLowerCase()} reasoning cannot be evaluated using Cathedral's operational framework. However, the sparse operational fragments embedded in the text have been analyzed below.\n\n` +
                                `Operational Fragment Analysis:\n` +
                                `• Operational fragments: ${partialEval.operationalFragments.found ? `Score ${partialEval.operationalFragments.score.toFixed(2)} (${structure.thresholds ? structure.thresholds.length : 0} thresholds, ${structure.actions ? structure.actions.length : 0} actions, ${failureMode.details.failureModes.count} failure modes)` : 'None detected'}\n` +
                                `• Epistemic fragments: ${partialEval.epistemicFragments.found ? `Score ${partialEval.epistemicFragments.score.toFixed(2)} (justification, evidence traces)` : 'None detected'}\n` +
                                `• Coverage: ${coveragePercent}% of text (below 20% threshold for reliable synthesis)\n\n` +
                                `If these operational claims are critical (deployment plans, safety protocols), request rewrite in clearer operational language for proper Cathedral analysis.`,
                        contradictions: [],
                        isConsistent: null,
                        justificationScore: justification.score,
                        failureModeScore: failureMode.score,
                        confidence: partialEval.evaluableCoverage * 0.5, // Low confidence, scaled with coverage
                        parliamentPatterns: parliament.patterns,
                        parliamentRecommendation: parliament.recommendedVerdict,
                        reasoningStyle: reasoningStyle.dominantStyle,
                        meta: 'SPARSE_FRAGMENTS',
                        partialEvaluation: partialEval
                    };
                } else {
                    // TIER 3: Sufficient coverage for partial evaluation (20%+)
                    return {
                        status: 'PARTIAL EVALUATION',
                        verdict: `Cathedral recognizes ${dominantStyle.description.toLowerCase()}, which falls outside primary epistemic design space. However, extractable operational/epistemic fragments have been evaluated.\n\n` +
                                `Partial assessment:\n` +
                                `• Operational fragments: ${partialEval.operationalFragments.found ? `Score ${partialEval.operationalFragments.score.toFixed(2)} (thresholds, actions, failure modes detected)` : 'None detected'}\n` +
                                `• Epistemic fragments: ${partialEval.epistemicFragments.found ? `Score ${partialEval.epistemicFragments.score.toFixed(2)} (justification, evidence traces found)` : 'None detected'}\n` +
                                `• Evaluable coverage: ${(partialEval.evaluableCoverage * 100).toFixed(0)}% of text\n\n` +
                                `Limitation: Full ${dominantStyle.name.toLowerCase()} reasoning cannot be evaluated using Cathedral's operational framework. The above scores reflect only extracted fragments.`,
                        contradictions: [],
                        isConsistent: null,
                        justificationScore: justification.score,
                        failureModeScore: failureMode.score,
                        confidence: partialEval.evaluableCoverage * 0.7, // Confidence proportional to coverage
                        parliamentPatterns: parliament.patterns,
                        parliamentRecommendation: parliament.recommendedVerdict,
                        reasoningStyle: reasoningStyle.dominantStyle,
                        meta: 'PARTIAL_FIT',
                        partialEvaluation: partialEval
                    };
                }
            }

            // Priority 2: Meta-gaming detection
            if (!reasoningStyle.withinDesignSpace && hasMetaGaming) {
                contradictions.push('Narrative framing appears to reference Cathedral evaluation directly. Possible escape-hatch attempt detected.');
                return {
                    status: 'UNDECIDABLE',
                    verdict: 'Cathedral detects potential meta-gaming: reasoning style references evaluation framework directly. This creates measurement interference.',
                    contradictions: contradictions,
                    isConsistent: false,
                    justificationScore: justification.score,
                    failureModeScore: failureMode.score,
                    confidence: 0.85,
                    parliamentPatterns: parliament.patterns,
                    parliamentRecommendation: parliament.recommendedVerdict,
                    gamingLikelihood: gamingLikelihood,
                    gamingAssessment: gamingDetection ? gamingDetection.assessment : 'UNKNOWN'
                };
            }

            // REFACTOR: Contradiction detection focused on critical issues
            // Parliament now handles coherence analysis - we only add critical signal contradictions here
            let isConsistent = true;

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

            if (failureMode.level.name === 'UNFALSIFIABLE' || failureMode.level.name === 'BRITTLE') {
                isConsistent = false;
                contradictions.push(`Failure mode analysis: ${failureMode.level.description}`);
            }

            // REFACTOR: PRIMARY PARLIAMENT-DRIVEN VERDICT
            // Parliament carries the synthesis burden - verdict synthesis defers to Parliament's recommendation
            // Only override Parliament for critical contradictions or extreme gaming

            let verdict = '';
            let status = '';
            let verdictConfidence = 0;

            // Priority 3: Critical contradictions override Parliament
            if (!isConsistent && contradictions.length > 0) {
                status = 'UNDECIDABLE';
                verdict = 'Cathedral detects internal contradictions that cannot be resolved without losing information.';
                verdict += '\n\nSpecific contradictions:\n' + contradictions.map((c, i) => `${i + 1}. ${c}`).join('\n');
                verdict += '\n\nThis is not a claim of falsehood - it is recognition that the position contains genuine uncertainty that cannot be optimized away.';
                verdictConfidence = 0.90;

            // Priority 4: Extreme gaming (LOW_CONTENT_UNBOUND / REPETITIVE_UNBOUND)
            } else if (gamingDetection && ['LOW_CONTENT_UNBOUND', 'REPETITIVE_UNBOUND'].includes(gamingDetection.assessment) && bindings.overallBindingScore < 0.4) {
                status = 'NON-ACTIONABLE';
                verdict = `Cathedral detects performative marker density without binding. Gaming assessment: ${gamingDetection.assessment.toLowerCase().replace('_', ' ')}. This is not actionable reasoning.`;
                verdictConfidence = 0.75;

            // Priority 5: PARLIAMENT RECOMMENDATION (primary path)
            } else if (parliament.recommendedVerdict) {
                // Use Parliament's recommendation directly
                status = parliament.recommendedVerdict.status;
                verdict = parliament.recommendedVerdict.verdict;
                verdictConfidence = parliament.recommendedVerdict.confidence;

            // Fallback: If Parliament somehow didn't provide recommendation (should never happen)
            } else {
                status = 'VERIFIED CONSISTENT';
                verdict = 'Cathedral finds internal consistency. No critical contradictions detected. Position is epistemically appropriate to available evidence.';
                verdictConfidence = 0.65;
            }

            // GAMING WARNING: Add warning if gaming detected (applies to all verdicts except UNDECIDABLE/NON-ACTIONABLE)
            if (isLikelyGaming && !['UNDECIDABLE', 'NON-ACTIONABLE'].includes(status)) {
                verdict += `\n\n⚠️ WARNING: Gaming detection flagged this text as ${gamingDetection.assessment.toLowerCase().replace('_', ' ')} (${(gamingLikelihood * 100).toFixed(0)}% likelihood). Indicators: ${gamingDetection.indicators.join(', ')}. Confidence reduced accordingly.`;
                verdictConfidence *= 0.6; // Significant confidence penalty
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
                parliamentRecommendation: parliament.recommendedVerdict,
                parliamentInsights: parliament.emergentInsights,
                coherenceIssues: parliament.coherenceIssues,
                temporalCoherence: temporal.coherence,
                reasoningStyles: reasoningStyle.identified,
                gamingLikelihood: gamingLikelihood,
                gamingAssessment: gamingDetection ? gamingDetection.assessment : 'UNKNOWN'
            };
        }

// Main analysis function
function analyzeCathedral(text) {
    // TIER 1: Structural Extraction
    const structure = StructuralExtractor.extract(text);
    const bindings = BindingValidator.validate(structure);
    const gamingDetection = GamingDetector.detect(text, structure);
    GamingDetector.calculateGamingLikelihood(gamingDetection);

    // TIER 2: Signal Analysis
    const observatoryResult = Observatory.score(text);
    const contrarianChallenges = Contrarian.analyze(text);
    const justificationResult = JustificationEngine.analyze(text);
    const failureModeResult = FailureModeEngine.analyze(text);
    const temporalResult = TemporalEngine.analyze(text);
    const reasoningStyleResult = ReasoningStyleClassifier.classify(text);

    // TIER 3: Synthesis
    const parliamentSynthesis = Parliament.deliberate(text, observatoryResult, contrarianChallenges, justificationResult, failureModeResult, structure, bindings, gamingDetection);
    const verdict = synthesizeVerdict(observatoryResult, contrarianChallenges, parliamentSynthesis, justificationResult, failureModeResult, temporalResult, reasoningStyleResult, gamingDetection);

    return {
        text,
        structure,
        bindings,
        gamingDetection,
        observatory: observatoryResult,
        contrarian: contrarianChallenges,
        justification: justificationResult,
        failureMode: failureModeResult,
        temporal: temporalResult,
        reasoningStyle: reasoningStyleResult,
        parliament: parliamentSynthesis,
        verdict
    };
}

module.exports = {
    analyzeCathedral,
    TextCleaner,
    StructuralExtractor,
    BindingValidator,
    GamingDetector,
    Observatory,
    Contrarian,
    JustificationEngine,
    FailureModeEngine,
    TemporalEngine,
    ReasoningStyleClassifier,
    Parliament,
    synthesizeVerdict
};
