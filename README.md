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

## 💡 The Problem We Solve

Students often struggle with doubts they can't resolve alone — and finding the right expert at the right time is hard.

On the other side, talented mentors and subject matter experts have knowledge and skills to offer but **no easy way to monetize them online.**

**Solve-X bridges that gap.**

---

## 📖 What is Solve-X?

**Solve-X** is a real-time mentorship marketplace where:

- 🎓 **Students** post their academic doubts and instantly connect with qualified mentors
- 👨‍🏫 **Mentors** bid on student doubts using their skill, knowledge, and availability — and **earn money** for every session they solve
- 🛡️ **Admins** manage the entire ecosystem from a central dashboard

It works like a **live auction for knowledge** — the student sees all incoming offers and selects the mentor who best fits their need and budget.

---

## 🔄 How It Works

### 👩‍🎓 If you are a Student

```
1. Sign up → Post your doubt (topic, description, session duration)
         ↓
2. Mentors receive your doubt in real-time and submit bid offers
   (each offer includes: price + available time slot)
         ↓
3. You review all offers from your notification panel
         ↓
4. Accept the best offer → A private chat workspace opens instantly
         ↓
5. Chat live with your mentor + join a video call via Jitsi Meet
         ↓
6. Session ends → Problem solved ✅
```

### 👨‍🏫 If you are a Mentor

```
1. Sign up → Complete a skill assessment to get certified
         ↓
2. Receive real-time notifications when students post doubts
   in your area of expertise
         ↓
3. Review the doubt details and submit a competitive bid offer
   (set your own price and availability)
         ↓
4. If student accepts → Chat room opens and session begins
         ↓
5. Conduct the session via live chat + Jitsi video call
         ↓
6. Session completed → Earnings recorded ✅
```

> 💰 **Mentors earn by solving real problems.** The more sessions, the more income — all based on their own skills and effort.

---

## ✨ Platform Features

| Feature | Description |
|---------|-------------|
| 🔔 Real-time Notifications | Instant doubt alerts and offer updates via Socket.io |
| 💬 Live Chat Workspace | Private bidirectional chat room per session |
| 📹 Video Sessions | Jitsi Meet integration — no billing, no limits |
| 🏆 Mentor Assessment | Skill-based certification before a mentor can bid |
| 🔐 Secure Auth | JWT + OTP email verification |
| 📱 Responsive UI | Works on mobile, tablet, and desktop |
| 🎨 Premium Design | Dark glassmorphic UI with Framer Motion animations |
| ♻️ Persistent State | Notifications survive page refresh via Zustand + localStorage |

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
