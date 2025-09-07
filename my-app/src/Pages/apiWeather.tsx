import React, { useEffect, useState } from "react";

// Define the structure of the JSON data returned by Weatherbit API
interface Weather {
  icon: string;
  code: number;
  description: string;
}

interface SoilData {
  bulk_soil_density: number;
  skin_temp_max: number;
  skin_temp_avg: number;
  skin_temp_min: number;
  precip: number;
  specific_humidity: number;
  evapotranspiration: number;
  pres_avg: number;
  wind_10m_spd_avg: number;
  dlwrf_avg: number;
  dlwrf_max: number;
  dswrf_avg: number;
  dswrf_max: number;
  dswrf_net: number;
  dlwrf_net: number;
  soilm_0_10cm: number;
  soilm_10_40cm: number;
  soilm_40_100cm: number;
  soilm_100_200cm: number;
  v_soilm_0_10cm: number;
  v_soilm_10_40cm: number;
  v_soilm_40_100cm: number;
  v_soilm_100_200cm: number;
  soilt_0_10cm: number;
  soilt_10_40cm: number;
  soilt_40_100cm: number;
  soilt_100_200cm: number;
}

interface WeatherData {
  wind_cdir: string;
  rh: number;
  app_temp: number;
  pres: number;
  temp: number;
  precip: number;
  weather: Weather;
  datetime: string;
  city_name: string;
  lat: number;
  lon: number;
  soilData: SoilData;
}

const ApiWeather: React.FC = () => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Coordinates for Manila, Philippines
  const latitude = 14.5995;
  const longitude = 120.9842;
  const apiKey = "2c645da230f94c07b3e71a260db1723b"; // Replace with your API key from Weatherbit

  // Function to fetch weather data
  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    const url = `https://api.weatherbit.io/v2.0/current?lat=${latitude}&lon=${longitude}&key=${apiKey}`;
    
    console.log("Fetching from URL:", url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      // Log the entire JSON response to debug the structure
      console.log("API Response:", json);

      if (json.data && json.data.length > 0) {
        const weatherData = json.data[0];

        setData({
          wind_cdir: weatherData.wind_cdir || "N/A",
          rh: weatherData.rh || 0,
          app_temp: weatherData.app_temp || 0,
          pres: weatherData.pres || 0,
          temp: weatherData.temp || 0,
          precip: weatherData.precip || 0,
          weather: weatherData.weather || { icon: "", code: 0, description: "No data" },
          datetime: weatherData.datetime || "No data",
          city_name: weatherData.city_name || "Unknown",
          lat: weatherData.lat || latitude,
          lon: weatherData.lon || longitude,
          soilData: weatherData.soilData || {
            bulk_soil_density: 0,
            skin_temp_max: 0,
            skin_temp_avg: 0,
            skin_temp_min: 0,
            precip: 0,
            specific_humidity: 0,
            evapotranspiration: 0,
            pres_avg: 0,
            wind_10m_spd_avg: 0,
            dlwrf_avg: 0,
            dlwrf_max: 0,
            dswrf_avg: 0,
            dswrf_max: 0,
            dswrf_net: 0,
            dlwrf_net: 0,
            soilm_0_10cm: 0,
            soilm_10_40cm: 0,
            soilm_40_100cm: 0,
            soilm_100_200cm: 0,
            v_soilm_0_10cm: 0,
            v_soilm_10_40cm: 0,
            v_soilm_40_100cm: 0,
            v_soilm_100_200cm: 0,
            soilt_0_10cm: 0,
            soilt_10_40cm: 0,
            soilt_40_100cm: 0,
            soilt_100_200cm: 0,
          },
        });
      } else {
        setError("No weather data available in API response.");
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(`Failed to fetch weather data: ${err.message}. Check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(); // Initial fetch

    // Polling every 5 seconds (5000 ms)
    const interval = setInterval(fetchWeather, 60000);  // 5 seconds

    return () => clearInterval(interval); // Clean up the interval when the component unmounts
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Weather Data for {data?.city_name}</h2>
      <div>Temperature: {data?.temp}°C</div>
      <div>Feels like: {data?.app_temp}°C</div>
      <div>Humidity: {data?.rh}%</div>
      <div>Wind: {data?.wind_cdir}</div>
      <div>Pressure: {data?.pres} hPa</div>
      <div>Precipitation: {data?.precip} mm</div>
      <div>Weather: {data?.weather?.description || "No description"}</div>
      <div>Time: {data?.datetime}</div>
      <div>Coordinates: {data?.lat}, {data?.lon}</div>

      {/* Display Soil Data if available */}
      {data?.soilData && (
        <>
          <h3>Soil Data</h3>
          <div>Soil Temperature (Max): {data.soilData.skin_temp_max}°C</div>
          <div>Soil Temperature (Avg): {data.soilData.skin_temp_avg}°C</div>
          <div>Soil Temperature (Min): {data.soilData.skin_temp_min}°C</div>
          <div>Soil Moisture (0-10cm): {data.soilData.soilm_0_10cm} cm</div>
          <div>Soil Moisture (10-40cm): {data.soilData.soilm_10_40cm} cm</div>
          <div>Soil Moisture (40-100cm): {data.soilData.soilm_40_100cm} cm</div>
          <div>Soil Moisture (100-200cm): {data.soilData.soilm_100_200cm} cm</div>
          <div>Evapotranspiration: {data.soilData.evapotranspiration}</div>
        </>
      )}
    </div>
  );
};

export default ApiWeather;
