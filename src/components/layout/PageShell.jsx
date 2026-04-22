import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useBrand } from '@/context/BrandContext'

export function PageShell({ topRow, children, className }) {
  const { heroBg, tokens } = useBrand()

  const heroStyle = heroBg
    ? { backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(135deg, #001020 0%, #002040 40%, ${tokens.primaryColor}55 100%)` }

  return (
    <div className={cn('flex flex-col min-h-screen bg-slate-100', className)}>
      {/* TOP ROW */}
      <div>
        <div
          id="emailer-capture-target"
          className="min-h-[40vh] flex flex-col justify-between px-8 pt-5 pb-8"
          style={heroStyle}
        >
          {topRow}
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="flex-1 bg-slate-100 p-6">
        {children}
      </div>
    </div>
  )
}

export function KpiCard({ label, value, sub, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-xl px-5 py-5 flex flex-col h-full"
      style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)' }}
    >
      <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-white mb-[1rem]">
        {label}
      </p>
      <p className="text-[1.75rem] font-bold text-white leading-none tracking-tight mb-[0.725rem]">
        {value}
      </p>
      {sub && (
        <p className="text-[0.6875rem] text-white leading-tight" style={{ opacity: 0.8 }}>{sub}</p>
      )}
    </motion.div>
  )
}
