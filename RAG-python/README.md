# RAG System with Local Vector Database and Gemini API

This project implements a Retrieval-Augmented Generation (RAG) system that:
1. Creates embeddings from `data.txt` and stores them in a local vector database (ChromaDB)
2. Accepts queries from command line and retrieves relevant context
3. Uses Google's Gemini API to generate answers based on the retrieved context

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
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
python create_embeddings.py
```

This will:
- Read and chunk the content from `data.txt`
- Create embeddings using SentenceTransformer
- Store embeddings in a local ChromaDB database (`./chroma_db/`)

### Step 2: Query the System
Once embeddings are created, you can query the system:

```bash
python query_rag.py "What happened to the Zorblaxian Empire?"
```

```bash
python query_rag.py "Tell me about the Great Cosmic Llama"
```

```bash
python query_rag.py "What are black holes according to this data?"
```

### Advanced Usage
You can control how many context chunks to retrieve:

```bash
python query_rag.py "your question" --context-chunks 5
```

## How It Works

1. **Embedding Creation** (`create_embeddings.py`):
   - Reads `data.txt` and splits it into meaningful chunks
   - Uses `all-MiniLM-L6-v2` model to create embeddings
   - Stores embeddings in ChromaDB with metadata

2. **Query Processing** (`query_rag.py`):
   - Takes user query from command line
   - Creates embedding for the query
   - Searches ChromaDB for most similar chunks
   - Sends query + retrieved context to Gemini API
   - Returns AI-generated answer based on your data

## Files Structure

```
RAG/
├── data.txt                 # Your source data
├── create_embeddings.py     # Script to create and store embeddings
├── query_rag.py            # Script to query the RAG system
├── requirements.txt        # Python dependencies
├── .env.example           # Example environment file
├── .env                   # Your actual environment variables (create this)
├── README.md              # This file
└── chroma_db/             # Local vector database (created automatically)
```

## Troubleshooting

### Common Issues

1. **"GEMINI_API_KEY not found"**
   - Make sure you've set the environment variable or created `.env` file
   - Check that your API key is valid

2. **"Collection not found"**
   - Run `create_embeddings.py` first to create the vector database

3. **Import errors**
   - Make sure all dependencies are installed: `pip install -r requirements.txt`

### System Requirements
- Python 3.8+
- At least 1GB free disk space for the vector database
- Internet connection for Gemini API calls

## Customization

- **Change embedding model**: Modify the model name in both scripts (e.g., `'all-mpnet-base-v2'` for better quality)
- **Adjust chunk size**: Modify the text splitting logic in `create_embeddings.py`
- **Change number of retrieved chunks**: Use `--context-chunks` parameter or modify default in `query_rag.py`
- **Use different Gemini model**: Change `'gemini-1.5-flash'` to `'gemini-1.5-pro'` or other available models

## Example Queries

Based on your `data.txt` content, try these example queries:

```bash
python query_rag.py "What weapons did the Zorblaxian Empire use?"
python query_rag.py "Why is Tuesday illegal?"
python query_rag.py "What are the oceans made of on planet Flibbertigibbet?"
python query_rag.py "What did AI researchers discover about their advanced AI?"
python query_rag.py "What is the secret ingredient in grandma's cookies?"
``` 