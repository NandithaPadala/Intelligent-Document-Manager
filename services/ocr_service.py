import pdfplumber
from pdf2image import convert_from_path
import pytesseract
from PIL import Image

def extract_pdf_text(file_path):
    text = ""

    # Step 1: Try direct extraction
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages[:2]:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    # Step 2: If no text found → OCR fallback
    if text.strip() == "":
        print("No readable text found. Using OCR fallback.")
        images = convert_from_path(file_path, first_page=1, last_page=2)

        for image in images:
            text += pytesseract.image_to_string(image)

    return text
