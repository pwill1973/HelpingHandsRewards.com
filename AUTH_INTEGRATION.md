# Auth Provider Integration - Internal Documentation

## Overview

This document describes the **invisible authentication layer** integrated into the 2×2 Community Matrix platform. The authentication provider (Privy) is used internally but NEVER mentioned in any user-facing UI or copy.

---

## ✅ COMPLETED - Backend Infrastructure (Phase 1)

### Database Schema Updates

**New identity columns in `users` table:**
- `privy_user_id` (TEXT, UNIQUE) - Primary identity anchor from auth provider
- `telegram_user_id` (TEXT) - Telegram user ID for mini-app integration
- `email` and `password_hash` - Now nullable for provider-based auth (legacy compatibility)

**Migration:** `/migrations/0002_add_identity_providers.sql`

### Backend Services

**1. Auth Provider Service** (`/src/server/services/auth-provider.service.ts`)
- Verifies access tokens from the identity provider SDK
- Extracts user identity information (userId, email, wallet)
- Cloudflare Workers compatible (no Node.js APIs)
- Returns verified user identity for internal use

**2. Enhanced Auth Service** (`/src/server/services/auth.service.ts`)
New methods:
- `findOrCreateUserByProviderId()` - Maps provider ID to user record
- `linkTelegramUser()` - Associates Telegram ID with user
- `findUserByTelegramId()` - Finds user by Telegram ID

**3. Updated Auth Middleware** (`/src/server/middleware/auth.ts`)
Priority order:
1. Try provider token verification
2. Fall back to legacy JWT
3. Reject if both fail

### API Endpoints

**POST /api/auth/verify-session**
- Verifies auth provider token
- Links Telegram data if provided
- Returns user + JWT token
- Used by: Web app and Telegram mini-app

**POST /api/auth/telegram-init**
- Initializes Telegram mini-app user
- Links Telegram ID to auth provider account
- Creates new user if needed
- Returns user + JWT token

**Existing endpoints preserved:**
- POST /api/auth/register (legacy email/password)
- POST /api/auth/login (legacy email/password)
- GET /api/auth/me (works with both auth methods)

---

## 🚧 IN PROGRESS - Frontend Integration (Phase 2)

### Required npm Packages

**Already installed:**
- `@privy-io/server-auth@^1.32.5` ✅

**To be installed:**
- `@privy-io/react-auth` - React SDK for provider integration
  - **Note:** Peer dependency conflict detected
  - **Solution:** Use `npm install @privy-io/react-auth --legacy-peer-deps`

### Frontend Architecture Plan

**1. Auth Provider Client** (`/src/client/services/authProviderClient.ts`)
```typescript
// Invisible wrapper around provider SDK
export interface AuthClient {
  initializeClient(config: AuthConfig): void
  authenticateUser(): Promise<AuthSession>
  disconnectUser(): Promise<void>
  getAuthToken(): Promise<string>
}
```

**2. Updated AuthContext** (`/src/client/contexts/AuthContext.tsx`)
```typescript
// Enhanced context to support provider sessions
- Check for active provider session on mount
- Call /api/auth/verify-session with provider token
- Store user + JWT for subsequent API calls
- Provide generic auth methods (no provider name exposed)
```

**3. UI Components - Generic Wording**

**LoginPage.tsx:**
```tsx
// BEFORE: "Sign in with Email"
// AFTER: "Continue" (triggers provider auth invisibly)
<button onClick={handleContinue}>Continue</button>
```

**RegisterPage.tsx:**
```tsx
// BEFORE: "Create Account with Email"
// AFTER: "Join the Community" (triggers provider auth invisibly)
<button onClick={handleJoinCommunity}>Join the Community</button>
```

**TelegramApp.tsx:**
```tsx
// Parse Telegram WebApp data
// Call /api/auth/telegram-init with Telegram + provider token
// Link identities silently
// Show generic "Connect Wallet" / "Activate Level" buttons
```

---

## 🔐 Security & Privacy

### Server-Side Security
- Provider tokens verified server-side only
- Never expose provider credentials to client
- JWT issued after provider verification
- Telegram signature validation (TODO)

### Environment Variables

**Server (Cloudflare Secrets):**
```bash
AUTH_PROVIDER_APP_ID=your_app_id
AUTH_PROVIDER_APP_SECRET=your_app_secret
# Or use official names:
PRIVY_APP_ID=your_app_id
PRIVY_APP_SECRET=your_app_secret
```

**Client (embedded in build):**
```bash
VITE_AUTH_PROVIDER_APP_ID=your_app_id
# Or use official name:
VITE_PRIVY_APP_ID=your_app_id
```

### Logging Rules
- ✅ Server logs: Can reference provider name internally
- ❌ Client console.log: Never mention provider in production
- ❌ API responses: Never return provider name to client
- ❌ Error messages: Use generic wording ("Authentication failed")

---

## 🔄 User Identity Resolution Flow

### Web App (Browser)

```
1. User clicks "Join the Community"
2. Provider SDK modal appears (their branding - we don't control)
3. User authenticates (email, social, wallet, etc.)
4. Provider returns session token
5. Frontend calls POST /api/auth/verify-session { authToken }
6. Backend:
   - Verifies token with provider SDK
   - Finds user by privyUserId
   - If not found, creates new user
   - Returns { user, token (JWT) }
7. Frontend stores JWT, user data
8. User sees Dashboard (no provider mentioned)
```

### Telegram Mini-App

```
1. User opens /telegram in Telegram app
2. Frontend reads Telegram.WebApp.initData
3. Parse telegram.userId
4. Initialize provider SDK (silent)
5. Frontend calls POST /api/auth/telegram-init { telegramData, authToken }
6. Backend:
   - Verifies Telegram signature
   - Verifies provider token
   - Links telegramUserId ↔ privyUserId
   - Creates/updates user record
7. Returns { user, token (JWT) }
8. User sees mini-app (generic UI: "Activate Level", "Connect Wallet")
```

### TON Wallet Connection (Both Flows)

```
1. User authenticated (provider session + JWT)
2. User clicks "Connect TON Wallet"
3. TonConnect modal (TON wallet branding)
4. User approves in wallet
5. Frontend calls POST /api/ton/link-wallet { walletAddress, proof }
6. Backend updates user.tonWalletAddress
7. User can activate Contribution Levels
```

---

## 📊 Database User Record Structure

```sql
users {
  id: INTEGER PRIMARY KEY
  
  -- Identity anchors (multiple ways to identify same user)
  privy_user_id: TEXT UNIQUE      -- Primary identity (provider)
  telegram_user_id: TEXT           -- Telegram mini-app ID
  ton_wallet_address: TEXT         -- TON blockchain wallet
  
  -- Legacy auth (backward compatibility)
  email: TEXT UNIQUE               -- Optional for provider users
  password_hash: TEXT              -- Optional for provider users
  
  -- Profile
  full_name: TEXT NOT NULL
  username: TEXT UNIQUE
  member_code: TEXT UNIQUE
  referral_code: TEXT UNIQUE
  country: TEXT
  
  -- Matrix system
  referred_by_id: INTEGER          -- Sponsor relationship
  is_admin: BOOLEAN
  
  -- Timestamps
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

**Example records:**

```
# Web user (provider auth)
{
  privy_user_id: "did:privy:12345",
  telegram_user_id: NULL,
  email: "user@example.com",
  password_hash: NULL
}

# Telegram user (linked to provider)
{
  privy_user_id: "did:privy:67890",
  telegram_user_id: "987654321",
  email: NULL,
  password_hash: NULL
}

# Legacy user (email/password)
{
  privy_user_id: NULL,
  telegram_user_id: NULL,
  email: "legacy@example.com",
  password_hash: "$2a$10$..."
}
```

---

## ✅ UI/UX Compliance Checklist

### ✅ Allowed in UI
- "Continue"
- "Join the Community"
- "Create Your Profile"
- "Secure Login"
- "Connect Wallet"
- "Activate This Level"
- "Contribution Level"
- "Recurring Rewards"
- "Community Support"

### ❌ FORBIDDEN in UI
- "Privy" or any provider name
- "Sign in with [Provider]"
- "Powered by [Provider]"
- "Investment", "Income", "Earnings"
- "Profit", "ROI", "Passive Income"
- "Get Rich", any financial promises

---

## 🚀 Next Steps

### Immediate (Phase 2 - Frontend)
1. ✅ Install `@privy-io/react-auth --legacy-peer-deps`
2. Create `/src/client/services/authProviderClient.ts`
3. Update `/src/client/contexts/AuthContext.tsx`
4. Update LoginPage.tsx (generic "Continue" button)
5. Update RegisterPage.tsx (generic "Join Community" button)
6. Update TelegramApp.tsx (Telegram init flow)
7. Test all three flows (web, Telegram, TON wallet)

### Future Enhancements
1. Telegram signature verification (full implementation)
2. Social auth options (via provider SDK)
3. Wallet-first auth (via provider SDK)
4. Biometric auth (via provider SDK)
5. Email verification flow
6. Account recovery mechanisms

---

## 📝 Testing Scenarios

### Test Case 1: New Web User
1. Visit homepage
2. Click "Join the Community"
3. Complete provider auth
4. Should see dashboard
5. Check DB: `privy_user_id` populated, `email` optional

### Test Case 2: New Telegram User
1. Open /telegram in Telegram app
2. App reads Telegram.WebApp data
3. Auto-initializes user
4. Should see mini-app interface
5. Check DB: `telegram_user_id` populated

### Test Case 3: Telegram + Web Linking
1. User authenticates on web
2. User opens /telegram
3. Backend links both identities
4. Check DB: Same user has both `privy_user_id` and `telegram_user_id`

### Test Case 4: TON Wallet Connection
1. Authenticate (web or Telegram)
2. Click "Connect TON Wallet"
3. Approve in wallet
4. Check DB: `ton_wallet_address` updated

### Test Case 5: Legacy User Migration
1. User with existing email/password
2. Can still login with POST /api/auth/login
3. JWT works with all endpoints
4. Eventually link to provider account (optional)

---

## 🔍 Verification Commands

**Check for provider name in UI:**
```bash
grep -r "Privy" src/client --include="*.tsx" --include="*.jsx"
# Should return: NO RESULTS

grep -r "Privy" src/client/pages --include="*.tsx"
# Should return: NO RESULTS
```

**Check for forbidden terms:**
```bash
grep -ri "investment\|income\|profit\|roi\|passive income\|get rich" src/client/pages
# Should return: NO RESULTS
```

**Check for approved wording:**
```bash
grep -r "Contribution\|Community\|Rewards" src/client/pages
# Should return: Multiple results (approved)
```

---

## 📚 Architecture Decisions

### Why Invisible Integration?
- Regulatory compliance requirements
- Brand-neutral user experience
- Flexibility to switch providers later
- Focus on community, not technology
- Avoid third-party auth fatigue

### Why Provider + JWT Hybrid?
- Provider handles authentication
- JWT for subsequent API calls
- Reduces provider API calls
- Works in Cloudflare Workers
- Legacy compatibility maintained

### Why Telegram Linking?
- Telegram users prefer native experience
- Mini-app is primary use case for TON
- Telegram provides verified user identity
- Seamless integration without redirects
- Single user record across platforms

---

## 🎯 Success Criteria

✅ Backend:
- Provider token verification works
- User creation/lookup by provider ID works
- Telegram linking works
- Legacy JWT still works
- All tests pass

✅ Frontend (TODO):
- Generic UI buttons work
- Provider modal appears seamlessly
- No provider name in any component
- Telegram mini-app initializes correctly
- TON wallet connects successfully

✅ Overall:
- User can authenticate without knowing about provider
- Same user identity across web + Telegram + wallet
- Zero provider mentions in UI/copy
- Compliance wording maintained
- All existing features work unchanged

---

**Last Updated:** 2025-11-25  
**Status:** Phase 1 Complete (Backend), Phase 2 In Progress (Frontend)  
**Next:** Install React SDK and implement frontend integration
