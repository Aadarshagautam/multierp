import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  DollarSign, 
  Calendar,
  X,
  Save,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Layers,
  BookOpen,
  ShieldCheck,
  BarChart3,
  FileText,
  Receipt
} from 'lucide-react'
import api from './lib/axios'
import toast from 'react-hot-toast'

const AccountingPage = () => {
  const [monthlySummaries, setMonthlySummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [dayView, setDayView] = useState('all')
  
  // Date filtering
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [availableYears, setAvailableYears] = useState([])
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash'
  })

  const months = [
    { value: 'all', label: 'All Year' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const transactionsRes = await api.get('/transactions')
      
      const allTransactions = Array.isArray(transactionsRes.data?.data)
        ? transactionsRes.data.data
        : []
      
      const years = [...new Set(allTransactions.map(t => new Date(t.date).getFullYear()))]
      setAvailableYears(years.sort((a, b) => b - a))
      
      calculateMonthlySummaries(allTransactions)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const calculateMonthlySummaries = (allTransactions) => {
    const monthlyData = {}
    
    allTransactions.forEach(t => {
      const date = new Date(t.date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          income: 0,
          expense: 0,
          transactions: []
        }
      }
      
      monthlyData[monthYear].transactions.push(t)
      
      if (t.type === 'income') {
        monthlyData[monthYear].income += t.amount
      } else {
        monthlyData[monthYear].expense += t.amount
      }
    })
    
    const summaries = Object.keys(monthlyData)
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({
        monthYear: key,
        ...monthlyData[key],
        balance: monthlyData[key].income - monthlyData[key].expense
      }))
    
    setMonthlySummaries(summaries)
  }

  const getMonthName = (monthYear) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getFilteredSummaries = () => {
    let filtered = monthlySummaries

    if (selectedYear !== 'all') {
      filtered = filtered.filter(m => m.monthYear.startsWith(selectedYear.toString()))
    }

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(m => m.monthYear.endsWith(`-${selectedMonth}`))
    }

    return filtered
  }

  const getFilteredSummary = () => {
    const filtered = getFilteredSummaries()
    const totals = {
      income: 0,
      expense: 0,
      balance: 0
    }

    filtered.forEach(m => {
      totals.income += m.income
      totals.expense += m.expense
    })

    totals.balance = totals.income - totals.expense
    return totals
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.category || !formData.amount || !formData.description) {
      toast.error('Please fill all fields')
      return
    }

    try {
      if (editingId) {
        const res = await api.put(`/transactions/${editingId}`, {
          ...formData,
          amount: parseFloat(formData.amount)
        })

        if (res.data.success) {
          toast.success('Updated successfully')
        }
      } else {
        const res = await api.post('/transactions', {
          ...formData,
          amount: parseFloat(formData.amount)
        })

        if (res.data.success) {
          toast.success('Added successfully')
        }
      }

      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'Failed to save')
    }
  }

  const startEdit = (transaction) => {
    if (transaction.isSystemGenerated) {
      toast.error('Auto-posted accounting entries are updated from sales, invoices, and purchases.')
      return
    }

    setEditingId(transaction._id)
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: new Date(transaction.date).toISOString().split('T')[0],
      paymentMethod: transaction.paymentMethod
    })
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingId(null)
    setShowAddForm(false)
    setFormData({
      type: 'income',
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash'
    })
  }

  const previousYear = () => {
    if (selectedYear > Math.min(...availableYears)) {
      setSelectedYear(selectedYear - 1)
      setSelectedMonth('all')
    }
  }

  const nextYear = () => {
    if (selectedYear < Math.max(...availableYears)) {
      setSelectedYear(selectedYear + 1)
      setSelectedMonth('all')
    }
  }

  const incomeCategories = ['Sales', 'Services', 'Investment', 'Other Income']
  const expenseCategories = ['Rent', 'Utilities', 'Supplies', 'Salary', 'Marketing', 'Transport', 'Food', 'Other']

  if (loading) {
    return (
      <div className="lg:ml-64 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading your finances...</p>
        </div>
      </div>
    )
  }

  const filteredSummaries = getFilteredSummaries()
  const filteredTotals = getFilteredSummary()
  const allFilteredTransactions = filteredSummaries.flatMap(m => m.transactions)
  const journalTransactions = filter === 'all'
    ? allFilteredTransactions
    : allFilteredTransactions.filter(t => t.type === filter)

  const dailyTotals = journalTransactions.reduce((acc, t) => {
    const dayKey = new Date(t.date).toISOString().split('T')[0]
    if (!acc[dayKey]) {
      acc[dayKey] = { income: 0, expense: 0, transactions: [] }
    }
    acc[dayKey].transactions.push(t)
    if (t.type === 'income') acc[dayKey].income += t.amount
    else acc[dayKey].expense += t.amount
    return acc
  }, {})

  const dailySummaries = Object.keys(dailyTotals)
    .sort((a, b) => b.localeCompare(a))
    .map(key => ({
      day: key,
      ...dailyTotals[key],
      balance: dailyTotals[key].income - dailyTotals[key].expense
    }))

  const dayOptions = [
    { value: 'all', label: 'All Days' },
    ...dailySummaries.map(d => ({ value: d.day, label: d.day }))
  ]

  const categoryTotals = journalTransactions.reduce((acc, t) => {
    const key = t.category || 'Uncategorized'
    acc[key] = (acc[key] || 0) + t.amount
    return acc
  }, {})

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const renderJournals = () => {
    const income = journalTransactions.filter(t => t.type === 'income')
    const expense = journalTransactions.filter(t => t.type === 'expense')

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Journals</h3>
              <p className="text-sm text-slate-500">Entry batches by type</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">{income.length} income</span>
              <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700">{expense.length} expense</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Sales Journal', rows: income.slice(0, 5) },
            { title: 'Purchases Journal', rows: expense.slice(0, 5) },
          ].map((box) => (
            <div key={box.title} className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-600" />
                <p className="text-sm font-semibold text-slate-900">{box.title}</p>
              </div>
              <div className="divide-y divide-slate-200">
                {box.rows.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500">No entries yet</div>
                ) : (
                  box.rows.map((t) => (
                    <div key={t._id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{t.description}</p>
                        <p className="text-xs text-slate-500">
                          {t.category}
                          {t.sourceDocumentNo ? ` · ${t.sourceDocumentNo}` : ''}
                        </p>
                      </div>
                      <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {t.type === 'income' ? '+' : '-'}{'\u20B9'}{t.amount.toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderReconcile = () => {
    const candidates = journalTransactions
      .filter(t => t.paymentMethod !== 'cash')
      .slice(0, 8)

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-lg font-semibold text-slate-900">Reconciliation</h3>
          <p className="text-sm text-slate-500">Match bank and card lines with entries.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400 grid grid-cols-12">
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Method</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
          {candidates.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">No items to reconcile.</div>
          ) : (
            candidates.map((t) => (
              <div key={t._id} className="px-5 py-3 grid grid-cols-12 items-center border-b border-slate-200 last:border-b-0">
                <div className="col-span-4 text-sm font-semibold text-slate-900">{t.description}</div>
                <div className="col-span-2 text-sm text-slate-600">{t.category}</div>
                <div className="col-span-2 text-sm text-slate-600 capitalize">{t.paymentMethod.replace('_', ' ')}</div>
                <div className="col-span-2 text-sm text-slate-600">
                  {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className={`col-span-2 text-right text-sm font-semibold ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {t.type === 'income' ? '+' : '-'}{'\u20B9'}{t.amount.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  const renderReports = () => {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs text-slate-500">Net Position</p>
                <p className="text-lg font-semibold text-slate-900">{'\u20B9'}{filteredTotals.balance.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs text-slate-500">Total Income</p>
                <p className="text-lg font-semibold text-slate-900">{'\u20B9'}{filteredTotals.income.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs text-slate-500">Total Expense</p>
                <p className="text-lg font-semibold text-slate-900">{'\u20B9'}{filteredTotals.expense.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Top Categories</h3>
          </div>
          <div className="divide-y divide-slate-200">
            {sortedCategories.length === 0 ? (
              <div className="p-5 text-sm text-slate-500">No category data.</div>
            ) : (
              sortedCategories.map(([category, total]) => (
                <div key={category} className="px-5 py-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{category}</p>
                  <p className="text-sm text-slate-700">{'\u20B9'}{total.toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderOverview = () => {
    return (
      <>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
          <p className="text-xs text-slate-500">Daily accounting:</p>
          {dayOptions.slice(0, 8).map(opt => (
            <button
              key={opt.value}
              onClick={() => setDayView(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dayView === opt.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.value === 'all' ? 'All Days' : opt.label}
            </button>
          ))}
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Transaction' : 'New Transaction'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                    className={`p-4 rounded-lg border text-sm font-semibold transition-all ${
                      formData.type === 'income'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    <ArrowDownCircle className={`w-7 h-7 mx-auto mb-2 ${formData.type === 'income' ? 'text-emerald-500' : 'text-slate-400'}`} />
                    Money In
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                    className={`p-4 rounded-lg border text-sm font-semibold transition-all ${
                      formData.type === 'expense'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-rose-300'
                    }`}
                  >
                    <ArrowUpCircle className={`w-7 h-7 mx-auto mb-2 ${formData.type === 'expense' ? 'text-rose-500' : 'text-slate-400'}`} />
                    Money Out
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">-- Choose --</option>
                    {(formData.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Amount (\u20B9) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="What was it for?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-4 gap-3">
                    {['cash', 'card', 'bank_transfer', 'other'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: method })}
                        className={`py-3 px-4 rounded-lg border text-sm font-semibold capitalize transition-all ${
                          formData.paymentMethod === method
                            ? 'border-slate-900 bg-slate-50 text-slate-900'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {method === 'bank_transfer' ? 'Bank' : method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-emerald-600">Money In</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{'\u20B9'}{filteredTotals.income.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-emerald-700" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-rose-600">Money Out</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{'\u20B9'}{filteredTotals.expense.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-rose-700" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Balance</p>
                <p className={`text-2xl font-semibold mt-1 ${filteredTotals.balance >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
                  {'\u20B9'}{filteredTotals.balance.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-slate-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Records */}
        {filteredSummaries.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-300">
            <DollarSign className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No records for this period</h3>
            <p className="text-slate-500 text-sm">Try selecting a different time period</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dayView !== 'all' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Daily Ledger</h3>
                    <p className="text-xs text-slate-500">{dayView}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Balance</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {'\u20B9'}{(dailyTotals[dayView]?.income || 0) - (dailyTotals[dayView]?.expense || 0)}
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-slate-200">
                  {(dailyTotals[dayView]?.transactions || []).map(t => (
                    <div key={t._id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{t.description}</p>
                        <p className="text-xs text-slate-500">{t.category} • {t.paymentMethod.replace('_', ' ')}</p>
                      </div>
                      <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {t.type === 'income' ? '+' : '-'}{'\u20B9'}{t.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {filteredSummaries.map((monthly) => {
              const filteredTransactions = filter === 'all' 
                ? monthly.transactions 
                : monthly.transactions.filter(t => t.type === filter)

              if (filteredTransactions.length === 0) return null

              return (
                <div key={monthly.monthYear} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-slate-700" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{getMonthName(monthly.monthYear)}</h3>
                          <p className="text-xs text-slate-500">{monthly.transactions.length} transactions</p>
                        </div>
                      </div>

                      <div className="flex gap-6 text-right">
                        <div>
                          <p className="text-xs text-slate-400">In</p>
                          <p className="text-lg font-semibold text-emerald-700">{'\u20B9'}{monthly.income.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Out</p>
                          <p className="text-lg font-semibold text-rose-700">{'\u20B9'}{monthly.expense.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Balance</p>
                          <p className={`text-lg font-semibold ${monthly.balance >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
                            {'\u20B9'}{monthly.balance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200">
                    <div className="px-5 py-2 text-xs uppercase tracking-wider text-slate-400 grid grid-cols-12">
                      <div className="col-span-4">Description</div>
                      <div className="col-span-2">Category</div>
                      <div className="col-span-2">Date</div>
                      <div className="col-span-2">Method</div>
                      <div className="col-span-2 text-right">Amount</div>
                    </div>
                    {filteredTransactions.map((transaction) => (
                      <div key={transaction._id} className={`px-5 py-4 hover:bg-slate-50 ${editingId === transaction._id ? 'bg-slate-50' : ''}`}>
                        <div className="grid grid-cols-12 items-center gap-2">
                          <div className="col-span-4 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              transaction.type === 'income' ? 'bg-emerald-100' : 'bg-rose-100'
                            }`}>
                              {transaction.type === 'income' ? (
                                <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <ArrowUpCircle className="w-5 h-5 text-rose-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{transaction.description}</p>
                              <p className="text-xs text-slate-500">
                                {transaction.isSystemGenerated ? 'Auto-posted' : 'Manual'}
                                {' · '}
                                {transaction.type === 'income' ? 'Income' : 'Expense'}
                                {transaction.sourceDocumentNo ? ` · ${transaction.sourceDocumentNo}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="col-span-2 text-sm text-slate-600">{transaction.category}</div>
                          <div className="col-span-2 text-sm text-slate-600">
                            {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="col-span-2 text-sm text-slate-600 capitalize">
                            {transaction.paymentMethod.replace('_', ' ')}
                          </div>
                          <div className="col-span-2 text-right">
                            <p className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {transaction.type === 'income' ? '+' : '-'}{'\u20B9'}{transaction.amount.toLocaleString()}
                            </p>
                          </div>
                          {!transaction.isSystemGenerated && (
                            <div className="col-span-12 flex justify-end">
                              <button
                                onClick={() => startEdit(transaction)}
                                className="text-slate-500 hover:text-slate-900 text-xs font-semibold"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </>
    )
  }

  const renderMainContent = () => {
    if (activeTab === 'journals') return renderJournals()
    if (activeTab === 'reconcile') return renderReconcile()
    if (activeTab === 'reports') return renderReports()

    return renderOverview()
  }

  return (
    <div className="lg:ml-64 min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Accounting</p>
              <h1 className="text-2xl font-semibold text-slate-900">Accounting</h1>
              <p className="text-sm text-slate-500 mt-1">Sales, purchases, dues, and owner cash movement in one practical ledger.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm)
                  if (editingId) resetForm()
                }}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Entry
              </button>
            </div>
          </div>

          {/* Top Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: 'overview', label: 'Overview', icon: Layers },
              { key: 'journals', label: 'Journals', icon: BookOpen },
              { key: 'reconcile', label: 'Reconciliation', icon: ShieldCheck },
              { key: 'reports', label: 'Reports', icon: BarChart3 },
            ].map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Left Filters */}
          <aside className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-fit sticky top-28">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
              <button
                onClick={() => {
                  setSelectedMonth('all')
                  setSelectedYear(new Date().getFullYear())
                  setFilter('all')
                }}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Reset
              </button>
            </div>

            <div className="mt-4 bg-slate-50 rounded-lg border border-slate-200">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <div className="text-left">
                    <p className="text-xs text-slate-500">Period</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedMonth === 'all' 
                        ? `All of ${selectedYear}` 
                        : `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                    </p>
                  </div>
                </div>
                {showDatePicker ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showDatePicker && (
                <div className="border-t border-slate-200 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={previousYear}
                      disabled={selectedYear <= Math.min(...availableYears)}
                      className="p-1 bg-white border border-slate-300 rounded disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <p className="text-sm font-semibold text-slate-900">{selectedYear}</p>
                    <button
                      onClick={nextYear}
                      disabled={selectedYear >= Math.max(...availableYears)}
                      className="p-1 bg-white border border-slate-300 rounded disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {months.map(month => (
                      <button
                        key={month.value}
                        onClick={() => setSelectedMonth(month.value)}
                        className={`py-2 rounded text-xs font-semibold ${
                          selectedMonth === month.value
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-600 hover:border-emerald-300'
                        }`}
                      >
                        {month.value === 'all' ? 'All' : month.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-2">Day</p>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={dayView === 'all' ? '' : dayView}
                        onChange={(e) => setDayView(e.target.value || 'all')}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {dayOptions.slice(0, 6).map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setDayView(opt.value)}
                            className={`py-2 rounded text-xs font-semibold ${
                              dayView === opt.value
                                ? 'bg-slate-900 text-white'
                                : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400'
                            }`}
                          >
                            {opt.value === 'all' ? 'All Days' : opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Journal</p>
              <div className="flex flex-col gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'income', label: 'Money In' },
                  { key: 'expense', label: 'Money Out' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold text-left ${
                      filter === tab.key
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <p className="text-xs text-emerald-600">Money In</p>
                <p className="text-lg font-semibold text-slate-900">{'\u20B9'}{filteredTotals.income.toLocaleString()}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <p className="text-xs text-rose-600">Money Out</p>
                <p className="text-lg font-semibold text-slate-900">{'\u20B9'}{filteredTotals.expense.toLocaleString()}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <p className="text-xs text-slate-500">Balance</p>
                <p className={`text-lg font-semibold ${filteredTotals.balance >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
                  {'\u20B9'}{filteredTotals.balance.toLocaleString()}
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <section className="space-y-6">
            {renderMainContent()}
          </section>
        </div>
      </div>
    </div>
  )
}

export default AccountingPage
