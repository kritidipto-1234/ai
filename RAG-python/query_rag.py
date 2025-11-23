#!/usr/bin/env python3
"""
Script to query the RAG system using command line input and Gemini API.
Usage: python query_rag.py "your question here"
"""

import os
import sys
import argparse
import chromadb
from sentence_transformers import SentenceTransformer
import google.generativeai as gemini
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class RAGQuerySystem:
    def __init__(self):
        self.client = None
        self.collection = None
        self.embedding_model = None
        self.gemini_model = None
        self.setup_components()
    
    def setup_components(self):
        """Initialize all components of the RAG system."""
        # Setup ChromaDB
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.client.get_collection("rag_documents")
        print("✅ Connected to vector database")
        
        # Setup embedding model (same as used for creation)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Loaded embedding model")
        
        # Setup Gemini API
        api_key = os.getenv('GEMINI_API_KEY')
        
        gemini.configure(api_key=api_key)
        self.gemini_model = gemini.GenerativeModel('gemini-1.5-flash')
        print("✅ Connected to Gemini API")
    
    def retrieve_relevant_context(self, query: str, n_results: int = 3) -> str:
        """Retrieve relevant context from vector database."""
        # Create embedding for the query
        query_embedding = self.embedding_model.encode([query])
        
        # Search in ChromaDB
        results = self.collection.query(
            query_embeddings=query_embedding.tolist(),
            n_results=n_results
        )
        
        # Extract and combine relevant documents
        documents = results['documents'][0] if results['documents'] else []
        
        # Combine documents with separators
        context = "\n\n---\n\n".join(documents)
        return context
        

    
    def generate_answer(self, query: str, context: str) -> str:
        """Generate answer using Gemini API with retrieved context."""
        prompt = f"""Based on the following context, please answer the question. If the context doesn't contain relevant information to answer the question, please say so.

        Context:
        {context}

        Question: {query}

        Answer:"""
                    
        response = self.gemini_model.generate_content(prompt)
        return response.text

    
    def query(self, question: str):
        """Main query method that retrieves context and generates answer."""
        print(f"🔍 Query: {question}")
        print("\n" + "="*50)
        
        # Retrieve relevant context
        print("📚 Retrieving relevant context...")
        context = self.retrieve_relevant_context(question)
        
        print(f"📄 Retrieved Context:")
        print("-" * 30)
        print(context)
        print("-" * 30)
        
        # Generate answer using Gemini
        print("\n🤖 Generating answer with Gemini...")
        answer = self.generate_answer(question, context)
        
        print(f"\n💬 Answer:")
        print("=" * 50)
        print(answer)
        print("=" * 50)

def main():
    rag = RAGQuerySystem()
    
    # Process query
    rag.query("What is the moon made of")

if __name__ == "__main__":
    main() 