# Secure Authentication System

## Overview
The application now uses a secure, database-backed authentication system instead of hardcoded credentials.

## Security Improvements
1. **No Hardcoded Credentials**: All credentials are now stored securely in the database with hashed passwords
2. **Session Tokens**: Each login generates a unique session token stored in the database
3. **Token Validation**: All API requests validate session tokens against the database
4. **Logout Support**: Proper logout functionality that invalidates session tokens

## Default Admin Account
- **Username**: `admin`
- **Password**: `Michu`
- **⚠️ IMPORTANT**: Change this password immediately after first login!

## Changing the Admin Password

### Method 1: Using SQL (Recommended for initial setup)
```sql
-- Generate a new password hash
-- Replace 'YourNewPassword' with your desired password
-- The hash is SHA-256 of: damshique_default_salt_2024 + YourNewPassword

UPDATE system_users 
SET password_hash = '<your_new_hash_here>' 
WHERE username = 'admin';
```

### Method 2: Using Python Script
```python
import hashlib

def hash_password(password: str) -> str:
    salt = "damshique_default_salt_2024"  # Must match PASSWORD_SALT in .env
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

# Generate hash for your new password
new_password = "YourNewSecurePassword"
new_hash = hash_password(new_password)
print(f"New password hash: {new_hash}")
```

## Environment Variables
Add to your `.env` file:
```
PASSWORD_SALT=damshique_default_salt_2024
```

**⚠️ IMPORTANT**: Change the `PASSWORD_SALT` to a unique value for your deployment and update all password hashes accordingly.

## How It Works

### Login Flow
1. User enters username and password in the frontend
2. Frontend sends credentials to `/api/auth/login`
3. Backend hashes the password and validates against database
4. If valid, backend generates/retrieves a session token
5. Session token is returned to frontend and stored in localStorage
6. All subsequent API calls include this session token

### API Request Flow
1. Frontend retrieves session token from localStorage using `getAdminToken()`
2. Token is included in request headers as `X-API-Token`
3. Backend validates token against `system_users` table
4. If valid and user is admin with approved status, request proceeds
5. If invalid/expired, request is rejected with 403 error

### Logout Flow
1. User clicks logout button
2. Frontend calls `/api/auth/logout` with current token
3. Backend invalidates the session token in database
4. Frontend clears localStorage and redirects to login

## Database Schema
```sql
ALTER TABLE system_users 
ADD COLUMN username VARCHAR(100) UNIQUE,
ADD COLUMN password_hash VARCHAR(64),
ADD COLUMN session_token VARCHAR(64) UNIQUE,
ADD COLUMN last_login TIMESTAMP;
```

## Security Best Practices
1. **Change Default Password**: Immediately change the default admin password
2. **Use Strong Passwords**: Minimum 12 characters with mixed case, numbers, and symbols
3. **Rotate Salt**: Change the PASSWORD_SALT value and regenerate all password hashes
4. **HTTPS Only**: Always use HTTPS in production to protect session tokens
5. **Session Expiry**: Consider implementing session expiry (currently sessions don't expire)
6. **Rate Limiting**: Implement rate limiting on login endpoint to prevent brute force attacks

## Migration
The migration file `migrations/006_add_authentication.sql` will:
1. Add authentication columns to system_users table
2. Create necessary indexes
3. Insert the default admin user

Run migrations with:
```bash
# Migrations run automatically on startup
# Or manually run the SQL file against your database
```

## Troubleshooting

### "Invalid credentials" error
- Verify username and password are correct
- Check that user exists in system_users table
- Ensure user has `role = 'admin'` and `is_approved = TRUE`

### "Access Denied" on API calls
- Check that session token exists in localStorage
- Verify token hasn't been invalidated
- Ensure token exists in database with valid admin user

### Can't login after password change
- Verify password hash was generated correctly
- Ensure PASSWORD_SALT matches between hash generation and backend
- Check database connection is working
