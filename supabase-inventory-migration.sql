-- Inventory Management Migration Script for MuscleMeal POS
-- Run this in your Supabase SQL Editor

-- Add stock tracking columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;

-- Create inventory history table for tracking stock changes
CREATE TABLE IF NOT EXISTS inventory_history (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK(change_type IN ('purchase', 'sale', 'adjustment', 'initial')),
  quantity_change INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  notes TEXT,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_history_product ON inventory_history(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON inventory_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_history_order ON inventory_history(reference_order_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);

-- Create function to check and trigger low stock alerts
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  threshold INTEGER;
BEGIN
  -- Get the low stock threshold for this product
  SELECT low_stock_threshold INTO threshold
  FROM products
  WHERE id = NEW.product_id;
  
  -- If stock is at or below threshold, insert a low stock notification
  IF NEW.new_stock <= threshold THEN
    INSERT INTO inventory_notifications (
      product_id,
      product_name,
      current_stock,
      threshold,
      notification_type,
      created_at
    )
    SELECT 
      NEW.product_id,
      p.name,
      NEW.new_stock,
      threshold,
      'low_stock',
      NOW()
    FROM products p
    WHERE p.id = NEW.product_id
    -- Only insert if we don't already have an unacknowledged notification for this product
    AND NOT EXISTS (
      SELECT 1 FROM inventory_notifications
      WHERE product_id = NEW.product_id
      AND notification_type = 'low_stock'
      AND acknowledged = false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check low stock after inventory updates
DROP TRIGGER IF EXISTS trigger_check_low_stock ON inventory_history;
CREATE TRIGGER trigger_check_low_stock
AFTER INSERT ON inventory_history
FOR EACH ROW
EXECUTE FUNCTION check_low_stock();

-- Create inventory notifications table
CREATE TABLE IF NOT EXISTS inventory_notifications (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  current_stock INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  notification_type TEXT NOT NULL CHECK(notification_type IN ('low_stock', 'out_of_stock')),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by BIGINT REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for inventory notifications
CREATE INDEX IF NOT EXISTS idx_inventory_notifications_unacknowledged ON inventory_notifications(acknowledged, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_notifications_product ON inventory_notifications(product_id);

-- Enable Row Level Security (if needed)
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on inventory_history" ON inventory_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inventory_notifications" ON inventory_notifications FOR ALL USING (true) WITH CHECK (true);

