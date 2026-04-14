'use client'

import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Wind, Droplets, Thermometer, CloudFog, Eye } from 'lucide-react'

interface WeatherTabProps {
  city: string | null
}

interface CurrentWeather {
  temperature: number
  apparentTemperature: number
  weathercode: number
  windspeed: number
  humidity: number
}

interface DayForecast {
  date: string
  weathercode: number
  tempMax: number
  tempMin: number
  precipitation: number
}

// Mapping des codes météo WMO
function getWeatherInfo(code: number): { label: string; icon: React.ReactNode; bg: string } {
  if (code === 0)
    return { label: 'Ensoleillé',   icon: <Sun className="w-5 h-5" />,              bg: 'from-amber-400 to-orange-400' }
  if (code <= 2)
    return { label: 'Peu nuageux',  icon: <Cloud className="w-5 h-5" />,            bg: 'from-sky-400 to-blue-400' }
  if (code === 3)
    return { label: 'Couvert',      icon: <Cloud className="w-5 h-5" />,            bg: 'from-slate-400 to-gray-500' }
  if (code <= 48)
    return { label: 'Brouillard',   icon: <CloudFog className="w-5 h-5" />,         bg: 'from-gray-400 to-slate-500' }
  if (code <= 55)
    return { label: 'Bruine',       icon: <CloudDrizzle className="w-5 h-5" />,     bg: 'from-sky-500 to-blue-500' }
  if (code <= 65)
    return { label: 'Pluie',        icon: <CloudRain className="w-5 h-5" />,        bg: 'from-blue-500 to-indigo-500' }
  if (code <= 77)
    return { label: 'Neige',        icon: <CloudSnow className="w-5 h-5" />,        bg: 'from-blue-200 to-sky-300' }
  if (code <= 82)
    return { label: 'Averses',      icon: <CloudRain className="w-5 h-5" />,        bg: 'from-blue-500 to-cyan-500' }
  if (code <= 86)
    return { label: 'Neige forte',  icon: <CloudSnow className="w-5 h-5" />,        bg: 'from-indigo-200 to-blue-300' }
  return   { label: 'Orage',        icon: <CloudLightning className="w-5 h-5" />,   bg: 'from-violet-600 to-purple-700' }
}

function getWeatherIconSmall(code: number): React.ReactNode {
  if (code === 0)  return <Sun className="w-5 h-5 text-amber-400" />
  if (code <= 2)   return <Cloud className="w-5 h-5 text-sky-400" />
  if (code === 3)  return <Cloud className="w-5 h-5 text-gray-400" />
  if (code <= 48)  return <CloudFog className="w-5 h-5 text-gray-400" />
  if (code <= 55)  return <CloudDrizzle className="w-5 h-5 text-sky-500" />
  if (code <= 65)  return <CloudRain className="w-5 h-5 text-blue-500" />
  if (code <= 77)  return <CloudSnow className="w-5 h-5 text-blue-300" />
  if (code <= 82)  return <CloudRain className="w-5 h-5 text-blue-500" />
  if (code <= 86)  return <CloudSnow className="w-5 h-5 text-indigo-300" />
  return <CloudLightning className="w-5 h-5 text-violet-500" />
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function formatDay(dateStr: string, index: number): string {
  if (index === 0) return "Aujourd'hui"
  if (index === 1) return 'Demain'
  const d = new Date(dateStr)
  return DAY_LABELS[d.getDay()]
}

export default function WeatherTab({ city }: WeatherTabProps) {
  const [current, setCurrent] = useState<CurrentWeather | null>(null)
  const [forecast, setForecast] = useState<DayForecast[]>([])
  const [resolvedCity, setResolvedCity] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!city?.trim()) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setCurrent(null)
    setForecast([])

    async function fetchWeather() {
      try {
        // 1. Géocodage de la ville
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city!.trim())}&count=1&language=fr&format=json`
        )
        const geoData = await geoRes.json()
        if (!geoData.results?.length) {
          if (!cancelled) setError(`Ville "${city}" introuvable. Vérifiez l'orthographe dans l'onglet Infos.`)
          return
        }

        const { latitude, longitude, name, country } = geoData.results[0]
        if (!cancelled) setResolvedCity(`${name}, ${country}`)

        // 2. Prévisions météo (7 jours)
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
          `&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m` +
          `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum` +
          `&timezone=Europe%2FParis&forecast_days=7`
        )
        const weatherData = await weatherRes.json()

        if (cancelled) return

        const c = weatherData.current
        setCurrent({
          temperature:         Math.round(c.temperature_2m),
          apparentTemperature: Math.round(c.apparent_temperature),
          weathercode:         c.weathercode,
          windspeed:           Math.round(c.windspeed_10m),
          humidity:            c.relativehumidity_2m,
        })

        const d = weatherData.daily
        setForecast(
          (d.time as string[]).map((date: string, i: number) => ({
            date,
            weathercode:   d.weathercode[i],
            tempMax:       Math.round(d.temperature_2m_max[i]),
            tempMin:       Math.round(d.temperature_2m_min[i]),
            precipitation: Math.round(d.precipitation_sum[i] * 10) / 10,
          }))
        )
      } catch {
        if (!cancelled) setError('Impossible de charger la météo. Vérifiez votre connexion.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchWeather()
    return () => { cancelled = true }
  }, [city])

  // Pas de ville renseignée
  if (!city?.trim()) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-orange-50">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-50 rounded-2xl mb-4">
          <Cloud className="w-8 h-8 text-sky-300" />
        </div>
        <p className="font-semibold text-gray-600">Aucune ville renseignée</p>
        <p className="text-sm text-gray-400 mt-1">
          Renseignez la <span className="font-medium">Ville</span> dans l&apos;onglet <span className="font-medium">Infos</span> pour afficher la météo.
        </p>
      </div>
    )
  }

  // Chargement
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-40 bg-gradient-to-r from-sky-100 to-blue-100 rounded-3xl" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 bg-orange-50 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // Erreur
  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-red-100">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  if (!current) return null

  const weatherInfo = getWeatherInfo(current.weathercode)

  return (
    <div className="space-y-4">
      {/* Carte météo actuelle */}
      <div className={`bg-gradient-to-br ${weatherInfo.bg} rounded-3xl p-6 text-white shadow-sm`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm font-medium">{resolvedCity}</p>
            <p className="text-5xl font-bold mt-1">{current.temperature}°</p>
            <p className="text-white/80 text-sm mt-1">Ressenti {current.apparentTemperature}°</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <div className="scale-150">{weatherInfo.icon}</div>
          </div>
        </div>

        <p className="text-white font-semibold text-lg">{weatherInfo.label}</p>

        <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-1.5 text-white/80 text-sm">
            <Wind className="w-4 h-4" />
            <span>{current.windspeed} km/h</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/80 text-sm">
            <Droplets className="w-4 h-4" />
            <span>{current.humidity}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/80 text-sm">
            <Thermometer className="w-4 h-4" />
            <span>Ressenti {current.apparentTemperature}°</span>
          </div>
        </div>
      </div>

      {/* Prévisions 7 jours */}
      <div className="bg-white rounded-3xl border border-orange-50 shadow-sm shadow-orange-100 overflow-hidden">
        <p className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-orange-50">
          Prévisions 7 jours
        </p>
        <div className="divide-y divide-orange-50">
          {forecast.map((day, i) => (
            <div key={day.date} className="flex items-center gap-3 px-5 py-3">
              <span className={`text-sm font-semibold w-20 shrink-0 ${i === 0 ? 'text-orange-500' : 'text-gray-700'}`}>
                {formatDay(day.date, i)}
              </span>
              <span className="shrink-0">{getWeatherIconSmall(day.weathercode)}</span>
              {day.precipitation > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-sky-500 font-medium shrink-0">
                  <Droplets className="w-3 h-3" />{day.precipitation}mm
                </span>
              )}
              <div className="flex items-center gap-2 ml-auto text-sm font-semibold">
                <span className="text-blue-500">{day.tempMin}°</span>
                <span className="text-gray-300">·</span>
                <span className="text-orange-500">{day.tempMax}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-gray-300">
        Données Open-Meteo · Mise à jour automatique
      </p>
    </div>
  )
}
