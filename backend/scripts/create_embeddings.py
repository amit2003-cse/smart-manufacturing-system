import json
import faiss
import numpy as np
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# CONFIG
INPUT_FILE = "data/processed/chunks.json"
INDEX_FILE = "vectorstore/faiss_index.bin"
META_FILE = "vectorstore/metadata.json"

# CONFIGURE GEMINI
genai.configure(api_key=GEMINI_API_KEY)

# LOAD DATA
with open(INPUT_FILE, "r") as f:
    chunks = json.load(f)

texts = [c["text"] for c in chunks]

# CREATE EMBEDDINGS (using Gemini API)
print("Generating embeddings via Gemini API...")
embeddings_list = []
# Process in batches to avoid API limits if needed, but for small sets direct is fine
for text in texts:
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
        task_type="retrieval_document"
    )
    embeddings_list.append(result['embedding'])

# CONVERT TO NUMPY
embeddings = np.array(embeddings_list).astype("float32")

# CREATE FAISS INDEX
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)

index.add(embeddings)

# SAVE INDEX
faiss.write_index(index, INDEX_FILE)

# SAVE METADATA
with open(META_FILE, "w") as f:
    json.dump(chunks, f)

print("Embeddings + FAISS index created")