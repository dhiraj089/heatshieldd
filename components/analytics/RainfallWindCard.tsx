'use client'

import React from 'react'
import { Navigation, Wind } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { ThaneLocation } from '@/app/page'
import type { LiveWeatherData } from '@/app/page'

interface RainfallWindCardProps {
  location: ThaneLocation
  weather: LiveWeatherData
}

export default function RainfallWindCard({ location, weather }: RainfallWindCardProps) {
  const rainData = (weather.hourlyRain && weather.hourlyRain.length > 0 ? weather.hourlyRain : [0, 0, 0.2, 0.5, 0.8, 1.2, 0.4, 0.1, 0, 0, 0, 0]).map((val, idx) => {
    const hour = idx * 2
    const hourLabel = `${hour < 10 ? '0' : ''}${hour}:00`
    return {
      time: hourLabel,
      rain: Number(val.toFixed(1)),
    }
  })

  return (
    <div className="bg-white rounded-[12px] p-5 shadow-sm border border-[#E8E2D8] flex flex-col justify-between transition-all h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#F0EBE1] mb-3">
        <div>
          <h3 className="text-base font-bold text-[#1A1A1A] tracking-tight">
            Rainfall & Wind Telemetry · {location.name}
          </h3>
          <p className="text-xs text-[#6B7280]">
            Precipitation and surface wind velocity in {location.name}
          </p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
          <Navigation size={18} className="transform rotate-45" />
        </div>
      </div>

      {/* Wind Metric Callout */}
      <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3.5 py-2 mb-3">
        <div className="flex items-center gap-2">
          <Wind size={18} className="text-[#0284C7]" />
          <div>
            <strong className="text-sm font-bold text-[#0F172A] block leading-tight">
              {weather.windSpeed} km/h
            </strong>
            <span className="text-[11px] text-[#64748B]">
              {weather.windDirection} wind across {location.name}
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full">
          Live Anemometer
        </span>
      </div>

      {/* Rainfall Bar Chart */}
      <div className="w-full h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rainData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={{ stroke: '#E8E2D8' }}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#1A1A1A] text-white p-2 rounded-lg shadow-lg text-xs">
                      <p className="text-[#9CA3AF]">{label}</p>
                      <p className="font-bold text-[#38BDF8]">
                        {payload[0].value} mm rain
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey="rain"
              fill="#2563EB"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-2 border-t border-[#F0EBE1] mt-2">
        <span>24h Rainfall Accumulation</span>
        <strong className="text-[#1A1A1A] font-bold">{weather.precipitation} mm total</strong>
      </div>
    </div>
  )
}
