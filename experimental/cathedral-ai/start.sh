#!/bin/bash
# Cathedral AI: Quick Start Script

echo "=========================================="
echo "  Cathedral AI: Substrate Query System"
echo "=========================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check if corpus exists
if [ ! -f "cathedral_corpus.json" ]; then
    echo ""
    echo "📄 Processing Cathedral corpus..."
    python3 embed_corpus.py
fi

# Check if vector database exists
if [ ! -d "cathedral_vectordb" ]; then
    echo ""
    echo "🔄 Generating embeddings..."
    python3 generate_embeddings.py
fi

# Start API server
echo ""
echo "🚀 Starting Cathedral AI API Server..."
echo ""
python3 api_server.py
