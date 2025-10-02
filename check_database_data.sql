-- =====================================================
-- QUICK CHECK: What data exists in your database?
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Count total records in each table
SELECT 
    'weather_current' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT location_id) as unique_locations
FROM weather_current

UNION ALL

SELECT 
    'weather_historical' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT location_id) as unique_locations
FROM weather_historical;

-- Expected results:
-- If you've NEVER opened the app:
--   weather_current: 0 records
--   weather_historical: 0 records
--
-- If you opened app and selected "7 days":
--   weather_current: 7-8 records
--   weather_historical: 0 records
--
-- If you selected "1 year":
--   weather_current: 7-8 records
--   weather_historical: ~365 records
--
-- If you selected "5 years":
--   weather_current: 7-8 records
--   weather_historical: ~1,826 records

-- =====================================================

-- 2. Check date range of existing data
SELECT 
    'weather_current' as table_name,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    MAX(date)::date - MIN(date)::date as days_span
FROM weather_current
WHERE EXISTS (SELECT 1 FROM weather_current)

UNION ALL

SELECT 
    'weather_historical' as table_name,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    MAX(date)::date - MIN(date)::date as days_span
FROM weather_historical
WHERE EXISTS (SELECT 1 FROM weather_historical);

-- This shows you the actual date range you have

-- =====================================================

-- 3. See sample records (if any exist)
SELECT 
    'Current Data Sample' as data_type,
    date,
    temperature_avg,
    created_at
FROM weather_current
ORDER BY date DESC
LIMIT 5

UNION ALL

SELECT 
    'Historical Data Sample' as data_type,
    date,
    temperature_avg,
    created_at
FROM weather_historical
ORDER BY date DESC
LIMIT 5;
