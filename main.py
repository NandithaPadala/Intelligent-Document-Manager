from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from apscheduler.schedulers.background import BackgroundScheduler
import os
import pytesseract
import re
from PIL import Image
from docx import Document
from pydantic import BaseModel
import uuid

from datetime import datetime, timedelta
import json
from fastapi.middleware.cors import CORSMiddleware


from services.notification_service import check_expiry
from services.embedding_service import generate_embedding
from services.vector_service import add_vector, search_vector, delete_document_vectors
from services.ocr_service import extract_pdf_text
from services.classifier_service import classify_document
from services.storage_service import upload_file_to_supabase, download_file_from_supabase, delete_file_from_supabase, check_file_exists_in_supabase, get_file_url_from_supabase

scheduler = BackgroundScheduler()
scheduler.add_job(check_expiry, "interval", hours=24)
scheduler.start()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "storage"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.get("/")
def home():
    return {"message": "AI Document Manager Running Successfully"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
                      
    # Generate a unique random filename to prevent overwriting
    original_extension = file.filename.split(".")[-1] if "." in file.filename else ""
    unique_filename = f"{uuid.uuid4().hex}.{original_extension}" if original_extension else uuid.uuid4().hex
    
    # Save temporarily to extract text
    temp_file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

    with open(temp_file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Upload to Supabase and delete local copy
    upload_file_to_supabase(temp_file_path, unique_filename)

    extracted_text = extract_text(temp_file_path)
    cleaned_text = clean_text(extracted_text)

    # Remove temporary file after extraction
    if os.path.exists(temp_file_path):
        os.remove(temp_file_path)

    # ✅ Classify whole document
    doc_type, confidence = classify_document(cleaned_text)
    print("Detected doc type:", doc_type, "Confidence:", confidence)

    # ✅ Chunking for embeddings
    chunks = split_text(cleaned_text, chunk_size=200)

    for chunk in chunks:
        embedding = generate_embedding(chunk)
        add_vector(embedding, unique_filename, temp_file_path, doc_type, chunk, None)

    return {
        "message": "File uploaded and indexed successfully",
        "original_filename": file.filename,
        "saved_filename": unique_filename,
        "detected_type": doc_type,
        "confidence": confidence,
        "extracted_text_preview": cleaned_text[:500]
    }


def extract_text(file_path):
    extension = file_path.split(".")[-1].lower()

    if extension in ["jpg", "jpeg", "png"]:
        with Image.open(file_path) as image:
            return pytesseract.image_to_string(image)

    elif extension == "pdf":
        text = extract_pdf_text(file_path)
        return text

    elif extension == "docx":
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])

    elif extension == "txt":
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    else:
        return "Unsupported file format"

def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^a-zA-Z0-9 ]", " ", text)
    text = " ".join(text.split())
    return text


class QueryRequest(BaseModel):
    query: str
    doc_type: str = "All Types"
    min_score: float = 0.0


@app.post("/search")
def search_documents(request: QueryRequest):
    expanded_query = request.query
    if "10th"in expanded_query:
        expanded_query += "indian council ssc secondary examination"
    if "pan card" in expanded_query:
        expanded_query += "income tax"
    query_embedding = generate_embedding(expanded_query)

    results = search_vector(
        query_embedding, 
        request.query, 
        doc_type_filter=request.doc_type, 
        min_score_filter=request.min_score
    )

    return {"results": results}

def split_text(text, chunk_size=300):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunks.append(" ".join(words[i:i+chunk_size]))
    return chunks





@app.get("/notifications")
def get_expiring_documents():
    mapping_file = "vector_store/mapping.json"

    if not os.path.exists(mapping_file):
        return {"expiring_documents": []}

    with open(mapping_file, "r") as f:
        data = json.load(f)

    today = datetime.today()
    upcoming_threshold = today + timedelta(days=7)

    expiring_docs = {}

    for doc_id, metadata in data.items():
        expiry = metadata.get("expiry_date")

        if expiry:
            try:
                expiry_date = datetime.strptime(expiry, "%Y-%m-%d")

                if today <= expiry_date <= upcoming_threshold:
                    filename = metadata["filename"]

                    # Avoid duplicates (since multiple chunks exist)
                    expiring_docs[filename] = expiry

            except:
                continue

    results = [
        {"filename": fname, "expiry_date": date, "url": get_file_url_from_supabase(fname)}
        for fname, date in expiring_docs.items()
    ]

    return {"expiring_documents": results}


@app.get("/documents")
def get_all_documents():
    """Returns a list of all unique scanned documents."""
    mapping_file = "vector_store/mapping.json"
    
    if not os.path.exists(mapping_file):
        return {"documents": []}
        
    with open(mapping_file, "r") as f:
        data = json.load(f)
        
    # Fetch list of ALL files from Supabase once for performance
    supabase_files = set()
    try:
        from services.storage_service import supabase, bucket_name
        if supabase:
            bucket_files = supabase.storage.from_(bucket_name).list()
            for f in bucket_files:
                supabase_files.add(f.get("name"))
    except Exception as e:
        print(f"Error fetching Supabase files: {e}")
        
    # Extract unique documents since chunks might share filenames
    unique_docs = {}
    for doc_id, metadata in data.items():
        filename = metadata.get("filename")
        if filename and filename not in unique_docs:
            # Verify the file actually exists in Supabase before showing it
            if filename in supabase_files:
                file_url = get_file_url_from_supabase(filename)
                unique_docs[filename] = {
                    "filename": filename,
                    "doc_type": metadata.get("doc_type", "Unknown"),
                    "expiry_date": metadata.get("expiry_date"),
                    "url": file_url
                }
            
    return {"documents": list(unique_docs.values())}


@app.get("/documents/{filename}")
def get_document(filename: str):
    """Serve a specific document file by downloading it temporarily."""
    if not check_file_exists_in_supabase(filename):
        raise HTTPException(status_code=404, detail="File not found in Supabase")
        
    local_path = os.path.join(UPLOAD_FOLDER, filename)
    try:
        download_file_from_supabase(filename, local_path)
        return FileResponse(local_path, headers={"Cache-Control": "no-store"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{filename}")
def delete_document(filename: str):
    """Deletes a document from Supabase and the search index mapping."""
    
    # 1. Delete file from cloud
    file_deleted = delete_file_from_supabase(filename)
            
    # 2. Remove from vector mapping (soft delete from search)
    vectors_deleted = delete_document_vectors(filename)
    
    if not file_deleted and not vectors_deleted:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return {
        "message": f"Successfully deleted {filename}",
        "file_deleted": file_deleted,
        "search_index_updated": vectors_deleted
    }