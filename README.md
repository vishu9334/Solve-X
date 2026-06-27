<div align="center">

<img src="xClient/public/logo.png" alt="Solve-X Logo" width="90" />

# Solve-X

**A real-time doubt-solving platform that connects students with expert mentors through live bidding, chat workspaces, and video sessions.**

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen?style=for-the-badge)](https://github.com/vishu9334/Solve-X/blob/main/DEMO_CREDENTIALS.md)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)

</div>

---

## 📖 What is Solve-X?

Solve-X is a full-stack mentorship platform where **students** post academic doubts, **mentors** bid with their price and availability, and the student selects the best offer. Once matched, they collaborate in a **real-time chat workspace** with live video support via **Jitsi Meet**.

---

## ✨ Key Features

### 🎓 For Students
- Post doubt sessions with subject, description, and duration
- Receive real-time mentor bid offers via WebSocket notifications
- Accept or decline offers directly from the notification panel
- Join a live chat workspace and start a video session

### 👨‍🏫 For Mentors
- Receive new doubt notifications with session details
- Submit competitive bid offers (price + available time)
- Access a specialized assessment to get certified in skills
- Join active chat sessions and initiate Jitsi video calls

### 🛡️ For Admins
- Full system overview dashboard
- User and session management
- Platform analytics and activity monitoring

### ⚙️ Platform
- 🔔 Real-time notifications with persistent Zustand store (survives refresh)
- 💬 Live bidirectional chat via Socket.io
- 📹 Video calls via Jitsi Meet (no billing, fully open-source)
- 🔐 JWT authentication with OTP email verification
- 📱 Fully responsive — works on mobile and desktop
- 🎨 Premium dark glassmorphic UI with Framer Motion animations

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion |
| State Management | Zustand, TanStack React Query |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Real-time | Socket.io |
| Auth | JWT, bcrypt, OTP via Nodemailer |
| Video | Jitsi Meet (open-source) |
| Queue | BullMQ + Redis |
| Email | Brevo (Sendinblue) |
| Validation | Zod (client + server) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- Redis (for BullMQ job queue)

### Installation

```bash
# Clone the repository
git clone https://github.com/vishu9334/Solve-X.git
cd Solve-X

# Install backend dependencies
cd xServer && npm install

# Install frontend dependencies
cd ../xClient && npm install
```

### Environment Variables

**xServer/.env**
```env
PORT=8001
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
BREVO_API_KEY=your_brevo_api_key
FROM_EMAIL=your_sender_email
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

**xClient/.env**
```env
VITE_API_URL=http://localhost:8001/api/v1
```

### Run

```bash
# Backend (from xServer/)
npm run dev

# Frontend (from xClient/)
npm run dev
```

App runs at: `http://localhost:5173`

---

## 🎭 Demo Access

Want to explore without setting up? Use the pre-configured demo accounts:

👉 **[View Demo Credentials](./DEMO_CREDENTIALS.md)**

| Role | Access |
|------|--------|
| Mentor | Pre-configured account — see DEMO_CREDENTIALS.md |
| Admin | Pre-configured account — see DEMO_CREDENTIALS.md |
| Student | Register freely with any email |

---

## 📁 Project Structure

```
Solve-X/
├── xClient/                  # React frontend (Vite)
│   └── src/
│       ├── app/              # Router & Providers
│       ├── features/         # Feature modules (auth, chat, doubt, etc.)
│       ├── shared/           # Shared components, layouts, pages
│       └── lib/              # Axios, queryClient
│
└── xServer/                  # Node.js backend (Express)
    └── src/
        ├── controllers/      # Route handlers
        ├── services/         # Business logic
        ├── models/           # Mongoose schemas
        ├── routes/           # Express routers
        ├── middlewares/      # Auth, validation, error handling
        └── utils/            # Helpers and utilities
```

---

## 🔄 Core User Flow

```
Student posts doubt
       ↓
Mentors receive real-time notification
       ↓
Mentors submit bid (price + time slot)
       ↓
Student reviews & accepts best offer
       ↓
Chat room created → Live workspace opens
       ↓
Video session starts via Jitsi Meet
       ↓
Session completed → Status updated
```

---

## 📄 License

This project is built for educational and portfolio purposes.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/vishu9334">Vishal Kumar</a></sub>
</div>
