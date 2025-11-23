#!/usr/bin/env python3
"""
Script to inspect the ChromaDB vector database and view stored chunks.
Usage: python inspect_db.py
"""

import chromadb
import numpy as np
from sentence_transformers import SentenceTransformer

def inspect_chromadb():
    """Inspect the ChromaDB database and show all stored information."""
    # Connect to the database
    client = chromadb.PersistentClient(path="./chroma_db")
    print("✅ Connected to ChromaDB")
    
    # List all collections
    collections = client.list_collections()
    print(f"\n📁 Collections in database: {len(collections)}")
    for collection in collections:
        print(f"  - {collection.name}")
    
    # Get the main collection
    collection = client.get_collection("rag_documents")
    print(f"\n🔍 Inspecting collection: rag_documents")
    
    # Get collection info
    count = collection.count()
    print(f"📊 Total documents: {count}")

    # Get all documents
    results = collection.get(include=['documents', 'metadatas', 'embeddings'])
    
    print(f"\n📄 All Documents:")
    print("=" * 80)
    
    for i, (doc_id, document, metadata,embedding) in enumerate(zip(
        results['ids'], 
        results['documents'], 
        results['metadatas'],
        results['embeddings']
    )):
        print(f"\n🔖 Document {i+1}:")
        print(f"   ID: {doc_id}")
        print(f"   Metadata: {metadata}")
        print(f"   Content: {document}")
        print(f"   Embedding dimension: {len(embedding)}")
        print(f"   Embedding (first 10 values): {embedding[:10]}")
        print("-" * 40)

    # Test similarity search
    print(f"\n🔍 Testing Similarity Search:")
    print("=" * 50)
    
    # Load the same model used for embeddings
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Test queries
    test_queries = [
        "empire weapons",
        "Tuesday illegal",
        "cosmic llama",
        "black holes"
    ]
    
    for query in test_queries:
        print(f"\n🔎 Query: '{query}'")
        query_embedding = model.encode([query])
        
        search_results = collection.query(
            query_embeddings=query_embedding.tolist(),
            n_results=2
        )
        
        print(search_results)
    

if __name__ == "__main__":
    print("🔍 ChromaDB Inspector")
    print("=" * 50)
    
    inspect_chromadb() 