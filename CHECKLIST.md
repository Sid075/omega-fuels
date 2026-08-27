# OMEGA FUELS — Implementation Checklist & Progress Tracker

This checklist tracks the end-to-end development of the **OMEGA FUELS** mobile-first web application.

---

## 🏁 Phase 1: Foundation, Base App Shell & Design System (CURRENT)
- [x] Comprehensive review and analysis of PRD, Database Schema, Design System & Implementation Plan
- [x] Set up project environment (Next.js 15 App Router, React 19, TypeScript, Vanilla CSS Design System)
- [x] Configure SQLite database with transaction safety and relational tables
- [x] Implement seed database script with default users (`Admin`, `Manager`) and default fuel pricing
- [x] Implement secure session authentication (JWT with role claims, HTTP-only cookies, password hashing)
- [x] Build Role-Based Access Control (RBAC) middleware for `ADMIN` and `MANAGER`
- [x] Build CSS Design System tokens (`globals.css` supporting light and dark themes)
- [x] Build shared UI components (Button, Input, Card, Badge, Modal, ActionSheet, StatusAlert, IconWrapper)
- [x] Implement responsive layout shell:
  - Mobile bottom navigation (`Home`, `Entry`, `Reports`, `More`)
  - Desktop sidebar + header with user profile & quick theme toggle
  - Quick action floating sheet for mobile data entry
- [x] Login page (`/login`) with role-based dashboard redirection
- [x] Dashboard shell for Admin and Manager roles

---

## ⏳ Phase 2: Employee Management & Shift/Payment Entry
- [ ] Employee CRUD API & UI (`/employees`): Name, phone, status (`ACTIVE`/`INACTIVE`), notes
- [ ] Mobile-optimized Shift Entry Flow (`/shifts/new`):
  - Step 1: Employee, Date, Shift Type (`MORNING`, `EVENING`, `NIGHT`, `CUSTOM`)
  - Step 2: Payment Breakdown (Cash, UPI, Card, Credit)
  - Step 3: Other Sales dynamic line items (description + amount)
  - Step 4: Summary calculation, validation and confirmation
- [ ] Shift history and employee shift review list
- [ ] Audit logs for shift creation and editing

---

## ⏳ Phase 3: Central Cash Ledger & Owner Cash Collection
- [ ] Central Cash Ledger transaction engine (`cash_ledger`)
- [ ] Shift Cash event handler (positive cash flow)
- [ ] Credit Repayment Cash event handler (positive cash flow)
- [ ] Owner Cash Collection interface (`/cash/owner-collection`):
  - Amount, date/time, notes, recorded by
  - Immediate negative ledger entry
  - Running expected available cash calculation (Zero double-counting)
- [ ] Cash reconciliation dashboard card and daily cash balance check

---

## ⏳ Phase 4: Fuel Inventory, Price Management & Deliveries
- [ ] Fuel price management interface (`/fuel/prices`): Petrol & Diesel price history
- [ ] Fuel stock transaction engine (`fuel_stock_transactions`)
- [ ] New Fuel Delivery entry (`/fuel/deliveries`): Litres, cost/litre, total cost, supplier, challan/ref no.
- [ ] Test Fuel Usage entry (`/fuel/usage/test`): Litres, snapshot price, calculated value
- [ ] Generator Fuel Usage entry (`/fuel/usage/generator`): Litres, backup generator notes
- [ ] Stock adjustment entry with mandatory reason and audit log
- [ ] Live petrol and diesel stock level indicators (Litres)

---

## ⏳ Phase 5: Credit Book & Customer Ledger
- [ ] Credit Customer directory (`/credit`): Name, phone, notes, active status
- [ ] Credit Given entry (linkable from shift or direct)
- [ ] Credit Repayment entry (`/credit/payment`):
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
- [ ] Secure Data Export Engine (`/reports/export`):
  - Excel `.xlsx` multi-sheet workbook (13 distinct sheets)
  - CSV `.csv` single-module streams
  - Scope and date range filtering
- [ ] Mobile touch target polish (> 44px)
- [ ] Performance audit: query indexing, lazy loading, lightweight rendering
- [ ] End-to-end operational flow verification
