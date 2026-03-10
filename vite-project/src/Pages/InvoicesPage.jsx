import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Download,
  Eye,
  Plus,
  Search,
  Trash2,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Send
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from './lib/axios'
import toast from 'react-hot-toast'
import { formatCurrencyNpr, formatDateNepal } from '../utils/nepal.js'

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    bg: 'bg-gray-100 text-gray-700',
    icon: Clock,
  },
  sent: {
    label: 'Sent',
    bg: 'bg-blue-100 text-blue-700',
    icon: Send,
  },
  paid: {
    label: 'Paid',
    bg: 'bg-green-100 text-green-700',
    icon: CheckCircle,
  },
  overdue: {
    label: 'Overdue',
    bg: 'bg-red-100 text-red-700',
    icon: AlertCircle,
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-amber-100 text-amber-700',
    icon: XCircle,
  },
}

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'cancelled', label: 'Cancelled' },
]

const formatCurrency = (amount) => {
  return formatCurrencyNpr(amount)
}

const formatDate = (dateStr) => {
  return formatDateNepal(dateStr)
}

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    paidCount: 0,
    paidAmount: 0,
    unpaidCount: 0,
    unpaidAmount: 0,
    overdueCount: 0,
    draftCount: 0,
  })
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null)

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/invoices')
      const payload = res.data?.data
      setInvoices(Array.isArray(payload) ? payload : [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/invoices/stats')
      const data = res.data?.data || {}
      setStats({
        totalInvoices: data.totalInvoices || 0,
        totalRevenue: data.totalRevenue || 0,
        paidCount: data.paidCount || 0,
        paidAmount: data.paidAmount || 0,
        unpaidCount: data.unpaidCount || 0,
        unpaidAmount: data.unpaidAmount || 0,
        overdueCount: data.overdueCount || 0,
        draftCount: data.draftCount || 0,
      })
    } catch (error) {
      console.error('Error fetching invoice stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchInvoices()
    fetchStats()
  }, [fetchInvoices, fetchStats])

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setStatusDropdownOpen(null)
    if (statusDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [statusDropdownOpen])

  const downloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${invoiceNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const updateStatus = async (invoiceId, newStatus) => {
    try {
      await api.patch(`/invoices/${invoiceId}/status`, { status: newStatus })
      setInvoices((prev) => (
        (Array.isArray(prev) ? prev : []).map((inv) =>
          (inv._id || inv.id) === invoiceId ? { ...inv, status: newStatus } : inv
        )
      ))
      setStatusDropdownOpen(null)
      toast.success(`Invoice marked as ${newStatus}`)
      fetchStats()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update invoice status')
    }
  }

  const deleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return

    try {
      await api.delete(`/invoices/${invoiceId}`)
      setInvoices((prev) => (
        Array.isArray(prev)
          ? prev.filter((inv) => (inv._id || inv.id) !== invoiceId)
          : []
      ))
      toast.success('Invoice deleted successfully')
      fetchStats()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error('Failed to delete invoice')
    }
  }

  const safeInvoices = Array.isArray(invoices) ? invoices : []
  const filteredInvoices = safeInvoices.filter((invoice) => {
    const matchesSearch =
      (invoice.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    )
  }

  const getFilterCount = (filterKey) => {
    if (filterKey === 'all') return safeInvoices.length
    return safeInvoices.filter((inv) => inv.status === filterKey).length
  }

  if (loading) {
    return (
      <div className="lg:ml-64 flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:ml-64 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Invoices</h1>
            <p className="text-gray-600">Manage and track all your invoices in one place.</p>
          </div>
          <Link
            to="/invoices/new"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Invoices */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
            </div>
          </div>
        </div>

        {/* Paid Amount */}
        <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid Amount</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.paidAmount)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stats.paidCount} invoice{stats.paidCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Unpaid Amount */}
        <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unpaid Amount</p>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(stats.unpaidAmount)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stats.unpaidCount} invoice{stats.unpaidCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-xl p-6 border border-red-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-700">{stats.overdueCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Require attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center overflow-x-auto border-b border-gray-200">
          {STATUS_TABS.map((tab) => {
            const count = getFilterCount(tab.key)
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === tab.key
                    ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusFilter === tab.key
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center border border-gray-200 shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No invoices found' : 'No invoices yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            {searchTerm
              ? 'Try adjusting your search terms or clearing filters.'
              : statusFilter !== 'all'
              ? `No ${statusFilter} invoices at the moment.`
              : 'Create your first invoice to start tracking your billing and payments.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Link
              to="/invoices/new"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create First Invoice
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const invoiceId = invoice._id || invoice.id
            const isOverdue =
              invoice.status !== 'paid' &&
              invoice.status !== 'cancelled' &&
              invoice.dueDate &&
              new Date(invoice.dueDate) < new Date()

            return (
              <div
                key={invoiceId}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Invoice Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-teal-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <h3 className="text-base font-bold text-gray-900 truncate">
                            {invoice.invoiceNumber || 'N/A'}
                          </h3>
                          {getStatusBadge(invoice.status)}
                          {isOverdue && invoice.status !== 'overdue' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              <AlertCircle className="w-3 h-3" />
                              Past Due
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 font-medium truncate">
                          {invoice.customerName || 'Unknown Customer'}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span>Issued: {formatDate(invoice.issueDate)}</span>
                          <span className="text-gray-300">|</span>
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            Due: {formatDate(invoice.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between lg:justify-end gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">Amount</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(invoice.grandTotal)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {/* View */}
                        <Link
                          to={`/invoices/${invoiceId}`}
                          className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>

                        {/* Download PDF */}
                        <button
                          onClick={() => downloadPDF(invoiceId, invoice.invoiceNumber)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-5 h-5" />
                        </button>

                        {/* Change Status Dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setStatusDropdownOpen(statusDropdownOpen === invoiceId ? null : invoiceId)
                            }}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Change Status"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                          {statusDropdownOpen === invoiceId && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                Change Status
                              </p>
                              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                if (key === invoice.status) return null
                                const Icon = config.icon
                                return (
                                  <button
                                    key={key}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      updateStatus(invoiceId, key)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <Icon className="w-4 h-4" />
                                    {config.label}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => deleteInvoice(invoiceId)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary Footer */}
      {filteredInvoices.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>
              Showing <span className="font-semibold text-gray-900">{filteredInvoices.length}</span>{' '}
              of <span className="font-semibold text-gray-900">{safeInvoices.length}</span> invoice
              {safeInvoices.length !== 1 ? 's' : ''}
            </p>
            <p className="font-medium">
              Total:{' '}
              <span className="text-gray-900 font-bold">
                {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.grandTotal) || 0), 0))}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoicesPage

