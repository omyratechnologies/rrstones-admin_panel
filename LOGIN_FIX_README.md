# Admin Panel Login Issue - RESOLVED

## Problem
Unable to login to the admin panel when accessing via VS Code devtunnels.

## Root Causes Identified

### 1. CORS Configuration (✅ FIXED)
**Issue**: The backend CORS configuration only allowed specific localhost URLs and didn't accept devtunnel URLs.

**Solution**: Updated `/backend/src/index.ts` to accept all devtunnel URLs in development mode:
```typescript
origin: function(origin, callback) {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) return callback(null, true);
  
  // Allow localhost and devtunnel URLs in development
  const allowedPatterns = [
    /^http:\/\/localhost:\d+$/,
    /^https?:\/\/.*\.devtunnels\.ms$/,  // <-- Added this
    /^http:\/\/127\.0\.0\.1:\d+$/
  ];
  
  const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
  if (isAllowed) {
    callback(null, true);
  } else {
    console.warn(`⚠️  CORS blocked origin: ${origin}`);
    callback(null, false);
  }
}
```

### 2. API Base URL Configuration (✅ FIXED)
**Issue**: The admin panel was configured to connect to `http://localhost:5001/api` instead of the devtunnel backend URL.

**Solution**: Updated `/admin-panel/.env`:
```properties
# Before
VITE_API_BASE_URL=http://localhost:5001/api

# After
VITE_API_BASE_URL=https://bk65zccr-5001.inc1.devtunnels.ms/api
```

## How to Apply the Fix

### Step 1: Restart Backend (Already Running)
The backend has been restarted with the new CORS configuration.

### Step 2: Restart Admin Panel
You need to restart the admin panel for the new API URL to take effect:

1. In the terminal running the admin panel (terminal s007), press `Ctrl+C` to stop it
2. Run `bun dev` or `npm run dev` again

Or from the backend terminal:
```bash
# Stop admin panel
cd /Users/avinashgantala/Development/rrstones/admin-panel
# Press Ctrl+C in that terminal
# Then restart
bun dev
```

## Verification

After restarting the admin panel, the login should work with these credentials:

- **Email**: `admin@rrstones.com`
- **Password**: `SuperSecure123!`

## Testing Login API Directly

You can test the login API is working correctly:

```bash
curl -X POST https://bk65zccr-5001.inc1.devtunnels.ms/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://bk65zccr-5173.inc1.devtunnels.ms" \
  -d '{"email":"admin@rrstones.com","password":"SuperSecure123!"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "token": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "_id": "...",
      "name": "Super Administrator",
      "email": "admin@rrstones.com",
      "role": "super_admin",
      ...
    }
  }
}
```

## Additional Login Credentials

### Admin Accounts
- **Super Admin**: `admin@rrstones.com` / `SuperSecure123!`
- **Admin**: `manager@rrstones.com` / `Admin@123`
- **Staff**: `staff@rrstones.com` / `Staff@123`

### Customer Accounts (for testing)
- **VIP Customer (T1)**: `john.doe@example.com` / `Customer@123`
- **Regular Customer (T2)**: `jane.smith@example.com` / `Customer@123`
- **Basic Customer (T3)**: `mike.johnson@example.com` / `Customer@123`

## Important Notes

1. **Devtunnel URLs**: These are dynamic and change when you restart the devtunnel. If your devtunnel URL changes, you'll need to update the `.env` file again.

2. **Local Development**: If you're accessing the admin panel via `localhost:5173` instead of devtunnel, change the API URL back to:
   ```properties
   VITE_API_BASE_URL=http://localhost:5001/api
   ```

3. **Production**: For production, use the `.env.production` file with the actual production API URL.

## Troubleshooting

### Issue: Still can't login after restart
**Check**:
1. Backend is running on the correct devtunnel URL
2. Admin panel has been restarted (environment variables are loaded at build time)
3. Browser console for any CORS or network errors
4. Network tab to see the actual API request URL

### Issue: CORS errors still appearing
**Check**:
1. Backend logs for CORS warning messages
2. The Origin header in the request matches the devtunnel pattern
3. Backend server has been restarted after CORS changes

### Issue: 401 Unauthorized
**Check**:
1. Credentials are correct (case-sensitive)
2. User exists in database: `npm run admin list-super-admins`
3. User account is active (`isActive: true`)

## Files Modified

1. ✅ `/backend/src/index.ts` - Updated CORS configuration
2. ✅ `/admin-panel/.env` - Updated API base URL
3. ✅ `/backend/src/seed.ts` - Created comprehensive seed script
4. ℹ️  Backend server - Restarted with new CORS config
5. ⏳ Admin panel - **Needs restart to apply new API URL**

## Summary

The login issue was caused by:
1. Backend not accepting requests from devtunnel origins (CORS)
2. Admin panel trying to connect to localhost instead of devtunnel

Both issues have been fixed in the code. You just need to **restart the admin panel** for the changes to take effect.
