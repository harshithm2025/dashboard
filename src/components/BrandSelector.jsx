import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, BarChart2, Activity, Plus, MoreVertical,
  Trash2, LayoutGrid, List, Search, X, AlertTriangle, LogOut
} from 'lucide-react'
import { getBrands, deleteBrand } from '@/services/brandService'
import AddBrandModal from '@/components/AddBrandModal'
import { clearToken } from '@/lib/auth'

/** Derive card accent colors from the brand's primary color */
function cardStyles(primaryColor) {
  const hex = (primaryColor || '#5f39f8').replace('#', '')
  const r   = parseInt(hex.slice(0, 2), 16)
  const g   = parseInt(hex.slice(2, 4), 16)
  const b   = parseInt(hex.slice(4, 6), 16)
  return {
    gradient: `linear-gradient(140deg, #ffffff 0%, rgba(${r},${g},${b},0.05) 100%)`,
    accent:   `rgba(${r},${g},${b},0.08)`,
    border:   `rgba(${r},${g},${b},0.22)`,
    color:    primaryColor || '#5f39f8',
  }
}

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────
function ConfirmDeleteDialog({ brand, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        className="relative w-full max-w-sm rounded-2xl p-6 z-10 bg-white shadow-2xl"
        style={{ border: '1px solid rgba(218,30,40,0.2)' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(218,30,40,0.08)' }}>
            <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
          </div>
          <div>
            <h3 className="text-slate-800 font-semibold text-sm">Delete Dashboard</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              This will permanently delete <span className="text-slate-800 font-semibold">{brand.label}</span> and all associated data. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700 bg-slate-100 hover:bg-slate-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: '#da1e28' }}
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Card More Menu ───────────────────────────────────────────────────────────
function MoreMenu({ onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
        style={{ background: 'rgba(0,0,0,0.07)' }}
      >
        <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-9 z-50 rounded-xl overflow-hidden shadow-xl min-w-[160px] bg-white"
            style={{ border: '1px solid rgba(0,0,0,0.08)' }}
          >
            <button
              onClick={() => { setOpen(false); onDelete() }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Brand Card (grid) ────────────────────────────────────────────────────────
function BrandCard({ brand, index, onClick, onDelete }) {
  const styles = cardStyles(brand.tokens.primaryColor)
  const kpis = []
  if (brand.data?.executiveSummary?.kpis) {
    brand.data.executiveSummary.kpis.slice(0, 4).forEach(k => kpis.push(`${k.value} ${k.label}`))
  } else if (brand.tagline) {
    brand.tagline.split(' · ').forEach(t => kpis.push(t))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.10)', transition: { duration: 0.2 } }}
      className="relative w-[320px] rounded-2xl overflow-hidden cursor-pointer group shadow-sm"
      style={{ background: styles.gradient, border: `1px solid ${styles.border}` }}
    >
      {/* Top bar */}
      <div className="h-[3px] w-full" style={{ background: styles.color }} />

      <div className="p-6" onClick={onClick}>
        <div className="flex items-start justify-between mb-5">
          <div>
            {brand.logo ? (
              <img src={brand.logo} alt={brand.label} style={{ maxHeight: '36px', width: 'auto' }} />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: styles.color }}>
                  {brand.label.charAt(0)}
                </div>
                <span className="text-slate-800 font-bold text-lg tracking-tight">{brand.label.split(' ')[0]}</span>
              </div>
            )}
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest mt-2" style={{ color: styles.color }}>
              {brand.label}
            </p>
          </div>
          <BarChart2 className="w-5 h-5 mt-1 opacity-20 group-hover:opacity-60 transition-opacity" style={{ color: styles.color }} />
        </div>
        <p className="text-[0.8125rem] text-slate-500 leading-relaxed mb-5">{brand.description}</p>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {kpis.slice(0, 4).map(kpi => (
            <div key={kpi} className="rounded-lg px-3 py-2 text-[0.6875rem] font-semibold" style={{ background: styles.accent, color: styles.color }}>
              {kpi}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-3 rounded-xl text-[0.8125rem] font-semibold text-white transition-all duration-200" style={{ background: styles.color }}>
          <span>Open Dashboard</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>

      {/* More menu */}
      <div className="absolute top-5 right-5 z-20">
        <MoreMenu onDelete={onDelete} />
      </div>
    </motion.div>
  )
}

// ─── Brand Row (list view) ────────────────────────────────────────────────────
function BrandRow({ brand, index, onClick, onDelete }) {
  const styles = cardStyles(brand.tokens.primaryColor)

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors bg-white"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}
      onMouseEnter={e => e.currentTarget.style.background = `rgba(${parseInt((styles.color).replace('#','').slice(0,2),16)},${parseInt((styles.color).replace('#','').slice(2,4),16)},${parseInt((styles.color).replace('#','').slice(4,6),16)},0.04)`}
      onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
    >
      {/* Color dot */}
      <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: styles.color }} />

      {/* Logo / initial */}
      <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center" onClick={onClick}>
        {brand.logo ? (
          <img src={brand.logo} alt={brand.label} style={{ maxHeight: '32px', width: 'auto' }} />
        ) : (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: styles.color }}>
            {brand.label.charAt(0)}
          </div>
        )}
      </div>

      {/* Name + subtitle */}
      <div className="flex-1 min-w-0" onClick={onClick}>
        <p className="text-slate-800 font-semibold text-sm truncate">{brand.label}</p>
        <p className="text-slate-400 text-xs truncate">{brand.config?.subtitle || brand.description}</p>
      </div>

      {/* Tagline chips */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0" onClick={onClick}>
        {(brand.tagline || '').split(' · ').slice(0, 2).map(t => t && (
          <span key={t} className="text-[0.625rem] font-semibold px-2 py-1 rounded-md" style={{ background: styles.accent, color: styles.color }}>
            {t}
          </span>
        ))}
      </div>

      {/* Open arrow */}
      <button
        onClick={onClick}
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: styles.color }}
      >
        <ArrowRight className="w-3.5 h-3.5 text-white" />
      </button>

      {/* More menu */}
      <div className="flex-shrink-0">
        <MoreMenu onDelete={onDelete} />
      </div>
    </motion.div>
  )
}

// ─── Main BrandSelector ───────────────────────────────────────────────────────
import { useContext } from 'react'
import { UserContext } from '@/App'

export default function BrandSelector() {
  const session = useContext(UserContext)
  const navigate = useNavigate()
  const [brands,      setBrands]      = useState({})
  const [showAdd,     setShowAdd]     = useState(false)
  const [viewMode,    setViewMode]    = useState('grid')
  const [search,      setSearch]      = useState('')
  const [confirmDel,  setConfirmDel]  = useState(null)

  async function loadBrands() {
    try { setBrands(await getBrands()) } catch (err) { console.error(err) }
  }

  useEffect(() => { loadBrands() }, [])

  async function handleDelete() {
    if (!confirmDel) return
    try {
      await deleteBrand(confirmDel.id)
      setConfirmDel(null)
      loadBrands()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const brandList = Object.values(brands).filter(b =>
    !search || b.label.toLowerCase().includes(search.toLowerCase()) || (b.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      className="fixed inset-0 flex flex-col items-center overflow-y-auto py-12"
      style={{ background: '#f4f6fb' }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Header */}
      <motion.div className="relative z-10 text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Activity className="w-5 h-5" style={{ color: '#893ffc' }} />
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-slate-400">Infovision Brand Intelligence</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Brand Measurement Dashboards</h1>
        <p className="text-sm text-slate-400">Choose a brand to open its measurement dashboard</p>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        className="relative z-10 flex items-center justify-center gap-3 mb-8 w-full max-w-[1200px] px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        {/* Search */}
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search brands…"
            className="w-full pl-9 pr-8 py-2 rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none bg-white transition-all"
            style={{ border: '1px solid rgba(0,0,0,0.1)' }}
            onFocus={e => e.target.style.borderColor = 'rgba(95,57,248,0.45)'}
            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
          {[{ id: 'grid', Icon: LayoutGrid }, { id: 'list', Icon: List }].map(({ id, Icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              className="px-3 py-2 transition-colors"
              style={{
                background: viewMode === id ? '#5f39f8' : 'transparent',
                color:      viewMode === id ? '#fff' : '#94a3b8',
              }}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Add brand / User info */}
        <div className="flex items-center gap-4 border-l border-slate-200 pl-4 ml-2">
          {session && (
            <div className="hidden md:flex flex-col text-right">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged in as</span>
               <span className="text-xs font-medium text-slate-700">{session.user?.email}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: '#5f39f8' }}
            >
              <Plus className="w-4 h-4" />
              Add Brand
            </button>
            
            <button
              onClick={() => { clearToken(); window.location.href = '/' }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 bg-white transition-colors"
              style={{ border: '1px solid rgba(0,0,0,0.1)' }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1200px] px-6">
        {viewMode === 'grid' ? (
          <div className="flex flex-wrap gap-6 justify-center">
            {brandList.map((brand, i) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                index={i}
                onClick={() => navigate(`/dashboard/${brand.id}`)}
                onDelete={() => setConfirmDel(brand)}
              />
            ))}

            {/* Add card */}
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: brandList.length * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => setShowAdd(true)}
              className="relative w-[320px] rounded-2xl overflow-hidden cursor-pointer group flex flex-col items-center justify-center min-h-[300px] bg-white shadow-sm"
              style={{ border: '1.5px dashed rgba(0,0,0,0.12)' }}
            >
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200" style={{ background: 'rgba(95,57,248,0.08)', border: '1px solid rgba(95,57,248,0.2)' }}>
                  <Plus className="w-6 h-6" style={{ color: '#5f39f8' }} />
                </div>
                <div>
                  <p className="text-slate-700 font-semibold text-sm mb-1">Add New Brand</p>
                  <p className="text-slate-400 text-xs leading-relaxed">Upload a brand data bundle to create a new dashboard</p>
                </div>
              </div>
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-3xl mx-auto">
            {brandList.map((brand, i) => (
              <BrandRow
                key={brand.id}
                brand={brand}
                index={i}
                onClick={() => navigate(`/dashboard/${brand.id}`)}
                onDelete={() => setConfirmDel(brand)}
              />
            ))}
            {/* Add row */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: brandList.length * 0.05 }}
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors bg-white"
              style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(95,57,248,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(95,57,248,0.08)' }}>
                <Plus className="w-4 h-4" style={{ color: '#5f39f8' }} />
              </div>
              <span className="text-slate-400 text-sm font-medium">Add New Brand</span>
            </motion.button>
          </div>
        )}

        {/* Empty search state */}
        {search && brandList.length === 0 && (
          <p className="text-center text-slate-400 text-sm mt-16">No brands match "{search}"</p>
        )}
      </div>

      {/* Footer */}
      <motion.p className="relative z-10 mt-10 text-[0.6875rem] text-slate-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        Powered by AlphaMetricx · Infovision Inc. © 2026
      </motion.p>

      {/* Add Brand Modal */}
      <AnimatePresence>
        {showAdd && <AddBrandModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); loadBrands() }} />}
      </AnimatePresence>

      {/* Confirm Delete */}
      <AnimatePresence>
        {confirmDel && (
          <ConfirmDeleteDialog
            brand={confirmDel}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
