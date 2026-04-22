import { cn } from '@/lib/utils'

export function Card({ className, style, children }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)} style={style}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, right }) {
  return (
    <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between">
      <div>
        <p className="text-[0.8125rem] font-semibold text-slate-800">{title}</p>
        {subtitle && <p className="text-[0.6875rem] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="text-[0.6875rem] text-slate-400">{right}</div>}
    </div>
  )
}

export function CardBody({ className, style, children }) {
  return (
    <div className={cn('px-5 py-4', className)} style={style}>
      {children}
    </div>
  )
}
