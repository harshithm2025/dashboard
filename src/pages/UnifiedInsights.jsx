import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar,
  LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { PageShell, KpiCard } from '@/components/layout/PageShell'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Card, CardHeader, CardBody } from '@/components/shared/Card'
import { DrillDownPanel } from '@/components/shared/DrillDownPanel'
import { useBrand } from '@/context/BrandContext'
import { CARD_H, CARD_H_LG, CARD_H_MD } from '@/config/dashboard'
import { DEFAULT_PALETTE } from '@/config/palettes'

const BULLET_COLOR = {
  default: '#64748b',
  blue:    '#3b82f6',
  teal:    '#0d9488',
  green:   '#22c55e',
  amber:   '#f59e0b',
  red:     '#ef4444',
}



function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color || '#64748b' }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  )
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[0.6875rem] text-slate-600 leading-relaxed">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0 mt-[0.35rem]"
            style={{ background: BULLET_COLOR[item.color] ?? BULLET_COLOR.default }}
          />
          {item.label
            ? <span><strong>{item.label}</strong> {item.text}</span>
            : <span>{item.text}</span>
          }
        </li>
      ))}
    </ul>
  )
}

export default function UnifiedInsights({ activeSection }) {
  const { data, tokens, config } = useBrand()
  const d = data.unifiedInsights
  const DD = d.drillDown

  // Palette-driven colors
  const SM_COLOR = tokens.smColor || DEFAULT_PALETTE.smColor
  const TM_COLOR = tokens.tmColor || DEFAULT_PALETTE.tmColor

  // Grouped bar data: [{name, SM, TM}]
  const sentimentBarData = d.sentimentCompare.labels.map((label, i) => ({
    name: label,
    SM: d.sentimentCompare.datasets[0].data[i],
    TM: d.sentimentCompare.datasets[1].data[i],
  }))

  // Line data: [{name, SM_LINE_KEY, TM_LINE_KEY}]
  const SM_LINE_KEY = d.volCompare.datasets[0].label
  const TM_LINE_KEY = d.volCompare.datasets[1].label
  const volLineData = d.volCompare.labels.map((label, i) => ({
    name: label,
    [SM_LINE_KEY]: d.volCompare.datasets[0].data[i],
    [TM_LINE_KEY]: d.volCompare.datasets[1].data[i],
  }))

  // Radar data: [{subject, SM, TM}]
  const radarData = d.reputation.labels.map((label, i) => ({
    subject: label,
    SM: d.reputation.datasets[0].data[i],
    TM: d.reputation.datasets[1].data[i],
  }))

  const [panel, setPanel] = useState(null)

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
    if (!dd) { console.warn(`[DrillDown] No entry for ddKey "${ddKey}" in unifiedInsights.drillDown`); return }
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

      <div
        className="mt-[2rem]"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px' }}
      >
        {d.kpis.map((kpi, i) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            onClick={(e) => openPanel(e, kpi.ddKey, SM_COLOR)}
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

        {/* ── SM VS. TM COMPARATIVE ANALYSIS ── */}
        <div id="uni-compare" className="scroll-mt-4">
          <SectionHeading title="SM vs. TM Comparative Analysis" tag="Unified · Compare" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

            {/* Sentiment Comparison — Grouped Bar */}
            <Card className="flex flex-col" style={{ height: CARD_H }}>
              <CardHeader title={d.sentimentCompare.title} subtitle={d.sentimentCompare.subtitle} />
              <CardBody className="flex-1 flex flex-col">
                <div
                  className="cursor-pointer flex-1"
                  onClick={(e) => openPanel(e, d.sentimentCompare.ddKey, SM_COLOR)}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sentimentBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="SM" name="SM" fill={SM_COLOR} radius={[3, 3, 0, 0]} maxBarSize={36} animationDuration={1000} />
                      <Bar dataKey="TM" name="TM" fill={TM_COLOR} radius={[3, 3, 0, 0]} maxBarSize={36} animationDuration={1000} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1.5 text-[0.6875rem] text-slate-600">
                      <span className="w-3 h-2.5 rounded-sm shrink-0" style={{ background: SM_COLOR }} />
                      SM
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.6875rem] text-slate-600">
                      <span className="w-3 h-2.5 rounded-sm shrink-0" style={{ background: TM_COLOR }} />
                      TM
                    </div>
                  </div>
                  <p className="text-[0.6875rem] text-slate-500 leading-relaxed">{d.sentimentCompare.takeaway}</p>
                </div>
              </CardBody>
            </Card>

            {/* Monthly Volume Overlay — Dual Line */}
            <Card className="flex flex-col" style={{ height: CARD_H }}>
              <CardHeader title={d.volCompare.title} subtitle={d.volCompare.subtitle} />
              <CardBody className="flex-1 flex flex-col">
                <div
                  className="cursor-pointer flex-1"
                  onClick={(e) => openPanel(e, d.volCompare.ddKey, SM_COLOR)}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={volLineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey={SM_LINE_KEY}
                        name={SM_LINE_KEY}
                        stroke={SM_COLOR}
                        strokeWidth={2}
                        dot={{ r: 4, fill: SM_COLOR, strokeWidth: 0 }}
                        activeDot={{ r: 5, cursor: 'pointer' }}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                      <Line
                        type="monotone"
                        dataKey={TM_LINE_KEY}
                        name={TM_LINE_KEY}
                        stroke={TM_COLOR}
                        strokeWidth={2}
                        dot={{ r: 4, fill: TM_COLOR, strokeWidth: 0 }}
                        activeDot={{ r: 5, cursor: 'pointer' }}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-auto pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1.5 text-[0.6875rem] text-slate-600">
                      <span className="w-4 h-0.5 shrink-0" style={{ background: SM_COLOR }} />
                      {SM_LINE_KEY}
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.6875rem] text-slate-600">
                      <span className="w-4 h-0.5 shrink-0" style={{ background: TM_COLOR }} />
                      {TM_LINE_KEY}
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {d.volCompare.insights.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[0.6875rem] text-slate-600 leading-relaxed">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0 mt-[0.35rem]"
                          style={{ background: BULLET_COLOR[item.color] ?? BULLET_COLOR.default }}
                        />
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardBody>
            </Card>

          </div>
        </div>{/* end uni-compare */}

        {/* ── REPUTATION DIMENSIONS ── */}
        <div id="uni-reputation" className="scroll-mt-4">
          <SectionHeading title="Reputation Dimensions" tag="Unified · Reputation" />
          <div className="mb-6">

            <Card className="flex flex-col" style={{ height: CARD_H_LG }}>
              <CardHeader title={d.reputation.title} subtitle={d.reputation.subtitle} />
              <CardBody className="flex-1 flex flex-col overflow-hidden">
                <div
                  className="cursor-pointer flex-1 flex gap-4 min-h-0"
                  onClick={(e) => openPanel(e, d.reputation.ddKey, SM_COLOR)}
                >
                  {/* Radar — fills available height */}
                  <div className="flex-1 min-w-0 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 12, right: 28, bottom: 12, left: 28 }}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 10]}
                          tickCount={6}
                          tick={{ fontSize: 8, fill: '#94a3b8' }}
                          axisLine={false}
                        />
                        <Radar
                          name="SM Signals"
                          dataKey="SM"
                          stroke={SM_COLOR}
                          fill={d.reputation.datasets[0].bg}
                          strokeWidth={2}
                          animationDuration={1200}
                        />
                        <Radar
                          name="TM Signals"
                          dataKey="TM"
                          stroke={TM_COLOR}
                          fill={d.reputation.datasets[1].bg}
                          strokeWidth={2}
                          animationDuration={1200}
                        />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Score table — fixed width, scrollable */}
                  <div className="w-[44%] shrink-0 overflow-y-auto">
                    <table className="w-full" style={{ fontSize: '0.725rem' }}>
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-2 pr-2 text-slate-500 font-semibold">Dimension</th>
                          <th className="text-center py-2 px-1.5 font-bold" style={{ color: SM_COLOR }}>SM</th>
                          <th className="text-center py-2 px-1.5 font-bold" style={{ color: TM_COLOR }}>TM</th>
                          <th className="text-left py-2 pl-2 text-slate-400 font-medium hidden xl:table-cell">Signal basis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.reputation.scores.map((row, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-1.5 pr-2 text-slate-700 font-medium">{row.label}</td>
                            <td className="py-1.5 px-1.5 text-center font-bold tabular-nums" style={{ color: SM_COLOR }}>{row.sm}</td>
                            <td className="py-1.5 px-1.5 text-center font-bold tabular-nums" style={{ color: TM_COLOR }}>{row.tm}</td>
                            <td className="py-1.5 pl-2 text-slate-400 leading-tight hidden xl:table-cell">{row.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Legend + caption */}
                <div className="shrink-0 pt-3 border-t border-slate-100 flex items-center gap-6">
                  <div className="flex items-center gap-1.5 text-[0.6875rem] text-slate-600">
                    <span className="w-4 h-0.5 shrink-0" style={{ background: SM_COLOR }} />
                    SM Signals
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.6875rem] text-slate-600">
                    <span className="w-4 h-0.5 shrink-0" style={{ background: TM_COLOR }} />
                    TM Signals
                  </div>
                  <p className="text-[0.625rem] text-slate-400">
                    {d.reputation.scaleNote || `Scale: 1–10 based on SM + TM signal analysis across ${config?.dataPeriod?.range || 'current period'}`}
                  </p>
                </div>
              </CardBody>
            </Card>

          </div>
        </div>{/* end uni-reputation */}

        {/* ── CHANNEL DOMINANCE & GAPS ── */}
        <div id="uni-channels" className="scroll-mt-4">
          <SectionHeading title="Channel Dominance & Gaps" tag="Unified · Channels" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {d.channelCards.map(card => (
              <Card key={card.id} className="flex flex-col" style={{ height: CARD_H_MD }}>
                <CardHeader title={card.title} />
                <CardBody className="flex-1 overflow-y-auto">
                  <div
                    className="cursor-pointer h-full"
                    onClick={(e) => openPanel(e, card.ddKey, SM_COLOR)}
                  >
                    <BulletList items={card.items} />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>{/* end uni-channels */}

      </PageShell>

      <DrillDownPanel panel={panel} onClose={closePanel} />
    </>
  )
}
