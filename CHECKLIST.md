# OMEGA FUELS — Implementation Checklist & Progress Tracker

This checklist tracks the end-to-end development of the **OMEGA FUELS** mobile-first web application.

---

## 🏁 Phase 1: Foundation, Base App Shell & Design System (COMPLETED)
- [x] Comprehensive review and analysis of PRD, Database Schema, Design System & Implementation Plan
- [x] Set up Next.js 15 App Router, React 19, TypeScript, Tailwind CSS Design System
- [x] Configure Supabase PostgreSQL schema with 13 tables, RLS policies, custom ENUMs, and indexes (`supabase/migrations/001_initial_schema.sql`)
- [x] Implement secure session authentication with role claims & password hashing
- [x] Build Role-Based Access Control (RBAC) middleware for `ADMIN` and `MANAGER`
- [x] Build Tailwind CSS Design System tokens supporting light (`#F6F7FB`) and dark (`#0F172A`) themes
- [x] Build shared UI components (Button, Input, Card, Badge, Modal, ActionSheet, MetricCard)
- [x] Implement responsive layout shell:
  - Mobile bottom navigation (`Home`, `Cash`, `Reports`, `More`) with floating Quick Action FAB
  - Desktop sidebar + header with user profile & quick theme toggle
  - Quick action floating sheet for mobile data entry
- [x] Login page (`/login`) with 1-tap demo account switcher and validation
- [x] Dashboard shells for Admin (`/admin/dashboard`) and Manager (`/dashboard`)

---

## 🏁 Phase 2: Employee Management & Shift/Payment Entry (COMPLETED)
- [x] Employee CRUD Service & API (`/api/employees`, `/api/employees/[id]`): Name, phone, notes, status (`ACTIVE`/`INACTIVE`)
- [x] Employee Directory UI (`/employees`): Search, status filter, Add/Edit modal, soft activate/deactivate toggle
- [x] Mobile-optimized Shift Entry Flow (`/shifts/new`):
  - Step 1: Active Employee picker, Date, Shift Type (`MORNING`, `EVENING`, `NIGHT`, `CUSTOM`), notes
  - Step 2: Payment Breakdown (Cash, UPI, Card, Credit) with customer chit assignment
  - Step 3: Dynamic Other Sales items (Engine oils, 2T pouches)
  - Step 4: Live calculation, reconciliation review, and atomic database submission
- [x] Shift History Directory (`/shifts`): Filtering by date and operator with summary KPI aggregations
- [x] Direct atomic posting to Cash Ledger (`SHIFT_CASH`) and Credit Book (`CREDIT_GIVEN`)
- [x] Append-only audit logging for employee changes and shift entries

---

## ⏳ Phase 3: Central Cash Ledger & Owner Cash Collection
- [ ] Central Cash Ledger transaction engine (`cash_ledger`)
- [ ] Shift Cash event handler (positive cash flow)
- [ ] Credit Repayment Cash event handler (positive cash flow)
- [ ] Owner Cash Collection interface (`/cash`):
  - Amount, date/time, notes, recorded by
  - Immediate negative ledger entry
  - Running expected available cash calculation (Zero double-counting)
- [ ] Cash reconciliation dashboard card and daily cash balance check

---

## ⏳ Phase 4: Fuel Inventory, Price Management & Deliveries
- [ ] Fuel price management interface (`/fuel`): Petrol & Diesel price history
- [ ] Fuel stock transaction engine (`fuel_stock_transactions`)
- [ ] New Fuel Delivery entry: Litres, cost/litre, total cost, supplier, challan/ref no.
- [ ] Test Fuel Usage entry: Litres, snapshot price, calculated value/loss
- [ ] Generator Fuel Usage entry: Litres, backup generator notes
- [ ] Stock adjustment entry with mandatory reason and audit log
- [ ] Live petrol and diesel stock level indicators (Litres)

---

## ⏳ Phase 5: Credit Book & Customer Ledger
- [ ] Credit Customer directory (`/credit`): Name, phone, notes, active status
- [ ] Credit Given entry (linkable from shift or direct)
- [ ] Credit Repayment entry:
  - Cash Repayment -> credits customer balance AND updates Cash Ledger
  - UPI / Bank Transfer Repayment -> credits customer balance without affecting physical cash
- [ ] Customer statement / ledger history view
- [ ] Total outstanding credit balance calculation

---

## ⏳ Phase 6: Expenses, Reports & Analytics
- [ ] Expense Tracker (`/expenses`): Category, description, amount, date
- [ ] Operational Manager Dashboard (`/dashboard`): Today's sales, expected cash, remaining cash, fuel stock, credit outstanding, quick actions
- [ ] Executive Admin Dashboard (`/admin/dashboard`): Revenue KPIs, payment method breakdown, fuel usage/loss, cash reconciliation, trend charts
- [ ] Reports Engine (`/reports`):
  - Daily, Weekly, Monthly, Custom Date Range
  - Employee-wise sales performance
  - Fuel stock movement report
  - Credit customer aging report
  - Expense breakdown report
  - Owner collection summary report

---

## ⏳ Phase 7: Audit Trail, Multi-Sheet Data Export & Polish
- [ ] System-wide Audit Log inspector (`/admin/audit-logs`) with module, actor, and date filters
- [ ] Secure Data Export Engine (`/reports`):
  - Excel `.xlsx` multi-sheet workbook (13 distinct sheets via ExcelJS)
  - CSV `.csv` single-module streams
  - Scope and date range filtering
- [ ] Mobile touch target polish (> 44px)
- [ ] Performance audit: query indexing, lazy loading, lightweight rendering
- [ ] End-to-end operational flow verification
