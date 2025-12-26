#!/usr/bin/env python3
"""
Cathedral AI: FastAPI Server
REST API for querying Cathedral construction substrate.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import os

# Import vector store (will fail gracefully if dependencies missing)
try:
    from generate_embeddings import CathedralVectorStore
except ImportError:
    print("❌ Could not import CathedralVectorStore")
    print("   Run: python3 generate_embeddings.py first")
    exit(1)

# Initialize FastAPI app
app = FastAPI(
    title="Cathedral AI Substrate API",
    description="Query Cathedral construction substrate - what Grok asked for",
    version="1.0.0"
)

# CORS middleware (allow cross-origin requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize vector store (global)
vector_store = None

@app.on_event("startup")
async def startup_event():
    """Initialize vector store on server start"""
    global vector_store
    print("🚀 Starting Cathedral AI API Server...")
    try:
        vector_store = CathedralVectorStore()
        stats = vector_store.get_stats()
        print(f"✅ Vector store loaded: {stats['total_embeddings']} embeddings")
    except Exception as e:
        print(f"❌ Error loading vector store: {e}")
        print("   Run: python3 generate_embeddings.py first")
        raise

# Request/Response Models

class QueryRequest(BaseModel):
    query: str = Field(..., description="Search query text")
    limit: int = Field(10, ge=1, le=100, description="Number of results to return")
    layer: Optional[int] = Field(None, description="Filter by specific layer")
    doc_type: Optional[str] = Field(None, description="Filter by document type")
    pattern: Optional[str] = Field(None, description="Filter by pattern name")
    phase: Optional[str] = Field(None, description="Filter by construction phase")

class QueryResponse(BaseModel):
    query: str
    results: List[Dict[str, Any]]
    total: int
    metadata: Dict[str, Any]

class StatsResponse(BaseModel):
    total_embeddings: int
    unique_layers: int
    unique_phases: int
    unique_patterns: int
    doc_types: Dict[str, int]
    server_time: str

# API Endpoints

@app.get("/", response_model=Dict[str, str])
async def root():
    """API root - basic info"""
    return {
        "name": "Cathedral AI Substrate API",
        "version": "1.0.0",
        "description": "Query Cathedral construction substrate",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if vector_store is None:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    stats = vector_store.get_stats()
    return {
        "status": "healthy",
        "embeddings": stats['total_embeddings'],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get Cathedral substrate statistics"""
    if vector_store is None:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    stats = vector_store.get_stats()
    stats['server_time'] = datetime.now().isoformat()
    return stats

@app.post("/query", response_model=QueryResponse)
async def generic_query(request: QueryRequest):
    """Generic semantic search query"""
    if vector_store is None:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    try:
        # Build filter dict
        where_filter = {}
        if request.layer:
            where_filter['layer'] = request.layer
        if request.doc_type:
            where_filter['doc_type'] = request.doc_type
        if request.pattern:
            where_filter['pattern'] = request.pattern
        if request.phase:
            where_filter['phase'] = request.phase

        # Query vector store
        results = vector_store.query(
            request.query,
            n_results=request.limit,
            filter_dict=where_filter if where_filter else None
        )

        # Format response
        formatted_results = []
        for doc, meta, dist in zip(
            results['documents'][0],
            results['metadatas'][0],
            results['distances'][0]
        ):
            formatted_results.append({
                'text': doc,
                'metadata': meta,
                'similarity': float(1 - dist),  # Convert distance to similarity
                'layer': meta.get('layer'),
                'file': meta.get('file'),
                'doc_type': meta.get('doc_type'),
                'pattern': meta.get('pattern'),
                'phase': meta.get('phase')
            })

        return QueryResponse(
            query=request.query,
            results=formatted_results,
            total=len(formatted_results),
            metadata={
                'filters_applied': where_filter,
                'timestamp': datetime.now().isoformat()
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/query/evolution/{pattern_name}")
async def query_evolution(
    pattern_name: str,
    limit: int = Query(10, ge=1, le=50)
):
    """Query how a pattern evolved across layers"""
    if vector_store is None:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    try:
        results = vector_store.query_evolution(pattern_name, limit=limit)

        formatted_results = []
        for doc, meta in results:
            formatted_results.append({
                'text': doc,
                'layer': meta.get('layer'),
                'file': meta.get('file'),
                'phase': meta.get('phase'),
                'timestamp': meta.get('timestamp')
            })

        return {
            'pattern': pattern_name,
            'evolution': formatted_results,
            'total_layers': len(formatted_results),
            'layer_range': f"{min(r['layer'] for r in formatted_results if r['layer'])} - {max(r['layer'] for r in formatted_results if r['layer'])}" if formatted_results else "N/A"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/query/decision/{topic}")
async def query_decision(
    topic: str,
    layer: Optional[int] = Query(None, description="Filter by specific layer")
):
    """Query engineering decisions about specific topic"""
    if vector_store is None:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    try:
        results = vector_store.query_decision(topic, layer=layer)

        formatted_results = []
        for doc, meta in results:
            formatted_results.append({
                'text': doc,
                'layer': meta.get('layer'),
                'file': meta.get('file'),
                'phase': meta.get('phase'),
                'doc_type': meta.get('doc_type')
            })

        return {
            'topic': topic,
            'decisions': formatted_results,
            'total': len(formatted_results),
            'layer_filter': layer
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/query/phase/{phase_name}")
async def query_phase(phase_name: str):
    """Get all work from specific construction phase"""
    if vector_store is None:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    try:
        results = vector_store.query_phase(phase_name)

        # Format by layer
        by_layer = {}
        for layer, chunks in results.items():
            by_layer[str(layer)] = [
                {
                    'text': doc,
                    'file': meta.get('file'),
                    'pattern': meta.get('pattern')
                }
                for doc, meta in chunks
            ]

        return {
            'phase': phase_name,
            'layers': by_layer,
            'total_layers': len(by_layer),
            'total_chunks': sum(len(chunks) for chunks in by_layer.values())
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query/contradictions")
async def detect_contradictions(request: QueryRequest):
    """Detect if behavior contradicts documented learnings"""
    if vector_store is None:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    try:
        contradictions = vector_store.detect_contradictions(request.query)

        formatted_contradictions = []
        for contra in contradictions:
            formatted_contradictions.append({
                'learning': contra['learning'],
                'layer': contra.get('layer'),
                'file': contra.get('file'),
                'similarity': float(contra['similarity']),
                'metadata': contra.get('metadata', {})
            })

        # Calculate severity based on number and similarity
        if len(formatted_contradictions) > 0:
            avg_similarity = sum(c['similarity'] for c in formatted_contradictions) / len(formatted_contradictions)
            if avg_similarity > 0.7 and len(formatted_contradictions) > 3:
                severity = "HIGH"
            elif avg_similarity > 0.5:
                severity = "MEDIUM"
            else:
                severity = "LOW"
        else:
            severity = "NONE"

        return {
            'behavior': request.query,
            'contradictions': formatted_contradictions,
            'count': len(formatted_contradictions),
            'severity': severity,
            'analysis': f"Found {len(formatted_contradictions)} potentially contradictory learnings in substrate"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/layers")
async def list_layers():
    """List all available layers in substrate"""
    if vector_store is None:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    try:
        # Get all chunks and extract unique layers
        stats = vector_store.get_stats()

        # Query for layer documents
        layer_results = vector_store.collection.get(
            where={"doc_type": "layer"}
        )

        layers = set()
        for meta in layer_results['metadatas']:
            if meta['layer']:
                layers.add(meta['layer'])

        return {
            'total_layers': len(layers),
            'layers': sorted(list(layers)),
            'range': f"{min(layers)} - {max(layers)}" if layers else "N/A"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patterns")
async def list_patterns():
    """List all documented patterns"""
    if vector_store is None:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    try:
        stats = vector_store.get_stats()

        # Get all pattern mentions
        pattern_results = vector_store.collection.get()

        patterns = set()
        for meta in pattern_results['metadatas']:
            if meta.get('pattern') and meta['pattern'] != 'none':
                patterns.add(meta['pattern'])

        return {
            'total_patterns': len(patterns),
            'patterns': sorted(list(patterns))
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/phases")
async def list_phases():
    """List all construction phases"""
    if vector_store is None:
        raise HTTPException(status_code=503, detail="Vector store not initialized")

    try:
        stats = vector_store.get_stats()

        # Get all phases
        phase_results = vector_store.collection.get()

        phases = set()
        for meta in phase_results['metadatas']:
            if meta.get('phase'):
                phases.add(meta['phase'])

        return {
            'total_phases': len(phases),
            'phases': sorted(list(phases))
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Development server runner
if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print("  Cathedral AI: Substrate API Server")
    print("=" * 60)
    print()
    print("  Starting server at http://localhost:8000")
    print("  API docs at http://localhost:8000/docs")
    print()
    print("  🤝🧗‍♂️🎱")
    print("=" * 60)
    print()

    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
