import React, { useEffect, useState } from 'react'
import {
  BarChart3,
  Calendar,
  Download,
  DollarSign,
  Package,
  PieChart,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import StatePanel from '../components/StatePanel.jsx'
import {
  DataTableShell,
  EmptyCard,
  FieldLabel,
  KpiCard,
  ListRow,
  PageHeader,
  SectionCard,
  StatusBadge,
  WorkspacePage,
} from '../components/ui/ErpPrimitives.jsx'
import api from './lib/axios'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(value || 0)

const formatInputDate = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildPresetRange = (preset) => {
  const today = new Date()
  const start = new Date(today)

  if (preset === 'today') {
    return { startDate: formatInputDate(today), endDate: formatInputDate(today) }
  }

  if (preset === 'last7') {
    start.setDate(today.getDate() - 6)
    return { startDate: formatInputDate(start), endDate: formatInputDate(today) }
  }

  start.setDate(1)
  return { startDate: formatInputDate(start), endDate: formatInputDate(today) }
}

const emptySummary = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  incomeByCategory: {},
  expenseByCategory: {},
  salesSummary: { totalSales: 0, totalPaid: 0, totalDue: 0, totalRefunds: 0, count: 0 },
  purchaseSummary: { totalPurchases: 0, totalPaid: 0, totalDue: 0, totalCredit: 0, count: 0 },
  dueSummary: { receivable: 0, payable: 0 },
  cashSummary: { totalIn: 0, totalOut: 0, net: 0, byMethod: {} },
}

const CategoryBreakdown = ({ emptyTitle, emptyMessage, data, tone = 'income' }) => {
  const sortedData = Object.entries(data || {}).sort((a, b) => b[1] - a[1])

  if (sortedData.length === 0) {
    return (
      <EmptyCard
        icon={PieChart}
        title={emptyTitle}
        message={emptyMessage}
      />
    )
  }

  const total = sortedData.reduce((sum, [, amount]) => sum + amount, 0)

  return (
    <div className="space-y-3">
      {sortedData.map(([category, amount]) => {
        const percentage = total > 0 ? Math.round((amount / total) * 100) : 0
        const barClass = tone === 'income' ? 'bg-emerald-500' : 'bg-rose-500'

        return (
          <div key={category} className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{category}</p>
                <p className="mt-1 text-xs text-slate-500">{percentage}% of this report period</p>
              </div>
              <p className="text-sm font-semibold text-slate-900">{formatCurrency(amount)}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${barClass}`} style={{ width: `${percentage}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const ReportsPage = () => {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(buildPresetRange('month'))
  const [activePreset, setActivePreset] = useState('month')
  const [reportData, setReportData] = useState({
    summary: emptySummary,
    transactions: [],
    inventory: [],
  })

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true)

        const [summaryRes, transactionsRes, inventoryRes] = await Promise.all([
          api.get(`/transactions/summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
          api.get(`/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
          api.get('/inventory'),
        ])

        const summaryPayload = summaryRes.data?.data || emptySummary
        const transactions = Array.isArray(transactionsRes.data?.data) ? transactionsRes.data.data : []
        const inventory = Array.isArray(inventoryRes.data?.data) ? inventoryRes.data.data : []

        setReportData({
          summary: {
            ...emptySummary,
            ...summaryPayload,
            salesSummary: { ...emptySummary.salesSummary, ...(summaryPayload.salesSummary || {}) },
            purchaseSummary: { ...emptySummary.purchaseSummary, ...(summaryPayload.purchaseSummary || {}) },
            dueSummary: { ...emptySummary.dueSummary, ...(summaryPayload.dueSummary || {}) },
            cashSummary: { ...emptySummary.cashSummary, ...(summaryPayload.cashSummary || {}) },
          },
          transactions,
          inventory,
        })
      } catch (error) {
        console.error('Error fetching report data:', error)
        toast.error('Failed to load reports')
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [dateRange.endDate, dateRange.startDate])

  const applyPreset = (preset) => {
    setActivePreset(preset)
    setDateRange(buildPresetRange(preset))
  }

  const exportToCSV = () => {
    const summary = reportData.summary
    const lowStockItems = reportData.inventory.filter(item => Number(item.quantity || 0) <= Number(item.lowStockAlert || 0))

    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'OWNER SUMMARY\n'
    csvContent += `Report Period,${dateRange.startDate} to ${dateRange.endDate}\n`
    csvContent += `Sales,${summary.salesSummary?.totalSales || 0}\n`
    csvContent += `Expenses,${summary.totalExpense || 0}\n`
    csvContent += `Net Cash,${summary.cashSummary?.net || 0}\n`
    csvContent += `Purchases,${summary.purchaseSummary?.totalPurchases || 0}\n`
    csvContent += `Refunds,${summary.salesSummary?.totalRefunds || 0}\n`
    csvContent += `Low Stock Count,${lowStockItems.length}\n\n`

    csvContent += 'PAYMENT SUMMARY\n'
    csvContent += 'Method,In,Out,Net\n'
    Object.entries(summary.cashSummary?.byMethod || {}).forEach(([method, values]) => {
      csvContent += `${method},${values.in || 0},${values.out || 0},${values.net || 0}\n`
    })
    csvContent += '\n'

    csvContent += 'RECENT TRANSACTIONS\n'
    csvContent += 'Date,Description,Category,Payment Method,Type,Amount\n'
    reportData.transactions.forEach((transaction) => {
      csvContent += `${new Date(transaction.date).toLocaleDateString('en-NP')},${transaction.description},${transaction.category},${transaction.paymentMethod},${transaction.type},${transaction.amount}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `business-summary-${dateRange.startDate}-to-${dateRange.endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Report exported successfully')
  }

  const summary = reportData.summary
  const lowStockItems = reportData.inventory.filter(item => Number(item.quantity || 0) <= Number(item.lowStockAlert || 0))
  const paymentRows = Object.entries(summary.cashSummary?.byMethod || {}).filter(([, value]) => (value?.in || 0) > 0 || (value?.out || 0) > 0)

  if (loading) {
    return (
      <WorkspacePage>
        <StatePanel
          tone="teal"
          title="Loading reports"
          message="Collecting sales, expenses, stock, and payment data for this report period."
        />
      </WorkspacePage>
    )
  }

  return (
    <WorkspacePage>
      <PageHeader
        eyebrow="Reports"
        title="Business reports"
        description="Simple, owner-friendly reports for daily sales, expenses, cash, stock, and purchase follow-up."
        badges={[`${dateRange.startDate} to ${dateRange.endDate}`, 'Nepal-ready summaries']}
        actions={
          <button onClick={exportToCSV} className="btn-primary">
            <Download className="h-4 w-4" />
            Export report
          </button>
        }
      />

      <SectionCard
        eyebrow="Report Range"
        title="Choose a simple report period."
        description="Use quick ranges when the owner only needs the day, the week, or this month."
      >
        <div className="grid gap-4 xl:grid-cols-[1fr,24rem]">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'today', label: 'Today' },
              { key: 'last7', label: 'Last 7 days' },
              { key: 'month', label: 'This month' },
            ].map(preset => (
              <button
                key={preset.key}
                onClick={() => applyPreset(preset.key)}
                className={activePreset === preset.key ? 'btn-primary' : 'btn-secondary'}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Start date</FieldLabel>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(event) => {
                    setActivePreset('custom')
                    setDateRange(previous => ({ ...previous, startDate: event.target.value }))
                  }}
                  className="input-primary pl-10"
                />
              </div>
            </div>
            <div>
              <FieldLabel>End date</FieldLabel>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(event) => {
                    setActivePreset('custom')
                    setDateRange(previous => ({ ...previous, endDate: event.target.value }))
                  }}
                  className="input-primary pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <section className="grid gap-4 xl:grid-cols-5">
        <KpiCard icon={TrendingUp} title="Sales" value={formatCurrency(summary.salesSummary?.totalSales)} detail={`${summary.salesSummary?.count || 0} sales in this period`} tone="teal" />
        <KpiCard icon={TrendingDown} title="Expenses" value={formatCurrency(summary.totalExpense)} detail="Includes purchases and manual expenses" tone="rose" />
        <KpiCard icon={DollarSign} title="Net cash" value={formatCurrency(summary.cashSummary?.net)} detail={`In ${formatCurrency(summary.cashSummary?.totalIn)} · Out ${formatCurrency(summary.cashSummary?.totalOut)}`} tone="blue" />
        <KpiCard icon={ShoppingCart} title="Purchases" value={formatCurrency(summary.purchaseSummary?.totalPurchases)} detail={`${summary.purchaseSummary?.count || 0} purchase entries`} tone="amber" />
        <KpiCard icon={Package} title="Low stock" value={lowStockItems.length} detail={lowStockItems.length > 0 ? 'Restock before the next shift' : 'Stock levels look healthy'} tone="orange" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SectionCard
          eyebrow="Money Summary"
          title="Keep money in, money out, and dues easy to scan."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="erp-subtle">
              <p className="text-sm font-semibold text-slate-900">Collections and dues</p>
              <div className="mt-4 space-y-3">
                <ListRow>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Sales paid</p>
                    <p className="text-xs text-slate-500">Collected during this report period</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(summary.salesSummary?.totalPaid)}</p>
                </ListRow>
                <ListRow>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Customer due</p>
                    <p className="text-xs text-slate-500">Receivable still waiting to collect</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(summary.dueSummary?.receivable)}</p>
                </ListRow>
                <ListRow>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Supplier due</p>
                    <p className="text-xs text-slate-500">Payable still waiting to clear</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(summary.dueSummary?.payable)}</p>
                </ListRow>
              </div>
            </div>

            <div className="erp-subtle">
              <p className="text-sm font-semibold text-slate-900">Returns and purchase follow-up</p>
              <div className="mt-4 space-y-3">
                <ListRow>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Refunds</p>
                    <p className="text-xs text-slate-500">Sales reversed during this period</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(summary.salesSummary?.totalRefunds)}</p>
                </ListRow>
                <ListRow>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Purchase paid</p>
                    <p className="text-xs text-slate-500">Supplier payments already cleared</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(summary.purchaseSummary?.totalPaid)}</p>
                </ListRow>
                <ListRow>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Supplier credit</p>
                    <p className="text-xs text-slate-500">Credit left from returns or overpayment</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(summary.purchaseSummary?.totalCredit)}</p>
                </ListRow>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Payment Summary"
          title="See where the money came in."
          description="Digital wallets and cash should be visible without deeper accounting screens."
        >
          {paymentRows.length === 0 ? (
            <EmptyCard
              icon={DollarSign}
              title="No payment movement"
              message="Payment method totals will appear here when income or expense entries exist in this period."
            />
          ) : (
            <div className="space-y-3">
              {paymentRows.map(([method, value]) => (
                <ListRow key={method}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold capitalize text-slate-900">{method.replace('_', ' ')}</p>
                      <StatusBadge tone="slate">Net {formatCurrency(value.net || 0)}</StatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      In {formatCurrency(value.in || 0)} · Out {formatCurrency(value.out || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(value.net || 0)}</p>
                  </div>
                </ListRow>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          eyebrow="Money In"
          title="Sales and income by category"
        >
          <CategoryBreakdown
            title="Money In"
            emptyTitle="No income categories yet"
            emptyMessage="Once sales or income entries exist in this period, they will appear here."
            data={summary.incomeByCategory}
            tone="income"
          />
        </SectionCard>

        <SectionCard
          eyebrow="Money Out"
          title="Expenses by category"
        >
          <CategoryBreakdown
            title="Money Out"
            emptyTitle="No expense categories yet"
            emptyMessage="Once expenses or purchases exist in this period, they will appear here."
            data={summary.expenseByCategory}
            tone="expense"
          />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <SectionCard
          eyebrow="Stock Watch"
          title="Low-stock items that need action soon."
          description="Keep the owner focused on what needs buying before the next rush or shift."
        >
          {lowStockItems.length === 0 ? (
            <EmptyCard
              icon={Package}
              title="No low-stock items"
              message="Your low-stock list is clear for this moment."
            />
          ) : (
            <div className="space-y-3">
              {lowStockItems.slice(0, 8).map(item => (
                <ListRow key={item._id}>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.productName}</p>
                    <p className="text-xs text-slate-500">{item.category || 'Uncategorized'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{item.quantity} left</p>
                    <p className="text-xs text-slate-500">Alert at {item.lowStockAlert || 0}</p>
                  </div>
                </ListRow>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Recent Activity"
          title="Recent transactions in this report period."
        >
          {reportData.transactions.length === 0 ? (
            <EmptyCard
              icon={BarChart3}
              title="No transactions found"
              message="Try another date range or start recording business activity."
            />
          ) : (
            <DataTableShell>
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Method</th>
                      <th>Type</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions.slice(0, 10).map((transaction) => {
                      const isIncome = transaction.type === 'income'

                      return (
                        <tr key={transaction._id}>
                          <td>{new Date(transaction.date).toLocaleDateString('en-NP')}</td>
                          <td>
                            <p className="font-semibold text-slate-900">{transaction.description}</p>
                          </td>
                          <td>{transaction.category || 'Uncategorized'}</td>
                          <td className="capitalize">{(transaction.paymentMethod || 'cash').replace('_', ' ')}</td>
                          <td>
                            <StatusBadge tone={isIncome ? 'teal' : 'rose'}>
                              {isIncome ? 'Money in' : 'Money out'}
                            </StatusBadge>
                          </td>
                          <td className={`text-right font-semibold ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </DataTableShell>
          )}
        </SectionCard>
      </div>
    </WorkspacePage>
  )
}

export default ReportsPage
