'use client'

import React from 'react'
import { MapPin, Layers, Users, Compass } from 'lucide-react'
import type { ThaneLocation } from '@/app/page'

interface SelectedWardBarProps {
  selectedLocation: ThaneLocation
}

export default function SelectedWardBar({ selectedLocation }: SelectedWardBarProps) {
  const vulnBg =
    selectedLocation.vulnerability === 'High'
      ? 'bg-[#D5360C] text-white'
      : selectedLocation.vulnerability === 'Moderate'
      ? 'bg-[#D5360C] text-white'
      : 'bg-[#16A34A] text-white'

  return (
    <div className="bg-[var(--color-surface)] rounded-[12px] p-5 shadow-sm border border-[rgba(16,16,16,0.15)] mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all">
      {/* Left section: Name, Ward, Risk, Description */}
      <div className="flex items-start gap-3.5 max-w-3xl">
        <div className="w-11 h-11 rounded-[10px] bg-[var(--color-bg-soft)] border border-[rgba(16,16,16,0.15)] flex items-center justify-center shrink-0 mt-0.5">
          <MapPin size={22} className="text-[#D5360C]" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h4 className="text-xl font-extrabold text-[#101010] tracking-tight">
              {selectedLocation.name}
            </h4>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F0E8] text-[rgba(16,16,16,0.65)] border border-[#E5E0D8]">
              {selectedLocation.ward}
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${vulnBg}`}>
              {selectedLocation.vulnerability} Heat Vulnerability
            </span>
          </div>
          <p className="text-xs text-[rgba(16,16,16,0.65)] leading-relaxed">
            {selectedLocation.description}{' '}
            <span className="font-semibold text-[#101010]">
              Key Landmark: {selectedLocation.keyLandmark}
            </span>
          </p>
        </div>
      </div>

      {/* Right section: Coordinates, Terrain, Density */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 lg:gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-[rgba(16,16,16,0.15)] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F5F0E8] flex items-center justify-center text-[rgba(16,16,16,0.65)]">
            <Compass size={16} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-[rgba(16,16,16,0.65)] tracking-wider">
              Coordinates
            </span>
            <strong className="text-xs font-mono font-semibold text-[#101010]">
              {selectedLocation.lat.toFixed(4)}° N, {selectedLocation.lon.toFixed(4)}° E
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F5F0E8] flex items-center justify-center text-[rgba(16,16,16,0.65)]">
            <Layers size={16} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-[rgba(16,16,16,0.65)] tracking-wider">
              Terrain / Fabric
            </span>
            <strong className="text-xs font-semibold text-[#101010]">
              {selectedLocation.type}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F5F0E8] flex items-center justify-center text-[rgba(16,16,16,0.65)]">
            <Users size={16} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-[rgba(16,16,16,0.65)] tracking-wider">
              Population Density
            </span>
            <strong className="text-xs font-semibold text-[#101010]">
              {selectedLocation.populationDensity}
            </strong>
          </div>
        </div>
      </div>
    </div>
  )
}
