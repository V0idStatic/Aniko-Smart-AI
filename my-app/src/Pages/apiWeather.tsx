import React, { useEffect, useState } from "react";
import { fetchWeatherApi } from "openmeteo";

interface WeatherData {
  temperature: Float32Array | null;
  precipitation: Float32Array | null;
  weatherCode: Float32Array | null;
}

const ApiWeather: React.FC = () => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const latitude = 52.52;
  const longitude = 13.41;

  // Function to fetch weather data
  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    const params = {
      latitude,
      longitude,
      hourly: ["temperature_2m", "precipitation", "weather_code"], // Customize as needed
    };

    const url = "https://api.open-meteo.com/v1/forecast";
    try {
      const responses = await fetchWeatherApi(url, params);
      const response = responses[0];
      const hourly = response.hourly();
      
      if (hourly) {
        const temperature = hourly.variables(0)?.valuesArray() || null;
        const precipitation = hourly.variables(1)?.valuesArray() || null;
        const weatherCode = hourly.variables(2)?.valuesArray() || null;

        setData({
          temperature,
          precipitation,
          weatherCode,
        });
      } else {
        setError("No hourly data available");
      }
    } catch (err) {
      setError("Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(); // Initial fetch

    // Polling every 5 seconds (5000 ms)
    const interval = setInterval(fetchWeather, 5000); // 5 seconds

    return () => clearInterval(interval); // Clean up the interval when the component unmounts
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Weather Data</h2>
      <div>Temperature: {data?.temperature ? Array.from(data.temperature).slice(0, 5).join(', ') : 'No data'}</div>
      <div>Precipitation: {data?.precipitation ? Array.from(data.precipitation).slice(0, 5).join(', ') : 'No data'}</div>
      <div>Weather Code: {data?.weatherCode ? Array.from(data.weatherCode).slice(0, 5).join(', ') : 'No data'}</div>
    </div>
  );
};

export default ApiWeather;
