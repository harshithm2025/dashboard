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

const PRIMARY_COLOR = '#5f39f8'

const BULLET_COLOR = {
  default: '#64748b',
  blue:    '#3b82f6',
  teal:    '#0d9488',
  green:   '#22c55e',
  amber:   '#f59e0b',
  red:     '#ef4444',
}

// Fallback per-name colors for sub-media type bars (when entry.color not in data)
const SUB_TYPE_FALLBACK = {
  Web:      '#0d9488',
  News:     '#3b82f6',
  Trade:    '#f59e0b',
  Magazine: '#8b5cf6',
  Other:    '#94a3b8',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color || '#0d9488' }}>
          {p.name}: <span className="font-bold">{p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  )
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2">
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

export default function TMIntelligence({ activeSection }) {
  const { data, tokens } = useBrand()
  const d = data.tmIntelligence
  const DD = d.drillDown
  const [panel, setPanel] = useState(null)

  // Palette-driven colors
  const tmColor     = tokens.tmColor     || DEFAULT_PALETTE.tmColor
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
    if (!dd) { console.warn(`[DrillDown] No entry for ddKey "${ddKey}" in tmIntelligence.drillDown`); return }
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
            onClick={(e) => openPanel(e, kpi.ddKey, tmColor)}
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

        {/* ── COVERAGE & VOLUME ── */}
        <div id="tm-coverage" className="scroll-mt-4">
          <SectionHeading title="Coverage & Volume" tag="TM · Volume" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

            {/* Article Volume — Area chart */}
            <Card className="flex flex-col" style={{ height: CARD_H }}>
              <CardHeader title={d.volTrendChart.title} subtitle={d.volTrendChart.subtitle} />
              <CardBody className="flex-1 flex flex-col">
                <div className="cursor-pointer flex-1" onClick={(e) => openPanel(e, d.volTrendChart.ddKey, tmColor)}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="tmVolGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={tmColor} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={tmColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey={volXKey} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone" dataKey="articles" name="Articles"
                        stroke={tmColor} strokeWidth={2}
                        fill="url(#tmVolGrad)"
                        animationDuration={1200} animationEasing="ease-out"
                        dot={{ r: 4, fill: tmColor, strokeWidth: 0 }}
                        activeDot={{ r: 5, cursor: 'pointer' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {d.volTrendChart.takeaway && (
                  <div className="mt-auto pt-3 text-[0.6875rem] border-l-2 rounded-r-md px-3 py-2 leading-relaxed" style={{ color: darken(tmColor), backgroundColor: tmColor + '0D', borderColor: tmColor }}>
                    {d.volTrendChart.takeaway}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Media Type Distribution — Doughnut */}
            <Card className="flex flex-col" style={{ height: CARD_H }}>
              <CardHeader title={d.mediaTypeChart.title} subtitle={d.mediaTypeChart.subtitle} />
              <CardBody className="flex-1 flex flex-col">
                <div
                  className="cursor-pointer flex-1 flex"
                  onClick={(e) => openPanel(e, d.mediaTypeChart.ddKey, tmColor)}
                >
                  <div className="w-1/2 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={d.mediaTypeChart.data}
                          cx="50%" cy="50%"
                          innerRadius="52%" outerRadius="78%"
                          dataKey="value"
                          startAngle={90} endAngle={-270}
                          strokeWidth={0}
                          animationDuration={1000}
                        >
                          {d.mediaTypeChart.data.map((entry, i) => (
                            <Cell key={i} fill={entry.color || chartColors[i % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, name) => [v.toLocaleString(), name]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 flex flex-col justify-center pl-3 divide-y divide-slate-100">
                    {d.mediaTypeChart.data.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[0.6875rem] py-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color || chartColors[i % chartColors.length] }} />
                        <span className="flex-1 text-slate-600 truncate">{item.name}</span>
                        <span className="font-semibold text-slate-800 tabular-nums hidden sm:block">{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ul className="space-y-1.5 border-t border-slate-100 pt-3 mt-4">
                  {d.mediaTypeChart.insights.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[0.6875rem] text-slate-600 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[0.35rem]"
                        style={{ background: BULLET_COLOR[item.color] ?? BULLET_COLOR.default }} />
                      {item.text}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>{/* end tm-coverage */}

        {/* ── SENTIMENT & TONALITY ── */}
        <div id="tm-sentiment" className="scroll-mt-4">
          <SectionHeading title="Sentiment & Tonality" tag="TM · Sentiment" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

            <Card className="flex flex-col" style={{ height: CARD_H_MD }}>
              <CardHeader title={d.sentimentChart.title} subtitle={d.sentimentChart.subtitle} />
              <CardBody className="flex-1 flex flex-col overflow-hidden">
                <div className="cursor-pointer flex-1 flex flex-col" onClick={(e) => openPanel(e, d.sentimentChart.ddKey, tmColor)}>
                  <div className="flex-1 flex items-center gap-4">
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart>
                        <Pie
                          data={d.sentimentChart.data}
                          cx={65} cy={65}
                          innerRadius={40} outerRadius={62}
                          dataKey="value"
                          startAngle={90} endAngle={-270}
                          strokeWidth={0}
                          animationDuration={1000}
                        >
                          {d.sentimentChart.data.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, name) => [v.toLocaleString(), name]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {d.sentimentChart.data.map((item, i) => {
                        const labelColor = item.label === 'Positive' ? '#16a34a'
                          : item.label === 'Negative' ? '#dc2626'
                          : '#64748b'
                        return (
                          <div key={i} className="flex items-center gap-2 text-[0.6875rem]">
                            <span className="w-14 shrink-0 font-medium" style={{ color: labelColor }}>{item.label}</span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
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

            <Card className="flex flex-col" style={{ height: CARD_H_MD }}>
              <CardHeader title={d.narratives.title} subtitle={d.narratives.subtitle} />
              <CardBody className="flex-1 overflow-y-auto">
                <div className="cursor-pointer h-full" onClick={(e) => openPanel(e, d.narratives.ddKey, tmColor)}>
                  <BulletList items={d.narratives.items} />
                  <div className="mt-4 text-[0.6875rem] border-l-2 rounded-r-md px-3 py-2 leading-relaxed" style={{ color: darken(PRIMARY_COLOR), backgroundColor: PRIMARY_COLOR + '0D', borderColor: PRIMARY_COLOR }}>
                    {d.narratives.takeaway}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>{/* end tm-sentiment */}

        {/* ── PUBLICATIONS & SOURCES ── */}
        <div id="tm-pubs" className="scroll-mt-4">
          <SectionHeading title="Publications & Sources" tag="TM · Authors" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

            <Card className="flex flex-col" style={{ height: CARD_H }}>
              <CardHeader title={d.publications.title} subtitle={d.publications.subtitle} />
              <div className="cursor-pointer flex-1 overflow-y-auto" onClick={(e) => openPanel(e, d.publications.ddKey, tmColor)}>
                <table className="w-full text-[0.6875rem]">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-5 py-2.5 text-slate-500 font-semibold">Publication</th>
                      <th className="text-right px-5 py-2.5 text-slate-500 font-semibold">Articles</th>
                      <th className="text-right px-5 py-2.5 text-slate-500 font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.publications.rows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-2 text-slate-700 font-medium">{row.name}</td>
                        <td className="px-5 py-2 text-right font-semibold text-slate-800">{row.articles.toLocaleString()}</td>
                        <td className="px-5 py-2 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[0.5625rem] font-semibold ${
                            row.pos ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {row.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="flex flex-col" style={{ height: CARD_H }}>
              <CardHeader title={d.subTypeChart.title} subtitle={d.subTypeChart.subtitle} />
              <CardBody className="flex-1 flex flex-col">
                <div className="cursor-pointer flex-1" onClick={(e) => openPanel(e, d.subTypeChart.ddKey, tmColor)}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.subTypeChart.data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="articles" name="Articles" radius={[3,3,0,0]} maxBarSize={48} animationDuration={1000}>
                        {d.subTypeChart.data.map((entry, i) => (
                          <Cell key={i} fill={entry.color || SUB_TYPE_FALLBACK[entry.name] || chartColors[i % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-auto space-y-1.5 pt-3">
                  {d.subTypeChart.insights.map((item, i) => {
                    const barColor = SUB_TYPE_FALLBACK[
                      Object.keys(SUB_TYPE_FALLBACK).find(k => item.text.toLowerCase().startsWith(k.toLowerCase()))
                    ] || (BULLET_COLOR[item.color] ?? BULLET_COLOR.default)
                    return (
                      <li key={i} className="flex items-start gap-2 text-[0.6875rem] text-slate-600 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[0.35rem]" style={{ background: barColor }} />
                        {item.text}
                      </li>
                    )
                  })}
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>{/* end tm-pubs */}

        {/* ── COVERAGE THEMES ── */}
        <div id="tm-themes" className="scroll-mt-4">
          <SectionHeading title="Coverage Themes" tag="TM · Themes" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {d.themes.map(theme => (
              <Card key={theme.id}>
                <CardHeader title={theme.title} subtitle={theme.subtitle} />
                <CardBody>
                  <div className="cursor-pointer" onClick={(e) => openPanel(e, theme.ddKey, tmColor)}>
                    <BulletList items={theme.items} />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>{/* end tm-themes */}

      </PageShell>

      <DrillDownPanel panel={panel} onClose={closePanel} />
    </>
  )
}
