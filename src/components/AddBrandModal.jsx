import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Image, FileJson, Check, AlertCircle, ChevronDown } from 'lucide-react'
import { addBrand, hexToNavBg } from '@/services/brandService'
import { PALETTES, getPalette } from '@/config/palettes'

function FileDropZone({ label, accept, icon: Icon, value, onChange, hint }) {
  const ref = useRef()
  const [dragging, setDragging] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onChange(file)
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="relative flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors duration-150"
        style={{
          background: dragging ? 'rgba(95,57,248,0.08)' : 'rgba(255,255,255,0.03)',
          borderColor: dragging ? 'rgba(95,57,248,0.6)' : value ? 'rgba(36,161,72,0.5)' : 'rgba(255,255,255,0.1)',
        }}
      >
        {value ? (
          <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#24a148' }} />
        ) : (
          <Icon className="w-4 h-4 flex-shrink-0 text-slate-500" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-300 truncate">
            {value ? value.name : `Click or drag to upload`}
          </p>
          {hint && !value && (
            <p className="text-[0.6875rem] text-slate-600 mt-0.5">{hint}</p>
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(null) }}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        )}
        <input
          ref={ref}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={e => onChange(e.target.files[0] || null)}
        />
      </div>
    </div>
  )
}

function ErrorAlert({ message }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(218,30,40,0.08)', border: '1px solid rgba(218,30,40,0.2)' }}>
      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-red-400 text-xs">{message}</p>
    </div>
  )
}

export default function AddBrandModal({ onClose, onAdded }) {
  const [jsonFile,    setJsonFile]   = useState(null)
  const [logoFile,    setLogoFile]   = useState(null)
  const [bgFile,      setBgFile]     = useState(null)
  const [color,       setColor]      = useState('#5f39f8')
  const [secondary,   setSecondary]  = useState('#1192e8')
  const [paletteId,   setPaletteId]  = useState('default')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [label,       setLabel]      = useState('')
  const [error,       setError]      = useState('')
  const [loading,     setLoading]    = useState(false)
  const [jsonParsed,  setJsonParsed] = useState(null)

  async function handleJsonChange(file) {
    setJsonFile(file)
    setError('')
    setJsonParsed(null)
    if (!file) return
    try {
      const text   = await file.text()
      const parsed = JSON.parse(text)
      // Accept brand or tokens as the color source
      const hasBrand = parsed.brand || parsed.tokens
      if (!hasBrand || !parsed.config || !parsed.data) {
        setError('JSON is missing required keys: brand (or tokens), config, and data')
        setJsonFile(null)
        return
      }
      setJsonParsed(parsed)
      // Auto-fill colors and label from bundle if present
      if (parsed.brand?.primaryColor)             setColor(parsed.brand.primaryColor)
      else if (parsed.tokens?.primaryColor)        setColor(parsed.tokens.primaryColor)
      if (parsed.brand?.secondaryColor)            setSecondary(parsed.brand.secondaryColor)
      else if (parsed.tokens?.secondaryColor)      setSecondary(parsed.tokens.secondaryColor)
      if (parsed.config?.fullName || parsed.config?.name) {
        setLabel(parsed.config.fullName || parsed.config.name)
      }
    } catch {
      setError('Invalid JSON file — could not parse.')
      setJsonFile(null)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!jsonParsed) { setError('Please upload a valid JSON bundle.'); return }
    if (!label.trim()) { setError('Brand name is required.'); return }

    setLoading(true)
    setError('')
    try {
      // Override color + palette in bundle with picker values
      const palette = getPalette(paletteId)
      const bundle = {
        ...jsonParsed,
        brand: {
          ...(jsonParsed.brand || {}),
          primaryColor:   color,
          secondaryColor: secondary,
          navActiveBg:    hexToNavBg(color),
          navActiveColor: color,
          smColor:        palette.smColor,
          tmColor:        palette.tmColor,
          chartColors:    palette.chartColors,
          paletteId,
        },
      }

      // Pass File objects directly — server writes them to disk
      await addBrand({ bundle, logo: logoFile, heroBg: bgFile, label: label.trim() })
      onAdded()
    } catch (err) {
      setError(`Failed to add brand: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-[480px] rounded-2xl overflow-hidden"
        style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.08)' }}
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-white font-semibold text-base">Add New Brand</h2>
            <p className="text-slate-500 text-xs mt-0.5">Upload a JSON bundle to create a dashboard</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-5">
              {/* Brand name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Brand Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Johnson & Johnson"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:ring-1 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(95,57,248,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5 flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v) }}
                      className="flex-1 min-w-0 px-2 py-2 rounded-lg text-xs text-white font-mono outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondary}
                      onChange={e => setSecondary(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5 flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <input
                      type="text"
                      value={secondary}
                      onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setSecondary(v) }}
                      className="flex-1 min-w-0 px-2 py-2 rounded-lg text-xs text-white font-mono outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Chart Palette */}
              <div>
                <button
                  type="button"
                  onClick={() => setPaletteOpen(o => !o)}
                  className="w-full flex items-center justify-between py-1 mb-1 group"
                >
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer group-hover:text-slate-300 transition-colors">
                    Chart Palette
                  </label>
                  <div className="flex items-center gap-2">
                    {!paletteOpen && (() => {
                      const ap = PALETTES.find(p => p.id === paletteId) || PALETTES[0]
                      return (
                        <div className="flex items-center gap-1">
                          {[ap.smColor, ap.tmColor, ...ap.chartColors.slice(0, 3)].map((c, i) => (
                            <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                          ))}
                        </div>
                      )
                    })()}
                    <ChevronDown
                      className="w-3.5 h-3.5 text-slate-600 transition-transform duration-200"
                      style={{ transform: paletteOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {paletteOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {PALETTES.map(p => {
                          const isActive = paletteId === p.id
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setPaletteId(p.id)}
                              className="relative flex flex-col gap-1.5 p-2.5 rounded-lg text-left transition-all"
                              style={{
                                background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                                border: isActive ? '1.5px solid rgba(255,255,255,0.55)' : '1px solid rgba(255,255,255,0.07)',
                                boxShadow: isActive ? '0 0 0 1px rgba(95,57,248,0.4)' : 'none',
                              }}
                            >
                              {isActive && (
                                <span
                                  className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                                  style={{ background: '#5f39f8' }}
                                >
                                  <Check className="w-2 h-2 text-white" strokeWidth={3} />
                                </span>
                              )}
                              <div className="flex items-center gap-1 flex-wrap">
                                {[p.smColor, p.tmColor, ...p.chartColors.slice(0, 3)].map((c, i) => (
                                  <span key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
                                ))}
                              </div>
                              <p className={`text-[0.625rem] font-semibold leading-none ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                {p.name}
                              </p>
                              <p className="text-[0.5625rem] text-slate-600 leading-none">{p.industry}</p>
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* JSON bundle */}
              <FileDropZone
                label="Data Bundle (JSON) *"
                accept=".json,application/json"
                icon={FileJson}
                value={jsonFile}
                onChange={handleJsonChange}
                hint="brand + config + data — see schema docs"
              />

              {/* Logo */}
              <FileDropZone
                label="Logo Image (optional)"
                accept="image/*"
                icon={Image}
                value={logoFile}
                onChange={setLogoFile}
                hint="PNG or SVG recommended · shown on landing card"
              />

              {/* Background */}
              <FileDropZone
                label="Background Image (optional)"
                accept="image/*"
                icon={Upload}
                value={bgFile}
                onChange={setBgFile}
                hint="JPG/PNG · used as hero background in dashboard"
              />

              {/* Error */}
              {error && <ErrorAlert message={error} />}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !jsonParsed}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                  style={{ background: '#5f39f8' }}
                >
                  {loading ? 'Creating…' : 'Create Dashboard'}
                </button>
              </div>
            </form>
        </div>
      </motion.div>
    </motion.div>
  )
}
