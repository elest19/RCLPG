-- Rename the existing customers.fb_name column to location while preserving data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customers'
      AND column_name = 'fb_name'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customers'
      AND column_name = 'location'
  ) THEN
    ALTER TABLE public.customers
      RENAME COLUMN fb_name TO location;
  END IF;
END $$;
