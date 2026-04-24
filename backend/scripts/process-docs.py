import os
import json
from pypdf import PdfReader

RAW_PATH = "data/raw"
OUTPUT_PATH = "data/processed/chunks.json"

CHUNK_SIZE = 400
OVERLAP = 80

#pdf -> text

def extract_text_from_pdf(file_path):
    reader = PdfReader(file_path)
    text = ""

    for page in reader.pages:
        text += page.extract_text() + "\n"

    return text
#cleaning
def clean_text(text):
    return text.replace("\n"," ").strip()

def chunks_text(text):
    words = text.split()
    chunks = []

    for i in range(0,len(words),CHUNK_SIZE - OVERLAP):
        chunk = words[i:i+ CHUNK_SIZE]
        chunks.append(" ".join(chunk))
    return chunks



def get_metadata(file_name):
    if "packaging" in file_name.lower():
        return { "module": "packaging", "docType": "SOP"}
    elif "qc" in file_name.lower():
        return { "module": "qc", "docType": "SOP" }
    return { "module": "general", "docType": "unknown" }

def process_documents():
    all_chunks = []

    for file in os.listdir(RAW_PATH):
        file_path = os.path.join(RAW_PATH,file)

        if file_path.endswith(".pdf"):
            text = extract_text_from_pdf(file_path)
            text = clean_text(text)
            

            chunks = chunks_text(text)
            metadata = get_metadata(file)

            for i,chunk in enumerate(chunks):
                all_chunks.append(
                    {
                        "id" : f"{file}_{i}",
                        "text" : chunk,
                        "metadata" : metadata
                    }
                )
    
    with open(OUTPUT_PATH,"w") as f:
        json.dump(all_chunks,f,indent = 2)

    print("Processing complete. Chunks saved.")

if __name__ == "__main__":
    process_documents()
            