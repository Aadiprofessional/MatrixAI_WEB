# Google OAuth Configuration for MatrixAI

## Issue
Google OAuth consent screen shows "ddtgdhehxhgarkonvpfq.supabase.co" instead of "MatrixAI"

## Solution Steps

### 1. Google Cloud Console - OAuth Consent Screen
Navigate to: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → OAuth consent screen

**Update these fields:**
- **Application name**: `MatrixAI`
- **User support email**: `support@matrixai.asia` (or your support email)
- **Application logo**: Upload MatrixAI logo (120x120px recommended)
- **Application home page**: `https://matrixai.asia`
- **Application privacy policy**: `https://matrixai.asia/privacy`
- **Application terms of service**: `https://matrixai.asia/terms`
- **Developer contact information**: Your email address

**Authorized domains:**
```
matrixai.asia
localhost
ddtgdhehxhgarkonvpfq.supabase.co
```

### 2. OAuth Client Configuration
Navigate to: APIs & Services → Credentials → Your OAuth 2.0 Client ID

**Authorized redirect URIs:**
```
https://ddtgdhehxhgarkonvpfq.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
https://matrixai.asia/auth/callback
```

**Authorized JavaScript origins:**
```
https://matrixai.asia
http://localhost:3000
https://ddtgdhehxhgarkonvpfq.supabase.co
```

### 3. Current Supabase Configuration
- **Supabase URL**: `https://ddtgdhehxhgarkonvpfq.supabase.co`
- **Project ID**: `ddtgdhehxhgarkonvpfq`

### 4. Production URLs
- **Main site**: `https://matrixai.asia`
- **Dashboard redirect**: `https://matrixai.asia/dashboard`
- **Development**: `http://localhost:3000`

## Important Notes

1. **Verification Status**: If your app is not verified by Google, users will see a warning screen. To remove this:
   - Submit your app for verification in Google Cloud Console
   - Or add test users in the OAuth consent screen settings

2. **Domain Verification**: You may need to verify ownership of `matrixai.asia` domain in Google Search Console

3. **Branding**: The application name "MatrixAI" will appear on the consent screen instead of the Supabase URL

4. **Testing**: After making changes, it may take a few minutes for the new branding to appear

## Verification Checklist
- [ ] Application name changed to "MatrixAI"
- [ ] Logo uploaded
- [ ] Authorized domains added
- [ ] Redirect URIs updated
- [ ] Privacy policy and terms links added
- [ ] Test the OAuth flow

## Alternative Solution: Custom Domain
If you want to completely remove Supabase branding, consider:
1. Setting up a custom domain for your Supabase project
2. Using your own OAuth provider implementation
3. Proxying Supabase requests through your own domain