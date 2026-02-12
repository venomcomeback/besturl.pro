from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import secrets
import jwt
from passlib.context import CryptContext
import string
import random
from user_agents import parse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
SECRET_KEY = os.environ.get('JWT_SECRET', secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI(title="LinkShortTR API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    username: str
    email: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class LinkCreate(BaseModel):
    original_url: str
    custom_slug: Optional[str] = None
    title: Optional[str] = None
    password: Optional[str] = None
    expires_at: Optional[datetime] = None
    generate_qr: bool = False

class LinkUpdate(BaseModel):
    title: Optional[str] = None
    password: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None

class Link(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    original_url: str
    short_code: str
    title: Optional[str] = None
    password_hash: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True
    click_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    qr_code: Optional[str] = None

class ClickEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    link_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_type: str = "unknown"
    browser: str = "unknown"
    os: str = "unknown"
    country: Optional[str] = None
    city: Optional[str] = None
    referrer: Optional[str] = None

class LinkPasswordVerify(BaseModel):
    password: str

# ==================== HELPERS ====================

def generate_short_code(length: int = 6) -> str:
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Yetkilendirme gerekli")
    
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Geçersiz token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Geçersiz token")

def parse_user_agent(ua_string: str) -> dict:
    try:
        ua = parse(ua_string)
        device_type = "mobile" if ua.is_mobile else ("tablet" if ua.is_tablet else "desktop")
        return {
            "device_type": device_type,
            "browser": ua.browser.family or "unknown",
            "os": ua.os.family or "unknown"
        }
    except:
        return {"device_type": "unknown", "browser": "unknown", "os": "unknown"}

def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if username exists
    existing = await db.users.find_one({"$or": [{"username": user_data.username}, {"email": user_data.email}]})
    if existing:
        raise HTTPException(status_code=400, detail="Kullanıcı adı veya e-posta zaten kayıtlı")
    
    user = User(
        username=user_data.username,
        email=user_data.email
    )
    user_dict = user.model_dump()
    user_dict["password_hash"] = hash_password(user_data.password)
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    insert_dict = user_dict.copy()
    await db.users.insert_one(insert_dict)
    
    access_token = create_access_token({"sub": user.id, "username": user.username, "is_admin": user.is_admin})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={"id": user.id, "username": user.username, "email": user.email, "is_admin": user.is_admin}
    )

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    user = await db.users.find_one({"username": login_data.username}, {"_id": 0})
    if not user or not verify_password(login_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Geçersiz kullanıcı adı veya şifre")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Hesap devre dışı")
    
    access_token = create_access_token({"sub": user["id"], "username": user["username"], "is_admin": user.get("is_admin", False)})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={"id": user["id"], "username": user["username"], "email": user["email"], "is_admin": user.get("is_admin", False)}
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "is_admin": current_user.get("is_admin", False),
        "created_at": current_user.get("created_at")
    }

# ==================== LINK ROUTES ====================

@api_router.post("/links")
async def create_link(link_data: LinkCreate, current_user: dict = Depends(get_current_user)):
    # Generate or validate short code
    if link_data.custom_slug:
        existing = await db.links.find_one({"short_code": link_data.custom_slug})
        if existing:
            raise HTTPException(status_code=400, detail="Bu kısa URL zaten kullanılıyor")
        short_code = link_data.custom_slug
    else:
        short_code = generate_short_code()
        while await db.links.find_one({"short_code": short_code}):
            short_code = generate_short_code()
    
    link = Link(
        user_id=current_user["id"],
        original_url=link_data.original_url,
        short_code=short_code,
        title=link_data.title or link_data.original_url[:50],
        expires_at=link_data.expires_at
    )
    
    link_dict = link.model_dump()
    if link_data.password:
        link_dict["password_hash"] = hash_password(link_data.password)
    
    # Serialize datetime fields
    if link_dict.get("created_at"):
        link_dict["created_at"] = link_dict["created_at"].isoformat()
    if link_dict.get("expires_at"):
        link_dict["expires_at"] = link_dict["expires_at"].isoformat()
    
    # Create a copy for insertion to avoid _id being added to response
    insert_dict = link_dict.copy()
    await db.links.insert_one(insert_dict)
    
    # Remove password_hash from response
    link_dict.pop("password_hash", None)
    link_dict.pop("_id", None)
    link_dict["has_password"] = link_data.password is not None
    
    return link_dict

@api_router.get("/links")
async def get_links(current_user: dict = Depends(get_current_user)):
    links = await db.links.find({"user_id": current_user["id"]}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    
    for link in links:
        link["has_password"] = await db.links.find_one({"id": link["id"], "password_hash": {"$exists": True, "$ne": None}}) is not None
    
    return links

@api_router.get("/links/{link_id}")
async def get_link(link_id: str, current_user: dict = Depends(get_current_user)):
    link = await db.links.find_one({"id": link_id, "user_id": current_user["id"]}, {"_id": 0, "password_hash": 0})
    if not link:
        raise HTTPException(status_code=404, detail="Link bulunamadı")
    return link

@api_router.put("/links/{link_id}")
async def update_link(link_id: str, link_data: LinkUpdate, current_user: dict = Depends(get_current_user)):
    link = await db.links.find_one({"id": link_id, "user_id": current_user["id"]})
    if not link:
        raise HTTPException(status_code=404, detail="Link bulunamadı")
    
    update_data = {}
    if link_data.title is not None:
        update_data["title"] = link_data.title
    if link_data.password is not None:
        update_data["password_hash"] = hash_password(link_data.password) if link_data.password else None
    if link_data.expires_at is not None:
        update_data["expires_at"] = link_data.expires_at.isoformat() if link_data.expires_at else None
    if link_data.is_active is not None:
        update_data["is_active"] = link_data.is_active
    
    if update_data:
        await db.links.update_one({"id": link_id}, {"$set": update_data})
    
    updated = await db.links.find_one({"id": link_id}, {"_id": 0, "password_hash": 0})
    return updated

@api_router.delete("/links/{link_id}")
async def delete_link(link_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.links.delete_one({"id": link_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Link bulunamadı")
    
    # Also delete click events
    await db.clicks.delete_many({"link_id": link_id})
    
    return {"message": "Link silindi"}

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/links/{link_id}/analytics")
async def get_link_analytics(link_id: str, current_user: dict = Depends(get_current_user)):
    link = await db.links.find_one({"id": link_id, "user_id": current_user["id"]}, {"_id": 0})
    if not link:
        raise HTTPException(status_code=404, detail="Link bulunamadı")
    
    # Get click events
    clicks = await db.clicks.find({"link_id": link_id}, {"_id": 0}).sort("timestamp", -1).to_list(10000)
    
    # Aggregate stats
    total_clicks = len(clicks)
    
    # Device breakdown
    devices = {}
    browsers = {}
    os_stats = {}
    countries = {}
    referrers = {}
    
    # Daily clicks for last 30 days
    daily_clicks = {}
    now = datetime.now(timezone.utc)
    for i in range(30):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_clicks[day] = 0
    
    for click in clicks:
        # Device
        device = click.get("device_type", "unknown")
        devices[device] = devices.get(device, 0) + 1
        
        # Browser
        browser = click.get("browser", "unknown")
        browsers[browser] = browsers.get(browser, 0) + 1
        
        # OS
        os_name = click.get("os", "unknown")
        os_stats[os_name] = os_stats.get(os_name, 0) + 1
        
        # Country
        country = click.get("country", "Bilinmiyor")
        countries[country] = countries.get(country, 0) + 1
        
        # Referrer
        referrer = click.get("referrer", "Doğrudan")
        referrers[referrer] = referrers.get(referrer, 0) + 1
        
        # Daily
        timestamp = click.get("timestamp")
        if timestamp:
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            day = timestamp.strftime("%Y-%m-%d")
            if day in daily_clicks:
                daily_clicks[day] += 1
    
    return {
        "link": link,
        "total_clicks": total_clicks,
        "devices": devices,
        "browsers": browsers,
        "os_stats": os_stats,
        "countries": countries,
        "referrers": referrers,
        "daily_clicks": [{"date": k, "clicks": v} for k, v in sorted(daily_clicks.items())],
        "recent_clicks": clicks[:100]
    }

@api_router.get("/analytics/overview")
async def get_analytics_overview(current_user: dict = Depends(get_current_user)):
    # Get user's links
    links = await db.links.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    link_ids = [link["id"] for link in links]
    
    total_links = len(links)
    active_links = sum(1 for link in links if link.get("is_active", True))
    
    # Get total clicks
    total_clicks = await db.clicks.count_documents({"link_id": {"$in": link_ids}})
    
    # Get today's clicks
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_clicks = await db.clicks.count_documents({
        "link_id": {"$in": link_ids},
        "timestamp": {"$gte": today_start.isoformat()}
    })
    
    # Top performing links
    top_links = sorted(links, key=lambda x: x.get("click_count", 0), reverse=True)[:5]
    
    return {
        "total_links": total_links,
        "active_links": active_links,
        "total_clicks": total_clicks,
        "today_clicks": today_clicks,
        "top_links": top_links
    }

# ==================== REDIRECT ROUTE ====================

@api_router.get("/r/{short_code}")
async def redirect_link(short_code: str, request: Request):
    link = await db.links.find_one({"short_code": short_code}, {"_id": 0})
    if not link:
        raise HTTPException(status_code=404, detail="Link bulunamadı")
    
    # Check if active
    if not link.get("is_active", True):
        raise HTTPException(status_code=410, detail="Bu link artık aktif değil")
    
    # Check expiration
    if link.get("expires_at"):
        expires = link["expires_at"]
        if isinstance(expires, str):
            expires = datetime.fromisoformat(expires.replace("Z", "+00:00"))
        if expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="Bu linkin süresi dolmuş")
    
    # Check if password protected
    if link.get("password_hash"):
        return {"requires_password": True, "link_id": link["id"]}
    
    # Record click
    ua_string = request.headers.get("user-agent", "")
    ua_info = parse_user_agent(ua_string)
    
    click = ClickEvent(
        link_id=link["id"],
        ip_address=request.client.host if request.client else None,
        user_agent=ua_string,
        device_type=ua_info["device_type"],
        browser=ua_info["browser"],
        os=ua_info["os"],
        referrer=request.headers.get("referer")
    )
    
    click_dict = click.model_dump()
    click_dict["timestamp"] = click_dict["timestamp"].isoformat()
    await db.clicks.insert_one(click_dict)
    
    # Increment click count
    await db.links.update_one({"id": link["id"]}, {"$inc": {"click_count": 1}})
    
    return RedirectResponse(url=link["original_url"], status_code=302)

@api_router.post("/r/{short_code}/verify")
async def verify_link_password(short_code: str, data: LinkPasswordVerify, request: Request):
    link = await db.links.find_one({"short_code": short_code}, {"_id": 0})
    if not link:
        raise HTTPException(status_code=404, detail="Link bulunamadı")
    
    if not link.get("password_hash"):
        return RedirectResponse(url=link["original_url"], status_code=302)
    
    if not verify_password(data.password, link["password_hash"]):
        raise HTTPException(status_code=401, detail="Yanlış şifre")
    
    # Record click
    ua_string = request.headers.get("user-agent", "")
    ua_info = parse_user_agent(ua_string)
    
    click = ClickEvent(
        link_id=link["id"],
        ip_address=request.client.host if request.client else None,
        user_agent=ua_string,
        device_type=ua_info["device_type"],
        browser=ua_info["browser"],
        os=ua_info["os"],
        referrer=request.headers.get("referer")
    )
    
    click_dict = click.model_dump()
    click_dict["timestamp"] = click_dict["timestamp"].isoformat()
    await db.clicks.insert_one(click_dict)
    
    await db.links.update_one({"id": link["id"]}, {"$inc": {"click_count": 1}})
    
    return {"redirect_url": link["original_url"]}

# ==================== ADMIN ROUTES ====================

async def require_admin(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    return current_user

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_links = await db.links.count_documents({})
    total_clicks = await db.clicks.count_documents({})
    
    # Today's stats
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_clicks = await db.clicks.count_documents({"timestamp": {"$gte": today_start.isoformat()}})
    today_links = await db.links.count_documents({"created_at": {"$gte": today_start.isoformat()}})
    
    return {
        "total_users": total_users,
        "total_links": total_links,
        "total_clicks": total_clicks,
        "today_clicks": today_clicks,
        "today_links": today_links
    }

@api_router.get("/admin/users")
async def get_all_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for user in users:
        user["link_count"] = await db.links.count_documents({"user_id": user["id"]})
    
    return users

@api_router.put("/admin/users/{user_id}/toggle-status")
async def toggle_user_status(user_id: str, admin: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    new_status = not user.get("is_active", True)
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": new_status}})
    
    return {"message": "Kullanıcı durumu güncellendi", "is_active": new_status}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    if user.get("is_admin"):
        raise HTTPException(status_code=400, detail="Admin kullanıcı silinemez")
    
    # Delete user's links and clicks
    user_links = await db.links.find({"user_id": user_id}, {"id": 1}).to_list(10000)
    link_ids = [link["id"] for link in user_links]
    
    await db.clicks.delete_many({"link_id": {"$in": link_ids}})
    await db.links.delete_many({"user_id": user_id})
    await db.users.delete_one({"id": user_id})
    
    return {"message": "Kullanıcı ve tüm verileri silindi"}

# ==================== SETUP ADMIN ====================

@app.on_event("startup")
async def setup_admin():
    admin = await db.users.find_one({"username": "venomcomeback"})
    if not admin:
        admin_user = User(
            username="venomcomeback",
            email="admin@linkshorttr.com",
            is_admin=True
        )
        admin_dict = admin_user.model_dump()
        admin_dict["password_hash"] = hash_password("Mert3213540")
        admin_dict["created_at"] = admin_dict["created_at"].isoformat()
        await db.users.insert_one(admin_dict)
        logger.info("Admin kullanıcı oluşturuldu: venomcomeback")

# ==================== ROOT ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "LinkShortTR API - Link Kısaltma Servisi"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
