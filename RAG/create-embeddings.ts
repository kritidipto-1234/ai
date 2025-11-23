#!/usr/bin/env node

import { ChromaClient } from 'chromadb';
import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

async function readDataFile(filePath: string): Promise<string[]> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const chunks = content.split('\n\n').map(chunk => chunk.trim()).filter(chunk => chunk);
    console.log(`Successfully read ${chunks.length} chunks from ${filePath}`);
    return chunks;
  } catch (error) {
    console.log(`Error reading file: ${error}`);
    return [];
  }
}

async function createVectorDatabase() {
  const client = new ChromaClient({ path: "http://localhost:8000" });
  const collectionName = "rag_documents";
  
  try {
    try {
      await client.deleteCollection({ name: collectionName });
      console.log("Deleted existing collection");
    } catch {}
    
    const collection = await client.createCollection({
      name: collectionName,
      metadata: { "hnsw:space": "cosine" }
    });
    console.log(`Created/got collection: ${collectionName}`);
    return { client, collection };
  } catch (error) {
    console.log(`Error creating vector database: ${error}`);
    return { client: null, collection: null };
  }
}

async function createEmbeddingsAndStore(chunks: string[], collection: any) {
  if (!chunks.length) {
    console.log("No chunks to process!");
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  console.log("Creating embeddings with Gemini API...");
  const genAI = new GoogleGenAI({apiKey});

  const embeddings = await Promise.all(chunks.map(async chunk => {
    const result = await genAI.models.embedContent({model: "text-embedding-004", contents: [chunk]});
    return result.embeddings?.[0]?.values;
  }));

  const ids = chunks.map((_, i) => `chunk_${i}`);
  const metadatas = chunks.map((chunk, i) => ({ chunk_index: i, text_length: chunk.length }));

  console.log(`Storing ${chunks.length} embeddings in vector database...`);
  
  await collection.add({
    embeddings,
    documents: chunks,
    metadatas,
    ids
  });

  console.log("✅ Successfully stored all embeddings!");
}

async function main() {
  console.log("🚀 Starting RAG embedding creation process...");
  
  const dataFile = "data.txt";
  const chunks = await readDataFile(dataFile);

  if (!chunks.length) {
    console.log("❌ No data to process. Exiting.");
    return;
  }

  const { client, collection } = await createVectorDatabase();
  if (!collection) {
    console.log("❌ Failed to create vector database. Exiting.");
    return;
  }

  await createEmbeddingsAndStore(chunks, collection);

  console.log(`\n🎉 RAG setup complete!`);
  console.log(`📊 Processed ${chunks.length} text chunks`);
  console.log(`💾 Vector database stored in: ./chroma_db`);
  console.log(`🔍 Ready for queries! Run: npm run query 'your question here'`);
}

main().catch(console.error);
