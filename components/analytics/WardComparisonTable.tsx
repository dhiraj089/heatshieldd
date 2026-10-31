'use client'

import React from 'react'
import { ArrowRight, Check } from 'lucide-react'
import type { ThaneLocation } from '@/app/page'
import type { LiveWeatherData } from '@/app/page'
import { THANE_LOCATIONS } from '@/app/page'

interface WardComparisonTableProps {
  selectedLocation: ThaneLocation
  onSelectLocation: (loc: ThaneLocation) => void
  weather: LiveWeatherData
}

export default function WardComparisonTable({
  selectedLocation,
  onSelectLocation,
  weather,
}: WardComparisonTableProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[12px] p-5 shadow-sm border border-[rgba(16,16,16,0.15)] transition-all">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(16,16,16,0.15)] mb-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#16A34A]" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-[#101010] tracking-tight">
              Thane Wards Heat Comparison Matrix (All {weather.zonesList.length || 18} Locations)
            </h3>
            <p className="text-xs text-[rgba(16,16,16,0.65)]">
              Click any row to switch telemetry and examine detailed analytics for that ward
            </p>
          </div>
        </div>
      </div>

      {/* Table Wrapper */}
      <div className="overflow-x-auto rounded-[8px] border border-[#EBE6DC]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[rgba(16,16,16,0.15)] text-[rgba(16,16,16,0.65)] font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Location & Ward</th>
              <th className="py-3 px-4">Type & Microclimate</th>
              <th className="py-3 px-4">Coordinates</th>
              <th className="py-3 px-4">Land Surface Temp (LST)</th>
              <th className="py-3 px-4">Vulnerability</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(16,16,16,0.15)]">
            {weather.zonesList.map((z) => {
              const fullLoc = THANE_LOCATIONS.find((l) => l.id === z.id) || selectedLocation
              const isCurrent = z.id === selectedLocation.id

              const statusDotColor =
                z.status === 'Critical'
                  ? 'bg-[#D5360C]'
                  : z.status === 'Watch'
                  ? 'bg-[#D5360C]'
                  : 'bg-[#16A34A]'

              const statusBadgeColor =
                z.status === 'Critical'
                  ? 'bg-[var(--color-bg-soft)] text-[#D5360C] border-[#FCA5A5]'
                  : z.status === 'Watch'
                  ? 'bg-[rgba(213,54,12,0.15)] text-[#D5360C] border-[#FDBA74]'
                  : 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'

              const lstTextColor =
                z.lst >= 42
                  ? 'text-[#D5360C]'
                  : z.lst >= 40
                  ? 'text-[#D5360C]'
                  : 'text-[#16A34A]'

              return (
                <tr
                  key={z.id}
                  onClick={() => onSelectLocation(fullLoc)}
                  className={`cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-[var(--color-bg-soft)] font-medium'
                      : 'hover:bg-[#FAF8F5] bg-[var(--color-surface)]'
                  }`}
                >
                  {/* Status Indicator */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusDotColor}`} />
                  </td>

                  {/* Location & Ward */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <strong className="text-sm font-bold text-[#101010]">
                        {z.name}
                      </strong>
                      <span className="text-[11px] text-[rgba(16,16,16,0.65)]">
                        {fullLoc.zoneNumber} · {fullLoc.ward}
                      </span>
                    </div>
                  </td>

                  {/* Type & Microclimate */}
                  <td className="py-3.5 px-4 text-[rgba(16,16,16,0.65)]">
                    {fullLoc.type}
                  </td>

                  {/* Coordinates */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[rgba(16,16,16,0.65)]">
                    {fullLoc.lat.toFixed(4)}°N, {fullLoc.lon.toFixed(4)}°E
                  </td>

                  {/* Land Surface Temp */}
                  <td className="py-3.5 px-4">
                    <strong className={`text-sm font-extrabold ${lstTextColor}`}>
                      {z.lst}°C <span className="text-[10px] font-normal text-[rgba(16,16,16,0.65)]">LST</span>
                    </strong>
                  </td>

                  {/* Vulnerability Status */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider ${statusBadgeColor}`}>
                      {z.status}
                    </span>
                  </td>

                  {/* Action Button */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectLocation(fullLoc)
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#D5360C] text-white shadow-xs'
                          : 'bg-[var(--color-surface)] text-[rgba(16,16,16,0.65)] hover:text-[#101010] hover:bg-[#F5F0E8] border border-[#D1D5DB]'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check size={12} />
                          <span>Active View</span>
                        </>
                      ) : (
                        <>
                          <span>Switch</span>
                          <ArrowRight size={12} />
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
