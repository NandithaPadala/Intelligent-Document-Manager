import os
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
bucket_name: str = os.environ.get("SUPABASE_BUCKET", "documents")

if url and key:
    supabase: Client = create_client(url, key)
else:
    supabase = None

import mimetypes

def upload_file_to_supabase(file_path: str, filename: str) -> str:
    """Uploads a local file to Supabase Storage."""
    if not supabase:
        raise Exception("Supabase client not initialized")
        
    try:
        content_type, _ = mimetypes.guess_type(filename)
        if not content_type:
            content_type = "application/octet-stream"
            
        with open(file_path, "rb") as f:
            # We use upsert=True to overwrite if it exists, though filenames should be unique
            supabase.storage.from_(bucket_name).upload(
                path=filename, 
                file=f, 
                file_options={"content-type": content_type, "upsert": "true", "x-upsert": "true"}
            )
            
        # Get public URL if bucket is public
        # url = supabase.storage.from_(bucket_name).get_public_url(filename)
        return filename
    except Exception as e:
        print(f"Error uploading to Supabase: {e}")
        raise e

def download_file_from_supabase(filename: str, local_path: str) -> str:
    """Downloads a file from Supabase Storage to a local path."""
    if not supabase:
        raise Exception("Supabase client not initialized")
        
    try:
        response = supabase.storage.from_(bucket_name).download(filename)
        with open(local_path, "wb") as f:
            f.write(response)
        return local_path
    except Exception as e:
        print(f"Error downloading from Supabase: {e}")
        raise e

def delete_file_from_supabase(filename: str) -> bool:
    """Deletes a file from Supabase Storage."""
    if not supabase:
        raise Exception("Supabase client not initialized")
        
    try:
        response = supabase.storage.from_(bucket_name).remove([filename])
        return len(response) > 0
    except Exception as e:
        print(f"Error deleting from Supabase: {e}")
        return False

def check_file_exists_in_supabase(filename: str) -> bool:
    """Checks if a file exists in Supabase Storage."""
    if not supabase:
        return False
        
    try:
        # We can list files in the bucket and filter in python
        files = supabase.storage.from_(bucket_name).list()
        return any(f.get("name") == filename for f in files)
    except Exception as e:
        print(f"Error checking file existence in Supabase: {e}")
        return False

def get_file_url_from_supabase(filename: str) -> str:
    """Gets the public or signed URL for a file."""
    if not supabase:
        return ""
    try:
        return supabase.storage.from_(bucket_name).get_public_url(filename)
    except Exception:
        return ""
