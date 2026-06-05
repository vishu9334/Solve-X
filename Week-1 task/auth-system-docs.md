# AUTH SYSTEM — Technical Architecture & Developer Guide

> **Stack:** Node.js · Express · MongoDB (Mongoose) · Redis · JWT · Nodemailer · Passport

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Simple Auth Flow — Email + Password + OTP](#2-simple-auth-flow)
3. [Google Auth Flow — OAuth 2.0](#3-google-auth-flow)
4. [Token System — JWT + Redis](#4-token-system)
5. [Reset Password Flow](#5-reset-password-flow)
6. [Setup — Packages & .env](#6-setup)
7. [Folder Structure](#7-folder-structure)
8. [Critical Rules](#8-critical-rules)
9. [Complete Sequence — Quick Reference](#9-complete-sequence)

---

## 1. High-Level Architecture

### 1.1 Core Design Decisions

| # | Decision | Why |
|---|---|---|
| 1 | Mongoose Discriminators | One `commonusers` collection, two child schemas (`SimpleUserAuth`, `GoogleAuth`) |
| 2 | Redis | OTP storage, rate limiting, refresh token tracking, access token blacklist |
| 3 | JWT with `jti` | Every token has unique ID for precise blacklisting on logout |
| 4 | Nodemailer + Gmail OAuth2 | OTP delivery via email |
| 5 | `isVerified` flag | Both flows set `isVerified: true` only after confirmation step |

---

### 1.2 MongoDB Schema Map

> All users — regardless of auth method — live in **ONE collection: `commonusers`**

| Schema File | Purpose |
|---|---|
| `AbaseUser.model.js` | `CommonUser` — base schema, `discriminatorKey: "authType"` |
| `AuserAuth.model.js` | `SimpleUserAuth` — extends CommonUser, adds: `password` |
| `AgoogleAuth.model.js` | `GoogleAuth` — extends CommonUser, adds: `googleId`, tokens |
| `AadminProfile.model.js` | `AdminProfile` — separate collection, `ref: "CommonUser"` |
| `AmentorProfile.model.js` | `MentorProfile` — separate collection, `ref: "CommonUser"` |
| `AstudentProfile.model.js` | `StudentProfile` — separate collection, `ref: "CommonUser"` |

**Discriminator flow:**

```
SimpleUserAuth.create({ name, email, password })
       ↓
commonusers collection mein ek document banega:
{
  _id: ObjectId("..."),
  name, email, isVerified, avatar, role,
  authType: "SimpleUserAuth",   ← automatically set
  password: "hashed...",        ← SimpleUserAuth ka field
}
```

```
GoogleAuth.create({ name, email, googleId })
       ↓
commonusers collection mein ek document banega:
{
  _id: ObjectId("..."),
  name, email, isVerified, avatar, role,
  authType: "GoogleAuth",       ← automatically set
  googleId: "108234...",        ← GoogleAuth ka field
}
```

---

### 1.3 Redis Key Strategy

| Redis Key Pattern | Purpose | TTL |
|---|---|---|
| `auth:otp:register:<email>` | Hashed OTP stored for verification | 5 min |
| `auth:rate:otp-send:<email>` | Max 3 OTP sends per window | 10 min |
| `auth:rate:otp-verify:<email>` | Max 5 wrong OTP attempts per window | 10 min |
| `auth:otp:reset:<email>` | Hashed OTP for password reset | 10 min |
| `auth:rate:reset-send:<email>` | Max 3 reset OTP sends per window | 10 min |
| `auth:rate:reset-verify:<email>` | Max 5 wrong reset OTP attempts per window | 10 min |
| `auth:refresh:<userId>:<jti>` | Valid refresh token tracking | 7 days |
| `auth:blacklist:access:<jti>` | Blacklisted access tokens after logout | Remaining token TTL |

---

### 1.4 Token Strategy

| Token | Expiry | Storage |
|---|---|---|
| Access Token | 15 min | Cookie (httpOnly) + Authorization header |
| Refresh Token | 7 days | Cookie (httpOnly) + Redis |
| `jti` | — | `crypto.randomUUID()` — unique per token, used for blacklist |

---

## 2. Simple Auth Flow

### 2.1 API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Create user, send OTP via Nodemailer |
| POST | `/auth/verify-register-otp` | None | Verify OTP → `isVerified: true` → return tokens |
| POST | `/auth/login` | None | Email + password login, return tokens |
| POST | `/auth/refresh-token` | None | Use refresh token to get new access token |
| POST | `/auth/logout` | `verifyAuth` | Blacklist access token, delete refresh from Redis |

---

### 2.2 Register Flow

#### Step 1 — POST `/auth/register`

```
Request body: { name, email, password }

1. Check duplicate: CommonUser.findOne({ email })
   → if exists AND isVerified: true  →  409 "User already exists"
   → if exists AND isVerified: false →  skip create, just resend OTP

2. If new user:
   SimpleUserAuth.create({
     name,
     email,
     password,          ← bcrypt hash auto hoga pre-save hook se
     isVerified: false,
   })
   authType: "SimpleUserAuth" ← discriminator automatically set karega

3. sendRegisterOtp(email) call karo

Response: 201 { success: true, message: "OTP sent successfully" }
```

#### Step 2 — OTP Send Flow (`sendRegisterOtp`)

```
1. email normalize: email.toLowerCase().trim()

2. Rate limit check:
   redis.incr("auth:rate:otp-send:<email>")
   → if count === 1: redis.expire(key, 600)
   → if count > 3:   throw 429 "OTP send limit exceeded. Try after X seconds"

3. OTP generate:
   crypto.randomInt(100000, 999999).toString()  →  6-digit string

4. OTP hash:
   crypto.createHash("sha256").update(otp + OTP_SECRET).digest("hex")

5. Redis mein save:
   redis.set(
     "auth:otp:register:<email>",
     JSON.stringify({ otpHash, purpose: "register" }),
     "EX", 300   ← 5 minutes
   )

6. Nodemailer se email bhejo:
   transporter.sendMail({
     from: "Auth App <EMAIL_USER>",
     to: email,
     subject: "Your OTP Code",
     html: "<h2>Your OTP is ${otp}</h2><p>Valid for 5 minutes.</p>"
   })
```

> **Important:** OTP plain text kabhi Redis mein mat rakho — hamesha SHA-256 hash with OTP_SECRET

#### Step 3 — POST `/auth/verify-register-otp`

```
Request body: { email, otp }

1. Rate limit check:
   redis.incr("auth:rate:otp-verify:<email>")
   → max 5 attempts per 10 min

2. Redis se OTP data lo:
   redis.get("auth:otp:register:<email>")
   → null hai  →  throw 400 "OTP expired or not found"

3. Incoming OTP hash karo:
   crypto.createHash("sha256").update(otp + OTP_SECRET).digest("hex")

4. Compare:
   incomingHash !== storedHash  →  throw 400 "Invalid OTP"

5. Match hua:
   redis.del("auth:otp:register:<email>")
   redis.del("auth:rate:otp-verify:<email>")

6. User verified mark karo:
   CommonUser.findOneAndUpdate(
     { email },
     { isVerified: true },
     { new: true }
   )

7. Tokens generate karo:
   createAuthTokens(user, res)
   → access token cookie + Authorization header
   → refresh token cookie + Redis

Response: 200 { success: true, message: "User verified successfully" }
```

---

### 2.3 Login Flow

#### POST `/auth/login`

```
Request body: { email, password }

1. SimpleUserAuth.findOne({ email })
   → null  →  404 "User not found"

2. isVerified check:
   user.isVerified === false  →  403 "Please verify your email first"

3. Password compare:
   user.comparePassword(password)  →  bcrypt.compare()
   → false  →  401 "Invalid credentials"

4. createAuthTokens(user, res)

Response: 200 {
  success: true,
  user: { id, name, email, role, authType }
}
```

---

## 3. Google Auth Flow

### 3.1 API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/auth/google` | None | Redirect to Google OAuth consent screen |
| GET | `/auth/google/callback` | None | Google redirects here after user approves |

---

### 3.2 Google Auth Flow — Step by Step

#### Step 1 — GET `/auth/google`

```
passport.authenticate("google", { scope: ["profile", "email"] })
→ User Google consent screen pe redirect hoga
→ Koi DB interaction nahi
```

#### Step 2 — Google Callback

```
Google /auth/google/callback pe redirect karega with auth code
Passport code exchange karega:
  → accessToken (Google API calls ke liye)
  → refreshToken (Google token refresh ke liye)
  → profile {
      id: "108234567890",          ← googleId
      emails: [{ value: "..." }],
      displayName: "Vishu Kumar",
      photos: [{ value: "url" }]
    }
```

#### Step 3 — Upsert User

```
GoogleAuth.findOne({ googleId: profile.id })

Case A — Naya user (first time):
  GoogleAuth.create({
    name: profile.displayName,
    email: profile.emails[0].value,
    googleId: profile.id,
    avatar: profile.photos[0].value,
    isVerified: false,         ← start as false
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  })
  authType: "GoogleAuth" ← discriminator automatically set karega

Case B — Returning user:
  GoogleAuth.findOneAndUpdate(
    { googleId: profile.id },
    { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
    { new: true }
  )
```

#### Step 4 — isVerified true

```
Google account = email Google ne already verify kiya hai
OTP ki zaroorat nahi

CommonUser.findOneAndUpdate(
  { _id: user._id },
  { isVerified: true }
)

→ Ye step upsert ke baad immediately run hoga
```

#### Step 5 — Token Generation

```
createAuthTokens(user, res)
→ access token: cookie + Authorization header
→ refresh token: cookie + Redis

Response: 200 { success: true, user: { id, name, email, authType } }
```

---

## 4. Token System

### 4.1 Access Token Generation

```javascript
// src/utils/token.js

export function generateAccessToken(user) {
  const jti = crypto.randomUUID();

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      authType: user.authType,   // "SimpleUserAuth" | "GoogleAuth"
      role: user.role,
      jti,
      type: "access",
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXP }  // 15m
  );

  return { token, jti };
}
```

---

### 4.2 Refresh Token Generation

```javascript
export function generateRefreshToken(user) {
  const jti = crypto.randomUUID();

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      jti,
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXP }  // 7d
  );

  return { token, jti };
}
```

---

### 4.3 createAuthTokens — Redis + Cookie + Header

```javascript
// src/services/token.service.js

export async function createAuthTokens(user, res) {
  const access  = generateAccessToken(user);
  const refresh = generateRefreshToken(user);

  // Redis mein refresh token save karo
  await redis.set(
    `auth:refresh:${user._id}:${refresh.jti}`,
    "valid",
    "EX",
    7 * 24 * 60 * 60   // 604800 seconds = 7 days
  );

  // Cookie mein dono tokens
  res.cookie("accessToken", access.token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000,              // 15 min
  });

  res.cookie("refreshToken", refresh.token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,    // 7 days
  });

  // Authorization header — frontend ke liye
  res.setHeader("Authorization", `Bearer ${access.token}`);

  return { accessToken: access.token, refreshToken: refresh.token };
}
```

---

### 4.4 Auth Middleware — verifyAuth

```javascript
// src/middlewares/auth.middleware.js

export async function verifyAuth(req, res, next) {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "Access token missing");

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Redis blacklist check — logout ke baad token invalid hoga
    const isBlacklisted = await redis.get(
      `auth:blacklist:access:${decoded.jti}`
    );
    if (isBlacklisted) throw new ApiError(401, "Token revoked");

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      authType: decoded.authType,
      role: decoded.role,
      jti: decoded.jti,
    };

    next();
  } catch (error) {
    next(new ApiError(401, "Unauthorized"));
  }
}
```

---

### 4.5 Logout Flow

```javascript
// src/controllers/auth.controller.js

export async function logout(req, res, next) {
  try {
    const accessToken  = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    // 1. Access token blacklist karo
    if (accessToken) {
      const decoded = jwt.decode(accessToken);
      if (decoded?.jti && decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.set(
            `auth:blacklist:access:${decoded.jti}`,
            "blacklisted",
            "EX", ttl
          );
        }
      }
    }

    // 2. Refresh token Redis se delete karo
    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);
      if (decoded?.sub && decoded?.jti) {
        await redis.del(`auth:refresh:${decoded.sub}:${decoded.jti}`);
      }
    }

    // 3. Cookies clear karo
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    next(error);
  }
}
```

---

### 4.6 Refresh Token Flow

```javascript
// POST /auth/refresh-token

export async function refreshAccessToken(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw new ApiError(401, "Refresh token missing");

    // 1. Verify karo
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 2. Redis mein valid hai?
    const isValid = await redis.get(
      `auth:refresh:${decoded.sub}:${decoded.jti}`
    );
    if (!isValid) throw new ApiError(401, "Refresh token expired or revoked");

    // 3. User lo
    const user = await CommonUser.findById(decoded.sub);
    if (!user) throw new ApiError(404, "User not found");

    // 4. Naya access token banao
    const access = generateAccessToken(user);

    // 5. Cookie + header update karo
    res.cookie("accessToken", access.token, {
      httpOnly: true, secure: true, sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });
    res.setHeader("Authorization", `Bearer ${access.token}`);

    // NOTE: Refresh token Redis mein as-is rahega
    // Naya refresh token mat banao — sirf access token renew karo

    return res.status(200).json({ success: true, message: "Access token refreshed" });
  } catch (error) {
    next(error);
  }
}
```

---

## 5. Reset Password Flow

> ⚠️ **Sirf `SimpleUserAuth` users ke liye** — Google users ka password nahi hota

### 5.1 API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/forgot-password` | None | Email se OTP bhejo for password reset |
| POST | `/auth/verify-reset-otp` | None | OTP verify karo — reset token milega |
| POST | `/auth/reset-password` | None | Naya password set karo reset token se |

---

### 5.2 Reset Password Flow — Step by Step

#### Step 1 — POST `/auth/forgot-password`

```
Request body: { email }

1. email normalize: email.toLowerCase().trim()

2. User dhundo:
   SimpleUserAuth.findOne({ email })
   → null  →  404 "User not found"

   authType check:
   user.authType !== "SimpleUserAuth"  →  400 "Google account — password reset not applicable"

3. isVerified check:
   user.isVerified === false  →  403 "Please verify your account first"

4. Rate limit check:
   redis.incr("auth:rate:reset-send:<email>")
   → if count === 1: redis.expire(key, 600)
   → if count > 3:   throw 429 "Too many requests. Try after X seconds"

5. OTP generate + hash:
   const otp = crypto.randomInt(100000, 999999).toString()
   const otpHash = crypto.createHash("sha256").update(otp + OTP_SECRET).digest("hex")

6. Redis mein save (10 min TTL — reset ke liye thoda zyada time):
   redis.set(
     "auth:otp:reset:<email>",
     JSON.stringify({ otpHash, purpose: "reset" }),
     "EX", 600
   )

7. Nodemailer se email bhejo:
   subject: "Password Reset OTP"
   html: "<h2>Your OTP is ${otp}</h2><p>Valid for 10 minutes.</p>"

Response: 200 { success: true, message: "Reset OTP sent successfully" }
```

---

#### Step 2 — POST `/auth/verify-reset-otp`

```
Request body: { email, otp }

1. Rate limit check:
   redis.incr("auth:rate:reset-verify:<email>")
   → max 5 attempts per 10 min

2. Redis se OTP data lo:
   redis.get("auth:otp:reset:<email>")
   → null  →  400 "OTP expired or not found"

3. purpose check:
   parsedData.purpose !== "reset"  →  400 "Invalid OTP"

4. OTP hash compare:
   incomingHash !== storedHash  →  400 "Invalid OTP"

5. Match hua — OTP delete karo:
   redis.del("auth:otp:reset:<email>")
   redis.del("auth:rate:reset-verify:<email>")

6. Reset token generate karo (short-lived, single-use):
   const resetToken = crypto.randomUUID()

7. Reset token Redis mein save karo (15 min):
   redis.set(
     "auth:reset-token:<email>",
     resetToken,
     "EX", 900
   )

Response: 200 {
  success: true,
  resetToken,        ← frontend is token ko next step mein use karega
  message: "OTP verified. Use resetToken to set new password."
}
```

> **Why reset token?** OTP verify hone ke baad seedha password change allow karna unsafe hai. Ek short-lived reset token dete hain jo sirf ek baar use ho sakta hai.

---

#### Step 3 — POST `/auth/reset-password`

```
Request body: { email, resetToken, newPassword }

1. email normalize karo

2. Redis se reset token lo:
   redis.get("auth:reset-token:<email>")
   → null       →  400 "Reset token expired or not found"
   → mismatch   →  400 "Invalid reset token"

3. User dhundo:
   SimpleUserAuth.findOne({ email })
   → null  →  404 "User not found"

4. Naya password set karo:
   user.password = newPassword   ← pre-save hook bcrypt hash karega
   await user.save()

5. Reset token Redis se delete karo (single-use):
   redis.del("auth:reset-token:<email>")

6. Optional — saare active sessions invalidate karo:
   (user ke saare refresh tokens delete karo — security best practice)
   const keys = await redis.keys(`auth:refresh:${user._id}:*`)
   if (keys.length) await redis.del(...keys)

Response: 200 { success: true, message: "Password reset successfully. Please login again." }
```

---

### 5.3 Complete Reset Flow Visual

```
User → POST /auth/forgot-password { email }
         ↓
      Rate limit check (max 3 / 10 min)
         ↓
      SimpleUserAuth check + isVerified check
         ↓
      OTP generate → SHA-256 hash → Redis (10 min)
         ↓
      Nodemailer → OTP email bhejo
         ↓
User → POST /auth/verify-reset-otp { email, otp }
         ↓
      Rate limit check (max 5 / 10 min)
         ↓
      Redis OTP fetch → hash compare → DEL
         ↓
      resetToken = crypto.randomUUID()
      Redis SET auth:reset-token:<email> EX 900 (15 min)
         ↓
      Response: { resetToken }
         ↓
User → POST /auth/reset-password { email, resetToken, newPassword }
         ↓
      Redis reset token verify → DEL (single-use)
         ↓
      user.password = newPassword → save() → bcrypt hash
         ↓
      Saare active sessions invalidate (optional but recommended)
         ↓
      Response: 200 "Password reset successfully"
```

---

### 5.4 Routes Update

```javascript
// src/routes/auth.route.js

import {
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "../controllers/auth.controller.js";

router.post("/forgot-password",    forgotPassword);
router.post("/verify-reset-otp",   verifyResetOtp);
router.post("/reset-password",     resetPassword);
```

---

## 6. Setup — Packages & .env

### 6.1 Install Packages

```bash
npm i ioredis jsonwebtoken bcrypt nodemailer crypto
npm i passport passport-google-oauth20
npm i express-slow-down   # optional: global rate limiting
```

---

### 6.2 .env Variables

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/yourdb

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_EXP=15m
REFRESH_TOKEN_EXP=7d

# OTP
OTP_SECRET=your_otp_secret

# Gmail OAuth2 (Nodemailer)
EMAIL_USER=your-email@gmail.com
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
REFRESH_TOKEN=your_gmail_refresh_token

# Google OAuth (Passport)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

---

## 7. Folder Structure

```
src/
  configs/
    redis.config.js          ← Redis connection (ioredis)
    passport.config.js       ← Google OAuth strategy

  models/
    AbaseUser.model.js       ← CommonUser (discriminator base)
    AuserAuth.model.js       ← SimpleUserAuth (password)
    AgoogleAuth.model.js     ← GoogleAuth (googleId, tokens)
    AmentorProfile.model.js
    AstudentProfile.model.js
    AadminProfile.model.js

  utils/
    otp.js                   ← generateOtp(), hashOtp()
    token.js                 ← generateAccessToken(), generateRefreshToken()
    sendEmail.js             ← Nodemailer Gmail OAuth2 transporter
    rateLimit.js             ← Redis-based rate limiter helper
    ApiError.js              ← Custom error class

  services/
    otp.service.js           ← sendRegisterOtp(), verifyRegisterOtp()
    token.service.js         ← createAuthTokens()

  middlewares/
    auth.middleware.js       ← verifyAuth (JWT + Redis blacklist check)

  controllers/
    auth.controller.js       ← register, verifyRegister, login, logout, refresh,
                                forgotPassword, verifyResetOtp, resetPassword

  routes/
    auth.route.js            ← all /auth/* routes

  app.js
  server.js
```

---

## 8. Critical Rules

> ⚠️ **These rules must never be broken**

| # | Rule |
|---|---|
| 1 | `refreshToken` is **NEVER** stored in MongoDB → Redis only (`auth:refresh:<userId>:<jti>`) |
| 2 | OTP is **NEVER** stored as plain text → SHA-256 hash with `OTP_SECRET` always |
| 3 | `password` is **NEVER** returned in API response → `toJSON()` deletes it |
| 4 | `isVerified` check is **MANDATORY** before login → unverified users cannot login |
| 5 | Every protected route **MUST** go through `verifyAuth` middleware |
| 6 | `verifyAuth` **MUST** check Redis blacklist → otherwise logout is meaningless |
| 7 | Access token in **cookie AND Authorization header** → both set on login/verify/refresh |
| 8 | `authType` field is set by Mongoose discriminator → **never set manually** |

| 9 | `resetToken` is **single-use** → Redis se immediately delete karo after password change |

---

### isVerified Flow — Both Auth Types

```
SimpleUserAuth:
  Register → isVerified: false
  OTP sent → User verifies OTP → isVerified: true
  Login allowed only after isVerified: true

GoogleAuth:
  Google callback → isVerified: true immediately
  (Google ne already email verify kiya hai — OTP ki zaroorat nahi)
  Login block nahi hoga Google users ke liye
```

---

## 9. Complete Sequence — Quick Reference

### Simple Auth — Register + Verify

| Step | Action |
|---|---|
| 1 | `POST /auth/register` → `{ name, email, password }` |
| 2 | Duplicate check → 409 if `isVerified: true` |
| 3 | `SimpleUserAuth.create()` → password bcrypt hashed, `authType: "SimpleUserAuth"` |
| 4 | Rate limit check (max 3 OTPs / 10 min) |
| 5 | 6-digit OTP generate → SHA-256 hash with `OTP_SECRET` |
| 6 | `Redis SET auth:otp:register:<email>` → EX 300 (5 min) |
| 7 | Nodemailer → OTP email send |
| 8 | Response: 201 "OTP sent" |
| 9 | `POST /auth/verify-register-otp` → `{ email, otp }` |
| 10 | Rate limit check (max 5 wrong / 10 min) |
| 11 | Redis GET → hash compare → DEL if match |
| 12 | `isVerified: true` → `createAuthTokens()` |
| 13 | `Redis SET auth:refresh:<userId>:<jti>` → EX 604800 (7 days) |
| 14 | Cookie: `accessToken` + `refreshToken` \| Header: `Authorization` |

---

### Simple Auth — Login

| Step | Action |
|---|---|
| 1 | `POST /auth/login` → `{ email, password }` |
| 2 | `SimpleUserAuth.findOne({ email })` → 404 if not found |
| 3 | Check `isVerified: true` → 403 if false |
| 4 | `bcrypt.compare(password, user.password)` → 401 if wrong |
| 5 | `createAuthTokens()` → Redis + cookie + header |

---

### Google Auth

| Step | Action |
|---|---|
| 1 | `GET /auth/google` → redirect to Google consent |
| 2 | User approves → Google redirects to `/auth/google/callback` |
| 3 | Passport: exchange code → get `accessToken` + `profile` |
| 4 | `GoogleAuth.findOne({ googleId })` → create or update |
| 5 | `isVerified: true` → update immediately (Google = verified) |
| 6 | `createAuthTokens()` → Redis + cookie + header |

---

### Logout

| Step | Action |
|---|---|
| 1 | `POST /auth/logout` → `verifyAuth` middleware runs first |
| 2 | `jwt.decode(accessToken)` → get `jti` + `exp` |
| 3 | `Redis SET auth:blacklist:access:<jti>` → EX remaining TTL |
| 4 | `jwt.decode(refreshToken)` → get `sub` + `jti` |
| 5 | `Redis DEL auth:refresh:<sub>:<jti>` |
| 6 | `clearCookie("accessToken")` + `clearCookie("refreshToken")` |

---

### Refresh Token

| Step | Action |
|---|---|
| 1 | `POST /auth/refresh-token` → refresh token from cookie |
| 2 | `jwt.verify(refreshToken, JWT_REFRESH_SECRET)` |
| 3 | `Redis GET auth:refresh:<sub>:<jti>` → null = revoked |
| 4 | `CommonUser.findById(decoded.sub)` |
| 5 | `generateAccessToken(user)` → new access token only |
| 6 | Cookie + Authorization header update |

---

### Reset Password

| Step | Action |
|---|---|
| 1 | `POST /auth/forgot-password` → `{ email }` |
| 2 | `SimpleUserAuth.findOne({ email })` → authType check → isVerified check |
| 3 | Rate limit check (max 3 / 10 min) |
| 4 | OTP generate → SHA-256 hash → `Redis SET auth:otp:reset:<email>` EX 600 |
| 5 | Nodemailer → OTP email send |
| 6 | `POST /auth/verify-reset-otp` → `{ email, otp }` |
| 7 | Rate limit check (max 5 / 10 min) |
| 8 | Redis GET → hash compare → DEL if match |
| 9 | `resetToken = crypto.randomUUID()` → `Redis SET auth:reset-token:<email>` EX 900 |
| 10 | Response: `{ resetToken }` |
| 11 | `POST /auth/reset-password` → `{ email, resetToken, newPassword }` |
| 12 | Redis reset token verify → DEL (single-use) |
| 13 | `user.password = newPassword` → `user.save()` → bcrypt auto-hash |
| 14 | All active sessions invalidate → `Redis DEL auth:refresh:<userId>:*` |

---

*Auth System — Developer Reference Doc*
