import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  DollarSign,
  FileText,
  Kanban,
  Monitor,
  Package,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { posCustomerApi, posSaleApi } from '../api/posApi'
import StatePanel from '../components/StatePanel.jsx'
import { getBusinessMeta } from '../config/businessConfigs.js'
import AppContext from '../context/app-context.js'
import api from '../lib/api.js'

const formatCurrency = value =>
  new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(value || 0)

const getSettledData = (result, fallback) => {
  if (!result || result.status !== 'fulfilled') return fallback
  const value = result.value

  if (value?.data?.data !== undefined) return value.data.data
  if (value?.data !== undefined) return value.data

  return fallback
}

const businessModes = [
  { name: 'Restaurant', summary: 'Tables, kitchen, billing, stock, and shift close in one Nepal-ready package.', path: '/settings' },
  { name: 'Cafe', summary: 'Counter billing, regulars, stock, and day close without restaurant clutter.', path: '/settings' },
  { name: 'Shop', summary: 'Billing, products, stock, invoices, and due follow-up for retail counters.', path: '/settings' },
]

const getRoleExperience = (role, businessType, businessMeta) => {
  const isLegacyWorkspace = businessType === 'general'
  const isShop = businessType === 'shop'
  const isFoodService = businessType === 'restaurant' || businessType === 'cafe'
  const focusedPrimary =
    isLegacyWorkspace
      ? { label: 'Review finance', path: '/accounting' }
      : isShop
        ? { label: 'Review invoices', path: '/invoices' }
        : { label: 'Review shift close', path: '/pos/shifts' }

  const byRole = {
    owner: {
      kicker: 'Owner View',
      summary: businessMeta.commandCenterSummary,
      primaryAction: focusedPrimary,
      secondaryAction: { label: 'Check settings', path: '/settings' },
    },
    admin: {
      kicker: 'Admin View',
      summary: 'Keep work areas, staff access, and payment flow aligned across the workspace.',
      primaryAction: { label: 'Open settings', path: '/settings' },
      secondaryAction: { label: 'Review work areas', path: '/apps' },
    },
    manager: {
      kicker: 'Manager View',
      summary:
        businessType === 'restaurant'
          ? 'Stay on top of tables, kitchen flow, and stock risk while service is active.'
          : businessType === 'cafe'
            ? 'Keep counter speed, regulars, and stock risk visible during rush hours.'
            : businessType === 'shop'
              ? 'Keep checkout speed, stock risk, and due follow-up visible through the day.'
              : 'Watch revenue, branch health, and the next bottlenecks before they slow the workspace.',
      primaryAction: { label: 'Open POS', path: '/pos/billing' },
      secondaryAction: { label: 'Check stock', path: '/inventory' },
    },
    accountant: {
      kicker: 'Accountant View',
      summary:
        isLegacyWorkspace
          ? 'Keep revenue, receivables, purchases, and cash movement reconciled for Nepal VAT reporting.'
          : isShop
            ? 'Keep invoices, collections, and buying records ready for daily reconciliation.'
            : 'Keep stock buying, wallet totals, and shift close consistent for daily reconciliation.',
      primaryAction: focusedPrimary,
      secondaryAction: isFoodService ? { label: 'Check stock', path: '/inventory' } : { label: 'Review invoices', path: '/invoices' },
    },
    cashier: {
      kicker: 'Cashier View',
      summary: 'Open the shift, bill cleanly, and keep cash and digital wallet totals accurate throughout the day.',
      primaryAction: { label: 'Start billing', path: '/pos/billing' },
      secondaryAction: { label: 'Manage shift', path: '/pos/shifts' },
    },
  }

  return (
    byRole[role] || {
      kicker: 'Command Center',
      summary: businessMeta.commandCenterSummary,
      primaryAction: { label: 'Open billing', path: '/pos/billing' },
      secondaryAction: { label: 'Open work areas', path: '/apps' },
    }
  )
}

const Dashboard = () => {
  const { currentOrgName, orgBusinessType, userData, userRole } = useContext(AppContext)
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState({
    sales: {},
    people: [],
    invoices: {},
    leads: {},
    finance: {},
    lowStock: [],
    transactions: [],
  })

  const businessType = orgBusinessType || 'general'
  const isLegacyWorkspace = businessType === 'general'
  const isShop = businessType === 'shop'
  const isRestaurant = businessType === 'restaurant'
  const businessMeta = getBusinessMeta(businessType)
  const peoplePath = isShop || isLegacyWorkspace ? '/customers' : '/pos/customers'
  const peopleLabel = isRestaurant ? 'Guests' : businessType === 'cafe' ? 'Regulars' : 'Customer base'
  const roleExperience = getRoleExperience(userRole, businessType, businessMeta)
  const showFinance = isLegacyWorkspace
  const showInvoices = isLegacyWorkspace || isShop
  const showCrm = isLegacyWorkspace
  const todayFocusCount = (overview.leads?.byStage?.proposal?.count || 0) + (overview.leads?.byStage?.negotiation?.count || 0)
  const headline =
    businessType === 'restaurant'
      ? 'is ready for the next service cycle.'
      : businessType === 'cafe'
        ? 'is ready for the next rush.'
        : isShop
          ? 'is ready for today\'s sales.'
          : 'is ready for today\'s operations.'

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true)

        const results = await Promise.allSettled([
          posSaleApi.stats(),
          isLegacyWorkspace || isShop ? api.get('/customers') : posCustomerApi.list(),
          showInvoices ? api.get('/invoices/stats') : Promise.resolve({ data: { data: {} } }),
          showCrm ? api.get('/crm/stats') : Promise.resolve({ data: { data: {} } }),
          showFinance ? api.get('/transactions/summary') : Promise.resolve({ data: { data: {} } }),
          showFinance ? api.get('/transactions') : Promise.resolve({ data: { data: [] } }),
          api.get('/inventory/low-stock'),
        ])

        const sales = getSettledData(results[0], {})
        const people = getSettledData(results[1], [])
        const invoices = getSettledData(results[2], {})
        const leads = getSettledData(results[3], {})
        const finance = getSettledData(results[4], {})
        const transactions = getSettledData(results[5], [])
        const lowStock = getSettledData(results[6], [])

        setOverview({
          sales,
          people: Array.isArray(people) ? people : [],
          invoices,
          leads,
          finance,
          lowStock: Array.isArray(lowStock) ? lowStock : [],
          transactions: Array.isArray(transactions) ? transactions : [],
        })

        if (results.every(result => result.status === 'rejected')) toast.error('Unable to load command center data')
      } catch {
        toast.error('Unable to load command center data')
      } finally {
        setLoading(false)
      }
    }

    loadOverview()
  }, [isLegacyWorkspace, isShop, showCrm, showFinance, showInvoices])

  const topCards = [
    {
      title: 'Today revenue',
      value: formatCurrency(overview.sales?.todayRevenue),
      detail: `${overview.sales?.todaySales || 0} sales closed today`,
      icon: DollarSign,
      tone: 'bg-emerald-50 text-emerald-700',
      link: '/pos/sales',
    },
    {
      title: peopleLabel,
      value: overview.people.length,
      detail: isShop ? 'Customer accounts ready for due follow-up' : 'Profiles ready for fast repeat billing',
      icon: Users,
      tone: 'bg-blue-50 text-blue-700',
      link: peoplePath,
    },
    {
      title: 'Low stock',
      value: overview.lowStock.length,
      detail: overview.lowStock.length > 0 ? 'Critical products need replenishment' : 'Stock levels look healthy',
      icon: Package,
      tone: 'bg-amber-50 text-amber-700',
      link: '/inventory',
    },
    isLegacyWorkspace
      ? {
          title: 'Net cash position',
          value: formatCurrency(overview.finance?.balance),
          detail: `${formatCurrency(overview.finance?.totalIncome)} income vs ${formatCurrency(overview.finance?.totalExpense)} expense`,
          icon: Receipt,
          tone: 'bg-slate-100 text-slate-700',
          link: '/accounting',
        }
      : isShop
        ? {
            title: 'Outstanding invoices',
            value: formatCurrency(overview.invoices?.unpaidAmount),
            detail: `${overview.invoices?.overdueCount || 0} overdue invoices`,
            icon: FileText,
            tone: 'bg-slate-100 text-slate-700',
            link: '/invoices',
          }
        : {
            title: 'Shift close',
            value: `${overview.sales?.todaySales || 0} sales`,
            detail: 'Reconcile cash, wallets, and service totals before sign-off.',
            icon: Receipt,
            tone: 'bg-slate-100 text-slate-700',
            link: '/pos/shifts',
          },
  ]

  const operationalCards =
    isLegacyWorkspace
      ? [
          { title: 'POS', metric: formatCurrency(overview.sales?.todayRevenue), summary: `${overview.sales?.todaySales || 0} sales today`, icon: Monitor, tone: 'bg-teal-50 text-teal-700 border-teal-200', path: '/pos/billing' },
          { title: 'Sales', metric: `${overview.invoices?.totalInvoices || 0} invoices`, summary: `${formatCurrency(overview.invoices?.unpaidAmount)} waiting to collect`, icon: FileText, tone: 'bg-blue-50 text-blue-700 border-blue-200', path: '/invoices' },
          { title: 'CRM', metric: `${overview.leads?.total || 0} leads`, summary: `${formatCurrency(overview.leads?.weightedRevenue)} weighted pipeline`, icon: Kanban, tone: 'bg-rose-50 text-rose-700 border-rose-200', path: '/crm' },
          { title: 'Inventory', metric: `${overview.lowStock.length} low stock`, summary: 'Watch critical products before service slows down', icon: Package, tone: 'bg-orange-50 text-orange-700 border-orange-200', path: '/inventory' },
        ]
      : isShop
        ? [
            { title: 'Sales', metric: formatCurrency(overview.sales?.todayRevenue), summary: `${overview.sales?.todaySales || 0} sales today`, icon: Monitor, tone: 'bg-teal-50 text-teal-700 border-teal-200', path: '/pos/billing' },
            { title: 'Customers', metric: `${overview.people.length} accounts`, summary: 'Balances and follow-up stay close to billing', icon: Users, tone: 'bg-blue-50 text-blue-700 border-blue-200', path: '/customers' },
            { title: 'Stock', metric: `${overview.lowStock.length} low stock`, summary: 'Replenish products before the shelf runs dry', icon: Package, tone: 'bg-orange-50 text-orange-700 border-orange-200', path: '/inventory' },
            { title: 'Finance', metric: `${overview.invoices?.overdueCount || 0} overdue`, summary: `${formatCurrency(overview.invoices?.unpaidAmount)} waiting to collect`, icon: FileText, tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', path: '/invoices' },
          ]
        : [
            { title: isRestaurant ? 'Service' : 'Counter', metric: formatCurrency(overview.sales?.todayRevenue), summary: `${overview.sales?.todaySales || 0} sales today`, icon: Monitor, tone: 'bg-teal-50 text-teal-700 border-teal-200', path: '/pos/billing' },
            { title: isRestaurant ? 'Guests' : 'Regulars', metric: `${overview.people.length} profiles`, summary: 'Repeat visitors stay close to billing', icon: Users, tone: 'bg-blue-50 text-blue-700 border-blue-200', path: '/pos/customers' },
            { title: 'Stock', metric: `${overview.lowStock.length} low stock`, summary: 'Replenish before the next rush', icon: Package, tone: 'bg-orange-50 text-orange-700 border-orange-200', path: '/inventory' },
            { title: 'Day close', metric: `${overview.sales?.todaySales || 0} sales`, summary: 'Shifts, wallet totals, and service summaries stay ready for sign-off.', icon: Receipt, tone: 'bg-amber-50 text-amber-700 border-amber-200', path: '/pos/shifts' },
          ]

  const focusItems =
    isLegacyWorkspace
      ? [
          {
            title: 'Low stock',
            value: `${overview.lowStock.length} items below threshold`,
            detail: overview.lowStock.length > 0 ? 'Review replenishment before the next rush.' : 'Stock levels are healthy.',
            tone: overview.lowStock.length > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
            path: '/inventory',
          },
          {
            title: 'Hot pipeline',
            value: `${todayFocusCount} deals in proposal or negotiation`,
            detail: 'Keep follow-ups tight so leads convert into active customers.',
            tone: 'text-rose-700 bg-rose-50 border-rose-200',
            path: '/crm',
          },
          {
            title: 'Cash watch',
            value: `${formatCurrency(overview.finance?.balance)} current balance`,
            detail: 'Track daily inflow and expense before closing the shift.',
            tone: 'text-slate-700 bg-slate-100 border-slate-200',
            path: '/accounting',
          },
        ]
      : isShop
        ? [
            {
              title: 'Low stock',
              value: `${overview.lowStock.length} items below threshold`,
              detail: overview.lowStock.length > 0 ? 'Replenish products before the next sales cycle.' : 'Stock levels are healthy.',
              tone: overview.lowStock.length > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
              path: '/inventory',
            },
            {
              title: 'Collections',
              value: `${formatCurrency(overview.invoices?.unpaidAmount)} due`,
              detail: `${overview.invoices?.overdueCount || 0} overdue invoices still need follow-up.`,
              tone: 'text-blue-700 bg-blue-50 border-blue-200',
              path: '/invoices',
            },
            {
              title: 'Customer watch',
              value: `${overview.people.length} accounts active`,
              detail: 'Keep balances and repeat buyers close to the next sale.',
              tone: 'text-slate-700 bg-slate-100 border-slate-200',
              path: '/customers',
            },
          ]
        : [
            {
              title: 'Low stock',
              value: `${overview.lowStock.length} items below threshold`,
              detail: overview.lowStock.length > 0 ? 'Review replenishment before the next rush.' : 'Stock levels are healthy.',
              tone: overview.lowStock.length > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
              path: '/inventory',
            },
            {
              title: isRestaurant ? 'Guest book' : 'Regulars',
              value: `${overview.people.length} profiles ready`,
              detail: 'Keep repeat visitors, loyalty, and quick lookup close to billing.',
              tone: 'text-blue-700 bg-blue-50 border-blue-200',
              path: '/pos/customers',
            },
            {
              title: 'Day close',
              value: `${overview.sales?.todaySales || 0} sales to reconcile`,
              detail: 'Match cash, wallets, and shift totals before the last handover.',
              tone: 'text-slate-700 bg-slate-100 border-slate-200',
              path: '/pos/shifts',
            },
          ]

  const supportAction =
    isLegacyWorkspace
      ? { label: 'Close the books', path: '/accounting', description: 'Track cash, expenses, and reporting status.' }
      : isShop
        ? { label: 'Review collections', path: '/invoices', description: 'Follow overdue invoices and customer dues.' }
        : { label: 'Close the day', path: '/pos/shifts', description: 'Review shift totals, wallets, and handover before sign-off.' }

  const snapshotRows =
    isShop
      ? [
          { label: 'Sales closed today', value: overview.sales?.todaySales || 0, detail: 'Keep billing pace visible across the day.', path: '/pos/sales' },
          { label: 'Customer accounts', value: overview.people.length, detail: 'Follow dues and repeat sales without extra CRM flow.', path: '/customers' },
          { label: 'Outstanding invoices', value: formatCurrency(overview.invoices?.unpaidAmount), detail: 'Collections stay in focus for the next follow-up.', path: '/invoices' },
        ]
      : [
          { label: 'Sales closed today', value: overview.sales?.todaySales || 0, detail: 'Keep the counter and floor moving through one focused flow.', path: '/pos/sales' },
          { label: isRestaurant ? 'Guest profiles' : 'Regular profiles', value: overview.people.length, detail: 'Repeat guests and loyalty stay easy to reach.', path: '/pos/customers' },
          { label: 'Low-stock alerts', value: overview.lowStock.length, detail: 'Replenishment stays visible before the next rush.', path: '/inventory' },
        ]

  if (loading) {
    return (
      <div className="page-shell">
        <StatePanel tone="teal" title="Loading command center" message="Collecting sales, stock, customer, and finance data for the current workspace." />
      </div>
    )
  }

  return (
    <div className="page-shell">
      <section className="panel subtle-grid relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-amber-50 to-transparent lg:block" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">{roleExperience.kicker}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {currentOrgName || 'My Business'} {headline}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{roleExperience.summary}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="status-pill">{new Date().toLocaleDateString('en-NP', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <span className="status-pill">{userData?.username || 'Operator'}</span>
              <span className="status-pill">{businessMeta.statusPill}</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[28rem]">
            <Link to={roleExperience.primaryAction.path} className="action-tile">
              <div>
                <p className="text-sm font-semibold text-slate-900">{roleExperience.primaryAction.label}</p>
                <p className="mt-1 text-sm text-slate-500">Jump into the highest-priority workspace for your role.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>

            <Link to={roleExperience.secondaryAction.path} className="action-tile">
              <div>
                <p className="text-sm font-semibold text-slate-900">{roleExperience.secondaryAction.label}</p>
                <p className="mt-1 text-sm text-slate-500">Keep the next operational decision obvious.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>

            <Link to="/inventory" className="action-tile">
              <div>
                <p className="text-sm font-semibold text-slate-900">Check stock</p>
                <p className="mt-1 text-sm text-slate-500">Watch critical items before the next rush.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>

            <Link to={supportAction.path} className="action-tile">
              <div>
                <p className="text-sm font-semibold text-slate-900">{supportAction.label}</p>
                <p className="mt-1 text-sm text-slate-500">{supportAction.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {topCards.map(card => {
          const Icon = card.icon

          return (
            <Link key={card.title} to={card.link} className="group panel p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{card.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</p>
                </div>
                <div className={`rounded-2xl p-3 ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                View details
                <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </Link>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="panel p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker">Operational Health</p>
              <h2 className="mt-2 section-heading">The business should move through a few strong work areas.</h2>
            </div>
            <Link to="/apps" className="text-sm font-semibold text-slate-900">
              Open work areas
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {operationalCards.map(card => {
              const Icon = card.icon

              return (
                <Link key={card.title} to={card.path} className="group rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500">{card.title}</p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{card.metric}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{card.summary}</p>
                    </div>
                    <div className={`rounded-2xl border px-3 py-3 ${card.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Work here
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="panel p-6">
          <p className="section-kicker">Today Focus</p>
          <h2 className="mt-2 section-heading">Keep the next actions obvious.</h2>

          <div className="mt-6 space-y-4">
            {focusItems.map(item => (
              <Link key={item.title} to={item.path} className={`block rounded-3xl border p-5 ${item.tone}`}>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight">{item.value}</p>
                <p className="mt-2 text-sm leading-6">{item.detail}</p>
              </Link>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Simple rule</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  If the cashier, store manager, and owner need different tools just to understand the day, the package is still too fragmented.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        {showFinance ? (
          <div className="panel p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Recent Finance</p>
                <h2 className="mt-2 section-heading">Cash movement should stay visible while you operate.</h2>
              </div>
              <Link to="/accounting" className="text-sm font-semibold text-slate-900">
                Open accounting
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {overview.transactions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-base font-semibold text-slate-900">No finance activity yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Start recording income and expenses so the command center can show live business health.</p>
                  <Link to="/accounting" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Add transaction
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                overview.transactions.slice(0, 5).map(transaction => {
                  const isIncome = transaction.type === 'income'

                  return (
                    <div key={transaction._id} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-4">
                        <div className={`rounded-2xl p-3 ${isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {isIncome ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{transaction.description}</p>
                          <p className="mt-1 text-sm text-slate-500">{transaction.category || 'Uncategorized'}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-base font-semibold ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          <div className="panel p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Daily Snapshot</p>
                <h2 className="mt-2 section-heading">The focused package should stay easy to scan.</h2>
              </div>
              <Link to="/apps" className="text-sm font-semibold text-slate-900">
                Open work areas
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {snapshotRows.map(row => (
                <Link key={row.label} to={row.path} className="block rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
                  <p className="text-sm text-slate-500">{row.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{row.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{row.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="panel p-6">
          {isLegacyWorkspace ? (
            <>
              <p className="section-kicker">Legacy Workspace</p>
              <h2 className="mt-2 section-heading">Choose the focused Nepal package that fits this business.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Restaurant, Cafe, and Shop keep daily work tighter than the legacy fallback workspace.
              </p>

              <div className="mt-6 space-y-4">
                {businessModes.map(mode => (
                  <Link key={mode.name} to={mode.path} className="group flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{mode.name}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{mode.summary}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
              <Link to="/settings" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                Choose package
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <p className="section-kicker">Focused Package</p>
              <h2 className="mt-2 section-heading">{businessMeta.spotlightTitle}</h2>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm leading-6 text-slate-600">{businessMeta.spotlightSummary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="status-pill">{businessMeta.productName}</span>
                  <span className="status-pill">{businessMeta.statusPill}</span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/apps" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Open work areas
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/settings" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    Change package
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
