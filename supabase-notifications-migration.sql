-- Migration for order notifications table (for Realtime)
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS order_notifications (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  bill_number TEXT NOT NULL,
  notification_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_notifications_created_at ON order_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_notifications_order_id ON order_notifications(order_id);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE order_notifications;

-- Optional: Auto-cleanup old notifications (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM order_notifications
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

