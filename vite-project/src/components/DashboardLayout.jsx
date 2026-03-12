import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Building2,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  Receipt,
  ShoppingCart,
  User,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AppContext from '../context/app-context.js'
import { getActiveAppForBusiness, getAppsForBusiness, getBusinessMeta, isMenuItemActive } from '../config/businessConfigs'
import { getRoleMeta } from '../config/roleMeta.js'
import api from '../lib/api.js'

const accentClasses = {
  amber: {
    icon: 'bg-amber-300/15 text-amber-100',
    active: 'border-amber-300/10 bg-amber-300/10',
    accent: 'text-amber-100',
  },
  teal: {
    icon: 'bg-emerald-300/15 text-emerald-100',
    active: 'border-emerald-300/10 bg-emerald-300/10',
    accent: 'text-emerald-100',
  },
  blue: {
    icon: 'bg-sky-300/15 text-sky-100',
    active: 'border-sky-300/10 bg-sky-300/10',
    accent: 'text-sky-100',
  },
  rose: {
    icon: 'bg-rose-300/15 text-rose-100',
    active: 'border-rose-300/10 bg-rose-300/10',
    accent: 'text-rose-100',
  },
  orange: {
    icon: 'bg-orange-300/15 text-orange-100',
    active: 'border-orange-300/10 bg-orange-300/10',
    accent: 'text-orange-100',
  },
  emerald: {
    icon: 'bg-emerald-300/15 text-emerald-100',
    active: 'border-emerald-300/10 bg-emerald-300/10',
    accent: 'text-emerald-100',
  },
  slate: {
    icon: 'bg-white/10 text-white',
    active: 'border-white/10 bg-white/8',
    accent: 'text-white',
  },
}

const getPrimaryActionForBusiness = (businessType) => {
  if (businessType === 'shop') {
    return { label: 'Start billing', path: '/pos/billing', icon: ShoppingCart }
  }

  if (businessType === 'restaurant') {
    return { label: 'Open service', path: '/pos/billing', icon: ShoppingCart }
  }

  if (businessType === 'cafe') {
    return { label: 'Open counter', path: '/pos/billing', icon: ShoppingCart }
  }

  return { label: 'Open command center', path: '/dashboard', icon: Receipt }
}

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { orgBusinessType } = useContext(AppContext)
  const activeApp = getActiveAppForBusiness(location.pathname, orgBusinessType)

  return (
    <>
      <Sidebar
        activeApp={activeApp}
        pathname={location.pathname}
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
        businessType={orgBusinessType}
      />
      <TopBar activeApp={activeApp} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(previous => !previous)} />
      <Outlet />
    </>
  )
}

const TopBar = ({ activeApp, sidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate()
  const profileRef = useRef(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const { userData, userRole, setUserData, setIsLoggedin, isLoggedin, currentOrgName, orgBusinessType } = useContext(AppContext)
  const primaryAction = getPrimaryActionForBusiness(orgBusinessType)
  const roleMeta = getRoleMeta(userRole)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sendVerificationOtp = async () => {
    try {
      const { data } = await api.post('/auth/send-verify-opt')
      if (data.success) {
        toast.success(data.message)
        navigate('/email-verifty')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const logout = async () => {
    try {
      const { data } = await api.post('/auth/logout')
      if (data.success) {
        setIsLoggedin(false)
        setUserData(null)
        toast.success('Logged out successfully')
        navigate('/login')
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <header className="erp-shell-topbar">
      <div className="flex min-h-[4.5rem] items-center justify-between gap-4 px-4 lg:pl-[19rem] lg:pr-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/home" className="flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-white gradient-bg">
              CO
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">CommerceOS</p>
              <p className="text-xs text-slate-500">Nepal business suite</p>
            </div>
          </Link>

          {activeApp ? (
            <div className="hidden min-w-0 items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 lg:flex">
              <div className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Active
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{activeApp.name}</p>
                <p className="truncate text-xs text-slate-500">{activeApp.description}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {currentOrgName ? (
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 xl:flex">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="max-w-[11rem] truncate">{currentOrgName}</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">NPR</span>
            </div>
          ) : null}

          {isLoggedin ? (
            <>
              <button
                onClick={() => navigate(primaryAction.path)}
                className="hidden btn-primary lg:inline-flex"
              >
                {primaryAction.label}
              </button>

              <Link
                to="/apps"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                title="Open work areas"
              >
                <LayoutGrid className="h-5 w-5" />
                <span className="hidden md:inline">Modules</span>
              </Link>

              <button className="relative rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50">
                <Bell className="h-5 w-5" />
                {userData && !userData.isAccountVerified ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" /> : null}
              </button>

              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-semibold text-white gradient-bg">
                    {userData?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden min-w-0 text-left md:block">
                    <p className="max-w-[8rem] truncate text-sm font-medium text-slate-900">{userData?.username || 'User'}</p>
                    <p className="max-w-[8rem] truncate text-xs text-slate-500">
                      {roleMeta.label} · {currentOrgName || 'Workspace'}
                    </p>
                  </div>
                </button>

                <div className={`absolute right-0 mt-2 w-72 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl transition-all duration-150 ${profileOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
                  <div className="border-b border-slate-100 px-4 py-4">
                    <p className="truncate text-sm font-semibold text-slate-900">{userData?.username || 'User'}</p>
                    <p className="truncate text-xs text-slate-500">{userData?.email}</p>
                    <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      {roleMeta.label}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{roleMeta.summary}</p>
                    {currentOrgName ? <p className="truncate text-xs text-slate-400">{currentOrgName}</p> : null}
                  </div>

                  <div className="p-2">
                    {userData && !userData.isAccountVerified ? (
                      <button
                        onClick={sendVerificationOtp}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-amber-50"
                      >
                        <Mail className="h-4 w-4 text-amber-500" />
                        Verify email
                      </button>
                    ) : null}

                    <Link
                      to="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-slate-500" />
                      My profile
                    </Link>

                    <div className="my-2 h-px bg-slate-100" />

                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

const Sidebar = ({ activeApp, pathname, isOpen, closeSidebar, businessType }) => {
  const navigate = useNavigate()
  const { hasPermission, userRole } = useContext(AppContext)
  const apps = getAppsForBusiness(businessType)
  const businessMeta = getBusinessMeta(businessType)
  const roleMeta = getRoleMeta(userRole)
  const primaryAction = getPrimaryActionForBusiness(businessType)
  const PrimaryActionIcon = primaryAction.icon

  const visibleApps = apps.filter(app => app.id !== 'settings').filter(app => !app.permission || hasPermission(app.permission))
  const settingsApp = apps.find(app => app.id === 'settings')
  const SettingsIcon = settingsApp?.icon
  const showSettings = settingsApp && (!settingsApp.permission || hasPermission(settingsApp.permission))

  const handleAppClick = app => {
    navigate(app.basePath)
    closeSidebar()
  }

  const handleMenuClick = path => {
    navigate(path)
    closeSidebar()
  }

  return (
    <>
      {isOpen ? <div className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={closeSidebar} /> : null}

      <aside
        className={`erp-shell-sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="border-b border-white/10 px-4 py-4">
          <Link to="/home" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white gradient-bg">
              CO
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">CommerceOS</p>
              <p className="truncate text-xs text-white/55">Simple ERP for Nepal businesses</p>
            </div>
          </Link>
        </div>

        <div className="px-4 pt-4">
          <div className="erp-sidebar-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">{businessMeta.shortLabel}</p>
            <h2 className="mt-2 text-sm font-semibold text-white">{businessMeta.productName}</h2>
            <p className="mt-2 text-xs leading-5 text-white/62">{businessMeta.workspaceSummary}</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Signed in as</p>
              <p className="mt-1 text-sm font-semibold text-white">{roleMeta.label}</p>
              <p className="mt-1 text-xs leading-5 text-white/60">{roleMeta.summary}</p>
            </div>
            <button
              onClick={() => handleMenuClick(primaryAction.path)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              <PrimaryActionIcon className="h-4 w-4" />
              {primaryAction.label}
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="erp-sidebar-section">Modules</div>
          <div className="mt-3 space-y-1.5">
            {visibleApps.map(app => {
              const Icon = app.icon
              const accent = accentClasses[app.accent] || accentClasses.slate
              const visibleMenu = app.menu.filter(item => !item.permission || hasPermission(item.permission))
              const isActive = activeApp?.id === app.id

              return (
                <div key={app.id}>
                  <button
                    onClick={() => handleAppClick(app)}
                    className={`erp-sidebar-item ${isActive ? `erp-sidebar-item-active ${accent.active}` : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isActive ? accent.icon : 'bg-white/8 text-white/72'}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${isActive ? accent.accent : 'text-white'}`}>{app.name}</p>
                          {visibleMenu.length > 1 ? (
                            <ChevronRight className={`ml-auto h-4 w-4 transition ${isActive ? 'rotate-90 text-white/55' : 'text-white/35'}`} />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-white/58">{app.description}</p>
                      </div>
                    </div>
                  </button>

                  {isActive && visibleMenu.length > 0 ? (
                    <div className="mt-1 space-y-1 pl-14 pr-1">
                      {visibleMenu.map(item => {
                        const ItemIcon = item.icon
                        const menuActive = isMenuItemActive(item, pathname)

                        return (
                          <button
                            key={item.path}
                            onClick={() => handleMenuClick(item.path)}
                            className={`erp-sidebar-subitem ${menuActive ? 'erp-sidebar-subitem-active' : ''}`}
                          >
                            <ItemIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </nav>

        {showSettings ? (
          <div className="border-t border-white/10 px-3 py-3">
            <button
              onClick={() => handleAppClick(settingsApp)}
              className={`erp-sidebar-item ${activeApp?.id === 'settings' ? 'erp-sidebar-item-active border-white/10 bg-white/10' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-white/80">
                  {SettingsIcon ? <SettingsIcon className="h-5 w-5" /> : null}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Settings</p>
                  <p className="text-xs text-white/55">Company, branches, and staff access</p>
                </div>
              </div>
            </button>
          </div>
        ) : null}
      </aside>
    </>
  )
}

export default DashboardLayout
