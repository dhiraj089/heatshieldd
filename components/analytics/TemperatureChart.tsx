'use client'

import React, { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { ThaneLocation } from '@/app/page'
import type { LiveWeatherData } from '@/app/page'

interface TemperatureChartProps {
  location: ThaneLocation
  weather: LiveWeatherData
}

export default function TemperatureChart({ location, weather }: TemperatureChartProps) {
  const [isLiveActive, setIsLiveActive] = useState(true)

  // Map 24-hour chart temperature curve
  const chartData = (weather.chartTemp && weather.chartTemp.length > 0 ? weather.chartTemp : [28, 29, 30, 32, 34, 36, 37, 36.5, 35, 33, 31, 29]).map((val, idx) => {
    const hour = idx * 2
    const hourLabel = `${hour < 10 ? '0' : ''}${hour}:00`
    return {
      time: hourLabel,
      temp: Number(val.toFixed(1)),
    }
  })

  return (
    <div className="bg-white rounded-[12px] p-5 shadow-sm border border-[#E8E2D8] flex flex-col justify-between transition-all h-full">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EBE1] mb-4">
        <div>
          <h3 className="text-base font-bold text-[#1A1A1A] tracking-tight">
            Temperature Overview · {location.name}
          </h3>
          <p className="text-xs text-[#6B7280]">
            24-hour temperature telemetry for {location.name} ({location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
              isLiveActive
                ? 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]'
                : 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveActive ? 'bg-[#EA580C] animate-pulse' : 'bg-[#9CA3AF]'}`} />
            Live Curve
          </button>
        </div>
      </div>

      {/* Peak Temp Callout Annotation */}
      <div className="flex items-center justify-between bg-[#FFF7ED] border border-[#FED7AA] rounded-[8px] px-3.5 py-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">🔥</span>
          <span className="text-xs text-[#9A3412] font-medium">
            Peak today in <strong>{location.name}</strong> around <strong>{weather.peakTime}</strong>
          </span>
        </div>
        <strong className="text-sm font-extrabold text-[#EA580C]">
          {weather.peakTemp}°C
        </strong>
      </div>

      {/* Recharts Area Chart */}
      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EA580C" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE9" vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={{ stroke: '#E8E2D8' }}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
            />
            <YAxis
              domain={['dataMin - 2', 'dataMax + 2']}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              tickFormatter={(v) => `${v}°`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#1A1A1A] text-white p-2.5 rounded-lg shadow-lg text-xs">
                      <p className="text-[#9CA3AF] mb-0.5">{label}</p>
                      <p className="font-bold text-[#EA580C] text-sm">
                        {payload[0].value}°C
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#EA580C"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#tempGradient)"
              dot={{ r: 3, fill: '#EA580C', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#EA580C', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
