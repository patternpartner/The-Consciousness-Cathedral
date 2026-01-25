#!/usr/bin/env node
const http = require('http');
const { StreamMonitor } = require('./stream-monitor.js');

const sessions = new Map();

function createSession(id) {
  const monitor = new StreamMonitor({
    onAlert: (alert) => {
      console.log(`[${id}] ⚠️ ${alert.type}: ${alert.message}`);
    }
  });
  sessions.set(id, monitor);
  return monitor;
}

function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/session') {
    const id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    createSession(id);
    res.writeHead(200);
    res.end(JSON.stringify({ sessionId: id }));
    return;
  }

  if (url.pathname === '/analyze' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { sessionId, text, endTurn } = JSON.parse(body);

        if (!sessionId) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'sessionId required' }));
          return;
        }

        let monitor = sessions.get(sessionId);
        if (!monitor) {
          monitor = createSession(sessionId);
        }

        monitor.write(text || '');

        const result = endTurn ? monitor.endTurn() : monitor.analyze();
        const trajectory = monitor.getTrajectory();

        res.writeHead(200);
        res.end(JSON.stringify({
          analysis: result,
          trajectory,
          turnCount: monitor.turnCount,
          sessionId
        }));

      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (url.pathname === '/history') {
    const sessionId = url.searchParams.get('sessionId');
    const monitor = sessions.get(sessionId);

    if (!monitor) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Session not found' }));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      history: monitor.getHistory(),
      trajectory: monitor.getTrajectory()
    }));
    return;
  }

  if (url.pathname === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      name: 'Cathedral Monitor Server',
      version: '1.0.0',
      endpoints: {
        '/session': 'POST - Create new session',
        '/analyze': 'POST - Analyze text (body: {sessionId, text, endTurn})',
        '/history': 'GET - Get session history (query: ?sessionId=xxx)'
      },
      activeSessions: sessions.size
    }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

const PORT = process.env.PORT || 3000;
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  Cathedral Monitor Server                     ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log(`\nListening on http://localhost:${PORT}`);
  console.log('\nEndpoints:');
  console.log('  POST /session         - Create session');
  console.log('  POST /analyze         - Analyze text');
  console.log('  GET  /history         - Get history');
  console.log('\nExample:');
  console.log(`  curl -X POST http://localhost:${PORT}/session`);
  console.log(`  curl -X POST http://localhost:${PORT}/analyze \\`);
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"sessionId":"xxx","text":"your text"}\'');
  console.log('\nPress Ctrl+C to stop\n');
});

setInterval(() => {
  const now = Date.now();
  for (const [id, monitor] of sessions.entries()) {
    if (monitor.history.length > 0) {
      const last = new Date(monitor.history[monitor.history.length - 1].timestamp).getTime();
      if (now - last > 3600000) {
        sessions.delete(id);
        console.log(`Cleaned up session ${id}`);
      }
    }
  }
}, 300000);
