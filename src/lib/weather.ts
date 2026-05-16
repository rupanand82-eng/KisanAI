/**
 * Weather service using Open-Meteo
 */

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  dailyAdvice: string;
}

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  const current = data.current_weather;
  
  // Simple mapping of WMO codes to conditions
  const getCondition = (code: number) => {
    if (code === 0) return "Clear Sky";
    if (code <= 3) return "Partly Cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 67) return "Rainy";
    if (code <= 77) return "Snowy";
    if (code <= 99) return "Thunderstorm";
    return "Unknown";
  };

  return {
    temp: current.temperature,
    condition: getCondition(current.weathercode),
    humidity: data.hourly.relativehumidity_2m[0],
    windSpeed: current.windspeed,
    dailyAdvice: generateWeatherAdvice(current.temperature, current.weathercode)
  };
}

function generateWeatherAdvice(temp: number, code: number): string {
  if (code >= 51 && code <= 67) return "Heavy rain expected. Avoid spraying pesticides or fertilizers today.";
  if (temp > 35) return "High heat. Ensure adequate irrigation for sensitive crops.";
  if (temp < 10) return "Cold temperatures. Monitor for frost sensitive crops.";
  return "Weather looks favorable for standard field activities.";
}
