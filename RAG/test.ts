#!/usr/bin/env node

import { ChromaClient } from 'chromadb';
import { GoogleGenAI } from '@google/genai';
// import { config } from 'dotenv';

// config();

const documents = [
  "jack is 5 feet tall",
  "jill is less than 4 feet tall", 
  "jessie is 6 feet tall"
];

const query = "Tell me about tallest people";

async function mainWithExternalEmbedding() {
  const chromaClient = new ChromaClient({path: "http://localhost:8000"});

  try {
    await chromaClient.deleteCollection({ name: "my_collection" });
    console.log("Deleted existing collection");
  } catch {}

  const collection = await chromaClient.createCollection({
    name: "my_collection",
    metadata: { "hnsw:space": "cosine" }
  });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const genAI = new GoogleGenAI({apiKey});

  const documentEmbeddings = await Promise.all(documents.map(async (doc) => {
    const result = await genAI.models.embedContent({model: "text-embedding-004", contents: [doc]});
    return result.embeddings?.[0]?.values;
  }));

  await collection.add({
    embeddings: documentEmbeddings as number[][],
    documents,
    ids: ["id1", "id2", "id3"]
  });

  const queryResult = await genAI.models.embedContent({model: "text-embedding-004", contents: [query]});
  const queryEmbedding = queryResult.embeddings?.[0]?.values;

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding as number[]],
    nResults: 2
  });

  console.log(results.documents?.[0]?.[0]);
}

async function main() {
  const chromaClient = new ChromaClient({path: "http://localhost:8000"});

  try {
    await chromaClient.deleteCollection({ name: "my_collection" });
    console.log("Deleted existing collection");
  } catch {}

  const collection = await chromaClient.createCollection({
    name: "my_collection",
    metadata: { "hnsw:space": "cosine" }
  });

  await collection.add({
    documents,
    ids: ["id1", "id2", "id3"]
  });

  const results = await collection.query({
    queryTexts: [query],
    nResults: 2
  });

  console.log(results.documents?.[0]?.[0]);
}

mainWithExternalEmbedding().catch(console.error);
