import chromadb
from google import genai
import os
from google.genai import types

# Load environment variables
# load_dotenv()

# Configure Gemini API
# api_key = os.getenv('GEMINI_API_KEY')
# gemini.configure(api_key=api_key)

chroma_client = chromadb.Client()

# switch `create_collection` to `get_or_create_collection` to avoid creating a new collection every time
        # Try to delete existing collection to start fresh
try:
    chroma_client.delete_collection(name="rag_documents")
    print("Deleted existing collection")
except:
    pass  # Collection doesn't exist, that's fine
collection = chroma_client.create_collection(name="my_collection", metadata={"hnsw:space": "cosine"})

gemini = genai.Client()


# Create embeddings for documents
documents = [
    "jack is bad guy",
    "jill is not a bad girl",
    "jessie is a bad girl"
]

# Create embeddings using Gemini
document_embeddings = []
for doc in documents:
    embedding = gemini.models.embed_content(
        model="gemini-embedding-exp-03-07",
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
        contents=doc)
    document_embeddings.append(embedding.embeddings[0].values)

# switch `add` to `upsert` to avoid adding the same documents every time
collection.add(
    embeddings=document_embeddings,
    documents=documents,
    ids=["id1", "id2", "id3"]
)

# Create embedding for query
query = "Tell me about good people"
query_embedding = gemini.models.embed_content(
        model="gemini-embedding-exp-03-07",
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
        contents=query)
query_embedding = query_embedding.embeddings[0].values

results = collection.query(
    query_embeddings=[query_embedding],
    n_results=2 # how many results to return
)

print(results['documents'][0][0])

