from datetime import datetime, timedelta
import json
import os

MAPPING_FILE = "vector_store/mapping.json"

def check_expiry():
    if not os.path.exists(MAPPING_FILE):
        return

    with open(MAPPING_FILE, "r") as f:
        data = json.load(f)

    today = datetime.today()

    for doc_id, metadata in data.items():
        expiry = metadata.get("expiry_date")

        if expiry:
            expiry_date = datetime.strptime(expiry, "%Y-%m-%d")

            # Notify 7 days before expiry
            if today + timedelta(days=7) >= expiry_date:
                print(f"⚠ Document {metadata['filename']} is expiring on {expiry}")