import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckSquare, LayoutDashboard, Settings, StickyNote } from 'lucide-react'
import AppContext from '../context/app-context.js'
import { getAppsForBusiness, getBusinessMeta } from '../config/businessConfigs'
import { EmptyCard, PageHeader, SectionCard, WorkspacePage } from './ui/ErpPrimitives.jsx'

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
    <WorkspacePage>
      <PageHeader
        eyebrow="Work Areas"
        title={currentOrgName || 'My Business'}
        description={businessMeta.launcherDescription}
        badges={[businessMeta.productName, 'Nepal-ready operations']}
        actions={
          <Link to="/dashboard" className="btn-secondary">
            Back to command center
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr,0.9fr]">
        <SectionCard
          eyebrow="Primary Areas"
          title="Daily work should stay inside a few clear modules."
          description="Open the area that matches how this business runs today. Keep support tools separate from billing and stock work."
        >
          {visibleModules.length === 0 ? (
            <EmptyCard
              icon={LayoutDashboard}
              title="No work areas available"
              message="This user does not have access to any modules yet. Update workspace permissions first."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleModules.map(module => {
                const Icon = module.icon
                const tone = moduleTone[module.accent] || moduleTone.slate
                const visibleMenu = module.menu.filter(item => !item.permission || hasPermission(item.permission))

                return (
                  <div key={module.id} className="group rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                    <div className={`inline-flex rounded-2xl border px-3 py-3 ${tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-slate-900">{module.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {visibleMenu.slice(0, 3).map(item => (
                        <span key={item.path} className="erp-chip">
                          {item.label}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <Link to={module.basePath} className="btn-primary">
                        Open {module.name}
                      </Link>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        <aside className="erp-stack">
          <SectionCard
            eyebrow="Your Software"
            title="The active business package on this workspace."
            description="Keep the product setup aligned with the business you are operating today."
          >
            <div className={`rounded-3xl border p-5 ${softwareTone[businessType] || softwareTone.general}`}>
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
            <div className="mt-4 grid gap-3">
              <Link to="/settings" className="btn-secondary justify-between">
                <span>Change business package</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              {showSettings && (
                <Link to={settingsApp.basePath} className="btn-secondary justify-between">
                  <span>Open settings</span>
                  <Settings className="h-4 w-4" />
                </Link>
              )}
            </div>
            {businessType === 'general' && (
              <div className="erp-subtle mt-4 text-sm leading-6 text-stone-700">
                Legacy Workspace is only kept for older accounts. Restaurant, Cafe, or Shop gives a cleaner Nepal-first workflow.
              </div>
            )}
          </SectionCard>

          {visibleTools.length > 0 && (
            <SectionCard
              eyebrow="Support Tools"
              title="Keep notes and tasks close, but out of the main sales path."
            >
              <div className="space-y-4">
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
            </SectionCard>
          )}
        </aside>
      </div>
    </WorkspacePage>
  )
}

export default AppSwitcher
