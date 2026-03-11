import React, { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChefHat, Clock, Package, ShoppingCart, Table2, TrendingUp } from 'lucide-react'
import { posProductApi, posSaleApi, posShiftApi, posTableApi } from '../../api/posApi'
import { getBusinessPosMeta } from '../../config/businessConfigs.js'
import AppContext from '../../context/app-context.js'
import { EmptyCard, KpiCard, PageHeader, SectionCard, WorkspacePage } from '../../components/ui/ErpPrimitives.jsx'
import { formatShortCurrencyNpr } from '../../utils/nepal.js'
import POSDashboardCharts from './POSDashboardCharts.jsx'

const ORDER_TYPE_LABELS = {
  'dine-in': 'Dine-in',
  takeaway: 'Counter',
  delivery: 'Delivery',
}

const TABLE_STATUS_STYLE = {
  available: 'bg-green-50 border-green-200 text-green-700',
  occupied: 'bg-red-50 border-red-200 text-red-700',
  reserved: 'bg-amber-50 border-amber-200 text-amber-700',
  cleaning: 'bg-gray-50 border-gray-200 text-gray-500',
}

const formatMoney = value => formatShortCurrencyNpr(value || 0)

export default function POSDashboard() {
  const { branchName, orgBusinessType } = useContext(AppContext)
  const posMeta = getBusinessPosMeta(orgBusinessType)

  const { data: statsData } = useQuery({
    queryKey: ['pos-stats'],
    queryFn: () => posSaleApi.stats(),
    refetchInterval: 30000,
  })

  const { data: lowStockData } = useQuery({
    queryKey: ['pos-low-stock'],
    queryFn: () => posProductApi.lowStock(),
  })

  const { data: tablesData } = useQuery({
    queryKey: ['pos-tables'],
    queryFn: () => posTableApi.list(),
    enabled: posMeta.allowTables,
  })

  const { data: shiftData } = useQuery({
    queryKey: ['pos-shift-current'],
    queryFn: () => posShiftApi.current(),
  })

  const stats = statsData?.data || {}
  const lowStock = lowStockData?.data || []
  const tables = tablesData?.data || []
  const shift = shiftData?.data

  const occupiedCount = tables.filter(table => table.status === 'occupied').length
  const availableCount = tables.filter(table => table.status === 'available').length
  const orderMix = (stats.byOrderType || []).map(item => ({
    name: ORDER_TYPE_LABELS[item._id] || item._id,
    value: Math.round(item.total || 0),
  }))

  const chartData = {
    dailyChart: (stats.dailyChart || []).map(day => ({
      date: new Date(day._id).toLocaleDateString('en-NP', { weekday: 'short', day: 'numeric' }),
      revenue: Math.round(day.revenue),
      orders: day.count,
    })),
    pieData: orderMix,
    hourlyData: (stats.hourlyChart || []).map(item => ({
      hour: `${String(item._id).padStart(2, '0')}:00`,
      revenue: Math.round(item.revenue),
    })),
  }

  const quickActions = [
    { to: '/pos/billing', icon: ShoppingCart, label: 'New Sale', bg: 'bg-indigo-600 hover:bg-indigo-700' },
    ...(posMeta.allowTables ? [{ to: '/pos/tables', icon: Table2, label: 'Floor Plan', bg: 'bg-teal-600 hover:bg-teal-700' }] : []),
    ...(posMeta.allowKitchen ? [{ to: '/pos/kds', icon: ChefHat, label: 'Kitchen', bg: 'bg-amber-500 hover:bg-amber-600' }] : []),
    { to: '/pos/shifts', icon: Clock, label: 'Manage Shift', bg: 'bg-slate-600 hover:bg-slate-700' },
  ]

  const modeChips = posMeta.orderTypes.map(type => ORDER_TYPE_LABELS[type])

  return (
    <WorkspacePage className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="POS Control"
        title={posMeta.dashboardTitle}
        description={posMeta.dashboardSummary}
        badges={[
          new Date().toLocaleDateString('en-NP', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          branchName ? `Branch: ${branchName}` : 'Main workspace',
          shift ? 'Shift open' : 'Shift not opened',
        ]}
        actions={
          shift ? (
            <div className="erp-chip border-emerald-200 bg-emerald-50 text-emerald-700">
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Shift is open
            </div>
          ) : (
            <Link to="/pos/shifts" className="btn-primary">
              <Clock className="h-4 w-4" />
              Open shift
            </Link>
          )
        }
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <KpiCard icon={TrendingUp} title="Today revenue" value={formatMoney(stats.todayRevenue)} detail={`${stats.todaySales || 0} transactions today`} tone="blue" to="/pos/sales" ctaLabel="Review sales" />
        <KpiCard icon={ShoppingCart} title="Total revenue" value={formatMoney(stats.totalRevenue)} detail={`${stats.totalSales || 0} all-time sales`} tone="teal" to="/pos/sales" ctaLabel="See history" />
        {posMeta.allowTables ? (
          <KpiCard icon={Table2} title="Tables in use" value={`${occupiedCount}/${tables.length || 0}`} detail={`${availableCount} available now`} tone="amber" to="/pos/tables" ctaLabel="Open floor plan" />
        ) : (
          <KpiCard icon={Clock} title="Shift" value={shift ? 'Open' : 'Closed'} detail={shift ? 'Reconcile before close' : 'Open before billing'} tone="amber" to="/pos/shifts" ctaLabel="Manage shift" />
        )}
        <KpiCard icon={AlertTriangle} title="Low stock" value={lowStock.length} detail="Products that need restock soon" tone="rose" to="/pos/products" ctaLabel="Manage products" />
      </section>

      <SectionCard
        eyebrow="Daily Trend"
        title="Watch revenue, orders, and rush patterns together."
        description="This view should help the owner or floor manager decide what needs attention in seconds."
      >
        <POSDashboardCharts dailyChart={chartData.dailyChart} pieData={chartData.pieData} hourlyData={chartData.hourlyData} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {posMeta.allowTables ? (
            <SectionCard
              title="Floor status"
              description="Keep open tables, reserved covers, and seat availability visible to the front desk."
              action={<Link to="/pos/tables" className="text-sm font-semibold text-slate-900">Floor plan</Link>}
            >
              {tables.length === 0 ? (
                <EmptyCard
                  icon={Table2}
                  title="No tables configured"
                  message="Set up the floor plan first so dine-in service stays clear for hosts and cashiers."
                  action={<Link to="/pos/tables" className="btn-secondary">Set up tables</Link>}
                />
              ) : (
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
                  {tables.slice(0, 14).map(table => (
                    <div key={table._id} className={`cursor-default rounded-xl border p-2 text-center ${TABLE_STATUS_STYLE[table.status]}`}>
                      <div className="text-base font-bold leading-none">{table.number}</div>
                      <div className="mt-0.5 text-[9px] capitalize opacity-80">{table.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          ) : (
            <SectionCard
              title="Selling modes"
              description="Keep the main order paths obvious so new cashiers can work with less training."
              action={<Link to="/pos/billing" className="text-sm font-semibold text-slate-900">Start billing</Link>}
            >
              <div className="flex flex-wrap gap-2">
                {modeChips.map(label => (
                  <span key={label} className="erp-chip">
                    {label}
                  </span>
                ))}
              </div>
              <div className="erp-subtle mt-6">
                <p className="text-sm font-semibold text-slate-900">Focused workflow</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{posMeta.dashboardSummary}</p>
              </div>
            </SectionCard>
          )}

          <SectionCard
            title="Low-stock alerts"
            description="Stock warnings should stay visible before they slow down the next shift."
            action={<Link to="/pos/products" className="text-sm font-semibold text-slate-900">Manage</Link>}
          >
            {lowStock.length === 0 ? (
              <EmptyCard
                icon={Package}
                title="All products are stocked"
                message="No urgent replenishment is needed right now."
              />
            ) : (
              <div className="max-h-52 divide-y divide-gray-50 overflow-y-auto">
                {lowStock.slice(0, 8).map(product => (
                  <div key={product._id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.category || product.menuCategory}</p>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${product.stockQty === 0 ? 'text-red-600' : 'text-amber-500'}`}>
                      {product.stockQty} {product.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
      </div>

      <SectionCard
        eyebrow="Quick Actions"
        title="Keep the next cashier and floor actions one tap away."
      >
        <div className={`grid gap-3 ${quickActions.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {quickActions.map(({ to, icon: Icon, label, bg }) => (
            <Link key={to} to={to} className={`${bg} flex flex-col items-center gap-2.5 rounded-3xl p-4 text-white transition-colors`}>
              <Icon className="h-6 w-6" />
              <span className="text-sm font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </SectionCard>
    </WorkspacePage>
  )
}
