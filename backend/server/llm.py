"""
LLM module — Support for Google Gemini and Groq (Llama 3) with anti-hallucination safeguards.
"""

import google.generativeai as genai
from groq import Groq
from server.config import (
    GEMINI_API_KEY, 
    GEMINI_MODEL, 
    GROQ_API_KEY, 
    GROQ_MODEL, 
    LLM_PROVIDER,
    TEMPERATURE
)
from server.prompts import SYSTEM_PROMPT, build_chat_prompt


class LLMEngine:
    """
    Handles all interactions with LLM providers (Gemini or Groq).
    Enforces strict grounding through system prompts.
    """
    
    def __init__(self):
        self.gemini_model = None
        self.groq_client = None
        self._initialized = False
    
    def initialize(self):
        """Configure LLM APIs and create model instances."""
        if self._initialized:
            return
        
        if LLM_PROVIDER == "gemini":
            if not GEMINI_API_KEY:
                print("WARNING: GEMINI_API_KEY is not set.")
            else:
                genai.configure(api_key=GEMINI_API_KEY)
                self.gemini_model = genai.GenerativeModel(
                    model_name=GEMINI_MODEL,
                    generation_config=genai.GenerationConfig(
                        temperature=TEMPERATURE,
                        max_output_tokens=2048,
                    ),
                    system_instruction=SYSTEM_PROMPT,
                )
                print(f"LLM engine ready. Model: {GEMINI_MODEL} (Gemini)")
        
        elif LLM_PROVIDER == "groq":
            if not GROQ_API_KEY:
                print("WARNING: GROQ_API_KEY is not set.")
            else:
                import os
                # Fix for Render proxy conflict
                os.environ.pop('HTTP_PROXY', None)
                os.environ.pop('HTTPS_PROXY', None)
                os.environ.pop('http_proxy', None)
                os.environ.pop('https_proxy', None)
                
                self.groq_client = Groq(api_key=GROQ_API_KEY)
                print(f"LLM engine ready. Model: {GROQ_MODEL} (Groq)")
        
        self._initialized = True
    
    def generate_answer(
        self, 
        context_chunks: list, 
        user_query: str, 
        chat_history: list = None
    ) -> dict:
        """
        Generate a grounded answer using retrieved context.
        """
        if not self._initialized:
            self.initialize()
        
        # Build the grounded prompt
        prompt = build_chat_prompt(context_chunks, user_query, chat_history)
        
        try:
            answer = ""
            model_name = ""
            
            if LLM_PROVIDER == "gemini" and self.gemini_model:
                response = self.gemini_model.generate_content(prompt)
                answer = response.text
                model_name = GEMINI_MODEL
                
            elif LLM_PROVIDER == "groq" and self.groq_client:
                messages = [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ]
                chat_completion = self.groq_client.chat.completions.create(
                    messages=messages,
                    model=GROQ_MODEL,
                    temperature=TEMPERATURE,
                    max_tokens=2048,
                )
                answer = chat_completion.choices[0].message.content
                model_name = GROQ_MODEL
            
            else:
                raise Exception(f"LLM Provider {LLM_PROVIDER} not initialized or invalid.")

            # Extract sources from chunks for citation
            sources = []
            seen_sources = set()
            for chunk in context_chunks:
                meta = chunk.get("metadata", {})
                source_key = f"{meta.get('module', 'unknown')}|{meta.get('docType', 'unknown')}"
                if source_key not in seen_sources:
                    seen_sources.add(source_key)
                    sources.append({
                        "module": meta.get("module", "unknown"),
                        "docType": meta.get("docType", "unknown"),
                    })
            
            return {
                "answer": answer,
                "sources": sources,
                "model": model_name,
                "chunks_used": len(context_chunks),
            }
        
        except Exception as e:
            error_msg = str(e)
            print(f"LLM Error: {error_msg}")
            
            if "quota" in error_msg.lower() or "rate" in error_msg.lower():
                return {
                    "answer": "API rate limit reached. Please try again in a moment.",
                    "sources": [],
                    "model": LLM_PROVIDER,
                    "error": "rate_limit",
                    "chunks_used": 0,
                }
            
            return {
                "answer": "An error occurred while generating the answer. Please try again.",
                "sources": [],
                "model": LLM_PROVIDER,
                "error": error_msg,
                "chunks_used": 0,
            }


# Singleton instance
llm_engine = LLMEngine()
