# RAG System with Local Vector Database and Gemini API

This project implements a Retrieval-Augmented Generation (RAG) system that:
1. Creates embeddings from `data.txt` and stores them in a local vector database (ChromaDB)
2. Accepts queries from command line and retrieves relevant context
3. Uses Google's Gemini API to generate answers based on the retrieved context

## Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 3. Set Environment Variables
Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

Alternatively, export it directly:
```bash
export GEMINI_API_KEY='your_actual_api_key_here'
```

## Usage

### Step 1: Create Embeddings
First, run the embedding creation script to process `data.txt`:

```bash
pnpm create-embeddings
```

This will:
- Read and chunk the content from `data.txt`
- Create embeddings using Google's Gemini text-embedding-004 model
- Store embeddings in a local ChromaDB database (`./chroma_db/`)

### Step 2: Query the System
Once embeddings are created, you can query the system:

```bash
pnpm query "What happened to the Zorblaxian Empire?"
```

```bash
pnpm query "Tell me about the Great Cosmic Llama"
```

```bash
pnpm query "What are black holes according to this data?"
```

## How It Works

1. **Embedding Creation** (`create-embeddings.ts`):
   - Reads `data.txt` and splits it into meaningful chunks
   - Uses Google's Gemini `text-embedding-004` model to create embeddings
   - Stores embeddings in ChromaDB with metadata

2. **Query Processing** (`query-rag.ts`):
   - Takes user query from command line
   - Creates embedding for the query
   - Searches ChromaDB for most similar chunks
   - Sends query + retrieved context to Gemini API
   - Returns AI-generated answer based on your data

## Files Structure

```
RAG/
├── src/
│   ├── create-embeddings.ts    # Script to create and store embeddings
│   ├── query-rag.ts           # Script to query the RAG system
│   ├── inspect-db.ts          # Script to inspect the database
│   └── test.ts                # Test script
├── dist/                      # Compiled JavaScript files
├── data.txt                   # Your source data
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── .env                      # Your environment variables (create this)
├── README.md                 # This file
└── chroma_db/                # Local vector database (created automatically)
```

## Scripts

- `pnpm create-embeddings` - Create embeddings from data.txt
- `pnpm query "question"` - Query the RAG system
- `pnpm inspect` - Inspect the database contents
- `pnpm test` - Run test script

## System Requirements
- Node.js 18+
- At least 1GB free disk space for the vector database
- Internet connection for Gemini API calls

## Example Queries

Based on your `data.txt` content, try these example queries:

```bash
pnpm query "What weapons did the Zorblaxian Empire use?"
pnpm query "Why is Tuesday illegal?"
pnpm query "What are the oceans made of on planet Flibbertigibbet?"
pnpm query "What did AI researchers discover about their advanced AI?"
pnpm query "What is the secret ingredient in grandma's cookies?"
```