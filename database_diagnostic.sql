-- =====================================================
-- WEATHER DATABASE DIAGNOSTIC QUERIES
-- Run these in Supabase SQL Editor to debug empty tables
-- =====================================================

-- =====================================================
-- 1. CHECK IF TABLES EXIST
-- =====================================================
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('weather_current', 'weather_historical', 'weather_api_logs')
ORDER BY table_name;

SELECT 
    table_name,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('weather_current', 'weather_historical')
ORDER BY table_name, ordinal_position;

SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('weather_current', 'weather_historical')
ORDER BY tc.table_name, tc.constraint_type;


SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('weather_current', 'weather_historical', 'weather_api_logs');


SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE tablename IN ('weather_current', 'weather_historical', 'weather_api_logs')
ORDER BY tablename, policyname;


SELECT 
    'weather_current' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT location_id) as unique_locations,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    MAX(created_at) as last_updated
FROM weather_current

UNION ALL

SELECT 
    'weather_historical' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT location_id) as unique_locations,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    MAX(created_at) as last_updated
FROM weather_historical

UNION ALL

SELECT 
    'weather_api_logs' as table_name,
    COUNT(*) as total_records,
    NULL as unique_locations,
    NULL as earliest_date,
    NULL as latest_date,
    MAX(fetched_at) as last_updated
FROM weather_api_logs;


-- weather_current
SELECT * FROM weather_current 
ORDER BY created_at DESC 
LIMIT 5;

-- weather_historical
SELECT * FROM weather_historical 
ORDER BY created_at DESC 
LIMIT 5;

-- weather_api_logs
SELECT * FROM weather_api_logs 
ORDER BY fetched_at DESC 
LIMIT 5;


INSERT INTO weather_current (
    location_id,
    date,
    temperature_avg,
    humidity_avg,
    rainfall_mm,
    weather_description,
    year,
    month,
    data_source,
    created_at
) VALUES (
    'test_location',
    '2025-10-01',
    25.5,
    75.0,
    5.0,
    'Test record',
    2025,
    10,
    'manual-test',
    NOW()
)
RETURNING *;


DELETE FROM weather_current WHERE location_id = 'test_location';


ALTER TABLE weather_current DISABLE ROW LEVEL SECURITY;
ALTER TABLE weather_historical DISABLE ROW LEVEL SECURITY;
ALTER TABLE weather_api_logs DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert weather_current" 
ON weather_current
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select weather_current" 
ON weather_current
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update weather_current" 
ON weather_current
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert weather_historical" 
ON weather_historical
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select weather_historical" 
ON weather_historical
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update weather_historical" 
ON weather_historical
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert weather_api_logs" 
ON weather_api_logs
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select weather_api_logs" 
ON weather_api_logs
FOR SELECT 
TO authenticated
USING (true);

ALTER TABLE weather_current
ADD CONSTRAINT weather_current_location_date_unique 
UNIQUE (location_id, date);

ALTER TABLE weather_historical
ADD CONSTRAINT weather_historical_location_date_unique 
UNIQUE (location_id, date);

SELECT 
    location_id,
    COUNT(*) as record_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    AVG(temperature_avg) as avg_temperature,
    AVG(humidity_avg) as avg_humidity,
    SUM(rainfall_mm) as total_rainfall
FROM weather_current
GROUP BY location_id
ORDER BY MAX(created_at) DESC;

SELECT DISTINCT location_id 
FROM weather_current
WHERE location_id NOT IN (
    SELECT CAST(location_id AS TEXT) FROM lib_crop_location
);


SELECT 
    api_endpoint,
    COUNT(*) as call_count,
    AVG(data_points_fetched) as avg_data_points,
    MIN(date_range_start) as earliest_request,
    MAX(date_range_end) as latest_request,
    MAX(fetched_at) as last_call
FROM weather_api_logs
GROUP BY api_endpoint
ORDER BY MAX(fetched_at) DESC;

SELECT 
    'Database Status' as metric,
    CASE 
        WHEN (SELECT COUNT(*) FROM weather_current) > 0 THEN '✅ Has Data'
        ELSE '❌ Empty'
    END as weather_current_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM weather_historical) > 0 THEN '✅ Has Data'
        ELSE '❌ Empty'
    END as weather_historical_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM weather_api_logs) > 0 THEN '✅ Has Data'
        ELSE '❌ Empty'
    END as api_logs_status;

