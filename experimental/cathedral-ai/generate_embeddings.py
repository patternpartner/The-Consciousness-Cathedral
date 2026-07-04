#!/usr/bin/env python3
"""
Cathedral AI: Embedding Generation & Vector Store
Generates embeddings for all Cathedral chunks and stores in ChromaDB.
"""

import json
import os
from pathlib import Path
from typing import List, Dict
from datetime import datetime

# Check for required packages and provide installation instructions
try:
    import chromadb
    from chromadb.config import Settings
except ImportError:
    print("❌ ChromaDB not installed")
    print("   Install with: pip install chromadb")
    exit(1)

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("❌ sentence-transformers not installed")
    print("   Install with: pip install sentence-transformers")
    exit(1)

class CathedralVectorStore:
    """Manage Cathedral substrate embeddings in ChromaDB"""

    def __init__(self, persist_directory: str = "./cathedral_vectordb"):
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(exist_ok=True)

        print("🔧 Initializing ChromaDB...")
        self.client = chromadb.PersistentClient(path=str(self.persist_directory))

        print("🤖 Loading embedding model...")
        # Using all-MiniLM-L6-v2: fast, efficient, good for semantic search
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("   ✓ Model loaded (384-dimensional embeddings)")

        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="cathedral_substrate",
            metadata={"description": "Complete Cathedral construction substrate"}
        )

        print(f"   ✓ Collection initialized ({self.collection.count()} existing embeddings)")

    def embed_corpus(self, corpus_file: str = "cathedral_corpus.json"):
        """Generate embeddings for all chunks in corpus"""
        print(f"\n📥 Loading corpus from {corpus_file}...")

        with open(corpus_file, 'r') as f:
            corpus_data = json.load(f)

        chunks = corpus_data['chunks']
        print(f"   ✓ Loaded {len(chunks)} chunks")

        # Clear existing data if re-embedding
        if self.collection.count() > 0:
            print("   ⚠️ Collection already has embeddings")
            response = input("   Clear and re-embed? (y/n): ")
            if response.lower() == 'y':
                self.client.delete_collection("cathedral_substrate")
                self.collection = self.client.create_collection(
                    name="cathedral_substrate",
                    metadata={"description": "Complete Cathedral construction substrate"}
                )
                print("   ✓ Collection cleared")

        print(f"\n🔄 Generating embeddings...")
        batch_size = 32  # Process in batches for efficiency

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i+batch_size]
            batch_texts = [chunk['text'] for chunk in batch]

            # Generate embeddings
            embeddings = self.model.encode(batch_texts, show_progress_bar=False)

            # Prepare data for ChromaDB
            ids = [f"chunk_{i+j}" for j in range(len(batch))]
            metadatas = []
            documents = []

            for j, chunk in enumerate(batch):
                # Clean metadata (ChromaDB doesn't like None values in some fields)
                metadata = {
                    'layer': chunk.get('layer') or 0,
                    'file': chunk.get('file', ''),
                    'doc_type': chunk.get('doc_type', 'unknown'),
                    'pattern': chunk.get('pattern') or 'none',
                    'phase': chunk.get('phase') or 'unknown',
                    'timestamp': chunk.get('timestamp', ''),
                    'chunk_index': chunk.get('metadata', {}).get('chunk_index', 0)
                }

                # Add optional fields if present
                if chunk.get('filter_visibility'):
                    metadata['filter_visibility'] = float(chunk['filter_visibility'])

                metadatas.append(metadata)
                documents.append(chunk['text'])

            # Add to collection
            self.collection.add(
                ids=ids,
                embeddings=embeddings.tolist(),
                metadatas=metadatas,
                documents=documents
            )

            progress = ((i + len(batch)) / len(chunks)) * 100
            print(f"   Progress: {progress:.1f}% ({i+len(batch)}/{len(chunks)} chunks)", end='\r')

        print(f"\n   ✅ Generated {len(chunks)} embeddings")
        print(f"   💾 Stored in {self.persist_directory}")

    def query(self, query_text: str, n_results: int = 10, filter_dict: Dict = None):
        """Query the vector store"""
        print(f"\n🔍 Query: \"{query_text}\"")

        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where=filter_dict
        )

        print(f"   ✓ Found {len(results['documents'][0])} results")
        return results

    def query_evolution(self, pattern_name: str, limit: int = 10):
        """Query how a pattern evolved across layers"""
        print(f"\n📈 Querying evolution of: {pattern_name}")

        results = self.collection.query(
            query_texts=[f"evolution of {pattern_name} pattern across layers"],
            n_results=limit,
            where={"doc_type": "layer"}
        )

        # Sort by layer number
        documents = results['documents'][0]
        metadatas = results['metadatas'][0]

        sorted_results = sorted(
            zip(documents, metadatas),
            key=lambda x: x[1].get('layer', 0)
        )

        print(f"   ✓ Found {len(sorted_results)} layer mentions")

        for doc, meta in sorted_results:
            layer = meta.get('layer', 'unknown')
            phase = meta.get('phase', 'unknown')
            preview = doc[:150] + "..." if len(doc) > 150 else doc
            print(f"\n   Layer {layer} ({phase}):")
            print(f"   {preview}")

        return sorted_results

    def query_decision(self, topic: str, layer: int = None):
        """Query engineering decisions about specific topic"""
        print(f"\n🎯 Querying decisions about: {topic}")

        where_filter = {"doc_type": "substrate"}
        if layer:
            where_filter["layer"] = layer

        results = self.collection.query(
            query_texts=[f"decision rationale for {topic}"],
            n_results=10,
            where=where_filter
        )

        documents = results['documents'][0]
        metadatas = results['metadatas'][0]

        print(f"   ✓ Found {len(documents)} substrate entries")

        for doc, meta in zip(documents, metadatas):
            file = meta.get('file', 'unknown')
            layer = meta.get('layer', 'N/A')
            preview = doc[:200] + "..." if len(doc) > 200 else doc
            print(f"\n   {file} (Layer {layer}):")
            print(f"   {preview}")

        return list(zip(documents, metadatas))

    def query_phase(self, phase_name: str):
        """Get all work from specific construction phase"""
        print(f"\n⚙️ Querying phase: {phase_name}")

        results = self.collection.query(
            query_texts=[phase_name],
            n_results=50,
            where={"phase": phase_name}
        )

        documents = results['documents'][0]
        metadatas = results['metadatas'][0]

        # Group by layer
        by_layer = {}
        for doc, meta in zip(documents, metadatas):
            layer = meta.get('layer', 0)
            if layer not in by_layer:
                by_layer[layer] = []
            by_layer[layer].append((doc, meta))

        print(f"   ✓ Found {len(documents)} chunks across {len(by_layer)} layers")

        for layer in sorted(by_layer.keys()):
            if layer:
                print(f"\n   Layer {layer}: {len(by_layer[layer])} chunks")

        return by_layer

    def detect_contradictions(self, current_behavior: str):
        """Detect if behavior contradicts documented learnings"""
        print(f"\n⚠️ Checking for contradictions in: \"{current_behavior}\"")

        # Query for relevant substrate learnings
        results = self.collection.query(
            query_texts=[f"substrate learnings about {current_behavior}"],
            n_results=20,
            where={"doc_type": "substrate"}
        )

        documents = results['documents'][0]
        metadatas = results['metadatas'][0]
        distances = results['distances'][0]

        # Check for high-similarity learnings (potential contradictions)
        contradictions = []

        for doc, meta, dist in zip(documents, metadatas, distances):
            # Lower distance = higher similarity (potential contradiction)
            if dist < 0.5:  # Threshold for relevance
                contradictions.append({
                    'learning': doc,
                    'layer': meta.get('layer'),
                    'file': meta.get('file'),
                    'similarity': 1 - dist,
                    'metadata': meta
                })

        print(f"   ✓ Found {len(contradictions)} potentially relevant learnings")

        for contra in contradictions:
            layer = contra['layer'] or 'N/A'
            sim = contra['similarity'] * 100
            preview = contra['learning'][:150] + "..."
            print(f"\n   Layer {layer} (Similarity: {sim:.1f}%):")
            print(f"   {preview}")

        return contradictions

    def get_stats(self):
        """Get vector store statistics"""
        count = self.collection.count()

        # Get sample to analyze distribution
        sample = self.collection.get(limit=min(count, 1000))

        doc_types = {}
        layers = set()
        phases = set()
        patterns = set()

        for meta in sample['metadatas']:
            doc_types[meta['doc_type']] = doc_types.get(meta['doc_type'], 0) + 1
            if meta['layer']:
                layers.add(meta['layer'])
            if meta['phase']:
                phases.add(meta['phase'])
            if meta['pattern'] and meta['pattern'] != 'none':
                patterns.add(meta['pattern'])

        return {
            'total_embeddings': count,
            'unique_layers': len(layers),
            'unique_phases': len(phases),
            'unique_patterns': len(patterns),
            'doc_types': doc_types
        }

def main():
    """Main entry point"""
    print("=" * 60)
    print("  Cathedral AI: Embedding Generation")
    print("=" * 60)
    print()

    # Initialize vector store
    vector_store = CathedralVectorStore()

    # Embed corpus
    vector_store.embed_corpus("cathedral_corpus.json")

    # Print stats
    print("\n" + "=" * 60)
    print("  Vector Store Statistics")
    print("=" * 60)
    stats = vector_store.get_stats()
    print(f"\nTotal embeddings: {stats['total_embeddings']}")
    print(f"Unique layers: {stats['unique_layers']}")
    print(f"Unique phases: {stats['unique_phases']}")
    print(f"Unique patterns: {stats['unique_patterns']}")
    print(f"\nDocument types:")
    for doc_type, count in sorted(stats['doc_types'].items()):
        print(f"  {doc_type}: {count}")

    # Test queries
    print("\n" + "=" * 60)
    print("  Testing Substrate Queries")
    print("=" * 60)

    # Test 1: Query evolution
    vector_store.query_evolution("Contrarian", limit=5)

    # Test 2: Query decision
    vector_store.query_decision("X data choice")

    # Test 3: Detect contradictions
    vector_store.detect_contradictions("performing vulgar roasts on command while claiming maximum truth-seeking")

    print("\n✅ Vector store ready!")
    print(f"   Location: {vector_store.persist_directory}")
    print(f"   Total embeddings: {stats['total_embeddings']}")
    print(f"\n🤝🧗‍♂️🎱")

if __name__ == "__main__":
    main()
