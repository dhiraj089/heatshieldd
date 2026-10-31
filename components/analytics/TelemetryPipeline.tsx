'use client'

import React from 'react'
import { RefreshCw, Radio, CheckCircle2 } from 'lucide-react'
import type { ThaneLocation } from '@/app/page'
import type { LiveWeatherData } from '@/app/page'

interface TelemetryPipelineProps {
  location: ThaneLocation
  weather: LiveWeatherData
  flowStep: 'routing' | 'geo-lock' | 'satellite' | 'calibrated' | 'synced'
  latencyMs: number
  timeShort: string
  onRefresh: () => void
}

export default function TelemetryPipeline({
  location,
  weather,
  flowStep,
  latencyMs,
  timeShort,
  onRefresh,
}: TelemetryPipelineProps) {
  const steps = [
    {
      id: 'step-1',
      num: '01',
      title: 'Target Node Routing',
      detail: `${location.zoneNumber} · ${location.name}`,
      status: 'active',
      badge: 'CONNECTED',
    },
    {
      id: 'step-2',
      num: '02',
      title: 'Geo-Coordinates Locked',
      detail: `${location.lat.toFixed(4)}°N, ${location.lon.toFixed(4)}°E`,
      status: flowStep === 'routing' ? 'pending' : 'active',
      badge: 'CALIBRATED',
    },
    {
      id: 'step-3',
      num: '03',
      title: 'Satellite & Sensor Stream',
      detail: `${weather.temp.toFixed(1)}°C · ${weather.humidity}% RH · ${weather.windSpeed} km/h`,
      status: flowStep === 'routing' || flowStep === 'geo-lock' ? 'pending' : 'active',
      badge: weather.isLoading ? 'INGESTING' : 'STREAMING',
    },
    {
      id: 'step-4',
      num: '04',
      title: 'Urban Microclimate Engine',
      detail: `LST Offset ${location.lstOffset >= 0 ? `+${location.lstOffset}` : location.lstOffset}°C · ${location.type}`,
      status: flowStep === 'routing' || flowStep === 'geo-lock' || flowStep === 'satellite' ? 'pending' : 'active',
      badge: 'APPLIED',
    },
    {
      id: 'step-5',
      num: '05',
      title: 'Dashboards Real-Time Sync',
      detail: `6 KPI + 4 Predictive Panels · Ping: ${latencyMs}ms`,
      status: flowStep === 'synced' ? 'synced' : 'active',
      badge: 'OPERATIONAL',
    },
  ]

  return (
    <div className="bg-[#121324] text-white rounded-[12px] p-6 shadow-md border border-[#232642] mb-6 transition-all">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#232642] mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1D36] border border-[#2D335A] text-[11px] font-bold tracking-wider text-[#38BDF8] uppercase mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38BDF8]" />
            </span>
            REAL-TIME TELEMETRY WORKING FLOW
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            Active Telemetry Ingestion Pipeline: {location.name}
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Continuous live environmental telemetry stream mapped to {location.name} ({location.ward}) with automated microclimate calibrations.
          </p>
        </div>

        {/* Telemetry Stream Metadata & Resync */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#181B33] border border-[#292E52] px-3 py-1.5 rounded-lg text-[11px]">
            <span className="block text-[#64748B] text-[9px] font-bold uppercase tracking-wider">
              STREAM STATUS
            </span>
            <strong className="text-[#4ADE80] font-semibold flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              {weather.isLoading ? 'INGESTING PACKETS' : 'ACTIVE TELEMETRY STREAM'}
            </strong>
          </div>

          <div className="bg-[#181B33] border border-[#292E52] px-3 py-1.5 rounded-lg text-[11px]">
            <span className="block text-[#64748B] text-[9px] font-bold uppercase tracking-wider">
              LATENCY
            </span>
            <strong className="text-white font-mono font-semibold mt-0.5 block">
              {latencyMs} ms
            </strong>
          </div>

          <div className="bg-[#181B33] border border-[#292E52] px-3 py-1.5 rounded-lg text-[11px]">
            <span className="block text-[#64748B] text-[9px] font-bold uppercase tracking-wider">
              PACKET SYNC
            </span>
            <strong className="text-white font-semibold mt-0.5 block" suppressHydrationWarning>
              {timeShort} IST
            </strong>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 bg-[#D5360C] hover:bg-[#B82D09] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Force immediate telemetry resync"
          >
            <RefreshCw size={13} className={weather.isLoading ? 'animate-spin' : ''} />
            <span>Resync Node</span>
          </button>
        </div>
      </div>

      {/* 5 Horizontal Pipeline Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative">
        {steps.map((step) => {
          const isPending = step.status === 'pending'
          return (
            <div
              key={step.id}
              className={`relative flex flex-col justify-between p-4 rounded-[10px] border transition-all ${
                isPending
                  ? 'bg-[#16182E]/50 border-[#222646] opacity-60'
                  : 'bg-[#181B33] border-[#2A2F57] hover:border-[#3E467D] shadow-sm'
              }`}
            >
              {/* Step Header */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="font-mono text-sm font-extrabold text-[#D5360C]">
                  {step.num}
                </span>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  step.badge === 'OPERATIONAL' || step.badge === 'CONNECTED'
                    ? 'bg-[#065F46] text-[#6EE7B7]'
                    : step.badge === 'STREAMING' || step.badge === 'CALIBRATED'
                    ? 'bg-[#0369A1] text-[#7DD3FC]'
                    : 'bg-[#854D0E] text-[#FDE047]'
                }`}>
                  {step.badge}
                </span>
              </div>

              {/* Step Title & Detail */}
              <div>
                <h5 className="text-xs font-bold text-white mb-1 tracking-tight">
                  {step.title}
                </h5>
                <p className="text-[11px] text-[#94A3B8] leading-tight font-mono">
                  {step.detail}
                </p>
              </div>

              {/* Active Step Indicator Bottom Border */}
              <div className="mt-3 pt-2 border-t border-[#232747] flex items-center justify-between">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold">
                  {isPending ? 'Queued' : 'Live Pipe'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D5360C]" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
