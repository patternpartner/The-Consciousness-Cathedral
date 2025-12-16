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
analyzeBtn.addEventListener('click', runAnalysis);

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
  const text = inputText.value.trim();

  if (!text) {
    alert('Please enter some text to analyze.');
    return;
  }

  if (text.length < 50) {
    alert('Text too short for reliable analysis. Please enter at least 50 characters.');
    return;
  }

  // Show loading
  loadingOverlay.style.display = 'flex';

  // Small delay to allow UI to update
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    // Run Parliament analysis
    const results = parliament.analyze(text);

    // Display results
    displayResults(results);

    // Show results section
    resultsSection.style.display = 'block';

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (error) {
    console.error('Analysis error:', error);
    alert('Analysis failed: ' + error.message);
  } finally {
    // Hide loading
    loadingOverlay.style.display = 'none';
  }
}

// === DISPLAY RESULTS ===

function displayResults(results) {
  // Display processing info
  processingInfo.textContent = `Analyzed ${results.metadata.wordCount} words in ${results.processingTime}ms`;

  // Display Synthesis
  const synthesisPanel = document.getElementById('panel-synthesis');
  if (results.synthesis) {
    synthesisPanel.innerHTML = formatSynthesisAnalysis(results.synthesis);
  } else {
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

console.log('[Cathedral] Parliament initialized. All 5 vectors loaded.');
console.log('[Cathedral] History:', parliament.history.length, 'analyses tracked');

// Auto-focus input on load
inputText.focus();
