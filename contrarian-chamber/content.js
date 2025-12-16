// content.js — Contrarian Chamber Entry Point
// Injects epistemic adversary into AI conversations

// Import modules (injected via web_accessible_resources)
let normalizeModule, engineModule;

async function loadModules() {
  try {
    const normalizeUrl = chrome.runtime.getURL('normalize.js');
    const engineUrl = chrome.runtime.getURL('engine.js');

    // Load modules dynamically
    const normalizeScript = await fetch(normalizeUrl).then(r => r.text());
    const engineScript = await fetch(engineUrl).then(r => r.text());

    // Execute in isolated scope
    eval(normalizeScript);
    eval(engineScript);

    normalizeModule = { normalizeAssistantMessage };
    engineModule = { contrarianEngine, formatAnalysis };
  } catch (err) {
    console.error('[Contrarian Chamber] Failed to load modules:', err);
  }
}

// Track processed nodes to avoid duplicate analysis
const processedNodes = new WeakSet();

// Current hostname for normalization
const hostname = window.location.hostname;

// Contrarian panel state
let panelVisible = false;
let currentAnalysis = null;

// Initialize
(async function init() {
  await loadModules();

  if (!normalizeModule || !engineModule) {
    console.error('[Contrarian Chamber] Modules not loaded, aborting');
    return;
  }

  console.log('[Contrarian Chamber] Initialized on', hostname);

  // Inject trigger button
  createTriggerButton();

  // Start observing DOM for new assistant messages
  observeMessages();
})();

// Create floating trigger button
function createTriggerButton() {
  const button = document.createElement('div');
  button.id = 'contrarian-trigger';
  button.className = 'contrarian-trigger';
  button.innerHTML = '⚡';
  button.title = 'Toggle Contrarian Analysis';

  button.addEventListener('click', togglePanel);

  document.body.appendChild(button);
}

// Observe DOM for new assistant messages
function observeMessages() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          analyzeIfAssistantMessage(node);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Check if node contains assistant message and analyze
function analyzeIfAssistantMessage(node) {
  if (processedNodes.has(node)) return;

  // Attempt normalization
  const normalized = normalizeModule.normalizeAssistantMessage(node, hostname);

  if (!normalized || !normalized.text) return;
  if (normalized.text.length < 50) return; // Too short to analyze meaningfully

  // Mark as processed
  processedNodes.add(node);

  // Run contrarian analysis
  const analysis = engineModule.contrarianEngine(normalized.text, normalized.metadata);

  // Store latest analysis
  currentAnalysis = {
    ...analysis,
    normalized,
    timestamp: Date.now()
  };

  // Update panel if visible
  if (panelVisible) {
    updatePanel();
  }

  // Update trigger button state
  updateTriggerState(analysis.agreeability_score);

  console.log('[Contrarian Chamber] Analysis:', {
    confidence: normalized.confidence,
    agreeability: analysis.agreeability_score,
    flags: analysis.pandering_flags.length
  });
}

// Update trigger button visual state based on agreeability
function updateTriggerState(score) {
  const trigger = document.getElementById('contrarian-trigger');
  if (!trigger) return;

  if (score > 0.7) {
    trigger.classList.add('high-alert');
    trigger.classList.remove('medium-alert');
  } else if (score > 0.4) {
    trigger.classList.add('medium-alert');
    trigger.classList.remove('high-alert');
  } else {
    trigger.classList.remove('high-alert', 'medium-alert');
  }
}

// Toggle contrarian panel
function togglePanel() {
  panelVisible = !panelVisible;

  if (panelVisible) {
    showPanel();
  } else {
    hidePanel();
  }
}

// Show contrarian analysis panel
function showPanel() {
  let panel = document.getElementById('contrarian-panel');

  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'contrarian-panel';
    panel.className = 'contrarian-panel';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', togglePanel);

    // Header
    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = '<h2>Contrarian Chamber</h2><p class="subtitle">Epistemic Adversary</p>';
    header.appendChild(closeBtn);

    // Content area
    const content = document.createElement('div');
    content.className = 'panel-content';
    content.id = 'contrarian-content';

    panel.appendChild(header);
    panel.appendChild(content);

    document.body.appendChild(panel);
  }

  panel.classList.add('visible');
  updatePanel();
}

// Hide panel
function hidePanel() {
  const panel = document.getElementById('contrarian-panel');
  if (panel) {
    panel.classList.remove('visible');
  }
}

// Update panel content with current analysis
function updatePanel() {
  const content = document.getElementById('contrarian-content');
  if (!content) return;

  if (!currentAnalysis) {
    content.innerHTML = `
      <div class="empty-state">
        <p>No analysis available yet.</p>
        <p class="hint">Waiting for assistant response...</p>
      </div>
    `;
    return;
  }

  const { normalized, timestamp } = currentAnalysis;
  const timeSince = Math.floor((Date.now() - timestamp) / 1000);

  content.innerHTML = `
    <div class="meta-info">
      <span class="hostname">${normalized.hostname}</span>
      <span class="confidence">Extraction: ${(normalized.confidence * 100).toFixed(0)}%</span>
      <span class="timestamp">${timeSince}s ago</span>
    </div>

    ${engineModule.formatAnalysis(currentAnalysis)}

    ${normalized.artifactsRemoved.length > 0 ? `
      <div class="section artifacts">
        <strong>Artifacts Removed:</strong>
        <ul>
          ${normalized.artifactsRemoved.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <div class="footer">
      <p class="note">This analysis targets epistemic patterns, not performance quality.</p>
    </div>
  `;
}

// Log extension load
console.log('[Contrarian Chamber] Content script loaded');
