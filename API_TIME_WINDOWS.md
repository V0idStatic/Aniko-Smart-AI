# ⏰ Open-Meteo API Time Windows Explained

## 🤔 "Does it have only time when I can catch the data?"

**Answer:** Yes and No! Let me explain:

---

## 📅 **What Data Can You Get and When?**

### **Forecast API** (`api.open-meteo.com/v1/forecast`)

**Available Data:**
- ✅ **Past 7 days** (historical)
- ✅ **Today** (current)
- ✅ **Future 16 days** (forecast)

**Example: Today is October 1, 2025**

```javascript
// ✅ THIS WORKS - Get past 7 days
start_date: "2025-09-24"  // 7 days ago
end_date: "2025-10-01"    // today
Result: ✅ Returns data

// ✅ THIS WORKS - Get future forecast
start_date: "2025-10-01"  // today
end_date: "2025-10-17"    // 16 days from now
Result: ✅ Returns data

// ❌ THIS FAILS - Past 30 days
start_date: "2025-09-01"  // 30 days ago
end_date: "2025-10-01"    // today
Result: ❌ Error or incomplete data (only last 7 days returned)
```

---

### **Archive API** (`archive-api.open-meteo.com/v1/archive`)

**Available Data:**
- ✅ **From January 1, 1940 to 2-3 days ago**
- ❌ **NOT available for today or yesterday** (data not finalized yet)

**Example: Today is October 1, 2025**

```javascript
// ✅ THIS WORKS - Get last year's data
start_date: "2024-10-01"  // 1 year ago
end_date: "2025-09-28"    // 3 days ago (data finalized)
Result: ✅ Returns data

// ✅ THIS WORKS - Get 5 years of data
start_date: "2020-10-01"  // 5 years ago
end_date: "2025-09-28"    // 3 days ago
Result: ✅ Returns data

// ✅ THIS WORKS - Get historical data from 1940s
start_date: "1940-01-01"  // 85 years ago!
end_date: "1945-12-31"    // WW2 era
Result: ✅ Returns data

// ⚠️ THIS MIGHT FAIL - Trying to get very recent data
start_date: "2025-09-01"
end_date: "2025-10-01"    // today
Result: ⚠️ Might return data until Sept 28, but not Sept 29-Oct 1
```

---

## 🎯 **Your App's Smart Strategy**

Your code automatically selects the right API:

```typescript
const isHistoricalRange = timeRange === '1year' || timeRange === '5years';

const baseUrl = isHistoricalRange 
  ? 'https://archive-api.open-meteo.com/v1/archive'  // For old data
  : 'https://api.open-meteo.com/v1/forecast';        // For recent data
```

### **Time Range Mapping:**

| User Selects | API Used | Date Range (Oct 1, 2025) | Can Get Data? |
|-------------|----------|-------------------------|---------------|
| **7 days** | Forecast | Sept 24 → Oct 1 | ✅ YES |
| **30 days** | Forecast | Sept 1 → Oct 1 | ⚠️ PARTIAL (only last 7 days) |
| **1 year** | Archive | Oct 1, 2024 → Sept 28, 2025 | ✅ YES |
| **5 years** | Archive | Oct 1, 2020 → Sept 28, 2025 | ✅ YES |

---

## 🐛 **Why You Might Have Issues with 30-Day Range**

**Your current code:**
```typescript
case '30days':
  startDate.setDate(endDate.getDate() - 30); // Sept 1, 2025
  break;
```

**Problem:**
- Uses **Forecast API** (only has last 7 days)
- Tries to get 30 days of past data
- **Result:** Only returns 7 days (Sept 24-Oct 1)

**Solution:** For 30-day range, you have two options:

### **Option 1: Use Archive API for 30 days**
```typescript
const isHistoricalRange = timeRange === '30days' || timeRange === '1year' || timeRange === '5years';
```

### **Option 2: Keep Forecast API but adjust expectations**
Accept that 30-day range only returns 7 days of actual data (rest is forecast).

---

## 📊 **Data Freshness Timeline**

### **Real-Time Data (Forecast API)**
```
Today (Oct 1, 2025)
├─ Current hour: Updated every 15 minutes
├─ Past 7 days: Finalized, accurate data
└─ Future 16 days: Forecast, updated 4x per day
```

### **Historical Data (Archive API)**
```
Oct 1, 2025 → Going back in time
├─ Sept 29-Oct 1: ❌ NOT AVAILABLE (too recent)
├─ Sept 28: ⚠️ Being finalized
├─ Sept 1-27: ✅ AVAILABLE (finalized)
├─ 2024-2025: ✅ AVAILABLE (finalized)
├─ 1940-2023: ✅ AVAILABLE (finalized)
└─ Before 1940: ❌ NOT AVAILABLE
```

---

## 🔄 **How Your Database Strategy Works**

### **Day 1 (Oct 1, 2025 - First Use)**
```
User: "Show me 7 days of weather"

1. App checks database → Empty ❌
2. App calls Forecast API → Gets Sept 24 - Oct 1 (7 days) ✅
3. App saves to weather_current table ✅
4. Database now has: 7 days of data
```

### **Day 2 (Oct 2, 2025 - Second Use)**
```
User: "Show me 7 days of weather"

1. App checks database → Has Sept 24 - Oct 1 (7 days) ✅
2. App calculates: Need Sept 25 - Oct 2 (7 days)
3. Cache completeness: 6/7 days = 85.7% ✅ (above 80% threshold)
4. App uses cached data ✅
5. No API call needed! 🎉

OR (if you want fresh data):

1. App checks database → Has Sept 24 - Oct 1 ✅
2. App calls Forecast API → Gets Sept 25 - Oct 2 ✅
3. App UPSERT to database:
   - Updates Sept 25-Oct 1 (6 days - existing data)
   - Inserts Oct 2 (1 day - new data)
4. Database now has: 8 days total (Sept 24 - Oct 2)
```

### **Day 30 (Oct 30, 2025 - One Month Later)**
```
User: "Show me 1 year of weather"

1. App checks database → Has Sept 24 - Oct 29 (36 days) in weather_current ✅
2. But user wants 1 YEAR, not 36 days!
3. App calls Archive API → Gets Oct 30, 2024 - Oct 27, 2025 (365 days) ✅
4. App saves to weather_historical table ✅
5. Database now has:
   - weather_current: 36 days of recent data
   - weather_historical: 365 days of yearly data
```

---

## 🎯 **Best Practices**

### **For Current/Recent Data (7-day range)**
- ✅ Use Forecast API
- ✅ Cache in `weather_current` table
- ✅ Update daily for latest data
- ✅ Keep last 90 days in cache

### **For Historical Analysis (1-5 year range)**
- ✅ Use Archive API
- ✅ Cache in `weather_historical` table
- ✅ Never delete (historical data doesn't change)
- ✅ Only fetch once per location

### **For 30-Day Range (Tricky!)**
**Option A:** Use Forecast API (only get last 7 days + 23 days forecast)
**Option B:** Use Archive API (get 30 days of historical data, but miss last 2-3 days)
**Option C:** Combine both APIs (complex but complete)

---

## 🔧 **Recommended Fix for 30-Day Range**

Update your code to use Archive API for 30 days:

```typescript
// In analysis.tsx, line ~897
const isHistoricalRange = 
  timeRange === '30days' ||  // ✅ Add this
  timeRange === '1year' || 
  timeRange === '5years';
```

**Result:**
- 7 days → Forecast API → weather_current
- 30 days → Archive API → weather_historical (missing last 2-3 days)
- 1 year → Archive API → weather_historical
- 5 years → Archive API → weather_historical

---

## 📅 **Date Calculation Examples**

**Today: October 1, 2025**

```javascript
// 7 days
start: "2025-09-24" (Sept 24)
end: "2025-10-01" (Oct 1)
API: Forecast ✅
Days: 8 days (inclusive)

// 30 days
start: "2025-09-01" (Sept 1)
end: "2025-10-01" (Oct 1)
API: Forecast → Only gets last 7 days ⚠️
API: Archive → Gets all 30 days (but not Oct 1) ✅
Days: 31 days (inclusive)

// 1 year
start: "2024-10-01" (Oct 1, 2024)
end: "2025-10-01" (Oct 1, 2025)
API: Archive → Gets until Sept 28, 2025 ⚠️
Days: 365 days (but missing last 3 days)

// 5 years
start: "2020-10-01" (Oct 1, 2020)
end: "2025-10-01" (Oct 1, 2025)
API: Archive → Gets until Sept 28, 2025 ⚠️
Days: 1,826 days (but missing last 3 days)
```

---

## ⚠️ **Common Pitfalls**

### **Pitfall 1: Asking for today's data from Archive API**
```javascript
// ❌ This fails
start_date: "2025-09-01"
end_date: "2025-10-01"  // Today
API: Archive
Result: Returns data until Sept 28 only
```

### **Pitfall 2: Asking for 30 days from Forecast API**
```javascript
// ⚠️ This returns incomplete data
start_date: "2025-09-01"
end_date: "2025-10-01"
API: Forecast
Result: Only returns Sept 24 - Oct 1 (7 days)
```

### **Pitfall 3: Not accounting for API delay**
```javascript
// ⚠️ Archive API has 2-3 day delay
end_date: "2025-10-01"  // Today
API: Archive
Result: Data only until Sept 28-29
```

---

## ✅ **Solution: Smart Date Adjustment**

Add this helper function:

```typescript
const getAdjustedEndDate = (timeRange: string): string => {
  const today = new Date();
  
  if (timeRange === '1year' || timeRange === '5years' || timeRange === '30days') {
    // For Archive API, subtract 3 days to account for data delay
    today.setDate(today.getDate() - 3);
  }
  
  return today.toISOString().split('T')[0];
};

// Then use it:
const endDateStr = getAdjustedEndDate(timeRange);
```

This ensures you only request data that's actually available! 🎯

---

## 📞 **Summary: "How Far Back Can I Get Data?"**

| Time Period | API to Use | Can Get Data? |
|------------|-----------|---------------|
| **Today** | Forecast | ✅ YES (updated every 15 min) |
| **Yesterday** | Forecast | ✅ YES (finalized) |
| **Last 7 days** | Forecast | ✅ YES (finalized) |
| **Last 30 days** | Archive | ✅ YES (but missing last 2-3 days) |
| **Last year** | Archive | ✅ YES (but missing last 2-3 days) |
| **Last 5 years** | Archive | ✅ YES (but missing last 2-3 days) |
| **1940 onwards** | Archive | ✅ YES (all historical data) |
| **Before 1940** | Neither | ❌ NO (data doesn't exist) |
| **Future 16 days** | Forecast | ✅ YES (forecast, updated 4x/day) |

**Your database strategy solves this by:**
1. Fetching data once from API
2. Storing it forever
3. Only fetching new days as needed
4. Never asking for data that doesn't exist yet! 🎉
