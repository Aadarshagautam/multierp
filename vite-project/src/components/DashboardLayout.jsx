import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Building2, ChevronRight, LayoutGrid, LogOut, Mail, Menu, Receipt, ShoppingCart, Sparkles, User, X } from 'lucide-react'
import toast from 'react-hot-toast'
import AppContext from '../context/app-context.js'
import { getActiveAppForBusiness, getAppsForBusiness, getBusinessMeta, isMenuItemActive } from '../config/businessConfigs'
import api from '../lib/api.js'

const accentClasses = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-700' },
  teal: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-700' },
  blue: { bg: 'bg-sky-50', text: 'text-sky-900', border: 'border-sky-200', icon: 'bg-sky-100 text-sky-700' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-900', border: 'border-rose-200', icon: 'bg-rose-100 text-rose-700' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200', icon: 'bg-orange-100 text-orange-700' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-700' },
  slate: { bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-200', icon: 'bg-stone-200 text-stone-700' },
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
      <TopBar activeApp={activeApp} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(previous => !previous)} />
      <Sidebar
        activeApp={activeApp}
        pathname={location.pathname}
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
        businessType={orgBusinessType}
      />
      <Outlet />
    </>
  )
}

const TopBar = ({ activeApp, sidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate()
  const profileRef = useRef(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const { userData, setUserData, setIsLoggedin, isLoggedin, currentOrgName, orgBusinessType } = useContext(AppContext)
  const primaryAction = getPrimaryActionForBusiness(orgBusinessType)

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
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[rgba(255,250,242,0.88)] backdrop-blur-xl">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-2 lg:pl-[17rem] lg:pr-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/home" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-900 via-emerald-700 to-amber-500 text-sm font-bold text-white shadow-sm">
              CO
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-slate-900">CommerceOS</p>
              <p className="truncate text-xs text-slate-500">Nepal Business Software</p>
            </div>
          </Link>

          {activeApp && (
            <div className="hidden min-w-0 items-center gap-3 rounded-full border border-stone-200 bg-white/80 px-3 py-1.5 xl:flex">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{activeApp.name}</p>
                <p className="truncate text-xs text-slate-500">{activeApp.description}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentOrgName && (
            <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-sm text-slate-600 xl:flex">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="max-w-[11rem] truncate">{currentOrgName}</span>
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">NPR</span>
            </div>
          )}

          {isLoggedin ? (
            <>
              <button
                onClick={() => navigate(primaryAction.path)}
                className="hidden rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 lg:inline-flex"
              >
                {primaryAction.label}
              </button>

              <Link
                to="/apps"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                title="Open work areas"
              >
                <LayoutGrid className="h-5 w-5" />
                <span className="hidden md:inline">Work areas</span>
              </Link>

              <button className="relative rounded-2xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50">
                <Bell className="h-5 w-5" />
                {userData && !userData.isAccountVerified && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />}
              </button>

              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-900 via-emerald-700 to-amber-500 text-sm font-semibold text-white">
                    {userData?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden min-w-0 text-left md:block">
                    <p className="max-w-[8rem] truncate text-sm font-medium text-slate-900">{userData?.username || 'User'}</p>
                    <p className="max-w-[8rem] truncate text-xs text-slate-500">{currentOrgName || 'Workspace'}</p>
                  </div>
                </button>

                <div className={`absolute right-0 mt-2 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-150 ${profileOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
                  <div className="border-b border-slate-100 px-4 py-4">
                    <p className="truncate text-sm font-semibold text-slate-900">{userData?.username || 'User'}</p>
                    <p className="truncate text-xs text-slate-500">{userData?.email}</p>
                    {currentOrgName && <p className="truncate text-xs text-slate-400">{currentOrgName}</p>}
                  </div>

                  <div className="p-2">
                    {userData && !userData.isAccountVerified && (
                      <button
                        onClick={sendVerificationOtp}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-amber-50"
                      >
                        <Mail className="h-4 w-4 text-amber-500" />
                        Verify email
                      </button>
                    )}

                    <Link
                      to="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-slate-500" />
                      My profile
                    </Link>

                  <div className="my-2 h-px bg-stone-100" />

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
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
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
  const { hasPermission } = useContext(AppContext)
  const apps = getAppsForBusiness(businessType)
  const businessMeta = getBusinessMeta(businessType)
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
      {isOpen && <div className="fixed inset-0 z-30 bg-slate-950/25 lg:hidden" onClick={closeSidebar} />}

      <aside
        className={`fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-stone-200 bg-[rgba(255,250,242,0.94)] backdrop-blur transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-4 pt-4">
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">{businessMeta.shortLabel}</p>
            <h2 className="mt-1.5 text-sm font-semibold text-slate-900">{businessMeta.productName}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">{businessMeta.workspaceSummary}</p>
            <button
              onClick={() => handleMenuClick(primaryAction.path)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <PrimaryActionIcon className="h-4 w-4" />
              {primaryAction.label}
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Primary Areas</div>

          <div className="space-y-1.5">
            {visibleApps.map(app => {
              const Icon = app.icon
              const accent = accentClasses[app.accent] || accentClasses.slate
              const visibleMenu = app.menu.filter(item => !item.permission || hasPermission(item.permission))
              const isActive = activeApp?.id === app.id

              return (
                <div key={app.id}>
                  <button
                    onClick={() => handleAppClick(app)}
                    className={`w-full rounded-3xl border px-3 py-3 text-left transition ${
                      isActive ? `${accent.bg} ${accent.border} shadow-sm` : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isActive ? accent.icon : 'bg-slate-100 text-slate-500'}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${isActive ? accent.text : 'text-slate-800'}`}>{app.name}</p>
                          {visibleMenu.length > 1 && (
                            <ChevronRight className={`ml-auto h-4 w-4 transition ${isActive ? 'rotate-90 text-slate-400' : 'text-slate-300'}`} />
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{app.description}</p>
                      </div>
                    </div>
                  </button>

                  {isActive && visibleMenu.length > 0 && (
                    <div className="mt-1 space-y-1 pl-14 pr-1">
                      {visibleMenu.map(item => {
                        const ItemIcon = item.icon
                        const menuActive = isMenuItemActive(item, pathname)

                        return (
                          <button
                            key={item.path}
                            onClick={() => handleMenuClick(item.path)}
                            className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm transition ${
                              menuActive ? `${accent.border} bg-white ${accent.text} shadow-sm` : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }`}
                          >
                            <ItemIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {showSettings && (
          <div className="border-t border-slate-200 px-3 py-3">
            <button
              onClick={() => handleAppClick(settingsApp)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                activeApp?.id === 'settings'
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-800 shadow-sm'
                  : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-200 text-slate-700">
                  {SettingsIcon && <SettingsIcon className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-semibold">Settings</p>
                  <p className="text-xs text-slate-500">Company setup and access control</p>
                </div>
              </div>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

export default DashboardLayout
