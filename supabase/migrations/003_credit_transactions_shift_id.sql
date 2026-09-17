-- ==============================================================================
-- OMEGA FUELS — SUPABASE POSTGRESQL MIGRATION: LINK CREDIT REPAYMENTS TO SHIFTS
-- Migration: 003_credit_transactions_shift_id.sql
-- ==============================================================================

-- 1. Add shift_id foreign key column to credit_transactions
ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL;

-- 2. Create index for shift lookup
CREATE INDEX IF NOT EXISTS idx_credit_transactions_shift_id ON public.credit_transactions(shift_id);
