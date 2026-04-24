/**
 * Manufacturing RAG Chat — Frontend Application
 * Handles chat, file upload, system status, and module filtering.
 */

const API_BASE = window.location.origin;

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════
const state = {
    chatHistory: [],
    moduleFilter: "",
    isLoading: false,
};

// ═══════════════════════════════════════════════
// DOM Elements
// ═══════════════════════════════════════════════
const $ = (sel) => document.querySelector(sel);
const chatInput = $("#chat-input");
const sendBtn = $("#send-btn");
const chatMessages = $("#chat-messages");
const welcomeScreen = $("#welcome-screen");
const clearBtn = $("#clear-chat");
const menuToggle = $("#menu-toggle");
const sidebar = $("#sidebar");
const uploadZone = $("#upload-zone");
const fileInput = $("#file-input");
const statusDot = $("#status-dot");
const statusText = $("#status-text");
const statusDetails = $("#status-details");

// ═══════════════════════════════════════════════
// Chat Logic
// ═══════════════════════════════════════════════
async function sendMessage(query) {
    if (!query.trim() || state.isLoading) return;

    // Hide welcome screen
    if (welcomeScreen) welcomeScreen.style.display = "none";

    // Add user message
    appendMessage("user", query);
    state.chatHistory.push({ role: "user", content: query });

    // Show typing indicator
    const typingEl = appendTyping();
    state.isLoading = true;
    updateSendBtn();

    try {
        const res = await fetch(`${API_BASE}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: query,
                module_filter: state.moduleFilter || null,
                chat_history: state.chatHistory.slice(-6),
                top_k: 5,
            }),
        });

        typingEl.remove();

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Server error ${res.status}`);
        }

        const data = await res.json();
        appendMessage("bot", data.answer, data.sources);
        state.chatHistory.push({ role: "assistant", content: data.answer });
    } catch (err) {
        typingEl.remove();
        appendMessage("bot", `⚠️ Error: ${err.message}`, []);
    }

    state.isLoading = false;
    updateSendBtn();
}

function appendMessage(role, content, sources = []) {
    const div = document.createElement("div");
    div.className = `message ${role}`;

    const avatar = role === "user" ? "👤" : "🤖";
    let sourcesHtml = "";

    if (role === "bot" && sources && sources.length > 0) {
        const tags = sources
            .map((s) => `<span class="source-tag">${s.module} · ${s.docType}</span>`)
            .join("");
        sourcesHtml = `<div class="message-sources">📎 Sources: ${tags}</div>`;
    }

    const feedbackHtml =
        role === "bot"
            ? `<div class="message-feedback">
                <button class="feedback-btn" onclick="feedback(this,'up')">👍</button>
                <button class="feedback-btn" onclick="feedback(this,'down')">👎</button>
               </div>`
            : "";

    // Convert markdown-like formatting
    const formatted = formatText(content);

    div.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            ${formatted}
            ${sourcesHtml}
            ${feedbackHtml}
        </div>
    `;

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return div;
}

function appendTyping() {
    const div = document.createElement("div");
    div.className = "message bot";
    div.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator"><span></span><span></span><span></span></div>
        </div>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return div;
}

function formatText(text) {
    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Bullet points
    text = text.replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>");
    if (text.includes("<li>")) {
        text = text.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
    }
    // Line breaks
    text = text.replace(/\n/g, "<br>");
    return text;
}

function feedback(btn, type) {
    const siblings = btn.parentElement.querySelectorAll(".feedback-btn");
    siblings.forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
}

// ═══════════════════════════════════════════════
// Input Handling
// ═══════════════════════════════════════════════
chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
    updateSendBtn();
});

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const query = chatInput.value.trim();
        if (query) {
            sendMessage(query);
            chatInput.value = "";
            chatInput.style.height = "auto";
            updateSendBtn();
        }
    }
});

sendBtn.addEventListener("click", () => {
    const query = chatInput.value.trim();
    if (query) {
        sendMessage(query);
        chatInput.value = "";
        chatInput.style.height = "auto";
        updateSendBtn();
    }
});

function updateSendBtn() {
    sendBtn.disabled = !chatInput.value.trim() || state.isLoading;
}

// ═══════════════════════════════════════════════
// Quick Actions
// ═══════════════════════════════════════════════
document.querySelectorAll(".quick-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        sendMessage(btn.dataset.query);
    });
});

// ═══════════════════════════════════════════════
// Module Filter
// ═══════════════════════════════════════════════
document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.moduleFilter = btn.dataset.filter;
    });
});

// ═══════════════════════════════════════════════
// Clear Chat
// ═══════════════════════════════════════════════
clearBtn.addEventListener("click", () => {
    state.chatHistory = [];
    chatMessages.innerHTML = "";
    if (welcomeScreen) {
        chatMessages.appendChild(welcomeScreen);
        welcomeScreen.style.display = "flex";
    }
});

// ═══════════════════════════════════════════════
// Sidebar Toggle (Mobile)
// ═══════════════════════════════════════════════
menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

// ═══════════════════════════════════════════════
// File Upload
// ═══════════════════════════════════════════════
uploadZone.addEventListener("click", () => fileInput.click());

uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZone.classList.add("drag-over");
});
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.classList.remove("drag-over");
    if (e.dataTransfer.files.length > 0) uploadFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) uploadFile(fileInput.files[0]);
});

async function uploadFile(file) {
    if (!file.name.endsWith(".pdf")) {
        alert("Only PDF files are supported.");
        return;
    }

    const progress = $("#upload-progress");
    const progressFill = $("#progress-fill");
    const progressText = $("#progress-text");

    progress.style.display = "block";
    progressFill.style.width = "30%";
    progressText.textContent = "Uploading...";

    const formData = new FormData();
    formData.append("file", file);

    try {
        progressFill.style.width = "60%";
        progressText.textContent = "Processing & indexing...";

        const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
        const data = await res.json();

        progressFill.style.width = "100%";
        progressText.textContent = data.status === "success" ? "✅ Done!" : `❌ ${data.message}`;

        // Refresh stats
        setTimeout(() => {
            fetchStats();
            fetchHealth();
            progress.style.display = "none";
            progressFill.style.width = "0%";
        }, 2000);
    } catch (err) {
        progressText.textContent = `❌ Upload failed: ${err.message}`;
    }
}

// ═══════════════════════════════════════════════
// System Status
// ═══════════════════════════════════════════════
async function fetchHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        const data = await res.json();

        statusDot.className = "status-dot " + (data.status === "healthy" ? "online" : "error");
        statusText.textContent = data.status === "healthy" ? "System Online" : "Degraded";

        const c = data.components;
        statusDetails.innerHTML = `
            FAISS: ${c.faiss_index}<br>
            Metadata: ${c.metadata}<br>
            Retrieval: ${c.retrieval_engine}<br>
            LLM: ${c.llm_engine}
        `;
    } catch {
        statusDot.className = "status-dot error";
        statusText.textContent = "Offline";
        statusDetails.innerHTML = "Cannot reach server";
    }
}

async function fetchStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        const data = await res.json();
        $("#stat-chunks").textContent = data.total_chunks || 0;
        $("#stat-docs").textContent = (data.documents || []).length;
    } catch {
        // ignore
    }
}

// ═══════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════
fetchHealth();
fetchStats();
