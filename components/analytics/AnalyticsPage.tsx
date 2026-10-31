'use client'

import React from 'react'
import { RefreshCw, Radio } from 'lucide-react'
import type { ThaneLocation } from '@/app/page'
import type { LiveWeatherData } from '@/app/page'
import WardCardGrid from './WardCardGrid'
import SelectedWardBar from './SelectedWardBar'
import KPIMetricRow from './KPIMetricRow'
import TemperatureChart from './TemperatureChart'
import HeatHealthGauge from './HeatHealthGauge'
import AQIChart from './AQIChart'
import RainfallWindCard from './RainfallWindCard'
import ForecastTimeline from './ForecastTimeline'
import SafeOutdoorClock from './SafeOutdoorClock'
import WardComparisonTable from './WardComparisonTable'
import { THANE_LOCATIONS } from '@/app/page'

interface AnalyticsPageProps {
  time: {
    formatted: string
    timeShort: string
    hour: number
    clockAngle: number
  }
  weather: LiveWeatherData & { refresh: () => void }
  selectedLocation: ThaneLocation
  onSelectLocation: (loc: ThaneLocation) => void
}

export default function AnalyticsPage({
  time,
  weather,
  selectedLocation,
  onSelectLocation,
}: AnalyticsPageProps) {
  return (
    <div className="w-full flex flex-col space-y-6">
      {/* ═══════════════════════════════════════════════════════════════
          1. PAGE HEADER SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-[var(--color-surface)] rounded-[12px] p-6 shadow-sm border border-[rgba(16,16,16,0.15)] flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all">
        <div>
          {/* Breadcrumb & Date */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[rgba(16,16,16,0.65)] mb-1.5 font-medium">
            <span>Eco Portal</span>
            <span>/</span>
            <span>Analytics</span>
            <span>/</span>
            <strong className="text-[#D5360C] font-semibold">{selectedLocation.name}</strong>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline font-mono text-[rgba(16,16,16,0.65)]" suppressHydrationWarning>
              {time.formatted}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-[#101010] tracking-tight">
            {selectedLocation.name} Telemetry<span className="text-[#D5360C]">.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[rgba(16,16,16,0.65)] mt-1 max-w-3xl leading-relaxed">
            Real-time microclimate intelligence for {selectedLocation.name} ({selectedLocation.ward}) · Live Open-Meteo & Air Quality streams.
          </p>
        </div>

        {/* Live Sync Action */}
        <div className="shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={weather.refresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-soft)] hover:bg-[rgba(213,54,12,0.15)] border border-[rgba(16,16,16,0.15)] text-xs font-bold text-[#D5360C] shadow-xs transition-all active:scale-95"
            title="Refresh live telemetry streams for selected ward"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]" />
            </span>
            <RefreshCw size={14} className={weather.isLoading ? 'animate-spin' : ''} />
            <span>{weather.isLoading ? 'Syncing...' : 'Live Sync (IST)'}</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. THANE CITY MONITORING NETWORK (18 LOCATIONS)
          ═══════════════════════════════════════════════════════════════ */}
      <WardCardGrid
        locations={THANE_LOCATIONS}
        selectedLocation={selectedLocation}
        onSelectLocation={onSelectLocation}
        weather={weather}
      />

      {/* ═══════════════════════════════════════════════════════════════
          3. SELECTED WARD INFO BAR
          ═══════════════════════════════════════════════════════════════ */}
      <SelectedWardBar selectedLocation={selectedLocation} />

      {/* ═══════════════════════════════════════════════════════════════
          5. SIX KPI METRIC CARDS ROW
          ═══════════════════════════════════════════════════════════════ */}
      <KPIMetricRow location={selectedLocation} weather={weather} />

      {/* ═══════════════════════════════════════════════════════════════
          6. CHARTS ROW 1: TEMPERATURE OVERVIEW + HEAT HEALTH INDEX
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <TemperatureChart location={selectedLocation} weather={weather} />
        </div>
        <div className="lg:col-span-5">
          <HeatHealthGauge location={selectedLocation} weather={weather} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          7. CHARTS ROW 2: AIR QUALITY INDEX + RAINFALL & WIND
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <AQIChart location={selectedLocation} weather={weather} />
        </div>
        <div className="lg:col-span-5">
          <RainfallWindCard location={selectedLocation} weather={weather} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          8. FORECAST + SAFE HOURS ROW
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ForecastTimeline
            location={selectedLocation}
            weather={weather}
            onRefresh={weather.refresh}
          />
        </div>
        <div className="lg:col-span-5">
          <SafeOutdoorClock location={selectedLocation} time={time} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          9. THANE WARDS HEAT COMPARISON MATRIX TABLE
          ═══════════════════════════════════════════════════════════════ */}
      <WardComparisonTable
        selectedLocation={selectedLocation}
        onSelectLocation={onSelectLocation}
        weather={weather}
      />
    </div>
  )
}
