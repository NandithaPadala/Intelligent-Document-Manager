from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

model = SentenceTransformer("all-MiniLM-L6-v2")


def generate_embedding(text):
    embedding = model.encode(text)
    embedding = np.array([embedding]).astype("float32")
    faiss.normalize_L2(embedding)
    return embedding
