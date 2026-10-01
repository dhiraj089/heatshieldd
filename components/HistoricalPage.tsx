'use client'

import React, { useMemo, useState } from 'react'
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
  const [activeTab, setActiveTab] = useState<'decade' | 'compare' | 'seasonal' | 'table' | 'pinnAnalysis' | 'lookup'>('decade')
  const [selectedYear, setSelectedYear] = useState<number>(2026)
  const [selectedMonth, setSelectedMonth] = useState<number>(5)
  const [selectedWard, setSelectedWard] = useState<string>(selectedLocation.zoneNumber)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL')

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
    const csvRows = zoneRecords.map(r =>
      [r.yearMonth, r.year, r.month, `"${r.ward}"`, `"${r.location}"`, r.riskLevel, r.lat, r.lon, r.avgLST, r.pinnPredictedLST, r.rfPredictedLST, r.residualError, r.ndvi, r.ndbi, r.ndwi, r.albedo, `"${r.monthDataSource}"`].join(',')
    ).join('\n')
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${selectedWard.replace(' ', '_')}_historical_pinn_dataset.csv`)
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
            style={{ background: '#16a34a', color: '#2a2824', borderColor: '#16a34a' }}
          >
            <Download size={14} />
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>

      {/* Ward Selector Strip */}
      <div className="hist-location-strip" style={{ marginBottom: 20 }}>
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

      {/* 4 Key Summary Metric Cards */}
      <div className="hist-kpi-row" style={{ marginBottom: 24 }}>
        <div className="hist-kpi-card orange">
          <span className="hist-kpi-label">Decadal Peak LST</span>
          <strong className="hist-kpi-value">{maxRecordedLST.toFixed(1)}°C</strong>
          <small>Highest summer peak in {activeLoc.name}</small>
        </div>
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
        <div className="hist-kpi-card purple">
          <span className="hist-kpi-label">Observations Available</span>
          <strong className="hist-kpi-value">{zoneRecords.length}</strong>
          <small>100% complete Jan 2016 – Aug 2026</small>
        </div>
      </div>

      {/* Historical Navigation Tabs */}
      <div className="hist-tabs" style={{ marginBottom: 20 }}>
        {[
          { id: 'decade', label: '📈 10-Year Trajectory (2016–2026)' },
          { id: 'compare', label: '⚖️ PINN vs RF Benchmark' },
          { id: 'seasonal', label: '🌤️ 12-Month Seasonal Profile' },
          { id: 'table', label: '📋 Full Dataset Records (2,304)' },
          { id: 'pinnAnalysis', label: '🧠 Physics Constraints & Proof' },
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

      {/* ── TAB 1: 10-YEAR TRAJECTORY ── */}
      {activeTab === 'decade' && (
        <div className="hist-section">
          <div className="panel" style={{ background: '#fffdf8', padding: 24, borderRadius: 12, border: '1px solid #dfd9cc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, margin: 0, color: '#2a2824' }}>Annual Climate Trend & Multi-Spectral Progression · {activeLoc.name}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#77736b' }}>
                  Tracking annual average LST, summer peak LST, NDVI greening, and NDBI built-up impervious expansion from 2016 to 2026.
                </p>
              </div>
            </div>

            {/* Annual Bar / Progress comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {yearlySummary.map(ys => (
                <div
                  key={ys.year}
                  style={{
                    background: selectedYear === ys.year ? 'rgba(232, 102, 49, 0.12)' : 'rgba(255,255,255,0.03)',
                    border: '1px solid',
                    borderColor: selectedYear === ys.year ? '#e86631' : 'rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setSelectedYear(ys.year)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#2a2824' }}>Year {ys.year}</span>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: '#3a3630' }}>
                      {ys.observations} Months
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                    <div>
                      <span style={{ color: '#88837a', fontSize: 11 }}>Mean LST</span>
                      <div style={{ fontWeight: 700, color: '#f97316', fontSize: 15 }}>{ys.avgLST}°C</div>
                    </div>
                    <div>
                      <span style={{ color: '#88837a', fontSize: 11 }}>Summer Peak</span>
                      <div style={{ fontWeight: 700, color: '#ef4444', fontSize: 15 }}>{ys.maxLST}°C</div>
                    </div>
                    <div>
                      <span style={{ color: '#88837a', fontSize: 11 }}>Vegetation (NDVI)</span>
                      <div style={{ fontWeight: 600, color: '#22c55e' }}>{ys.avgNDVI}</div>
                    </div>
                    <div>
                      <span style={{ color: '#88837a', fontSize: 11 }}>Built-up (NDBI)</span>
                      <div style={{ fontWeight: 600, color: '#cbd5e1' }}>{ys.avgNDBI}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: '#4ade80' }}>PINN Error: ±{ys.pinnMAE}°C</span>
                    <span style={{ color: '#f59e0b' }}>RF Error: ±{ys.rfMAE}°C</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PINN VS RF BENCHMARK ── */}
      {activeTab === 'compare' && (
        <div className="hist-section">
          <div className="panel" style={{ background: '#fffdf8', padding: 24, borderRadius: 12, border: '1px solid #dfd9cc' }}>
            <h2 style={{ fontSize: 18, margin: 0, color: '#2a2824' }}>All 18 Zones Comparative Performance Matrix</h2>
            <p style={{ margin: '6px 0 20px', fontSize: 13, color: '#77736b' }}>
              Rigorous test-set benchmark validating that PINN maintains sub-0.35°C error across coastal, industrial, and valley microclimates.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8f4ee', color: '#3a3630' }}>
                    <th style={{ padding: '10px 14px' }}>Ward</th>
                    <th style={{ padding: '10px 14px' }}>Zone Name</th>
                    <th style={{ padding: '10px 14px' }}>Topology / Microclimate</th>
                    <th style={{ padding: '10px 14px' }}>Vulnerability</th>
                    <th style={{ padding: '10px 14px' }}>Observed Peak</th>
                    <th style={{ padding: '10px 14px', color: '#4ade80' }}>PINN MAE</th>
                    <th style={{ padding: '10px 14px', color: '#fbbf24' }}>RF MAE</th>
                    <th style={{ padding: '10px 14px', color: '#60a5fa' }}>PINN Superiority</th>
                  </tr>
                </thead>
                <tbody>
                  {THANE_ZONES_METRIC_SUMMARY.map(z => (
                    <tr
                      key={z.ward}
                      style={{
                        borderBottom: '1px solid #f0ece3',
                        background: z.ward === selectedWard ? 'rgba(232, 102, 49, 0.1)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{z.ward}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{z.areaName}</td>
                      <td style={{ padding: '10px 14px', color: '#5f5b54' }}>{z.zoneType}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background: z.vulnerability === 'High' ? 'rgba(239,68,68,0.2)' : z.vulnerability === 'Moderate' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)',
                          color: z.vulnerability === 'High' ? '#f87171' : z.vulnerability === 'Moderate' ? '#fbbf24' : '#4ade80'
                        }}>
                          {z.vulnerability}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#ef4444' }}>{z.maxLST}°C</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#4ade80' }}>{z.pinnMAE.toFixed(3)}°C</td>
                      <td style={{ padding: '10px 14px', color: '#fbbf24' }}>{z.rfMAE.toFixed(3)}°C</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#60a5fa' }}>{z.improvement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SEASONAL PROFILE ── */}
      {activeTab === 'seasonal' && (
        <div className="hist-section">
          <div className="panel" style={{ background: '#fffdf8', padding: 24, borderRadius: 12, border: '1px solid #dfd9cc' }}>
            <h2 style={{ fontSize: 18, margin: 0, color: '#2a2824' }}>12-Month Diurnal & Seasonal Energy Cycle · {activeLoc.name}</h2>
            <p style={{ margin: '6px 0 20px', fontSize: 13, color: '#77736b' }}>
              Aggregated across 10 years of observation. Illustrates pre-monsoon heat peak (Apr–May), monsoon maritime cooling (Jun–Sep), and post-monsoon warming.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {seasonalProfile.map(sp => (
                <div
                  key={sp.month}
                  style={{
                    background: '#fbf9f4',
                    border: '1px solid #e8e2d8',
                    borderRadius: 10,
                    padding: 14
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#2a2824' }}>{sp.monthName}</span>
                    <span style={{ fontSize: 11, color: '#9b968d' }}>M{sp.month}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: sp.avgLST >= 36 ? '#ef4444' : sp.avgLST >= 32 ? '#f97316' : '#60a5fa' }}>
                    {sp.avgLST}°C
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: '#77736b', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span>NDVI: <b style={{ color: '#22c55e' }}>{sp.avgNDVI}</b></span>
                    <span>NDBI: <b style={{ color: '#cbd5e1' }}>{sp.avgNDBI}</b></span>
                    <span>Albedo: <b style={{ color: '#93c5fd' }}>{sp.avgAlbedo}</b></span>
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
          <div className="panel" style={{ background: '#fffdf8', padding: 24, borderRadius: 12, border: '1px solid #dfd9cc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, margin: 0, color: '#2a2824' }}>Full Multi-Spectral Dataset Archive</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#77736b' }}>
                  Showing records for <strong>{activeLoc.name} ({selectedWard})</strong>. Total zone records: {zoneRecords.length}.
                </p>
              </div>

              {/* Year Filter */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#88837a', fontWeight: 600 }}>YEAR:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{
                    background: '#fffdf8',
                    color: '#2a2824',
                    border: '1px solid #dfd9cc',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 13
                  }}
                >
                  {ALL_YEARS.map(yr => (
                    <option key={yr} value={yr}>Year {yr}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8f4ee', color: '#3a3630' }}>
                    <th style={{ padding: '8px 10px' }}>Period</th>
                    <th style={{ padding: '8px 10px' }}>Month</th>
                    <th style={{ padding: '8px 10px' }}>Risk</th>
                    <th style={{ padding: '8px 10px' }}>Observed LST</th>
                    <th style={{ padding: '8px 10px', color: '#4ade80' }}>PINN Pred.</th>
                    <th style={{ padding: '8px 10px', color: '#fbbf24' }}>RF Pred.</th>
                    <th style={{ padding: '8px 10px' }}>Residual Error</th>
                    <th style={{ padding: '8px 10px' }}>NDVI</th>
                    <th style={{ padding: '8px 10px' }}>NDBI</th>
                    <th style={{ padding: '8px 10px' }}>NDWI</th>
                    <th style={{ padding: '8px 10px' }}>Albedo</th>
                    <th style={{ padding: '8px 10px' }}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {currentYearRecords.map((r, i) => (
                    <tr
                      key={`${r.yearMonth}-${i}`}
                      style={{
                        borderBottom: '1px solid #f0ece3',
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
                          color: r.riskLevel === 'HIGH' ? '#f87171' : r.riskLevel === 'MODERATE' ? '#fbbf24' : '#4ade80'
                        }}>
                          {r.riskLevel}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#f97316' }}>{r.avgLST.toFixed(1)}°C</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#4ade80' }}>{r.pinnPredictedLST.toFixed(1)}°C</td>
                      <td style={{ padding: '8px 10px', color: '#fbbf24' }}>{r.rfPredictedLST.toFixed(1)}°C</td>
                      <td style={{ padding: '8px 10px', color: Math.abs(r.residualError) < 0.4 ? '#4ade80' : '#f87171' }}>
                        {r.residualError >= 0 ? `+${r.residualError.toFixed(2)}` : r.residualError.toFixed(2)}°C
                      </td>
                      <td style={{ padding: '8px 10px', color: '#22c55e' }}>{r.ndvi.toFixed(3)}</td>
                      <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>{r.ndbi.toFixed(3)}</td>
                      <td style={{ padding: '8px 10px', color: '#60a5fa' }}>{r.ndwi.toFixed(3)}</td>
                      <td style={{ padding: '8px 10px', color: '#93c5fd' }}>{r.albedo.toFixed(3)}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, color: '#9b968d' }}>{r.monthDataSource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: PINN ANALYSIS ── */}
      {activeTab === 'pinnAnalysis' && (
        <div className="hist-section">
          <div className="panel" style={{ background: '#fffdf8', padding: 24, borderRadius: 12, border: '1px solid #dfd9cc' }}>
            <h2 style={{ fontSize: 18, margin: 0, color: '#2a2824' }}>Governing Physical Laws & PDE Formulations</h2>
            <p style={{ margin: '6px 0 20px', fontSize: 13, color: '#77736b' }}>
              Unlike black-box regressors, our PINN strictly enforces 4 foundational thermodynamic and heat conduction equations during model backpropagation.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {[
                {
                  title: '1. Surface Energy Balance PDE',
                  eq: '∂T/∂t = κ ∇²T + Q_solar(1 - α) - ε σ T⁴',
                  desc: 'Governs transient heat conduction through soil and concrete masses, balancing solar radiation against thermal emissivity.',
                  status: 'Enforced via Autograd Loss (λ=0.02)'
                },
                {
                  title: '2. Monotonic Vegetation Cooling',
                  eq: '∂(LST)/∂(NDVI) ≤ 0 (Strict Negative Slope)',
                  desc: 'Evapotranspiration by tree canopy and mangrove creek fringes is strictly enforced to cool land surface temperature.',
                  status: 'Enforced via ReLU Penalty (λ=0.08)'
                },
                {
                  title: '3. Built-up Impervious Thermal Mass',
                  eq: '∂(LST)/∂(NDBI) ≥ 0 (Strict Positive Slope)',
                  desc: 'Denser asphalt roads and concrete high-rises retain heat energy, monotonically driving higher surface thermal load.',
                  status: 'Enforced via ReLU Penalty (λ=0.08)'
                },
                {
                  title: '4. Stefan-Boltzmann Thermal Radiation',
                  eq: 'R_rad = ε · σ · (T_surface + 273.15)⁴',
                  desc: 'Governs nighttime cooling dissipation across the Ulhas River basin and Vasai Creek water corridor.',
                  status: 'Continuous Radiative Cooling Limit'
                }
              ].map(law => (
                <div key={law.title} style={{ background: '#fbf9f4', border: '1px solid #e8e2d8', borderRadius: 10, padding: 18 }}>
                  <h3 style={{ fontSize: 15, margin: '0 0 8px', color: '#e86631' }}>{law.title}</h3>
                  <div style={{ background: '#1e293b', padding: '10px 12px', borderRadius: 6, fontFamily: 'monospace', fontSize: 13, color: '#38bdf8', marginBottom: 10 }}>
                    {law.eq}
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#5f5b54', lineHeight: 1.5 }}>
                    {law.desc}
                  </p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: 4 }}>
                    ✓ {law.status}
                  </span>
                </div>
              ))}
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
    if (lst >= 40) return '#ef4444'
    if (lst >= 37) return '#f97316'
    if (lst >= 33) return '#f59e0b'
    if (lst >= 29) return '#22c55e'
    return '#60a5fa'
  }

  function riskBg(risk: string) {
    if (risk === 'HIGH') return { bg: 'rgba(239,68,68,0.15)', color: '#f87171' }
    if (risk === 'MODERATE') return { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' }
    return { bg: 'rgba(34,197,94,0.10)', color: '#4ade80' }
  }

  return (
    <div className="hist-section">
      <div className="panel" style={{ background: '#fffdf8', padding: 24, borderRadius: 12, border: '1px solid #dfd9cc' }}>
        <h2 style={{ fontSize: 18, margin: '0 0 4px', color: '#2a2824' }}>Precise LST Lookup · {activeLoc.name} ({selectedWard})</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#77736b' }}>
          Select a year and month to retrieve the exact observed Land Surface Temperature from the 2,304-record PINN dataset.
        </p>

        {/* Selectors */}
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
          background: '#f5efe4', padding: '16px 20px', borderRadius: 10, marginBottom: 24,
          border: '1px solid #e8e2d8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={16} style={{ color: '#e86631' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#77736b', letterSpacing: '0.06em' }}>YEAR</span>
            <select
              id="hist-lookup-year"
              value={selectedYear}
              onChange={e => onYearChange(Number(e.target.value))}
              style={{
                background: '#fffdf8', color: '#2a2824',
                border: '1px solid #dfd9cc',
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
            <Thermometer size={16} style={{ color: '#60a5fa' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#77736b', letterSpacing: '0.06em' }}>MONTH</span>
            <select
              id="hist-lookup-month"
              value={selectedMonth}
              onChange={e => onMonthChange(Number(e.target.value))}
              style={{
                background: '#fffdf8', color: '#2a2824',
                border: '1px solid #dfd9cc',
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
            marginLeft: 'auto', fontSize: 12, color: '#9b968d',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: allZones.length > 0 ? '#4ade80' : '#ef4444', display: 'inline-block' }} />
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
                <div style={{ fontSize: 11, fontWeight: 700, color: '#88837a', marginBottom: 4 }}>OBSERVED LST</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: lstColor(singleRecord.avgLST), lineHeight: 1 }}>
                  {singleRecord.avgLST.toFixed(1)}°C
                </div>
                <div style={{ fontSize: 12, color: '#88837a', marginTop: 6 }}>{monthName} {selectedYear} · {selectedWard}</div>
              </div>

              <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#88837a', marginBottom: 4 }}>PINN PREDICTED LST</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#4ade80', lineHeight: 1 }}>
                  {singleRecord.pinnPredictedLST.toFixed(1)}°C
                </div>
                <div style={{ fontSize: 12, color: '#88837a', marginTop: 6 }}>
                  Residual: {singleRecord.residualError >= 0 ? `+${singleRecord.residualError.toFixed(2)}` : singleRecord.residualError.toFixed(2)}°C
                </div>
              </div>

              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#88837a', marginBottom: 4 }}>RF PREDICTED LST</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
                  {singleRecord.rfPredictedLST.toFixed(1)}°C
                </div>
                <div style={{ fontSize: 12, color: '#88837a', marginTop: 6 }}>Statistical Baseline</div>
              </div>

              <div style={{ background: '#fbf9f4', border: '1px solid #e8e2d8', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#88837a', marginBottom: 10 }}>SPECTRAL INDICES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[['NDVI (Vegetation)', singleRecord.ndvi.toFixed(3), '#22c55e'],
                    ['NDBI (Built-up)', singleRecord.ndbi.toFixed(3), '#cbd5e1'],
                    ['NDWI (Water)', singleRecord.ndwi.toFixed(3), '#60a5fa'],
                    ['Albedo', singleRecord.albedo.toFixed(3), '#93c5fd']
                  ].map(([label, val, color]) => (
                    <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#77736b' }}>{label}</span>
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
              <span style={{ fontSize: 13, color: '#77736b' }}>Heat Risk Classification:</span>
              <strong style={{ fontSize: 14, color: riskBg(singleRecord.riskLevel).color }}>{singleRecord.riskLevel}</strong>
              <span style={{ fontSize: 12, color: '#9b968d' }}>· {singleRecord.monthDataSource}</span>
            </div>
          </>
        ) : (
          allZones.length === 0 && (
            <div style={{
              textAlign: 'center', padding: 40, color: '#9b968d',
              background: '#fffdf8', borderRadius: 10, marginBottom: 20
            }}>
              <Thermometer size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
              <p>No dataset records available for <strong style={{ color: '#2a2824' }}>{monthName} {selectedYear}</strong>.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Dataset covers Jan 2016 – Aug 2026.</p>
            </div>
          )
        )}

        {/* All-zones for the period */}
        {allZones.length > 0 && (
          <>
            <h3 style={{ fontSize: 15, margin: '0 0 12px', color: '#2a2824' }}>
              All 18 Zones · {monthName} {selectedYear}
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f4ee', color: '#5f5b54' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Ward</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Location</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Risk</th>
                    <th style={{ padding: '8px 12px', color: '#f97316' }}>Observed LST</th>
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
                        borderBottom: '1px solid #f0ece3',
                        background: r.ward === selectedWard ? 'rgba(232,102,49,0.1)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                      }}
                    >
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.ward}</td>
                      <td style={{ padding: '8px 12px', color: '#3a3630' }}>{r.location}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                          background: riskBg(r.riskLevel).bg, color: riskBg(r.riskLevel).color
                        }}>{r.riskLevel}</span>
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 800, color: lstColor(r.avgLST), fontSize: 14 }}>{r.avgLST.toFixed(1)}°C</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#4ade80' }}>{r.pinnPredictedLST.toFixed(1)}°C</td>
                      <td style={{ padding: '8px 12px', color: '#22c55e' }}>{r.ndvi.toFixed(3)}</td>
                      <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{r.ndbi.toFixed(3)}</td>
                      <td style={{ padding: '8px 12px', color: '#93c5fd' }}>{r.albedo.toFixed(3)}</td>
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
