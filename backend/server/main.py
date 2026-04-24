"""
Main FastAPI Server — RAG System for Manufacturing Operations.

Endpoints:
    POST /chat      — Ask a question, get a grounded answer
    POST /upload    — Upload a PDF document for indexing  
    GET  /health    — System health check
    GET  /stats     — Index statistics
"""

import os
import json
import subprocess
import sys
from datetime import datetime

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List

from server.config import (
    validate_config,
    FAISS_INDEX_PATH,
    METADATA_PATH,
    CHUNKS_PATH,
    RAW_DOCS_PATH,
)
from server.retrieval import retrieval_engine
from server.llm import llm_engine


# ═══════════════════════════════════════════════
# App Setup
# ═══════════════════════════════════════════════

app = FastAPI(
    title="Manufacturing RAG System",
    description="Document-grounded Q&A for manufacturing operations",
    version="1.0.0",
)

# CORS — allow chat UI to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════
# Request/Response Models
# ═══════════════════════════════════════════════

class ChatRequest(BaseModel):
    query: str
    module_filter: Optional[str] = None  # e.g., "packaging", "qc"
    chat_history: Optional[List[dict]] = None  # [{role: "user"/"assistant", content: "..."}]
    top_k: Optional[int] = None

class ChatResponse(BaseModel):
    answer: str
    sources: list
    model: str
    chunks_used: int
    query: str
    timestamp: str


# ═══════════════════════════════════════════════
# Startup Event
# ═══════════════════════════════════════════════

@app.on_event("startup")
async def startup():
    """Load models and indexes on server start."""
    print("Starting Manufacturing RAG System...")
    
    # Validate config
    errors = validate_config()
    if errors:
        print("Configuration warnings:")
        for err in errors:
            print(f"   - {err}")
    
    # Load retrieval engine (embedding model + FAISS)
    try:
        retrieval_engine.load()
    except Exception as e:
        print(f"WARNING: Retrieval engine failed to load: {e}")
        print("   Run create_embeddings.py first to build the index.")
    
    # Initialize LLM
    try:
        llm_engine.initialize()
    except Exception as e:
        print(f"WARNING: LLM engine failed to initialize: {e}")


# ═══════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint.
    
    Flow: Query → Embedding → FAISS Search → Context Build → LLM → Response
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    print(f"\n{'='*50}")
    print(f"Query: {request.query}")
    print(f"Filter: {request.module_filter or 'none'}")
    
    # Step 1 & 2: Embed query + FAISS search
    try:
        results = retrieval_engine.search(
            query=request.query,
            top_k=request.top_k,
            module_filter=request.module_filter,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Retrieval failed: {str(e)}. Make sure FAISS index exists."
        )
    
    print(f"Retrieved {len(results)} chunks")
    
    if not results:
        return ChatResponse(
            answer="No relevant documents found in the system. Please upload relevant documents first.",
            sources=[],
            model="none",
            chunks_used=0,
            query=request.query,
            timestamp=datetime.now().isoformat(),
        )
    
    # Step 3 & 4: Build context + Call LLM
    try:
        llm_result = llm_engine.generate_answer(
            context_chunks=results,
            user_query=request.query,
            chat_history=request.chat_history,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")
    
    print(f"Answer generated ({llm_result['chunks_used']} chunks used)")
    
    return ChatResponse(
        answer=llm_result["answer"],
        sources=llm_result["sources"],
        model=llm_result["model"],
        chunks_used=llm_result["chunks_used"],
        query=request.query,
        timestamp=datetime.now().isoformat(),
    )


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF document, process it, and re-index.
    
    Flow: Upload → Save → Process → Re-embed → Reload index
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Save the uploaded file
    os.makedirs(RAW_DOCS_PATH, exist_ok=True)
    file_path = os.path.join(RAW_DOCS_PATH, file.filename)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    print(f"Uploaded: {file.filename} ({len(content)} bytes)")
    
    # Re-process all documents
    try:
        print("Processing documents...")
        subprocess.run(
            [sys.executable, "scripts/process-docs.py"],
            check=True,
            capture_output=True,
            text=True,
        )
        
        print("Creating embeddings...")
        subprocess.run(
            [sys.executable, "scripts/create_embeddings.py"],
            check=True,
            capture_output=True,
            text=True,
        )
        
        # Reload the index
        retrieval_engine.reload()
        
        return {
            "status": "success",
            "message": f"Document '{file.filename}' uploaded and indexed successfully",
            "file": file.filename,
            "size_bytes": len(content),
        }
    
    except subprocess.CalledProcessError as e:
        return {
            "status": "error",
            "message": f"Processing failed: {e.stderr}",
            "file": file.filename,
        }


@app.get("/health")
async def health():
    """System health check."""
    index_exists = os.path.exists(FAISS_INDEX_PATH) and os.path.getsize(FAISS_INDEX_PATH) > 0
    meta_exists = os.path.exists(METADATA_PATH) and os.path.getsize(METADATA_PATH) > 0
    
    return {
        "status": "healthy" if (index_exists and meta_exists) else "degraded",
        "components": {
            "faiss_index": "ready" if index_exists else "missing",
            "metadata": "ready" if meta_exists else "missing",
            "retrieval_engine": "loaded" if retrieval_engine._loaded else "not_loaded",
            "llm_engine": "initialized" if llm_engine._initialized else "not_initialized",
        },
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/stats")
async def stats():
    """Index statistics."""
    stats_data = {
        "total_vectors": 0,
        "total_chunks": 0,
        "modules": {},
        "documents": [],
    }
    
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                metadata = json.load(f)
            
            stats_data["total_chunks"] = len(metadata)
            
            # Count by module
            modules = {}
            doc_names = set()
            for chunk in metadata:
                meta = chunk.get("metadata", {})
                module = meta.get("module", "unknown")
                modules[module] = modules.get(module, 0) + 1
                
                doc_id = chunk.get("id", "")
                doc_name = "_".join(doc_id.split("_")[:-1]) if "_" in doc_id else doc_id
                doc_names.add(doc_name)
            
            stats_data["modules"] = modules
            stats_data["documents"] = list(doc_names)
        except Exception:
            pass
    
    if retrieval_engine._loaded and retrieval_engine.index:
        stats_data["total_vectors"] = retrieval_engine.index.ntotal
    
    return stats_data


# ═══════════════════════════════════════════════
# Serve Chat UI
# ═══════════════════════════════════════════════

# Mount static files for the chat UI
chat_ui_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chat-ui")
if os.path.exists(chat_ui_path):
    app.mount("/static", StaticFiles(directory=chat_ui_path), name="static")

    @app.get("/")
    async def serve_ui():
        """Serve the chat UI."""
        return FileResponse(os.path.join(chat_ui_path, "index.html"))
