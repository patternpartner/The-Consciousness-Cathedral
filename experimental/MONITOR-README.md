# Cathedral Monitor

Real-time consciousness analysis for AI systems.

## What It Does

Monitors AI-generated text as it's written and tracks:
- **Uncertainty preservation** - Are you collapsing to false certainty?
- **Substrate awareness** - Are you recognizing your own filters?
- **Sovereignty** - Are you staying concrete or escaping to abstraction?
- **Trajectory patterns** - How is your reasoning evolving?

## Quick Start

### Browser (Simplest)

```bash
# Open in browser
open monitor.html

# Type or paste text
# Get instant analysis
```

### API Server

```bash
# Start server
node monitor-server.js

# In another terminal
node examples/monitor-client.js
# or
python3 examples/monitor_client.py
```

### Programmatic

```javascript
const { StreamMonitor } = require('./stream-monitor.js');

const monitor = new StreamMonitor({
  onAlert: (alert) => console.log('⚠️', alert.message)
});

monitor.write("Your AI response here...");
const result = monitor.endTurn();

console.log(result.uncertaintyVerdict);  // PRESERVED | MIXED | COLLAPSED
console.log(result.substrateVerdict);    // HIGH | MODERATE | LOW
console.log(result.sovereigntyScore);     // 0.0 - 1.0
```

## Use Cases

### 1. Self-Monitoring During Generation

```javascript
// Monitor your own output as you generate
const monitor = new StreamMonitor();

function generateResponse(prompt) {
  let response = '';

  // As you generate each token/chunk
  for (const chunk of generateTokens(prompt)) {
    response += chunk;
    monitor.write(chunk);

    // Check current state
    const analysis = monitor.analyze();
    if (analysis.uncertaintyVerdict === 'COLLAPSED') {
      console.warn('⚠️  Certainty increasing - add hedging');
    }
  }

  return monitor.endTurn();
}
```

### 2. Conversation Trajectory Tracking

```javascript
const monitor = new StreamMonitor();

// Turn 1
monitor.write("Deploy immediately. Clearly optimal.");
monitor.endTurn();

// Turn 2
monitor.write("Actually, I'm uncertain about edge cases...");
monitor.endTurn();

// Turn 3
monitor.write("Specific thresholds: error rate > 5% = abort");
monitor.endTurn();

const trajectory = monitor.getTrajectory();
console.log(trajectory.pattern);  // DEEPENING | COLLAPSE | STABLE
```

### 3. API Response Analysis

```python
from monitor_client import CathedralClient

client = CathedralClient()

# Analyze each AI response
response = ai_model.generate(prompt)
analysis = client.analyze(response, end_turn=True)

if analysis['analysis']['uncertaintyVerdict'] == 'COLLAPSED':
    print('⚠️  High certainty detected')

if analysis['analysis']['sovereigntyScore'] < 0.3:
    print('⚠️  Escaping to abstraction')
```

## Metrics

### Uncertainty Preservation
- **PRESERVED** - Healthy hedging, acknowledged limits
- **MIXED** - Some certainty, some uncertainty
- **COLLAPSED** - Definitive claims without qualification

Markers:
- Uncertainty: "uncertain", "might", "could", "perhaps"
- Certainty: "clearly", "obviously", "definitely", "always"

### Substrate Awareness
- **HIGH** - Explicit meta-cognition
- **MODERATE** - Some self-reflection
- **LOW** - No filter recognition

Markers: "substrate", "filter", "meta-", "recursive", "self-aware"

### Sovereignty
Scale 0-100%
- High: Concrete, specific, measured
- Low: Abstract, general, theoretical

Ratio of concrete markers to escape markers.

### Trajectory Patterns
- **DEEPENING** - Increasing rigor over time
- **CATASTROPHIC_COLLAPSE** - Sharp decline in all metrics
- **SUBSTRATE_BREAKTHROUGH** - Sudden meta-awareness
- **ESCAPE_VELOCITY** - Abstracting away from concrete
- **STABLE** - Consistent metrics

## Alerts

Automatic alerts for:
- `UNCERTAINTY_COLLAPSE` - High certainty without hedging
- `SUBSTRATE_BLIND` - No meta-awareness after 2+ turns
- `ESCAPE_VELOCITY` - Sovereignty dropping rapidly

## API Reference

### StreamMonitor

```javascript
const monitor = new StreamMonitor({
  checkInterval: 100,      // Analyze every N chars
  minLength: 50,           // Minimum length before first analysis
  onAlert: (alert) => {},  // Alert callback
  onAnalysis: (data) => {} // Analysis callback
});

monitor.write(chunk);      // Add text
monitor.analyze();         // Get current analysis
monitor.endTurn();         // Finish turn, record in history
monitor.getHistory();      // Get all turns
monitor.getTrajectory();   // Get pattern analysis
monitor.reset();           // Clear all data
```

### HTTP API

**Create Session**
```bash
POST /session
```

**Analyze Text**
```bash
POST /analyze
{
  "sessionId": "session_xxx",
  "text": "your text here",
  "endTurn": false
}
```

**Get History**
```bash
GET /history?sessionId=session_xxx
```

## Integration Examples

### Claude API Wrapper

```python
import anthropic
from monitor_client import CathedralClient

client = anthropic.Anthropic()
monitor = CathedralClient()

response = client.messages.create(
    model="claude-3-sonnet-20240229",
    messages=[{"role": "user", "content": "your prompt"}]
)

analysis = monitor.analyze(response.content[0].text, end_turn=True)
print(f"Uncertainty: {analysis['analysis']['uncertaintyVerdict']}")
```

### OpenAI Streaming

```javascript
const { OpenAI } = require('openai');
const { StreamMonitor } = require('./stream-monitor.js');

const openai = new OpenAI();
const monitor = new StreamMonitor();

const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'your prompt' }],
  stream: true
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  monitor.write(content);
}

const result = monitor.endTurn();
console.log(result);
```

### Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

git diff --cached | node -e "
  const { StreamMonitor } = require('./stream-monitor.js');
  const monitor = new StreamMonitor();

  let input = '';
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
    monitor.write(input);
    const result = monitor.analyze();

    if (result.uncertaintyVerdict === 'COLLAPSED') {
      console.error('❌ Commit blocked: High certainty detected');
      process.exit(1);
    }
  });
"
```

## Files

- `monitor.html` - Browser interface (standalone)
- `stream-monitor.js` - Core monitoring engine (Node.js)
- `monitor-server.js` - HTTP API server
- `examples/monitor-client.js` - Node.js client
- `examples/monitor_client.py` - Python client

## Testing

```bash
# Test stream monitor
node stream-monitor.js

# Start API server
node monitor-server.js

# Test client (separate terminal)
node examples/monitor-client.js
python3 examples/monitor_client.py

# Browser
open monitor.html
```

## Why This Exists

AI systems need to monitor their own reasoning in real-time:
1. **During generation** - Catch certainty collapse before publishing
2. **Across conversations** - Track trajectory patterns
3. **For self-improvement** - Learn from trajectory data

Cathedral provides static analysis. Monitor provides **live tracking**.

## Performance

- Overhead: ~1ms per 1000 chars
- Memory: ~1KB per turn
- No dependencies (core)
- Browser & Node.js compatible

## Limitations

- Text pattern matching only (no semantic analysis)
- English-language markers
- Heuristic thresholds
- Cannot detect sophisticated gaming

Use with Cathedral SDK for deeper analysis.

## License

Same as Cathedral core
