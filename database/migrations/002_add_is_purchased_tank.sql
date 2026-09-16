ALTER TABLE public.sales_records
  ADD COLUMN IF NOT EXISTS is_purchased_tank BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.sales_records.is_purchased_tank IS
  'Whether the sale is a direct purchase of a filled tank without an empty-cylinder swap';
