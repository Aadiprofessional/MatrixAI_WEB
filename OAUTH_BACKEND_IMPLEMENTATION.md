# OAuth Backend Implementation Guide

This document outlines the backend endpoints that need to be implemented to support Google OAuth authentication with Supabase.

## Required Backend Endpoints

### 1. Check OAuth User Endpoint

**Endpoint:** `POST /api/user/check-oauth-user`

**Purpose:** Check if a user authenticated via OAuth already exists in the backend database.

**Request Body:**
```json
{
  "uid": "supabase-user-id",
  "email": "user@example.com",
  "provider": "google"
}
```

**Response (User Exists):**
```json
{
  "exists": true,
  "user": {
    "uid": "supabase-user-id",
    "email": "user@example.com",
    "name": "User Name",
    "avatar_url": "https://example.com/avatar.jpg",
    "subscription_active": false,
    "credits": 100,
    "provider": "google",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response (User Doesn't Exist):**
```json
{
  "exists": false
}
```

### 2. Create OAuth User Endpoint

**Endpoint:** `POST /api/user/create-oauth-user`

**Purpose:** Create a new user in the backend database for OAuth-authenticated users.

**Request Body:**
```json
{
  "uid": "supabase-user-id",
  "email": "user@example.com",
  "name": "User Name",
  "provider": "google",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "uid": "supabase-user-id",
    "email": "user@example.com",
    "name": "User Name",
    "avatar_url": "https://example.com/avatar.jpg",
    "subscription_active": false,
    "credits": 100,
    "provider": "google",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error message describing what went wrong"
}
```

## Database Schema

The backend should have a users table with the following structure:

```sql
CREATE TABLE users (
  uid VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  subscription_active BOOLEAN DEFAULT FALSE,
  credits INTEGER DEFAULT 100,
  provider VARCHAR(50) DEFAULT 'email',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Implementation Notes

1. **UID Consistency:** The `uid` field should match the Supabase user ID exactly to maintain consistency between Supabase auth and your backend database.

2. **Error Handling:** Both endpoints should return appropriate HTTP status codes:
   - 200: Success
   - 400: Bad request (invalid data)
   - 404: Endpoint not found (handled gracefully by frontend)
   - 500: Internal server error

3. **Security:** Ensure proper validation of the incoming data and consider implementing rate limiting to prevent abuse.

4. **Fallback Behavior:** The frontend has been updated to handle cases where these endpoints don't exist yet by creating temporary user data from the Supabase session.

## Current Frontend Behavior

Until these endpoints are implemented, the frontend will:

1. Attempt to call the OAuth endpoints
2. If endpoints return 404 or network errors occur, create temporary user data from Supabase session
3. Allow users to continue using the application with basic functionality
4. Log warnings in the console indicating that backend OAuth integration is pending

## Testing

Once implemented, test the OAuth flow by:

1. Attempting Google login with a new user
2. Verifying the user is created in your backend database
3. Attempting Google login with an existing user
4. Verifying the existing user data is retrieved correctly
5. Checking that the frontend receives and stores the user data properly