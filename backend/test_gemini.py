import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"Testing Gemini API Key: {api_key[:5]}...{api_key[-5:]}")

try:
    genai.configure(api_key=api_key)
    result = genai.embed_content(
        model="models/text-embedding-004",
        content="test message",
        task_type="retrieval_query"
    )
    print("SUCCESS: Gemini API is working. Embedding size:", len(result['embedding']))
except Exception as e:
    print("ERROR: Gemini API failed.")
    print(str(e))
