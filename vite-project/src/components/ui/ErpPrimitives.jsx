import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'

const toneClasses = {
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  teal: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  blue: 'border-sky-200 bg-sky-50 text-sky-800',
  rose: 'border-rose-200 bg-rose-50 text-rose-800',
  orange: 'border-orange-200 bg-orange-50 text-orange-800',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  slate: 'border-slate-200 bg-slate-100 text-slate-700',
}

const iconToneClasses = {
  amber: 'bg-amber-100 text-amber-700',
  teal: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-sky-100 text-sky-700',
  rose: 'bg-rose-100 text-rose-700',
  orange: 'bg-orange-100 text-orange-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  slate: 'bg-slate-200 text-slate-700',
}

export const WorkspacePage = ({ children, className = '' }) => (
  <div className={`page-shell ${className}`}>{children}</div>
)

export const PageHeader = ({
  eyebrow,
  title,
  description,
  badges = [],
  actions = null,
  className = '',
}) => (
  <section className={`panel relative overflow-hidden p-6 sm:p-8 ${className}`}>
    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-emerald-50/80 via-white/0 to-amber-50/70" />
    <div className="relative erp-page-header">
      <div className="max-w-3xl">
        {eyebrow ? <p className="section-kicker">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
        ) : null}
        {badges.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span key={badge} className="status-pill">
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {actions ? <div className="erp-page-actions">{actions}</div> : null}
    </div>
  </section>
)

export const SectionCard = ({
  eyebrow,
  title,
  description,
  action = null,
  children,
  className = '',
  contentClassName = '',
}) => (
  <section className={`panel p-6 ${className}`}>
    {(eyebrow || title || description || action) && (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? <p className="section-kicker">{eyebrow}</p> : null}
          {title ? <h2 className="mt-2 section-heading">{title}</h2> : null}
          {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        {action}
      </div>
    )}
    <div className={title || description || action || eyebrow ? `mt-6 ${contentClassName}` : contentClassName}>
      {children}
    </div>
  </section>
)

export const StatusBadge = ({ children, tone = 'slate', className = '' }) => (
  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone] || toneClasses.slate} ${className}`}>
    {children}
  </span>
)

export const KpiCard = ({
  icon: Icon,
  title,
  value,
  detail,
  tone = 'slate',
  to = '',
  ctaLabel = 'Open',
}) => {
  const toneClass = toneClasses[tone] || toneClasses.slate
  const iconTone = iconToneClasses[tone] || iconToneClasses.slate
  const content = (
    <div className="erp-kpi-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          {detail ? <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p> : null}
        </div>
        {Icon ? (
          <div className={`rounded-2xl border px-3 py-3 ${toneClass}`}>
            <div className={`flex h-5 w-5 items-center justify-center rounded-xl ${iconTone}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
        ) : null}
      </div>
      {to ? (
        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  )

  return to ? (
    <Link to={to} className="block">
      {content}
    </Link>
  ) : (
    content
  )
}

export const DataTableShell = ({ children, className = '' }) => (
  <div className={`erp-table-shell ${className}`}>{children}</div>
)

export const ListRow = ({ children, className = '' }) => (
  <div className={`erp-list-row ${className}`}>{children}</div>
)

export const SearchField = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className = '',
  inputClassName = '',
  inputRef = null,
}) => (
  <div className={`relative ${className}`}>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      type="text"
      ref={inputRef}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={`input-primary pl-10 ${inputClassName}`}
    />
  </div>
)

export const FieldLabel = ({ children, optional = false }) => (
  <label className="mb-2 block text-sm font-medium text-slate-700">
    {children}
    {optional ? <span className="ml-2 text-xs font-normal text-slate-400">Optional</span> : null}
  </label>
)

export const EmptyCard = ({ title, message, action = null, icon: Icon = null }) => (
  <div className="erp-empty-state">
    {Icon ? (
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="h-6 w-6" />
      </div>
    ) : null}
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{message}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
)
