<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Firebase-v9-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Recoil-State-3578E5?style=for-the-badge&logo=recoil&logoColor=white" />
  <img src="https://img.shields.io/badge/DevExtreme-Enterprise_UI-FF5722?style=for-the-badge&logo=devexpress&logoColor=white" />
  <img src="https://img.shields.io/badge/Lucide-Icons-F55036?style=for-the-badge&logo=lucide&logoColor=white" />
</p>

<h1 align="center">🏭 Smart Manufacturing Management System (SMS)</h1>

<p align="center">
  <strong>Next-Gen Manufacturing Execution System (MES) with AI-Powered Operations</strong><br/>
  <em>A professional, mobile-first dashboard for real-time tracking, quality control, and logistics</em>
</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-key-modules">Key Modules</a> •
  <a href="#-ai-system-assistant">AI Assistant</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-contact">Contact</a>
</p>

---

## ✨ Overview

The **Smart Manufacturing Management System** is a production-grade interface designed to handle high-volume barcode scanning, quality control, and logistics. This system has been fully transformed into a **Responsive, Mobile-First Application**, ensuring seamless operation across Handheld Scanners, Tablets, and Desktops.

It now features a grounded **AI System Assistant** that provides instant SOP guidance to operators, ensuring zero-error manufacturing.

---

## 🚀 Key Modules

### 🛠️ Production & Scanning
*   **Mass Generation:** Generate unit boxes with automated sequence tracking and barcode generation.
*   **Precision Scan:** Real-time barcode validation against the master database using `BWIP-JS`.
*   **Duplicate Prevention:** Native database-level checks to ensure zero double-processing.

### 🧪 Quality Control (QC)
*   **Request Lifecycle:** Seamlessly transition from production to specialized QC review queues.
*   **Decision Matrix:** Bulk approve or reject scanned units with automated audit trails.
*   **Batch Locking:** Enforced capacity rules (e.g., 10 units per batch) to maintain packaging consistency.

### 📦 Smart Packaging
*   **Carton Consolidation:** Automated grouping of scanned units into master "Cartons".
*   **Label Engine:** Real-time generation of shipping labels with integrated QR codes.
*   **Print-Ready UI:** Specialized CSS media queries for direct thermal label printing.

### 🤖 AI System Assistant (New 🔥)
*   **Grounded RAG:** Answers strictly based on company SOPs and quality manuals.
*   **Anti-Hallucination:** System refuses to answer questions not found in official documentation.
*   **Bilingual Support:** Understands and responds in both English and Hindi/Hinglish.
*   **Direct Home Integration:** "Need Help?" widget on the dashboard for instant operator guidance.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE (React)                  │
│  ┌────────────┐    ┌────────────┐    ┌──────────────────┐   │
│  │ Dashboard  │◄──►│  State     │◄──►│ AI Chat Interface│   │
│  │ (Home.jsx) │    │  (Recoil)  │    │ (Chatbot.jsx)    │   │
└───────┬────────────┴──────┬─────┴────────────┬──────────────┘
        │                   │                  │
        │                   ▼                  │ HTTP POST /chat
        │          ┌─────────────────┐         ▼
        │          │  API SERVICES   │    ┌──────────────────┐
        └─────────►│  (Firestore)    │    │  RAG AI BACKEND  │
                   │  (Firebase)     │    │  (FastAPI / Groq)│
                   └─────────────────┘    └──────────────────┘
```

---

## 🎨 UI/UX Design System
*   **Mobile-First Architecture:** Fluid layouts that adapt from handheld scanners to desktop monitors.
*   **Adaptive Sidebar:** Interactive drawer for mobile; persistent, centered navigation for desktop.
*   **Touch-Friendly Targets:** All interactive elements follow the 44px minimum touch target standard.
*   **Optimized DataGrids:** Enterprise-grade grids with horizontal scrolling and column pinning for small screens.
*   **Glassmorphism Effects:** Modern cards and banners with smooth gradients and subtle shadows.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 (Hooks), Modern SCSS Design System |
| **State Management** | Recoil (with LocalStorage Persistence) |
| **UI Components** | DevExtreme (Data Grids), Lucide React (Icons) |
| **Backend/DB** | Firebase Firestore (Real-time Cloud Sync) |
| **AI Engine** | FastAPI (RAG Backend), Groq (Llama 3.3), FAISS |
| **Labeling** | BWIP-JS (Professional Barcode/QR Generation) |

---

## 📂 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/amit2003-cse/smart-manufacturing-system.git
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm start
   ```
4. **Setup AI Backend (Optional):**
   Follow the setup guide in the [AI-manufacturing-system](https://github.com/amit2003-cse/AI-manufacturing-system) repo.

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
  <sub>Built with ❤️ for precision manufacturing and smart logistics</sub>
</p>
