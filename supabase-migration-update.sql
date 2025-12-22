-- Migration to add customer support to existing database
-- Run this in your Supabase SQL Editor if you already have the orders table

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  advance_balance DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add customer_id column to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_id BIGINT REFERENCES customers(id);
  END IF;
END $$;

-- Add advance_used column to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'advance_used'
  ) THEN
    ALTER TABLE orders ADD COLUMN advance_used DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Create index for customer_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- Create index for phone_number if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);

-- Enable Row Level Security on customers table if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'customers' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policy for customers table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' 
    AND policyname = 'Allow all operations on customers'
  ) THEN
    CREATE POLICY "Allow all operations on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;



