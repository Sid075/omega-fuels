# OMEGA FUELS — Database Schema

## Principles
Relational schema. Use UUID primary keys (or standard ULID/UUID strings), NUMERIC/DECIMAL for money and litres, ISO 8601 timestamps, ACID transactions for multi-step financial operations, historical preservation and append-only audit logs.

## users
`id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('ADMIN', 'MANAGER')), is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL`

## employees
`id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')), notes TEXT, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL`

Do not hard-delete employees with financial history.

## shifts
`id TEXT PRIMARY KEY, employee_id TEXT NOT NULL REFERENCES employees(id), shift_date TEXT NOT NULL, shift_type TEXT NOT NULL CHECK(shift_type IN ('MORNING', 'EVENING', 'NIGHT', 'CUSTOM')), custom_shift_name TEXT, status TEXT NOT NULL DEFAULT 'COMPLETED', notes TEXT, entered_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL`

## shift_payments
`id TEXT PRIMARY KEY, shift_id TEXT NOT NULL REFERENCES shifts(id) ON DELETE CASCADE, payment_method TEXT NOT NULL CHECK(payment_method IN ('CASH', 'UPI', 'CARD', 'CREDIT')), amount REAL NOT NULL, customer_id TEXT REFERENCES credit_customers(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL`

## other_sales
`id TEXT PRIMARY KEY, shift_id TEXT REFERENCES shifts(id) ON DELETE SET NULL, description TEXT NOT NULL, amount REAL NOT NULL, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL`

## fuel_price_history
`id TEXT PRIMARY KEY, fuel_type TEXT NOT NULL CHECK(fuel_type IN ('PETROL', 'DIESEL')), price_per_litre REAL NOT NULL, effective_from TEXT NOT NULL, effective_to TEXT, updated_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL`

Latest active price is the default for the next entry.

## fuel_stock_transactions
`id TEXT PRIMARY KEY, fuel_type TEXT NOT NULL CHECK(fuel_type IN ('PETROL', 'DIESEL')), transaction_type TEXT NOT NULL CHECK(transaction_type IN ('OPENING', 'DELIVERY', 'SALE', 'TEST_USAGE', 'GENERATOR_USAGE', 'ADJUSTMENT')), quantity_litres REAL NOT NULL, unit_cost REAL, reference_type TEXT, reference_id TEXT, reason TEXT, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL`

Stock is transaction-ledger based:
`Current Stock = SUM(quantity_litres)`

Delivery/opening are positive; sale/test/generator are negative; adjustment is signed and requires a reason.

## fuel_deliveries
`id TEXT PRIMARY KEY, fuel_type TEXT NOT NULL CHECK(fuel_type IN ('PETROL', 'DIESEL')), quantity_litres REAL NOT NULL, cost_per_litre REAL NOT NULL, total_cost REAL NOT NULL, supplier TEXT, reference_number TEXT, delivered_at TEXT NOT NULL, notes TEXT, created_by TEXT NOT NULL REFERENCES users(id), updated_by TEXT REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL`

A delivery creates a positive fuel_stock_transaction.

## fuel_usage
`id TEXT PRIMARY KEY, fuel_type TEXT NOT NULL CHECK(fuel_type IN ('PETROL', 'DIESEL')), usage_type TEXT NOT NULL CHECK(usage_type IN ('TEST', 'GENERATOR')), quantity_litres REAL NOT NULL, selling_price_snapshot REAL, calculated_value REAL, notes TEXT, created_by TEXT NOT NULL REFERENCES users(id), used_at TEXT NOT NULL, created_at TEXT NOT NULL`

Each usage creates a negative stock transaction.

## expenses
`id TEXT PRIMARY KEY, category TEXT NOT NULL, description TEXT NOT NULL, amount REAL NOT NULL, expense_date TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL`

## credit_customers
`id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')), notes TEXT, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL`

## credit_transactions
`id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES credit_customers(id), transaction_type TEXT NOT NULL CHECK(transaction_type IN ('CREDIT_GIVEN', 'PAYMENT_RECEIVED', 'ADJUSTMENT')), amount REAL NOT NULL, payment_method TEXT CHECK(payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER')), description TEXT, transaction_at TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL`

Outstanding balance:
`SUM(CREDIT_GIVEN) - SUM(PAYMENT_RECEIVED) ± adjustments`

Cash credit payments also create cash ledger events; UPI does not become physical cash.

## cash_ledger
`id TEXT PRIMARY KEY, entry_type TEXT NOT NULL CHECK(entry_type IN ('SHIFT_CASH', 'CREDIT_CASH_PAYMENT', 'OWNER_COLLECTION', 'ADJUSTMENT')), amount REAL NOT NULL, reference_type TEXT, reference_id TEXT, occurred_at TEXT NOT NULL, notes TEXT, created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL`

Convention: cash received is positive; owner collection is negative. Current expected uncollected cash is `SUM(amount)`. This prevents double-counting.

## owner_cash_collections
`id TEXT PRIMARY KEY, amount REAL NOT NULL, collected_at TEXT NOT NULL, notes TEXT, recorded_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL`

Each collection creates a negative cash_ledger entry.

## audit_logs
`id TEXT PRIMARY KEY, actor_user_id TEXT REFERENCES users(id), actor_role TEXT NOT NULL, action TEXT NOT NULL, module TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, old_values TEXT, new_values TEXT, reason TEXT, created_at TEXT NOT NULL`

Append-only. Log sensitive creates/updates/adjustments/deactivations.

## export_jobs
`id TEXT PRIMARY KEY, requested_by TEXT NOT NULL REFERENCES users(id), export_type TEXT NOT NULL CHECK(export_type IN ('XLSX', 'CSV')), data_scope TEXT NOT NULL, filters TEXT, status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK(status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')), file_reference TEXT, expires_at TEXT, created_at TEXT NOT NULL, completed_at TEXT`
