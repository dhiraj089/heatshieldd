'use client'

import React, { useMemo, useState } from 'react'
import { MapPin, Search, X } from 'lucide-react'
import type { ThaneLocation } from '@/app/page'
import type { LiveWeatherData } from '@/app/page'

interface WardCardGridProps {
  locations: ThaneLocation[]
  selectedLocation: ThaneLocation
  onSelectLocation: (loc: ThaneLocation) => void
  weather: LiveWeatherData
}

export default function WardCardGrid({
  locations,
  selectedLocation,
  onSelectLocation,
  weather,
}: WardCardGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const totalCount = locations.length
  const highCount = locations.filter((l) => l.vulnerability === 'High').length
  const modCount = locations.filter((l) => l.vulnerability === 'Moderate').length
  const lowCount = locations.filter((l) => l.vulnerability === 'Low').length

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.ward.toLowerCase().includes(q) ||
        loc.type.toLowerCase().includes(q) ||
        loc.zoneNumber.toLowerCase().includes(q) ||
        loc.keyLandmark.toLowerCase().includes(q)

      const matchesFilter =
        filterType === 'all' || loc.vulnerability.toLowerCase() === filterType.toLowerCase()
      return matchesSearch && matchesFilter
    })
  }, [locations, searchQuery, filterType])

  return (
    <div className="bg-white rounded-[12px] p-5 shadow-sm border border-[#E8E2D8] mb-6 transition-all">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#F0EBE1] mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center shrink-0">
            <MapPin size={20} className="text-[#EA580C]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1A1A1A] tracking-tight">
              Thane City Monitoring Network ({locations.length} Locations)
            </h3>
            <p className="text-xs text-[#6B7280]">
              18 Calibrated Telemetry Zones across Thane · Click any location for real-time dashboard sync
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex items-center min-w-[240px] sm:min-w-[280px]">
            <Search size={14} className="absolute left-3 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search location, ward, landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#FBF9F5] border border-[#E5E0D8] rounded-full focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] text-[#1A1A1A] placeholder-[#9CA3AF] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#9CA3AF] hover:text-[#1A1A1A] p-0.5"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-[#F5F0E8] p-1 rounded-full border border-[#E8E2D8] text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-full transition-all ${
                filterType === 'all'
                  ? 'bg-white text-[#1A1A1A] shadow-xs font-semibold'
                  : 'text-[#6B7280] hover:text-[#1A1A1A]'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilterType('high')}
              className={`px-3 py-1 rounded-full transition-all ${
                filterType === 'high'
                  ? 'bg-[#DC2626] text-white shadow-xs font-semibold'
                  : 'text-[#DC2626] hover:bg-[#FEE2E2]'
              }`}
            >
              High Risk ({highCount})
            </button>
            <button
              onClick={() => setFilterType('moderate')}
              className={`px-3 py-1 rounded-full transition-all ${
                filterType === 'moderate'
                  ? 'bg-[#EA580C] text-white shadow-xs font-semibold'
                  : 'text-[#EA580C] hover:bg-[#FFEDD5]'
              }`}
            >
              Moderate ({modCount})
            </button>
            <button
              onClick={() => setFilterType('low')}
              className={`px-3 py-1 rounded-full transition-all ${
                filterType === 'low'
                  ? 'bg-[#16A34A] text-white shadow-xs font-semibold'
                  : 'text-[#16A34A] hover:bg-[#DCFCE7]'
              }`}
            >
              Low ({lowCount})
            </button>
          </div>
        </div>
      </div>

      {/* 18 Ward Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-7 gap-3">
        {filteredLocations.map((loc) => {
          const isSelected = loc.id === selectedLocation.id
          const zoneObj = weather.zonesList.find((z) => z.id === loc.id)
          const lstValue = zoneObj
            ? zoneObj.lst
            : Number((weather.surfaceTemp + (loc.lstOffset - selectedLocation.lstOffset)).toFixed(1))

          const badgeBg =
            loc.vulnerability === 'High'
              ? 'bg-[#DC2626] text-white'
              : loc.vulnerability === 'Moderate'
              ? 'bg-[#EA580C] text-white'
              : 'bg-[#16A34A] text-white'

          const lstColor =
            lstValue >= 42
              ? 'text-[#DC2626]'
              : lstValue >= 40
              ? 'text-[#EA580C]'
              : 'text-[#16A34A]'

          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onSelectLocation(loc)}
              className={`relative flex flex-col justify-between text-left p-3 min-h-[96px] rounded-[10px] transition-all border ${
                isSelected
                  ? 'border-[#EA580C] bg-[#FFFBF7] ring-2 ring-[#EA580C]/25 shadow-md -translate-y-0.5'
                  : 'border-[#EBE6DC] bg-[#FAF8F5] hover:bg-white hover:border-[#D8D2C6] hover:shadow-sm hover:-translate-y-0.5'
              }`}
            >
              {/* TOP ROW: Ward No & Live Indicator + Risk Badge */}
              <div className="flex items-center justify-between w-full gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]" />
                  </span>
                  <span className="text-[10px] font-semibold text-[#6B7280] tracking-wide uppercase">
                    {loc.zoneNumber}
                  </span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${badgeBg}`}>
                  {loc.vulnerability}
                </span>
              </div>

              {/* MIDDLE: Ward Name */}
              <div className="text-sm font-bold text-[#1A1A1A] truncate w-full mb-1">
                {loc.name}
              </div>

              {/* BOTTOM ROW: LST Value + Coordinates */}
              <div className="flex items-center justify-between w-full pt-1 border-t border-[#EAE5DC]/60 text-[11px]">
                <strong className={`font-bold ${lstColor}`}>{lstValue}°C LST</strong>
                <span className="text-[10px] text-[#9CA3AF] font-mono">
                  {loc.lat.toFixed(2)}°N
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
