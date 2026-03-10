import React, { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, ChefHat, Clock, Package, ShoppingCart, Table2, TrendingUp } from 'lucide-react'
import { posProductApi, posSaleApi, posShiftApi, posTableApi } from '../../api/posApi'
import { getBusinessPosMeta } from '../../config/businessConfigs.js'
import AppContext from '../../context/app-context.js'
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

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600',
  teal: 'bg-teal-50 text-teal-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
}

const formatMoney = value => formatShortCurrencyNpr(value || 0)

const StatCard = ({ icon: Icon, label, value, sub, color = 'indigo', to }) => {
  const content = (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {to && <ArrowRight className="h-4 w-4 text-gray-300" />}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm text-gray-500">{label}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )

  return to ? <Link to={to}>{content}</Link> : content
}

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
    <div className="min-h-screen bg-gray-50/50 p-4 pt-20 lg:pl-[17.5rem]">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{posMeta.dashboardTitle}</h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-NP', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="mt-1 text-sm text-gray-500">{posMeta.dashboardSummary}</p>
            {branchName && <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-indigo-600">Branch: {branchName}</p>}
          </div>

          {shift ? (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700">Shift Open</span>
            </div>
          ) : (
            <Link to="/pos/shifts" className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 transition-colors hover:bg-amber-100">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Open Shift</span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={TrendingUp} label="Today's Revenue" value={formatMoney(stats.todayRevenue)} sub={`${stats.todaySales || 0} transactions`} color="indigo" />
          <StatCard icon={ShoppingCart} label="Total Revenue" value={formatMoney(stats.totalRevenue)} sub={`${stats.totalSales || 0} all-time sales`} color="teal" />
          {posMeta.allowTables ? (
            <StatCard icon={Table2} label="Tables" value={`${occupiedCount}/${tables.length}`} sub={`${availableCount} available now`} color="amber" to="/pos/tables" />
          ) : (
            <StatCard icon={Clock} label="Shift" value={shift ? 'Open' : 'Closed'} sub={shift ? 'Reconcile before close' : 'Open before billing'} color="amber" to="/pos/shifts" />
          )}
          <StatCard icon={AlertTriangle} label="Low Stock" value={lowStock.length} sub="products need restock" color="rose" to="/pos/products" />
        </div>

        <POSDashboardCharts dailyChart={chartData.dailyChart} pieData={chartData.pieData} hourlyData={chartData.hourlyData} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {posMeta.allowTables ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Floor Status</h3>
                <Link to="/pos/tables" className="text-xs font-medium text-indigo-600 hover:underline">
                  Floor Plan
                </Link>
              </div>
              {tables.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <Table2 className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">No tables configured</p>
                  <Link to="/pos/tables" className="mt-1 inline-block text-xs text-indigo-600 hover:underline">
                    Set up tables
                  </Link>
                </div>
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
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Selling Modes</h3>
                <Link to="/pos/billing" className="text-xs font-medium text-indigo-600 hover:underline">
                  Start billing
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {modeChips.map(label => (
                  <span key={label} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Focused workflow</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{posMeta.dashboardSummary}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Low Stock Alerts</h3>
              <Link to="/pos/products" className="text-xs font-medium text-indigo-600 hover:underline">
                Manage
              </Link>
            </div>
            {lowStock.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <Package className="mx-auto mb-2 h-8 w-8" />
                <p className="text-sm">All products well-stocked</p>
              </div>
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
          </div>
        </div>

        <div className={`grid gap-3 ${quickActions.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {quickActions.map(({ to, icon: Icon, label, bg }) => (
            <Link key={to} to={to} className={`${bg} flex flex-col items-center gap-2.5 rounded-2xl p-4 text-white transition-colors`}>
              <Icon className="h-6 w-6" />
              <span className="text-sm font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
