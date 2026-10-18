'use client'

import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import type { ThaneLocation } from '@/app/page'
import type { LiveWeatherData } from '@/app/page'

interface AQIChartProps {
  location: ThaneLocation
  weather: LiveWeatherData
}

export default function AQIChart({ location, weather }: AQIChartProps) {
  const chartData = (weather.chartAqi && weather.chartAqi.length > 0 ? weather.chartAqi : [135, 142, 150, 158, 164, 160, 155, 148, 140, 138, 142, 145]).map((val, idx) => {
    const hour = idx * 2
    const hourLabel = `${hour < 10 ? '0' : ''}${hour}:00`
    return {
      time: hourLabel,
      aqi: val,
    }
  })

  return (
    <div className="bg-white rounded-[12px] p-5 shadow-sm border border-[#E8E2D8] flex flex-col justify-between transition-all h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#F0EBE1] mb-4">
        <div>
          <h3 className="text-base font-bold text-[#1A1A1A] tracking-tight">
            Air Quality Index · {location.name}
          </h3>
          <p className="text-xs text-[#6B7280]">
            24-hour AQI telemetry · CPCB / US EPA standard
          </p>
        </div>

        <div className="text-right">
          <div className="text-xl sm:text-2xl font-black text-[#D97706] leading-none">
            {weather.aqi} <small className="text-xs font-bold text-[#9CA3AF]">AQI</small>
          </div>
          <span className="text-[10px] font-semibold text-[#6B7280]">
            {weather.aqi > 100 ? 'Moderate (CPCB)' : 'Satisfactory (CPCB)'}
          </span>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97706" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
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
              domain={[50, 'dataMax + 20']}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
            />
            <ReferenceLine
              y={100}
              stroke="#D97706"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#1A1A1A] text-white p-2.5 rounded-lg shadow-lg text-xs">
                      <p className="text-[#9CA3AF] mb-0.5">{label}</p>
                      <p className="font-bold text-[#D97706] text-sm">
                        {payload[0].value} AQI
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="aqi"
              stroke="#D97706"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#aqiGradient)"
              dot={{ r: 3, fill: '#D97706', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Threshold standard label */}
      <div className="flex items-center justify-between text-xs text-[#6B7280] pt-3 border-t border-[#F0EBE1] mt-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-[#D97706]" />
          <span>CPCB / WHO Moderate Standard</span>
        </div>
        <strong className="font-bold text-[#1A1A1A]">100 AQI</strong>
      </div>
    </div>
  )
}
