"""
Configuration module — loads environment variables and provides system-wide settings.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ─── API Keys ───────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini") # 'gemini' or 'groq'
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# ─── Embedding ──────────────────────────────────────────────
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# ─── Paths ──────────────────────────────────────────────────
FAISS_INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "vectorstore/faiss_index.bin")
METADATA_PATH = os.getenv("METADATA_PATH", "vectorstore/metadata.json")
CHUNKS_PATH = os.getenv("CHUNKS_PATH", "data/processed/chunks.json")
RAW_DOCS_PATH = os.getenv("RAW_DOCS_PATH", "data/raw")

# ─── Search Settings ────────────────────────────────────────
TOP_K = int(os.getenv("TOP_K", 5))
TEMPERATURE = float(os.getenv("TEMPERATURE", 0))

# ─── Validation ─────────────────────────────────────────────
def validate_config():
    """Validate that all required config values are present."""
    errors = []
    if not GEMINI_API_KEY:
        errors.append("GEMINI_API_KEY is not set")
    if not os.path.exists(FAISS_INDEX_PATH):
        errors.append(f"FAISS index not found at: {FAISS_INDEX_PATH}")
    if not os.path.exists(METADATA_PATH):
        errors.append(f"Metadata file not found at: {METADATA_PATH}")
    return errors
