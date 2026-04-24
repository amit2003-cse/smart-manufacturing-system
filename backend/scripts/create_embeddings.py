import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# CONFIG
INPUT_FILE = "data/processed/chunks.json"
INDEX_FILE = "vectorstore/faiss_index.bin"
META_FILE = "vectorstore/metadata.json"

# LOAD MODEL
model = SentenceTransformer('all-MiniLM-L6-v2')

# LOAD DATA
with open(INPUT_FILE, "r") as f:
    chunks = json.load(f)

texts = [c["text"] for c in chunks]

# CREATE EMBEDDINGS
print("Generating embeddings...")
embeddings = model.encode(texts, show_progress_bar=True)

# CONVERT TO NUMPY
embeddings = np.array(embeddings).astype("float32")

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