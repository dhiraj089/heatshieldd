'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChevronDown,
  Download,
  Filter,
  Flame,
  Gauge,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Waves,
  Wind
} from 'lucide-react'
import {
  ALL_YEARS,
  PINN_BENCHMARK,
  THANE_DATASET_RECORDS,
  THANE_ZONES_METRIC_SUMMARY,
  getZoneRecords,
  getZoneSeasonalProfile,
  getZoneYearlySummary,
  getAllZonesForYearMonth,
  getExactObservation,
  type ThaneDatasetRecord,
  type ZoneMetricSummary
} from '@/lib/thane-dataset'
import { THANE_LOCATIONS, type ThaneLocation, type LiveWeatherData } from '@/app/page'

interface HistoricalPageProps {
  selectedLocation?: ThaneLocation
  onSelectLocation?: (loc: ThaneLocation) => void
  time?: { formatted: string; timeShort: string }
  weather?: Partial<LiveWeatherData> & { refresh?: () => void }
}

export default function HistoricalPage({
  selectedLocation = THANE_LOCATIONS[0],
  onSelectLocation,
  time = { formatted: 'THURSDAY, 03 SEPTEMBER 2026 · 06:00 PM IST', timeShort: '06:00 PM' },
  weather
}: HistoricalPageProps) {
  const [activeTab, setActiveTab] = useState<'seasonal' | 'table' | 'lookup'>('seasonal')
  const [selectedYear, setSelectedYear] = useState<number>(2026)
  const [selectedMonth, setSelectedMonth] = useState<number>(5)
  const [archiveMonth, setArchiveMonth] = useState<number | 'all'>('all')
  const [selectedWard, setSelectedWard] = useState<string>(selectedLocation.zoneNumber)
  const [showAllPills, setShowAllPills] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL')

  // Keep selectedWard in sync if selectedLocation updates from parent
  useEffect(() => {
    if (selectedLocation?.zoneNumber) {
      setSelectedWard(selectedLocation.zoneNumber)
    }
  }, [selectedLocation?.zoneNumber])

  // Find active location based on ward
  const activeLoc = useMemo(() => {
    return THANE_LOCATIONS.find(l => l.zoneNumber === selectedWard) || selectedLocation
  }, [selectedWard, selectedLocation])

  // Real dataset records for this ward
  const zoneRecords = useMemo(() => {
    return getZoneRecords(selectedWard)
  }, [selectedWard])

  // Yearly summary across all 10+ years (2016-2026)
  const yearlySummary = useMemo(() => {
    return getZoneYearlySummary(selectedWard)
  }, [selectedWard])

  // Seasonal 12-month profile for this ward
  const seasonalProfile = useMemo(() => {
    return getZoneSeasonalProfile(selectedWard)
  }, [selectedWard])

  // Current year records
  const currentYearRecords = useMemo(() => {
    return zoneRecords.filter(r => r.year === selectedYear)
  }, [zoneRecords, selectedYear])

  const archiveMonths = useMemo(() => {
    return Array.from(new Set(currentYearRecords.map(r => r.month))).sort((a, b) => a - b)
  }, [currentYearRecords])

  const activeArchiveMonth = archiveMonth === 'all' || archiveMonths.includes(archiveMonth) ? archiveMonth : 'all'

  const archiveRecords = useMemo(() => {
    return currentYearRecords.filter(r => activeArchiveMonth === 'all' || r.month === activeArchiveMonth)
  }, [currentYearRecords, activeArchiveMonth])

  // Overall Statistics for this zone across the 128 months
  const maxRecordedLST = useMemo(() => {
    return zoneRecords.length ? Math.max(...zoneRecords.map(r => r.avgLST)) : 42.0
  }, [zoneRecords])

  const minRecordedLST = useMemo(() => {
    return zoneRecords.length ? Math.min(...zoneRecords.map(r => r.avgLST)) : 22.0
  }, [zoneRecords])

  const avgZoneLST = useMemo(() => {
    return zoneRecords.length
      ? Number((zoneRecords.reduce((a, b) => a + b.avgLST, 0) / zoneRecords.length).toFixed(1))
      : 32.5
  }, [zoneRecords])

  const heatwaveMonthsCount = useMemo(() => {
    return zoneRecords.filter(r => r.avgLST >= 37.0).length
  }, [zoneRecords])

  const zoneMetric = useMemo(() => {
    return THANE_ZONES_METRIC_SUMMARY.find(z => z.ward === selectedWard) || THANE_ZONES_METRIC_SUMMARY[0]
  }, [selectedWard])

  // Download filtered or full CSV
  const handleDownloadCSV = () => {
    const csvHeader = 'Year_Month,Year,Month,Ward,Location,Risk_Level,Latitude,Longitude,Avg_LST_C,PINN_Predicted_LST,RF_Predicted_LST,Residual_Error,NDVI,NDBI,NDWI,Albedo,Month_Data_Source\n'
    const csvRows = archiveRecords.map(r =>
      [r.yearMonth, r.year, r.month, `"${r.ward}"`, `"${r.location}"`, r.riskLevel, r.lat, r.lon, r.avgLST, r.pinnPredictedLST, r.rfPredictedLST, r.residualError, r.ndvi, r.ndbi, r.ndwi, r.albedo, `"${r.monthDataSource}"`].join(',')
    ).join('\n')
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    const monthSuffix = activeArchiveMonth === 'all' ? '' : `_${String(activeArchiveMonth).padStart(2, '0')}`
    link.setAttribute('download', `${selectedWard.replace(' ', '_')}_${selectedYear}${monthSuffix}_historical_pinn_dataset.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="hist-page" style={{ padding: '0 4px' }}>
      {/* Header */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            HISTORICAL CLIMATE ARCHIVE · {activeLoc.name.toUpperCase()} · 10-YEAR SATELLITE & PINN MODEL INTELLIGENCE
          </p>
          <h1>
            Historical Climate Archive<span>.</span>
          </h1>
          <p className="subtext">
            Continuous 2016–2026 satellite record covering <strong>2,304 monthly observations</strong> across all 18 Thane municipal wards.
            Calibrated with physical surface energy balance and PyTorch PINN neural solver.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="date-btn"
            onClick={handleDownloadCSV}
            title="Download CSV for this ward"
            style={{ background: '#16a34a', color: '#101010', borderColor: '#16a34a' }}
          >
            <Download size={14} />
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>

      {/* Ward Location Selector: Dropdown & Quick Chips */}
      <div className="hist-location-strip" style={{ marginBottom: 20 }}>
        <div className="hist-selector-header">
          <div className="hist-selector-left">
            <MapPin size={18} className="hist-pin-icon" />
            <label htmlFor="hist-ward-dropdown" className="hist-selector-label">
              SELECT WARD LOCATION:
            </label>
            <div className="hist-dropdown-wrapper">
              <select
                id="hist-ward-dropdown"
                value={activeLoc.id}
                onChange={e => {
                  const loc = THANE_LOCATIONS.find(l => l.id === e.target.value)
                  if (loc) {
                    setSelectedWard(loc.zoneNumber)
                    if (onSelectLocation) onSelectLocation(loc)
                  }
                }}
                className="hist-dropdown-select"
                aria-label="Select Thane Ward Location"
              >
                {THANE_LOCATIONS.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.zoneNumber} · {loc.name} ({loc.vulnerability} Heat Risk · {loc.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hist-selector-right">
            <span className="hist-active-tag">
              Selected: <strong>{activeLoc.name}</strong> ({activeLoc.zoneNumber})
            </span>
            <button
              type="button"
              onClick={() => setShowAllPills(!showAllPills)}
              className="hist-toggle-chips-btn"
              title="Toggle all 18 ward chips"
            >
              <span>{showAllPills ? 'Hide Quick Chips' : 'All 18 Ward Chips'}</span>
              <ChevronDown size={14} className={showAllPills ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>

        {showAllPills && (
          <div className="hist-chips-grid">
            {THANE_LOCATIONS.map(loc => {
              const isSelected = loc.zoneNumber === selectedWard
              return (
                <button
                  key={loc.id}
                  type="button"
                  className={`hist-loc-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedWard(loc.zoneNumber)
                    if (onSelectLocation) onSelectLocation(loc)
                  }}
                >
                  <span
                    className={`zone-dot ${
                      loc.vulnerability === 'High' ? 'critical' : loc.vulnerability === 'Low' ? 'safe' : 'watch'
                    }`}
                  />
                  <span style={{ fontWeight: 600 }}>{loc.zoneNumber}</span> · {loc.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 3 Key Summary Metric Cards */}
      <div className="hist-kpi-row hist-kpi-row-3" style={{ marginBottom: 24 }}>
        <div className="hist-kpi-card blue">
          <span className="hist-kpi-label">10-Year Mean LST</span>
          <strong className="hist-kpi-value">{avgZoneLST.toFixed(1)}°C</strong>
          <small>Decadal baseline across 128 months</small>
        </div>
        <div className="hist-kpi-card red">
          <span className="hist-kpi-label">Heat Stress Months</span>
          <strong className="hist-kpi-value">{heatwaveMonthsCount}</strong>
          <small>Monthly mean LST ≥ 37.0°C</small>
        </div>
        <div className="hist-kpi-card green">
          <span className="hist-kpi-label">PINN Model MAE</span>
          <strong className="hist-kpi-value">{zoneMetric.pinnMAE.toFixed(3)}°C</strong>
          <small>{zoneMetric.improvement} superior vs RF ({zoneMetric.rfMAE.toFixed(3)}°C)</small>
        </div>
      </div>

      {/* Historical Navigation Tabs */}
      <div className="hist-tabs" style={{ marginBottom: 20 }}>
        {[
          { id: 'seasonal', label: '🌤️ 12-Month Seasonal Profile' },
          { id: 'table', label: '📋 Full Dataset Records (2,304)' },
          { id: 'lookup', label: '🔍 Precise LST Lookup' },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            className={`hist-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id as any)}
          >
            {t.label}
          </button>
        ))}
      </div>


      {/* ── TAB 3: SEASONAL PROFILE ── */}
      {activeTab === 'seasonal' && (
        <div className="hist-section">
          <div className="panel" style={{ background: '#F4EADA', padding: 24, borderRadius: 12, border: '1px solid rgba(16,16,16,0.15)' }}>
            <h2 style={{ fontSize: 18, margin: 0, color: '#101010' }}>12-Month Diurnal & Seasonal Energy Cycle · {activeLoc.name}</h2>
            <p style={{ margin: '6px 0 20px', fontSize: 13, color: 'rgba(16,16,16,0.65)' }}>
              Aggregated across 10 years of observation. Illustrates pre-monsoon heat peak (Apr–May), monsoon maritime cooling (Jun–Sep), and post-monsoon warming.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {seasonalProfile.map(sp => (
                <div
                  key={sp.month}
                  style={{
                    background: '#F4EADA',
                    border: '1px solid rgba(16,16,16,0.15)',
                    borderRadius: 10,
                    padding: 14
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#101010' }}>{sp.monthName}</span>
                    <span style={{ fontSize: 11, color: 'rgba(16,16,16,0.65)' }}>M{sp.month}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: sp.avgLST >= 36 ? '#D5360C' : sp.avgLST >= 32 ? '#D5360C' : '#D5360C' }}>
                    {sp.avgLST}°C
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(16,16,16,0.65)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span>NDVI: <b style={{ color: '#22c55e' }}>{sp.avgNDVI}</b></span>
                    <span>NDBI: <b style={{ color: 'rgba(16,16,16,0.2)' }}>{sp.avgNDBI}</b></span>
                    <span>Albedo: <b style={{ color: '#EDA389' }}>{sp.avgAlbedo}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: TABLE ── */}
      {activeTab === 'table' && (
        <div className="hist-section">
          <div className="panel" style={{ background: '#F4EADA', padding: 24, borderRadius: 12, border: '1px solid rgba(16,16,16,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, margin: 0, color: '#101010' }}>Full Multi-Spectral Dataset Archive</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(16,16,16,0.65)' }}>
                  Showing {archiveRecords.length} of {zoneRecords.length} records for <strong>{activeLoc.name} ({selectedWard})</strong> · {activeArchiveMonth === 'all' ? 'All months' : HIST_MONTH_NAMES[activeArchiveMonth - 1]} {selectedYear}.
                </p>
              </div>

              {/* Archive Filters */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(16,16,16,0.65)', fontWeight: 600 }}>YEAR:</span>
                <select
                  value={selectedYear}
                  aria-label="Filter archive by year"
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value))
                    setArchiveMonth('all')
                  }}
                  style={{
                    background: '#F4EADA',
                    color: '#101010',
                    border: '1px solid rgba(16,16,16,0.15)',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 13
                  }}
                >
                  {ALL_YEARS.map(yr => (
                    <option key={yr} value={yr}>Year {yr}</option>
                  ))}
                </select>
                </label>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(16,16,16,0.65)', fontWeight: 600 }}>MONTH:</span>
                  <select
                    value={activeArchiveMonth}
                    aria-label="Filter archive by month"
                    onChange={(e) => setArchiveMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    style={{
                      background: '#F4EADA',
                      color: '#101010',
                      border: '1px solid rgba(16,16,16,0.15)',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 13
                    }}
                  >
                    <option value="all">All months</option>
                    {archiveMonths.map(month => (
                      <option key={month} value={month}>{HIST_MONTH_NAMES[month - 1]}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#EFE2CF', color: '#101010' }}>
                    <th style={{ padding: '8px 10px' }}>Period</th>
                    <th style={{ padding: '8px 10px' }}>Month</th>
                    <th style={{ padding: '8px 10px' }}>Risk</th>
                    <th style={{ padding: '8px 10px' }}>Observed LST</th>
                    <th style={{ padding: '8px 10px', color: '#4ade80' }}>PINN Pred.</th>
                    <th style={{ padding: '8px 10px', color: '#EDA389' }}>RF Pred.</th>
                    <th style={{ padding: '8px 10px' }}>Residual Error</th>
                    <th style={{ padding: '8px 10px' }}>NDVI</th>
                    <th style={{ padding: '8px 10px' }}>NDBI</th>
                    <th style={{ padding: '8px 10px' }}>NDWI</th>
                    <th style={{ padding: '8px 10px' }}>Albedo</th>
                  </tr>
                </thead>
                <tbody>
                  {archiveRecords.map((r, i) => (
                    <tr
                      key={`${r.yearMonth}-${i}`}
                      style={{
                        borderBottom: '1px solid rgba(16,16,16,0.15)',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                      }}
                    >
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.yearMonth}</td>
                      <td style={{ padding: '8px 10px' }}>{r.monthName}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background: r.riskLevel === 'HIGH' ? 'rgba(239,68,68,0.2)' : r.riskLevel === 'MODERATE' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)',
                          color: r.riskLevel === 'HIGH' ? '#D5360C' : r.riskLevel === 'MODERATE' ? '#EDA389' : '#4ade80'
                        }}>
                          {r.riskLevel}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#D5360C' }}>{r.avgLST.toFixed(1)}°C</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#4ade80' }}>{r.pinnPredictedLST.toFixed(1)}°C</td>
                      <td style={{ padding: '8px 10px', color: '#EDA389' }}>{r.rfPredictedLST.toFixed(1)}°C</td>
                      <td style={{ padding: '8px 10px', color: Math.abs(r.residualError) < 0.4 ? '#4ade80' : '#D5360C' }}>
                        {r.residualError >= 0 ? `+${r.residualError.toFixed(2)}` : r.residualError.toFixed(2)}°C
                      </td>
                      <td style={{ padding: '8px 10px', color: '#22c55e' }}>{r.ndvi.toFixed(3)}</td>
                      <td style={{ padding: '8px 10px', color: 'rgba(16,16,16,0.2)' }}>{r.ndbi.toFixed(3)}</td>
                      <td style={{ padding: '8px 10px', color: '#D5360C' }}>{r.ndwi.toFixed(3)}</td>
                      <td style={{ padding: '8px 10px', color: '#EDA389' }}>{r.albedo.toFixed(3)}</td>
                    </tr>
                  ))}
                  {archiveRecords.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ padding: 24, textAlign: 'center', color: 'rgba(16,16,16,0.65)' }}>
                        No records available for this year and month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ── TAB 6: PRECISE LST LOOKUP ── */}
      {activeTab === 'lookup' && (
        <LSTLookupPanel
          selectedWard={selectedWard}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
          activeLoc={activeLoc}
        />
      )}
    </div>
  )
}

const HIST_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function LSTLookupPanel({
  selectedWard,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  activeLoc,
}: {
  selectedWard: string
  selectedYear: number
  selectedMonth: number
  onYearChange: (y: number) => void
  onMonthChange: (m: number) => void
  activeLoc: import('@/app/page').ThaneLocation
}) {
  const singleRecord = useMemo(() => {
    return getExactObservation(selectedWard, selectedYear, selectedMonth)
  }, [selectedWard, selectedYear, selectedMonth])

  const allZones = useMemo(() => {
    return getAllZonesForYearMonth(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth])

  const monthName = HIST_MONTH_NAMES[selectedMonth - 1]

  function lstColor(lst: number) {
    if (lst >= 40) return '#D5360C'
    if (lst >= 37) return '#D5360C'
    if (lst >= 33) return '#EDA389'
    if (lst >= 29) return '#22c55e'
    return '#D5360C'
  }

  function riskBg(risk: string) {
    if (risk === 'HIGH') return { bg: 'rgba(239,68,68,0.15)', color: '#D5360C' }
    if (risk === 'MODERATE') return { bg: 'rgba(245,158,11,0.12)', color: '#EDA389' }
    return { bg: 'rgba(34,197,94,0.10)', color: '#4ade80' }
  }

  return (
    <div className="hist-section">
      <div className="panel" style={{ background: '#F4EADA', padding: 24, borderRadius: 12, border: '1px solid rgba(16,16,16,0.15)' }}>
        <h2 style={{ fontSize: 18, margin: '0 0 4px', color: '#101010' }}>Precise LST Lookup · {activeLoc.name} ({selectedWard})</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(16,16,16,0.65)' }}>
          Select a year and month to retrieve the exact observed Land Surface Temperature from the 2,304-record PINN dataset.
        </p>

        {/* Selectors */}
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
          background: '#EFE2CF', padding: '16px 20px', borderRadius: 10, marginBottom: 24,
          border: '1px solid rgba(16,16,16,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={16} style={{ color: '#D5360C' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(16,16,16,0.65)', letterSpacing: '0.06em' }}>YEAR</span>
            <select
              id="hist-lookup-year"
              value={selectedYear}
              onChange={e => onYearChange(Number(e.target.value))}
              style={{
                background: '#F4EADA', color: '#101010',
                border: '1px solid rgba(16,16,16,0.15)',
                padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', outline: 'none', minWidth: 90
              }}
            >
              {ALL_YEARS.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Thermometer size={16} style={{ color: '#D5360C' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(16,16,16,0.65)', letterSpacing: '0.06em' }}>MONTH</span>
            <select
              id="hist-lookup-month"
              value={selectedMonth}
              onChange={e => onMonthChange(Number(e.target.value))}
              style={{
                background: '#F4EADA', color: '#101010',
                border: '1px solid rgba(16,16,16,0.15)',
                padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', outline: 'none', minWidth: 130
              }}
            >
              {HIST_MONTH_NAMES.map((mn, idx) => (
                <option key={idx + 1} value={idx + 1}>{mn}</option>
              ))}
            </select>
          </div>

          <div style={{
            marginLeft: 'auto', fontSize: 12, color: 'rgba(16,16,16,0.65)',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: allZones.length > 0 ? '#4ade80' : '#D5360C', display: 'inline-block' }} />
            {allZones.length > 0 ? `${allZones.length} records found` : 'No data for this period'}
          </div>
        </div>

        {/* Single Ward Result */}
        {singleRecord ? (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24
            }}>
              <div style={{
                background: `rgba(${singleRecord.avgLST >= 37 ? '239,68,68' : '249,115,22'},0.12)`,
                border: `1px solid ${lstColor(singleRecord.avgLST)}33`,
                borderRadius: 12, padding: '20px 24px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(16,16,16,0.65)', marginBottom: 4 }}>OBSERVED LST</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: lstColor(singleRecord.avgLST), lineHeight: 1 }}>
                  {singleRecord.avgLST.toFixed(1)}°C
                </div>
                <div style={{ fontSize: 12, color: 'rgba(16,16,16,0.65)', marginTop: 6 }}>{monthName} {selectedYear} · {selectedWard}</div>
              </div>

              <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(16,16,16,0.65)', marginBottom: 4 }}>PINN PREDICTED LST</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#4ade80', lineHeight: 1 }}>
                  {singleRecord.pinnPredictedLST.toFixed(1)}°C
                </div>
                <div style={{ fontSize: 12, color: 'rgba(16,16,16,0.65)', marginTop: 6 }}>
                  Residual: {singleRecord.residualError >= 0 ? `+${singleRecord.residualError.toFixed(2)}` : singleRecord.residualError.toFixed(2)}°C
                </div>
              </div>

              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(16,16,16,0.65)', marginBottom: 4 }}>RF PREDICTED LST</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#EDA389', lineHeight: 1 }}>
                  {singleRecord.rfPredictedLST.toFixed(1)}°C
                </div>
                <div style={{ fontSize: 12, color: 'rgba(16,16,16,0.65)', marginTop: 6 }}>Statistical Baseline</div>
              </div>

              <div style={{ background: '#F4EADA', border: '1px solid rgba(16,16,16,0.15)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(16,16,16,0.65)', marginBottom: 10 }}>SPECTRAL INDICES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[['NDVI (Vegetation)', singleRecord.ndvi.toFixed(3), '#22c55e'],
                    ['NDBI (Built-up)', singleRecord.ndbi.toFixed(3), 'rgba(16,16,16,0.2)'],
                    ['NDWI (Water)', singleRecord.ndwi.toFixed(3), '#D5360C'],
                    ['Albedo', singleRecord.albedo.toFixed(3), '#EDA389']
                  ].map(([label, val, color]) => (
                    <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'rgba(16,16,16,0.65)' }}>{label}</span>
                      <strong style={{ fontSize: 13, color: color as string }}>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: riskBg(singleRecord.riskLevel).bg,
              border: `1px solid ${riskBg(singleRecord.riskLevel).color}44`,
              borderRadius: 8, padding: '10px 20px', marginBottom: 24
            }}>
              <span style={{ fontSize: 13, color: 'rgba(16,16,16,0.65)' }}>Heat Risk Classification:</span>
              <strong style={{ fontSize: 14, color: riskBg(singleRecord.riskLevel).color }}>{singleRecord.riskLevel}</strong>
              <span style={{ fontSize: 12, color: 'rgba(16,16,16,0.65)' }}>· {singleRecord.monthDataSource}</span>
            </div>
          </>
        ) : (
          allZones.length === 0 && (
            <div style={{
              textAlign: 'center', padding: 40, color: 'rgba(16,16,16,0.65)',
              background: '#F4EADA', borderRadius: 10, marginBottom: 20
            }}>
              <Thermometer size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
              <p>No dataset records available for <strong style={{ color: '#101010' }}>{monthName} {selectedYear}</strong>.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Dataset covers Jan 2016 – Aug 2026.</p>
            </div>
          )
        )}

        {/* All-zones for the period */}
        {allZones.length > 0 && (
          <>
            <h3 style={{ fontSize: 15, margin: '0 0 12px', color: '#101010' }}>
              All 18 Zones · {monthName} {selectedYear}
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#EFE2CF', color: 'rgba(16,16,16,0.65)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Ward</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Location</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Risk</th>
                    <th style={{ padding: '8px 12px', color: '#D5360C' }}>Observed LST</th>
                    <th style={{ padding: '8px 12px', color: '#4ade80' }}>PINN Pred.</th>
                    <th style={{ padding: '8px 12px' }}>NDVI</th>
                    <th style={{ padding: '8px 12px' }}>NDBI</th>
                    <th style={{ padding: '8px 12px' }}>Albedo</th>
                  </tr>
                </thead>
                <tbody>
                  {[...allZones].sort((a, b) => b.avgLST - a.avgLST).map((r, i) => (
                    <tr
                      key={r.ward}
                      style={{
                        borderBottom: '1px solid rgba(16,16,16,0.15)',
                        background: r.ward === selectedWard ? 'rgba(232,102,49,0.1)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                      }}
                    >
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.ward}</td>
                      <td style={{ padding: '8px 12px', color: '#101010' }}>{r.location}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                          background: riskBg(r.riskLevel).bg, color: riskBg(r.riskLevel).color
                        }}>{r.riskLevel}</span>
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 800, color: lstColor(r.avgLST), fontSize: 14 }}>{r.avgLST.toFixed(1)}°C</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#4ade80' }}>{r.pinnPredictedLST.toFixed(1)}°C</td>
                      <td style={{ padding: '8px 12px', color: '#22c55e' }}>{r.ndvi.toFixed(3)}</td>
                      <td style={{ padding: '8px 12px', color: 'rgba(16,16,16,0.2)' }}>{r.ndbi.toFixed(3)}</td>
                      <td style={{ padding: '8px 12px', color: '#EDA389' }}>{r.albedo.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
