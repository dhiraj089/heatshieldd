'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Menu,
  X,
  Play,
  ArrowRight,
  ShieldCheck,
  Flame,
  Wind,
  CloudRain,
  Activity,
  BarChart3,
  Layers3,
  Radio,
  SlidersHorizontal,
  ShieldAlert,
  Gauge,
  Sparkles,
  MapPin,
  ChevronDown,
  Check,
  Zap,
  Cpu,
  Globe,
  Server,
  Database,
  Thermometer,
  TreePine,
  TrendingDown,
  Building,
} from 'lucide-react'
import DashboardApp, { THANE_LOCATIONS, type ThaneLocation, type LiveWeatherData } from '@/components/DashboardApp'
export { THANE_LOCATIONS, type ThaneLocation, type LiveWeatherData }

const IntroAnimation = dynamic(() => import('@/components/IntroAnimation'), { ssr: false })

const landingNavCategories = [
  {
    category: 'ANALYTICS & FORECAST',
    items: [
      { label: 'Analytics', icon: BarChart3, badge: 'Live Telemetry' },
      { label: 'Historical', icon: Activity, badge: '10-Yr Records' },
    ],
  },
  {
    category: 'GEOSPATIAL VIEWS',
    items: [
      { label: 'Heat Map', icon: Layers3, badge: '3D Spatial Mesh' },
      { label: 'Thane Live', icon: Radio, badge: 'Live Stream' },
    ],
  },
  {
    category: 'ENVIRONMENTAL HAZARDS',
    items: [
      { label: 'Air Quality', icon: Wind, badge: 'AQI Index' },
      { label: 'Rainfall', icon: CloudRain, badge: 'Precipitation' },
    ],
  },
  {
    category: 'ACTION & INTELLIGENCE',
    items: [
      { label: 'Intervention Plan', icon: SlidersHorizontal, badge: 'AI Budget' },
      { label: 'Zone Analysis', icon: ShieldAlert, badge: 'HHI Scoring' },
      { label: 'Model', icon: Gauge, badge: 'PINN Engine' },
      { label: 'Architecture', icon: Sparkles, badge: 'Zero-Loss' },
    ],
  },
]

export default function LandingPage() {
  const [showIntro, setShowIntro] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedWard, setSelectedWard] = useState<ThaneLocation>(THANE_LOCATIONS[1]) // Mumbra (Ward 02)
  const [wardDropdownOpen, setWardDropdownOpen] = useState(false)

  // If a menu option is selected, render just that menu option page on the same page with top-left Back button
  if (activeSection) {
    return (
      <DashboardApp
        initialActive={activeSection}
        hideSidebar={true}
        showIntroOnMount={false}
        onBack={() => setActiveSection(null)}
      />
    )
  }

  return (
    <>
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}

      <div className="landing-root">
        {/* Slide-over Menu Drawer (2nd Screenshot Left Menu) */}
        {drawerOpen && (
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
            <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <div className="brand-left">
                  <div className="brand-mark"><span /></div>
                  <div className="brand-text">
                    <strong>HEAT<span>SHIELD</span></strong>
                    <small>THANE CITY</small>
                  </div>
                </div>
                <button
                  className="drawer-close-btn"
                  onClick={() => setDrawerOpen(false)}
                  title="Close Menu"
                  aria-label="Close Menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Monitored Ward Card */}
              <div className="workspace-container">
                <button
                  className="workspace"
                  onClick={() => setWardDropdownOpen(!wardDropdownOpen)}
                  title={`Selected Ward: ${selectedWard.name} (${selectedWard.zoneNumber})`}
                  type="button"
                >
                  <span className="live-dot" />
                  <span className="workspace-label">
                    <strong>{selectedWard.name}</strong>
                    <small>{selectedWard.zoneNumber}</small>
                  </span>
                  <ChevronDown size={14} className={`chevron ${wardDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {wardDropdownOpen && (
                  <div className="workspace-dropdown">
                    <div className="dropdown-title">Select Thane Ward ({THANE_LOCATIONS.length} Locations)</div>
                    <div className="dropdown-list">
                      {THANE_LOCATIONS.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          className={`dropdown-item ${loc.id === selectedWard.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedWard(loc)
                            setWardDropdownOpen(false)
                          }}
                        >
                          <MapPin size={12} className="loc-pin" />
                          <div className="item-details">
                            <span className="item-name">{loc.name}</span>
                            <span className="item-ward">{loc.zoneNumber} · {loc.type}</span>
                          </div>
                          {loc.id === selectedWard.id && <Check size={14} className="check-icon" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Categorized Navigation Options opening on the SAME PAGE */}
              <nav className="sidebar-nav-groups">
                {landingNavCategories.map((group) => (
                  <div key={group.category} className="nav-group">
                    <div className="nav-group-title">{group.category}</div>
                    {group.items.map(({ label, icon: Icon, badge }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setActiveSection(label)
                          setDrawerOpen(false)
                        }}
                        className={`nav-item-btn ${activeSection === label ? 'active' : ''}`}
                        title={`View ${label}`}
                      >
                        <Icon size={18} className="nav-icon" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </nav>

              <div className="drawer-footer-note">
                <small>Select any section to open it directly on this page.</small>
              </div>
            </div>
          </div>
        )}

        {/* Top Navbar */}
        <header className="landing-header">
          {/* Top Left: Menu Button */}
          <div className="landing-header-left">
            <button
              className="landing-menu-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
              <span>Menu</span>
            </button>
            <div className="live-status-pill">
              <span className="live-dot pulse" />
              <span>Thane Network Online</span>
            </div>
          </div>

          {/* Center: HeatShield Logo */}
          <div className="landing-brand-center">
            <div className="brand-mark"><span /></div>
            <div className="brand-text">
              <strong>HEAT<span>SHIELD</span></strong>
              <small>THANE CITY</small>
            </div>
          </div>

          {/* Top Right Corner */}
          <div className="landing-header-right">
            <button
              type="button"
              onClick={() => setActiveSection('Analytics')}
              className="landing-launch-btn"
            >
              <span>Launch Portal</span>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="landing-hero-section">
          <div className="hero-glow-orb" />
          <div className="hero-container">
            <div className="hero-pill-badge">
              <Zap size={14} className="text-orange" />
              <span>PHYSICS-INFORMED NEURAL NETWORK · THANE CIVIC CLIMATE SHIELD</span>
            </div>

            <h1 className="hero-headline">
              Next-Gen Urban Heat Island Defense for <span className="gradient-text">Thane City</span>.
            </h1>

            <p className="hero-subtext">
              Harnessing thermodynamic Navier-Stokes physics solvers (PINN), high-resolution satellite remote sensing,
              and 18-ward IoT telemetry to forecast microclimate heatwaves and deploy life-saving cooling interventions.
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                onClick={() => setActiveSection('Analytics')}
                className="hero-primary-btn"
              >
                <BarChart3 size={18} />
                <span>Open Analytics Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('Heat Map')}
                className="hero-secondary-btn"
              >
                <Layers3 size={18} />
                <span>Explore 3D Heat Map</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('Intervention Plan')}
                className="hero-tertiary-btn"
              >
                <SlidersHorizontal size={18} />
                <span>Intervention Planner</span>
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="hero-metrics-grid">
              <div className="metric-box">
                <span className="metric-num">18</span>
                <span className="metric-label">Monitored Wards</span>
                <small>Kopri to Owale Waterfront</small>
              </div>
              <div className="metric-box">
                <span className="metric-num">0.042°C</span>
                <span className="metric-label">PINN Model RMSE</span>
                <small>Governed by Thermodynamics</small>
              </div>
              <div className="metric-box">
                <span className="metric-num">10-Year</span>
                <span className="metric-label">Historical Records</span>
                <small>2015 – 2025 Calibrated Data</small>
              </div>
              <div className="metric-box">
                <span className="metric-num">3.6°C</span>
                <span className="metric-label">Max Microclimate Offset</span>
                <small>Severe Trapping in Shilphata</small>
              </div>
              <div className="metric-box">
                <span className="metric-num">100%</span>
                <span className="metric-label">Live Ingress Telemetry</span>
                <small>Open-Meteo & Ground IoT</small>
              </div>
            </div>
          </div>
        </section>

        {/* Project Information Below Hero */}
        <section className="landing-info-section">
          <div className="info-container">
            {/* Context & Problem Statement */}
            <div className="info-block">
              <div className="section-eyebrow">THE CIVIC CHALLENGE</div>
              <h2 className="section-title">The Urban Heat Island Phenomenon in Thane</h2>
              <p className="section-description">
                Thane City is characterized by complex topological diversity — from the coastal marshes of Kopri and Gaimukh
                to the enclosed thermal basin of Mumbra, the industrial heat sinks of Wagle Estate, and the Sanjay Gandhi National Park foothills.
                Dense concrete structures and arterial transit corridors trap solar radiation, creating microclimates that elevate surface temperatures
                up to <strong>3.6°C above rural baselines</strong>.
              </p>
            </div>

            {/* 4 Core Technological Pillars */}
            <div className="pillars-grid">
              <div className="pillar-card">
                <div className="pillar-icon-box orange">
                  <Cpu size={24} />
                </div>
                <h3>PINN Physics-Informed Engine</h3>
                <p>
                  Unlike standard black-box machine learning that hallucinates impossible temperatures, our architecture enforces
                  the Navier-Stokes fluid equations and 2D thermodynamic heat advection-diffusion directly into the neural loss function.
                </p>
                <div className="pillar-footer">
                  <button
                    type="button"
                    onClick={() => setActiveSection('Model')}
                    className="pillar-link"
                  >
                    <span>Explore PINN Model →</span>
                  </button>
                </div>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon-box blue">
                  <Radio size={24} />
                </div>
                <h3>18-Ward Real-Time Telemetry</h3>
                <p>
                  Live sensor data streams ingest ambient temperature, relative humidity, wind vectors, UV indices, and air quality
                  across all civic administrative zones with sub-second synchronization and automated fallback.
                </p>
                <div className="pillar-footer">
                  <button
                    type="button"
                    onClick={() => setActiveSection('Thane Live')}
                    className="pillar-link"
                  >
                    <span>View Thane Live Feed →</span>
                  </button>
                </div>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon-box red">
                  <ShieldAlert size={24} />
                </div>
                <h3>Heat Health Index (HHI)</h3>
                <p>
                  Citizen-centric vulnerability stratification blends LST with population density, tree canopy ratios, and elderly demographic factors
                  to triage civic wards into Critical, Watch, and Normal thermal alerts.
                </p>
                <div className="pillar-footer">
                  <button
                    type="button"
                    onClick={() => setActiveSection('Zone Analysis')}
                    className="pillar-link"
                  >
                    <span>Inspect Zone Analysis →</span>
                  </button>
                </div>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon-box green">
                  <TreePine size={24} />
                </div>
                <h3>Cooling Intervention Optimizer</h3>
                <p>
                  Algorithmic municipal budgeting tool calculates optimal combinations of high-albedo cool roofs, urban misting corridors,
                  and Miyawaki urban forest buffers to achieve measurable -3.0°C microclimate temperature reductions.
                </p>
                <div className="pillar-footer">
                  <button
                    type="button"
                    onClick={() => setActiveSection('Intervention Plan')}
                    className="pillar-link"
                  >
                    <span>Simulate Cooling Budgets →</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Ward Telemetry Explorer Preview */}
            <div className="ward-preview-panel">
              <div className="panel-header-row">
                <div>
                  <div className="section-eyebrow">MONITORED JURISDICTION</div>
                  <h3>Active Microclimate Zones ({THANE_LOCATIONS.length} Wards)</h3>
                  <p>Click any ward to launch its full analytics telemetry.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('Analytics')}
                  className="view-all-link"
                >
                  <span>Open Full Matrix →</span>
                </button>
              </div>

              <div className="ward-pill-cards">
                {THANE_LOCATIONS.slice(0, 8).map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setActiveSection('Analytics')}
                    className="ward-landing-card"
                    title={`View analytics for ${loc.name}`}
                  >
                    <div className="ward-card-top">
                      <span className="ward-tag">{loc.zoneNumber}</span>
                      <span className={`vuln-badge ${loc.vulnerability.toLowerCase()}`}>{loc.vulnerability}</span>
                    </div>
                    <h4>{loc.name}</h4>
                    <p>{loc.type}</p>
                    <div className="ward-card-footer">
                      <span className="lst-label">LST Offset: <strong>+{loc.lstOffset}°C</strong></span>
                      <span className="action-hint">Telemetry →</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Architecture Specs */}
            <div className="tech-stack-panel">
              <div className="section-eyebrow">ENTERPRISE CIVIC INFRASTRUCTURE</div>
              <h2 className="section-title">Built for High Availability & Zero Latency</h2>
              <div className="tech-grid">
                <div className="tech-item">
                  <div className="tech-icon"><Server size={22} /></div>
                  <strong>Multi-AZ Kafka Pipelines</strong>
                  <p>In-situ ground sensor ingestion replicated across 3 independent availability zones with 7-day replay buffers.</p>
                </div>
                <div className="tech-item">
                  <div className="tech-icon"><Cpu size={22} /></div>
                  <strong>ONNX Tensor Runtime</strong>
                  <p>Compiled neural physics kernels executing sub-8ms forward inferences for real-time 3D thermal maps.</p>
                </div>
                <div className="tech-item">
                  <div className="tech-icon"><Globe size={22} /></div>
                  <strong>Open-Meteo & Sentinel Satellites</strong>
                  <p>Hourly solar flux, surface radiation, and aerosol optical depth synchronization with automated fallbacks.</p>
                </div>
                <div className="tech-item">
                  <div className="tech-icon"><ShieldCheck size={22} /></div>
                  <strong>mTLS Hardware Cryptography</strong>
                  <p>Secure element certificate validation preventing adversarial telemetry injection into civic heat models.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Landing Page Footer */}
        <footer className="landing-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="brand-mark"><span /></div>
              <div>
                <strong>HEAT<span>SHIELD</span></strong>
                <small>THANE CITY ENVIRONMENTAL MONITORING NETWORK</small>
              </div>
            </div>
            <div className="footer-coords">
              <span>Civic Core: 19.1865° N, 72.9758° E · WGS84</span>
              <span>Model Ingress: TMC Disaster Management Cell</span>
            </div>
          </div>
          <div className="footer-subline">
            <p>© 2026 HEATSHIELD · Designed for Thane Municipal Corporation & Urban Climate Resilience.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
