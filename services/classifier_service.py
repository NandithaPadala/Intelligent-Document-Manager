from transformers import pipeline

classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)

DOC_CATEGORIES = [
    "student ID card",
    "PAN card",
    "Aadhaar card",
    "passport document",
    "marks sheet",
    "fee receipt",
    "invoices",
    "medical bills",
    "resumes",
    "certificates",
    "other document",
]

def classify_document(text):
    result = classifier(text[:1000], DOC_CATEGORIES)

    label = result["labels"][0]
    score = result["scores"][0]

    return label, float(score)
