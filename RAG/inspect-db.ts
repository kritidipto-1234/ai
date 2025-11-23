#!/usr/bin/env node

import { ChromaClient, IncludeEnum } from 'chromadb';
import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';

config();

async function inspectChromaDB() {
  const client = new ChromaClient();
  console.log("✅ Connected to ChromaDB");

  const collections = await client.listCollections();
  console.log(`\n📁 Collections in database: ${collections.length}`);
  collections.forEach(collection => {
    console.log(`  - ${collection}`);
  });

  const collection = await client.getCollection({ name: "rag_documents" });
  console.log(`\n🔍 Inspecting collection: rag_documents`);

  const count = await collection.count();
  console.log(`📊 Total documents: ${count}`);

  const results = await collection.get({include:[IncludeEnum.Documents, IncludeEnum.Metadatas, IncludeEnum.Embeddings]});

  console.log(`\n📄 All Documents:`);
  console.log("=".repeat(80));

  results.ids?.forEach((docId, i) => {
    const document = results.documents?.[i];
    const metadata = results.metadatas?.[i];
    const embedding = results.embeddings?.[i];

    console.log(`\n🔖 Document ${i + 1}:`);
    console.log(`   ID: ${docId}`);
    console.log(`   Metadata: ${JSON.stringify(metadata)}`);
    console.log(`   Content: ${document}`);
    console.log(`   Embedding dimension: ${embedding?.length}`);
    console.log(`   Embedding (first 10 values): ${embedding?.slice(0, 10)}`);
    console.log("-".repeat(40));
  });

  console.log(`\n🔍 Testing Similarity Search:`);
  console.log("=".repeat(50));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("❌ GEMINI_API_KEY not found, skipping similarity search");
    return;
  }

  const genAI = new GoogleGenAI({apiKey});

  const testQueries = ["empire weapons", "Tuesday illegal", "cosmic llama", "black holes"];

  for (const query of testQueries) {
    console.log(`\n🔎 Query: '${query}'`);
    const result = await genAI.models.embedContent({ model: "text-embedding-004", contents: [query] });
    const queryEmbedding = result.embeddings?.[0]?.values;

    const searchResults = await collection.query({
      queryEmbeddings: [queryEmbedding as number[]],
      include: [IncludeEnum.Documents, IncludeEnum.Metadatas, IncludeEnum.Embeddings],
      nResults: 2
    });

    console.log(searchResults);
  }
}

async function main() {
  console.log("🔍 ChromaDB Inspector");
  console.log("=".repeat(50));

  await inspectChromaDB();
}

main().catch(console.error);
