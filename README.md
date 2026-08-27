# 🚕 CampusLift — Student Travel Discovery & Group Coordination Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

**CampusLift** is a college-focused student travel coordination platform designed to help verified college students discover peers traveling between campus and popular transport hubs (railway stations, bus terminals, airports, metro stations) at similar times to form shared Auto/Taxi groups and split transit costs safely.

---

## 🌟 Key Features

- 🎓 **Domain-Locked Student Verification**: Enforces college email domain matching (`@college.edu`) during registration with email verification links.
- 🧭 **Directional Travel Browsing**: Filter active groups and travel intents by `FROM CAMPUS` or `TO CAMPUS` directions, destination hubs, and date.
- ⏱️ **Time Preference Engine**: Supports both **TIME RANGE** (`[startTime, endTime]`) and **FLEXIBLE TIME** (`preferredTime ± flexMinutes`).
- 🧠 **Smart Matching Engine**: Automatically calculates overlapping effective time windows ($\min(\text{end}_A, \text{end}_B) - \max(\text{start}_A, \text{start}_B)$), route equality, and quality match scoring.
- 👥 **User-Driven Group Formation**: When posting a travel intent, students can browse existing compatible groups, join an existing group with 1-click, or explicitly create their own travel group.
- 💬 **Real-Time Group Chat**: Built with Socket.IO, authenticated via HTTP-only JWT session cookies, featuring live messages and system event broadcasts (time updates, meeting point confirmations).
- ⭐ **Post-Trip Peer Experience Ratings**: Submit 1–5 star ratings, experience tags (*On time*, *Good communication*, *Reliable*, *Respectful*), and feedback after trip completion.
- 🛡️ **Safety & Moderation**: User blocking, harassment reporting, and background block isolation across matching and chat.
- 👑 **Admin Dashboard**: Student account suspension/reactivation, student account deletion (with cascading data cleanup), college email domain management, predefined popular location CRUD, and safety report auditing.
- 📱 **Mobile-First Responsive UI**: Styled with React 18, Vite, Tailwind CSS, Lucide icons, skeleton loaders, and interactive modals.

---

## 🏗️ Architecture & Monorepo Structure

```text
campusLift/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL Database Schema & Model Definitions
│   │   └── seed.ts             # Demo Colleges, Locations, Admin & Student Seed Script
│   ├── src/
│   │   ├── config/             # Environment & Prisma client instances
│   │   ├── controllers/        # Express REST controllers (Auth, Groups, Intents, Admin, etc.)
│   │   ├── middleware/         # JWT Auth & Admin Authorization middleware
│   │   ├── routes/             # API Router definitions (/api/*)
│   │   ├── sockets/            # Socket.IO Real-time chat & room gateway
│   │   ├── utils/              # Matching engine formulas & email mailer helpers
│   │   └── validators/         # Zod payload validation schemas
│   └── tests/                  # Backend unit tests (Vitest)
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable React UI components (GroupCard, Navbar, Modals, etc.)
│   │   ├── context/            # AuthContext for session management
│   │   ├── layouts/            # AppLayout, AuthLayout, AdminLayout
│   │   ├── lib/                # API fetch helpers & Socket.IO client singleton
│   │   └── pages/              # Student pages & Admin Dashboard views
│   ├── index.html
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Router v6, TanStack Query, Socket.IO Client, Lucide React Icons.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Socket.IO, bcryptjs, Zod, Resend Email API, Vitest.
- **Database**: PostgreSQL with Prisma Schema & Migrations.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.x or v20.x
- **npm**: v9.x or higher
- **PostgreSQL Database**: Local Postgres instance or a free cloud database on [Neon.tech](https://neon.tech)

### 2. Environment Configuration

Create a `.env` file in `backend/` and `frontend/`:

**Backend Environment (`backend/.env`)**:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/campuslift?schema=public"
JWT_SECRET="super-secret-jwt-key-campuslift-2026"
FRONTEND_URL="http://localhost:5173"
RESEND_API_KEY="re_123456789" # Optional for email sending
FROM_EMAIL="onboarding@resend.dev"
```

**Frontend Environment (`frontend/.env`)**:
```env
VITE_API_URL="http://localhost:5000/api"
VITE_SOCKET_URL="http://localhost:5000"
```

### 3. Installation & Database Initialization

Run the following commands from the root directory:

```bash
# 1. Install root, backend, and frontend workspace dependencies
npm install

# 2. Generate Prisma Client
npm run db:generate

# 3. Push schema to PostgreSQL database
npm run db:push

# 4. Seed demo colleges, locations, admin, and student accounts
npm run db:seed
```

### 4. Run Development Server

Start both the backend Express server (Port 5000) and frontend Vite app (Port 5173) concurrently:

```bash
npm run dev
```

Visit **http://localhost:5173** in your web browser.

---

## 🔑 Pre-configured Demo Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@apex.edu` | `Admin123!` | Full Admin Dashboard access |
| **🎓 Verified Student 1** | `aman@apex.edu` | `Student123!` | Computer Science, 3rd Year |
| **🎓 Verified Student 2** | `rahul@apex.edu` | `Student123!` | Mechanical Eng, 2nd Year |
| **🎓 Verified Student 3** | `priya@apex.edu` | `Student123!` | Electrical Eng, 4th Year |
| **⚠️ Unverified Student** | `ananya@apex.edu` | `Student123!` | Requires email verification |

---

## 🧪 Testing & Production Build

### Run Unit Tests
Run backend unit tests for the matching engine, auth validation, and group rules:
```bash
npm run test
```

### Build Production Bundle
Build both backend TypeScript code and frontend Vite bundle:
```bash
npm run build
```

---

## 📄 API Endpoint Summary

- `POST /api/auth/register` — Register student account (email domain validated against college domain)
- `POST /api/auth/login` — Authenticate and issue HTTP-only JWT cookie
- `GET /api/intents/feed` — Get active travel groups & intents by direction & location
- `POST /api/intents` — Save travel intent & return compatible existing groups
- `POST /api/groups/join` — Join an existing open travel group
- `POST /api/groups/create` — Explicitly create a new travel group for an intent
- `PATCH /api/groups/:id/time` — Propose common travel time
- `PATCH /api/groups/:id/meeting-point` — Confirm campus meeting point
- `POST /api/trips/rate` — Submit post-trip student ratings (1–5 stars)
- `DELETE /api/admin/users/:userId` — Delete student account & cascade all user data
