<p align="center">
  <img src="https://img.shields.io/badge/Full_Stack-Wire_Manufacturing-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI-Knowledge_Base-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/React-FastAPI-orange?style=for-the-badge" />
</p>

<h1 align="center">🏗️ Wire Manufacturing AI-Powered MES</h1>

<p align="center">
  <strong>Integrated Manufacturing Execution System + Expert AI Guidance</strong><br/>
  <em>A specialized platform for Wire Drawing, Annealing, and Extrusion plants with RAG-based AI troubleshooting.</em>
</p>

---

## 📂 Project Structure

This is a **Full-Stack Monorepo** containing:

*   **[`/frontend`](./frontend)**: React dashboard for real-time reel tracking, QC, and dispatch.
*   **[`/backend`](./backend)**: Python FastAPI RAG system with Llama 3.3 for machine troubleshooting.

---

## 🚀 Quick Start (Full Stack)

### 1️⃣ Start AI Backend (Knowledge Base)
```bash
cd backend
# Setup .env with GROQ_API_KEY
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### 2️⃣ Start Dashboard Frontend
```bash
cd frontend
npm install
npm start
```

---

## 🤖 AI Assistant (Machine Expert)

The system features a **Wire Manufacturing AI Knowledge Base** trained on plant SOPs.

### Expert Rules:
*   **Safety First**: Prioritizes safety steps (LOTO/E-Stop) before mechanical advice.
*   **Machine Focused**: Specialized troubleshooting for:
    *   Wire Drawing Machines
    *   Annealing Machines
    *   Bunching/Stranding Machines
    *   Extrusion/Coating Machines
    *   Coiling/Spooling Machines
*   **Step-by-Step**: Provides numbered, actionable guidance for operators.
*   **Session Persistence**: Chat history is saved in the browser session.

---

## 🎨 UI/UX Highlights
*   **Contextual Branding**: System labels updated for Wire industry (Reels, Spools, Dispatch).
*   **Smart Sidebar**: Optimized for desktop; only the **Home icon** shows when collapsed for a clean workspace.
*   **Real-time Dashboard**: Live monitoring of "Wire Manufacturing Hub" metrics.

---

## 📬 Contact

<p align="center">
  <strong>Amit Kumar</strong><br/>
  📧 <a href="mailto:amit4321sg@gmail.com">amit4321sg@gmail.com</a> | 
  🔗 <a href="https://www.linkedin.com/in/amit-cse">LinkedIn</a> | 
  💻 <a href="https://github.com/amit2003-cse">GitHub</a>
</p>

---

<p align="center">
  <sub>Built for precision, safety, and smarter wire manufacturing operations.</sub>
</p>
