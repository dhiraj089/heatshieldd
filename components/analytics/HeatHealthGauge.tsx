'use client'

import React from 'react'
import type { ThaneLocation } from '@/app/page'
import type { LiveWeatherData } from '@/app/page'

interface HeatHealthGaugeProps {
  location: ThaneLocation
  weather: LiveWeatherData
}

export default function HeatHealthGauge({ location, weather }: HeatHealthGaugeProps) {
  const score = weather.heatHealthIndex
  const isHigh = score >= 70
  const isMod = score >= 50 && score < 70
  const color = isHigh ? '#D5360C' : isMod ? '#D5360C' : '#16A34A'
  const badgeClass = isHigh
    ? 'bg-[var(--color-bg-soft)] text-[#D5360C] border-[#FCA5A5]'
    : isMod
    ? 'bg-[rgba(213,54,12,0.15)] text-[#D5360C] border-[#FDBA74]'
    : 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'

  const badgeText = isHigh ? 'HIGH RISK' : isMod ? 'MODERATE' : 'LOW RISK'

  // Circumference for 140px diameter gauge (r = 56)
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="bg-[var(--color-surface)] rounded-[12px] p-5 shadow-sm border border-[rgba(16,16,16,0.15)] flex flex-col justify-between transition-all h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(16,16,16,0.15)] mb-3">
        <div>
          <h3 className="text-base font-bold text-[#101010] tracking-tight">
            Heat Health Index · {location.name}
          </h3>
          <p className="text-xs text-[rgba(16,16,16,0.65)]">
            {location.ward} composite heat stress
          </p>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeClass}`}>
          {badgeText}
        </span>
      </div>

      {/* Radial Gauge Center */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="#F3EFE6"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke={color}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="flex items-baseline justify-center">
              <span className="text-3xl font-black text-[#101010] leading-none">
                {score}
              </span>
              <span className="text-xs font-semibold text-[rgba(16,16,16,0.65)] ml-0.5">
                /100
              </span>
            </div>
            <span
              className="text-[11px] font-extrabold uppercase tracking-wide mt-1"
              style={{ color }}
            >
              ↑ {location.name} Risk
            </span>
            <span className="text-[10px] text-[rgba(16,16,16,0.65)] font-medium truncate max-w-[100px]">
              {location.zoneNumber} · {location.type}
            </span>
          </div>
        </div>
      </div>

      {/* Two metrics below gauge */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[rgba(16,16,16,0.15)] text-xs">
        <div className="bg-[#FAF8F5] p-2.5 rounded-[8px] border border-[#EBE6DC]">
          <div className="flex items-center gap-1.5 text-[rgba(16,16,16,0.65)] text-[11px] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#D5360C]" />
            <span className="truncate">Ambient heat ({location.name})</span>
          </div>
          <strong className="text-sm font-bold text-[#101010]">
            {weather.temp}°C
          </strong>
        </div>

        <div className="bg-[#FAF8F5] p-2.5 rounded-[8px] border border-[#EBE6DC]">
          <div className="flex items-center gap-1.5 text-[rgba(16,16,16,0.65)] text-[11px] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#D5360C]" />
            <span className="truncate">Humidity stress</span>
          </div>
          <strong className="text-sm font-bold text-[#101010]">
            {weather.humidity}%
          </strong>
        </div>
      </div>
    </div>
  )
}
