"""
Retrieval module — FAISS vector search with metadata filtering.
"""

import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from server.config import (
    FAISS_INDEX_PATH, 
    METADATA_PATH, 
    EMBEDDING_MODEL, 
    TOP_K
)


class RetrievalEngine:
    """
    Handles embedding queries and searching the FAISS vector store.
    Supports metadata-based filtering for module-specific results.
    """
    
    def __init__(self):
        self.model = None
        self.index = None
        self.metadata = None
        self._loaded = False
    
    def load(self):
        """Load embedding model, FAISS index, and metadata into memory."""
        if self._loaded:
            return
        
        print("Loading embedding model...")
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        
        print("Loading FAISS index...")
        self.index = faiss.read_index(FAISS_INDEX_PATH)
        
        print("Loading metadata...")
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            self.metadata = json.load(f)
        
        self._loaded = True
        print(f"Retrieval engine ready. {self.index.ntotal} vectors loaded.")
    
    def embed_query(self, query: str) -> np.ndarray:
        """Convert a text query into a vector embedding."""
        embedding = self.model.encode([query])
        return np.array(embedding).astype("float32")
    
    def search(self, query: str, top_k: int = None, module_filter: str = None) -> list:
        """
        Search FAISS index for the most relevant chunks.
        
        Args:
            query: User's question text
            top_k: Number of results to return (default from config)
            module_filter: Optional module name to filter results (e.g., "packaging", "qc")
        
        Returns:
            List of matching chunks with text, metadata, and similarity scores
        """
        if not self._loaded:
            self.load()
        
        k = top_k or TOP_K
        
        # Embed the query
        query_vector = self.embed_query(query)
        
        # Search FAISS — get more results if we need to filter
        search_k = k * 3 if module_filter else k
        distances, indices = self.index.search(query_vector, search_k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < 0 or idx >= len(self.metadata):
                continue
            
            chunk = self.metadata[idx]
            
            # Apply module filter if specified
            if module_filter:
                chunk_module = chunk.get("metadata", {}).get("module", "")
                if chunk_module.lower() != module_filter.lower():
                    continue
            
            results.append({
                "id": chunk.get("id", f"chunk_{idx}"),
                "text": chunk.get("text", ""),
                "metadata": chunk.get("metadata", {}),
                "score": float(dist),  # L2 distance (lower = more similar)
                "rank": len(results) + 1
            })
            
            if len(results) >= k:
                break
        
        return results
    
    def reload(self):
        """Force reload the index and metadata (after re-indexing)."""
        self._loaded = False
        self.load()


# Singleton instance
retrieval_engine = RetrievalEngine()
