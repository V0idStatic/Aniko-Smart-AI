# 🐛 Debugging: 7 Days & 30 Days Not Saving to weather_current

## 🔍 **Quick Checklist:**

### **1. Check Console Logs**
When you click "7 days" or "30 days", look for these specific logs:

**✅ Should See:**
```
🌤️ Fetching weather data for [Location]
📅 Date range: 2025-09-24 to 2025-10-01
📦 Checking weather_current for cached weather data...
📭 No cached data found in weather_current
🌐 Fetching fresh data from Open-Meteo API...
⏱️ API timeout set to 60 seconds for 7days
🔗 API URL: https://api.open-meteo.com/v1/forecast?...
✅ Successfully fetched 8 days from API
💾 Saving 8 records to weather_current...
✅ Successfully saved 8 records to weather_current
🔍 Verification: Found 8 records in weather_current
```

**❌ If You See:**
```
⏱️ Weather API request timed out
❌ Error fetching weather history: [AbortError: Aborted]
🔄 Generating fallback weather data...
```

**Problem:** API is timing out (even for 7 days!)

---

### **2. Test API Directly in Browser**

Open this URL in your browser:
```
https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&start_date=2025-09-24&end_date=2025-10-01&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum,weather_code&timezone=auto
```

**If it loads:**
- ✅ API works, issue is in app
- Check internet connection in app

**If it doesn't load:**
- ❌ Network issue
- Try different WiFi or mobile data

---

### **3. Check RLS is Disabled**

Run in Supabase SQL Editor:

```sql
-- Check RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('weather_current', 'weather_historical');
```

**Expected:**
```
weather_current    | false
weather_historical | false
```

**If RLS is true, run:**
```sql
ALTER TABLE weather_current DISABLE ROW LEVEL SECURITY;
ALTER TABLE weather_historical DISABLE ROW LEVEL SECURITY;
```

---

### **4. Manual Insert Test**

Test if you can manually insert to weather_current:

```sql
-- Try to insert test record
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
    'test_manual',
    '2025-10-01',
    25.0,
    70.0,
    5.0,
    'Test record',
    2025,
    10,
    'manual-test',
    NOW()
);

-- Check if it saved
SELECT * FROM weather_current WHERE location_id = 'test_manual';

-- Clean up
DELETE FROM weather_current WHERE location_id = 'test_manual';
```

**If INSERT fails:**
- Check error message
- Likely RLS or permissions issue

---

### **5. Check Table Structure**

Verify `location_id` is TEXT (not integer):

```sql
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'weather_current'
  AND column_name = 'location_id';
```

**Expected:**
```
weather_current | location_id | text
```

**If it shows integer:**
```sql
ALTER TABLE weather_current 
ALTER COLUMN location_id TYPE text;
```

---

### **6. Increase Timeout for 7 Days**

If API is still timing out even for 7 days, increase timeout further.

In analysis.tsx, line ~979, change:

```typescript
// OLD:
const timeoutDuration = timeRange === '5years' ? 180000 : timeRange === '1year' ? 120000 : 60000;

// NEW (longer timeouts):
const timeoutDuration = timeRange === '5years' ? 300000 : 
                        timeRange === '1year' ? 180000 : 
                        timeRange === '30days' ? 90000 : 
                        90000; // 90 seconds for 7 days
```

---

### **7. Check Internet Connection**

**Try different networks:**
- Home WiFi
- Mobile hotspot
- Different location

**Check if firewall/VPN is blocking:**
- Disable VPN if using one
- Check if school/work WiFi blocks Open-Meteo

---

## 🎯 **Most Likely Issues (For 7/30 Days):**

### **Issue #1: API Still Timing Out**
**Symptom:** Logs show "Weather API request timed out"
**Fix:** 
1. Check internet connection
2. Increase timeout to 90-120 seconds
3. Try mobile data instead of WiFi

### **Issue #2: RLS Still Enabled**
**Symptom:** No error in console, but database empty
**Fix:** Run `ALTER TABLE weather_current DISABLE ROW LEVEL SECURITY;`

### **Issue #3: Using Cached Data**
**Symptom:** Logs show "Using cached weather records"
**Fix:** This is actually WORKING! Check database:
```sql
SELECT COUNT(*) FROM weather_current;
-- Should have rows!
```

### **Issue #4: App Not Updated**
**Symptom:** Old code still running
**Fix:** 
1. Close app completely
2. In Metro, press `r` to reload
3. Or restart Metro: `npx expo start`

---

## 🚀 **Quick Test Plan:**

### **Step 1: Verify API Works**
Open browser URL above → Should return JSON data

### **Step 2: Check RLS**
Run SQL query → Should be `false`

### **Step 3: Try 7 Days**
1. Close and reopen app
2. Select "7 days"
3. Wait up to 90 seconds
4. Check console logs
5. Check database: `SELECT COUNT(*) FROM weather_current;`

### **Step 4: Share Console Logs**
If still not working, copy ALL console logs from when you click "7 days"

---

## 📋 **Action Items:**

1. ✅ **Check browser URL test** (does API work in browser?)
2. ✅ **Check RLS status** (is it disabled?)
3. ✅ **Try manual INSERT test** (can you insert manually?)
4. ✅ **Check console logs** (what errors do you see?)
5. ✅ **Share logs with me** (so I can see exactly what's happening)

---

## 💡 **Expected Success Indicators:**

**Console should show:**
```
✅ Successfully fetched 8 days from API
💾 Saving 8 records to weather_current...
✅ Successfully saved 8 records to weather_current
🔍 Verification: Found 8 records in weather_current
```

**Database should have:**
```sql
SELECT COUNT(*) FROM weather_current;
-- Result: 8 (or similar)
```

**App should display:**
Weather charts with data from Sept 24 - Oct 1

---

**Without seeing the console logs, I can't tell what's failing!** Please share them! 🔍
