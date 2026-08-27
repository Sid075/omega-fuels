# OMEGA FUELS ⛽

A modern, mobile-first fuel station management web application designed for fast on-the-ground operational data entry and rigorous financial ledger tracking.

---

## 🌟 Key Features
- **Mobile-First Operation**: Designed specifically for fast smartphone entry by station managers.
- **Double-Count-Proof Cash Reconciliation**: Real-time ledger accounting for shift cash, digital payments, and mid-shift owner cash collections.
- **Fuel Stock Ledger (Litres Precision)**: Petrol and Diesel volume tracking with delivery, sales, generator usage, and nozzle test loss tracking.
- **Credit Customer Book**: Track credit issued and repayments with strict cash vs. digital split.
- **Strict Role-Based Access Control**:
  - `MANAGER`: Fast operational shift recording, expenses, stock receipt, and cash collection logging.
  - `ADMIN`: Executive dashboards, profit & loss, stock loss analysis, audit logs, and multi-sheet Excel/CSV exports.
- **Pure Vanilla CSS Design System**: Clean, high-performance UI meeting strict contrast requirements in Light and Dark mode. No emojis, only clean SVG icons.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with ACID Transactions & Relational Ledger Schema
- **Styling**: Pure Vanilla CSS Design System with CSS Custom Properties
- **Icons**: Lucide Icons (SVG)
- **Authentication**: Secure Session JWT with HttpOnly Cookies & BCrypt Hashing

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ or v20+ LTS recommended)
- npm or pnpm

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Run Database Seed (Initializes tables & demo accounts)
npm run db:seed

# 3. Start Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@omegafuels.com` | `Admin@12345` |
| **Manager** | `manager@omegafuels.com` | `Manager@12345` |
