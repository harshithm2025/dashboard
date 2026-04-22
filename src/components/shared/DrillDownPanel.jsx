import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useBrand } from '@/context/BrandContext'

const PANEL_W = 420
const MARGIN  = 16

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

export function DrillDownPanel({ panel, onClose }) {
  // ref goes on an inner div, not the motion.div, to avoid Framer Motion's
  // "ref is not a prop" warning from AnimatePresence > PopChild internals.
  const innerRef = useRef(null)
  const { tokens } = useBrand()
  const accent = tokens.secondaryColor || tokens.primaryColor

  // Close on outside click
  useEffect(() => {
    if (!panel) return
    const handler = (e) => {
      if (innerRef.current && !innerRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panel, onClose])

  // Close on Escape
  useEffect(() => {
    if (!panel) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [panel, onClose])

  if (!panel) return null

  const vw       = window.innerWidth
  const vh       = window.innerHeight
  const panelH   = Math.round(vh * 0.8)
  const left     = clamp(panel.x, MARGIN, vw - PANEL_W - MARGIN)
  const top      = clamp(panel.y, MARGIN, vh - panelH  - MARGIN)

  return (
    <AnimatePresence>
      <motion.div
        key="drilldown"
        initial={{ opacity: 0, scale: 0.95, y: -6 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: -6 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="fixed z-[200] shadow-2xl rounded-xl overflow-hidden border border-white/40"
        style={{
          width: PANEL_W, top, left,
          minHeight: panelH, maxHeight: panelH,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div ref={innerRef} className="flex flex-col h-full">
          {/* Header — uses secondary brand color */}
          <div className="px-5 py-4 border-b border-slate-200/60 flex-shrink-0" style={{ background: accent }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.9375rem] font-bold leading-snug" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {panel.title}
                </p>
                {panel.sub && (
                  <p className="text-[0.6875rem] mt-0.5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {panel.sub}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors mt-0.5"
              >
                <X className="h-3 w-3 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Insights body */}
          <div className="overflow-y-auto flex-1 min-h-0">
            {panel.insights.map((ins, i) => (
              <div
                key={i}
                className="px-5 py-3 border-b border-slate-200/50 last:border-0 flex gap-3"
              >
                <div className="mt-0.5 flex-shrink-0">
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[0.625rem] font-bold"
                    style={{ background: accent, color: '#FEEEFB' }}
                  >
                    {i + 1}
                  </span>
                </div>
                <div>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-600">
                    {ins.label}
                  </p>
                  <p className="text-[0.8125rem] text-slate-700 mt-0.5 leading-relaxed">
                    {ins.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
