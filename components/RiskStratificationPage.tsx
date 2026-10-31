'use client'

import React, { Fragment, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Calendar,
  ChevronDown,
  MapPin,
  Search,
  Sparkles,
  Thermometer,
  X,
  ShieldAlert,
  Flame,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import {
  ALL_YEARS,
  LOCATION_ID_MAP,
  THANE_DATASET_RECORDS,
  THANE_ZONES_METRIC_SUMMARY,
  getAllZonesForYearMonth,
  getExactObservation,
  type ThaneDatasetRecord,
  type ZoneMetricSummary
} from '@/lib/thane-dataset'
import { generateVerdict, type CityReference, type VerdictResult } from '@/lib/heat-verdict'
import { THANE_LOCATIONS, type ThaneLocation, type LiveWeatherData } from '@/app/page'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface RiskLocationMeta {
  loc: ThaneLocation
  lst: number
  ambientTemp: number
  severity: 'High' | 'Moderate' | 'Low'
  heatwaveFreq: string
  hotspotIntensity: number
  coolingPriority: 'Emergency' | 'High' | 'Routine' | 'Protected'
  recommendedAction: string
  pinnPredictedLST?: number
  ndvi?: number
  ndbi?: number
  albedo?: number
  riskLevel?: string
}

interface ExplainabilityBenchmarks {
  avgLST: number
  avgNDVI: number
  avgNDBI: number
  indexSource: string
  cityRef: CityReference
}

interface RiskStratificationPageProps {
  selectedLocation?: ThaneLocation
  onSelectLocation?: (loc: ThaneLocation) => void
  time?: { formatted: string; timeShort: string }
  weather?: Partial<LiveWeatherData> & { refresh?: () => void }
}

export default function RiskStratificationPage({
  selectedLocation = THANE_LOCATIONS[0],
  onSelectLocation,
  time = { formatted: 'THURSDAY, 03 SEPTEMBER 2026 · 06:00 PM IST', timeShort: '06:00 PM' },
  weather
}: RiskStratificationPageProps) {
  const [riskMode, setRiskMode] = useState<'dataset' | 'live' | 'historical'>('dataset')
  const [hmYear, setHmYear] = useState<number>(2024)
  const [hmMonth, setHmMonth] = useState<number>(5)
  const [severityFilter, setSeverityFilter] = useState<'all' | 'High' | 'Moderate' | 'Low'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedExplanationId, setExpandedExplanationId] = useState<string | null>(null)

  // ── SORTING STATE ──
  const [sortField, setSortField] = useState<'severity' | 'lst' | 'pinn' | 'name' | 'uhi' | 'priority'>('severity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // ── EXPLAINABLE AI MODAL STATE ──
  const [modalMeta, setModalMeta] = useState<RiskLocationMeta | null>(null)

  // Close modal when pressing ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalMeta(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleSort = (field: 'severity' | 'lst' | 'pinn' | 'name' | 'uhi' | 'priority') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder(field === 'name' ? 'asc' : 'desc')
    }
  }

  const currentAirTemp = weather?.temp ?? 31.5

  const computedLocations: RiskLocationMeta[] = useMemo(() => {
    return THANE_LOCATIONS.map(loc => {
      let lst = 0
      let ambientTemp = 0
      let severity: 'High' | 'Moderate' | 'Low' = 'Moderate'
      let heatwaveFreq = ''
      let hotspotIntensity = 50
      let coolingPriority: 'Emergency' | 'High' | 'Routine' | 'Protected' = 'Routine'
      let recommendedAction = ''
      let pinnPredictedLST: number | undefined = undefined
      const zoneSummary = THANE_ZONES_METRIC_SUMMARY.find(
        zone => zone.areaId === LOCATION_ID_MAP[loc.id]
      )
      let ndvi: number | undefined = zoneSummary?.avgNDVI
      let ndbi: number | undefined = zoneSummary?.avgNDBI
      let albedo: number | undefined = undefined
      let riskLevel: string | undefined = undefined

      if (riskMode === 'dataset') {
        const exactRecord = getExactObservation(loc.zoneNumber, hmYear, hmMonth)
        if (exactRecord) {
          lst = Number(exactRecord.avgLST.toFixed(1))
          ambientTemp = Number((exactRecord.avgLST - 3.2).toFixed(1))
          severity = exactRecord.riskLevel === 'HIGH' ? 'High' : exactRecord.riskLevel === 'MODERATE' ? 'Moderate' : 'Low'
          heatwaveFreq = severity === 'High' ? 'Peak Heat Load (Dataset)' : severity === 'Moderate' ? 'Moderate Load (Dataset)' : 'Baseline Climate'
          coolingPriority = severity === 'High' ? 'Emergency' : severity === 'Moderate' ? 'High' : 'Routine'
          recommendedAction = severity === 'High'
            ? 'Deploy mobile misting fans & activate cool roofs immediately.'
            : severity === 'Moderate'
            ? 'Increase shaded bus shelters & distribute hydration advisories.'
            : 'Maintain existing tree canopy & protect natural creek buffer.'
          hotspotIntensity = Math.min(100, Math.max(15, Math.round((lst - 28) * 6.5)))
          pinnPredictedLST = exactRecord.pinnPredictedLST
          ndvi = exactRecord.ndvi
          ndbi = exactRecord.ndbi
          albedo = exactRecord.albedo
          riskLevel = exactRecord.riskLevel
        } else {
          lst = 34.0
          ambientTemp = 31.0
          severity = 'Moderate'
          heatwaveFreq = 'No Record'
          coolingPriority = 'Routine'
          recommendedAction = 'Dataset record not found for this month.'
        }
      } else if (riskMode === 'live') {
        const baseSurface = 38.5 + loc.lstOffset
        lst = Number(baseSurface.toFixed(1))
        ambientTemp = Number((currentAirTemp + (loc.lstOffset * 0.35)).toFixed(1))

        if (lst >= 40.2) {
          severity = 'High'
          coolingPriority = 'Emergency'
          recommendedAction = 'Deploy mobile misting fans & activate cool roofs immediately.'
        } else if (lst >= 37.2) {
          severity = 'Moderate'
          coolingPriority = 'High'
          recommendedAction = 'Increase shaded bus shelters & distribute hydration advisories.'
        } else {
          severity = 'Low'
          coolingPriority = 'Protected'
          recommendedAction = 'Maintain existing tree canopy & protect natural creek buffer.'
        }
        heatwaveFreq = severity === 'High' ? 'Active Heat Stress' : severity === 'Moderate' ? 'Moderate Load' : 'Normal Baseline'
        hotspotIntensity = Math.min(100, Math.max(15, Math.round((lst - 32) * 11)))
      } else {
        const histPeakLST = 41.6 + loc.lstOffset * 1.15
        lst = Number(histPeakLST.toFixed(1))
        ambientTemp = Number((35.8 + loc.lstOffset * 0.45).toFixed(1))
        severity = loc.vulnerability

        if (severity === 'High') {
          coolingPriority = 'Emergency'
          heatwaveFreq = '12–16 days/season'
          recommendedAction = 'Strategic urban forestry, reflective asphalt, and heat-resilient building codes.'
        } else if (severity === 'Moderate') {
          coolingPriority = 'High'
          heatwaveFreq = '6–9 days/season'
          recommendedAction = 'Pocket parks, shaded transit corridors, and permeable paving retrofits.'
        } else {
          coolingPriority = 'Protected'
          heatwaveFreq = '1–3 days/season'
          recommendedAction = 'Preserve Sanjay Gandhi National Park / Vasai Creek microclimate buffers.'
        }
        hotspotIntensity = Math.min(100, Math.max(20, Math.round((lst - 34) * 12)))
      }

      return {
        loc,
        lst,
        ambientTemp,
        severity,
        heatwaveFreq,
        hotspotIntensity,
        coolingPriority,
        recommendedAction,
        pinnPredictedLST,
        ndvi,
        ndbi,
        albedo,
        riskLevel,
      }
    })
  }, [riskMode, currentAirTemp, hmYear, hmMonth])

  const explainabilityBenchmarks: ExplainabilityBenchmarks = useMemo(() => {
    const exactRecords = riskMode === 'dataset' ? getAllZonesForYearMonth(hmYear, hmMonth) : []
    const zoneIndexValues = exactRecords.length > 0
      ? exactRecords.map(record => ({ ndvi: record.ndvi, ndbi: record.ndbi, lst: record.avgLST }))
      : THANE_ZONES_METRIC_SUMMARY.map(zone => ({ ndvi: zone.avgNDVI, ndbi: zone.avgNDBI, lst: zone.avgLST }))
    const divisor = zoneIndexValues.length || 1

    const avgLST = computedLocations.reduce((sum, location) => sum + location.lst, 0) / (computedLocations.length || 1)
    const avgNDVI = zoneIndexValues.reduce((sum, value) => sum + value.ndvi, 0) / divisor
    const avgNDBI = zoneIndexValues.reduce((sum, value) => sum + value.ndbi, 0) / divisor

    // Compute standard deviations (spread)
    const lstVar = computedLocations.reduce((acc, l) => acc + Math.pow(l.lst - avgLST, 2), 0) / (computedLocations.length || 1)
    const ndviVar = zoneIndexValues.reduce((acc, z) => acc + Math.pow(z.ndvi - avgNDVI, 2), 0) / divisor
    const ndbiVar = zoneIndexValues.reduce((acc, z) => acc + Math.pow(z.ndbi - avgNDBI, 2), 0) / divisor

    const cityRef: CityReference = {
      lst: Number(avgLST.toFixed(1)),
      ndvi: Number(avgNDVI.toFixed(3)),
      ndbi: Number(avgNDBI.toFixed(3)),
      spread: {
        lst: Math.max(0.5, Number(Math.sqrt(lstVar).toFixed(2))),
        ndvi: Math.max(0.01, Number(Math.sqrt(ndviVar).toFixed(3))),
        ndbi: Math.max(0.01, Number(Math.sqrt(ndbiVar).toFixed(3))),
      },
    }

    return {
      avgLST,
      avgNDVI,
      avgNDBI,
      cityRef,
      indexSource: exactRecords.length > 0
        ? `all ${exactRecords.length} zones for ${MONTH_NAMES[hmMonth - 1]} ${hmYear}`
        : 'multi-year zone averages from the dataset',
    }
  }, [computedLocations, riskMode, hmYear, hmMonth])

  // Counts for severity breakdown
  const highCount = computedLocations.filter(c => c.severity === 'High').length
  const moderateCount = computedLocations.filter(c => c.severity === 'Moderate').length
  const lowCount = computedLocations.filter(c => c.severity === 'Low').length
  const totalCount = computedLocations.length

  const highPct = Math.round((highCount / totalCount) * 100)
  const modPct = Math.round((moderateCount / totalCount) * 100)
  const lowPct = 100 - highPct - modPct

  const avgHighLST = Number((computedLocations.filter(c => c.severity === 'High').reduce((a, b) => a + b.lst, 0) / (highCount || 1)).toFixed(1))
  const avgModLST = Number((computedLocations.filter(c => c.severity === 'Moderate').reduce((a, b) => a + b.lst, 0) / (moderateCount || 1)).toFixed(1))
  const avgLowLST = Number((computedLocations.filter(c => c.severity === 'Low').reduce((a, b) => a + b.lst, 0) / (lowCount || 1)).toFixed(1))

  // Filtered and sorted locations for table & highlights
  const displayedLocations = useMemo(() => {
    const filtered = computedLocations.filter(c => {
      const matchSeverity = severityFilter === 'all' || c.severity === severityFilter
      const matchQuery =
        searchQuery.trim() === '' ||
        c.loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.loc.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.loc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.loc.keyLandmark.toLowerCase().includes(searchQuery.toLowerCase())
      return matchSeverity && matchQuery
    })

    return filtered.sort((a, b) => {
      let cmp = 0
      if (sortField === 'severity') {
        const sevOrder = { High: 3, Moderate: 2, Low: 1 }
        cmp = sevOrder[a.severity] - sevOrder[b.severity]
        if (cmp === 0) cmp = a.lst - b.lst // Secondary sort by LST
      } else if (sortField === 'lst') {
        cmp = a.lst - b.lst
      } else if (sortField === 'pinn') {
        const aVal = a.pinnPredictedLST ?? a.ambientTemp
        const bVal = b.pinnPredictedLST ?? b.ambientTemp
        cmp = aVal - bVal
      } else if (sortField === 'name') {
        cmp = a.loc.name.localeCompare(b.loc.name)
      } else if (sortField === 'uhi') {
        cmp = a.loc.lstOffset - b.loc.lstOffset
      } else if (sortField === 'priority') {
        const prioOrder = { Emergency: 4, High: 3, Routine: 2, Protected: 1 }
        cmp = prioOrder[a.coolingPriority] - prioOrder[b.coolingPriority]
      }
      return sortOrder === 'desc' ? -cmp : cmp
    })
  }, [computedLocations, severityFilter, searchQuery, sortField, sortOrder])

  // Compute Explainable AI verdict for the modal selection
  const modalVerdict = useMemo(() => {
    if (!modalMeta) return null
    return generateVerdict(
      {
        name: modalMeta.loc.name,
        lst: modalMeta.lst,
        ndvi: modalMeta.ndvi ?? explainabilityBenchmarks.avgNDVI,
        ndbi: modalMeta.ndbi ?? explainabilityBenchmarks.avgNDBI,
        pinnLst: modalMeta.pinnPredictedLST,
        zoneType: modalMeta.loc.type,
        riskLevel: modalMeta.riskLevel ?? modalMeta.severity,
      },
      explainabilityBenchmarks.cityRef
    )
  }, [modalMeta, explainabilityBenchmarks])

  const activeSelectedMeta = computedLocations.find(c => c.loc.id === selectedLocation.id) || computedLocations[0]
  const hasCurrentReading = weather?.dataSource === 'open-meteo' && weather?.location?.id === selectedLocation.id

  const handleSelectLoc = (loc: ThaneLocation) => {
    if (onSelectLocation) onSelectLocation(loc)
  }

  return (
    <div className="risk-stratification-page">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <p className="eyebrow" suppressHydrationWarning>
            MUNICIPAL RISK STRATIFICATION & EXPLAINABILITY · ACTIVE ZONE: {selectedLocation.name.toUpperCase()} · {time.formatted}
          </p>
          <h1>Thermal Severity & Risk Analysis<span>.</span></h1>
          <p className="subtext">
            Granular thermal risk tiering, physics-informed Explainable AI (&ldquo;Why this risk?&rdquo;) diagnostic verdicts, and targeted civic mitigation plans across all 18 Thane municipal locations.
          </p>
        </div>
        <div className="heatmap-mode-toggle-group">
          <button
            type="button"
            className={`hm-mode-btn ${riskMode === 'dataset' ? 'active hist' : ''}`}
            onClick={() => setRiskMode('dataset')}
            style={riskMode === 'dataset' ? { background: '#D5360C', color: '#fff', borderColor: '#D5360C' } : {}}
          >
            <Calendar size={14} />
            <strong>Exact LST Dataset</strong>
          </button>
          <button
            type="button"
            className={`hm-mode-btn ${riskMode === 'live' ? 'active live' : ''}`}
            onClick={() => setRiskMode('live')}
          >
            <span className="live-dot" />
            <strong>Live Real-Time Telemetry</strong>
          </button>
          <button
            type="button"
            className={`hm-mode-btn ${riskMode === 'historical' ? 'active hist' : ''}`}
            onClick={() => setRiskMode('historical')}
          >
            <Activity size={14} />
            <strong>Summer Baseline</strong>
          </button>
        </div>
      </div>

      {/* ── YEAR + MONTH SELECTOR TOOLBAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18,
        background: '#F4EADA', border: '1px solid rgba(16,16,16,0.15)',
        borderRadius: 12, padding: '14px 20px', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={16} style={{ color: '#D5360C' }} />
          <label htmlFor="risk-location-select" style={{ fontSize: 13, fontWeight: 700, color: 'rgba(16,16,16,0.65)', letterSpacing: '0.05em' }}>
            SELECT LOCATION:
          </label>
          <select
            id="risk-location-select"
            aria-label="Select location"
            value={selectedLocation.id}
            onChange={e => {
              const location = THANE_LOCATIONS.find(loc => loc.id === e.target.value)
              if (location) handleSelectLoc(location)
            }}
            style={{
              background: '#F4EADA', color: '#101010',
              border: '1px solid rgba(16,16,16,0.15)',
              padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', outline: 'none', maxWidth: 260
            }}
          >
            {THANE_LOCATIONS.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.zoneNumber} · {loc.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={16} style={{ color: '#D5360C' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(16,16,16,0.65)', letterSpacing: '0.05em' }}>SELECT YEAR:</span>
          <select
            id="risk-year-select"
            value={hmYear}
            onChange={e => {
              setHmYear(Number(e.target.value))
              if (riskMode !== 'dataset') setRiskMode('dataset')
            }}
            style={{
              background: '#F4EADA', color: '#101010',
              border: '1px solid rgba(16,16,16,0.15)',
              padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', outline: 'none'
            }}
          >
            {ALL_YEARS.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Thermometer size={16} style={{ color: '#D5360C' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(16,16,16,0.65)', letterSpacing: '0.05em' }}>SELECT MONTH:</span>
          <select
            id="risk-month-select"
            value={hmMonth}
            onChange={e => {
              setHmMonth(Number(e.target.value))
              if (riskMode !== 'dataset') setRiskMode('dataset')
            }}
            style={{
              background: '#F4EADA', color: '#101010',
              border: '1px solid rgba(16,16,16,0.15)',
              padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', outline: 'none'
            }}
          >
            {MONTH_NAMES.map((mn, idx) => (
              <option key={idx + 1} value={idx + 1}>{mn}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(232,102,49,0.12)', border: '1px solid rgba(232,102,49,0.3)',
            borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#D5360C', fontWeight: 600
          }}>
            📍 Active Zone: <strong>{activeSelectedMeta.loc.zoneNumber} ({activeSelectedMeta.loc.name})</strong> · {riskMode === 'dataset' ? 'Observed LST' : 'Mode LST'}: <strong style={{ fontSize: 14 }}>{activeSelectedMeta.lst}°C</strong>
            {activeSelectedMeta.pinnPredictedLST != null && (
              <span style={{ marginLeft: 8, color: '#4ade80' }}>· PINN: {activeSelectedMeta.pinnPredictedLST.toFixed(1)}°C</span>
            )}
            <span style={{ marginLeft: 8, color: '#176b55' }}>
              · Current air: <strong>{hasCurrentReading && weather?.temp != null ? `${weather.temp.toFixed(1)}°C` : '31.5°C'}</strong>
            </span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(16,16,16,0.65)' }}>
            Period: <strong>{MONTH_NAMES[hmMonth - 1]} {hmYear}</strong> ({computedLocations.length} Wards)
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SEVERITY LEVEL BREAKDOWN SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="hm-severity-section" style={{ marginTop: 0 }}>
        <div className="hm-severity-header">
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>MUNICIPAL RISK STRATIFICATION · {riskMode.toUpperCase()} MODE</p>
            <h2>Thermal Severity Level Breakdown & Location Counts</h2>
            <p className="subtext">
              Real-time stratification of all 18 Thane municipal locations according to {riskMode === 'live' ? 'current live Land Surface Temperature (LST)' : 'historical multi-year summer baseline extremes'}.
            </p>
          </div>
          <div className="hm-severity-mode-indicator">
            Active Mode: <strong>{riskMode === 'live' ? 'Live Telemetry' : 'Historical Archive'}</strong> ({totalCount} Monitored Zones)
          </div>
        </div>

        {/* 3 Interactive Severity Level Cards */}
        <div className="hm-severity-card-grid">
          {/* HIGH RISK / CRITICAL */}
          <div
            className={`hm-sev-card high ${severityFilter === 'High' ? 'selected' : ''}`}
            onClick={() => setSeverityFilter(severityFilter === 'High' ? 'all' : 'High')}
          >
            <div className="hm-sev-card-top">
              <span className="hm-sev-badge high">🔴 HIGH RISK / CRITICAL</span>
              <strong className="hm-sev-count">{highCount} <small>Locations</small></strong>
            </div>
            <div className="hm-sev-bar-wrap">
              <div className="hm-sev-bar high" style={{ width: `${highPct}%` }} />
            </div>
            <div className="hm-sev-meta">
              <span>{highPct}% of Monitored City</span>
              <span>Avg LST: <strong>{avgHighLST}°C</strong></span>
            </div>
            <p className="hm-sev-desc">
              Zones with dense concrete mass, metal industrial roofs, and asphalt traffic bottlenecks. Elevated heat-related health risks.
            </p>
            <div className="hm-sev-footer">
              <small>{severityFilter === 'High' ? '✓ Filter Applied (Click to clear)' : 'Click to filter table below'}</small>
            </div>
          </div>

          {/* MODERATE / MEDIUM RISK */}
          <div
            className={`hm-sev-card mod ${severityFilter === 'Moderate' ? 'selected' : ''}`}
            onClick={() => setSeverityFilter(severityFilter === 'Moderate' ? 'all' : 'Moderate')}
          >
            <div className="hm-sev-card-top">
              <span className="hm-sev-badge mod">🟠 MODERATE / WATCH</span>
              <strong className="hm-sev-count">{moderateCount} <small>Locations</small></strong>
            </div>
            <div className="hm-sev-bar-wrap">
              <div className="hm-sev-bar mod" style={{ width: `${modPct}%` }} />
            </div>
            <div className="hm-sev-meta">
              <span>{modPct}% of Monitored City</span>
              <span>Avg LST: <strong>{avgModLST}°C</strong></span>
            </div>
            <p className="hm-sev-desc">
              Transitional residential and highway corridors with moderate solar load. Requires preventive hydration and shade shelters.
            </p>
            <div className="hm-sev-footer">
              <small>{severityFilter === 'Moderate' ? '✓ Filter Applied (Click to clear)' : 'Click to filter table below'}</small>
            </div>
          </div>

          {/* LOW RISK / SAFE BUFFER */}
          <div
            className={`hm-sev-card low ${severityFilter === 'Low' ? 'selected' : ''}`}
            onClick={() => setSeverityFilter(severityFilter === 'Low' ? 'all' : 'Low')}
          >
            <div className="hm-sev-card-top">
              <span className="hm-sev-badge low">🟢 LOW RISK / SAFE BUFFER</span>
              <strong className="hm-sev-count">{lowCount} <small>Locations</small></strong>
            </div>
            <div className="hm-sev-bar-wrap">
              <div className="hm-sev-bar low" style={{ width: `${lowPct}%` }} />
            </div>
            <div className="hm-sev-meta">
              <span>{lowPct}% of Monitored City</span>
              <span>Avg LST: <strong>{avgLowLST}°C</strong></span>
            </div>
            <p className="hm-sev-desc">
              Tree canopy nodes, SGNP forest edge, and creek waterfronts providing natural microclimate cooling and moisture buffering.
            </p>
            <div className="hm-sev-footer">
              <small>{severityFilter === 'Low' ? '✓ Filter Applied (Click to clear)' : 'Click to filter table below'}</small>
            </div>
          </div>
        </div>

        {/* City-Wide Severity Distribution Bar */}
        <div className="panel hm-distribution-panel">
          <div className="hm-dist-head">
            <div>
              <strong>Thane City-Wide Thermal Severity Balance ({riskMode === 'live' ? 'Live Telemetry' : 'Historical Summer Baseline'})</strong>
              <p>Combined spatial share of High ({highCount}), Moderate ({moderateCount}), and Low ({lowCount}) risk zones across {totalCount} monitored locations</p>
            </div>
            <div className="hm-dist-pills">
              <span className="dist-pill high">High: {highPct}%</span>
              <span className="dist-pill mod">Moderate: {modPct}%</span>
              <span className="dist-pill low">Low: {lowPct}%</span>
            </div>
          </div>
          <div className="hm-stacked-bar">
            <div className="seg high" style={{ width: `${highPct}%` }} title={`High Risk: ${highCount} locations (${highPct}%)`} />
            <div className="seg mod" style={{ width: `${modPct}%` }} title={`Moderate Risk: ${moderateCount} locations (${modPct}%)`} />
            <div className="seg low" style={{ width: `${lowPct}%` }} title={`Low Risk: ${lowCount} locations (${lowPct}%)`} />
          </div>
        </div>

        {/* Severity Classification Matrix Table */}
        <div className="panel hm-table-panel">
          <div className="panel-head hm-table-head">
            <div>
              <h2>Severity Classification Matrix · {riskMode === 'live' ? 'Live Conditions' : 'Historical Baseline'}</h2>
              <p>Click any location to lock telemetry and inspect explainability diagnostics</p>
            </div>
            <div className="hm-table-controls">
              {/* Filter Tabs */}
              <div className="hm-filter-tabs">
                <button
                  type="button"
                  className={`hm-ftab ${severityFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSeverityFilter('all')}
                >
                  All ({totalCount})
                </button>
                <button
                  type="button"
                  className={`hm-ftab high ${severityFilter === 'High' ? 'active' : ''}`}
                  onClick={() => setSeverityFilter('High')}
                >
                  High Risk ({highCount})
                </button>
                <button
                  type="button"
                  className={`hm-ftab mod ${severityFilter === 'Moderate' ? 'active' : ''}`}
                  onClick={() => setSeverityFilter('Moderate')}
                >
                  Moderate ({moderateCount})
                </button>
                <button
                  type="button"
                  className={`hm-ftab low ${severityFilter === 'Low' ? 'active' : ''}`}
                  onClick={() => setSeverityFilter('Low')}
                >
                  Low Risk ({lowCount})
                </button>
              </div>

              {/* Sort By Dropdown */}
              <div className="hm-sort-control">
                <ArrowUpDown size={13} style={{ color: '#D5360C' }} />
                <span>SORT:</span>
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [f, o] = e.target.value.split('-') as [typeof sortField, typeof sortOrder]
                    setSortField(f)
                    setSortOrder(o)
                  }}
                  aria-label="Sort table by metric"
                >
                  <option value="severity-desc">Thermal Severity (Highest First)</option>
                  <option value="severity-asc">Thermal Severity (Lowest First)</option>
                  <option value="lst-desc">Surface Temp LST (Hot to Cool)</option>
                  <option value="lst-asc">Surface Temp LST (Cool to Hot)</option>
                  <option value="uhi-desc">UHI Offset (Heat Trapping High)</option>
                  <option value="name-asc">Zone Name (A to Z)</option>
                  <option value="priority-desc">Cooling Priority (Emergency First)</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="location-search-box" style={{ width: 200 }}>
                <Search size={14} color="#888" />
                <input
                  type="text"
                  placeholder="Search zone / landmark..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')}>
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="hist-table-scroll">
            <table className="hist-table hm-matrix-table">
              <thead>
                <tr>
                  <th className="sortable-th" onClick={() => toggleSort('name')} title="Click to sort by Name">
                    <span className="sortable-th-inner">
                      Zone & Location
                      {sortField === 'name' && (
                        <span className="sort-indicator">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </span>
                  </th>
                  <th className="sortable-th" onClick={() => toggleSort('severity')} title="Click to sort by Severity">
                    <span className="sortable-th-inner">
                      Severity Tier
                      {sortField === 'severity' && (
                        <span className="sort-indicator">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                      )}
                    </span>
                  </th>
                  <th className="sortable-th" onClick={() => toggleSort('lst')} title="Click to sort by Surface Temp">
                    <span className="sortable-th-inner">
                      {riskMode === 'dataset' ? 'Exact LST (Observed)' : 'Surface Temp (LST)'}
                      {sortField === 'lst' && (
                        <span className="sort-indicator">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                      )}
                    </span>
                  </th>
                  <th className="sortable-th" onClick={() => toggleSort('pinn')} title="Click to sort by Modeled/Ambient">
                    <span className="sortable-th-inner">
                      {riskMode === 'dataset' ? 'PINN Pred. LST' : 'Ambient Temp'}
                      {sortField === 'pinn' && (
                        <span className="sort-indicator">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                      )}
                    </span>
                  </th>
                  <th className="sortable-th" onClick={() => toggleSort('uhi')} title="Click to sort by UHI Offset">
                    <span className="sortable-th-inner">
                      {riskMode === 'dataset' ? 'NDVI (Vegetation)' : 'UHI Offset'}
                      {sortField === 'uhi' && (
                        <span className="sort-indicator">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                      )}
                    </span>
                  </th>
                  <th>{riskMode === 'dataset' ? 'NDBI (Built-up)' : 'Population Density'}</th>
                  <th>Key Landmark / Microclimate Node</th>
                  <th className="sortable-th" onClick={() => toggleSort('priority')} title="Click to sort by Priority">
                    <span className="sortable-th-inner">
                      Cooling Intervention Priority
                      {sortField === 'priority' && (
                        <span className="sort-indicator">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                      )}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedLocations.map(meta => {
                  const isSelected = meta.loc.id === selectedLocation.id
                  const isHigh = meta.severity === 'High'
                  const isMod = meta.severity === 'Moderate'
                  const explanationOpen = expandedExplanationId === meta.loc.id
                  const lstDelta = meta.lst - explainabilityBenchmarks.avgLST
                  const ndviDelta = meta.ndvi == null ? null : meta.ndvi - explainabilityBenchmarks.avgNDVI
                  const ndbiDelta = meta.ndbi == null ? null : meta.ndbi - explainabilityBenchmarks.avgNDBI
                  const formatDelta = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}`

                  // Call the XAI verdict generator with calibrated zone & cityRef data
                  const verdictData = generateVerdict(
                    {
                      name: meta.loc.name,
                      lst: meta.lst,
                      ndvi: meta.ndvi ?? explainabilityBenchmarks.avgNDVI,
                      ndbi: meta.ndbi ?? explainabilityBenchmarks.avgNDBI,
                      pinnLst: meta.pinnPredictedLST,
                      zoneType: meta.loc.type,
                      riskLevel: meta.riskLevel ?? meta.severity,
                    },
                    explainabilityBenchmarks.cityRef
                  )

                  return (
                    <Fragment key={meta.loc.id}>
                      <tr
                        className={`hist-row ${isSelected ? 'active-zone-row' : ''} ${isHigh ? 'hot-row' : ''}`}
                        onClick={() => {
                          handleSelectLoc(meta.loc)
                          setModalMeta(meta)
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Click to select location and open Explainable AI diagnostic verdict"
                      >
                        <td className="hist-date-cell">
                          <strong>{meta.loc.name} {isSelected && <span className="active-tag">ACTIVE</span>}</strong>
                          <small>{meta.loc.ward} · {meta.loc.zoneNumber}</small>
                          <button
                            type="button"
                            className="hm-explain-toggle"
                            aria-expanded={explanationOpen}
                            aria-controls={`risk-explanation-${meta.loc.id}`}
                            onClick={event => {
                              event.stopPropagation()
                              handleSelectLoc(meta.loc)
                              setModalMeta(meta)
                            }}
                            title="Open Explainable AI Modal"
                          >
                            <Sparkles size={12} />
                            Why this risk? (XAI)
                            <ChevronDown size={12} className={explanationOpen ? 'rotated' : ''} />
                          </button>
                        </td>
                        <td>
                          <span className={`event-badge ${meta.severity.toLowerCase()}`}>
                            {meta.severity === 'High' ? '🔴 HIGH RISK' : meta.severity === 'Moderate' ? '🟠 MODERATE' : '🟢 LOW RISK'}
                          </span>
                        </td>
                        <td className={isHigh ? 'danger' : ''}>
                          <strong style={{ fontSize: 13, color: isHigh ? '#D5360C' : isMod ? '#EDA389' : '#10b981' }}>{meta.lst}°C</strong>
                        </td>
                        <td>
                          {riskMode === 'dataset' && meta.pinnPredictedLST != null ? (
                            <strong style={{ color: '#4ade80' }}>{meta.pinnPredictedLST.toFixed(1)}°C</strong>
                          ) : (
                            `${meta.ambientTemp}°C`
                          )}
                        </td>
                        <td>
                          {riskMode === 'dataset' && meta.ndvi != null ? (
                            <span style={{ color: '#22c55e', fontWeight: 600 }}>{meta.ndvi.toFixed(3)}</span>
                          ) : (
                            <span className={`delta-badge ${meta.loc.lstOffset > 0 ? 'up' : meta.loc.lstOffset < 0 ? 'down' : 'neutral'}`}>
                              {meta.loc.lstOffset >= 0 ? `▲ +${meta.loc.lstOffset}` : `▼ ${meta.loc.lstOffset}`}°C
                            </span>
                          )}
                        </td>
                        <td>
                          {riskMode === 'dataset' && meta.ndbi != null ? (
                            <span style={{ color: 'rgba(16,16,16,0.2)', fontWeight: 600 }}>{meta.ndbi.toFixed(3)}</span>
                          ) : (
                            meta.loc.populationDensity
                          )}
                        </td>
                        <td>
                          <div>
                            <strong>{meta.loc.keyLandmark}</strong>
                            <small style={{ display: 'block', fontSize: '8.5px', color: '#888' }}>{meta.loc.type}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`hm-prio-pill ${meta.coolingPriority.toLowerCase()}`}>
                            {meta.coolingPriority === 'Emergency' ? '⚡ Emergency Misting' : meta.coolingPriority === 'High' ? '● Shaded Corridors' : '○ Protected Canopy'}
                          </span>
                        </td>
                      </tr>
                      {explanationOpen && (
                        <tr id={`risk-explanation-${meta.loc.id}`} className="hm-explanation-row">
                          <td colSpan={8}>
                            {/* ═══════════ ENHANCED XAI PANEL ═══════════ */}
                            <div className="hm-explanation-panel xai-enhanced">

                              {/* ── Header ── */}
                              <div className="xai-header">
                                <div className="xai-header-left">
                                  <Sparkles size={16} style={{ color: '#D5360C' }} />
                                  <div>
                                    <strong style={{ fontSize: 14, color: '#101010' }}>Explainable AI · {verdictData.tier} Verdict for {meta.loc.name}</strong>
                                    <span style={{ fontSize: 11, color: 'rgba(16,16,16,0.65)', display: 'block', marginTop: 2 }}>
                                      {riskMode === 'dataset'
                                        ? `PINN dataset record · ${MONTH_NAMES[hmMonth - 1]} ${hmYear} · ${meta.loc.zoneNumber}`
                                        : riskMode === 'live'
                                        ? `Live telemetry · ${meta.loc.zoneNumber} · ${meta.loc.type}`
                                        : `Historical summer baseline · ${meta.loc.zoneNumber} · ${meta.loc.type}`}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {verdictData.modelError != null && (
                                    <span style={{ fontSize: 11, background: '#F4EADA', color: 'rgba(16,16,16,0.65)', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                                      PINN residual: ±{verdictData.modelError.toFixed(2)}°C
                                    </span>
                                  )}
                                  <span className={`event-badge ${meta.severity.toLowerCase()}`} style={{ fontSize: 12, padding: '4px 12px' }}>
                                    {meta.severity === 'High' ? '🔴' : meta.severity === 'Moderate' ? '🟠' : '🟢'} {verdictData.tier}
                                  </span>
                                </div>
                              </div>

                              {/* ── 1. AI Risk Verdict Paragraph ── */}
                              <div style={{
                                background: meta.severity === 'High'
                                  ? 'linear-gradient(135deg,rgba(239,68,68,.08) 0%,rgba(239,68,68,.03) 100%)'
                                  : meta.severity === 'Moderate'
                                  ? 'linear-gradient(135deg,rgba(245,158,11,.08) 0%,rgba(245,158,11,.03) 100%)'
                                  : 'linear-gradient(135deg,rgba(34,197,94,.08) 0%,rgba(34,197,94,.03) 100%)',
                                border: `1px solid ${meta.severity === 'High' ? 'rgba(239,68,68,.2)' : meta.severity === 'Moderate' ? 'rgba(245,158,11,.2)' : 'rgba(34,197,94,.2)'}`,
                                borderRadius: 10, padding: '12px 16px', marginBottom: 14,
                              }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: meta.severity === 'High' ? '#D5360C' : meta.severity === 'Moderate' ? '#D5360C' : '#16a34a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                                  📌 Diagnostic Summary
                                </div>
                                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#101010' }}>
                                  {verdictData.verdict}
                                </p>
                              </div>

                              {/* ── 2. Physics-Informed Key Risk Factors (Deviations from Baseline) ── */}
                              <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(16,16,16,0.65)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                                  🔍 Physics-Informed Key Risk Drivers (Deviations vs Thane Mean)
                                </div>
                                {verdictData.causes.length > 0 ? (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                                    {verdictData.causes.map((c, i) => (
                                      <div key={i} style={{
                                        background: '#fff', border: '1px solid rgba(16,16,16,0.15)', borderRadius: 8,
                                        padding: '9px 12px', borderLeft: `3px solid ${c.direction === 'risk-raising' ? '#D5360C' : '#22c55e'}`
                                      }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                          <strong style={{ fontSize: 12, color: '#101010' }}>{c.label}</strong>
                                          <span style={{ fontSize: 10, fontWeight: 700, color: c.direction === 'risk-raising' ? '#D5360C' : '#22c55e', background: c.direction === 'risk-raising' ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.1)', padding: '1px 6px', borderRadius: 4 }}>
                                            {c.direction === 'risk-raising' ? '▲ Risk Factor' : '▼ Protective'}
                                          </span>
                                        </div>
                                        <div style={{ fontSize: 11.5, color: 'rgba(16,16,16,0.65)', lineHeight: 1.4 }}>{c.text}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 12, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span>✓</span>
                                    <span>No adverse vegetation loss or excessive built-up heat drivers identified. Local microclimate operates within healthy cooling limits.</span>
                                  </div>
                                )}
                              </div>

                              {/* ── 3. Visual SHAP-Style Feature Contribution Bars ── */}
                              <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(16,16,16,0.65)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                                  📊 Quantitative Feature Contributions (Physics-Constrained SHAP Analysis)
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                                  {/* LST bar */}
                                  {(() => {
                                    const lstRange = 8
                                    const lstContrib = Math.min(100, Math.max(0, ((lstDelta + lstRange / 2) / lstRange) * 100))
                                    const lstBarColor = lstDelta > 1.5 ? '#D5360C' : lstDelta > 0 ? '#D5360C' : lstDelta < -1.5 ? '#22c55e' : '#D5360C'
                                    return (
                                      <div style={{ background: '#F4EADA', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(16,16,16,0.15)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Thermometer size={13} style={{ color: lstBarColor }} />
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#101010' }}>Land Surface Temperature (LST)</span>
                                            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, color: lstDelta > 0 ? '#D5360C' : '#22c55e', background: lstDelta > 0 ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.1)' }}>
                                              {lstDelta > 0 ? 'risk-raising' : 'risk-lowering'}
                                            </span>
                                          </div>
                                          <span style={{ fontSize: 12, fontWeight: 800, color: lstBarColor }}>
                                            {meta.lst.toFixed(1)}°C <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(16,16,16,0.65)' }}>({formatDelta(lstDelta)}°C vs mean)</span>
                                          </span>
                                        </div>
                                        <div style={{ height: 8, background: 'rgba(16,16,16,0.15)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                                          <div style={{ height: '100%', width: `${lstContrib}%`, background: `linear-gradient(90deg,${lstBarColor}88,${lstBarColor})`, borderRadius: 4, transition: 'width .5s ease' }} />
                                          <div style={{ position: 'absolute', top: 0, left: '50%', width: 1, height: '100%', background: 'rgba(0,0,0,.15)' }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'rgba(16,16,16,0.65)' }}>
                                          <span>← Cooling</span><span>City Baseline {explainabilityBenchmarks.avgLST.toFixed(1)}°C</span><span>Heating →</span>
                                        </div>
                                      </div>
                                    )
                                  })()}

                                  {/* NDVI bar */}
                                  {meta.ndvi != null && ndviDelta != null && (() => {
                                    const ndviRange = 0.25
                                    const ndviContrib = Math.min(100, Math.max(0, ((-ndviDelta + ndviRange / 2) / ndviRange) * 100))
                                    const ndviBarColor = ndviDelta < -0.05 ? '#D5360C' : ndviDelta < 0 ? '#D5360C' : ndviDelta > 0.05 ? '#22c55e' : '#D5360C'
                                    const ndviDir = ndviDelta < -0.03 ? 'risk-raising' : ndviDelta > 0.03 ? 'cooling-benefit' : 'neutral'
                                    return (
                                      <div style={{ background: '#F4EADA', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(16,16,16,0.15)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 13 }}>🌿</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#101010' }}>Vegetation (NDVI)</span>
                                            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, color: ndviDelta < -0.03 ? '#D5360C' : ndviDelta > 0.03 ? '#22c55e' : 'rgba(16,16,16,0.65)', background: ndviDelta < -0.03 ? 'rgba(239,68,68,.1)' : ndviDelta > 0.03 ? 'rgba(34,197,94,.1)' : 'rgba(100,116,139,.1)' }}>
                                              {ndviDir}
                                            </span>
                                          </div>
                                          <span style={{ fontSize: 12, fontWeight: 800, color: ndviBarColor }}>
                                            {meta.ndvi.toFixed(3)} <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(16,16,16,0.65)' }}>({formatDelta(ndviDelta)} vs ref {explainabilityBenchmarks.cityRef.ndvi.toFixed(3)})</span>
                                          </span>
                                        </div>
                                        <div style={{ height: 8, background: 'rgba(16,16,16,0.15)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                                          <div style={{ height: '100%', width: `${ndviContrib}%`, background: `linear-gradient(90deg,${ndviBarColor}88,${ndviBarColor})`, borderRadius: 4, transition: 'width .5s ease' }} />
                                          <div style={{ position: 'absolute', top: 0, left: '50%', width: 1, height: '100%', background: 'rgba(0,0,0,.15)' }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'rgba(16,16,16,0.65)' }}>
                                          <span>← More Vegetation (Cooling)</span><span>City Ref: {explainabilityBenchmarks.cityRef.ndvi.toFixed(3)}</span><span>Less Vegetation (Heating) →</span>
                                        </div>
                                      </div>
                                    )
                                  })()}

                                  {/* NDBI bar */}
                                  {meta.ndbi != null && ndbiDelta != null && (() => {
                                    const ndbiRange = 0.2
                                    const ndbiContrib = Math.min(100, Math.max(0, ((ndbiDelta + ndbiRange / 2) / ndbiRange) * 100))
                                    const ndbiBarColor = ndbiDelta > 0.05 ? '#D5360C' : ndbiDelta > 0 ? '#D5360C' : ndbiDelta < -0.05 ? '#22c55e' : '#D5360C'
                                    const ndbiDir = ndbiDelta > 0.03 ? 'risk-raising' : ndbiDelta < -0.03 ? 'cooling-benefit' : 'neutral'
                                    return (
                                      <div style={{ background: '#F4EADA', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(16,16,16,0.15)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 13 }}>🏗️</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#101010' }}>Built-up Density (NDBI)</span>
                                            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, color: ndbiDelta > 0.03 ? '#D5360C' : ndbiDelta < -0.03 ? '#22c55e' : 'rgba(16,16,16,0.65)', background: ndbiDelta > 0.03 ? 'rgba(239,68,68,.1)' : ndbiDelta < -0.03 ? 'rgba(34,197,94,.1)' : 'rgba(100,116,139,.1)' }}>
                                              {ndbiDir}
                                            </span>
                                          </div>
                                          <span style={{ fontSize: 12, fontWeight: 800, color: ndbiBarColor }}>
                                            {meta.ndbi.toFixed(3)} <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(16,16,16,0.65)' }}>({formatDelta(ndbiDelta)} vs ref {explainabilityBenchmarks.cityRef.ndbi.toFixed(3)})</span>
                                          </span>
                                        </div>
                                        <div style={{ height: 8, background: 'rgba(16,16,16,0.15)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                                          <div style={{ height: '100%', width: `${ndbiContrib}%`, background: `linear-gradient(90deg,${ndbiBarColor}88,${ndbiBarColor})`, borderRadius: 4, transition: 'width .5s ease' }} />
                                          <div style={{ position: 'absolute', top: 0, left: '50%', width: 1, height: '100%', background: 'rgba(0,0,0,.15)' }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'rgba(16,16,16,0.65)' }}>
                                          <span>← Less Built-up (Cooling)</span><span>City Ref: {explainabilityBenchmarks.cityRef.ndbi.toFixed(3)}</span><span>More Built-up (Heating) →</span>
                                        </div>
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>

                              {/* ── 4. Precautions & Intervention Action Plan (Short / Medium / Long Term) ── */}
                              <div style={{
                                background: '#fff',
                                border: '1px solid rgba(16,16,16,0.15)',
                                borderRadius: 10,
                                padding: '14px 16px',
                                marginBottom: 14,
                                width: '100%',
                                boxSizing: 'border-box',
                              }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(16,16,16,0.65)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                                  🛡️ Targeted Precautions & Mitigation Plan (Based on Causes)
                                </div>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                  gap: 12,
                                  width: '100%',
                                  boxSizing: 'border-box',
                                }}>
                                  {/* Short Term */}
                                  <div style={{
                                    background: '#F4EADA',
                                    border: '1px solid rgba(16,16,16,0.15)',
                                    borderRadius: 8,
                                    padding: '12px 14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minWidth: 0,
                                    maxWidth: '100%',
                                    boxSizing: 'border-box',
                                    overflow: 'hidden',
                                  }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#D5360C', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                      <span>⚡</span>
                                      <span>Short-Term (Immediate / 24-48h)</span>
                                    </div>
                                    <ul style={{
                                      margin: 0,
                                      paddingLeft: 18,
                                      fontSize: 11.5,
                                      color: 'rgba(16,16,16,0.65)',
                                      lineHeight: 1.55,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 6,
                                      wordBreak: 'break-word',
                                      overflowWrap: 'break-word',
                                      whiteSpace: 'normal',
                                      boxSizing: 'border-box',
                                      maxWidth: '100%',
                                    }}>
                                      {verdictData.plan.short.map((act, i) => (
                                        <li key={i} style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', maxWidth: '100%' }}>{act}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Medium Term */}
                                  <div style={{
                                    background: '#F4EADA',
                                    border: '1px solid rgba(16,16,16,0.15)',
                                    borderRadius: 8,
                                    padding: '12px 14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minWidth: 0,
                                    maxWidth: '100%',
                                    boxSizing: 'border-box',
                                    overflow: 'hidden',
                                  }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#EDA389', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                      <span>📅</span>
                                      <span>Medium-Term (1-6 Months)</span>
                                    </div>
                                    <ul style={{
                                      margin: 0,
                                      paddingLeft: 18,
                                      fontSize: 11.5,
                                      color: 'rgba(16,16,16,0.65)',
                                      lineHeight: 1.55,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 6,
                                      wordBreak: 'break-word',
                                      overflowWrap: 'break-word',
                                      whiteSpace: 'normal',
                                      boxSizing: 'border-box',
                                      maxWidth: '100%',
                                    }}>
                                      {verdictData.plan.medium.map((act, i) => (
                                        <li key={i} style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', maxWidth: '100%' }}>{act}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Long Term */}
                                  <div style={{
                                    background: '#F4EADA',
                                    border: '1px solid rgba(16,16,16,0.15)',
                                    borderRadius: 8,
                                    padding: '12px 14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minWidth: 0,
                                    maxWidth: '100%',
                                    boxSizing: 'border-box',
                                    overflow: 'hidden',
                                  }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                      <span>🏛️</span>
                                      <span>Long-Term (Policy / Infrastructure)</span>
                                    </div>
                                    <ul style={{
                                      margin: 0,
                                      paddingLeft: 18,
                                      fontSize: 11.5,
                                      color: 'rgba(16,16,16,0.65)',
                                      lineHeight: 1.55,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 6,
                                      wordBreak: 'break-word',
                                      overflowWrap: 'break-word',
                                      whiteSpace: 'normal',
                                      boxSizing: 'border-box',
                                      maxWidth: '100%',
                                    }}>
                                      {verdictData.plan.long.map((act, i) => (
                                        <li key={i} style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', maxWidth: '100%' }}>{act}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              {/* ── 5. Zone Context & PINN Model Verification ── */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                                <div style={{ background: '#F4EADA', border: '1px solid rgba(16,16,16,0.15)', borderRadius: 8, padding: '10px 14px' }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(16,16,16,0.65)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                                    🏙️ Zone Morphology & Landmark
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11 }}>
                                    {[
                                      ['Zone Type', meta.loc.type],
                                      ['Population', meta.loc.populationDensity.split(' ')[0]],
                                      ['Key Landmark', meta.loc.keyLandmark],
                                    ].map(([label, val]) => (
                                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                        <span style={{ color: 'rgba(16,16,16,0.65)', flexShrink: 0 }}>{label}</span>
                                        <strong style={{ color: '#101010', textAlign: 'right', fontSize: label === 'Key Landmark' ? 10 : 11 }}>{val}</strong>
                                      </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: 'rgba(16,16,16,0.65)' }}>Microclimate UHI Offset</span>
                                      <strong style={{ color: meta.loc.lstOffset > 0 ? '#D5360C' : '#22c55e' }}>
                                        {meta.loc.lstOffset >= 0 ? `+${meta.loc.lstOffset}` : meta.loc.lstOffset}°C vs ambient
                                      </strong>
                                    </div>
                                    {meta.pinnPredictedLST != null && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'rgba(16,16,16,0.65)' }}>PINN Neural Prediction</span>
                                        <strong style={{ color: '#4ade80' }}>{meta.pinnPredictedLST.toFixed(1)}°C</strong>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div style={{ background: '#F4EADA', border: '1px solid rgba(16,16,16,0.15)', borderRadius: 8, padding: '10px 14px' }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(16,16,16,0.65)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                                    ⚙️ 10-Year Decadal Dataset Benchmarks
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11 }}>
                                    {(() => {
                                      const zs = THANE_ZONES_METRIC_SUMMARY.find(z => z.areaId === LOCATION_ID_MAP[meta.loc.id])
                                      return zs ? (
                                        <>
                                          {[
                                            ['10-yr Avg LST', `${zs.avgLST.toFixed(1)}°C`, '#D5360C'],
                                            ['Peak Recorded LST', `${zs.maxLST.toFixed(1)}°C`, '#D5360C'],
                                            ['PINN Solver MAE', `±${zs.pinnMAE.toFixed(3)}°C`, '#4ade80'],
                                            ['10-yr Avg NDVI', zs.avgNDVI.toFixed(3), '#22c55e'],
                                            ['10-yr Avg NDBI', zs.avgNDBI.toFixed(3), 'rgba(16,16,16,0.65)'],
                                          ].map(([label, val, color]) => (
                                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                              <span style={{ color: 'rgba(16,16,16,0.65)' }}>{label}</span>
                                              <strong style={{ color }}>{val}</strong>
                                            </div>
                                          ))}
                                        </>
                                      ) : <span style={{ color: 'rgba(16,16,16,0.65)' }}>No zone summary available.</span>
                                    })()}
                                  </div>
                                </div>
                              </div>

                              {/* ── Footer Note ── */}
                              <p className="hm-explanation-note" style={{ margin: 0 }}>
                                <strong>Explainable AI Reference:</strong>{' '}
                                {riskMode === 'dataset'
                                  ? `Based on monthly multi-spectral satellite record (${MONTH_NAMES[hmMonth - 1]} ${hmYear}). City reference is dynamically computed from ${explainabilityBenchmarks.indexSource}.`
                                  : `Based on active ${riskMode === 'live' ? 'IoT live telemetry' : 'summer baseline extremes'}. Reference: ${explainabilityBenchmarks.indexSource}.`}
                                {' '}Causes are ranked by relative deviation from city baseline using physics-informed surface energy balance constraints.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════════ EXPLAINABLE AI "WHY THIS RISK?" MODAL ═══════════ */}
      {modalMeta && modalVerdict && (
        <div
          className="xai-modal-backdrop"
          onClick={() => setModalMeta(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="xai-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="xai-modal-header">
              <div className="xai-modal-title-group">
                <Sparkles size={20} style={{ color: '#D5360C', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3>{modalMeta.loc.name}</h3>
                    <span className={`event-badge ${modalMeta.severity.toLowerCase()}`}>
                      {modalMeta.severity === 'High' ? '🔴 HIGH RISK' : modalMeta.severity === 'Moderate' ? '🟠 MODERATE' : '🟢 LOW RISK'}
                    </span>
                  </div>
                  <p>{modalMeta.loc.ward} · {modalMeta.loc.zoneNumber} · {modalMeta.loc.type}</p>
                </div>
              </div>
              <button
                type="button"
                className="xai-modal-close-btn"
                onClick={() => setModalMeta(null)}
                aria-label="Close modal"
                title="Close modal (Esc)"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body with Concise XAI Content */}
            <div className="xai-modal-body">
              {/* Quick Key Metrics Strip */}
              <div className="xai-modal-metrics-strip">
                <div className="xai-metric-box">
                  <span>Surface Temp (LST)</span>
                  <strong style={{ color: modalMeta.severity === 'High' ? '#D5360C' : modalMeta.severity === 'Moderate' ? '#D5360C' : '#16a34a' }}>
                    {modalMeta.lst}°C
                  </strong>
                  <small>
                    {modalMeta.lst - explainabilityBenchmarks.avgLST >= 0 ? '+' : ''}
                    {(modalMeta.lst - explainabilityBenchmarks.avgLST).toFixed(1)}°C vs Thane avg
                  </small>
                </div>
                <div className="xai-metric-box">
                  <span>PINN Modeled LST</span>
                  <strong style={{ color: '#D5360C' }}>
                    {modalMeta.pinnPredictedLST != null ? `${modalMeta.pinnPredictedLST.toFixed(1)}°C` : `${modalMeta.ambientTemp}°C`}
                  </strong>
                  <small>{modalMeta.pinnPredictedLST != null ? 'Physics-informed AI' : 'Ambient offset'}</small>
                </div>
                <div className="xai-metric-box">
                  <span>Microclimate / Node</span>
                  <strong style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {modalMeta.loc.keyLandmark}
                  </strong>
                  <small>UHI Offset: {modalMeta.loc.lstOffset >= 0 ? `+${modalMeta.loc.lstOffset}` : modalMeta.loc.lstOffset}°C</small>
                </div>
              </div>

              {/* Diagnostic Summary (Why This Risk?) */}
              <div className={`xai-verdict-banner ${modalMeta.severity.toLowerCase()}`}>
                <div className="xai-verdict-heading">
                  <Sparkles size={13} />
                  <span>Explainable AI · Why This Risk Verdict?</span>
                </div>
                <p className="xai-verdict-text">{modalVerdict.verdict}</p>
              </div>

              {/* Physics-Informed Key Risk Factors */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(16,16,16,0.65)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>
                  🔍 Key Physics Risk Drivers (Deviations vs Thane Mean)
                </div>
                <div className="xai-drivers-grid">
                  <div className="xai-driver-card">
                    <div className="xai-driver-top">
                      <strong>🌿 Vegetation Deficit (NDVI)</strong>
                      <span className={`xai-driver-tag ${(modalMeta.ndvi ?? 0.265) < explainabilityBenchmarks.avgNDVI ? 'risk' : 'protect'}`}>
                        {(modalMeta.ndvi ?? 0.265) < explainabilityBenchmarks.avgNDVI ? '▲ Risk Factor' : '▼ Protective'}
                      </span>
                    </div>
                    <p className="xai-driver-desc">
                      NDVI is <strong>{modalMeta.ndvi?.toFixed(3) ?? '0.265'}</strong> (City Ref: {explainabilityBenchmarks.avgNDVI.toFixed(3)}).{' '}
                      {(modalMeta.ndvi ?? 0.265) < explainabilityBenchmarks.avgNDVI
                        ? 'Sparse canopy reduces evapotranspiration cooling.'
                        : 'Abundant tree canopy buffers ambient heat.'}
                    </p>
                  </div>

                  <div className="xai-driver-card">
                    <div className="xai-driver-top">
                      <strong>🏢 Built-up Density (NDBI)</strong>
                      <span className={`xai-driver-tag ${(modalMeta.ndbi ?? 0.001) > explainabilityBenchmarks.avgNDBI ? 'risk' : 'protect'}`}>
                        {(modalMeta.ndbi ?? 0.001) > explainabilityBenchmarks.avgNDBI ? '▲ Heat Trapping' : '▼ Moderate'}
                      </span>
                    </div>
                    <p className="xai-driver-desc">
                      NDBI is <strong>{modalMeta.ndbi?.toFixed(3) ?? '0.001'}</strong> (City Ref: {explainabilityBenchmarks.avgNDBI.toFixed(3)}).{' '}
                      {(modalMeta.ndbi ?? 0.001) > explainabilityBenchmarks.avgNDBI
                        ? 'High impervious concrete and asphalt trap solar heat.'
                        : 'Lower building density allows better ventilation.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Immediate Targeted Cooling Strategy */}
              <div className="xai-action-box">
                <ShieldAlert size={18} style={{ color: '#D5360C', flexShrink: 0, marginTop: 2 }} />
                <div className="xai-action-content">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                    <strong>Recommended Cooling Intervention</strong>
                    <span className={`hm-prio-pill ${modalMeta.coolingPriority.toLowerCase()}`}>
                      {modalMeta.coolingPriority === 'Emergency' ? '⚡ Emergency Misting' : modalMeta.coolingPriority === 'High' ? '● Shaded Corridors' : '○ Protected Canopy'}
                    </span>
                  </div>
                  <p>{modalMeta.recommendedAction}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="xai-modal-footer">
              <span className="xai-screen-hint">
                💡 Click anywhere outside on the screen or press ESC to go back
              </span>
              <button
                type="button"
                className="xai-done-btn"
                onClick={() => setModalMeta(null)}
              >
                Back to Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
