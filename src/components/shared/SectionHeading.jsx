const SECTION_TEXT_COLOR = 'rgb(51 65 85 / 50%)'

export function SectionHeading({ title, tag }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-[0.8125rem] font-semibold whitespace-nowrap" style={{ color: SECTION_TEXT_COLOR }}>{title}</h2>
      <div className="flex-1 h-px bg-slate-200" />
      {tag && (
        <span className="text-[0.5625rem] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: SECTION_TEXT_COLOR }}>
          {tag}
        </span>
      )}
    </div>
  )
}
