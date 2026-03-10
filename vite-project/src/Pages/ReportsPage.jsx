import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Download,
  PieChart,
  BarChart3,
  Package,
  ShoppingCart
} from 'lucide-react'
import api from './lib/axios'
import toast from 'react-hot-toast'

const ReportsPage = () => {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [reportData, setReportData] = useState({
    summary: {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      incomeByCategory: {},
      expenseByCategory: {}
    },
    transactions: [],
    inventory: [],
    todos: []
  })

  const fetchReportData = React.useCallback(async () => {
    try {
      setLoading(true)
      
      const [summaryRes, transactionsRes, inventoryRes, todosRes] = await Promise.all([
        api.get(`/transactions/summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        api.get(`/transactions?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        api.get('/inventory'),
        api.get('/todos')
      ])

      const summaryPayload = summaryRes.data?.data || {}
      const transactions = Array.isArray(transactionsRes.data?.data)
        ? transactionsRes.data.data
        : []
      const inventory = Array.isArray(inventoryRes.data?.data)
        ? inventoryRes.data.data
        : []
      const todos = Array.isArray(todosRes.data?.data)
        ? todosRes.data.data
        : []

      setReportData({
        summary: {
          totalIncome: summaryPayload.totalIncome || 0,
          totalExpense: summaryPayload.totalExpense || 0,
          balance: summaryPayload.balance || 0,
          incomeByCategory: summaryPayload.incomeByCategory || {},
          expenseByCategory: summaryPayload.expenseByCategory || {},
        },
        transactions,
        inventory,
        todos
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [dateRange.endDate, dateRange.startDate])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  const exportToCSV = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"
    
    // Add Summary Section
    csvContent += "FINANCIAL SUMMARY\n"
    csvContent += `Report Period:,${dateRange.startDate} to ${dateRange.endDate}\n\n`
    csvContent += `Total Income:,\u20B9${reportData.summary.totalIncome}\n`
    csvContent += `Total Expense:,\u20B9${reportData.summary.totalExpense}\n`
    csvContent += `Net Balance:,\u20B9${reportData.summary.balance}\n\n`

    // Add Income by Category
    csvContent += "INCOME BY CATEGORY\n"
    csvContent += "Category,Amount\n"
    Object.entries(reportData.summary.incomeByCategory || {}).forEach(([category, amount]) => {
      csvContent += `${category},\u20B9${amount}\n`
    })
    csvContent += "\n"

    // Add Expense by Category
    csvContent += "EXPENSE BY CATEGORY\n"
    csvContent += "Category,Amount\n"
    Object.entries(reportData.summary.expenseByCategory || {}).forEach(([category, amount]) => {
      csvContent += `${category},\u20B9${amount}\n`
    })
    csvContent += "\n"

    // Add Transactions
    csvContent += "ALL TRANSACTIONS\n"
    csvContent += "Date,Type,Category,Description,Amount,Payment Method\n"
    reportData.transactions.forEach(t => {
      csvContent += `${new Date(t.date).toLocaleDateString()},${t.type},${t.category},${t.description},\u20B9${t.amount},${t.paymentMethod}\n`
    })

    // Download
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `financial-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Report exported successfully!')
  }

  const StatCard = ({ icon: Icon, label, value, subValue, color, bgColor }) => (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      {subValue && <p className="text-sm text-gray-500">{subValue}</p>}
    </div>
  )

  const CategoryBreakdown = ({ title, data, type }) => {
    const total = Object.values(data || {}).reduce((sum, val) => sum + val, 0)
    const sortedData = Object.entries(data || {}).sort((a, b) => b[1] - a[1])

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedData.map(([category, amount]) => {
              const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <span className={`text-sm font-semibold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {'\u20B9'}{amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{percentage}% of total</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const inventoryStats = {
    totalProducts: reportData.inventory.length,
    totalValue: reportData.inventory.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0),
    lowStock: reportData.inventory.filter(item => item.quantity <= item.lowStockAlert).length,
    totalCost: reportData.inventory.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0)
  }

  const todoStats = {
    total: reportData.todos.length,
    completed: reportData.todos.filter(t => t.completed).length,
    active: reportData.todos.filter(t => !t.completed).length,
    completionRate: reportData.todos.length > 0 
      ? ((reportData.todos.filter(t => t.completed).length / reportData.todos.length) * 100).toFixed(1)
      : 0
  }

  if (loading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Generating reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ml-64 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Reports</h1>
            <p className="text-gray-600">Comprehensive insights into your business performance.</p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={TrendingUp}
            label="Total Income"
            value={`\u20B9${reportData.summary.totalIncome.toLocaleString()}`}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            icon={TrendingDown}
            label="Total Expenses"
            value={`\u20B9${reportData.summary.totalExpense.toLocaleString()}`}
            color="text-red-600"
            bgColor="bg-red-100"
          />
          <StatCard
            icon={DollarSign}
            label="Net Profit/Loss"
            value={`\u20B9${reportData.summary.balance.toLocaleString()}`}
            subValue={`${reportData.summary.balance >= 0 ? 'Profit' : 'Loss'}`}
            color={reportData.summary.balance >= 0 ? 'text-indigo-600' : 'text-red-600'}
            bgColor={reportData.summary.balance >= 0 ? 'bg-indigo-100' : 'bg-red-100'}
          />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Category Breakdown</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryBreakdown
            title="Income by Category"
            data={reportData.summary.incomeByCategory}
            type="income"
          />
          <CategoryBreakdown
            title="Expenses by Category"
            data={reportData.summary.expenseByCategory}
            type="expense"
          />
        </div>
      </div>

      {/* Inventory Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={Package}
            label="Total Products"
            value={inventoryStats.totalProducts}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            icon={DollarSign}
            label="Inventory Value"
            value={`\u20B9${inventoryStats.totalValue.toLocaleString()}`}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            icon={ShoppingCart}
            label="Total Investment"
            value={`\u20B9${inventoryStats.totalCost.toLocaleString()}`}
            color="text-purple-600"
            bgColor="bg-purple-100"
          />
          <StatCard
            icon={TrendingDown}
            label="Low Stock Items"
            value={inventoryStats.lowStock}
            color="text-amber-600"
            bgColor="bg-amber-100"
          />
        </div>
      </div>

      {/* Productivity Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Productivity Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={BarChart3}
            label="Total Tasks"
            value={todoStats.total}
            color="text-indigo-600"
            bgColor="bg-indigo-100"
          />
          <StatCard
            icon={TrendingUp}
            label="Completed"
            value={todoStats.completed}
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            icon={TrendingDown}
            label="Active"
            value={todoStats.active}
            color="text-amber-600"
            bgColor="bg-amber-100"
          />
          <StatCard
            icon={PieChart}
            label="Completion Rate"
            value={`${todoStats.completionRate}%`}
            color="text-purple-600"
            bgColor="bg-purple-100"
          />
        </div>
      </div>

      {/* Recent Transactions Summary */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {reportData.transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No transactions in selected date range</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.transactions.slice(0, 10).map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {transaction.type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{'\u20B9'}{transaction.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
