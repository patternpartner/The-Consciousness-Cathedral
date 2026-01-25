#!/usr/bin/env node

const API_BASE = process.env.MONITOR_API || 'http://localhost:3000';

class CathedralClient {
  constructor() {
    this.sessionId = null;
  }

  async createSession() {
    const res = await fetch(`${API_BASE}/session`, { method: 'POST' });
    const data = await res.json();
    this.sessionId = data.sessionId;
    return this.sessionId;
  }

  async analyze(text, endTurn = false) {
    if (!this.sessionId) await this.createSession();

    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: this.sessionId, text, endTurn })
    });

    return res.json();
  }

  async getHistory() {
    if (!this.sessionId) return null;

    const res = await fetch(`${API_BASE}/history?sessionId=${this.sessionId}`);
    return res.json();
  }
}

async function demo() {
  const client = new CathedralClient();

  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  Cathedral Monitor Client Demo                ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  const sessionId = await client.createSession();
  console.log(`Session created: ${sessionId}\n`);

  const turns = [
    "We should deploy this caching system immediately. It's clearly the optimal solution.",
    "Actually, I'm uncertain about edge cases. The substrate might be filtering my perception of failure modes.",
    "Let me be specific: If error rate exceeds 5%, we abort. If cache exceeds 90%, we scale."
  ];

  for (let i = 0; i < turns.length; i++) {
    console.log(`Turn ${i + 1}:`);
    console.log(`"${turns[i].substring(0, 70)}..."\n`);

    const result = await client.analyze(turns[i], true);

    console.log(`Uncertainty: ${result.analysis.uncertaintyVerdict}`);
    console.log(`Substrate: ${result.analysis.substrateVerdict}`);
    console.log(`Sovereignty: ${(result.analysis.sovereigntyScore * 100).toFixed(0)}%`);

    if (result.trajectory) {
      console.log(`\nTrajectory Pattern: ${result.trajectory.pattern}`);
      console.log(`Uncertainty Trend: ${result.trajectory.trends.uncertainty.trend}`);
    }

    console.log('\n' + '─'.repeat(50) + '\n');
  }

  const history = await client.getHistory();
  console.log('Full Conversation Analysis:');
  console.log(`Pattern: ${history.trajectory.pattern}`);
  console.log(`Total Turns: ${history.trajectory.turns}`);
  console.log('\nEvolution:');
  Object.entries(history.trajectory.trends).forEach(([metric, data]) => {
    console.log(`  ${metric}: ${data.trend} (${data.change > 0 ? '+' : ''}${(data.change * 100).toFixed(0)}%)`);
  });
}

if (require.main === module) {
  if (!globalThis.fetch) {
    console.error('Node.js 18+ required (native fetch support)');
    console.log('Or run: npm install node-fetch');
    process.exit(1);
  }

  demo().catch(e => {
    console.error('Error:', e.message);
    console.log('\nMake sure monitor server is running:');
    console.log('  node monitor-server.js');
    process.exit(1);
  });
}

module.exports = CathedralClient;
