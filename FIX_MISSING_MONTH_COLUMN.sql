-- 🔧 FIX: Add missing 'year' and 'month' columns to weather_current table

-- Add year column
ALTER TABLE weather_current 
ADD COLUMN IF NOT EXISTS year INTEGER;

-- Add month column
ALTER TABLE weather_current 
ADD COLUMN IF NOT EXISTS month INTEGER;

-- Verify columns were added
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'weather_current'
  AND column_name IN ('year', 'month', 'location_id', 'date')
ORDER BY column_name;

-- Expected result:
-- weather_current | date        | date
-- weather_current | location_id | text
-- weather_current | month       | integer
-- weather_current | year        | integer
