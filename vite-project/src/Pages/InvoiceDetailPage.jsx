import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  FileText, Download, ArrowLeft, Send, CheckCircle,
  XCircle, Clock, Edit, Trash2, DollarSign, Calendar,
  MapPin, Phone, Mail, Building2, Hash
} from 'lucide-react'
import api from './lib/axios'
import toast from 'react-hot-toast'
import {
  PAYMENT_METHOD_LABELS,
  TAX_REGISTRATION_LABEL,
  formatCurrencyNpr,
  formatDateNepal,
} from '../utils/nepal.js'

const InvoiceDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  const formatDate = (dateStr) => {
    return formatDateNepal(dateStr)
  }

  const fetchInvoice = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get(`/invoices/${id}`)
      const data = res.data?.data || res.data?.invoice || res.data
      if (data) {
        setInvoice(data)
        return
      }
      toast.error('Invoice not found')
      navigate('/invoices')
    } catch {
      toast.error('Failed to load invoice')
      navigate('/invoices')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  const downloadPDF = async () => {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${invoice.invoiceNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch {
      toast.error('Failed to generate PDF')
    }
  }

  const updateStatus = async (status) => {
    try {
      const res = await api.patch(`/invoices/${id}/status`, { status })
      if (res.data.success) {
        const updated = res.data?.data
        if (updated) {
          setInvoice(updated)
        }
        toast.success(`Invoice marked as ${status}`)
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return
    try {
      const res = await api.delete(`/invoices/${id}`)
      if (res.data.success) {
        toast.success('Invoice deleted')
        navigate('/invoices')
      }
    } catch {
      toast.error('Failed to delete invoice')
    }
  }

  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Clock },
    sent: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Send },
    paid: { color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
    overdue: { color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
    cancelled: { color: 'bg-amber-100 text-amber-700 border-amber-300', icon: XCircle },
  }

  if (loading) {
    return (
      <div className="lg:ml-64 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (!invoice) return null

  const StatusIcon = statusConfig[invoice.status]?.icon || Clock
  const vatDiscountModeLabels = {
    after_vat_no_prorate: 'Overall discount after VAT (no prorate)',
    after_vat_prorate: 'Overall discount after VAT (prorate to lines)',
    before_vat_no_prorate: 'Overall discount before VAT (no prorate)',
    before_vat_prorate: 'Overall discount before VAT (prorate to lines)'
  }
  const vatDiscountModeLabel = vatDiscountModeLabels[invoice.vatDiscountMode] || 'Overall discount after VAT (no prorate)'

  return (
    <div className="lg:ml-64 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig[invoice.status]?.color}`}>
                <StatusIcon className="w-4 h-4" />
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
              <span className="text-gray-500 text-sm">
                Created {formatDate(invoice.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <Link
            to={`/invoices/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          {invoice.status === 'draft' && (
            <button
              onClick={() => updateStatus('sent')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              Mark Sent
            </button>
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <button
              onClick={() => updateStatus('paid')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Paid
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Invoice Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bill To */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Bill To</h3>
                <p className="text-lg font-bold text-gray-900">{invoice.customerName}</p>
                {invoice.customerEmail && (
                  <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Mail className="w-4 h-4" /> {invoice.customerEmail}
                  </p>
                )}
                {invoice.customerPhone && (
                  <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Phone className="w-4 h-4" /> {invoice.customerPhone}
                  </p>
                )}
                {invoice.customerAddress?.street && (
                  <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    {[invoice.customerAddress.street, invoice.customerAddress.city, invoice.customerAddress.state, invoice.customerAddress.pincode].filter(Boolean).join(', ')}
                  </p>
                )}
                {invoice.customerGstin && (
                  <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Hash className="w-4 h-4" /> {TAX_REGISTRATION_LABEL}: {invoice.customerGstin}
                  </p>
                )}
              </div>

              {/* Invoice Details */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Invoice Details</h3>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Invoice No:</span>
                  <span className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Issue Date:</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment:</span>
                  <span className="text-sm font-medium text-gray-900">{PAYMENT_METHOD_LABELS[invoice.paymentMethod] || invoice.paymentMethod}</span>
                </div>
                {invoice.withoutVat && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">VAT:</span>
                    <span className="text-sm font-medium text-amber-600">Without VAT</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Calc Mode:</span>
                  <span className="text-sm font-medium text-gray-900">{vatDiscountModeLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">VAT%</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(invoice.items || []).map((item, index) => (
                    <tr key={item._id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                        {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrencyNpr(item.unitPrice)}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{invoice.withoutVat ? '0' : item.vatRate}%</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {item.discountAmount > 0 ? formatCurrencyNpr(item.discountAmount) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">{formatCurrencyNpr(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Totals Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Invoice Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrencyNpr(invoice.subtotal)}</span>
              </div>

              {invoice.totalItemDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Item Discounts</span>
                  <span className="font-medium text-red-600">- {formatCurrencyNpr(invoice.totalItemDiscount)}</span>
                </div>
              )}

              {!invoice.withoutVat && invoice.totalVat > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total VAT</span>
                  <span className="font-medium text-gray-900">{formatCurrencyNpr(invoice.totalVat)}</span>
                </div>
              )}

              {invoice.overallDiscountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Overall Discount
                    {invoice.overallDiscountType === 'percentage' && ` (${invoice.overallDiscountValue}%)`}
                  </span>
                  <span className="font-medium text-red-600">- {formatCurrencyNpr(invoice.overallDiscountAmount)}</span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Grand Total</span>
                  <span className="text-2xl font-bold text-indigo-600">{formatCurrencyNpr(invoice.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Status Actions */}
            <div className="mt-6 space-y-2">
              {invoice.status === 'draft' && (
                <button
                  onClick={() => updateStatus('sent')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" /> Mark as Sent
                </button>
              )}
              {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                <button
                  onClick={() => updateStatus('paid')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Mark as Paid
                </button>
              )}
              {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                <button
                  onClick={() => updateStatus('cancelled')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Cancel Invoice
                </button>
              )}
              <button
                onClick={downloadPDF}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetailPage

