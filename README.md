<p align="center">
  <!-- TODO: Add actual screenshot of the app here -->
  <!-- <img src="docs/screenshots/dashboard.png" alt="Mini Bakery POS System" width="600" /> -->
</p>

<h1 align="center">🥐 Mini Bakery POS (Point of Sale)</h1>

<p align="center">
  A full-stack web application designed for small bakery shops to manage <strong>products, orders, and receipts</strong> efficiently.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma_ORM-2D3748?logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-336791?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss&logoColor=white" />
</p>

---

## 📋 Overview

**MiniBakery_POS** is a modern Point of Sale (POS) system built to specifically cater to the needs of local, small-scale bakeries. It provides an intuitive interface for business owners and staff to handle daily transactions, inventory management, and receipt generation.

**Key workflow:**
1. **Login:** Role-based access for Owners and Staff.
2. **Menu Management:** Owner manages product listings, prices, and uploads product images to Supabase storage.
3. **Transaction:** Staff creates orders by adding items to the cart and processing checkouts.
4. **Automated Receipt:** The database automatically generates a formatted receipt using PostgreSQL Stored Procedures upon successful transaction.
5. **Reporting:** Staff and Owner can review past orders and generated receipts.

---

## 👤 My Contribution

This project was developed collaboratively by a team of 4 members.

**Role:** SCRUM Master / Full-Stack Developer (`Nut-Natthawut`)

**Key Responsibilities & Achievements:**
- Led agile development cycles, organized sprints, and ensured the team met project milestones.
- Designed and implemented the backend architecture using **Next.js Server Actions** and **Prisma ORM**.
- Engineered the database schema and integrated **PostgreSQL via Supabase**.
- Authored advanced SQL **Stored Procedures** and **Triggers** to handle automated receipt generation and order validation (preventing duplicate active transactions).
- Managed version control (Git/GitHub), CI/CD preparations, and repository structure.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🛍️ **Menu Management** | Add, edit, delete products and upload images |
| 🛒 **Order Processing** | Cart management, total calculation, and secure checkout |
| 🧾 **Auto-Receipts** | Backend triggers generate receipts automatically via DB Stored Procedures |
| 🛡️ **JWT Security** | Secure login with HTTP-only cookies and robust middleware authorization |
| 👥 **Role Management** | Distinct experiences and capabilities for `Owner` vs `Staff` |
| 🔔 **Interactive UI** | Fast, responsive interface powered by React with immediate Toast notifications |

---

## 🏗️ Architecture

```text
┌──────────────────────────────┐     ┌──────────────────────────────┐
│         FRONTEND             │     │          BACKEND             │
│                              │     │                              │
│  Next.js 14 (App Router)     │────▶│  Next.js Server Actions      │
│  Tailwind CSS                │     │  Prisma ORM                  │
│  ShadCN / Radix UI           │     │  PostgreSQL (Supabase)       │
│                              │     │  JWT Auth Middleware         │
│                              │     │                              │
└──────────────────────────────┘     └──────────────────────────────┘
```

### Tech Stack Breakdown

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14, React 18, Tailwind CSS | UI Components, Routing, and Styling |
| **Backend** | Next.js Server Actions | API layer and server-side logic |
| **Database**| PostgreSQL (Supabase), Prisma ORM | Data storage, Relations, Stored Procedures |
| **Storage** | Supabase Storage | Managing and serving product images |
| **Security**| JWT (JSON Web Tokens) | Stateless Authentication |

---

## 🗂️ Project Structure

```text
Mini_bakery_POS/
├── app-pos/
│   ├── prisma/                  # Database Schema & Migrations
│   │   └── schema.prisma        # Prisma Object-Relational Mapping (ORM) schema
│   │
│   ├── src/
│   │   ├── actions/             # Server Actions (SSR Backend Logic & Database Mutations)
│   │   │
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── api/             # API Routes (auth, reports, users)
│   │   │   ├── login/           # Authentication interface
│   │   │   ├── register/        # User registration interface
│   │   │   └── Owner/           # Dashboard & POS Interface (Menu, Orders, Receipts)
│   │   │
│   │   ├── components/          # Reusable React UI Components
│   │   │   ├── sidebar/         # Dashboard navigation components
│   │   │   └── ui/              # ShadCN / Radix UI building blocks (buttons, inputs)
│   │   │
│   │   ├── hooks/               # Custom React Hooks
│   │   │
│   │   ├── lib/                 # Core Utilities & Services
│   │   │   ├── auth.ts          # Authentication logic
│   │   │   ├── prisma.ts        # Prisma Client instance
│   │   │   ├── supabaseServer.ts# Supabase storage integration
│   │   │   └── page-guards.ts   # Route access protection helpers
│   │   │
│   │   ├── utils/               # Helper functions
│   │   ├── validation/          # Zod schema validations for forms and API
│   │   └── types/               # Global TypeScript definitions
│   │
│   ├── middleware.ts            # Next.js Middleware for JWT & Route protection
│   ├── next.config.mjs          # Next.js configuration
│   ├── tailwind.config.js       # Tailwind CSS design system settings
│   └── package.json             # Project dependencies and scripts
│
└── README.md                    # Project Documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **PostgreSQL Database** (or a Supabase project)

### 1. Clone the repository

```bash
git clone https://github.com/Nut-Natthawut/Mini_bakery_POS.git
cd Mini_bakery_POS/app-pos
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the `app-pos/` directory:

```env
DATABASE_URL="postgresql://user:password@host:port/dbname"
DIRECT_URL="postgresql://user:password@host:port/dbname"
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
JWT_SECRET="your_secure_secret"
```

### 4. Database Setup

Ensure your PostgreSQL database is running, then apply the schema:

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

---

## 📦 Deployment

### Deploying to Vercel

The easiest way to deploy this Next.js app is using [Vercel](https://vercel.com/):

1. Push your code to GitHub.
2. Import the project into Vercel.
3. Set the **Root Directory** to `app-pos`.
4. Add the Environment Variables (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, etc.) in the Vercel Dashboard.
5. Click **Deploy**.

---

## 🛡️ Security

- **JWT Authentication** — Sessions managed via secure, HTTP-only cookies.
- **Middleware Protection** — Unauthorized access to Dashboard/POS routes is blocked at the edge.
- **Supabase Row Level Security (RLS)** — Protects direct queries to the database.
- **Backend Validation** — Ensuring pricing and transactional integrity server-side.

---

<p align="center">
  Built with Next.js, Prisma, and Supabase
</p>
