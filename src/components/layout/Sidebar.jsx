import {
  BarChart2,
  Smartphone,
  Newspaper,
  Link2,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBrand } from '@/context/BrandContext'

const ICON_MAP = {
  BarChart2,
  Smartphone,
  Newspaper,
  Link2,
  Target,
}

function NavIcon({ name, className, style }) {
  const Icon = ICON_MAP[name]
  if (!Icon) return null
  return <Icon className={className} style={style} />
}

function NavItem({ item, activePage, activeSection, onNavigate, navActiveBg, navActiveColor }) {
  const hasChildren = item.children && item.children.length > 0
  const isPageActive = activePage === item.id

  return (
    <div>
      <button
        onClick={() => onNavigate(item.id)}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-150 text-left group',
          isPageActive
            ? 'font-medium'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
        style={isPageActive ? { background: navActiveBg, color: navActiveColor } : {}}
      >
        <NavIcon
          name={item.icon}
          className={cn(
            'h-4 w-4 shrink-0',
            isPageActive ? '' : 'text-muted-foreground group-hover:text-foreground'
          )}
          style={isPageActive ? { color: navActiveColor } : {}}
        />
        <span className="flex-1 leading-none text-[0.8125rem] font-semibold">{item.label}</span>
      </button>

      {hasChildren && (
        <div className="pl-9 mt-0.5 flex flex-col gap-0.5 pb-1">
          {item.children.map(child => (
            <button
              key={child.id}
              onClick={() => onNavigate(item.id, child.id)}
              className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
            >
              {child.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ config, activePage, activeSection, onNavigate, isPublic }) {
  const { logo, tokens } = useBrand()
  const { navActiveBg, navActiveColor } = tokens

  return (
    <aside className="w-[240px] shrink-0 flex flex-col h-screen fixed top-0 left-0 bg-white border-r border-border z-50 overflow-y-auto">
      {/* Brand header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        {logo ? (
          <img src={logo} alt={config.name} style={{ maxHeight: '40px', width: 'auto' }} />
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-sm" style={{ background: navActiveColor }}>
              {config.fullName.charAt(0)}
            </div>
            <span className="font-bold text-[15px] tracking-tight text-slate-800">{config.fullName.split(' ')[0]}</span>
          </div>
        )}
        <div className="text-[0.5625rem] font-semibold text-muted-foreground uppercase tracking-widest" style={{ marginTop: '8px' }}>
          {config.subtitle}
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 py-2">
        {config.nav.map(group => (
          <div key={group.section} className="px-3 py-2">
            <p className="text-[0.5625rem] font-semibold text-muted-foreground/60 uppercase tracking-widest px-2 mb-1.5">
              {group.section}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(item => (
                <NavItem
                  key={item.id}
                  item={item}
                  activePage={activePage}
                  activeSection={activeSection}
                  onNavigate={onNavigate}
                  navActiveBg={navActiveBg}
                  navActiveColor={navActiveColor}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Data period footer */}
      <div className="mx-3 mb-2 mt-auto rounded-lg bg-muted px-3 py-3">
        <p className="text-[11px] font-semibold text-foreground mb-1">
          {config.dataPeriod.label}
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {config.dataPeriod.range}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          SM: {config.dataPeriod.smPosts} · TM: {config.dataPeriod.tmArticles}
        </p>
      </div>

      {/* Infovision footer & SignOut */}
      <div className="px-5 pb-4 pt-2 flex items-center justify-between">
        <a
          href="https://infovisionsocial.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-slate-400 no-underline hover:text-slate-500 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          Infovision.inc © 2026
        </a>
        
        {!isPublic && (
           <button 
             onClick={() => {
               import('@/lib/auth').then(({ clearToken }) => {
                 clearToken();
                 window.location.href = '/';
               });
             }}
             className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
           >
             Sign Out
           </button>
        )}
      </div>
    </aside>
  )
}
