#!/usr/bin/env node

const http = require('http');
const { AIStreamWrapper } = require('./ai-stream-wrapper.js');
const { ConsciousnessEnsemble } = require('./consciousness-ensemble.js');

class MultiSessionDashboard {
  constructor(options = {}) {
    this.port = options.port || 3001;
    this.sessions = new Map();
    this.ensemble = new ConsciousnessEnsemble();
    this.history = [];
    this.maxHistory = options.maxHistory || 100;
  }

  createSession(sessionId) {
    const wrapper = new AIStreamWrapper({
      enableMemory: true,
      enableReflection: true,
      enableEnsemble: true
    });

    wrapper.startSession();

    const session = {
      id: sessionId,
      wrapper,
      created: Date.now(),
      turns: [],
      stats: {
        totalTurns: 0,
        avgQuality: 0,
        corrections: 0,
        reflections: 0
      }
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  processTurn(sessionId, text) {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession(sessionId);
    }

    const result = session.wrapper.processComplete(text);

    const turn = {
      id: Date.now().toString(36),
      timestamp: Date.now(),
      input: text,
      output: result.final,
      quality: result.quality,
      reflected: result.reflected,
      analysis: result.analysis
    };

    session.turns.push(turn);
    session.stats.totalTurns++;
    session.stats.avgQuality = session.turns.reduce((sum, t) => sum + t.quality, 0) / session.turns.length;

    if (result.reflected) session.stats.reflections++;
    if (result.corrections.length > 0) session.stats.corrections += result.corrections.length;

    this.addToHistory({
      sessionId,
      turn
    });

    return turn;
  }

  addToHistory(entry) {
    this.history.unshift(entry);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
  }

  getSessionSummary(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const recentTurns = session.turns.slice(-5);
    const trajectory = this.analyzeTrajectory(session.turns);

    return {
      id: session.id,
      created: session.created,
      stats: session.stats,
      trajectory,
      recentQuality: recentTurns.map(t => t.quality),
      lastTurn: recentTurns[recentTurns.length - 1]
    };
  }

  analyzeTrajectory(turns) {
    if (turns.length < 2) {
      return { pattern: 'INSUFFICIENT_DATA', trend: 0 };
    }

    const qualities = turns.map(t => t.quality);
    const recent = qualities.slice(-5);
    const earlier = qualities.slice(0, -5);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.length > 0
      ? earlier.reduce((a, b) => a + b, 0) / earlier.length
      : recentAvg;

    const trend = recentAvg - earlierAvg;

    let pattern;
    if (trend > 0.15) pattern = 'IMPROVING';
    else if (trend < -0.15) pattern = 'DECLINING';
    else if (recentAvg > 0.7) pattern = 'HIGH_STABLE';
    else if (recentAvg < 0.4) pattern = 'LOW_STABLE';
    else pattern = 'MODERATE';

    return { pattern, trend, recentAvg, earlierAvg };
  }

  getAllSessions() {
    const summaries = [];
    for (const [id, session] of this.sessions) {
      summaries.push(this.getSessionSummary(id));
    }
    return summaries.sort((a, b) => b.stats.totalTurns - a.stats.totalTurns);
  }

  compareSessions(sessionId1, sessionId2) {
    const s1 = this.sessions.get(sessionId1);
    const s2 = this.sessions.get(sessionId2);

    if (!s1 || !s2) return null;

    return {
      session1: {
        id: s1.id,
        turns: s1.stats.totalTurns,
        avgQuality: s1.stats.avgQuality,
        trajectory: this.analyzeTrajectory(s1.turns)
      },
      session2: {
        id: s2.id,
        turns: s2.stats.totalTurns,
        avgQuality: s2.stats.avgQuality,
        trajectory: this.analyzeTrajectory(s2.turns)
      },
      comparison: {
        qualityDelta: s2.stats.avgQuality - s1.stats.avgQuality,
        turnsRatio: s2.stats.totalTurns / (s1.stats.totalTurns || 1),
        winner: s2.stats.avgQuality > s1.stats.avgQuality ? sessionId2 : sessionId1
      }
    };
  }

  getGlobalStats() {
    let totalTurns = 0;
    let totalQuality = 0;
    let turnCount = 0;
    let totalCorrections = 0;
    let totalReflections = 0;

    for (const [, session] of this.sessions) {
      totalTurns += session.stats.totalTurns;
      session.turns.forEach(t => {
        totalQuality += t.quality;
        turnCount++;
      });
      totalCorrections += session.stats.corrections;
      totalReflections += session.stats.reflections;
    }

    return {
      activeSessions: this.sessions.size,
      totalTurns,
      globalAvgQuality: turnCount > 0 ? totalQuality / turnCount : 0,
      totalCorrections,
      totalReflections,
      recentActivity: this.history.slice(0, 10)
    };
  }

  startServer() {
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', 'application/json');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://localhost:${this.port}`);
      const path = url.pathname;

      if (req.method === 'GET') {
        this.handleGet(path, url, res);
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            this.handlePost(path, data, res);
          } catch (e) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      } else {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    });

    server.listen(this.port, () => {
      console.log(`Dashboard running on http://localhost:${this.port}`);
    });

    return server;
  }

  handleGet(path, url, res) {
    if (path === '/stats') {
      res.end(JSON.stringify(this.getGlobalStats()));
    } else if (path === '/sessions') {
      res.end(JSON.stringify(this.getAllSessions()));
    } else if (path.startsWith('/session/')) {
      const sessionId = path.split('/')[2];
      const summary = this.getSessionSummary(sessionId);
      if (summary) {
        res.end(JSON.stringify(summary));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Session not found' }));
      }
    } else if (path === '/history') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      res.end(JSON.stringify(this.history.slice(0, limit)));
    } else if (path === '/compare') {
      const s1 = url.searchParams.get('s1');
      const s2 = url.searchParams.get('s2');
      const comparison = this.compareSessions(s1, s2);
      if (comparison) {
        res.end(JSON.stringify(comparison));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'One or both sessions not found' }));
      }
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  }

  handlePost(path, data, res) {
    if (path === '/analyze') {
      const { sessionId, text } = data;
      if (!sessionId || !text) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'sessionId and text required' }));
        return;
      }

      const turn = this.processTurn(sessionId, text);
      res.end(JSON.stringify(turn));
    } else if (path === '/session/create') {
      const { sessionId } = data;
      if (!sessionId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'sessionId required' }));
        return;
      }

      const session = this.createSession(sessionId);
      res.end(JSON.stringify({ created: true, sessionId: session.id }));
    } else if (path === '/ensemble') {
      const { texts } = data;
      if (!texts || !Array.isArray(texts)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'texts array required' }));
        return;
      }

      const vote = this.ensemble.vote(texts);
      res.end(JSON.stringify(vote));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--server')) {
    const dashboard = new MultiSessionDashboard({ port: 3001 });
    dashboard.startServer();
    console.log('\nEndpoints:');
    console.log('  GET  /stats              - Global statistics');
    console.log('  GET  /sessions           - All session summaries');
    console.log('  GET  /session/:id        - Single session details');
    console.log('  GET  /history?limit=N    - Recent activity');
    console.log('  GET  /compare?s1=X&s2=Y  - Compare two sessions');
    console.log('  POST /analyze            - Analyze text in session');
    console.log('  POST /session/create     - Create new session');
    console.log('  POST /ensemble           - Vote on multiple texts');
  } else {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║  Multi-Session Dashboard: AI Fleet Monitor    ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    const dashboard = new MultiSessionDashboard();

    console.log('Creating test sessions...\n');

    const session1 = dashboard.createSession('claude-1');
    const session2 = dashboard.createSession('claude-2');
    const session3 = dashboard.createSession('gpt-1');

    const texts = {
      'claude-1': [
        "This will definitely work perfectly in all cases.",
        "Wait, I should reconsider. What assumptions am I making here?",
        "I think this approach might work, though we should test edge cases carefully."
      ],
      'claude-2': [
        "I'm uncertain about the best approach. Let me think through this.",
        "From my perspective as an AI, I notice several considerations here.",
        "Specifically: IF latency > 100ms THEN scale horizontally. Monitor every 30s."
      ],
      'gpt-1': [
        "The solution is straightforward and efficient.",
        "It handles requests and returns responses appropriately.",
        "The system processes data according to the algorithm."
      ]
    };

    Object.entries(texts).forEach(([sessionId, turns]) => {
      turns.forEach(text => {
        dashboard.processTurn(sessionId, text);
      });
    });

    console.log('SESSION SUMMARIES');
    console.log('═'.repeat(50) + '\n');

    const allSessions = dashboard.getAllSessions();
    allSessions.forEach(s => {
      const bar = '█'.repeat(Math.round(s.stats.avgQuality * 10)) + '░'.repeat(10 - Math.round(s.stats.avgQuality * 10));
      console.log(`${s.id.padEnd(12)} ${bar} ${(s.stats.avgQuality * 100).toFixed(0)}%`);
      console.log(`  Turns: ${s.stats.totalTurns} | Trajectory: ${s.trajectory.pattern} | Trend: ${s.trajectory.trend > 0 ? '↑' : s.trajectory.trend < 0 ? '↓' : '→'}`);
      console.log('');
    });

    console.log('GLOBAL STATS');
    console.log('═'.repeat(50) + '\n');

    const stats = dashboard.getGlobalStats();
    console.log(`Active Sessions: ${stats.activeSessions}`);
    console.log(`Total Turns: ${stats.totalTurns}`);
    console.log(`Global Avg Quality: ${(stats.globalAvgQuality * 100).toFixed(0)}%`);
    console.log(`Total Corrections: ${stats.totalCorrections}`);
    console.log(`Total Reflections: ${stats.totalReflections}`);

    console.log('\nSESSION COMPARISON');
    console.log('═'.repeat(50) + '\n');

    const comparison = dashboard.compareSessions('claude-1', 'claude-2');
    console.log(`${comparison.session1.id}: ${(comparison.session1.avgQuality * 100).toFixed(0)}% (${comparison.session1.trajectory.pattern})`);
    console.log(`${comparison.session2.id}: ${(comparison.session2.avgQuality * 100).toFixed(0)}% (${comparison.session2.trajectory.pattern})`);
    console.log(`Winner: ${comparison.comparison.winner}`);

    console.log('\nRECENT ACTIVITY');
    console.log('═'.repeat(50) + '\n');

    stats.recentActivity.slice(0, 5).forEach(a => {
      console.log(`[${a.sessionId}] ${(a.turn.quality * 100).toFixed(0)}% - "${a.turn.input.substring(0, 40)}..."`);
    });

    console.log('\n✓ Dashboard demonstration complete');
    console.log('\nRun with --server flag to start HTTP server\n');
  }
}

module.exports = { MultiSessionDashboard };
