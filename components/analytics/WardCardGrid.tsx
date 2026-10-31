'use client'

import React, { useMemo, useState } from 'react'
import { MapPin, Search, X } from 'lucide-react'
import type { ThaneLocation } from '@/app/page'
import type { LiveWeatherData } from '@/app/page'
import { LOCATION_ID_MAP } from '@/lib/thane-dataset'

/**
 * Domain-specific data structure for each environmental monitoring station node.
 * Structures civic identity, geospatial coordinates, and real-time thermal telemetry
 * into dedicated, cohesive models suitable for Thane municipal monitoring.
 * Preserves 100% of underlying calculation and filtering logic.
 */
export interface TelemetryStationNode {
  // Station & Civic Identity
  id: string
  stationCode: string         // Standard sensor code, e.g. "TH01"
  wardNumber: string          // e.g. "Ward 01"
  name: string                // e.g. "Kopri"
  zoneClassification: string   // e.g. "Zone 1 · Thane East"
  keyLandmark: string         // e.g. "Kopri Creek & Salt Pans"
  description: string

  // Geospatial & Terrain Fabric
  geospatial: {
    lat: number
    lon: number
    formattedLat: string      // e.g. "19.17°N"
    coordinates: string       // e.g. "19.1726°N, 72.9734°E"
    terrainType: string       // e.g. "Coastal Creek Belt"
    populationDensity: string
  }

  // Real-time Thermal Telemetry (Calculated via existing physics/meteo logic)
  telemetry: {
    lst: number               // Land Surface Temperature in °C
    lstOffset: number         // Microclimate offset
    status: 'Critical' | 'Watch' | 'Safe'
    vulnerability: 'High' | 'Moderate' | 'Low'
  }

  // Interaction State
  isSelected: boolean
  rawLocation: ThaneLocation
}

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

  // Transform raw locations & weather streams into strongly-typed telemetry station nodes
  // without altering underlying calculation logic
  const stationNodes: TelemetryStationNode[] = useMemo(() => {
    return locations.map((loc) => {
      const isSelected = loc.id === selectedLocation.id
      const zoneObj = weather.zonesList?.find((z) => z.id === loc.id)
      const lstValue = zoneObj
        ? zoneObj.lst
        : Number((weather.surfaceTemp + (loc.lstOffset - selectedLocation.lstOffset)).toFixed(1))

      const status: 'Critical' | 'Watch' | 'Safe' = zoneObj
        ? zoneObj.status
        : lstValue >= 42
        ? 'Critical'
        : lstValue >= 40
        ? 'Watch'
        : 'Safe'

      const stationCode = LOCATION_ID_MAP[loc.id] || loc.zoneNumber.replace('Ward ', 'TH')

      return {
        id: loc.id,
        stationCode,
        wardNumber: loc.zoneNumber,
        name: loc.name,
        zoneClassification: loc.ward,
        keyLandmark: loc.keyLandmark,
        description: loc.description,
        geospatial: {
          lat: loc.lat,
          lon: loc.lon,
          formattedLat: `${loc.lat.toFixed(2)}°N`,
          coordinates: `${loc.lat.toFixed(4)}°N, ${loc.lon.toFixed(4)}°E`,
          terrainType: loc.type,
          populationDensity: loc.populationDensity,
        },
        telemetry: {
          lst: lstValue,
          lstOffset: loc.lstOffset,
          status,
          vulnerability: loc.vulnerability,
        },
        isSelected,
        rawLocation: loc,
      }
    })
  }, [locations, selectedLocation, weather])

  // Count summaries derived from structured telemetry data
  const totalCount = stationNodes.length
  const highCount = stationNodes.filter((n) => n.telemetry.vulnerability === 'High').length
  const modCount = stationNodes.filter((n) => n.telemetry.vulnerability === 'Moderate').length
  const lowCount = stationNodes.filter((n) => n.telemetry.vulnerability === 'Low').length

  // Filter stations based on query & vulnerability level
  const filteredNodes = useMemo(() => {
    return stationNodes.filter((node) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        node.name.toLowerCase().includes(q) ||
        node.zoneClassification.toLowerCase().includes(q) ||
        node.geospatial.terrainType.toLowerCase().includes(q) ||
        node.wardNumber.toLowerCase().includes(q) ||
        node.stationCode.toLowerCase().includes(q) ||
        node.keyLandmark.toLowerCase().includes(q)

      const matchesFilter =
        filterType === 'all' ||
        node.telemetry.vulnerability.toLowerCase() === filterType.toLowerCase()

      return matchesSearch && matchesFilter
    })
  }, [stationNodes, searchQuery, filterType])

  return (
    <div className="bg-white rounded-[12px] p-5 shadow-sm border border-[#E8E2D8] mb-6 transition-all">
      {/* Header & Search / Filter Controls */}
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

      {/* 18 Structured Ward Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-7 gap-3">
        {filteredNodes.map((node) => {
          const { isSelected, telemetry, geospatial } = node

          // Real-time telemetry status styling (Critical: red, Watch: amber, Safe: green)
          const statusDotBg =
            telemetry.status === 'Critical'
              ? 'bg-[#DC2626]'
              : telemetry.status === 'Watch'
              ? 'bg-[#EA580C]'
              : 'bg-[#16A34A]'

          const badgeBg =
            telemetry.vulnerability === 'High'
              ? 'bg-[#DC2626] text-white'
              : telemetry.vulnerability === 'Moderate'
              ? 'bg-[#EA580C] text-white'
              : 'bg-[#16A34A] text-white'

          const lstColor =
            telemetry.lst >= 42
              ? 'text-[#DC2626]'
              : telemetry.lst >= 40
              ? 'text-[#EA580C]'
              : 'text-[#16A34A]'

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectLocation(node.rawLocation)}
              className={`relative flex flex-col justify-between text-left p-3 min-h-[96px] rounded-[10px] transition-all border ${
                isSelected
                  ? 'border-[#EA580C] bg-[#FFFBF7] ring-2 ring-[#EA580C]/25 shadow-md -translate-y-0.5'
                  : 'border-[#EBE6DC] bg-[#FAF8F5] hover:bg-white hover:border-[#D8D2C6] hover:shadow-sm hover:-translate-y-0.5'
              }`}
            >
              {/* TOP ROW: Ward No & Live Telemetry Pulse + Risk Badge */}
              <div className="flex items-center justify-between w-full gap-1 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusDotBg}`}
                    />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${statusDotBg}`} />
                  </span>
                  <span className="text-[10px] font-semibold text-[#6B7280] tracking-wide uppercase truncate">
                    {node.wardNumber}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${badgeBg}`}
                >
                  {telemetry.vulnerability}
                </span>
              </div>

              {/* MIDDLE: Ward Name */}
              <div className="text-sm font-bold text-[#1A1A1A] truncate w-full mb-1" title={node.name}>
                {node.name}
              </div>

              {/* BOTTOM ROW: LST Value + Formatted Geo-Coordinates */}
              <div className="flex items-center justify-between w-full pt-1 border-t border-[#EAE5DC]/60 text-[11px]">
                <strong className={`font-bold font-mono ${lstColor}`}>
                  {telemetry.lst}°C LST
                </strong>
                <span className="text-[10px] text-[#9CA3AF] font-mono">
                  {geospatial.formattedLat}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

