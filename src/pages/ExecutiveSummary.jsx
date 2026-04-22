import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { TrendingUp, FlaskConical, Cpu, DollarSign, Radio, Check, X as XIcon } from 'lucide-react'
import { PageShell, KpiCard } from '@/components/layout/PageShell'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Card, CardHeader, CardBody } from '@/components/shared/Card'
import { DrillDownPanel } from '@/components/shared/DrillDownPanel'
import { useBrand } from '@/context/BrandContext'
import { resolveChartData, timelineTag, darken } from '@/utils/chartUtils'
import { DEFAULT_PALETTE } from '@/config/palettes'

const SIGNAL_ICONS = { TrendingUp, FlaskConical, Cpu, DollarSign, Radio }
const PRIMARY_COLOR = '#5f39f8'

// Pharma-inspired pastel bg + saturated icon color per signal icon type
const SIGNAL_ICON_COLORS = {
  TrendingUp:   { bg: '#dbeafe', icon: '#1e40af' }, // clinical blue
  FlaskConical: { bg: '#ccfbf1', icon: '#0f766e' }, // mint / research teal
  Cpu:          { bg: '#ede9fe', icon: '#5b21b6' }, // soft violet / digital health
  DollarSign:   { bg: '#dcfce7', icon: '#15803d' }, // medical green
  Radio:        { bg: '#fce7f3', icon: '#9d174d' }, // pharma rose / DTC
}

const TAG_STYLES = {
  red:   'bg-red-50 text-red-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-teal-50 text-amber-600',
}


export default function ExecutiveSummary() {
  const { data, tokens } = useBrand()
  const d = data.executiveSummary
  const DD = d.drillDown
  const [panel, setPanel] = useState(null)

  // Palette-driven colors
  const smColor = tokens.smColor || DEFAULT_PALETTE.smColor
  const tmColor = tokens.tmColor || DEFAULT_PALETTE.tmColor

  const openPanel = useCallback((e, ddKey, color) => {
    const dd = DD[ddKey]
    if (!dd) { console.warn(`[DrillDown] No entry for ddKey "${ddKey}" in executiveSummary.drillDown`); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setPanel({
      ...dd,
      color,
      x: rect.left + rect.width / 2 - 210,
      y: rect.bottom + 10,
    })
  }, [])

  const closePanel = useCallback(() => setPanel(null), [])

  const topRow = (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-white tracking-tight">{d.title}</h1>
          {d.heroPill && (
            <span className="shrink-0 mt-1 text-[0.6875rem] font-semibold text-white px-3 py-1 rounded-full" style={{ background: 'none', backdropFilter: 'none', border: 'none' }}>
              {d.heroPill}
            </span>
          )}
        </div>
        <p className="text-[0.8125rem] mt-1" style={{color: "rgba(255,255,255,0.85)"}}>{d.subtitle}</p>
      </motion.div>

      <div className="mt-[2rem]" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px' }}>
        {d.kpis.map((kpi, i) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            onClick={(e) => openPanel(e, kpi.ddKey, '#1d4ed8')}
            className={kpi.ddKey ? 'cursor-pointer' : 'cursor-default'}
          >
            <KpiCard {...kpi} />
          </motion.div>
        ))}
      </div>
    </>
  )

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    )
  }

  // Smart X-axis: auto-detect granularity using resolveChartData
  const { data: smVolData, xKey: smVolXKey } = resolveChartData(d.smVolChart)
  const { data: tmVolData, xKey: tmVolXKey } = resolveChartData(d.tmVolChart)

  return (
    <>
      <PageShell topRow={topRow}>

        {/* ── VOLUME TREND OVERVIEW ── */}
        <SectionHeading title={d.volumeTrendSection} tag={timelineTag(smVolXKey)} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* SM Volume — Area chart */}
          <Card>
            <CardHeader
              title={d.smVolChart.title}
              subtitle={d.smVolChart.subtitle}
            />
            <CardBody>
              <div
                className="cursor-pointer"
                onClick={(e) => openPanel(e, d.smVolChart.ddKey, smColor)}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={smVolData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="smGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={smColor} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={smColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey={smVolXKey} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone" dataKey="posts" name="Posts"
                      stroke={smColor} strokeWidth={2}
                      fill="url(#smGrad)"
                      animationDuration={1200} animationEasing="ease-out"
                      dot={{ r: 4, fill: smColor, strokeWidth: 0 }}
                      activeDot={{ r: 5, cursor: 'pointer' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {d.smVolChart.takeaway && (
                <div className="mt-3 text-[0.6875rem] border-l-2 rounded-r-md px-3 py-2 leading-relaxed" style={{ color: darken(smColor), backgroundColor: smColor + '0D', borderColor: smColor }}>
                  {d.smVolChart.takeaway}
                </div>
              )}
            </CardBody>
          </Card>

          {/* TM Volume — Area chart */}
          <Card>
            <CardHeader
              title={d.tmVolChart.title}
              subtitle={d.tmVolChart.subtitle}
            />
            <CardBody>
              <div
                className="cursor-pointer"
                onClick={(e) => openPanel(e, d.tmVolChart.ddKey, tmColor)}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={tmVolData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tmGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={tmColor} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={tmColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey={tmVolXKey} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone" dataKey="articles" name="Articles"
                      stroke={tmColor} strokeWidth={2}
                      fill="url(#tmGrad)"
                      animationDuration={1200} animationEasing="ease-out"
                      dot={{ r: 4, fill: tmColor, strokeWidth: 0 }}
                      activeDot={{ r: 5, cursor: 'pointer' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {d.tmVolChart.takeaway && (
                <div className="mt-3 text-[0.6875rem] border-l-2 rounded-r-md px-3 py-2 leading-relaxed" style={{ color: darken(tmColor), backgroundColor: tmColor + '0D', borderColor: tmColor }}>
                  {d.tmVolChart.takeaway}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* ── KEY SIGNALS ── */}
        <SectionHeading title="Key Signals" tag="What's driving conversation" />
        <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {d.signals.map((sig, idx) => {
            const iconColors = SIGNAL_ICON_COLORS[sig.icon] || { bg: '#f1f5f9', icon: '#475569' }
            return (
              <motion.div
                key={sig.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={(e) => openPanel(e, sig.ddKey, '#1d4ed8')}
                className="flex flex-col gap-3 p-4 rounded-lg border border-slate-200 bg-white hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="p-2 rounded-md shrink-0 w-8 h-8 flex items-center justify-center" style={{ background: iconColors.bg }}>
                  <span className="text-[0.6875rem] font-bold leading-none" style={{ color: iconColors.icon }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.8125rem] font-semibold text-slate-800">{sig.title}</p>
                  <p className="text-[0.6875rem] text-slate-500 mt-0.5 leading-relaxed">{sig.desc}</p>
                  <span className={`inline-block mt-1.5 text-[0.5625rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${TAG_STYLES[sig.tagColor]}`}>
                    {sig.tag}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* ── WHAT'S WORKING / NOT WORKING ── */}
        <SectionHeading title="What's Working / Not Working" tag={d.badge || d.heroPill || 'Current Period'} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          <Card>
            <CardHeader title="What's Working" />
            <CardBody>
              <ul className="space-y-3">
                {d.workingItems.working.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 cursor-pointer group"
                    onClick={(e) => openPanel(e, d.workingItems.ddKey, '#059669')}
                  >
                    <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </span>
                    <span className="text-[0.8125rem] text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="What's Not Working" />
            <CardBody>
              <ul className="space-y-3">
                {d.workingItems.notWorking.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 cursor-pointer group"
                    onClick={(e) => openPanel(e, d.workingItems.notWorkingDdKey, '#dc2626')}
                  >
                    <span className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center shrink-0 mt-0.5">
                      <XIcon className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </span>
                    <span className="text-[0.8125rem] text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        {/* ── RISKS & OPPORTUNITIES ── */}
        <SectionHeading title="Risks & Opportunities" tag={d.badge || d.heroPill || 'Current Period'} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          <Card>
            <CardHeader title="Risks" />
            <CardBody>
              <ul className="space-y-3">
                {d.risksOpportunities.risks.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 pb-3 border-b border-slate-100 last:border-0 last:pb-0 cursor-pointer group"
                    onClick={(e) => openPanel(e, d.risksOpportunities.risksDdKey, '#dc2626')}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${item.color === 'red' ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <span className="text-[0.8125rem] text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">{item.text}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Opportunities" />
            <CardBody>
              <ul className="space-y-3">
                {d.risksOpportunities.opportunities.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 pb-3 border-b border-slate-100 last:border-0 last:pb-0 cursor-pointer group"
                    onClick={(e) => openPanel(e, d.risksOpportunities.oppsDdKey, '#059669')}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1.5 bg-green-400" />
                    <span className="text-[0.8125rem] text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">{item.text}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

      </PageShell>

      <DrillDownPanel panel={panel} onClose={closePanel} />
    </>
  )
}
