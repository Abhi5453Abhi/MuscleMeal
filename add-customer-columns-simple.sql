-- Simple migration to add customer support to existing database
-- Run this in your Supabase SQL Editor

-- Step 1: Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  advance_balance DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add customer_id column to orders table (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_id BIGINT REFERENCES customers(id);
  END IF;
END $$;

-- Step 3: Add advance_used column to orders table (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'advance_used'
  ) THEN
    ALTER TABLE orders ADD COLUMN advance_used DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Step 4: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);

-- Step 5: Enable Row Level Security on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL USING (true) WITH CHECK (true);



