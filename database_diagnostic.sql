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

-- Expected: 3 rows (weather_current, weather_historical, weather_api_logs)

-- =====================================================
-- 2. CHECK TABLE STRUCTURE
-- =====================================================
SELECT 
    table_name,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('weather_current', 'weather_historical')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 3. CHECK CONSTRAINTS (UNIQUE, PRIMARY KEY)
-- =====================================================
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

-- Expected: Should see UNIQUE constraint on (location_id, date)

-- =====================================================
-- 4. CHECK ROW LEVEL SECURITY (RLS) STATUS
-- =====================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('weather_current', 'weather_historical', 'weather_api_logs');

-- If rls_enabled = true, check policies below

-- =====================================================
-- 5. CHECK RLS POLICIES (if RLS is enabled)
-- =====================================================
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

-- If no policies exist but RLS is enabled, inserts will fail!

-- =====================================================
-- 6. COUNT RECORDS IN EACH TABLE
-- =====================================================
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

-- =====================================================
-- 7. VIEW SAMPLE DATA (if any exists)
-- =====================================================
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

-- =====================================================
-- 8. CHECK FOR FAILED INSERTS (if you have error logging)
-- =====================================================
-- Check Supabase logs in Dashboard → Logs → API Logs

-- =====================================================
-- 9. TEST INSERT PERMISSION (manual test)
-- =====================================================
-- Try to insert a test record
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

-- If this fails, you have permission issues (RLS or role)

-- Clean up test record
DELETE FROM weather_current WHERE location_id = 'test_location';

-- =====================================================
-- 10. FIX RLS ISSUES (if needed)
-- =====================================================
-- Option A: Disable RLS temporarily for testing
ALTER TABLE weather_current DISABLE ROW LEVEL SECURITY;
ALTER TABLE weather_historical DISABLE ROW LEVEL SECURITY;
ALTER TABLE weather_api_logs DISABLE ROW LEVEL SECURITY;

-- Option B: Add permissive policies for authenticated users
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

-- Repeat for weather_historical
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

-- For weather_api_logs
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

-- =====================================================
-- 11. CHECK UNIQUE CONSTRAINT (prevent duplicates)
-- =====================================================
-- If missing, add unique constraint
ALTER TABLE weather_current
ADD CONSTRAINT weather_current_location_date_unique 
UNIQUE (location_id, date);

ALTER TABLE weather_historical
ADD CONSTRAINT weather_historical_location_date_unique 
UNIQUE (location_id, date);

-- =====================================================
-- 12. VIEW RECORDS BY LOCATION
-- =====================================================
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

-- =====================================================
-- 13. CHECK FOR ORPHANED DATA (data without matching location)
-- =====================================================
SELECT DISTINCT location_id 
FROM weather_current
WHERE location_id NOT IN (
    SELECT CAST(location_id AS TEXT) FROM lib_crop_location
);

-- =====================================================
-- 14. ANALYZE API LOG PATTERNS
-- =====================================================
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

-- =====================================================
-- 15. SUMMARY REPORT
-- =====================================================
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

-- =====================================================
-- TROUBLESHOOTING CHECKLIST
-- =====================================================
-- 
-- ✅ Tables exist → Run query #1
-- ✅ Tables have correct structure → Run query #2
-- ✅ Unique constraints exist → Run query #3
-- ✅ RLS status checked → Run query #4
-- ✅ RLS policies exist (if enabled) → Run query #5
-- ✅ Can manually insert → Run query #9
-- ✅ App is connected to Supabase → Check app logs
-- ✅ App calls saveWeatherDataToDatabase → Check console.log
-- ✅ No errors in Supabase logs → Check Dashboard → Logs
-- 
-- If all above pass but tables still empty:
--   → Check if user is authenticated (auth.users)
--   → Check app console logs for errors
--   → Verify Supabase URL and key in app config
--   → Check network requests in browser DevTools
-- =====================================================
