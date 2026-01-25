// cathedral.js — Cathedral Browser Main Controller

// Initialize Parliament
const parliament = new Parliament();

// DOM elements
const inputText = document.getElementById('input-text');
const analyzeBtn = document.getElementById('analyze-btn');
const clearBtn = document.getElementById('clear-btn');
const wordCountEl = document.getElementById('word-count');
const resultsSection = document.getElementById('results-section');
const loadingOverlay = document.getElementById('loading-overlay');
const processingInfo = document.getElementById('processing-info');
const statsBtn = document.getElementById('stats-btn');
const statsModal = document.getElementById('stats-modal');
const closeModal = document.querySelector('.close-modal');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const statsContent = document.getElementById('stats-content');

// Vector tabs and panels
const vectorTabs = document.querySelectorAll('.vector-tab');
const vectorPanels = document.querySelectorAll('.vector-panel');

// === EVENT LISTENERS ===

// Word count update
inputText.addEventListener('input', () => {
  const words = inputText.value.trim().split(/\s+/).filter(w => w.length > 0).length;
  wordCountEl.textContent = `${words} word${words !== 1 ? 's' : ''}`;
});

// Analyze button
analyzeBtn.addEventListener('click', () => {
  console.log('[Cathedral] Analyze button clicked');
  runAnalysis();
});

// Clear button
clearBtn.addEventListener('click', () => {
  inputText.value = '';
  wordCountEl.textContent = '0 words';
  resultsSection.style.display = 'none';
});

// Vector tab switching
vectorTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetVector = tab.dataset.vector;

    // Update active tab
    vectorTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Update active panel
    vectorPanels.forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${targetVector}`).classList.add('active');
  });
});

// Stats modal
statsBtn.addEventListener('click', () => {
  displayStats();
  statsModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
  statsModal.style.display = 'none';
});

// Click outside modal to close
statsModal.addEventListener('click', (e) => {
  if (e.target === statsModal) {
    statsModal.style.display = 'none';
  }
});

// Clear history
clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Clear all Parliament history? This cannot be undone.')) {
    parliament.clearHistory();
    statsModal.style.display = 'none';
    alert('History cleared.');
  }
});

// === MAIN ANALYSIS FUNCTION ===

async function runAnalysis() {
  console.log('[Cathedral] runAnalysis called');

  const text = inputText.value.trim();
  console.log('[Cathedral] Text length:', text.length);

  if (!text) {
    alert('Please enter some text to analyze.');
    return;
  }

  if (text.length < 50) {
    alert('Text too short for reliable analysis. Please enter at least 50 characters.');
    return;
  }

  // Show loading
  console.log('[Cathedral] Showing loading overlay');
  loadingOverlay.style.display = 'flex';

  // Small delay to allow UI to update
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    console.log('[Cathedral] Running Parliament analysis...');

    // Run Parliament analysis
    const results = parliament.analyze(text);

    console.log('[Cathedral] Analysis complete:', results);

    // Display results
    console.log('[Cathedral] Displaying results...');
    displayResults(results);

    // Show results section
    resultsSection.style.display = 'block';

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (error) {
    console.error('[Cathedral] Analysis error:', error);
    console.error('[Cathedral] Error stack:', error.stack);
    alert('Analysis failed: ' + error.message + '\n\nCheck browser console for details.');
  } finally {
    // Hide loading
    console.log('[Cathedral] Hiding loading overlay');
    loadingOverlay.style.display = 'none';
  }
}

// === DISPLAY RESULTS ===

function displayResults(results) {
  console.log('[Cathedral] displayResults called with:', results);

  // Display processing info
  processingInfo.textContent = `Analyzed ${results.metadata.wordCount} words in ${results.processingTime}ms`;

  // Display Synthesis
  const synthesisPanel = document.getElementById('panel-synthesis');
  console.log('[Cathedral] Rendering Synthesis panel...');
  if (results.synthesis) {
    synthesisPanel.innerHTML = formatSynthesisAnalysis(results.synthesis);
  } else {
    console.warn('[Cathedral] No synthesis results');
    synthesisPanel.innerHTML = '<p class="error">Synthesis failed to generate.</p>';
  }

  // Display Contrarian
  const contrarianPanel = document.getElementById('panel-contrarian');
  if (results.vectors.contrarian) {
    contrarianPanel.innerHTML = formatAnalysis(results.vectors.contrarian);
  } else {
    contrarianPanel.innerHTML = '<p class="error">Contrarian analysis unavailable.</p>';
  }

  // Display Empirical
  const empiricalPanel = document.getElementById('panel-empirical');
  if (results.vectors.empirical) {
    empiricalPanel.innerHTML = formatEmpiricalAnalysis(results.vectors.empirical);
  } else {
    empiricalPanel.innerHTML = '<p class="error">Empirical analysis unavailable.</p>';
  }

  // Display Generative
  const generativePanel = document.getElementById('panel-generative');
  if (results.vectors.generative) {
    generativePanel.innerHTML = formatGenerativeAnalysis(results.vectors.generative);
  } else {
    generativePanel.innerHTML = '<p class="error">Generative analysis unavailable.</p>';
  }

  // Display Meta-Cognitive
  const metacognitivePanel = document.getElementById('panel-metacognitive');
  if (results.vectors.metacognitive) {
    metacognitivePanel.innerHTML = formatMetacognitiveAnalysis(results.vectors.metacognitive);
  } else {
    metacognitivePanel.innerHTML = '<p class="error">Meta-Cognitive analysis unavailable.</p>';
  }
}

// === DISPLAY STATS ===

function displayStats() {
  const stats = parliament.getStats();

  statsContent.innerHTML = `
    <div class="section">
      <strong>Total Analyses:</strong>
      <p>${stats.totalAnalyses}</p>
    </div>

    ${stats.totalAnalyses > 0 ? `
      <div class="section">
        <strong>Average Agreeability:</strong>
        <p>${(stats.avgAgreeability * 100).toFixed(1)}%</p>
      </div>

      <div class="section">
        <strong>Average Empirical Confidence:</strong>
        <p>${(stats.avgEmpiricalConfidence * 100).toFixed(1)}%</p>
      </div>

      ${stats.recentTrend ? `
        <div class="section">
          <strong>Recent Trend:</strong>
          <p>${stats.recentTrend}</p>
        </div>
      ` : ''}
    ` : `
      <div class="section">
        <p>${stats.message}</p>
      </div>
    `}
  `;
}

// === KEYBOARD SHORTCUTS ===

document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter = Analyze
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    runAnalysis();
  }

  // Escape = Close modal
  if (e.key === 'Escape' && statsModal.style.display === 'flex') {
    statsModal.style.display = 'none';
  }
});

// === INITIALIZATION ===

// Debug: Check if all engines loaded
console.log('[Cathedral] Checking Parliament engines...');
console.log('- contrarianEngine:', typeof contrarianEngine);
console.log('- empiricalEngine:', typeof empiricalEngine);
console.log('- generativeEngine:', typeof generativeEngine);
console.log('- metacognitiveEngine:', typeof metacognitiveEngine);
console.log('- synthesisEngine:', typeof synthesisEngine);

// Debug: Check if all format functions loaded
console.log('[Cathedral] Checking format functions...');
console.log('- formatAnalysis:', typeof formatAnalysis);
console.log('- formatEmpiricalAnalysis:', typeof formatEmpiricalAnalysis);
console.log('- formatGenerativeAnalysis:', typeof formatGenerativeAnalysis);
console.log('- formatMetacognitiveAnalysis:', typeof formatMetacognitiveAnalysis);
console.log('- formatSynthesisAnalysis:', typeof formatSynthesisAnalysis);

console.log('[Cathedral] Parliament initialized. All 5 vectors loaded.');
console.log('[Cathedral] History:', parliament.history.length, 'analyses tracked');

// Auto-focus input on load
inputText.focus();
