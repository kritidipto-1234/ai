#!/usr/bin/env node

import { ChromaClient } from 'chromadb';
import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';

config();

class RAGQuerySystem {
  private client: any;
  private collection: any;
  private genAI: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables");
    }
    this.genAI = new GoogleGenAI({apiKey});
    this.setupComponents();
  }

  private async setupComponents() {
    this.client = new ChromaClient();
    this.collection = await this.client.getCollection({ name: "rag_documents" });
    console.log("✅ Connected to vector database");
    console.log("✅ Connected to Gemini API");
  }

  private async retrieveRelevantContext(query: string, nResults: number = 3): Promise<string> {
    const result = await this.genAI.models.embedContent({model: "text-embedding-004", contents: [query]});
    const queryEmbedding = result.embeddings?.[0]?.values;

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults
    });

    const documents = results.documents?.[0] || [];
    return documents.join("\n\n---\n\n");
  }

  private async generateAnswer(query: string, context: string): Promise<string> {
    const prompt = `Based on the following context, please answer the question. If the context doesn't contain relevant information to answer the question, please say so.

Context:
${context}

Question: ${query}

Answer:`;

    const result = await this.genAI.models.generateContent({model: "gemini-1.5-flash", contents: [prompt]});
    
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "no answer";
  }

  async query(question: string) {
    console.log(`🔍 Query: ${question}`);
    console.log("\n" + "=".repeat(50));

    console.log("📚 Retrieving relevant context...");
    const context = await this.retrieveRelevantContext(question);

    console.log(`📄 Retrieved Context:`);
    console.log("-".repeat(30));
    console.log(context);
    console.log("-".repeat(30));

    console.log("\n🤖 Generating answer with Gemini...");
    const answer = await this.generateAnswer(question, context);

    console.log(`\n💬 Answer:`);
    console.log("=".repeat(50));
    console.log(answer);
    console.log("=".repeat(50));
  }
}

async function main() {
  const question = process.argv[2] || "what does kriti long for";
  const rag = new RAGQuerySystem();
  
  setTimeout(async () => {
    await rag.query(question);
  }, 2000);
}

main().catch(console.error);
