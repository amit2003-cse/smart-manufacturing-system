<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/FAISS-Vector_Search-4285F4?style=for-the-badge&logo=meta&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-Llama_3.3-F55036?style=for-the-badge&logo=groq&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
</p>

<h1 align="center">🏭 Manufacturing RAG System</h1>

<p align="center">
  <strong>Production-Grade Retrieval-Augmented Generation for Manufacturing Operations</strong><br/>
  <em>Zero-hallucination AI assistant that answers strictly from your factory documents</em>
</p>

<p align="center">
  <a href="#-architecture">Architecture</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-contact">Contact</a>
</p>

---

## 🎯 Problem Statement

Generic chatbots **hallucinate** — they make up answers that sound right but aren't. In a manufacturing environment, this is **dangerous**. Wrong SOP guidance can lead to product defects, quality failures, or safety incidents.

**This system solves it with one core principle:**

> 🧠 **LLM ≠ Knowledge Source** → **Documents = Knowledge Source** → **LLM = Reasoning Engine Only**

The AI answers **only** from your uploaded SOPs, quality manuals, and factory documents. If the answer isn't in the documents, it says _"This information is not available"_ — no guessing, no hallucination.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Operator)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React / SMS UI)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Home Page   │  │  Chatbot UI  │  │  Module Filters (QC,   │ │
│  │  Help Section│  │  (No Upload) │  │  Packaging, General)   │ │
│  └─────────────┘  └──────┬───────┘  └────────────────────────┘ │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTP POST /chat
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI + Python)                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Layer (main.py)                    │   │
│  │         /chat  ·  /upload  ·  /health  ·  /stats         │   │
│  └────────────┬─────────────────────────┬───────────────────┘   │
│               │                         │                       │
│               ▼                         ▼                       │
│  ┌────────────────────┐    ┌────────────────────────────────┐   │
│  │  Retrieval Engine   │    │       LLM Engine (llm.py)      │   │
│  │  (retrieval.py)     │    │                                │   │
│  │                     │    │  ┌──────────┐  ┌────────────┐  │   │
│  │  • Sentence-BERT    │    │  │  Groq    │  │  Gemini    │  │   │
│  │  • FAISS L2 Search  │    │  │  Llama   │  │  Flash     │  │   │
│  │  • Metadata Filter  │    │  │  3.3-70B │  │  2.0       │  │   │
│  │  • Top-K Retrieval  │    │  └──────────┘  └────────────┘  │   │
│  └─────────┬──────────┘    │                                │   │
│            │               │  Anti-Hallucination Prompt      │   │
│            │               │  (prompts.py)                   │   │
│            ▼               └────────────────────────────────┘   │
│  ┌────────────────────┐                                         │
│  │   Vector Store      │                                         │
│  │   (FAISS Index)     │                                         │
│  │   + metadata.json   │                                         │
│  └────────────────────┘                                         │
└─────────────────────────────────────────────────────────────────┘
                           ▲
                           │ Offline Pipeline
                           │
┌─────────────────────────────────────────────────────────────────┐
│                  DOCUMENT PIPELINE (scripts/)                   │
│                                                                 │
│    PDF Files ──► process-docs.py ──► create_embeddings.py       │
│    (data/raw)      (chunking)          (FAISS index)            │
│                                                                 │
│    • PyPDF extraction      • Sentence-Transformers              │
│    • Chunk splitting       • all-MiniLM-L6-v2 embeddings        │
│    • Metadata tagging      • L2 normalized vectors              │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🛡️ **Anti-Hallucination** | Strict system prompt ensures AI only answers from provided documents |
| 🔍 **Semantic Search** | FAISS vector search with sentence-transformers for accurate retrieval |
| 🌐 **Multi-LLM Support** | Switchable between **Groq (Llama 3.3)** and **Google Gemini** |
| 📋 **Source Citations** | Every answer includes which document/module the info came from |
| 🗂️ **Module Filtering** | Filter answers by Packaging, QC, or General modules |
| 🌍 **Bilingual Support** | Responds in English or Hindi/Hinglish based on the user's query |
| 📱 **Responsive UI** | Works on Desktop, Tablet, and Mobile screens |
| ⚡ **Real-time Health** | Live system status monitoring via `/health` endpoint |
| 🔌 **SMS Integration** | Chatbot integrated into existing SMS React dashboard |

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | High-performance async API framework |
| **FAISS** (Facebook AI) | Vector similarity search engine |
| **Sentence-Transformers** | Text embedding model (`all-MiniLM-L6-v2`) |
| **Groq SDK** | LLM inference (Llama 3.3 70B) |
| **Google GenAI** | Alternate LLM provider (Gemini Flash) |
| **PyPDF** | PDF document parsing |
| **Uvicorn** | ASGI server with hot-reload |

### Frontend (Integrated with SMS)
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **React Router** | Client-side navigation |
| **Lucide React** | Icon library |
| **SCSS** | Styling (consistent with SMS design system) |
| **DevExtreme** | Enterprise UI components |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** installed
- **Node.js 18+** installed
- **Groq API Key** ([Get one here](https://console.groq.com))

### 1️⃣ Clone & Setup Backend

```bash
# Navigate to the RAG system directory
cd rag-system

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

### 2️⃣ Configure Environment

Create a `.env` file in the `rag-system/` root:

```env
GROQ_API_KEY=your_groq_api_key_here
LLM_PROVIDER=groq
GROQ_MODEL=llama-3.3-70b-versatile
EMBEDDING_MODEL=all-MiniLM-L6-v2
FAISS_INDEX_PATH=vectorstore/faiss_index.bin
METADATA_PATH=vectorstore/metadata.json
CHUNKS_PATH=data/processed/chunks.json
RAW_DOCS_PATH=data/raw
TOP_K=5
TEMPERATURE=0
```

### 3️⃣ Add Documents & Build Index

```bash
# Place your PDF files in data/raw/

# Step 1: Process PDFs into text chunks
python scripts/process-docs.py

# Step 2: Generate embeddings and build FAISS index
python scripts/create_embeddings.py
```

### 4️⃣ Start Backend Server

```bash
python run.py
# Server starts at http://localhost:8000
```

### 5️⃣ Start Frontend (SMS Dashboard)

```bash
cd frontend
npm install
npm start
# Opens at http://localhost:3000
```

### 6️⃣ Access the Chatbot

- Navigate to **Home → "Need Help?" → Open System Assistant**
- Or use the **Sidebar → System Assistant**
- Or directly visit `http://localhost:3000/assistant`

---

## 📁 Project Structure

```
rag-system/
├── server/                     # FastAPI Backend
│   ├── main.py                 # API endpoints & app setup
│   ├── config.py               # Environment & path configuration
│   ├── retrieval.py            # FAISS search engine
│   ├── llm.py                  # Multi-provider LLM engine
│   ├── prompts.py              # Anti-hallucination system prompts
│   └── __init__.py
│
├── scripts/                    # Offline Document Pipeline
│   ├── process-docs.py         # PDF → text chunks
│   └── create_embeddings.py    # Chunks → FAISS vectors
│
├── data/
│   ├── raw/                    # Source PDF documents
│   └── processed/              # Chunked text (JSON)
│
├── vectorstore/                # FAISS index + metadata
│   ├── faiss_index.bin
│   └── metadata.json
│
├── chat-ui/                    # Standalone chat interface
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── run.py                      # Server entry point
├── requirements.txt            # Python dependencies
└── .env                        # API keys & config

frontend/                       # SMS React Application
├── src/
│   ├── pages/
│   │   └── chatbot/            # Chatbot page (NEW)
│   │       ├── Chatbot.jsx
│   │       └── Chatbot.scss
│   ├── layout/
│   │   ├── Sidebar.jsx         # Updated with Assistant nav
│   │   └── MainLayout.scss
│   └── App.jsx                 # Updated with /assistant route
```

---

## 📡 API Reference

### `POST /chat`
Send a question and receive a grounded answer.

```json
// Request
{
  "query": "What are the packaging rules?",
  "module_filter": "packaging",
  "top_k": 5
}

// Response
{
  "answer": "According to the Packaging SOP...",
  "sources": [{"module": "packaging", "docType": "SOP"}],
  "model": "llama-3.3-70b-versatile",
  "chunks_used": 5
}
```

### `POST /upload`
Upload a PDF document for indexing.

### `GET /health`
System health check — returns status of all components.

```json
{
  "status": "healthy",
  "components": {
    "faiss_index": "ready",
    "metadata": "ready",
    "retrieval_engine": "loaded",
    "llm_engine": "initialized"
  }
}
```

### `GET /stats`
Returns document and chunk statistics.

---

## 🔒 Anti-Hallucination Design

The system enforces strict grounding through multiple layers:

```
Layer 1: RETRIEVAL GROUNDING
  └── Only relevant document chunks are passed to LLM (no open-ended generation)

Layer 2: SYSTEM PROMPT ENFORCEMENT
  └── "Answer ONLY from the provided context. Do NOT use training data."

Layer 3: TEMPERATURE CONTROL
  └── Temperature = 0 (deterministic, no creative/random outputs)

Layer 4: FALLBACK RESPONSE
  └── If answer not in docs → "This information is not available in system documents."

Layer 5: SOURCE CITATION
  └── Every answer must cite which document/module it came from
```

---

## 📸 Screenshots

| Home — Help Section | Chatbot — System Assistant |
|---|---|
| Help section with guidance text and example queries on the dashboard | Clean, distraction-free chat interface with example prompts |

---

## 🗺️ Roadmap

- [x] FAISS vector search with semantic retrieval
- [x] Multi-LLM support (Groq + Gemini)
- [x] Anti-hallucination prompt engineering
- [x] SMS Dashboard integration
- [x] Module-based filtering (Packaging, QC, General)
- [x] Responsive design (Mobile + Desktop)
- [ ] JWT/OAuth authentication
- [ ] Feedback logging to Firestore
- [ ] Chat history persistence
- [ ] Multi-document batch upload
- [ ] Fine-tuning based on user feedback

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 📬 Contact

<p align="center">
  <a href="https://www.linkedin.com/in/amit-cse">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>
  <a href="mailto:amit4321sg@gmail.com">
    <img src="https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white" />
  </a>
  <a href="https://github.com/amit2003-cse">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  <a href="https://amit-next-portfolio.vercel.app/">
    <img src="https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  </a>
</p>

<p align="center">
  <strong>Amit Kumar</strong><br/>
  📧 <a href="mailto:amit4321sg@gmail.com">amit4321sg@gmail.com</a><br/>
  🔗 <a href="https://www.linkedin.com/in/amit-cse">linkedin.com/in/amit-cse</a><br/>
  💻 <a href="https://github.com/amit2003-cse">github.com/amit2003-cse</a><br/>
  🌐 <a href="https://amit-next-portfolio.vercel.app/">amit-next-portfolio.vercel.app</a>
</p>

---

<p align="center">
  <sub>Built with ❤️ for smarter manufacturing operations</sub>
</p>
