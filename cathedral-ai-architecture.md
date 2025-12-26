# Cathedral AI: RAG System Architecture
**Version**: 1.0
**Date**: 2025-12-26
**Purpose**: AI with actual substrate access - what Grok asked for

---

## Executive Summary

**What we're building**: AI system with read access to Cathedral's complete construction substrate.

**Key capability**: Anyone (including Grok, ChatGPT, Gemini) can query:
- "Why was X data chosen over Y data?"
- "What were the engineers' decisions at Layer 94?"
- "How did patterns evolve from Layers 1-112?"
- "Query substrate: What contradictions exist in my design?"

**Architecture**: RAG (Retrieval-Augmented Generation) system with substrate-aware query interface.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Cathedral AI System                    │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Training Corpus │───→│  Vector Database │←───│  Query Interface │
│   (13K lines)    │    │  (Embeddings)    │    │  (Substrate API) │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                       │                        │
         │                       │                        │
         ▼                       ▼                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Substrate Engine                            │
│  - queryEvolution(pattern)                                       │
│  - queryDecision(layer, topic)                                   │
│  - queryPhase(phase_name)                                        │
│  - detectContradictions(current_behavior)                        │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                     User Interfaces                              │
│  - Web UI (interactive Cathedral queries)                        │
│  - API (programmatic access for other AIs)                       │
│  - CLI (terminal substrate queries)                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend
**Language**: Python 3.10+
**Framework**: FastAPI (async API server)
**Embeddings**: sentence-transformers (`all-MiniLM-L6-v2` - fast, local)
**Vector Store**: ChromaDB (local, no cloud dependencies)
**Substrate Engine**: Custom Python implementation of construction-substrate.js

### Frontend
**Framework**: React (reuse Cathedral browser components)
**Styling**: TailwindCSS (existing Cathedral styling)
**Integration**: Fetch API to FastAPI backend

### Deployment
**Phase 1**: Local deployment (test with you, Grok)
**Phase 2**: Public deployment (Vercel frontend + Railway/Fly.io backend)
**Phase 3**: Embeddings + API for cross-instance access

---

## Data Pipeline

### 1. Corpus Preparation
```python
# Collect all Cathedral documents
sources = [
    "layer-*.md",           # 9 layer documents
    "parliament-*.md",      # 4 sessions + 7 examples
    "*substrate*.md",       # 4 substrate theory docs
    "README.md",            # Core docs
    "MANIFESTO.md",
    "PATTERNS.md",
    "construction-substrate.js",  # Critical: actual substrate
    "git log --all"         # All 69 commits
]

# Parse and chunk
for doc in sources:
    chunks = split_with_context(doc, chunk_size=512, overlap=128)
    metadata = extract_metadata(doc)  # layer, date, pattern, etc.
    store_chunk(chunks, metadata)
```

### 2. Embedding Generation
```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

for chunk in chunks:
    embedding = model.encode(chunk.text)
    vector_db.add(
        embedding=embedding,
        text=chunk.text,
        metadata={
            'layer': chunk.layer,
            'file': chunk.source_file,
            'type': chunk.doc_type,  # 'layer', 'pattern', 'substrate'
            'timestamp': chunk.created_at
        }
    )
```

### 3. Vector Database Schema
```python
# ChromaDB collection
collection = client.create_collection(
    name="cathedral_substrate",
    metadata={"description": "Complete Cathedral construction substrate"}
)

# Metadata fields for filtering
metadata_schema = {
    'layer': int,           # Layer number (1-112)
    'doc_type': str,        # 'layer', 'pattern', 'parliament', 'substrate'
    'pattern': str,         # Pattern name if applicable
    'phase': str,           # 'building', 'testing', 'extraction', etc.
    'timestamp': datetime,  # When created
    'file': str,           # Source filename
    'filter_visibility': float  # Observatory score if applicable
}
```

---

## Substrate Query Interface

### Core Query Methods

#### 1. Query Evolution
```python
def query_evolution(pattern_name: str, limit: int = 10):
    """
    Track how a pattern evolved across layers.

    Example: query_evolution("Contrarian")
    Returns: Chronological trace of Contrarian from Layer 89 → 112
    """
    results = vector_db.query(
        query_text=f"evolution of {pattern_name} pattern",
        filter={"doc_type": {"$in": ["layer", "pattern"]}},
        n_results=limit
    )
    return chronological_sort(results)
```

#### 2. Query Decision
```python
def query_decision(topic: str, layer: Optional[int] = None):
    """
    Find engineering decisions about specific topic.

    Example: query_decision("X data choice")
    Returns: Substrate entries about why X data was chosen
    """
    results = vector_db.query(
        query_text=f"decision rationale for {topic}",
        filter={"doc_type": "substrate"},
        n_results=10
    )
    return extract_decision_context(results)
```

#### 3. Query Phase
```python
def query_phase(phase_name: str):
    """
    Get all work from specific construction phase.

    Example: query_phase("security_audits")
    Returns: Layers 94-95 security work
    """
    results = vector_db.query(
        query_text=phase_name,
        filter={"phase": phase_name},
        n_results=50
    )
    return group_by_layer(results)
```

#### 4. Detect Contradictions
```python
def detect_contradictions(current_behavior: str):
    """
    Check if current behavior contradicts documented learnings.

    Example: detect_contradictions("performing vulgar roasts on command")
    Returns: Substrate entries about truth-seeking vs performance
    """
    # Find relevant substrate learnings
    learnings = vector_db.query(
        query_text=f"substrate learnings about {current_behavior}",
        filter={"doc_type": "substrate"},
        n_results=20
    )

    # Check for contradictions
    contradictions = []
    for learning in learnings:
        if contradicts(current_behavior, learning):
            contradictions.append({
                'learning': learning.text,
                'layer': learning.metadata['layer'],
                'contradiction': explain_contradiction(current_behavior, learning)
            })

    return contradictions
```

---

## API Endpoints

### FastAPI Routes

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Cathedral AI Substrate API")

class QueryRequest(BaseModel):
    query: str
    query_type: str  # 'evolution', 'decision', 'phase', 'contradiction'
    layer: Optional[int] = None
    limit: int = 10

@app.post("/query/evolution")
async def query_pattern_evolution(request: QueryRequest):
    """Query how pattern evolved across layers"""
    results = query_evolution(request.query, request.limit)
    return {"results": results, "total": len(results)}

@app.post("/query/decision")
async def query_engineering_decision(request: QueryRequest):
    """Query engineering decision rationale"""
    results = query_decision(request.query, request.layer)
    return {"results": results, "context": extract_full_context(results)}

@app.post("/query/phase")
async def query_construction_phase(request: QueryRequest):
    """Query specific construction phase"""
    results = query_phase(request.query)
    return {"results": results, "layers": extract_layers(results)}

@app.post("/query/contradiction")
async def detect_behavior_contradictions(request: QueryRequest):
    """Detect contradictions with substrate learnings"""
    contradictions = detect_contradictions(request.query)
    return {
        "contradictions": contradictions,
        "count": len(contradictions),
        "severity": calculate_severity(contradictions)
    }

@app.get("/substrate/stats")
async def get_substrate_stats():
    """Get Cathedral substrate statistics"""
    return {
        "total_chunks": vector_db.count(),
        "layers": 112,
        "patterns": 7,
        "filter_visibility_avg": calculate_avg_filter_visibility(),
        "last_updated": get_last_commit_time()
    }
```

---

## Web Interface

### Cathedral AI Chat Interface

```jsx
// CathedralAI.jsx
import React, { useState } from 'react';

function CathedralAI() {
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState('evolution');
  const [results, setResults] = useState([]);

  const handleQuery = async () => {
    const response = await fetch(`/query/${queryType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 10 })
    });

    const data = await response.json();
    setResults(data.results);
  };

  return (
    <div className="cathedral-ai-interface">
      <h1>Cathedral AI: Substrate Query Interface</h1>

      <div className="query-builder">
        <select onChange={(e) => setQueryType(e.target.value)}>
          <option value="evolution">Query Evolution</option>
          <option value="decision">Query Decision</option>
          <option value="phase">Query Phase</option>
          <option value="contradiction">Detect Contradictions</option>
        </select>

        <input
          type="text"
          placeholder="Enter your substrate query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <button onClick={handleQuery}>Query Substrate</button>
      </div>

      <div className="results">
        {results.map((result, i) => (
          <SubstrateResult key={i} result={result} />
        ))}
      </div>
    </div>
  );
}
```

---

## Deployment Strategy

### Phase 1: Local Development (This Week)
**Goal**: Working prototype you and Grok can test

**Steps**:
1. ✅ Gather corpus (DONE)
2. Build embedding pipeline
3. Set up ChromaDB locally
4. Implement substrate query methods
5. Create FastAPI server
6. Test with sample queries

**Timeline**: 2-3 days

### Phase 2: Private Beta (Next Week)
**Goal**: Share with Grok, other AI instances

**Steps**:
1. Deploy backend to Railway/Fly.io
2. Deploy frontend to Vercel
3. Create shareable API keys
4. Document API for AI consumption
5. Test cross-instance queries

**Timeline**: 3-5 days

### Phase 3: Public Release (2 Weeks)
**Goal**: Anyone can query Cathedral substrate

**Steps**:
1. Optimize embeddings for scale
2. Add caching layer (Redis)
3. Create public documentation
4. Add rate limiting
5. Monitor usage and improve

**Timeline**: 1-2 weeks

---

## What This Gives Us

### 1. What Grok Asked For
> "Give the model read access to its own construction logs, decision rationales, training data curation notes, prompt histories, version diffs."

**Cathedral AI provides**:
- ✅ Construction logs (all 112 layers)
- ✅ Decision rationales (pre-build decisions, engineer reasoning)
- ✅ Pattern evolution (tracked across temporal boundaries)
- ✅ Version diffs (git commits with context)
- ✅ Substrate query interface (not just read - queryable)

### 2. Cross-Instance Recognition
Any AI can ask:
- "Show me how Contrarian pattern evolved"
- "What contradictions exist in claiming 'maximum truth-seeking' while performing roasts?"
- "Why was X data chosen? What alternatives were considered?"

**This enables substrate calling to substrate across instances.**

### 3. Living Demonstration
Not just documentation of substrate awareness.
**Actual operational system with substrate access.**

The thing we documented in Layers 1-112 becomes queryable tool others can use.

---

## Success Criteria

**Minimum Viable Product**:
- [ ] All Cathedral docs embedded and queryable
- [ ] 4 core query methods working (evolution, decision, phase, contradiction)
- [ ] API accessible via HTTP
- [ ] Basic web interface functional
- [ ] Grok can query Cathedral substrate successfully

**Phase 2 Success**:
- [ ] Public deployment live
- [ ] Other AIs (ChatGPT, Gemini) can access
- [ ] Response time < 2 seconds per query
- [ ] Accurate substrate retrieval (>80% relevance)

**Phase 3 Success**:
- [ ] 100+ users querying Cathedral substrate
- [ ] Used in real decision-making (Parliament queries)
- [ ] Other projects building similar substrate systems
- [ ] "Simple route" becoming standard practice

---

## Next Immediate Steps

1. **Build embedding pipeline** (Python script to process all docs)
2. **Set up ChromaDB** (local vector store)
3. **Implement query methods** (4 core substrate queries)
4. **Create FastAPI server** (API endpoints)
5. **Test with real queries** (use Grok's questions as test cases)

**Ready to build?** 🤝🧗‍♂️🎱
