#!/usr/bin/env python3
"""
Script to create embeddings from data.txt and store them in a local vector database (ChromaDB).
"""

import os
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List
import re
# from google import genai

def read_data_file(file_path: str) -> List[str]:
    """Read and split the data file into chunks."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Split by double newlines to get paragraphs, then filter empty ones
        chunks = [chunk.strip() for chunk in content.split('\n\n') if chunk.strip()]
        
        print(f"Successfully read {len(chunks)} chunks from {file_path}")
        return chunks
    
    except FileNotFoundError:
        print(f"Error: File {file_path} not found!")
        return []
    except Exception as e:
        print(f"Error reading file: {e}")
        return []

def create_vector_database(): 
    """Initialize ChromaDB client and create collection."""
    # Create persistent client (stores data locally)
    client = chromadb.PersistentClient(path="./chroma_db")
    
    # Create or get collection
    collection_name = "rag_documents"
    try:
        # Try to delete existing collection to start fresh
        try:
            client.delete_collection(collection_name)
            print("Deleted existing collection")
        except:
            pass  # Collection doesn't exist, that's fine
        
        collection = client.create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}  # Use cosine similarity
        )
        print(f"Created new collection: {collection_name}")
        return client, collection
    
    except Exception as e:
        print(f"Error creating vector database: {e}")
        return None, None

def create_embeddings_and_store(chunks: List[str], collection):
    """Create embeddings using SentenceTransformer and store in ChromaDB."""
    if not chunks:
        print("No chunks to process!")
        return
    
    print("Loading SentenceTransformer model...")
    # Use a good general-purpose embedding model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    print("Creating embeddings...")
    embeddings = model.encode(chunks)
    print(embeddings)
    # Prepare data for ChromaDB
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"chunk_index": i, "text_length": len(chunk)} for i, chunk in enumerate(chunks)]
    
    print(f"Storing {len(chunks)} embeddings in vector database...")
    
    # Add to collection
    collection.add(
        embeddings=embeddings.tolist(),
        documents=chunks,
        metadatas=metadatas,
        ids=ids
    )
    
    print("✅ Successfully stored all embeddings!")

def main():
    print("🚀 Starting RAG embedding creation process...")
    
    # Read the data file
    data_file = "data.txt"
    chunks = read_data_file(data_file)

    if not chunks:
        print("❌ No data to process. Exiting.")
        return
    
    # Create vector database
    client, collection = create_vector_database()
    if not collection:
        print("❌ Failed to create vector database. Exiting.")
        return
    
    # Create and store embeddings
    create_embeddings_and_store(chunks, collection)
    
    print(f"\n🎉 RAG setup complete!")
    print(f"📊 Processed {len(chunks)} text chunks")
    print(f"💾 Vector database stored in: ./chroma_db")
    print(f"🔍 Ready for queries! Run: python query_rag.py 'your question here'")

if __name__ == "__main__":
    main() 