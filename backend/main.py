import os
import io
import json
import uuid
import shutil
import httpx
from pathlib import Path
from datetime import datetime, timedelta

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from PIL import Image
from dotenv import load_dotenv
import jwt
from passlib.context import CryptContext

load_dotenv()

import cloudinary
import cloudinary.uploader
import cloudinary.api

import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("backend.main")

# ==========================================
# CONSTANTS & CONFIG
# ==========================================
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "your-anon-key")

CLOUDINARY_URL = os.environ.get("CLOUDINARY_URL")
if CLOUDINARY_URL:
    # Clean up any accidental hidden spaces or quotes from the .env file
    clean_url = CLOUDINARY_URL.strip().replace('"', '').replace("'", "")
    
    # Overwrite the environment variable with the clean version
    os.environ["CLOUDINARY_URL"] = clean_url
    
    # Cloudinary automatically reads os.environ["CLOUDINARY_URL"] natively!
    cloudinary.config(secure=True)
else:
    logger.error("CLOUDINARY_URL is missing from the .env file")

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-local-jwt-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

BASE_DIR = Path(__file__).parent
LOCAL_DATA_DIR = BASE_DIR / "local_data"
LOCAL_DATA_DIR.mkdir(exist_ok=True)

MAX_JSON_SIZE = 10 * 1024 * 1024  # 10 MB limit

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==========================================
# FASTAPI APP SETUP
# ==========================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the local_data dir for images statically
app.mount("/brands-static", StaticFiles(directory=str(LOCAL_DATA_DIR)), name="brands-static")
app.mount("/static", StaticFiles(directory=str(LOCAL_DATA_DIR)), name="static")

# ==========================================
# SUPABASE HTTPX 
# ==========================================
def supabase_headers() -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

# ==========================================
# AUTHENTICATION
# ==========================================
class AuthRequest(BaseModel):
    email: str
    password: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/api/auth/signup")
async def signup(req: AuthRequest):
    logger.info(f"Signup attempt for email: {req.email}")
    async with httpx.AsyncClient() as client:
        # Custom users table
        try:
            res = await client.get(f"{SUPABASE_URL}/rest/v1/brand_users?email=eq.{req.email}", headers=supabase_headers())
            if res.status_code == 404 or "relation" in res.text:
                raise HTTPException(status_code=500, detail="Supabase table 'brand_users' does not exist. Please run the SQL schema setup!")
                
            if res.json():
                raise HTTPException(status_code=400, detail="Email already registered")
        except httpx.RequestError as e:
            logger.error(f"HTTPX Error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to connect to Database")

    user_id = str(uuid.uuid4())
    pass_hash = get_password_hash(req.password)
    
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{SUPABASE_URL}/rest/v1/brand_users",
            json={"id": user_id, "email": req.email, "password_hash": pass_hash},
            headers=supabase_headers()
        )
        if res.status_code >= 400:
            logger.error(f"Failed to insert user: {res.text}")
            raise HTTPException(status_code=500, detail="Database insertion failed")
            
    token = create_access_token({"sub": user_id, "email": req.email})
    return {"session": {"access_token": token, "user": {"id": user_id, "email": req.email}}}

@app.post("/api/auth/login")
async def login(req: AuthRequest):
    logger.info(f"Login attempt for email: {req.email}")
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{SUPABASE_URL}/rest/v1/brand_users?email=eq.{req.email}", headers=supabase_headers())
        if res.status_code == 404 or "relation" in res.text:
            raise HTTPException(status_code=500, detail="Supabase table 'brand_users' does not exist. Please run the SQL schema setup!")
        users = res.json()
        
    if not users or not verify_password(req.password, users[0]["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    user = users[0]
    token = create_access_token({"sub": user["id"], "email": user["email"]})
    return {"session": {"access_token": token, "user": {"id": user["id"], "email": user["email"]}}}

# ==========================================
# HELPERS
# ==========================================
def process_image(file_bytes: bytes, max_width: int, fmt: str = 'JPEG') -> bytes:
    img = Image.open(io.BytesIO(file_bytes))
    if img.width > max_width:
        ratio = max_width / img.width
        img = img.resize((max_width, int(img.height * ratio)), Image.LANCZOS)
    if img.mode in ("RGBA", "P") and fmt == 'JPEG':
        img = img.convert("RGB")
    out = io.BytesIO()
    img.save(out, format=fmt, quality=85)
    return out.getvalue()

def save_image_locally(user_id: str, id: str, filename: str, data: bytes) -> str:
    if CLOUDINARY_URL:
        try:
            # Uploading to Cloudinary
            folder_path = f"brands/{user_id}/{id}"
            res = cloudinary.uploader.upload(data, folder=folder_path, resource_type="image")
            return res.get("secure_url")
        except Exception as e:
            logger.error(f"Cloudinary image upload failed: {e}")
            raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")
        
    # user_dir = LOCAL_DATA_DIR / user_id / "images" / id
    # ...
    raise Exception("Cloudinary not configured. Local storage disabled.")

def save_json_bundle(user_id: str, id: str, data: dict):
    if CLOUDINARY_URL:
        try:
            folder_path = f"brands/{user_id}/{id}"
            # Convert dict to bytes
            json_bytes = json.dumps(data).encode("utf-8")
            res = cloudinary.uploader.upload(json_bytes, folder=folder_path, resource_type="raw", public_id=f"{id}.json")
            return res.get("secure_url")
        except Exception as e:
            logger.error(f"Cloudinary JSON upload failed: {e}")
            raise HTTPException(status_code=500, detail=f"Cloudinary JSON upload failed: {str(e)}")
        
    # user_dir = LOCAL_DATA_DIR / user_id / "json"
    # user_dir.mkdir(parents=True, exist_ok=True)
    # local_path = user_dir / f"{id}.json"
    # with open(local_path, "w", encoding="utf-8") as f:
    #     json.dump(data, f)
    # return None
    raise Exception("Cloudinary not configured. Local storage disabled.")

async def fetch_json_bundle(user_id: str, id: str, cloudinary_url: str = None) -> dict:
    if cloudinary_url and isinstance(cloudinary_url, str) and cloudinary_url.startswith("http"):
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(cloudinary_url)
                if res.status_code == 200:
                    return res.json()
        except Exception as e: 
            logger.error(f"Failed to fetch JSON from Cloudinary: {e}")
        
    local_path = LOCAL_DATA_DIR / user_id / "json" / f"{id}.json"
    if local_path.exists():
        with open(local_path, "r", encoding="utf-8") as f:
            try: return json.load(f)
            except: pass
    return {}

# ==========================================
# PROJECT ENDPOINTS
# ==========================================
@app.get("/api/brands")
async def get_brands(user_id: str = Depends(get_user_id)):
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{SUPABASE_URL}/rest/v1/projects?user_id=eq.{user_id}", headers=supabase_headers())
        if res.status_code != 200: return {}
        brands = res.json()
    
    result = {}
    for brand in brands:
        tokens = brand.get("tokens")
        if isinstance(tokens, str):
            try: tokens = json.loads(tokens)
            except: tokens = {}
            
        b_url = tokens.get("_bundle_url") if isinstance(tokens, dict) else None
        b_data = await fetch_json_bundle(user_id, brand["id"], b_url)
            
        result[brand["id"]] = {
            "id": brand["id"],
            "label": brand.get("label", ""),
            "description": brand.get("description", ""),
            "tagline": brand.get("tagline", ""),
            "tokens": tokens or {},
            "logo": brand.get("logo_url", "").replace("/static/", "/brands-static/"),
            "heroBg": brand.get("hero_bg_url", "").replace("/static/", "/brands-static/"),
            "is_shared": bool(brand.get("is_shared", False)),
            "config": b_data.get("config", {}),
            "data": b_data.get("data", {}),
        }
    return result

@app.get("/api/brands/{id}")
async def get_brand(id: str, user_id: str = Depends(get_user_id)):
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(f"{SUPABASE_URL}/rest/v1/projects?id=eq.{id}&user_id=eq.{user_id}", headers=supabase_headers())
            res.raise_for_status()
            if not res.json(): raise HTTPException(status_code=404, detail="Brand not found")
            brand = res.json()[0]
        except httpx.HTTPStatusError as e:
            logger.error(f"Supabase GET error: {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail="Database fetch failed")
        
    tokens = brand.get("tokens")
    if isinstance(tokens, str):
        try: tokens = json.loads(tokens)
        except: tokens = {}

    b_url = tokens.get("_bundle_url") if isinstance(tokens, dict) else None
    b_data = await fetch_json_bundle(user_id, id, b_url)

    return {
        "id": brand["id"],
        "label": brand.get("label", ""),
        "description": brand.get("description", ""),
        "tagline": brand.get("tagline", ""),
        "tokens": tokens or {},
        "logo": brand.get("logo_url", "").replace("/static/", "/brands-static/"),
        "heroBg": brand.get("hero_bg_url", "").replace("/static/", "/brands-static/"),
        "is_shared": bool(brand.get("is_shared", False)),
        "config": b_data.get("config", {}),
        "data": b_data.get("data", {}),
    }

@app.get("/api/public/brands/{id}")
async def get_public_brand(id: str):
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{SUPABASE_URL}/rest/v1/projects?id=eq.{id}&is_shared=is.true", headers=supabase_headers())
        if res.status_code != 200 or not res.json(): raise HTTPException(status_code=404, detail="Brand not found or not public")
        brand = res.json()[0]
    
    tokens = brand.get("tokens")
    if isinstance(tokens, str):
        try: tokens = json.loads(tokens)
        except: tokens = {}

    owner_id = brand["user_id"]
    b_url = tokens.get("_bundle_url") if isinstance(tokens, dict) else None
    b_data = await fetch_json_bundle(owner_id, id, b_url)

    return {
        "id": brand["id"],
        "label": brand.get("label", ""),
        "description": brand.get("description", ""),
        "tagline": brand.get("tagline", ""),
        "tokens": tokens or {},
        "logo": brand.get("logo_url", "").replace("/static/", "/brands-static/"),
        "heroBg": brand.get("hero_bg_url", "").replace("/static/", "/brands-static/"),
        "config": b_data.get("config", {}),
        "data": b_data.get("data", {}),
    }

@app.patch("/api/brands/{id}/share")
async def set_share_status(id: str, is_shared: bool = Body(..., embed=True), user_id: str = Depends(get_user_id)):
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/projects?id=eq.{id}&user_id=eq.{user_id}",
            json={"is_shared": is_shared},
            headers=supabase_headers()
        )
    return {"success": True}

@app.post("/api/brands")
async def create_brand(
    bundle: str = Form(...),
    label: str = Form(None),
    logo: UploadFile = File(None),
    background: UploadFile = File(None),
    user_id: str = Depends(get_user_id)
):
    if len(bundle.encode("utf-8")) > MAX_JSON_SIZE:
        raise HTTPException(status_code=400, detail="JSON bundle exceeds 10MB limit")
        
    try: parsed = json.loads(bundle)
    except: raise HTTPException(status_code=400, detail="Invalid JSON format")
    
    config = parsed.get("config", {})
    data = parsed.get("data", {})
    brand_tokens = parsed.get("brand") or parsed.get("tokens") or {}
    
    base_id = config.get("id", str(uuid.uuid4()))
    # Always append a small random suffix on creation to avoid Supabase 409 Conflict in serverless environments
    final_id = f"{base_id}-{uuid.uuid4().hex[:6]}"
    
    user_dir = LOCAL_DATA_DIR / user_id / "json"
    user_dir.mkdir(parents=True, exist_ok=True)
        
    cloud_url = save_json_bundle(user_id, final_id, {"config": config, "data": data})
    if cloud_url:
        brand_tokens["_bundle_url"] = cloud_url
        
    logo_url = ""
    if logo:
        fmt = "PNG" if logo.filename.lower().endswith(".png") else "JPEG"
        img_bytes = process_image(await logo.read(), max_width=560, fmt=fmt)
        ext = "png" if fmt == "PNG" else "jpg"
        logo_url = save_image_locally(user_id, final_id, f"logo.{ext}", img_bytes)
        
    bg_url = ""
    if background:
        img_bytes = process_image(await background.read(), max_width=1920, fmt="JPEG")
        bg_url = save_image_locally(user_id, final_id, "background.jpg", img_bytes)

    project_data = {
        "id": final_id,
        "user_id": user_id,
        "label": label or parsed.get("label") or config.get("fullName") or config.get("name") or final_id,
        "description": parsed.get("description") or config.get("name", ""),
        "tagline": parsed.get("tagline", ""),
        "tokens": brand_tokens, # Dict will be correctly persisted as JSON in Postgres
        "logo_url": logo_url,
        "hero_bg_url": bg_url,
        "is_shared": False
    }
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(f"{SUPABASE_URL}/rest/v1/projects", json=project_data, headers=supabase_headers())
            res.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error(f"Supabase POST error: {e.response.text}")
            # Check for common "New tables will not have Row Level Security enabled" issues
            # which usually manifest as 400 Bad Request or 403 Forbidden
            raise HTTPException(status_code=400, detail=f"Database save failed: {e.response.text}")
    
    return {
        "id": final_id,
        "label": project_data["label"],
        "logo": logo_url,
        "heroBg": bg_url,
        "config": config,
        "data": data,
        "tokens": brand_tokens,
    }

@app.put("/api/brands/{id}")
async def update_brand(
    id: str,
    bundle: str = Form(None),
    label: str = Form(None),
    tokens: str = Form(None),
    logo: UploadFile = File(None),
    background: UploadFile = File(None),
    user_id: str = Depends(get_user_id)
):
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{SUPABASE_URL}/rest/v1/projects?id=eq.{id}&user_id=eq.{user_id}", headers=supabase_headers())
        if res.status_code != 200 or not res.json(): raise HTTPException(status_code=404, detail="Brand not found")
        ext_project = res.json()[0]
        
    update_data = {}
    
    if label:
        update_data["label"] = label
        
    if tokens:
        try:
            t = json.loads(tokens)
            curr = ext_project.get("tokens") or {}
            if isinstance(curr, str): curr = json.loads(curr)
            curr.update(t)
            update_data["tokens"] = curr
        except: pass

    user_dir = LOCAL_DATA_DIR / user_id / "json"
    user_dir.mkdir(parents=True, exist_ok=True)
    local_path = user_dir / f"{id}.json"

    if bundle:
        if len(bundle.encode("utf-8")) > MAX_JSON_SIZE:
             raise HTTPException(status_code=400, detail="JSON bundle exceeds 10MB limit")
        try:
            parsed = json.loads(bundle)
            if local_path.exists():
                with open(local_path, "r", encoding="utf-8") as f:
                    curr_json = json.load(f)
            else:
                curr_json = {"config": {}, "data": {}}
                
            if "config" in parsed: curr_json["config"] = parsed["config"]
            if "data" in parsed: curr_json["data"] = parsed["data"]
            
            cloud_url = save_json_bundle(user_id, id, curr_json)
            
            brand_src = parsed.get("brand") or parsed.get("tokens")
            if brand_src or cloud_url:
                curr_t = ext_project.get("tokens") or {}
                if isinstance(curr_t, str): curr_t = json.loads(curr_t)
                if brand_src: curr_t.update(brand_src)
                if cloud_url: curr_t["_bundle_url"] = cloud_url
                update_data["tokens"] = curr_t
        except: pass

    if logo:
        fmt = "PNG" if logo.filename.lower().endswith(".png") else "JPEG"
        img_bytes = process_image(await logo.read(), max_width=560, fmt=fmt)
        ext = "png" if fmt == "PNG" else "jpg"
        update_data["logo_url"] = save_image_locally(user_id, id, f"logo.{ext}", img_bytes)

    if background:
        img_bytes = process_image(await background.read(), max_width=1920, fmt="JPEG")
        update_data["hero_bg_url"] = save_image_locally(user_id, id, "background.jpg", img_bytes)

    if update_data:
        async with httpx.AsyncClient() as client:
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/projects?id=eq.{id}&user_id=eq.{user_id}",
                json=update_data,
                headers=supabase_headers()
            )
            
    return {"success": True}

@app.delete("/api/brands/{id}")
async def delete_brand(id: str, user_id: str = Depends(get_user_id)):
    async with httpx.AsyncClient() as client:
        await client.delete(f"{SUPABASE_URL}/rest/v1/projects?id=eq.{id}&user_id=eq.{user_id}", headers=supabase_headers())
    
    if CLOUDINARY_URL:
        try:
            cloudinary.api.delete_resources_by_prefix(f"brands/{user_id}/{id}/")
            cloudinary.api.delete_folder(f"brands/{user_id}/{id}")
        except Exception as e:
            logger.error(f"Cloudinary delete error: {e}")
            
    # local_path = LOCAL_DATA_DIR / user_id / "json" / f"{id}.json"
    # if local_path.exists():
    #     os.remove(local_path)
    #     
    # image_dir = LOCAL_DATA_DIR / user_id / "images" / id
    # if image_dir.exists():
    #     shutil.rmtree(image_dir)
        
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)