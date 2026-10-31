'use client'

import React from 'react'
import { RefreshCw } from 'lucide-react'
import type { ThaneLocation } from '@/app/page'
import type { LiveWeatherData } from '@/app/page'

interface ForecastTimelineProps {
  location: ThaneLocation
  weather: LiveWeatherData
  onRefresh: () => void
}

export default function ForecastTimeline({
  location,
  weather,
  onRefresh,
}: ForecastTimelineProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[12px] p-5 shadow-sm border border-[rgba(16,16,16,0.15)] flex flex-col justify-between transition-all h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(16,16,16,0.15)] mb-4">
        <div>
          <h3 className="text-base font-bold text-[#101010] tracking-tight">
            Next 24 Hours Forecast · {location.name}
          </h3>
          <p className="text-xs text-[rgba(16,16,16,0.65)]">
            Hourly projection for {location.ward}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[rgba(16,16,16,0.65)] hover:text-[#101010] hover:bg-[#F5F0E8] border border-[#E5E0D8] transition-all"
          title="Refresh forecast projections"
        >
          <RefreshCw size={12} className={weather.isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Horizontal Scrollable Timeline */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {weather.forecastList.map((item, idx) => {
          const isNow = item.isNow || idx === 0
          return (
            <div
              key={idx}
              className={`flex flex-col items-center justify-between p-3 rounded-[10px] min-w-[85px] shrink-0 border transition-all text-center ${
                isNow
                  ? 'bg-[#D5360C] text-white border-[#B82D09] shadow-md ring-2 ring-[#D5360C]/20'
                  : 'bg-[#FAF8F5] text-[#101010] border-[#EBE6DC] hover:border-[#D8D2C6] hover:bg-[var(--color-surface)]'
              }`}
            >
              <span className={`text-[11px] font-bold ${isNow ? 'text-white/90' : 'text-[rgba(16,16,16,0.65)]'}`}>
                {item.time}
              </span>
              <span className="text-xl my-1.5">{item.icon}</span>
              <strong className="text-base font-extrabold leading-none">
                {item.temp}°
              </strong>
              <span className={`text-[10px] font-medium mt-1 truncate max-w-[75px] ${isNow ? 'text-white/80' : 'text-[rgba(16,16,16,0.65)]'}`}>
                {item.desc}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
