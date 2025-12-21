# Debugging Authentication Issues

## Common Issues and Solutions

### Issue: Redirect Loop After Login

**Symptoms:**
- User logs in successfully
- Gets redirected to `/login?redirect=%2Fworkspace`
- Cookie appears to not be set or verified

**Debugging Steps:**

1. **Check Browser Console:**
   - Open DevTools → Console
   - Look for middleware logs: `[Middleware] No auth token found` or `[Middleware] Invalid token detected`
   - Look for login logs: `[Login] Token generated and cookie set`

2. **Check Browser Cookies:**
   - Open DevTools → Application → Cookies → `http://localhost:3000`
   - Look for `auth-token` cookie
   - Verify it has:
     - Path: `/`
     - HttpOnly: ✓
     - SameSite: `Lax`
     - Secure: (should be unchecked in development)

3. **Check Environment Variables:**
   ```bash
   # Make sure JWT_SECRET is set
   echo $JWT_SECRET
   # Or check .env.local file
   ```

4. **Check Server Logs:**
   - Look for token generation logs
   - Look for token verification errors

**Common Causes:**

1. **JWT_SECRET not set or mismatched:**
   - Solution: Set `JWT_SECRET` in `.env.local`
   - Generate a secure secret: `openssl rand -base64 32`

2. **Cookie not being set:**
   - Check if `response.cookies.set()` is being called
   - Verify cookie settings match between login and middleware

3. **Token verification failing:**
   - Check if JWT_SECRET is the same in both login and middleware
   - Verify token expiration (7 days)

4. **Timing issue:**
   - Cookie might not be available immediately after setting
   - Solution: Added 100ms delay before redirect

## Testing Authentication

1. **Test Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}' \
     -c cookies.txt -v
   ```

2. **Test Cookie:**
   ```bash
   curl http://localhost:3000/api/auth/me \
     -b cookies.txt -v
   ```

3. **Test Middleware:**
   - Try accessing `/workspace` directly
   - Should redirect to `/login` if not authenticated
   - Should allow access if authenticated

## Fixes Applied

1. ✅ Added logging to middleware for debugging
2. ✅ Added logging to token verification
3. ✅ Added logging to login route
4. ✅ Removed redundant `/api/auth/me` check after login
5. ✅ Added 100ms delay before redirect to ensure cookie is set
6. ✅ Fixed redirect path validation

