import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MoreHorizontal, Home, Settings, Share2, Mail,
  X, Upload, Image, FileJson, Trash2, Check, AlertCircle, ChevronRight, ChevronDown, Download,
  RefreshCw, ToggleLeft, ToggleRight, Eye, EyeOff,
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { updateBrand, deleteBrand, hexToNavBg, getEmailer, saveEmailer } from '@/services/brandService'
import { PALETTES, getPalette, CUSTOM_PALETTE_DEFAULTS } from '@/config/palettes'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-slate-600 mb-2">
      {children}
    </p>
  )
}

function FileRow({ label, accept, icon: Icon, value, onChange }) {
  const ref = useRef()
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <div
        onClick={() => ref.current?.click()}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderColor: value ? 'rgba(36,161,72,0.4)' : 'rgba(255,255,255,0.08)',
        }}
      >
        {value ? (
          <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
        ) : (
          <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
        )}
        <span className="text-xs text-slate-400 truncate flex-1 min-w-0">
          {value ? value.name : 'Click to upload'}
        </span>
        {value && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(null) }}
            className="p-0.5 hover:bg-white/10 rounded"
          >
            <X className="w-3 h-3 text-slate-600" />
          </button>
        )}
        <input ref={ref} type="file" accept={accept} className="sr-only"
          onChange={e => onChange(e.target.files[0] || null)} />
      </div>
    </div>
  )
}

// ─── HTML export ──────────────────────────────────────────────────────────────

async function exportDashboard(brand) {
  const res = await fetch(`/api/brands/${brand.id}/export`)
  if (!res.ok) {
    let msg = 'Export failed'
    try { msg = (await res.json()).error } catch (_) { }
    throw new Error(msg)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(brand.label || brand.id).replace(/\s+/g, '-').toLowerCase()}-dashboard.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Speed-dial FAB ───────────────────────────────────────────────────────────

const fabActions = [
  { id: 'home', icon: Home, label: 'Home', color: '#697077' },
  { id: 'settings', icon: Settings, label: 'Settings', color: '#697077' },
  { id: 'emailer', icon: Mail, label: 'Emailer', color: '#697077' },
  { id: 'share', icon: Share2, label: 'Share Publicly', color: '#697077' },
]

function SpeedDial({ primary, onAction }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Child action buttons — fan up on hover */}
      <AnimatePresence>
        {hovered && fabActions.map((action, i) => (
          <motion.div
            key={action.id}
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 12, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.8 }}
            transition={{ duration: 0.18, delay: (fabActions.length - 1 - i) * 0.05, ease: 'easeOut' }}
          >
            {/* Tooltip label */}
            <span
              className="text-[0.6875rem] font-semibold text-white px-2 py-0.5 rounded-md pointer-events-none select-none whitespace-nowrap"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
            >
              {action.label}
            </span>

            {/* Icon button — fixed size, always right-aligned */}
            <motion.button
              onClick={() => onAction(action.id)}
              className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center shadow-md"
              style={{ background: '#1c1c28', border: '1px solid rgba(255,255,255,0.12)' }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.93 }}
            >
              <action.icon className="w-4 h-4 text-white" />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: primary,
          boxShadow: `0 4px 20px ${primary}55`,
        }}
        animate={{ rotate: hovered ? 90 : 0 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
      >
        <MoreHorizontal className="w-5 h-5 text-white" />
      </motion.button>
    </div>
  )
}

// ─── Share confirmation popup ─────────────────────────────────────────────────

function SharePopup({ brand, onClose }) {
  const [sharing, setSharing] = useState(false)
  const [isShared, setIsShared] = useState(brand.is_shared || false)
  const [error, setError] = useState('')

  async function handleToggleShare() {
    setSharing(true)
    setError('')
    try {
      const { shareBrand } = await import('@/services/brandService')
      const updated = await shareBrand(brand.id, !isShared)
      setIsShared(!isShared)
    } catch (err) {
      setError(err.message)
    } finally {
      setSharing(false)
    }
  }

  const shareUrl = `${window.location.origin}/public/dashboard/${brand.id}`

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-[400px] rounded-2xl overflow-hidden"
        style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.08)' }}
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(95,57,248,0.15)' }}>
              <Share2 className="w-4 h-4" style={{ color: '#5f39f8' }} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Share Dashboard Link</p>
              <p className="text-slate-500 text-[0.6875rem]">{brand.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            By sharing this dashboard publicly, anyone with the link will be able to view the data. They will not have edit access.
          </p>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(218,30,40,0.08)', border: '1px solid rgba(218,30,40,0.2)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-white">Public Access</span>
            <button
              onClick={handleToggleShare}
              disabled={sharing}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isShared ? 'bg-primary' : 'bg-slate-600'
                }`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isShared ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {isShared && (
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col gap-2">
              <span className="text-xs text-slate-400">Shareable Link:</span>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Emailer HTML builder ─────────────────────────────────────────────────────

function buildEmailHtml({ title, subject, bodyText, ctaLink, ctaLabel, screenshot, primaryColor, stats, statsEnabled }) {
  const visibleStats = statsEnabled ? stats : []

  // Stats grid — each stat in its own cell, max 4 per row
  function statsGridHtml(items) {
    if (!items.length) return ''
    const rows = []
    for (let i = 0; i < items.length; i += 4) rows.push(items.slice(i, i + 4))
    return rows.map(row => `
      <tr>
        ${row.map((s, idx) => `
          ${idx > 0 ? '<td width="8" style="font-size:0;line-height:0;">&nbsp;</td>' : ''}
          <td class="stat-cell" width="${Math.floor((100 - (row.length - 1) * 1.5) / row.length)}%" style="text-align:center;padding:14px 6px;background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;vertical-align:middle;">
            <p style="font-size:20px;font-weight:700;color:${primaryColor};margin:0 0 4px;line-height:1;">${s.value}</p>
            <p style="font-size:10px;color:#64748b;margin:0;text-transform:uppercase;letter-spacing:0.06em;">${s.label}</p>
            ${s.sub ? `<p style="font-size:10px;color:#94a3b8;margin:4px 0 0;">${s.sub}</p>` : ''}
          </td>
        `).join('')}
      </tr>`).join('<tr><td height="8" style="font-size:0;line-height:0;">&nbsp;</td></tr>')
  }

  const statsHtml = visibleStats.length ? `
    <tr>
      <td class="content-pad" style="padding:0 40px 8px;">
        <p style="font-size:11px;font-weight:700;color:#6b7280;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.1em;">Key Metrics</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${statsGridHtml(visibleStats)}
        </table>
      </td>
    </tr>` : ''

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${subject || title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @media only screen and (max-width:620px) {
      .email-wrapper  { padding: 16px 8px !important; }
      .email-card     { width: 100% !important; border-radius: 8px !important; }
      .header-pad     { padding: 24px 20px 20px !important; }
      .header-title   { font-size: 20px !important; }
      .content-pad    { padding-left: 20px !important; padding-right: 20px !important; }
      .cta-pad        { padding: 20px 20px 28px !important; }
      .stat-cell      { display: block !important; width: 100% !important; margin-bottom: 8px !important; }
      .screenshot-img { width: 100% !important; height: auto !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f2f5;">
  <tr>
    <td class="email-wrapper" align="center" style="padding:40px 20px;">
      <!--[if mso]><table width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table class="email-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td class="header-pad" style="background-color:${primaryColor};padding:36px 40px 32px;">
            <h1 class="header-title" style="color:#ffffff;font-size:24px;font-weight:700;margin:0${subject ? ' 0 10px' : ''};line-height:1.3;letter-spacing:-0.02em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${title || 'Dashboard Update'}</h1>
            ${subject ? `<p style="color:rgba(255,255,255,0.82);font-size:14px;margin:0;line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${subject}</p>` : ''}
          </td>
        </tr>

        <!-- Dashboard Screenshot -->
        ${screenshot ? `
        <tr>
          <td style="padding:0;line-height:0;font-size:0;">
            <img class="screenshot-img" src="${screenshot}" width="600" alt="Dashboard Preview" style="display:block;width:100%;max-width:600px;height:auto;border:none;outline:none;-ms-interpolation-mode:bicubic;">
          </td>
        </tr>
        ` : ''}

        <!-- Body text -->
        ${bodyText ? `
        <tr>
          <td class="content-pad" style="padding:32px 40px ${visibleStats.length ? '24px' : '8px'};">
            <p style="color:#374151;font-size:15px;line-height:1.8;margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${bodyText.replace(/\n/g, '<br>')}</p>
          </td>
        </tr>
        ` : ''}

        <!-- Key Stats -->
        ${statsHtml}

        <!-- CTA -->
        <tr>
          <td class="cta-pad" style="padding:${(bodyText || visibleStats.length) ? '28px' : '36px'} 40px 44px;text-align:center;">
            <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ctaLink || '#'}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" stroke="f" fillcolor="${primaryColor}"><w:anchorlock/><center style="color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;">${ctaLabel || 'View Live Dashboard'}</center></v:roundrect><![endif]-->
            <!--[if !mso]><!--><a href="${ctaLink || '#'}" target="_blank" style="display:inline-block;background-color:${primaryColor};color:#ffffff;font-size:14px;font-weight:600;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:-0.01em;mso-hide:all;">${ctaLabel || 'View Live Dashboard'}</a><!--<![endif]-->
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 40px 22px;border-top:1px solid #e5e7eb;text-align:center;">
            <a href="https://infovisionsocial.com" target="_blank" style="color:#9ca3af;font-size:12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;text-decoration:none;">Infovision.inc © 2026</a>
          </td>
        </tr>

      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`
}

// ─── Emailer modal ────────────────────────────────────────────────────────────

// Derive marketing pre-fill from brand data
function defaultEmailerContent(brand) {
  const exec = brand.data?.executiveSummary
  const period = brand.config?.dataPeriod?.range || ''
  const name = brand.label || brand.config?.fullName || 'the brand'
  const title = `${name} — Brand Intelligence Report`
  const subject = exec?.subtitle || `Your latest media coverage${period ? ` · ${period}` : ''}`
  const bodyText = `We're pleased to share the latest brand intelligence report for ${name}${period ? ` covering ${period}` : ''}. The snapshot below highlights key performance across social and traditional media channels — from sentiment trends and Share of Voice to top publications and engagement drivers.\n\nClick the button below to explore the full interactive dashboard for deeper analysis and drill-down insights.`
  return { title, subject, bodyText }
}

function EmailerModal({ brand, onClose }) {
  const kpis = brand.data?.executiveSummary?.kpis || []
  const primary = brand.tokens.primaryColor
  const defaults = defaultEmailerContent(brand)

  // Editor state — defaults overwritten when saved settings load
  const [title, setTitle] = useState(defaults.title)
  const [subject, setSubject] = useState(defaults.subject)
  const [bodyText, setBodyText] = useState(defaults.bodyText)
  const [ctaLink, setCtaLink] = useState(`${window.location.origin}/public/dashboard/${brand.id}`)
  const [ctaLabel, setCtaLabel] = useState('View Live Dashboard')
  const [statsEnabled, setStatsEnabled] = useState(false)
  const [selectedStats, setSelectedStats] = useState([]) // array of kpi ids
  const [screenshot, setScreenshot] = useState(null)

  const [capturing, setCapturing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [tab, setTab] = useState('edit') // 'edit' | 'preview'

  // Load saved settings on mount — saved values take precedence over defaults
  useEffect(() => {
    getEmailer(brand.id).then(s => {
      if (!s || Object.keys(s).length === 0) return
      if (s.title) setTitle(s.title)
      if (s.subject) setSubject(s.subject)
      if (s.bodyText) setBodyText(s.bodyText)
      if (s.ctaLink) setCtaLink(s.ctaLink)
      if (s.ctaLabel) setCtaLabel(s.ctaLabel)
      if (s.statsEnabled !== undefined) setStatsEnabled(s.statsEnabled)
      if (s.selectedStats) setSelectedStats(s.selectedStats)
      if (s.screenshot) setScreenshot(s.screenshot)
    }).catch(() => setLoadError('Could not load saved emailer settings.'))
  }, [brand.id])

  const captureScreenshot = useCallback(async () => {
    // Capture the full main content area at 100% width × 100vh
    const target = document.querySelector('main')
    if (!target) return
    setCapturing(true)
    try {
      const canvas = await html2canvas(target, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f1f5f9',
        logging: false,
        height: window.innerHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scrollY: 0,
      })
      setScreenshot(canvas.toDataURL('image/jpeg', 0.88))
    } catch (_) {
      // silently fail — user can retry
    } finally {
      setCapturing(false)
    }
  }, [])

  // Auto-capture when modal mounts (with brief delay so it doesn't race the overlay render)
  useEffect(() => {
    const t = setTimeout(captureScreenshot, 120)
    return () => clearTimeout(t)
  }, [captureScreenshot])

  function toggleStat(id) {
    setSelectedStats(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const activeStats = kpis.filter(k => selectedStats.includes(k.id))

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      await saveEmailer(brand.id, { title, subject, bodyText, ctaLink, ctaLabel, statsEnabled, selectedStats, screenshot })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleDownload() {
    const html = buildEmailHtml({
      title, subject, bodyText, ctaLink, ctaLabel, screenshot,
      primaryColor: primary,
      stats: activeStats,
      statsEnabled,
    })
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(brand.label || brand.id).replace(/\s+/g, '-').toLowerCase()}-emailer.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Preview iframe content
  const previewHtml = buildEmailHtml({
    title, subject, bodyText, ctaLink, ctaLabel, screenshot,
    primaryColor: primary,
    stats: activeStats,
    statsEnabled,
  })

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-[980px] h-[88vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#0d0d15', border: '1px solid rgba(255,255,255,0.08)' }}
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.22 }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${primary}22` }}>
              <Mail className="w-4 h-4" style={{ color: primary }} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-none">Emailer</p>
              <p className="text-slate-500 text-[0.6875rem] mt-0.5">{brand.label}</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {[['edit', 'Edit'], ['preview', 'Preview']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: tab === id ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: tab === id ? '#fff' : '#697077',
                }}>
                {label}
              </button>
            ))}
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">

          {/* Left — editor (always mounted, hidden in preview tab) */}
          <div className={`flex flex-col border-r overflow-y-auto ${tab === 'preview' ? 'hidden' : 'flex'}`}
            style={{ width: '380px', flexShrink: 0, borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex-1 px-6 py-5 space-y-5">

              {loadError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-amber-400"
                  style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)' }}>
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{loadError}
                </div>
              )}

              {/* Content fields */}
              <div className="space-y-3">
                <SectionLabel>Content</SectionLabel>

                <div>
                  <p className="text-xs text-slate-400 mb-1">Headline</p>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Brand Intelligence Report – Q2 2025"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none placeholder:text-slate-600"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-1">Subheading / Tagline</p>
                  <input value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Your latest media coverage summary"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none placeholder:text-slate-600"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-1">Body Text</p>
                  <textarea value={bodyText} onChange={e => setBodyText(e.target.value)}
                    rows={4}
                    placeholder="Add a brief intro or context for the recipient…"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none placeholder:text-slate-600"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
                </div>
              </div>

              {/* CTA fields */}
              <div className="space-y-3">
                <SectionLabel>Call to Action</SectionLabel>

                {/* <div>
                  <p className="text-xs text-slate-400 mb-1">Dashboard Link (URL)</p>
                  <input value={ctaLink} onChange={e => setCtaLink(e.target.value)}
                    placeholder="https://…"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none placeholder:text-slate-600 font-mono"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
                </div> */}

                <div>
                  <p className="text-xs text-slate-400 mb-1">Button Label</p>
                  <input value={ctaLabel} onChange={e => setCtaLabel(e.target.value)}
                    placeholder="View Live Dashboard"
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none placeholder:text-slate-600"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
                </div>
              </div>

              {/* Key Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SectionLabel>Key Stats</SectionLabel>
                  <button onClick={() => setStatsEnabled(v => !v)} className="flex items-center gap-1.5 transition-opacity">
                    {statsEnabled
                      ? <ToggleRight className="w-5 h-5" style={{ color: primary }} />
                      : <ToggleLeft className="w-5 h-5 text-slate-600" />}
                    <span className="text-[0.6875rem] font-semibold" style={{ color: statsEnabled ? primary : '#697077' }}>
                      {statsEnabled ? 'On' : 'Off'}
                    </span>
                  </button>
                </div>

                {statsEnabled && (
                  kpis.length === 0 ? (
                    <p className="text-slate-600 text-xs">No KPIs found in executive summary data.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {kpis.map(kpi => {
                        const on = selectedStats.includes(kpi.id)
                        return (
                          <button key={kpi.id} onClick={() => toggleStat(kpi.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all"
                            style={{
                              background: on ? `${primary}14` : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${on ? primary + '40' : 'rgba(255,255,255,0.07)'}`,
                            }}>
                            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                              style={{ background: on ? primary : 'rgba(255,255,255,0.08)' }}>
                              {on && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white font-medium truncate">{kpi.label}</p>
                              <p className="text-[0.6875rem] text-slate-500 truncate">{kpi.value}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )
                )}
              </div>

              {/* Screenshot */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <SectionLabel>Dashboard Screenshot</SectionLabel>
                  <button onClick={captureScreenshot} disabled={capturing}
                    className="flex items-center gap-1 text-[0.6875rem] font-semibold transition-colors disabled:opacity-50"
                    style={{ color: primary }}>
                    <RefreshCw className={`w-3 h-3 ${capturing ? 'animate-spin' : ''}`} />
                    {capturing ? 'Capturing…' : 'Recapture'}
                  </button>
                </div>

                <div className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', minHeight: '100px' }}>
                  {capturing ? (
                    <div className="flex items-center justify-center py-8 gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                      <span className="text-xs text-slate-600">Capturing…</span>
                    </div>
                  ) : screenshot ? (
                    <img src={screenshot} alt="Dashboard preview" className="w-full block rounded-xl" />
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <span className="text-xs text-slate-600">Screenshot pending…</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Save footer */}
            <div className="px-6 py-4 border-t flex-shrink-0 space-y-2"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {saveError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400"
                  style={{ background: 'rgba(218,30,40,0.08)', border: '1px solid rgba(218,30,40,0.2)' }}>
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{saveError}
                </div>
              )}
              <button onClick={handleSave} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: saved ? '#24a148' : 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? 'Saving…' : 'Save Emailer Settings'}
              </button>
            </div>
          </div>

          {/* Right — email preview */}
          <div className={`flex-1 flex flex-col min-w-0 ${tab === 'edit' ? 'flex' : 'flex'}`}
            style={{ background: '#0a0a12' }}>

            {/* Preview toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Email Preview</p>
              <button onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all"
                style={{ background: primary, boxShadow: `0 2px 12px ${primary}55` }}>
                <Download className="w-3.5 h-3.5" />
                Download Emailer
              </button>
            </div>

            {/* Iframe preview */}
            <div className="flex-1 overflow-auto p-6">
              <div className="mx-auto" style={{ maxWidth: '640px' }}>
                <iframe
                  srcDoc={previewHtml}
                  title="Emailer preview"
                  className="w-full rounded-xl shadow-2xl"
                  style={{ minHeight: '700px', border: 'none', background: '#f0f2f5' }}
                />
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardManager({ brand, onUpdate, onDelete }) {
  const navigate = useNavigate()
  const [panelOpen, setPanelOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [emailerOpen, setEmailerOpen] = useState(false)

  // Settings panel state
  const [color, setColor] = useState(brand.tokens.primaryColor)
  const [secondary, setSecondary] = useState(brand.tokens.secondaryColor || brand.tokens.primaryColor)
  const [label, setLabel] = useState(brand.label)
  const [paletteId, setPaletteId] = useState(brand.tokens.paletteId || 'default')
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Custom palette state — seeded from brand tokens if already custom, else from defaults
  const initCustom = brand.tokens.paletteId === 'custom'
  const [customSmColor, setCustomSmColor] = useState(initCustom ? (brand.tokens.smColor || CUSTOM_PALETTE_DEFAULTS.smColor) : CUSTOM_PALETTE_DEFAULTS.smColor)
  const [customTmColor, setCustomTmColor] = useState(initCustom ? (brand.tokens.tmColor || CUSTOM_PALETTE_DEFAULTS.tmColor) : CUSTOM_PALETTE_DEFAULTS.tmColor)
  const [customCharts, setCustomCharts] = useState(initCustom ? (brand.tokens.chartColors || CUSTOM_PALETTE_DEFAULTS.chartColors) : [...CUSTOM_PALETTE_DEFAULTS.chartColors])
  const [jsonFile, setJsonFile] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [bgFile, setBgFile] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [delConfirm, setDelConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const primary = brand.tokens.primaryColor

  function handleAction(id) {
    if (id === 'home') navigate('/')
    if (id === 'settings') setPanelOpen(true)
    if (id === 'emailer') setEmailerOpen(true)
    if (id === 'share') setShareOpen(true)
  }

  async function handleSave() {
    setLoading(true)
    setError('')
    try {
      const changes = {}

      if (label.trim() && label.trim() !== brand.label) changes.label = label.trim()

      const primaryChanged = color !== brand.tokens.primaryColor
      const secondaryChanged = secondary !== (brand.tokens.secondaryColor || brand.tokens.primaryColor)
      const paletteChanged = paletteId !== (brand.tokens.paletteId || 'default')
      const customColorsChanged = paletteId === 'custom' && (
        customSmColor !== (brand.tokens.smColor || CUSTOM_PALETTE_DEFAULTS.smColor) ||
        customTmColor !== (brand.tokens.tmColor || CUSTOM_PALETTE_DEFAULTS.tmColor) ||
        customCharts.some((c, i) => c !== (brand.tokens.chartColors?.[i] || CUSTOM_PALETTE_DEFAULTS.chartColors[i]))
      )

      if (primaryChanged || secondaryChanged || paletteChanged || customColorsChanged) {
        const customTokens = { smColor: customSmColor, tmColor: customTmColor, chartColors: customCharts }
        const palette = getPalette(paletteId, customTokens)
        changes.tokens = {
          primaryColor: color,
          secondaryColor: secondary,
          navActiveBg: hexToNavBg(color),
          navActiveColor: color,
          smColor: palette.smColor,
          tmColor: palette.tmColor,
          chartColors: palette.chartColors,
          paletteId,
        }
      }

      if (logoFile) changes.logo = logoFile
      if (bgFile) changes.heroBg = bgFile

      if (jsonFile) {
        const text = await jsonFile.text()
        const parsed = JSON.parse(text)
        changes.bundle = parsed
        if (parsed.brand?.primaryColor && color === brand.tokens.primaryColor) {
          setColor(parsed.brand.primaryColor)
        }
      }

      if (Object.keys(changes).length === 0) { setPanelOpen(false); return }

      const updated = await updateBrand(brand.id, changes)
      onUpdate(updated)
      setSaved(true)
      setTimeout(() => { setSaved(false); setPanelOpen(false) }, 1200)
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    try {
      await deleteBrand(brand.id)
      onDelete()
    } catch (err) {
      setError(err.message || 'Delete failed')
      setDelConfirm(false)
    }
  }

  return (
    <>
      <SpeedDial primary={primary} onAction={handleAction} />

      {/* Settings panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setPanelOpen(false); setDelConfirm(false) }}
            />

            <motion.div
              className="fixed right-0 top-0 bottom-0 z-50 w-[340px] flex flex-col overflow-hidden"
              style={{ background: '#0d0d15', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: primary }} />
                  <div>
                    <p className="text-white text-sm font-semibold leading-none">Manage Dashboard</p>
                    <p className="text-slate-600 text-[0.6875rem] mt-0.5">{brand.label}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setPanelOpen(false); setDelConfirm(false) }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
                {/* Identity */}
                <div className="space-y-3">
                  <SectionLabel>Identity</SectionLabel>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Brand Name</p>
                    <input
                      type="text" value={label} onChange={e => setLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                    />
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 mb-1">Primary Color</p>
                    <div className="flex items-center gap-2">
                      <input type="color" value={color} onChange={e => setColor(e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer p-0.5 flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <input type="text" value={color}
                        onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v) }}
                        className="flex-1 px-3 py-2 rounded-lg text-xs text-white font-mono outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
                      <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: color }} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 mb-1">Secondary Color</p>
                    <div className="flex items-center gap-2">
                      <input type="color" value={secondary} onChange={e => setSecondary(e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer p-0.5 flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <input type="text" value={secondary}
                        onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setSecondary(v) }}
                        className="flex-1 px-3 py-2 rounded-lg text-xs text-white font-mono outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }} />
                      <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: secondary }} />
                    </div>
                  </div>
                </div>

                {/* Chart Palette — collapsible */}
                <div>
                  {/* Accordion header */}
                  <button
                    type="button"
                    onClick={() => setPaletteOpen(o => !o)}
                    className="w-full flex items-center justify-between py-1 mb-1 group"
                  >
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-slate-600 group-hover:text-slate-400 transition-colors">
                      Chart Palette
                    </p>
                    <div className="flex items-center gap-2">
                      {/* Active palette preview dots */}
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

                  {/* Accordion body */}
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
                                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: '#5f39f8' }}>
                                    <Check className="w-2 h-2 text-white" strokeWidth={3} />
                                  </span>
                                )}
                                <div className="flex items-center gap-1 flex-wrap">
                                  {[p.smColor, p.tmColor, ...p.chartColors.slice(0, 3)].map((c, i) => (
                                    <span key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
                                  ))}
                                </div>
                                <p className={`text-[0.625rem] font-semibold leading-none ${isActive ? 'text-white' : 'text-slate-400'}`}>{p.name}</p>
                                <p className="text-[0.5625rem] text-slate-600 leading-none">{p.industry}</p>
                              </button>
                            )
                          })}

                          {/* Custom palette card */}
                          {(() => {
                            const isActive = paletteId === 'custom'
                            return (
                              <button
                                type="button"
                                onClick={() => setPaletteId('custom')}
                                className="relative flex flex-col gap-1.5 p-2.5 rounded-lg text-left transition-all col-span-2"
                                style={{
                                  background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                                  border: isActive ? '1.5px solid rgba(255,255,255,0.55)' : '1px solid rgba(255,255,255,0.07)',
                                  boxShadow: isActive ? '0 0 0 1px rgba(95,57,248,0.4)' : 'none',
                                }}
                              >
                                {isActive && (
                                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: '#5f39f8' }}>
                                    <Check className="w-2 h-2 text-white" strokeWidth={3} />
                                  </span>
                                )}
                                <div className="flex items-center gap-1 flex-wrap">
                                  {[customSmColor, customTmColor, ...customCharts.slice(0, 4)].map((c, i) => (
                                    <span key={i} className="w-3 h-3 rounded-full border border-white/20" style={{ background: c }} />
                                  ))}
                                </div>
                                <p className={`text-[0.625rem] font-semibold leading-none ${isActive ? 'text-white' : 'text-slate-400'}`}>Custom</p>
                                <p className="text-[0.5625rem] text-slate-600 leading-none">Brand-specific palette</p>
                              </button>
                            )
                          })()}
                        </div>

                        {/* Custom palette color pickers — visible only when custom is selected */}
                        <AnimatePresence initial={false}>
                          {paletteId === 'custom' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="mt-3 space-y-2 px-0.5">
                                {/* SM + TM row */}
                                {[
                                  { label: 'SM Color', value: customSmColor, set: setCustomSmColor },
                                  { label: 'TM Color', value: customTmColor, set: setCustomTmColor },
                                ].map(({ label, value, set }) => (
                                  <div key={label} className="flex items-center gap-2">
                                    <input type="color" value={value} onChange={e => set(e.target.value)}
                                      className="w-7 h-7 rounded cursor-pointer flex-shrink-0 p-0.5"
                                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <input type="text" value={value}
                                      onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) set(e.target.value) }}
                                      className="flex-1 px-2 py-1 rounded text-xs text-white font-mono outline-none"
                                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                                    <span className="text-[0.625rem] text-slate-500 w-14 text-right flex-shrink-0">{label}</span>
                                  </div>
                                ))}

                                {/* Divider */}
                                <p className="text-[0.5625rem] font-bold uppercase tracking-widest text-slate-600 pt-1">Chart Colors</p>

                                {/* 6 chart color pickers */}
                                {customCharts.map((c, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <input type="color" value={c}
                                      onChange={e => setCustomCharts(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                                      className="w-7 h-7 rounded cursor-pointer flex-shrink-0 p-0.5"
                                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <input type="text" value={c}
                                      onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setCustomCharts(prev => prev.map((v, j) => j === i ? e.target.value : v)) }}
                                      className="flex-1 px-2 py-1 rounded text-xs text-white font-mono outline-none"
                                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                                    <span className="text-[0.625rem] text-slate-500 w-14 text-right flex-shrink-0">Color {i + 1}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Images */}
                <div className="space-y-3">
                  <SectionLabel>Images</SectionLabel>
                  <FileRow label="Logo" accept="image/*" icon={Image} value={logoFile} onChange={setLogoFile} />
                  <FileRow label="Background Image" accept="image/*" icon={Upload} value={bgFile} onChange={setBgFile} />
                </div>

                {/* Data */}
                <div className="space-y-3">
                  <SectionLabel>Data</SectionLabel>
                  <FileRow label="Replace Data Bundle (JSON)" accept=".json,application/json" icon={FileJson} value={jsonFile} onChange={setJsonFile} />
                  <p className="text-[0.6875rem] text-slate-600 leading-relaxed">
                    Upload a new brand bundle JSON to replace all dashboard data. Color and config inside the file will also be applied.
                  </p>
                </div>

                {/* Danger zone */}
                <div className="space-y-2">
                  <SectionLabel>Delete This Dashboard</SectionLabel>
                  {!delConfirm ? (
                    <button
                      onClick={() => setDelConfirm(true)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 transition-colors"
                      style={{ background: 'rgba(218,30,40,0.06)', border: '1px solid rgba(218,30,40,0.15)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Dashboard
                      <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />
                    </button>
                  ) : (
                    <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(218,30,40,0.08)', border: '1px solid rgba(218,30,40,0.2)' }}>
                      <p className="text-red-400 text-xs font-semibold">Delete "{brand.label}"?</p>
                      <p className="text-slate-500 text-[0.6875rem]">This removes the brand folder from disk permanently.</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setDelConfirm(false)}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs text-slate-400"
                          style={{ background: 'rgba(255,255,255,0.05)' }}>Cancel</button>
                        <button onClick={handleDelete}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{ background: '#da1e28' }}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(218,30,40,0.08)', border: '1px solid rgba(218,30,40,0.15)' }}>
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-xs">{error}</p>
                  </div>
                )}
              </div>

              {/* Save */}
              <div className="px-5 py-4 border-t border-white/[0.06] flex-shrink-0">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: saved ? '#24a148' : primary }}
                >
                  {saved ? <><Check className="w-4 h-4" /> Saved</> : loading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Emailer modal */}
      <AnimatePresence>
        {emailerOpen && (
          <EmailerModal brand={brand} onClose={() => setEmailerOpen(false)} />
        )}
      </AnimatePresence>

      {/* Share popup */}
      <AnimatePresence>
        {shareOpen && (
          <SharePopup brand={brand} onClose={() => setShareOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
