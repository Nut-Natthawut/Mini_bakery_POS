<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="Mini Bakery POS System" width="600" />
</p>

<h1 align="center">🥐 Mini Bakery POS (Point of Sale)</h1>

<p align="center">
  A full-stack web application designed for small bakery shops to manage products, orders, and receipts efficiently.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-336791?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss&logoColor=white" />
</p>

---

## 📋 Overview

**MiniBakery_POS** is a modern Point of Sale (POS) system built to specifically cater to the needs of local, small-scale bakeries. It provides an intuitive interface for business owners and staff to handle daily transactions, inventory management, and receipt generation.

**Key Features:**
- **Role-Based Access Control:** Separate permissions for Owners and Staff members.
- **Menu Management:** Full CRUD operations for bakery products, including image uploads via Supabase storage.
- **Order Processing:** Streamlined checkout process, bill generation, and duplicate order prevention.
- **Automated Receipts:** Utilizes PostgreSQL Stored Procedures to automatically generate and format receipts upon transaction completion.

---

## 👤 My Contribution

This project was developed collaboratively by a team of 4 members.

**Role:** SCRUM Master / Full-Stack Developer (`Nut-Natthawut`)

**Key Responsibilities & Achievements:**
- Led agile development cycles, organized sprints, and ensured the team met project milestones.
- Designed and implemented the backend architecture using **Next.js Server Actions** and **Prisma ORM**.
- Engineered the database schema and integrated **PostgreSQL via Supabase**.
- Authored advanced SQL **Stored Procedures** and **Triggers** to handle automated receipt generation and order validation (preventing duplicate active transactions).
- Managed version control (Git/GitHub) and repository structure.

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

```
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

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Postgres Database (or Supabase project)

### 1. Clone the repository
```bash
git clone https://github.com/Nut-Natthawut/Mini_bakery_POS.git
cd Mini_bakery_POS/app-pos
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the `app-pos` directory:
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
The app will be available at `http://localhost:3000`.

---

<p align="center">
  Built with Next.js, Prisma, and Supabase
</p>
