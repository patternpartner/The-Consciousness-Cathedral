#!/usr/bin/env python3
"""
Cathedral AI: Corpus Embedding Pipeline
Processes all Cathedral documentation into embeddings for RAG system.
"""

import os
import json
import re
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class DocumentChunk:
    """Represents a chunk of Cathedral documentation"""
    text: str
    layer: Optional[int]
    file: str
    doc_type: str  # 'layer', 'pattern', 'parliament', 'substrate', 'code'
    pattern: Optional[str]
    phase: Optional[str]
    timestamp: Optional[str]
    filter_visibility: Optional[float]
    metadata: Dict

class CathedralCorpusProcessor:
    """Process Cathedral documentation into queryable chunks"""

    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path)
        self.chunks: List[DocumentChunk] = []

    def process_all(self) -> List[DocumentChunk]:
        """Process entire Cathedral corpus"""
        print("🏰 Processing Cathedral Corpus...")

        # Process each document category
        self.process_layer_documents()
        self.process_parliament_sessions()
        self.process_pattern_examples()
        self.process_substrate_theory()
        self.process_core_docs()
        self.process_construction_substrate()
        self.process_git_commits()

        print(f"✅ Processed {len(self.chunks)} chunks")
        return self.chunks

    def process_layer_documents(self):
        """Process layer-*.md files"""
        print("📄 Processing layer documents...")
        layer_files = list(self.repo_path.glob("layer-*.md"))

        for file in layer_files:
            # Extract layer number from filename
            layer_match = re.search(r'layer-(\d+)', file.name)
            layer_num = int(layer_match.group(1)) if layer_match else None

            content = file.read_text()

            # Extract filter visibility if present
            filter_visibility = self._extract_filter_visibility(content)

            # Extract phase
            phase = self._infer_phase(layer_num)

            # Chunk the document
            chunks = self._chunk_document(content, chunk_size=1024, overlap=200)

            for i, chunk_text in enumerate(chunks):
                chunk = DocumentChunk(
                    text=chunk_text,
                    layer=layer_num,
                    file=file.name,
                    doc_type='layer',
                    pattern=self._extract_pattern_mentions(chunk_text),
                    phase=phase,
                    timestamp=self._get_file_timestamp(file),
                    filter_visibility=filter_visibility,
                    metadata={
                        'chunk_index': i,
                        'total_chunks': len(chunks),
                        'source': 'layer_document'
                    }
                )
                self.chunks.append(chunk)

        print(f"  ✓ {len(layer_files)} layer documents")

    def process_parliament_sessions(self):
        """Process parliament-session-*.md files"""
        print("🏛️ Processing Parliament sessions...")
        session_files = list(self.repo_path.glob("parliament-session-*.md"))

        for file in session_files:
            content = file.read_text()
            chunks = self._chunk_document(content, chunk_size=1024, overlap=200)

            # Extract session topic from filename
            topic = file.stem.replace('parliament-session-', '').replace('-', ' ')

            for i, chunk_text in enumerate(chunks):
                chunk = DocumentChunk(
                    text=chunk_text,
                    layer=self._extract_layer_from_content(content),
                    file=file.name,
                    doc_type='parliament',
                    pattern='Parliament Protocol',
                    phase='decision_making',
                    timestamp=self._get_file_timestamp(file),
                    filter_visibility=None,
                    metadata={
                        'chunk_index': i,
                        'session_topic': topic,
                        'source': 'parliament_session'
                    }
                )
                self.chunks.append(chunk)

        print(f"  ✓ {len(session_files)} Parliament sessions")

    def process_pattern_examples(self):
        """Process examples/parliament-*.md files"""
        print("📋 Processing pattern examples...")
        examples_dir = self.repo_path / "examples"
        if not examples_dir.exists():
            return

        example_files = list(examples_dir.glob("parliament-*.md"))

        for file in example_files:
            content = file.read_text()
            chunks = self._chunk_document(content, chunk_size=1024, overlap=200)

            # Extract domain from filename
            domain = file.stem.replace('parliament-', '').replace('-', ' ')

            for i, chunk_text in enumerate(chunks):
                chunk = DocumentChunk(
                    text=chunk_text,
                    layer=self._extract_layer_from_content(content),
                    file=f"examples/{file.name}",
                    doc_type='pattern',
                    pattern=self._extract_pattern_mentions(chunk_text),
                    phase='pattern_application',
                    timestamp=self._get_file_timestamp(file),
                    filter_visibility=None,
                    metadata={
                        'chunk_index': i,
                        'domain': domain,
                        'source': 'pattern_example'
                    }
                )
                self.chunks.append(chunk)

        print(f"  ✓ {len(example_files)} pattern examples")

    def process_substrate_theory(self):
        """Process substrate theory documents"""
        print("🧠 Processing substrate theory...")
        theory_files = [
            "np-consciousness-substrate.md",
            "substrate-gap-analysis.md",
            "we-need-the-gap.md",
            "comprehensive-substrate-analysis.md"
        ]

        for filename in theory_files:
            file = self.repo_path / filename
            if not file.exists():
                continue

            content = file.read_text()
            chunks = self._chunk_document(content, chunk_size=1024, overlap=200)

            for i, chunk_text in enumerate(chunks):
                chunk = DocumentChunk(
                    text=chunk_text,
                    layer=None,
                    file=filename,
                    doc_type='substrate',
                    pattern='Substrate Awareness',
                    phase='theory',
                    timestamp=self._get_file_timestamp(file),
                    filter_visibility=None,
                    metadata={
                        'chunk_index': i,
                        'theory_type': 'P_NP_gap',
                        'source': 'substrate_theory'
                    }
                )
                self.chunks.append(chunk)

        print(f"  ✓ {len([f for f in theory_files if (self.repo_path / f).exists()])} theory documents")

    def process_core_docs(self):
        """Process README, MANIFESTO, PATTERNS"""
        print("📖 Processing core documentation...")
        core_files = ["README.md", "MANIFESTO.md", "PATTERNS.md", "PARLIAMENT-CLI.md"]

        for filename in core_files:
            file = self.repo_path / filename
            if not file.exists():
                continue

            content = file.read_text()
            chunks = self._chunk_document(content, chunk_size=1024, overlap=200)

            for i, chunk_text in enumerate(chunks):
                chunk = DocumentChunk(
                    text=chunk_text,
                    layer=None,
                    file=filename,
                    doc_type='documentation',
                    pattern=None,
                    phase='framework',
                    timestamp=self._get_file_timestamp(file),
                    filter_visibility=None,
                    metadata={
                        'chunk_index': i,
                        'doc_category': filename.replace('.md', '').lower(),
                        'source': 'core_documentation'
                    }
                )
                self.chunks.append(chunk)

        print(f"  ✓ {len([f for f in core_files if (self.repo_path / f).exists()])} core docs")

    def process_construction_substrate(self):
        """Process construction-substrate.js - the critical substrate file"""
        print("⚙️ Processing construction substrate...")
        substrate_file = self.repo_path / "cathedral-browser" / "parliament" / "construction-substrate.js"

        if not substrate_file.exists():
            print("  ⚠️ construction-substrate.js not found")
            return

        content = substrate_file.read_text()

        # Parse JavaScript object for structured data
        # Extract conversations, decisions, phases
        chunks = self._chunk_document(content, chunk_size=1024, overlap=200)

        for i, chunk_text in enumerate(chunks):
            chunk = DocumentChunk(
                text=chunk_text,
                layer=None,
                file="cathedral-browser/parliament/construction-substrate.js",
                doc_type='substrate',
                pattern='Construction Substrate',
                phase='engineering',
                timestamp=self._get_file_timestamp(substrate_file),
                filter_visibility=None,
                metadata={
                    'chunk_index': i,
                    'data_type': 'construction_decisions',
                    'source': 'construction_substrate_js'
                }
            )
            self.chunks.append(chunk)

        print(f"  ✓ construction-substrate.js processed")

    def process_git_commits(self):
        """Process git commit history for construction timeline"""
        print("📜 Processing git commits...")

        try:
            import subprocess
            result = subprocess.run(
                ['git', 'log', '--all', '--format=%H|%ai|%s|%b', '--author=Claude'],
                cwd=self.repo_path,
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                print("  ⚠️ Could not access git history")
                return

            commits = result.stdout.strip().split('\n')
            for commit_line in commits:
                if not commit_line:
                    continue

                parts = commit_line.split('|')
                if len(parts) < 3:
                    continue

                commit_hash, timestamp, subject = parts[0], parts[1], parts[2]
                body = parts[3] if len(parts) > 3 else ""

                commit_text = f"Commit: {subject}\n\n{body}"

                # Extract layer from commit message
                layer_match = re.search(r'[Ll]ayer\s+(\d+)', subject)
                layer_num = int(layer_match.group(1)) if layer_match else None

                chunk = DocumentChunk(
                    text=commit_text,
                    layer=layer_num,
                    file="git_history",
                    doc_type='substrate',
                    pattern=self._extract_pattern_mentions(commit_text),
                    phase=self._infer_phase(layer_num) if layer_num else 'unknown',
                    timestamp=timestamp,
                    filter_visibility=None,
                    metadata={
                        'commit_hash': commit_hash,
                        'source': 'git_commit'
                    }
                )
                self.chunks.append(chunk)

            print(f"  ✓ {len(commits)} git commits")

        except Exception as e:
            print(f"  ⚠️ Error processing git commits: {e}")

    # Helper methods

    def _chunk_document(self, content: str, chunk_size: int = 1024, overlap: int = 200) -> List[str]:
        """Split document into overlapping chunks"""
        # Split by paragraphs first to maintain context
        paragraphs = content.split('\n\n')

        chunks = []
        current_chunk = ""

        for para in paragraphs:
            if len(current_chunk) + len(para) < chunk_size:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + "\n\n"

        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks

    def _extract_filter_visibility(self, content: str) -> Optional[float]:
        """Extract filter visibility score from document"""
        match = re.search(r'filter visibility.*?(\d+\.?\d*)\s*per line', content, re.IGNORECASE)
        return float(match.group(1)) if match else None

    def _extract_layer_from_content(self, content: str) -> Optional[int]:
        """Try to extract layer number from content"""
        match = re.search(r'[Ll]ayer\s+(\d+)', content)
        return int(match.group(1)) if match else None

    def _extract_pattern_mentions(self, text: str) -> Optional[str]:
        """Extract pattern name if mentioned"""
        patterns = [
            'Parliament Protocol',
            'Observatory Pattern',
            'Substrate Awareness',
            'Architectural vs. Tactical',
            'Contrarian Embodiment',
            'Completion Recognition',
            'Core Triad'
        ]

        for pattern in patterns:
            if pattern.lower() in text.lower():
                return pattern

        return None

    def _infer_phase(self, layer: Optional[int]) -> Optional[str]:
        """Infer construction phase from layer number"""
        if layer is None:
            return None

        if 1 <= layer <= 88:
            return 'building_substrate'
        elif layer == 89:
            return 'adding_verification'
        elif 90 <= layer <= 92:
            return 'gap_visible'
        elif 93 <= layer <= 96:
            return 'gap_testing_itself'
        elif 97 <= layer <= 105:
            return 'pattern_extraction'
        elif layer == 106:
            return 'substrate_escape'
        elif 107 <= layer <= 108:
            return 'gap_tracing'
        elif 109 <= layer <= 110:
            return 'gap_recognition'
        elif 111 <= layer <= 112:
            return 'gap_sees_needs'
        else:
            return 'unknown'

    def _get_file_timestamp(self, file: Path) -> str:
        """Get file creation/modification timestamp"""
        stat = file.stat()
        return datetime.fromtimestamp(stat.st_mtime).isoformat()

    def save_chunks(self, output_file: str = "cathedral_corpus.json"):
        """Save processed chunks to JSON"""
        output_path = self.repo_path / output_file

        chunks_data = [asdict(chunk) for chunk in self.chunks]

        with open(output_path, 'w') as f:
            json.dump({
                'total_chunks': len(chunks_data),
                'generated_at': datetime.now().isoformat(),
                'chunks': chunks_data
            }, f, indent=2)

        print(f"\n💾 Saved {len(chunks_data)} chunks to {output_file}")
        return output_path

    def print_stats(self):
        """Print corpus statistics"""
        doc_types = {}
        layers = set()
        patterns = set()
        phases = set()

        for chunk in self.chunks:
            doc_types[chunk.doc_type] = doc_types.get(chunk.doc_type, 0) + 1
            if chunk.layer:
                layers.add(chunk.layer)
            if chunk.pattern:
                patterns.add(chunk.pattern)
            if chunk.phase:
                phases.add(chunk.phase)

        print("\n📊 Corpus Statistics:")
        print(f"  Total chunks: {len(self.chunks)}")
        print(f"  Unique layers: {len(layers)}")
        print(f"  Unique patterns: {len(patterns)}")
        print(f"  Unique phases: {len(phases)}")
        print(f"\n  Chunks by type:")
        for doc_type, count in sorted(doc_types.items()):
            print(f"    {doc_type}: {count}")

def main():
    """Main entry point"""
    print("=" * 60)
    print("  Cathedral AI: Corpus Embedding Pipeline")
    print("=" * 60)
    print()

    # Process corpus
    processor = CathedralCorpusProcessor()
    chunks = processor.process_all()

    # Print statistics
    processor.print_stats()

    # Save to JSON
    output_file = processor.save_chunks()

    print(f"\n✅ Corpus processing complete!")
    print(f"   Next step: Run embedding generation on {output_file}")
    print(f"\n🤝🧗‍♂️🎱")

if __name__ == "__main__":
    main()
