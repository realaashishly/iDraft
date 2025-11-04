import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Cloudy,
  Haze,
  type LucideProps,
  Moon,
  Snowflake,
  Sun,
} from "lucide-react";
import { type ComponentType, type FC, useEffect, useState } from "react";

// --- Type Definitions ---
type LucideIcon = ComponentType<LucideProps>;
interface CurrentWeather {
  temp: number;
  condition: string;
  location: string;
  icon: LucideIcon;
}
interface ForecastItem {
  time: string;
  temp: string;
  icon: LucideIcon;
}

// --- Icon Mapping Helper ---
const getWeatherIcon = (iconCode: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    "01d": Sun,
    "01n": Moon,
    "02d": CloudSun,
    "02n": CloudSun,
    "03d": Cloud,
    "03n": Cloud,
    "04d": Cloudy,
    "04n": Cloudy,
    "09d": CloudRain,
    "09n": CloudRain,
    "10d": CloudRain,
    "10n": CloudRain,
    "11d": CloudLightning,
    "11n": CloudLightning,
    "13d": Snowflake,
    "13n": Snowflake,
    "50d": Haze,
    "50n": Haze,
  };
  return iconMap[iconCode] || Cloud;
};

const WeatherWidget: FC = () => {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  useEffect(() => {
    if (!API_KEY) {
      console.error("WeatherWidget: ⛔️ API_KEY is missing!");
      setError(
        "Weather API key not found. Please set NEXT_PUBLIC_OPENWEATHER_API_KEY."
      );
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      console.error("WeatherWidget: ⛔️ Geolocation not supported.");
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherData(latitude, longitude, API_KEY);
      },
      (err) => {
        console.error("WeatherWidget: ⛔️ Geolocation failed:", err.message);
        setError(
          "Unable to retrieve location. Please enable location services."
        );
        setLoading(false);
      }
    );
  }, [API_KEY]);

  const fetchWeatherData = async (lat: number, lon: number, key: string) => {
    try {
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;

      const [currentRes, forecastRes] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl),
      ]);

      if (!(currentRes.ok && forecastRes.ok)) {
        throw new Error(
          `API error: ${currentRes.status} / ${forecastRes.status}`
        );
      }

      const currentData = await currentRes.json();
      const forecastData = await forecastRes.json();

      // Safety: ensure weather array exists
      const weatherArr = currentData.weather;
      if (!Array.isArray(weatherArr) || weatherArr.length === 0) {
        throw new Error("Unexpected weather data format (no weather array).");
      }

      setWeather({
        temp: Math.round(currentData.main.temp),
        condition: weatherArr[0].main,
        location: currentData.name,
        icon: getWeatherIcon(weatherArr[0].icon),
      });

      // Format forecast
      const formattedForecast: ForecastItem[] = (forecastData.list ?? [])
        .slice(0, 6)
        .map((item: any) => ({
          time: new Date(item.dt_txt).toLocaleTimeString("en-US", {
            hour: "numeric",
            hour12: true,
          }),
          temp: `${Math.round(item.main.temp)}°`,
          icon: getWeatherIcon(item.weather[0].icon),
        }));

      setForecast(formattedForecast);
    } catch (err: unknown) {
      console.error("WeatherWidget: ⛔️ Error fetching weather data:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading weather...</div>;
  }
  if (error) {
    return <div className="p-4 text-center text-white">Error: {error}</div>;
  }
  if (!weather) {
    return <div className="p-4 text-center">No weather data.</div>;
  }

  const MainIcon = weather.icon;

  return (
    <div className="flex w-full flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MainIcon className="text-foreground" size={28} />
          <span className="font-semibold text-2xl">{weather.temp}°</span>
        </div>
        <div className="text-right">
          <span className="font-medium text-sm">{weather.condition}</span>
          <p className="text-muted-foreground text-xs">{weather.location}</p>
        </div>
      </div>
      <div className="flex w-full justify-between border-border/50 border-t pt-2">
        {forecast.map((item, idx) => {
          const FI = item.icon;
          return (
            <div className="flex flex-col items-center space-y-0.5" key={idx}>
              <span className="text-[10px] text-muted-foreground">
                {item.time}
              </span>
              <FI className="text-foreground" size={16} />
              <span className="text-[10px]">{item.temp}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeatherWidget;
