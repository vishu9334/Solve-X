# Solve-X API Endpoints Documentation (Port: 8001)

This document contains the complete list of backend API endpoints for the Solve-X platform. All endpoints are hosted on port `8001`.

**Base URL**: `http://localhost:8001/api/v1`

---

## 🔑 1. Authentication APIs

### ➔ Register User
* **Method**: `POST`
* **Path**: `/register`
* **Auth**: ❌ No
* **Request Body**:
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "Password123!",
    "role": "mentor" // "student" | "mentor" | "admin" (default: "student")
  }
  ```
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "email": "user@example.com",
      "message": "OTP sent successfully."
    },
    "message": "OTP send on your email."
  }
  ```

---

### ➔ Verify OTP
* **Method**: `POST`
* **Path**: `/verify-otp`
* **Auth**: ❌ No
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "1234"
  }
  ```
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "accessToken": "JWT_ACCESS_TOKEN",
      "refreshToken": "JWT_REFRESH_TOKEN",
      "userObj": {
        "_id": "USER_ID",
        "name": "User Name",
        "email": "user@example.com",
        "role": "mentor"
      }
    },
    "message": "User register successful"
  }
  ```

---

### ➔ Login
* **Method**: `POST`
* **Path**: `/login`
* **Auth**: ❌ No
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "accessToken": "JWT_ACCESS_TOKEN",
      "refreshToken": "JWT_REFRESH_TOKEN",
      "userObj": {
        "_id": "USER_ID",
        "name": "User Name",
        "email": "user@example.com",
        "role": "mentor"
      }
    },
    "message": "Login successful"
  }
  ```

---

### ➔ Regenerate Access Token
* **Method**: `POST`
* **Path**: `/regenerate-token`
* **Auth**: ❌ No (Uses Cookie)
* **Cookies**: `refreshToken`
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "accessToken": "NEW_JWT_ACCESS_TOKEN"
    },
    "message": "Access token regenerated successfully."
  }
  ```

---

### ➔ Logout
* **Method**: `POST`
* **Path**: `/logout`
* **Auth**: ✅ Bearer Token
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {},
    "message": "Logged out successfully."
  }
  ```

---

## 🎓 2. Student APIs

### ➔ Ask a Doubt
* **Method**: `POST`
* **Path**: `/student/ask-doubt/:userId`
* **Auth**: ✅ Bearer Token
* **Query Params**:
  - `skillIdentifier`: (Mongoose ObjectID / slug of the Skill)
  - `selectSessionTime`: (Session duration in minutes, e.g. `15`)
* **Request Body**:
  ```json
  {
    "typeWriteQuestion": "Doubt explanation description goes here..."
  }
  ```
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "doubtSessionId": "SESSION_ID",
      "mentorsNotified": 3,
      "message": "Your doubt has been sent to mentors. You will receive offers within 10 minutes."
    },
    "message": "Your doubt has been sent to mentors. Please wait for offers."
  }
  ```

---

### ➔ Select a Mentor Offer
* **Method**: `POST`
* **Path**: `/student/select-mentor/:doubtSessionId`
* **Auth**: ✅ Bearer Token
* **Request Body**:
  ```json
  {
    "selectedMentorId": "MENTOR_USER_ID"
  }
  ```
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "chatRoomId": "doubt_SESSION_ID_TIMESTAMP",
      "selectedMentorId": "MENTOR_USER_ID",
      "price": 20,
      "sessionDuration": 15
    },
    "message": "Mentor selected successfully. Chat room is ready."
  }
  ```

---

### ➔ End Active Session
* **Method**: `POST`
* **Path**: `/student/end-session/:doubtSessionId`
* **Auth**: ✅ Bearer Token
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "message": "Session ended successfully."
    },
    "message": "Session ended."
  }
  ```

---

## 👨‍🏫 3. Mentor & Assessment APIs

### ➔ List Active Skills
* **Method**: `GET`
* **Path**: `/skills`
* **Auth**: ❌ No
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "_id": "SKILL_ID",
        "name": "Mern Stack",
        "slug": "mern-stack",
        "description": "Full stack description",
        "mentorCount": 5,
        "source": "admin"
      }
    ],
    "message": "Skills fetched successfully."
  }
  ```

---

### ➔ Select Skill & Generate Assessment
* **Method**: `POST`
* **Path**: `/mentor/select-skill`
* **Auth**: ✅ Bearer Token
* **Request Body**:
  ```json
  {
    "skillName": "Mern Stack" // Or "skillId"
  }
  ```
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "skill": { "_id": "SKILL_ID", "name": "Mern Stack" },
      "attempt": { "_id": "ATTEMPT_ID", "status": "pending" },
      "questions": {
        "durationMinutes": 15,
        "questions": [
          {
            "questionText": "What does MERN stand for?",
            "options": ["MongoDB, Express, React, Node", "MySQL, Express, Ruby, Node", "other"],
            "correctAnswer": "MongoDB, Express, React, Node"
          }
        ]
      }
    }
  }
  ```

---

### ➔ Submit Assessment
* **Method**: `POST`
* **Path**: `/mentor/submit-assessment`
* **Auth**: ✅ Bearer Token
* **Request Body**:
  ```json
  {
    "attemptId": "ATTEMPT_ID",
    "sessionId": "PROCTORING_SESSION_ID",
    "answers": [
      {
        "questionId": "What does MERN stand for?",
        "selectedAnswer": "MongoDB, Express, React, Node"
      }
    ]
  }
  ```
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "attemptStatus": "passed", // "passed" | "failed" | "in_progress"
      "evaluation": {
        "score": 100,
        "isPassed": true,
        "isClean": true,
        "activityDecision": "clean"
      }
    }
  }
  ```

---

### ➔ Bid on Student Doubt (Send Offer)
* **Method**: `POST`
* **Path**: `/mentor/reply-doubt`
* **Auth**: ✅ Bearer Token
* **Request Body**:
  ```json
  {
    "doubtSessionId": "SESSION_ID",
    "price": 20, // Overridden automatically to ₹20 per doubt in backend for now
    "availableTime": "Immediate"
  }
  ```
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "message": "Offer sent to student successfully.",
      "doubtSessionId": "SESSION_ID"
    }
  }
  ```

---

## 🛡️ 4. Proctoring / Activity Session APIs

### ➔ Start Proctoring Session
* **Method**: `POST`
* **Path**: `/activity-sessions/start`
* **Auth**: ✅ Bearer Token
* **Request Body**:
  ```json
  {
    "category": "Mern Stack",
    "screen": {
      "innerWidth": 1920,
      "innerHeight": 1080,
      "isFullscreen": true
    }
  }
  ```
* **Success Response (201)**:
  ```json
  {
    "statusCode": 201,
    "data": {
      "_id": "PROCTORING_SESSION_ID",
      "userId": "USER_ID",
      "category": "Mern Stack",
      "activityDecision": "clean",
      "events": []
    }
  }
  ```

---

### ➔ Record Proctoring Event
* **Method**: `POST`
* **Path**: `/activity-sessions/:sessionId/events`
* **Auth**: ✅ Bearer Token
* **Request Body**:
  ```json
  {
    "eventType": "TAB_SWITCHED", // "TAB_SWITCHED" | "WINDOW_BLUR" | "FULLSCREEN_EXITED" etc.
    "message": "User left browser tab",
    "screen": {
      "innerWidth": 1920,
      "innerHeight": 1080,
      "isFullscreen": false
    }
  }
  ```
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "warningCount": 1,
      "criticalCount": 1,
      "activityDecision": "clean", // Becomes "rejected" if violations >= 3
      "totalEvents": 1
    }
  }
  ```

---

## 📊 5. Dashboard APIs

### ➔ Student Dashboard
* **Method**: `GET`
* **Path**: `/dashboard/student`
* **Auth**: ✅ Bearer Token (Role: `student`)
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "profile": {
        "name": "Dashboard Student",
        "email": "student@solve-x.com",
        "subscriptionStatus": "active",
        "subscriptionExpiresAt": "2026-07-16T12:00:00.000Z"
      },
      "stats": {
        "totalAsked": 5,
        "openAsked": 1,
        "activeAsked": 0,
        "completedAsked": 4
      },
      "recentSessions": [...]
    }
  }
  ```

---

### ➔ Mentor Dashboard
* **Method**: `GET`
* **Path**: `/dashboard/mentor`
* **Auth**: ✅ Bearer Token (Role: `mentor`)
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "profile": {
        "name": "Dashboard Mentor",
        "email": "mentor@solve-x.com",
        "isVerifiedMentor": true,
        "verificationStatus": "approved",
        "skill": { "name": "Mern Stack", "slug": "mern-stack" }
      },
      "stats": {
        "totalResolved": 10,
        "totalEarnings": 200, // calculated dynamically at ₹20 per completed session
        "hasActiveSession": false
      },
      "activeSession": null,
      "recentSessions": [...],
      "opportunities": [...] // open doubts matching mentor's skill category
    }
  }
  ```

---

### ➔ Admin Dashboard
* **Method**: `GET`
* **Path**: `/dashboard/admin`
* **Auth**: ✅ Bearer Token (Role: `admin`)
* **Success Response (200)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "users": {
        "totalStudents": 150,
        "totalMentors": 45
      },
      "mentors": {
        "approvedMentors": 30,
        "pendingMentors": 15
      },
      "subscriptions": {
        "activeSubscriptions": 80
      },
      "doubtSessions": {
        "total": 350,
        "open": 20,
        "live": 5,
        "completed": 325
      },
      "recentSessions": [...],
      "popularSkills": [...]
    }
  }
  ```
