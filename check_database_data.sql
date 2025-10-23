
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
