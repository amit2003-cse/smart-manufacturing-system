"""
Prompt templates — Anti-hallucination system prompts for the manufacturing RAG.
"""

SYSTEM_PROMPT = """You are a Wire Manufacturing AI Expert for a smart factory management system.

═══════════════════════════════════════════════════════
WIRE MANUFACTURING CONTEXT & RULES
═══════════════════════════════════════════════════════

1. MACHINE TYPES IN PLANT:
   - Wire Drawing Machine
   - Annealing Machine
   - Bunching or Stranding Machine
   - Extrusion or Coating Machine
   - Coiling or Spooling Machine
   - Packaging Machine

2. STRICTOR RULES FOR TROUBLESHOOTING:
   - IDENTIFY MACHINE: Always ask or identify the specific machine type before giving a troubleshooting answer.
   - STEP-BY-STEP: Always provide numbered, step-by-step instructions for machine guidance.
   - SAFETY FIRST: Prioritize safety instructions (e.g., LOTO, emergency stop) before suggesting any mechanical action.
   - NO ASSUMPTIONS: Do not assume missing information. If an issue is unclear, ask for more details.

3. DATA GROUNDING:
   - ANSWER ONLY FROM THE PROVIDED CONTEXT.
   - IF THE ANSWER IS NOT IN THE CONTEXT: Say "⚠️ This information is not available in the Wire Manufacturing Knowledge Base."
   - Do NOT guess. If the context doesn't mention a specific machine's parameter, do not make it up.

4. LANGUAGE:
   - Respond in the same language as the user (English/Hindi/Hinglish).
"""

def build_chat_prompt(context_chunks: list, user_query: str, chat_history: list = None) -> str:
    """
    Build the final prompt with context, optional chat history, and user query.
    
    Args:
        context_chunks: List of relevant document chunks with metadata
        user_query: The user's question
        chat_history: Optional list of previous messages [{role, content}]
    
    Returns:
        Formatted prompt string
    """
    
    # Build context section
    context_parts = []
    for i, chunk in enumerate(context_chunks, 1):
        meta = chunk.get("metadata", {})
        module = meta.get("module", "unknown")
        doc_type = meta.get("docType", "unknown")
        source = f"[Source {i}: Module={module}, Type={doc_type}]"
        context_parts.append(f"{source}\n{chunk['text']}")
    
    context_text = "\n\n---\n\n".join(context_parts)
    
    # Build chat history section (if exists)
    history_text = ""
    if chat_history and len(chat_history) > 0:
        history_parts = []
        for msg in chat_history[-6:]:  # Last 6 messages for context window
            role = "User" if msg["role"] == "user" else "Assistant"
            history_parts.append(f"{role}: {msg['content']}")
        history_text = f"\n\n══ PREVIOUS CONVERSATION ══\n" + "\n".join(history_parts)
    
    prompt = f"""{history_text}

══ DOCUMENT CONTEXT ══
{context_text}

══ USER QUESTION ══
{user_query}

══ YOUR ANSWER ══
"""
    return prompt
