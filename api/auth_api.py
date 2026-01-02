import os
import hashlib
import secrets
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from storage.postgres_repository import get_db_connection

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt from environment"""
    salt = os.getenv("PASSWORD_SALT", "damshique_default_salt_2024")
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

@router.post("/login")
async def login(credentials: Dict[str, Any] = Body(...)):
    """
    Authenticate admin user and return session token.
    Credentials are validated against the database.
    """
    username = credentials.get("username")
    password = credentials.get("password")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    conn = await get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Hash the provided password
        password_hash = hash_password(password)
        
        # Check if user exists with matching credentials
        user = await conn.fetchrow("""
            SELECT phone, name, role, is_approved, session_token 
            FROM system_users 
            WHERE username = $1 AND password_hash = $2 AND role = 'admin' AND is_approved = TRUE
        """, username, password_hash)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Generate or retrieve session token
        session_token = user['session_token']
        if not session_token:
            # Generate new session token
            session_token = secrets.token_hex(32)
            await conn.execute("""
                UPDATE system_users 
                SET session_token = $1, last_login = NOW() 
                WHERE username = $2
            """, session_token, username)
        else:
            # Update last login
            await conn.execute("""
                UPDATE system_users 
                SET last_login = NOW() 
                WHERE username = $1
            """, username)
        
        return {
            "success": True,
            "token": session_token,
            "user": {
                "name": user['name'],
                "role": user['role']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")
    finally:
        await conn.close()

@router.post("/logout")
async def logout(payload: Dict[str, Any] = Body(...)):
    """Invalidate session token"""
    token = payload.get("token")
    
    if not token:
        return {"success": True}
    
    conn = await get_db_connection()
    if not conn:
        return {"success": True}
    
    try:
        await conn.execute("""
            UPDATE system_users 
            SET session_token = NULL 
            WHERE session_token = $1
        """, token)
        return {"success": True}
    except Exception as e:
        print(f"Logout error: {e}")
        return {"success": True}
    finally:
        await conn.close()
