import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckSquare, LayoutDashboard, StickyNote } from 'lucide-react'
import AppContext from '../context/app-context.js'
import { getAppsForBusiness, getBusinessMeta } from '../config/businessConfigs'

const moduleTone = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
}

const softwareTone = {
  restaurant: 'bg-amber-50 text-amber-800 border-amber-200',
  cafe: 'bg-teal-50 text-teal-800 border-teal-200',
  shop: 'bg-blue-50 text-blue-800 border-blue-200',
  general: 'bg-stone-100 text-stone-700 border-stone-300',
}

const workspaceTools = [
  { name: 'Notes', icon: StickyNote, description: 'Recipes, supplier notes, SOPs, and internal references.', path: '/notes', permission: 'notes.read' },
  { name: 'Tasks', icon: CheckSquare, description: 'Follow-ups, purchasing tasks, and operational checklists.', path: '/todos', permission: 'todos.read' },
]

const AppSwitcher = () => {
  const { hasPermission, currentOrgName, orgBusinessType } = useContext(AppContext)
  const businessType = orgBusinessType || 'general'
  const businessMeta = getBusinessMeta(businessType)
  const apps = getAppsForBusiness(businessType)

  const visibleModules = apps.filter(app => app.id !== 'overview' && app.id !== 'settings').filter(app => !app.permission || hasPermission(app.permission))
  const settingsApp = apps.find(app => app.id === 'settings')
  const showSettings = settingsApp && (!settingsApp.permission || hasPermission(settingsApp.permission))
  const visibleTools = workspaceTools.filter(tool => !tool.permission || hasPermission(tool.permission))

  return (
    <div className="page-shell">
      <div className="grid gap-6 xl:grid-cols-[1.45fr,0.9fr]">
        <section className="panel p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Work Areas</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{currentOrgName || 'My Business'}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{businessMeta.launcherDescription}</p>
            </div>
            <Link to="/dashboard" className="text-sm font-semibold text-slate-900">
              Back to command center
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {visibleModules.map(module => {
              const Icon = module.icon
              const tone = moduleTone[module.accent] || moduleTone.slate
              const visibleMenu = module.menu.filter(item => !item.permission || hasPermission(item.permission))

              return (
                <Link
                  key={module.id}
                  to={module.basePath}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className={`inline-flex rounded-2xl border px-3 py-3 ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">{module.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {visibleMenu.slice(0, 3).map(item => (
                      <span key={item.path} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {item.label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Open area
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="panel p-6">
            <p className="section-kicker">Your Software</p>
            <h2 className="mt-2 section-heading">The business package active on your workspace.</h2>
            <div className={`mt-5 rounded-3xl border p-5 ${softwareTone[businessType] || softwareTone.general}`}>
              <div className="flex items-center gap-4">
                <div className="rounded-2xl border border-current/20 bg-white/50 p-3">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{businessMeta.productName}</p>
                  <p className="mt-1 text-xs opacity-75">{businessMeta.workspaceSummary}</p>
                </div>
              </div>
            </div>
            <Link
              to="/settings"
              className="mt-4 flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm transition hover:border-slate-300 hover:shadow-sm"
            >
              <span className="font-semibold text-slate-900">Change business package</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            {businessType === 'general' && (
              <p className="mt-4 rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
                Legacy Workspace is only kept here for older accounts. Restaurant, Cafe, or Shop is the cleaner Nepal-first setup.
              </p>
            )}
          </section>

          {visibleTools.length > 0 && (
            <section className="panel p-6">
              <p className="section-kicker">Workspace Tools</p>
              <h2 className="mt-2 section-heading">Support work stays available, but out of the main sales flow.</h2>
              <div className="mt-6 space-y-4">
                {visibleTools.map(tool => {
                  const Icon = tool.icon
                  return (
                    <Link
                      key={tool.name}
                      to={tool.path}
                      className="group flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <Icon className="h-5 w-5 text-slate-700" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">{tool.name}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {showSettings && (
            <Link to={settingsApp.basePath} className="block rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white transition hover:bg-slate-800">
              <p className="text-sm font-semibold">Company settings</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Control team access, software plan, and workspace preferences.</p>
            </Link>
          )}
        </aside>
      </div>
    </div>
  )
}

export default AppSwitcher
