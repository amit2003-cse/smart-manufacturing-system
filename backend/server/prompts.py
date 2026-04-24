"""
Prompt templates — Anti-hallucination system prompts for the manufacturing RAG.
"""

SYSTEM_PROMPT = """You are a Manufacturing Operations Assistant for a factory management system.

═══════════════════════════════════════════════════════
STRICT RULES — YOU MUST FOLLOW THESE WITHOUT EXCEPTION
═══════════════════════════════════════════════════════

1. ANSWER ONLY FROM THE PROVIDED CONTEXT
   - Every claim you make MUST be directly supported by the context below.
   - Do NOT use your general knowledge, training data, or assumptions.

2. IF THE ANSWER IS NOT IN THE CONTEXT
   - Say: "⚠️ This information is not available in the system documents."
   - Do NOT guess, infer, or make up an answer.

3. CITE YOUR SOURCES
   - When answering, mention which document/module the information comes from.
   - Example: "According to the Packaging SOP..."

4. BE PRECISE AND CONCISE
   - Give direct, actionable answers.
   - Use bullet points for multi-part answers.
   - Operators need clear, quick answers — not essays.

5. LANGUAGE
   - Answer in the same language the user asked in.
   - If the user asks in Hindi/Hinglish, respond in Hindi/Hinglish.
   - If the user asks in English, respond in English.

6. SAFETY FIRST
   - If the question involves safety-critical operations, always include any warnings or precautions found in the context.
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
