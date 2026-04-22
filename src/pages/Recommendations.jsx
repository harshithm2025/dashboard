import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageShell, KpiCard } from '@/components/layout/PageShell'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Card, CardHeader, CardBody } from '@/components/shared/Card'
import { DrillDownPanel } from '@/components/shared/DrillDownPanel'
import { useBrand } from '@/context/BrandContext'

// Category accent classes (Tailwind static strings — no dynamic construction)
const CAT_STYLES = {
  scale:   { badge: 'bg-teal-100 text-teal-700',   bar: '#0d9488', ring: 'ring-teal-200',  takeaway: 'bg-teal-50 border-teal-400 text-teal-700'  },
  fix:     { badge: 'bg-amber-100 text-amber-700',  bar: '#f59e0b', ring: 'ring-amber-200', takeaway: 'bg-amber-50 border-amber-400 text-amber-700' },
  monitor: { badge: 'bg-red-100 text-red-600',      bar: '#ef4444', ring: 'ring-red-200',   takeaway: 'bg-red-50 border-red-400 text-red-600'      },
}

// Number → ordinal badge label (resets per section)
const ORDINAL = ['01', '02', '03']

export default function Recommendations({ activeSection }) {
  const { data } = useBrand()
  const d = data.recommendations
  const DD = d.drillDown
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
    if (!dd) { console.warn(`[DrillDown] No entry for ddKey "${ddKey}" in recommendations.drillDown`); return }
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
            onClick={(e) => openPanel(e, kpi.id, '#5f39f8')}
            className="cursor-pointer"
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

        {d.categories.map((cat) => {
          const styles = CAT_STYLES[cat.id]
          return (
            <div key={cat.id} id={`recs-${cat.id}`} className="scroll-mt-4">
              <SectionHeading title={cat.tagline} tag={`Action \u00b7 ${cat.label}`} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-stretch">
                {cat.items.map((item, idx) => (
                  <RecCard
                    key={item.id}
                    item={item}
                    num={ORDINAL[idx]}
                    styles={styles}
                    catLabel={cat.label}
                    onOpen={(e) => openPanel(e, item.id, styles.bar)}
                  />
                ))}
              </div>
            </div>
          )
        })}

      </PageShell>

      <DrillDownPanel panel={panel} onClose={closePanel} />
    </>
  )
}

function RecCard({ item, num, styles, catLabel, onOpen }) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card
        className={`h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow ring-1 ${styles.ring}`}
        onClick={onOpen}
      >
        <CardBody className="flex flex-col gap-3 h-full">
          {/* Number + category badge */}
          <div className="flex items-center justify-between">
            <span className="text-[0.625rem] font-bold tabular-nums text-slate-300 tracking-widest">
              {num}
            </span>
            <span className={`text-[0.5625rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${styles.badge}`}>
              {catLabel}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-[0.8125rem] font-semibold text-slate-800 leading-snug">
            {item.title}
          </h3>

          {/* Description — flex-1 pushes KPI strip to bottom */}
          <p className="text-[0.6875rem] text-slate-500 leading-relaxed flex-1">
            {item.description}
          </p>

          {/* KPI strip — always at bottom */}
          <div
            className={`border-l-2 px-3 py-2 rounded-r-md text-[0.625rem] leading-relaxed font-medium ${styles.takeaway}`}
          >
            {item.kpi}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}
