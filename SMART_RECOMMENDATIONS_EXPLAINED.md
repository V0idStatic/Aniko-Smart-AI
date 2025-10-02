# 🧠 Smart Weather-Based Plant Recommendations

## 📊 How It Works

Your app now makes **intelligent recommendations** by comparing:
1. ✅ **Current year weather** (from `weather_current` table - 7/30 days data)
2. ✅ **5-year historical average** (from `weather_historical` table)
3. ✅ **Plant optimal conditions** (from `denormalized_crop_parameter` table)

---

## 🎯 Example Scenario (Your Question)

### **Scenario: Rice in September**

**Database says:**
- Rice optimal for September (based on 5-year average)
- 5-year average for September: 28°C, 75% humidity, 5mm/day rainfall

**BUT this year (2025):**
- Current September: 26°C, 85% humidity, **12mm/day rainfall** 🌧️

**Smart Recommendation Result:**
```
Status: CAUTION (downgraded from GOOD)

Risk Factors:
🌧️ Much rainier than usual: +7mm/day vs 5-year avg
💧 High humidity: 85% (max 80% for rice)

Recommendations:
⚠️ 2025 is experiencing unusual rainfall for September
🌬️ Improve ventilation and drainage
📊 Historically, September averages 5mm/day (currently 12mm/day)
```

---

## 🔢 Scoring System

### **1. Base Suitability Score (0-1)**

Calculated from current weather vs plant requirements:
- ✅ Temperature match: 40% weight
- ✅ Humidity match: 30% weight
- ✅ Rainfall match: 30% weight

**Example:**
```
Rice requirements: 25-35°C, 60-80% humidity, 3-10mm/day rain
Current: 28°C, 75%, 5mm/day
Score: 1.0 (perfect match!)
```

### **2. Historical Deviation Penalty**

If current year differs significantly from 5-year average, **score is reduced**:

| Deviation | Penalty | Trigger |
|-----------|---------|---------|
| Temperature | -0.15 | >3°C difference |
| Rainfall | -0.20 | >5mm/day difference |
| Humidity | -0.10 | >15% difference |

**Example with penalty:**
```
Base score: 1.0
Rainfall deviation: +7mm/day (penalty: -0.20)
Final score: 0.80 → Status downgraded to "GOOD"
```

### **3. Final Status**

| Score | Status | Meaning |
|-------|--------|---------|
| ≥0.9 | 🌟 IDEAL | Perfect conditions |
| ≥0.7 | ✅ GOOD | Suitable with minor adjustments |
| ≥0.5 | ⚠️ CAUTION | Challenging, monitor closely |
| <0.5 | ❌ AVOID | Poor conditions, wait |

---

## 📅 Month-by-Month Analysis

The system calculates **best planting months** dynamically:

1. **Looks at 5-year historical data** for each month (Jan-Dec)
2. **Calculates average conditions** for that month across all years
3. **Compares with crop requirements**
4. **Scores each month** (0-1 scale)
5. **Selects months with score ≥0.7**

**Example for Tomato:**
```
January: 0.45 (too cold) ❌
February: 0.60 (cold) ❌
March: 0.75 (good) ✅
April: 0.90 (ideal) ✅
May: 0.85 (great) ✅
...
```

**Result:** Best months = [3, 4, 5] (March, April, May)

---

## 🆕 What Changed in Your Code

### **Before (Static):**
```typescript
// Hardcoded planting months
const cropDatabase = {
  'Rice': {
    plantingSeasons: [6, 7, 8, 9], // June-September (fixed)
  }
}
```

### **After (Dynamic):**
```typescript
// Fetches 5-year historical data from database
const { data: historicalData } = await supabase
  .from('weather_historical')
  .select('*')
  .eq('location_id', locationId);

// Calculates current month's 5-year average
const currentMonthHistorical = historicalData.filter(d => 
  new Date(d.date).getMonth() + 1 === currentMonth
);

// Compares with current year
const tempDiff = currentTemp - historicalAverage.temp;
const rainfallDiff = currentRainfall - historicalAverage.rainfall;

// Applies penalty if different
if (Math.abs(rainfallDiff) > 5) {
  suitabilityScore -= 0.20; // Downgrade!
  riskFactors.push('🌧️ Much rainier than usual');
}
```

---

## 📊 Database Tables Used

### **1. weather_current (7 & 30 days)**
```sql
SELECT * FROM weather_current
WHERE location_id = '14_829444_120_282222'
AND date >= CURRENT_DATE - INTERVAL '30 days';
```
→ Used for **current conditions**

### **2. weather_historical (1 & 5 years)**
```sql
SELECT * FROM weather_historical
WHERE location_id = '14_829444_120_282222'
AND EXTRACT(MONTH FROM date) = 9; -- September
```
→ Used for **5-year average comparison**

### **3. denormalized_crop_parameter**
```sql
SELECT * FROM denormalized_crop_parameter;
```
→ Used for **plant requirements** (temp, humidity, NPK, pH)

---

## 🔍 Console Logs to Watch

When you click "Recommendations" tab, you'll see:

```
🔄 Fetching crop parameters from database...
📊 Fetching 5-year historical weather data from database...
📊 Loaded 1825 historical records (5 years × 365 days)

📅 Current month: 10, Analyzing 2025 vs 5-year average

📊 5-year average for month 10:
  temp: 28.2°C
  humidity: 72.5%
  rainfall: 4.8mm/day

📊 Current year 2025 for month 10:
  temp: 30.1°C
  humidity: 78.3%
  rainfall: 8.2mm/day

🌱 Processing crop: Rice
📊 Rice - Historical comparison:
  tempDiff: +1.9°C
  humidityDiff: +5.8%
  rainfallDiff: +3.4mm/day

📊 Rice - Adjusted suitability: 0.85 (penalty: 0.00)

🌱 Processing crop: Tomato
📊 Tomato - Historical comparison:
  tempDiff: +1.9°C
  humidityDiff: +5.8%
  rainfallDiff: +3.4mm/day

📊 Tomato - Adjusted suitability: 0.62 (penalty: 0.15)
```

---

## ✅ Key Benefits

1. **No more static seasons** - Adapts to actual weather patterns
2. **Detects climate change** - "This year is hotter/rainier than usual"
3. **Location-specific** - Uses YOUR location's historical data
4. **Database-driven** - All data stored in Supabase tables
5. **Real-time updates** - Fetches latest weather on every visit

---

## 🚀 What You Need to Do

1. ✅ **Add `year` and `month` columns** to `weather_current` table:
```sql
ALTER TABLE weather_current 
ADD COLUMN IF NOT EXISTS year INTEGER;

ALTER TABLE weather_current 
ADD COLUMN IF NOT EXISTS month INTEGER;
```

2. ✅ **Test the recommendations** - Click "Recommendations" tab and check console

3. ✅ **Check database has data:**
```sql
-- Check if 5-year data exists
SELECT COUNT(*), MIN(date), MAX(date) 
FROM weather_historical 
WHERE location_id = 'your_location_id';

-- Should return: 1825 records (5 years × 365 days)
```

---

## 🎯 Example Output

### **Rice - September 2025**

**If normal year (matches 5-year average):**
```
Status: ✅ GOOD
Score: 0.95

Weather Conditions:
✅ Temperature: 28°C (optimal)
✅ Humidity: 75% (optimal)
✅ Rainfall: 5mm/day (optimal)

Best Months: Aug, Sep, Oct
```

**If rainy year (deviates from average):**
```
Status: ⚠️ CAUTION
Score: 0.65 (penalty: -0.20)

Weather Conditions:
✅ Temperature: 28°C (optimal)
⚠️ Humidity: 85% (high)
❌ Rainfall: 12mm/day (excessive)

Risk Factors:
🌧️ Much rainier than usual: +7mm/day vs 5-year avg
💧 High humidity: 85% (max 80%)

Recommendations:
⚠️ 2025 is experiencing unusual rainfall for September
🌬️ Improve ventilation and drainage
📊 Historically, September averages 5mm/day (currently 12mm/day)

Best Months: Aug, Oct (avoid September this year)
```

---

## 🔮 Future Enhancements

1. **AI/ML predictions** - Use historical data to predict next month's weather
2. **Climate trends** - Show 5-year warming/drying trends
3. **Crop yield correlation** - "Plants grown in similar conditions had 85% success rate"
4. **User feedback loop** - "Rate your harvest" → improve recommendations

---

**Your app is now MUCH smarter!** 🎉

It uses **real historical data** to make **context-aware recommendations** instead of just checking if it's the "right month". 🚀
