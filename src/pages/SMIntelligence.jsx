import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { PageShell, KpiCard } from '@/components/layout/PageShell'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Card, CardHeader, CardBody } from '@/components/shared/Card'
import { DrillDownPanel } from '@/components/shared/DrillDownPanel'
import { useBrand } from '@/context/BrandContext'
import { CARD_H, CARD_H_MD } from '@/config/dashboard'
import { resolveChartData, darken } from '@/utils/chartUtils'
import { DEFAULT_PALETTE } from '@/config/palettes'


function CustomTooltip({ active, payload, label }) {
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

function InsightBullets({ insights }) {
  if (!insights?.length) return null
  return (
    <ul className="space-y-1.5 mt-3">
      {insights.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[0.6875rem] text-slate-600 leading-relaxed">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0 mt-[0.35rem]"
            style={{ background: item.type === 'amber' ? '#f59e0b' : '#64748b' }}
          />
          {item.text}
        </li>
      ))}
    </ul>
  )
}

const PRIMARY_COLOR = '#5f39f8'

// ─── Platform color overrides ─────────────────────────────────────────────────
// Keys are matched case-insensitively against the platform name in the data.
// These take priority over both entry.color in the bundle and the chart palette.
const PLATFORM_COLORS = {
  'x/twitter':  '#1DA1F2',
  'twitter':    '#1DA1F2',
  'x':          '#1DA1F2',
  'tiktok':     '#10DACB',
  'instagram':  '#D9006C',
  'facebook':   '#1877F2',
  'linkedin':   '#0A66C2',
  'youtube':    '#FF3B30',
  'video':      '#FF3B30',
  'pinterest':  '#E60023',
  'snapchat':   '#FFFC00',
  'reddit':     '#FF4500',
  'threads':    '#000000',
  'radio':      '#F59E0B',
  'podcast':    '#8B5CF6',
  'blog':       '#14B8A6',
}

/** Returns the override color for a platform name, or null if none defined. */
function platformColor(name) {
  if (!name) return null
  return PLATFORM_COLORS[name.toLowerCase()] ?? null
}

export default function SMIntelligence({ activeSection }) {
  const { data, tokens } = useBrand()
  const d = data.smIntelligence
  const DD = d.drillDown
  const [panel, setPanel] = useState(null)

  // Palette-driven colors (fall back to default if not set)
  const smColor     = tokens.smColor     || DEFAULT_PALETTE.smColor
  const chartColors = tokens.chartColors || DEFAULT_PALETTE.chartColors

  // Smart timeline: auto-detect granularity from data
  const { data: volData, xKey: volXKey } = resolveChartData(d.volTrendChart)

  useEffect(() => {
    if (!activeSection) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const el = document.getElementById(activeSection)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activeSection])

  const openPanel = useCallback((e, ddKey, color) => {
    const dd = DD[ddKey]
    if (!dd) { console.warn(`[DrillDown] No entry for ddKey "${ddKey}" in smIntelligence.drillDown`); return }
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
            onClick={(e) => openPanel(e, kpi.ddKey, smColor)}
            className={kpi.ddKey ? 'cursor-pointer' : 'cursor-default'}
          >
            <KpiCard {...kpi} />
          </motion.div>
        ))}
      </div>
    </>
  )

  return (
    <>
      <PageShell topRow={topRow}>

        {/* ── AWARENESS & VISIBILITY ── */}
        <div id="sm-awareness" className="scroll-mt-4">
        <SectionHeading title="Awareness & Visibility" tag="SM · Volume" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* Post Volume Trend */}
          <Card className="flex flex-col" style={{ height: CARD_H }}>
            <CardHeader
              title={d.volTrendChart.title}
              subtitle={d.volTrendChart.subtitle}
            />
            <CardBody className="flex-1 flex flex-col">
              <div className="cursor-pointer flex-1" onClick={(e) => openPanel(e, d.volTrendChart.ddKey, smColor)}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="smVolGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={smColor} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={smColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey={volXKey} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone" dataKey="posts" name="Posts"
                      stroke={smColor} strokeWidth={2}
                      fill="url(#smVolGrad)"
                      animationDuration={1200} animationEasing="ease-out"
                      dot={{ r: 4, fill: smColor, strokeWidth: 0 }}
                      activeDot={{ r: 5, cursor: 'pointer' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {d.volTrendChart.takeaway && (
                <div className="mt-auto pt-3 text-[0.6875rem] border-l-2 rounded-r-md px-3 py-2 leading-relaxed" style={{ color: darken(smColor), backgroundColor: smColor + '0D', borderColor: smColor }}>
                  {d.volTrendChart.takeaway}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Platform Contribution to Volume — Doughnut */}
          <Card className="flex flex-col" style={{ height: CARD_H }}>
            <CardHeader
              title={d.platformVolChart.title}
              subtitle={d.platformVolChart.subtitle}
            />
            <CardBody className="flex-1 flex flex-col">
              <div
                className="cursor-pointer flex-1 flex"
                onClick={(e) => openPanel(e, d.platformVolChart.ddKey, smColor)}
              >
                {/* Doughnut — 50% width */}
                <div className="w-1/2 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={d.platformVolChart.data}
                        cx="50%" cy="50%"
                        innerRadius="52%" outerRadius="78%"
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        strokeWidth={0}
                        animationDuration={1000}
                      >
                        {d.platformVolChart.data.map((entry, i) => (
                          <Cell key={i} fill={platformColor(entry.name) || entry.color || chartColors[i % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, name) => [v.toLocaleString(), name]}
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend — 50% width */}
                <div className="w-1/2 flex flex-col justify-center pl-3 divide-y divide-slate-100">
                  {d.platformVolChart.data.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[0.6875rem] py-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: platformColor(item.name) || item.color || chartColors[i % chartColors.length] }} />
                      <span className="flex-1 text-slate-600 truncate">{item.name}</span>
                      <span className="font-semibold text-slate-800 tabular-nums hidden sm:block">{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <InsightBullets insights={d.platformVolChart.insights} />
            </CardBody>
          </Card>
        </div>

        </div>{/* end sm-awareness */}

        {/* ── SENTIMENT & PERCEPTION ── */}
        <div id="sm-sentiment" className="scroll-mt-4">
        <SectionHeading title="Sentiment & Perception" tag="SM · Sentiment" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

          {/* Sentiment Distribution — wide card (2 cols) */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col" style={{ height: CARD_H_MD }}>
              <CardHeader
                title={d.sentimentChart.title}
                subtitle={d.sentimentChart.subtitle}
              />
              <CardBody className="flex-1 flex flex-col overflow-hidden">
                <div className="cursor-pointer flex-1 flex flex-col" onClick={(e) => openPanel(e, d.sentimentChart.ddKey, smColor)}>
                  <div className="flex-1 flex items-center gap-4">
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart>
                        <Pie
                          data={d.sentimentChart.data}
                          cx={65}
                          cy={65}
                          innerRadius={40}
                          outerRadius={62}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                          strokeWidth={0}
                          animationDuration={1000}
                        >
                          {d.sentimentChart.data.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v, name) => [v.toLocaleString(), name]}
                          contentStyle={{ fontSize: 11, borderRadius: 8 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {d.sentimentChart.data.map((item, i) => {
                        const labelColor = item.label === 'Positive' ? '#16a34a'
                          : item.label === 'Negative' ? '#dc2626'
                          : '#64748b'
                        return (
                          <div key={i} className="flex items-center gap-2 text-[0.6875rem]">
                            <span className="w-14 shrink-0 font-medium" style={{ color: labelColor }}>
                              {item.label === 'No Sentiment' ? 'No Sent.' : item.label}
                            </span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${item.pct}%`, background: item.color }}
                              />
                            </div>
                            <span className="w-10 text-right font-semibold" style={{ color: labelColor }}>
                              {item.pct.toFixed(1)}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="text-[0.6875rem] border-l-2 rounded-r-md px-3 py-2 leading-relaxed" style={{ color: darken(PRIMARY_COLOR), backgroundColor: PRIMARY_COLOR + '0D', borderColor: PRIMARY_COLOR }}>
                    {d.sentimentChart.takeaway}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sentiment Drivers — narrow card */}
          <div className="lg:col-span-1">
            <Card className="flex flex-col" style={{ height: CARD_H_MD }}>
              <CardHeader
                title={d.sentimentDrivers.title}
                subtitle={d.sentimentDrivers.subtitle}
              />
              <CardBody className="flex-1 overflow-y-auto">
                <div className="cursor-pointer h-full" onClick={(e) => openPanel(e, d.sentimentDrivers.ddKey, smColor)}>
                  <div className="mb-3">
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider text-green-600 mb-2">Positive Drivers</p>
                    <ul className="space-y-1.5">
                      {d.sentimentDrivers.positive.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[0.6875rem] text-slate-600 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-[0.35rem]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider text-red-600 mb-2">Negative Drivers</p>
                    <ul className="space-y-1.5">
                      {d.sentimentDrivers.negative.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[0.6875rem] text-slate-600 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-[0.35rem]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        </div>{/* end sm-sentiment */}

        {/* ── PLATFORM PERFORMANCE ── */}
        <div id="sm-platform" className="scroll-mt-4">
        <SectionHeading title="Platform Performance" tag="SM · Channels" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* Platform Volume vs. Engagement — grouped bar, dual y-axis */}
          <Card className="flex flex-col" style={{ height: CARD_H }}>
            <CardHeader
              title={d.platformEngChart.title}
              subtitle={d.platformEngChart.subtitle}
            />
            <CardBody className="flex-1 flex flex-col">
              <div className="cursor-pointer flex-1" onClick={(e) => openPanel(e, d.platformEngChart.ddKey, smColor)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.platformEngChart.data} margin={{ top: 4, right: 30, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="platform" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left"  orientation="left"  tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar yAxisId="left"  dataKey="posts"        name="Posts"        fill={smColor}        radius={[3,3,0,0]} maxBarSize={24} animationDuration={1000} />
                    <Bar yAxisId="right" dataKey="interactions" name="Interactions" fill={chartColors[1]} radius={[3,3,0,0]} maxBarSize={24} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-auto pt-3 flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[0.625rem] text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: smColor }} /> Posts (left axis)
                </span>
                <span className="flex items-center gap-1.5 text-[0.625rem] text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: chartColors[1] }} /> Interactions (right axis)
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Platform Breakdown — pills grid */}
          <Card>
            <CardHeader
              title={d.platformBreakdown.title}
              subtitle={d.platformBreakdown.subtitle}
            />
            <CardBody>
              <div className="cursor-pointer" onClick={(e) => openPanel(e, d.platformBreakdown.ddKey, smColor)}>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {d.platformBreakdown.platforms.slice(0, 6).map((p, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                    >
                      <p className="text-[0.6875rem] font-semibold text-slate-700">{p.name}</p>
                      <p className="text-[1rem] font-bold text-slate-900 leading-tight">{p.posts}</p>
                      <p className="text-[0.625rem] text-slate-400">{p.interactions} interactions</p>
                    </div>
                  ))}
                </div>
                <div className="text-[0.6875rem] border-l-2 rounded-r-md px-3 py-2 leading-relaxed" style={{ color: darken(PRIMARY_COLOR), backgroundColor: PRIMARY_COLOR + '0D', borderColor: PRIMARY_COLOR }}>
                  {d.platformBreakdown.takeaway}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        </div>{/* end sm-platform */}

        {/* ── ENGAGEMENT & AMPLIFICATION ── */}
        <div id="sm-engagement" className="scroll-mt-4">
        <SectionHeading title="Engagement & Amplification" tag="SM · Engagement" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* Interactions by Platform — horizontal bar */}
          <Card className="flex flex-col" style={{ height: CARD_H_MD }}>
            <CardHeader
              title={d.interactionsChart.title}
              subtitle={d.interactionsChart.subtitle}
            />
            <CardBody className="flex-1 flex flex-col">
              <div className="cursor-pointer flex-1" onClick={(e) => openPanel(e, d.interactionsChart.ddKey, smColor)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={d.interactionsChart.data}
                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="platform" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={62} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="interactions" name="Interactions" radius={[0,3,3,0]} maxBarSize={20} animationDuration={1000}>
                      {d.interactionsChart.data.map((entry, i) => (
                        <Cell key={i} fill={platformColor(entry.platform || entry.name) || chartColors[i % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Audience Ranking Distribution — vertical bar */}
          <Card className="flex flex-col" style={{ height: CARD_H_MD }}>
            <CardHeader
              title={d.audienceRanking.title}
              subtitle={d.audienceRanking.subtitle}
            />
            <CardBody className="flex-1 flex flex-col">
              <div className="cursor-pointer flex-1" onClick={(e) => openPanel(e, d.audienceRanking.ddKey, smColor)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.audienceRanking.data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="rank" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="posts" name="Posts" fill={chartColors[0]} radius={[3,3,0,0]} maxBarSize={40} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <InsightBullets insights={d.audienceRanking.insights} />
            </CardBody>
          </Card>
        </div>

        </div>{/* end sm-engagement */}

      </PageShell>

      <DrillDownPanel panel={panel} onClose={closePanel} />
    </>
  )
}
