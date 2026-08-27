-- ==============================================================================
-- OMEGA FUELS — SUPABASE POSTGRESQL INITIAL DATABASE SCHEMA
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Custom Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shift_type AS ENUM ('MORNING', 'EVENING', 'NIGHT', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shift_status AS ENUM ('COMPLETED', 'PENDING', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('CASH', 'UPI', 'CARD', 'CREDIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fuel_type AS ENUM ('PETROL', 'DIESEL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_transaction_type AS ENUM ('OPENING', 'DELIVERY', 'SALE', 'TEST_USAGE', 'GENERATOR_USAGE', 'ADJUSTMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fuel_usage_type AS ENUM ('TEST', 'GENERATOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE credit_transaction_type AS ENUM ('CREDIT_GIVEN', 'PAYMENT_RECEIVED', 'ADJUSTMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE credit_payment_method AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cash_ledger_entry_type AS ENUM ('SHIFT_CASH', 'CREDIT_CASH_PAYMENT', 'OWNER_COLLECTION', 'ADJUSTMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table (Linked with Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'MANAGER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    status employee_status NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Credit Customers Table
CREATE TABLE IF NOT EXISTS public.credit_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    status employee_status NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Shifts Table
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift_type shift_type NOT NULL DEFAULT 'MORNING',
    custom_shift_name TEXT,
    status shift_status NOT NULL DEFAULT 'COMPLETED',
    notes TEXT,
    entered_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Shift Payments Table
CREATE TABLE IF NOT EXISTS public.shift_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    customer_id UUID REFERENCES public.credit_customers(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Other Sales Table
CREATE TABLE IF NOT EXISTS public.other_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Fuel Price History Table
CREATE TABLE IF NOT EXISTS public.fuel_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fuel_type fuel_type NOT NULL,
    price_per_litre NUMERIC(12,4) NOT NULL CHECK (price_per_litre > 0),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    updated_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Fuel Stock Transactions Table (Ledger-based stock calculation)
CREATE TABLE IF NOT EXISTS public.fuel_stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fuel_type fuel_type NOT NULL,
    transaction_type stock_transaction_type NOT NULL,
    quantity_litres NUMERIC(14,3) NOT NULL,
    unit_cost NUMERIC(12,4),
    reference_type TEXT,
    reference_id UUID,
    reason TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Fuel Deliveries Table
CREATE TABLE IF NOT EXISTS public.fuel_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fuel_type fuel_type NOT NULL,
    quantity_litres NUMERIC(14,3) NOT NULL CHECK (quantity_litres > 0),
    cost_per_litre NUMERIC(12,4) NOT NULL CHECK (cost_per_litre > 0),
    total_cost NUMERIC(14,2) NOT NULL CHECK (total_cost > 0),
    supplier TEXT,
    reference_number TEXT,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Fuel Usage Table (Test & Generator)
CREATE TABLE IF NOT EXISTS public.fuel_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fuel_type fuel_type NOT NULL,
    usage_type fuel_usage_type NOT NULL,
    quantity_litres NUMERIC(14,3) NOT NULL CHECK (quantity_litres > 0),
    selling_price_snapshot NUMERIC(12,4),
    calculated_value NUMERIC(14,2),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Credit Transactions Table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.credit_customers(id),
    transaction_type credit_transaction_type NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_method credit_payment_method,
    description TEXT,
    transaction_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Cash Ledger Table (Zero Double-Counting Event Stream)
CREATE TABLE IF NOT EXISTS public.cash_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_type cash_ledger_entry_type NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Owner Cash Collections Table
CREATE TABLE IF NOT EXISTS public.owner_cash_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Audit Logs Table (Append-Only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES public.profiles(id),
    actor_role user_role NOT NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Export Jobs Table
CREATE TABLE IF NOT EXISTS public.export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requested_by UUID NOT NULL REFERENCES public.profiles(id),
    export_type TEXT NOT NULL CHECK (export_type IN ('XLSX', 'CSV')),
    data_scope TEXT NOT NULL,
    filters JSONB,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    file_reference TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for lightning fast queries and reports
CREATE INDEX IF NOT EXISTS idx_shifts_emp_date ON public.shifts(employee_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON public.shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_payments_shift ON public.shift_payments(shift_id);
CREATE INDEX IF NOT EXISTS idx_fuel_stock_tx_type ON public.fuel_stock_transactions(fuel_type, created_at);
CREATE INDEX IF NOT EXISTS idx_credit_tx_customer ON public.credit_transactions(customer_id, transaction_at);
CREATE INDEX IF NOT EXISTS idx_cash_ledger_occurred ON public.cash_ledger(occurred_at);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id, created_at);

-- Row Level Security (RLS) Activation
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.other_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_cash_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

-- Helper RLS Policies for Authenticated Station Users
CREATE POLICY "Allow authenticated read on all operational tables" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert/update on employees" ON public.employees FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full on shifts" ON public.shifts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full on shift_payments" ON public.shift_payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full on other_sales" ON public.other_sales FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full on fuel_price_history" ON public.fuel_price_history FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full on fuel_stock_transactions" ON public.fuel_stock_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full on fuel_deliveries" ON public.fuel_deliveries FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full on fuel_usage" ON public.fuel_usage FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full on expenses" ON public.expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full on credit_customers" ON public.credit_customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full on credit_transactions" ON public.credit_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full on cash_ledger" ON public.cash_ledger FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full on owner_cash_collections" ON public.owner_cash_collections FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated read on audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
