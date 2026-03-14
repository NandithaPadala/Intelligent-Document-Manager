# Intelligent Document Manager

## 1. Clone the Repository
Open a terminal (or command prompt) and run:

```bash
git clone https://github.com/NandithaPadala/Intelligent-Document-Manager.git
cd Intelligent-Document-Manager
```

## 2. Backend Setup
Set up your Python environment and dependencies.

**A. Create and activate a virtual environment:**

*On Windows:*
```bash
python -m venv .venv
.venv\Scripts\activate
```

*On macOS/Linux:*
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**B. Install dependencies:**

```bash
pip install -r requirements.txt
```

**C. Create your `.env` file!**
Since this was ignored by git for security, you MUST create a new file named `.env` in the root folder (`Intelligent Document Manager/.env`) and add your Supabase credentials:

```env
SUPABASE_URL=https://yaonoipuxaymcmlzogfx.supabase.co
SUPABASE_KEY=your_actual_supabase_key_here
SUPABASE_BUCKET=documents
```

*(Make sure to paste your actual huge Supabase JWT key where it says `your_actual_supabase_key_here`)*

**D. Install System Dependencies (Tesseract OCR):**
Because the project uses `pytesseract` for image text extraction, you must install the Tesseract application on the new system:

* **Windows:** Download the installer from the [UB-Mannheim Tesseract GitHub](https://github.com/UB-Mannheim/tesseract/wiki) and add it to your system PATH.
* **macOS:** `brew install tesseract`
* **Linux:** `sudo apt install tesseract-ocr`

**E. Run the Backend:**

```bash
uvicorn main:app --reload
```

## 3. Frontend Setup
Open a new terminal window (leave the backend running) and navigate to your `frontend` folder.

**A. Navigate to the frontend folder:**

```bash
cd frontend
```

**B. Install Node dependencies:** 
*(Make sure [Node.js](https://nodejs.org/) is installed on the new system)*

```bash
npm install
```

**C. Run the Frontend:**

```bash
npm run dev
```

The terminal will give you a local URL (usually `http://localhost:5173`) where you can access the Intelligent Document Manager UI!
