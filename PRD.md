# OMEGA FUELS — Product Requirements Document

## Product Overview
OMEGA FUELS is a mobile-first fuel station management web application for employee-wise shift records, payment tracking, cash reconciliation, credit management, fuel inventory, expenses, owner cash collections, reporting, audit logs, and secure data export.

## Users & Roles
### Manager
- Manage employees (add, edit, deactivate/reactivate).
- Enter employee shift records: employee, date, shift, Cash, UPI, Card/Swiping, Credit, and Other Sales.
- Other Sales require description and amount.
- Update petrol/diesel prices; default to last used price.
- Record test fuel usage and calculated value/loss.
- Record generator fuel usage.
- Record other expenses with description/category.
- Manage credit customers and credit transactions.
- Record credit payment method; Cash contributes to cash ledger, UPI remains digital.
- Add new petrol/diesel stock and update stock cost.
- Record owner cash collections.

### Admin / Owner
- Full dashboard and reports.
- Daily, weekly, monthly, employee-wise and custom date reports.
- Charts for revenue/growth, payments, stock, credit and expenses.
- Full credit book, stock history, expenses, collections and audit logs.
- Export all authorized data.

## Dashboard Hierarchy
### Manager
Today's sales, expected cash, owner collections, remaining cash, cash difference, petrol/diesel stock, outstanding credit, quick actions and recent activity.

### Admin
Total revenue and growth, expected/remaining cash, owner collections, credit outstanding, expenses, fuel usage/loss, stock, payment breakdown, employee summary, charts and recent audit activity.

## Shift Entry
The manager enters employee data because employees may be too busy and may communicate details separately.

For each shift:
1. Select employee.
2. Date defaults to current date.
3. Select Morning, Evening, Night or Custom.
4. Enter Cash, UPI, Card/Swiping and Credit.
5. Add one or more Other Sales entries.
6. Review totals and save.

Historical records remain intact even if an employee becomes inactive.

## Cash Reconciliation and Owner Collection
The system distinguishes total business value, digital payments, credit, expected physical cash, owner-collected cash and remaining expected cash.

A central cash ledger is required. The owner may collect accumulated cash at any time, including mid-shift. The manager records timestamp, amount, optional notes/reference and recorder. Previously collected cash must never be counted again.

Example: expected cash ₹50,000; owner collects ₹30,000; remaining expected cash ₹20,000. Future cash increases the new running balance.

## Fuel Prices and Stock
Track Petrol and Diesel separately. Stock calculation concept:

`Current Stock = Previous Stock + New Stock - Fuel Sold - Test Usage - Generator Usage ± Authorized Adjustment`

Every movement requires timestamp and source. Price history must be preserved and price changes logged.

## Test and Generator Usage
Record fuel type, litres, timestamp and notes. Test usage also stores applicable selling price and calculated value/loss. Both reduce stock.

## New Stock and Cost
Record fuel type, quantity, delivery date/time, optional supplier/reference, cost per litre, total cost and notes. Both Manager and Admin may update stock cost; changes are audited.

## Expenses
Record category, amount, description and date. Expenses appear in admin reporting.

## Credit Book
Credit customers can be created, edited, deactivated and reviewed.

Credit Given increases outstanding balance. Credit Payment Received decreases it and records Cash/UPI/other method. Cash credit payments enter the cash ledger; UPI must not be counted as physical cash.

## Reports and Analytics
Reports: Daily, Weekly, Monthly, Custom Range, Employee-wise, Payment Method, Credit, Fuel Stock, Expense and Owner Collection.

Metrics include sales/revenue, Cash, UPI, Card, Credit issued, credit payments, Other Sales, expenses, fuel usage, stock movement, new stock, owner collections, expected cash, remaining cash and employee totals.

Charts must be lightweight and secondary to fast summary loading.

## Audit Logs
Log important creates, updates, adjustments and deactivations including employee changes, shifts/payments, fuel prices, stock, fuel usage, expenses, credit changes, stock costs and owner collections.

Each log contains timestamp, actor, role, module, action, entity/record ID, old values, new values and optional reason. Admin can filter by date, user, module and action. Logs should be append-only.

## Data Export and Backup
### Formats
- Excel `.xlsx`
- CSV `.csv`

### Admin can export
Employees, shifts, payments, other sales, credit customers/history, fuel stock, deliveries, fuel prices, expenses, owner collections, audit logs, reports, or all authorized business data.

### Full Excel workbook sheets
1. Summary
2. Employees
3. Shifts
4. Payments
5. Other Sales
6. Credit Customers
7. Credit Transactions
8. Fuel Stock
9. Stock Deliveries
10. Fuel Prices
11. Expenses
12. Owner Collections
13. Activity Logs

Users choose data scope, date range and format. Exports are generated from authorized queries; never expose raw production database files or credentials. Manager export permissions are configurable/restricted.

## UX and Design Requirements
- Mobile-first and responsive.
- Large touch targets and step-based forms.
- Bottom navigation on phones.
- Tables become cards/condensed layouts on mobile.
- Light and dark modes.
- No emojis in production UI.
- Consistent SVG icon library.
- Minimal animations.
- No heavy decorative effects.
- Data-first, professional operational appearance.

## Security and Performance
- Authentication and role-based access control.
- Server-side authorization and validation.
- Secure export downloads.
- Optimized queries and indexes.
- Pagination for large logs/tables.
- Lazy-load heavy charts.
- Avoid unnecessary re-renders and heavy animation libraries.

## Success Criteria
A manager can quickly record operations from a phone; admin can understand the complete business picture; cash/credit/stock are traceable; owner collections do not double-count cash; important changes are audited; reports work; authorized users can export Excel/CSV; and the application feels fast and professional.
