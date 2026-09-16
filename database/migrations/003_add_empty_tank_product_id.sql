ALTER TABLE public.sales_records
  ADD COLUMN IF NOT EXISTS empty_tank_product_id VARCHAR(20) NULL;

COMMENT ON COLUMN public.sales_records.empty_tank_product_id IS
  'The selected empty-cylinder product when is_purchased_tank is TRUE; NULL when the sale is not a tank purchase';
