# SSO (Single Sign-On) API Implementation Guide

## Overview
This document describes the API endpoint needed to support Google OAuth SSO authentication.

## Required API Endpoint

### POST /api/Usermaster/sso-login

**Purpose**: Authenticate users via SSO providers (Google, Microsoft, etc.) by verifying their email exists in the database.

**Request Body**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "provider": "google"
}
```

**Success Response (200 OK)**:
```json
{
  "_id": "6930298044472e5c9b89c416",
  "username": "salmansdr",
  "email": "user@example.com",
  "roleName": "Administrator",
  "rolePermissions": [
    {
      "menuItem": "Project Management",
      "page": "Project Management",
      "permissions": {
        "view": true,
        "edit": true,
        "delete": true
      }
    }
  ]
}
```

**Error Response (401 Unauthorized)**:
```json
{
  "message": "User not registered in system"
}
```

**Error Response (403 Forbidden)**:
```json
{
  "message": "User account is disabled"
}
```

## C# Implementation Example

```csharp
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace ConstructionAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsermasterController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IRoleRepository _roleRepository;

        public UsermasterController(IUserRepository userRepository, IRoleRepository roleRepository)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
        }

        [HttpPost("sso-login")]
        public async Task<IActionResult> SSOLogin([FromBody] SSOLoginRequest request)
        {
            // Validate request
            if (string.IsNullOrEmpty(request.Email))
            {
                return BadRequest(new { message = "Email is required" });
            }

            // Find user by email
            var user = await _userRepository.FindByEmailAsync(request.Email);
            
            if (user == null)
            {
                return Unauthorized(new { message = "User not registered in system" });
            }

            // Check if user is active
            if (!user.IsActive)
            {
                return Unauthorized(new { message = "User account is disabled" });
            }

            // Get role and permissions
            var role = await _roleRepository.FindByIdAsync(user.RoleId);
            
            if (role == null)
            {
                return Unauthorized(new { message = "User role not found" });
            }

            // Return user data with permissions
            return Ok(new
            {
                _id = user.Id,
                username = user.Username,
                email = user.Email,
                roleName = role.Name,
                rolePermissions = role.Permissions
            });
        }
    }

    // Request model
    public class SSOLoginRequest
    {
        public string Email { get; set; }
        public string Name { get; set; }
        public string Provider { get; set; }
    }
}
```

## Database Changes Required

### Add Email Field to Usermaster Collection/Table

If not already present, add an `email` field to store user email addresses:

**MongoDB Example**:
```javascript
db.usermaster.updateMany(
  { email: { $exists: false } },
  { $set: { email: "" } }
);
```

**SQL Example**:
```sql
ALTER TABLE Usermaster 
ADD Email VARCHAR(255);

CREATE INDEX IX_Usermaster_Email ON Usermaster(Email);
```

## Repository Interface Updates

```csharp
public interface IUserRepository
{
    Task<User> FindByEmailAsync(string email);
    // ... other methods
}

public class UserRepository : IUserRepository
{
    private readonly IMongoCollection<User> _users;

    public async Task<User> FindByEmailAsync(string email)
    {
        return await _users.Find(u => u.Email == email).FirstOrDefaultAsync();
    }
}
```

## Security Considerations

1. **Email Verification**: The user's email from Google is already verified by Google
2. **Database Check**: Only users who exist in your database can login
3. **Role-Based Access**: Permissions are still controlled by your role system
4. **No Password Storage**: SSO users don't need passwords in your database

## Testing

### Test with Postman:

**Request**:
```
POST http://localhost:5000/api/Usermaster/sso-login
Content-Type: application/json

{
  "email": "salmansdr@gmail.com",
  "name": "Salman",
  "provider": "google"
}
```

**Expected Response**: User data with role permissions

## Frontend Integration

The frontend is already configured to:
1. Display Google Sign-In button
2. Decode Google JWT token to get email
3. Call /api/Usermaster/sso-login endpoint
4. Store user permissions in localStorage
5. Authenticate user if email exists in database

## Setup Steps

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** or **Google Identity Services**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web Application**
6. Add **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `http://localhost:3000/SalmanWipro-directory`
   - Add your production URL
7. Add **Authorized redirect URIs**:
   - `http://localhost:3000`
   - `http://localhost:3000/SalmanWipro-directory`
8. Copy the **Client ID**
9. Update `.env` file:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

### 2. Update Backend API

1. Implement the `sso-login` endpoint as shown above
2. Add email field to User model/schema
3. Create index on email field for performance
4. Test the endpoint with Postman

### 3. Test the Integration

1. Restart React dev server: `npm start`
2. Go to login page
3. Click "Sign in with Google"
4. Select Google account
5. Verify user is authenticated if email exists in database

## Current Login Flow Preserved

The traditional username/password login is still available:
- Users can choose between traditional login or Google SSO
- Both methods use the same permission system
- Both methods store the same data in localStorage
- No breaking changes to existing functionality

## Benefits

✅ Easier login for users (no password to remember)
✅ More secure (Google handles authentication)
✅ Reduced support for password resets
✅ Still maintains role-based access control
✅ Users must be registered in database first
✅ Traditional login still works
