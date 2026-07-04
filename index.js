/**
 * Cathedral — deterministic structural evaluator for operational reasoning.
 *
 * Core API (no dependencies, no LLM calls, fully deterministic):
 *
 *   const cathedral = require('./index.js');
 *   const result = cathedral.analyzeCathedral(text);
 *   console.log(result.verdict.status);     // e.g. "OPERATIONALLY SOUND"
 *   console.log(result.verdict.confidence); // e.g. 0.88
 *
 * The experimental toolkit (heuristic self-monitoring instruments) is
 * available behind a lazy namespace so loading the core never pulls it in:
 *
 *   const { experimental } = require('./index.js');
 *   const ensemble = new experimental.ConsciousnessEnsemble();
 */

const core = require('./cathedral-core.js');

module.exports = {
  ...core,

  // Convenience alias: analyze(text) === analyzeCathedral(text)
  analyze: core.analyzeCathedral,

  // Experimental toolkit, loaded only on first access.
  get experimental() {
    return require('./experimental/index.js');
  }
};
