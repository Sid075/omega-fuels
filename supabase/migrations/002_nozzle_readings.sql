-- ==============================================================================
-- OMEGA FUELS — SUPABASE POSTGRESQL MIGRATION: SHIFT NOZZLE READINGS
-- Migration: 002_nozzle_readings.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.shift_nozzle_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    nozzle_name TEXT NOT NULL,
    fuel_type fuel_type NOT NULL,
    opening_reading NUMERIC(14,3) NOT NULL CHECK (opening_reading >= 0),
    closing_reading NUMERIC(14,3) NOT NULL CHECK (closing_reading >= opening_reading),
    litres_sold NUMERIC(14,3) NOT NULL CHECK (litres_sold >= 0),
    price_per_litre NUMERIC(10,2) NOT NULL CHECK (price_per_litre >= 0),
    sales_amount NUMERIC(14,2) NOT NULL CHECK (sales_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for shift lookup
CREATE INDEX IF NOT EXISTS idx_shift_nozzle_readings_shift_id ON public.shift_nozzle_readings(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_nozzle_readings_fuel_type ON public.shift_nozzle_readings(fuel_type);

-- Enable RLS
ALTER TABLE public.shift_nozzle_readings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view shift nozzle readings
CREATE POLICY "Authenticated users can read shift nozzle readings" 
ON public.shift_nozzle_readings FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert shift nozzle readings
CREATE POLICY "Authenticated users can insert shift nozzle readings" 
ON public.shift_nozzle_readings FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update shift nozzle readings
CREATE POLICY "Authenticated users can update shift nozzle readings" 
ON public.shift_nozzle_readings FOR UPDATE 
TO authenticated 
USING (true);
