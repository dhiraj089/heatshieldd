'use client'

import React from 'react'
import { Clock } from 'lucide-react'
import type { ThaneLocation } from '@/app/page'

interface SafeOutdoorClockProps {
  location: ThaneLocation
  time: {
    formatted: string
    timeShort: string
    hour: number
    clockAngle: number
  }
}

export default function SafeOutdoorClock({ location, time }: SafeOutdoorClockProps) {
  const safeHoursLabel =
    time.hour >= 11 && time.hour < 16
      ? 'Peak Heat Load (Avoid Direct Sun)'
      : time.hour < 10
      ? 'Optimal Morning Hours (Safe)'
      : 'Safe Evening Period'

  const safeHoursSubtitle =
    time.hour >= 11 && time.hour < 16
      ? `High solar irradiance in ${location.name} · Hydration shelters active`
      : `Recommended for municipal crews and outdoor logistics in ${location.name}`

  return (
    <div className="bg-white rounded-[12px] p-5 shadow-sm border border-[#E8E2D8] flex flex-col justify-between transition-all h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1] mb-3">
        <div>
          <h3 className="text-base font-bold text-[#1A1A1A] tracking-tight">
            Safe Outdoor Hours · {location.name}
          </h3>
          <p className="text-xs text-[#6B7280]">
            Advisory for outdoor workers & civic crews
          </p>
        </div>
        <span
          className="text-xs font-mono font-bold text-[#EA580C] bg-[#FFF7ED] px-2.5 py-1 rounded-full border border-[#FED7AA]"
          suppressHydrationWarning
        >
          {time.timeShort} IST
        </span>
      </div>

      {/* Analog Clock + Safe Advisory */}
      <div className="flex items-center gap-4 my-2">
        {/* Analog Clock SVG */}
        <div className="relative w-20 h-20 shrink-0 bg-[#FAF8F5] rounded-full border-2 border-[#E5E0D8] shadow-inner flex items-center justify-center">
          {/* Clock numbers */}
          <span className="absolute top-1 text-[9px] font-extrabold text-[#9CA3AF]">12</span>
          <span className="absolute right-1 text-[9px] font-extrabold text-[#9CA3AF]">3</span>
          <span className="absolute bottom-1 text-[9px] font-extrabold text-[#9CA3AF]">6</span>
          <span className="absolute left-1 text-[9px] font-extrabold text-[#9CA3AF]">9</span>

          {/* Clock Hands */}
          <div
            className="absolute w-0.5 h-6 bg-[#EA580C] rounded-full origin-bottom bottom-10 left-[39px] transition-transform duration-500"
            style={{ transform: `rotate(${time.clockAngle}deg)` }}
          />
          <div
            className="absolute w-1 h-4 bg-[#1A1A1A] rounded-full origin-bottom bottom-10 left-[38px] transition-transform duration-500"
            style={{ transform: `rotate(${(time.hour % 12) * 30 + 10}deg)` }}
          />
          <div className="w-2 h-2 rounded-full bg-[#1A1A1A] z-10" />
        </div>

        {/* Advisory Text */}
        <div className="flex-1">
          <strong className="text-sm sm:text-base font-extrabold text-[#1A1A1A] block leading-tight">
            {safeHoursLabel}
          </strong>
          <p className="text-xs text-[#6B7280] mt-1 leading-snug">
            {safeHoursSubtitle}
          </p>
        </div>
      </div>

      {/* Recommended Time Windows */}
      <div className="bg-[#FAF8F5] p-2.5 rounded-[8px] border border-[#EBE6DC] text-xs">
        <span className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider block mb-0.5">
          Recommended Work Windows
        </span>
        <strong className="text-xs font-semibold text-[#16A34A] block">
          6:00 AM – 10:30 AM · 5:00 PM – 8:30 PM
        </strong>
      </div>
    </div>
  )
}
