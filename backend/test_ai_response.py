import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from server.llm import llm_engine
from server.retrieval import retrieval_engine

def test_gemini_response():
    print("Initializing Engines...")
    retrieval_engine.load()
    llm_engine.initialize()
    
    query = "What are the safety rules for the Wire Drawing machine?"
    print(f"\nUser Query: {query}")
    
    # 1. Retrieve context
    chunks = retrieval_engine.search(query)
    print(f"Retrieved {len(chunks)} chunks.")
    
    # 2. Generate answer
    response = llm_engine.generate_answer(chunks, query)
    
    # Save to file to avoid Unicode console errors
    with open("gemini_test_output.txt", "w", encoding="utf-8") as f:
        f.write(f"MODEL: {response['model']}\n")
        f.write("--- ANSWER ---\n")
        f.write(response['answer'])
    
    print("\n✅ Success! Gemini response saved to 'gemini_test_output.txt'")

if __name__ == "__main__":
    test_gemini_response()
