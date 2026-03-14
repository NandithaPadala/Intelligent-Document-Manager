import faiss
import numpy as np
import os
import json

from services.storage_service import check_file_exists_in_supabase, get_file_url_from_supabase

INDEX_FILE = "vector_store/index.bin"
MAPPING_FILE = "vector_store/mapping.json"

dimension = 384

os.makedirs("vector_store", exist_ok=True)

# Load or create index
if os.path.exists(INDEX_FILE):
    index = faiss.read_index(INDEX_FILE)
else:
    index = faiss.IndexFlatIP(dimension)

# Load or create mapping
if os.path.exists(MAPPING_FILE):
    with open(MAPPING_FILE, "r") as f:
        doc_mapping = json.load(f)
else:
    doc_mapping = {}


def add_vector(embedding, filename, file_path, doc_type, chunk_text,expiry_date):
    global index, doc_mapping

    # Get the ID that this vector will be assigned by FAISS
    doc_id = str(index.ntotal)

    index.add(embedding)

    doc_mapping[doc_id] = {
        "filename": filename,
        "file_path": file_path,
        "doc_type": doc_type,
        "expiry_date" : expiry_date,
        "chunk_text": chunk_text
    }


    faiss.write_index(index, INDEX_FILE)

    with open(MAPPING_FILE, "w") as f:
        json.dump(doc_mapping, f)


def search_vector(query_embedding, query_text, k=50, doc_type_filter="All Types", min_score_filter=0.0):
    distances, indices = index.search(query_embedding, k)

    document_scores = {}
    query_words = query_text.lower().split()
    total_query_words = len(query_words)

    for i, idx in enumerate(indices[0]):
        cosine_score = distances[0][i]

        if str(idx) in doc_mapping:
            metadata = doc_mapping[str(idx)]
            filename = metadata["filename"]
            
            # Verify file exists physically in Supabase (or trust the map)
            if not check_file_exists_in_supabase(filename):
                continue

                
            chunk_text = metadata.get("chunk_text", "").lower()

            # --------- Lexical Score ----------
            match_count = sum(
                1 for word in query_words if word in chunk_text
            )

            lexical_score = (
                match_count / total_query_words
                if total_query_words > 0 else 0
            )

            # --------- Final Hybrid Score ----------
            final_score = (
                    0.60 * cosine_score +
                    0.40 * lexical_score
            )

            # --- Filters ---
            if min_score_filter > 0 and final_score < min_score_filter:
                continue
                
            doc_type = metadata.get("doc_type", "Unknown")
            if doc_type_filter and doc_type_filter != "All Types" and doc_type_filter.lower() not in doc_type.lower():
                continue

            # Keep highest score per document
            if filename not in document_scores:
                document_scores[filename] = {
                    "score": float(final_score),
                    "metadata": metadata
                }
            else:
                if final_score > document_scores[filename]["score"]:
                    document_scores[filename] = {
                        "score": float(final_score),
                        "metadata": metadata
                    }

    results = [
        {
            "filename": fname,
            "score": data["score"],
            "metadata": {**data["metadata"], "url": get_file_url_from_supabase(fname)}
        }
        for fname, data in sorted(
            document_scores.items(),
            key=lambda x: x[1]["score"],
            reverse=True
        )
    ]

    return results[:5]

def delete_document_vectors(filename: str) -> bool:
    """Soft deletes a document from search by removing it from the mapping file."""
    global doc_mapping
    
    keys_to_delete = []
    for doc_id, metadata in doc_mapping.items():
        if metadata.get("filename") == filename:
            keys_to_delete.append(doc_id)
            
    if not keys_to_delete:
        return False
        
    for key in keys_to_delete:
        del doc_mapping[key]
        
    with open(MAPPING_FILE, "w") as f:
        json.dump(doc_mapping, f)
        
    return True
