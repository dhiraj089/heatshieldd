'use client'

import React from 'react'
import type { ThaneLocation } from '@/app/page'
import type { LiveWeatherData } from '@/app/page'

interface KPIMetricRowProps {
  location: ThaneLocation
  weather: LiveWeatherData
}

interface MiniSparklineProps {
  data: number[]
  color: string
}

function MiniSparkline({ data, color }: MiniSparklineProps) {
  if (!data || data.length === 0) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  return (
    <div className="flex items-end gap-1 h-6 w-full pt-1">
      {data.map((val, idx) => {
        const heightPct = Math.max(15, Math.min(100, Math.round(((val - min) / range) * 80 + 20)))
        return (
          <div
            key={idx}
            className="flex-1 rounded-xs transition-all opacity-85 hover:opacity-100"
            style={{
              height: `${heightPct}%`,
              backgroundColor: color,
            }}
            title={`Value: ${val}`}
          />
        )
      })}
    </div>
  )
}

export default function KPIMetricRow({ location, weather }: KPIMetricRowProps) {
  const cards = [
    {
      id: 'ambient',
      title: 'Ambient Temperature',
      context: `${location.name} Live`,
      value: weather.temp.toFixed(1),
      unit: '°C',
      change: `feels ${weather.feelsLike}°C`,
      borderAccent: 'border-l-[#EA580C]',
      barColor: '#EA580C',
      sparkline: weather.chartTemp?.slice(0, 8) || [32, 33, 35, 36, 37, 36, 34, weather.temp],
      tagLeft: 'telemetry sync',
      tagRight: '24h dynamic curve',
    },
    {
      id: 'lst',
      title: 'Land Surface Temp (LST)',
      context: location.zoneNumber,
      value: weather.surfaceTemp.toFixed(1),
      unit: '°C',
      change: location.lstOffset >= 0 ? `+${location.lstOffset}°C offset` : `${location.lstOffset}°C buffer`,
      borderAccent: 'border-l-[#DC2626]',
      barColor: '#DC2626',
      sparkline: [37 + location.lstOffset, 38.5 + location.lstOffset, 40 + location.lstOffset, 41.5 + location.lstOffset, 42.8 + location.lstOffset, 41 + location.lstOffset, 39 + location.lstOffset, weather.surfaceTemp],
      tagLeft: weather.surfaceTemp >= 40 ? 'CRITICAL THERMAL' : 'MONITORED LEVEL',
      tagRight: 'satellite LST',
    },
    {
      id: 'aqi',
      title: 'Air Quality Index (AQI)',
      context: 'CPCB Standard',
      value: String(weather.aqi),
      unit: ' AQI',
      change: weather.aqi > 100 ? 'Moderate (CPCB)' : 'Satisfactory (CPCB)',
      borderAccent: 'border-l-[#D97706]',
      barColor: '#D97706',
      sparkline: weather.chartAqi?.slice(0, 8) || [140, 150, 158, 164, 160, 155, 150, weather.aqi],
      tagLeft: 'telemetry sync',
      tagRight: 'continuous 24h',
    },
    {
      id: 'humidity',
      title: 'Live Humidity & Rain',
      context: 'Open-Meteo',
      value: String(weather.humidity),
      unit: '%',
      change: `${weather.precipitation} mm rain`,
      borderAccent: 'border-l-[#2563EB]',
      barColor: '#2563EB',
      sparkline: [62, 65, 68, 71, 74, 76, 73, weather.humidity],
      tagLeft: `${weather.precipitation} mm precipitation`,
      tagRight: 'hygrometer feed',
    },
    {
      id: 'hotspots',
      title: `Hotspots in ${location.name}`,
      context: 'Urban Clusters',
      value: weather.hotspotsCount < 10 ? `0${weather.hotspotsCount}` : String(weather.hotspotsCount),
      unit: ' clusters',
      change: location.vulnerability === 'High' ? 'High vulnerability' : 'Normal range',
      borderAccent: 'border-l-[#DC2626]',
      barColor: '#DC2626',
      sparkline: [2, 3, 4, 5, 6, 5, 4, weather.hotspotsCount],
      tagLeft: `${location.zoneNumber} active`,
      tagRight: 'spatial clustering',
    },
    {
      id: 'uv',
      title: 'Solar UV Index',
      context: `${location.lat.toFixed(1)}°N Sun Angle`,
      value: weather.uv.toFixed(1),
      unit: ' UV',
      change: weather.uvCategory.toUpperCase(),
      borderAccent: 'border-l-[#EAB308]',
      barColor: '#EAB308',
      sparkline: [1.2, 2.5, 4.8, 6.4, 6.8, 5.2, 3.8, weather.uv],
      tagLeft: 'solar radiance',
      tagRight: weather.uvCategory,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`bg-white rounded-[12px] p-4 shadow-sm border border-[#E8E2D8] border-l-4 ${card.borderAccent} flex flex-col justify-between min-h-[160px] transition-all hover:shadow-md`}
        >
          {/* TOP: Metric Name (small caps) + Context Label */}
          <div className="flex items-start justify-between gap-1 mb-1">
            <span className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider truncate">
              {card.title}
            </span>
            <span className="text-[10px] text-[#9CA3AF] font-medium shrink-0">
              {card.context}
            </span>
          </div>

          {/* MIDDLE: Large Value Number + Unit & Sub-status */}
          <div className="my-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-[28px] font-black text-[#1A1A1A] tracking-tight leading-none">
                {card.value}
              </span>
              <span className="text-xs font-bold text-[#6B7280]">
                {card.unit}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-[#4B5563] mt-1 truncate">
              {card.change}
            </p>
          </div>

          {/* BOTTOM: Mini Sparkline Bar Chart (8 bars) */}
          <div className="mt-1 mb-2">
            <MiniSparkline data={card.sparkline} color={card.barColor} />
          </div>

          {/* VERY BOTTOM: Metadata tags */}
          <div className="flex items-center justify-between text-[9px] font-mono text-[#9CA3AF] pt-1.5 border-t border-[#F0EBE1]">
            <span className="truncate">{card.tagLeft}</span>
            <span className="shrink-0">{card.tagRight}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
