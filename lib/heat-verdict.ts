// heat-verdict.ts - Generates risk verdict, ranked causes (NDVI/NDBI/LST), and multi-horizon precautions per zone.

export interface CityReference {
  lst: number
  ndvi: number
  ndbi: number
  spread: {
    lst: number
    ndvi: number
    ndbi: number
  }
}

// Default baseline references across Thane 18 zones
export const DEFAULT_CITY_REF: CityReference = {
  lst: 41.4,
  ndvi: 0.265,
  ndbi: 0.001,
  spread: {
    lst: 1.5,
    ndvi: 0.05,
    ndbi: 0.03,
  },
}

export interface ZoneInput {
  name: string
  lst: number
  ndvi: number
  ndbi: number
  pinnLst?: number
  zoneType?: string
  riskLevel?: string
  shap?: {
    ndvi?: number
    ndbi?: number
  }
}

export interface RankedCause {
  key: 'ndvi' | 'ndbi'
  label: string
  delta: number
  raises: boolean
  score: number
  text: string
  direction: 'risk-raising' | 'cooling-benefit'
}

export interface VerdictResult {
  zone: string
  tier: 'HIGH RISK' | 'MODERATE RISK' | 'LOW RISK'
  verdict: string
  causes: RankedCause[]
  allCauses: RankedCause[]
  primaryCause?: RankedCause
  plan: {
    short: string[]
    medium: string[]
    long: string[]
  }
  modelError: number | null
}

// Precautionary action matrix keyed by cause
export const VERDICT_ACTIONS = {
  ndvi: {
    short: [
      'Issue targeted hydration & shade advisories for 12–4 PM outdoor work and school hours.',
      'Deploy mobile canopy shades and misting fans at open transit corridors.',
    ],
    medium: [
      'Plant native street trees (Neem, Banyan, Jamun) and create pocket Miyawaki parks to raise NDVI toward city reference.',
      'Mandate rooftop green covers and vertical vegetation walls where ground footprint is limited.',
    ],
    long: [
      'Legislate minimum 25% green-cover surface ratio in new residential and commercial redevelopment bylaws.',
    ],
  },
  ndbi: {
    short: [
      'Open emergency municipal cooling shelters and potable drinking-water points near dense built-up blocks.',
      'Deploy daytime evaporative water-sprinkling on high-heat commercial pavements.',
    ],
    medium: [
      'Retrofit high-albedo cool roofs (SRI > 105) on dense concrete blocks, municipal schools, and slum settlements.',
      'Replace heat-trapping asphalt on secondary walkways with light-coloured, porous interlocking pavers.',
    ],
    long: [
      'Enforce urban canyon airflow standards; cap impervious built-up density growth in heat-trap valley corridors.',
    ],
  },
  lst: {
    short: [
      'Activate red-alert health emergency protocols; prioritize outreach to elderly residents, children, and daily-wage laborers.',
      'Coordinate with Thane civil hospital for dedicated heatstroke management beds.',
    ],
    medium: [
      'Establish permanent shaded pedestrian transit networks between railway terminals and high-density markets.',
    ],
    long: [
      'Formulate comprehensive Ward-level Climate Action Plans with physical surface energy balance mitigation benchmarks.',
    ],
  },
}

export const CAUSE_LABELS: Record<'lst' | 'ndvi' | 'ndbi', string> = {
  lst: 'Land Surface Temperature',
  ndvi: 'Vegetation Deficit (NDVI)',
  ndbi: 'Built-up Density (NDBI)',
}

/**
 * Generates explainable AI verdict, ranked drivers, and short/medium/long term precautions.
 */
export function generateVerdict(
  zone: ZoneInput,
  ref: CityReference = DEFAULT_CITY_REF
): VerdictResult {
  const dLst = zone.lst - ref.lst

  // Determine tier: match explicit dataset riskLevel if provided, otherwise evaluate vs city mean
  let tier: 'HIGH RISK' | 'MODERATE RISK' | 'LOW RISK' = 'LOW RISK'
  if (zone.riskLevel) {
    const rUpper = zone.riskLevel.toUpperCase()
    if (rUpper.includes('HIGH') || rUpper.includes('CRITICAL')) tier = 'HIGH RISK'
    else if (rUpper.includes('MOD') || rUpper.includes('WATCH')) tier = 'MODERATE RISK'
    else tier = 'LOW RISK'
  } else {
    if (dLst >= 2.0) tier = 'HIGH RISK'
    else if (dLst >= 0.5) tier = 'MODERATE RISK'
    else tier = 'LOW RISK'
  }

  // Risk-raising directional logic:
  // Low NDVI (dNdvi < 0) raises heat risk (lack of evaporative cooling).
  // High NDBI (dNdbi > 0) raises heat risk (impervious thermal mass retention).
  const dNdvi = zone.ndvi - ref.ndvi
  const dNdbi = zone.ndbi - ref.ndbi

  const allCauses: RankedCause[] = [
    {
      key: 'ndvi',
      label: CAUSE_LABELS.ndvi,
      delta: dNdvi,
      raises: dNdvi < 0,
      score: zone.shap?.ndvi ?? Math.abs(dNdvi) / (ref.spread.ndvi || 0.05),
      direction: dNdvi < 0 ? 'risk-raising' : 'cooling-benefit',
      text: `NDVI ${zone.ndvi.toFixed(3)} vs city ref ${ref.ndvi.toFixed(3)} (${dNdvi >= 0 ? '+' : ''}${dNdvi.toFixed(3)}): ${
        dNdvi < 0
          ? 'sparse tree canopy and green cover reduces evapotranspiration cooling, elevating thermal buildup.'
          : 'vegetation canopy is above reference, providing natural evapotranspirative cooling relief.'
      }`,
    },
    {
      key: 'ndbi',
      label: CAUSE_LABELS.ndbi,
      delta: dNdbi,
      raises: dNdbi > 0,
      score: zone.shap?.ndbi ?? Math.abs(dNdbi) / (ref.spread.ndbi || 0.03),
      direction: dNdbi > 0 ? 'risk-raising' : 'cooling-benefit',
      text: `NDBI ${zone.ndbi.toFixed(3)} vs city ref ${ref.ndbi.toFixed(3)} (${dNdbi >= 0 ? '+' : ''}${dNdbi.toFixed(3)}): ${
        dNdbi > 0
          ? 'dense impervious concrete, asphalt, and metal roofs trap solar heat and re-radiate it continuously.'
          : 'built-up density is at or below reference, minimizing impervious thermal mass entrapment.'
      }`,
    },
  ]

  // Filter only drivers that raise heat risk, then sort descending by impact score
  const causes = allCauses
    .filter((c) => c.raises)
    .sort((a, b) => b.score - a.score)

  const primary = causes[0]

  const verdict =
    `${zone.name} is classified as ${tier} based on a Land Surface Temperature of ` +
    `${zone.lst.toFixed(1)}°C (${dLst >= 0 ? '+' : ''}${dLst.toFixed(1)}°C vs the 18-zone city mean of ${ref.lst.toFixed(1)}°C). ` +
    (primary
      ? `The primary urban heat driver is ${primary.label.toLowerCase()}. ` +
        (causes.length > 1
          ? causes.slice(1).map((c) => `${c.label} further amplifies the thermal load.`).join(' ')
          : '')
      : 'Both vegetation and built-up indices reflect protective levels; microclimate remains cushioned by natural or water boundaries.')

  // Multi-tier precautions
  const keys: ('ndvi' | 'ndbi' | 'lst')[] = [
    ...causes.map((c) => c.key),
    ...(tier === 'HIGH RISK' ? (['lst'] as const) : []),
  ]

  const plan: { short: string[]; medium: string[]; long: string[] } = {
    short: [],
    medium: [],
    long: [],
  }

  // De-duplicate actions
  keys.forEach((k) => {
    VERDICT_ACTIONS[k].short.forEach((act) => {
      if (!plan.short.includes(act)) plan.short.push(act)
    })
    VERDICT_ACTIONS[k].medium.forEach((act) => {
      if (!plan.medium.includes(act)) plan.medium.push(act)
    })
    VERDICT_ACTIONS[k].long.forEach((act) => {
      if (!plan.long.includes(act)) plan.long.push(act)
    })
  })

  // If low risk zone with zero risk-raising causes, ensure proactive protection plan
  if (plan.short.length === 0 && plan.medium.length === 0) {
    plan.short.push('Maintain regular hydration posts along waterfront and peripheral transit stops.')
    plan.medium.push('Preserve existing tree canopy, Sanjay Gandhi National Park buffer, and creek mangroves.')
    plan.long.push('Enforce strict zoning to prevent encroachment into natural microclimate cooling buffers.')
  }

  return {
    zone: zone.name,
    tier,
    verdict,
    causes,
    allCauses,
    primaryCause: primary,
    plan,
    modelError: zone.pinnLst != null ? Number(Math.abs(zone.pinnLst - zone.lst).toFixed(2)) : null,
  }
}
