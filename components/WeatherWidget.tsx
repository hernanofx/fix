"use client"

import { useEffect, useState } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer, Eye } from 'lucide-react'

interface WeatherData {
    temperature: number
    condition: string
    humidity: number
    windSpeed: number
    visibility: number
    icon: string
}

interface WeatherWidgetProps {
    city?: string
    country?: string
    className?: string
}

export default function WeatherWidget({ city, country, className = "" }: WeatherWidgetProps) {
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchWeather = async () => {
            if (!city) {
                setLoading(false)
                return
            }

            try {
                // Usar OpenWeatherMap API (requiere API key gratuita)
                const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo'
                const location = `${city}${country ? `,${country}` : ''}`

                // Para demo, usar datos simulados si no hay API key
                if (apiKey === 'demo') {
                    // Simular datos del clima
                    const mockWeather: WeatherData = {
                        temperature: Math.round(20 + Math.random() * 15), // 20-35°C
                        condition: ['Soleado', 'Parcialmente nublado', 'Nublado', 'Lluvioso'][Math.floor(Math.random() * 4)],
                        humidity: Math.round(40 + Math.random() * 40), // 40-80%
                        windSpeed: Math.round(5 + Math.random() * 20), // 5-25 km/h
                        visibility: Math.round(5 + Math.random() * 10), // 5-15 km
                        icon: '01d' // Default sunny
                    }
                    setWeather(mockWeather)
                    setLoading(false)
                    return
                }

                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric&lang=es`
                )

                if (!response.ok) {
                    throw new Error('Error al obtener el clima')
                }

                const data = await response.json()

                const weatherData: WeatherData = {
                    temperature: Math.round(data.main.temp),
                    condition: data.weather[0].description,
                    humidity: data.main.humidity,
                    windSpeed: Math.round(data.wind.speed * 3.6), // Convertir m/s a km/h
                    visibility: Math.round(data.visibility / 1000), // Convertir metros a km
                    icon: data.weather[0].icon
                }

                setWeather(weatherData)
            } catch (err) {
                console.error('Error fetching weather:', err)
                setError('No se pudo cargar el clima')
            } finally {
                setLoading(false)
            }
        }

        fetchWeather()
    }, [city, country])

    const getWeatherIcon = (condition: string, icon: string) => {
        // Si tenemos el icono de OpenWeatherMap, usarlo
        if (icon && icon !== '01d') {
            return <Sun className="h-6 w-6 text-yellow-500" />
        }

        // Fallback basado en condición
        const lowerCondition = condition.toLowerCase()
        if (lowerCondition.includes('lluvia') || lowerCondition.includes('rain')) {
            return <CloudRain className="h-6 w-6 text-blue-500" />
        } else if (lowerCondition.includes('nieve') || lowerCondition.includes('snow')) {
            return <CloudSnow className="h-6 w-6 text-blue-300" />
        } else if (lowerCondition.includes('nublado') || lowerCondition.includes('cloud')) {
            return <Cloud className="h-6 w-6 text-gray-500" />
        } else {
            return <Sun className="h-6 w-6 text-yellow-500" />
        }
    }

    if (loading) {
        return (
            <div className={`flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 ${className}`}>
                <div className="animate-pulse flex items-center space-x-3">
                    <div className="w-6 h-6 bg-white/20 rounded"></div>
                    <div className="space-y-2">
                        <div className="w-16 h-3 bg-white/20 rounded"></div>
                        <div className="w-12 h-2 bg-white/10 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !weather) {
        return (
            <div className={`flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 ${className}`}>
                <Cloud className="h-6 w-6 text-white/60" />
                <div>
                    <p className="text-white/80 text-sm font-medium">Clima no disponible</p>
                    <p className="text-white/60 text-xs">{city || 'Ubicación desconocida'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 ${className}`}>
            {getWeatherIcon(weather.condition, weather.icon)}
            <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                    <span className="text-white text-lg font-bold">{weather.temperature}°C</span>
                    <span className="text-white/80 text-sm capitalize">{weather.condition}</span>
                </div>
                <div className="flex items-center space-x-4 text-white/60 text-xs mt-1">
                    <span className="flex items-center space-x-1">
                        <Thermometer className="h-3 w-3" />
                        <span>{weather.humidity}%</span>
                    </span>
                    <span className="flex items-center space-x-1">
                        <Wind className="h-3 w-3" />
                        <span>{weather.windSpeed} km/h</span>
                    </span>
                    <span className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{weather.visibility} km</span>
                    </span>
                </div>
            </div>
        </div>
    )
}