
ALTER TABLE weather_current 
ADD COLUMN IF NOT EXISTS year INTEGER;

ALTER TABLE weather_current 
ADD COLUMN IF NOT EXISTS month INTEGER;


SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'weather_current'
  AND column_name IN ('year', 'month', 'location_id', 'date')
ORDER BY column_name;

