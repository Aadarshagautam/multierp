import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FileText,
  Plus,
  Trash2,
  Search,
  Save,
  ArrowLeft,
  Percent,
  Calculator
} from 'lucide-react'
import api from './lib/axios'
import toast from 'react-hot-toast'
import {
  DEFAULT_VAT_RATE,
  INVOICE_PAYMENT_METHODS,
  TAX_REGISTRATION_LABEL,
  formatCurrencyNpr,
} from '../utils/nepal.js'

const EMPTY_ITEM = {
  productId: '',
  productName: '',
  sku: '',
  quantity: 1,
  unitPrice: 0,
  vatRate: 0,
  discountType: 'flat',
  discountValue: 0
}

const PAYMENT_METHODS = INVOICE_PAYMENT_METHODS

const InvoiceFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = Boolean(id)

  const customerDropdownRef = useRef(null)

  // ----- State -----
  const [invoice, setInvoice] = useState({
    customerId: '',
    customerName: '',
    overallDiscountType: 'none',
    overallDiscountValue: 0,
    vatDiscountMode: 'after_vat_no_prorate',
    withoutVat: false,
    dueDate: '',
    paymentMethod: 'cash',
    notes: '',
    status: 'draft'
  })

  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ----- Data fetching on mount -----
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [customersRes, productsRes] = await Promise.all([
          api.get('/customers'),
          api.get('/inventory')
        ])
        const customersPayload = customersRes.data?.data
        setCustomers(Array.isArray(customersPayload) ? customersPayload : [])
        const inventoryPayload = productsRes.data?.data
        setProducts(Array.isArray(inventoryPayload) ? inventoryPayload : [])

        // If edit mode, fetch existing invoice
        if (isEditMode) {
          const invoiceRes = await api.get(`/invoices/${id}`)
          const data = invoiceRes.data?.data || invoiceRes.data?.invoice || invoiceRes.data
          setInvoice({
            customerId: data.customerId || '',
            customerName: data.customerName || '',
            overallDiscountType: data.overallDiscountType || 'none',
            overallDiscountValue: data.overallDiscountValue || 0,
            vatDiscountMode: data.vatDiscountMode || 'after_vat_no_prorate',
            withoutVat: data.withoutVat || false,
            dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
            paymentMethod: data.paymentMethod || 'cash',
            notes: data.notes || '',
            status: data.status || 'draft'
          })
          setCustomerSearch(data.customerName || '')
          if (data.items && data.items.length > 0) {
            setItems(data.items.map(item => ({
              productId: item.productId || '',
              productName: item.productName || '',
              sku: item.sku || '',
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              vatRate: item.vatRate || 0,
              discountType: item.discountType || 'flat',
              discountValue: item.discountValue || 0
            })))
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load form data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, isEditMode])

  // ----- Close customer dropdown on outside click -----
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ----- Customer filtering -----
  const filteredCustomers = useMemo(() => {
    const safeCustomers = Array.isArray(customers) ? customers : []
    if (!customerSearch.trim()) return safeCustomers
    const term = customerSearch.toLowerCase()
    return safeCustomers.filter(c => {
      const name = (c.name || c.customerName || '').toLowerCase()
      const email = (c.email || '').toLowerCase()
      const phone = (c.phone || c.mobile || '').toLowerCase()
      return name.includes(term) || email.includes(term) || phone.includes(term)
    })
  }, [customers, customerSearch])

  // ----- Customer select handler -----
  const handleSelectCustomer = useCallback((customer) => {
    const name = customer.name || customer.customerName || ''
    setInvoice(prev => ({
      ...prev,
      customerId: customer._id || customer.id || '',
      customerName: name
    }))
    setCustomerSearch(name)
    setShowCustomerDropdown(false)
  }, [])

  // ----- Item handlers -----
  const handleItemChange = useCallback((index, field, value) => {
    setItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }, [])

  const handleProductSelect = useCallback((index, productId) => {
    const product = products.find(p => (p._id || p.id) === productId)
    if (!product) return

    setItems(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        productId: product._id || product.id || '',
        productName: product.productName || '',
        sku: product.sku || '',
        unitPrice: product.sellingPrice || 0,
        vatRate: product.vatRate ?? DEFAULT_VAT_RATE
      }
      return updated
    })
  }, [products])

  const addLineItem = useCallback(() => {
    setItems(prev => [...prev, { ...EMPTY_ITEM }])
  }, [])

  const removeLineItem = useCallback((index) => {
    setItems(prev => {
      if (prev.length <= 1) {
        toast.error('Invoice must have at least one line item')
        return prev
      }
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // ----- Calculations -----
  const calculations = useMemo(() => {
    const itemCalcsBase = items.map(item => {
      const quantity = parseFloat(item.quantity) || 0
      const unitPrice = parseFloat(item.unitPrice) || 0
      const vatRate = parseFloat(item.vatRate) || 0
      const rawDiscountValue = parseFloat(item.discountValue) || 0
      const discountValue = item.discountType === 'percentage'
        ? Math.min(100, Math.max(0, rawDiscountValue))
        : Math.max(0, rawDiscountValue)

      const baseAmount = quantity * unitPrice
      const discountAmount = item.discountType === 'percentage'
        ? baseAmount * (discountValue / 100)
        : discountValue
      const afterDiscount = Math.max(0, baseAmount - discountAmount)

      return {
        baseAmount,
        discountAmount,
        afterDiscount,
        vatRate,
        discountValue
      }
    })

    const subtotal = itemCalcsBase.reduce((sum, c) => sum + c.baseAmount, 0)
    const totalItemDiscount = itemCalcsBase.reduce((sum, c) => sum + c.discountAmount, 0)
    const netAfterItemDiscount = Math.max(0, subtotal - totalItemDiscount)

    const totalVatStandard = invoice.withoutVat
      ? 0
      : itemCalcsBase.reduce((sum, c) => sum + (c.afterDiscount * (c.vatRate / 100)), 0)

    const afterItemsStandard = netAfterItemDiscount + totalVatStandard

    let overallDiscountAmount = 0
    const odValue = parseFloat(invoice.overallDiscountValue) || 0
    const discountBase = invoice.vatDiscountMode?.startsWith('before_vat')
      ? netAfterItemDiscount
      : afterItemsStandard

    if (invoice.overallDiscountType === 'percentage') {
      const pct = Math.min(100, Math.max(0, odValue))
      overallDiscountAmount = discountBase * (pct / 100)
    } else if (invoice.overallDiscountType === 'flat') {
      overallDiscountAmount = Math.max(0, odValue)
    }
    overallDiscountAmount = Math.min(discountBase, overallDiscountAmount)

    let totalVat = totalVatStandard
    let grandTotal = Math.max(0, afterItemsStandard - overallDiscountAmount)
    let itemCalcs = []

    const mode = invoice.vatDiscountMode || 'after_vat_no_prorate'
    const sumAfterDiscount = itemCalcsBase.reduce((sum, c) => sum + c.afterDiscount, 0)

    if (mode === 'before_vat_prorate') {
      itemCalcs = itemCalcsBase.map((c) => {
        const share = sumAfterDiscount > 0 ? c.afterDiscount / sumAfterDiscount : 0
        const lineOverallDiscount = overallDiscountAmount * share
        const taxable = Math.max(0, c.afterDiscount - lineOverallDiscount)
        const vatAmount = invoice.withoutVat ? 0 : taxable * (c.vatRate / 100)
        const lineTotal = taxable + vatAmount
        return { ...c, vatAmount, lineTotal }
      })
      totalVat = itemCalcs.reduce((sum, c) => sum + c.vatAmount, 0)
      grandTotal = itemCalcs.reduce((sum, c) => sum + c.lineTotal, 0)
    } else if (mode === 'before_vat_no_prorate') {
      const discountedNet = Math.max(0, netAfterItemDiscount - overallDiscountAmount)
      const weightedVatNumerator = itemCalcsBase.reduce((sum, c) => sum + (c.afterDiscount * c.vatRate), 0)
      const avgVatRate = sumAfterDiscount > 0 ? weightedVatNumerator / sumAfterDiscount : 0
      totalVat = invoice.withoutVat ? 0 : discountedNet * (avgVatRate / 100)
      grandTotal = discountedNet + totalVat
      itemCalcs = itemCalcsBase.map((c) => {
        const vatAmount = invoice.withoutVat ? 0 : c.afterDiscount * (c.vatRate / 100)
        const lineTotal = c.afterDiscount + vatAmount
        return { ...c, vatAmount, lineTotal }
      })
    } else if (mode === 'after_vat_prorate') {
      itemCalcs = itemCalcsBase.map((c) => {
        const vatAmount = invoice.withoutVat ? 0 : c.afterDiscount * (c.vatRate / 100)
        const lineTotalStandard = c.afterDiscount + vatAmount
        return { ...c, vatAmount, lineTotalStandard }
      })
      const totalLines = itemCalcs.reduce((sum, c) => sum + c.lineTotalStandard, 0)
      itemCalcs = itemCalcs.map((c) => {
        const share = totalLines > 0 ? c.lineTotalStandard / totalLines : 0
        const lineOverallDiscount = overallDiscountAmount * share
        const lineTotal = Math.max(0, c.lineTotalStandard - lineOverallDiscount)
        return { ...c, lineTotal }
      })
      totalVat = totalVatStandard
      grandTotal = itemCalcs.reduce((sum, c) => sum + c.lineTotal, 0)
    } else {
      itemCalcs = itemCalcsBase.map((c) => {
        const vatAmount = invoice.withoutVat ? 0 : c.afterDiscount * (c.vatRate / 100)
        const lineTotal = c.afterDiscount + vatAmount
        return { ...c, vatAmount, lineTotal }
      })
    }

    return {
      itemCalcs,
      subtotal,
      totalItemDiscount,
      totalVat,
      afterItems: afterItemsStandard,
      overallDiscountAmount,
      grandTotal
    }
  }, [items, invoice.vatDiscountMode, invoice.withoutVat, invoice.overallDiscountType, invoice.overallDiscountValue])

  // ----- Format currency -----
  const formatCurrency = (value) => {
    return formatCurrencyNpr(value, { symbol: false })
  }

  // ----- Submit handler -----
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!invoice.customerId && !invoice.customerName) {
      toast.error('Please select a customer')
      return
    }

    const hasValidItem = items.some(item => item.productName && item.quantity > 0)
    if (!hasValidItem) {
      toast.error('Please add at least one valid line item')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...invoice,
        items: items.map((item, index) => ({
          ...item,
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          vatRate: parseFloat(item.vatRate) || 0,
          discountValue: calculations.itemCalcs[index].discountValue,
          discountAmount: calculations.itemCalcs[index].discountAmount,
          vatAmount: calculations.itemCalcs[index].vatAmount,
          lineTotal: calculations.itemCalcs[index].lineTotal
        })),
        subtotal: calculations.subtotal,
        totalItemDiscount: calculations.totalItemDiscount,
        totalVat: calculations.totalVat,
        overallDiscountAmount: calculations.overallDiscountAmount,
        grandTotal: calculations.grandTotal
      }

      if (isEditMode) {
        await api.put(`/invoices/${id}`, payload)
        toast.success('Invoice updated successfully')
      } else {
        await api.post('/invoices', payload)
        toast.success('Invoice created successfully')
      }

      navigate('/invoices')
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast.error(error.response?.data?.message || 'Failed to save invoice')
    } finally {
      setSaving(false)
    }
  }

  // ----- Loading state -----
  if (loading) {
    return (
      <div className="lg:ml-64 p-8 min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">
            {isEditMode ? 'Loading invoice...' : 'Preparing form...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:ml-64 p-8 min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-amber-50">
      {/* ========== Header ========== */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-4 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Invoices</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-serif tracking-tight">
              {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update the invoice details below' : 'Fill in the details to generate a new invoice'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* ========== Main Form Column ========== */}
          <div className="xl:col-span-2 space-y-6">

            {/* ------ Customer Section ------ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                <h2 className="text-lg font-semibold text-emerald-900 font-serif tracking-wide flex items-center gap-2">
                  <Search className="w-5 h-5 text-emerald-600" />
                  Customer Details
                </h2>
              </div>
              <div className="p-6">
                <div className="relative" ref={customerDropdownRef}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        setShowCustomerDropdown(true)
                        if (!e.target.value.trim()) {
                          setInvoice(prev => ({ ...prev, customerId: '', customerName: '' }))
                        }
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Search customer by name, email, or phone..."
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border-2 border-emerald-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {filteredCustomers.map((customer) => {
                        const custId = customer._id || customer.id
                        const custName = customer.name || customer.customerName || ''
                        const custEmail = customer.email || ''
                        const custPhone = customer.phone || customer.mobile || ''
                        return (
                          <button
                            key={custId}
                            type="button"
                            onClick={() => handleSelectCustomer(customer)}
                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-gray-100 last:border-0 transition-colors"
                          >
                            <p className="font-semibold text-gray-900">{custName}</p>
                            <p className="text-sm text-gray-500">
                              {custEmail}{custEmail && custPhone ? ' | ' : ''}{custPhone}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {showCustomerDropdown && customerSearch.trim() && filteredCustomers.length === 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 text-center">
                      <p className="text-gray-500 text-sm">No customers found matching "{customerSearch}"</p>
                    </div>
                  )}
                </div>

                {invoice.customerId && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-sm text-emerald-700 font-medium">
                      Selected: {invoice.customerName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setInvoice(prev => ({ ...prev, customerId: '', customerName: '' }))
                        setCustomerSearch('')
                      }}
                      className="ml-auto text-emerald-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ------ Line Items Section ------ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-emerald-900 font-serif tracking-wide flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  Line Items
                </h2>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              <div className="p-6 space-y-4">
                {items.map((item, index) => {
                  const calc = calculations.itemCalcs[index]
                  return (
                    <div
                      key={index}
                      className="border-2 border-gray-200 rounded-xl p-5 hover:border-emerald-200 transition-colors relative group"
                    >
                      {/* Item number badge */}
                      <div className="absolute -top-3 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        #{index + 1}
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="absolute top-3 right-3 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Row 1: Product select, Quantity, Unit Price */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
                        {/* Product */}
                        <div className="md:col-span-5">
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Product
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors bg-white"
                          >
                            <option value="">-- Select Product --</option>
                            {products.map(product => (
                              <option key={product._id || product.id} value={product._id || product.id}>
                                {product.productName}{product.sku ? ` (${product.sku})` : ''} - {'\u20B9'}{product.sellingPrice}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors text-center"
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Unit Price ({'\u20B9'})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors text-right"
                          />
                        </div>

                        {/* VAT Rate */}
                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            VAT Rate (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.vatRate}
                            onChange={(e) => handleItemChange(index, 'vatRate', e.target.value)}
                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors text-center"
                          />
                        </div>
                      </div>

                      {/* Row 2: Discount, SKU, Calculated values */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
                        {/* SKU (readonly display) */}
                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            SKU
                          </label>
                          <input
                            type="text"
                            value={item.sku}
                            readOnly
                            placeholder="Auto-filled"
                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500"
                          />
                        </div>

                        {/* Discount Type */}
                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Discount Type
                          </label>
                          <select
                            value={item.discountType}
                            onChange={(e) => handleItemChange(index, 'discountType', e.target.value)}
                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors bg-white"
                          >
                            <option value="flat">Flat ({'\u20B9'})</option>
                            <option value="percentage">Percentage (%)</option>
                          </select>
                        </div>

                        {/* Discount Value */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Discount
                          </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          max={item.discountType === 'percentage' ? 100 : undefined}
                          value={item.discountValue}
                          onChange={(e) => handleItemChange(index, 'discountValue', e.target.value)}
                          className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors text-right"
                        />
                        </div>

                        {/* Calculated summary */}
                        <div className="md:col-span-4">
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Line Summary
                          </label>
                          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs space-y-0.5">
                            {calc.discountAmount > 0 && (
                              <div className="flex justify-between text-orange-600">
                                <span>Discount:</span>
                                <span>-{'\u20B9'}{formatCurrency(calc.discountAmount)}</span>
                              </div>
                            )}
                            {!invoice.withoutVat && calc.vatAmount > 0 && (
                              <div className="flex justify-between text-blue-600">
                                <span>VAT ({item.vatRate}%):</span>
                                <span>+{'\u20B9'}{formatCurrency(calc.vatAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-900 text-sm pt-1 border-t border-gray-300">
                              <span>Total:</span>
                              <span>{'\u20B9'}{formatCurrency(calc.lineTotal)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Add Item Button (bottom of list) */}
                <button
                  type="button"
                  onClick={addLineItem}
                  className="w-full py-3 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Another Line Item
                </button>
              </div>
            </div>

            {/* ------ Without VAT Toggle & Overall Discount ------ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                <h2 className="text-lg font-semibold text-emerald-900 font-serif tracking-wide flex items-center gap-2">
                  <Percent className="w-5 h-5 text-emerald-600" />
                  Tax & Discount Settings
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Without VAT toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-900">Without VAT</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Enable this to exclude VAT from all line items
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={invoice.withoutVat}
                      onChange={(e) => setInvoice(prev => ({ ...prev, withoutVat: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* VAT & Discount Mode */}
                <div>
                  <p className="font-semibold text-gray-900 mb-3">VAT & Discount Calculation</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Calculation Mode
                      </label>
                      <select
                        value={invoice.vatDiscountMode}
                        onChange={(e) => setInvoice(prev => ({ ...prev, vatDiscountMode: e.target.value }))}
                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors bg-white"
                      >
                        <option value="after_vat_no_prorate">Overall discount after VAT (no prorate)</option>
                        <option value="after_vat_prorate">Overall discount after VAT (prorate to lines)</option>
                        <option value="before_vat_no_prorate">Overall discount before VAT (no prorate)</option>
                        <option value="before_vat_prorate">Overall discount before VAT (prorate to lines)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Overall Discount */}
                <div>
                  <p className="font-semibold text-gray-900 mb-3">Overall Invoice Discount</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Discount Type
                      </label>
                      <select
                        value={invoice.overallDiscountType}
                        onChange={(e) => setInvoice(prev => ({
                          ...prev,
                          overallDiscountType: e.target.value,
                          overallDiscountValue: e.target.value === 'none' ? 0 : prev.overallDiscountValue
                        }))}
                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors bg-white"
                      >
                        <option value="none">No Discount</option>
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Flat Amount ({'\u20B9'})</option>
                      </select>
                    </div>

                    {invoice.overallDiscountType !== 'none' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {invoice.overallDiscountType === 'percentage' ? 'Discount (%)' : 'Discount Amount (\u20B9)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          max={invoice.overallDiscountType === 'percentage' ? 100 : undefined}
                          value={invoice.overallDiscountValue}
                          onChange={(e) => setInvoice(prev => ({ ...prev, overallDiscountValue: e.target.value }))}
                          className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors text-right"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ------ Additional Details ------ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                <h2 className="text-lg font-semibold text-emerald-900 font-serif tracking-wide flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Additional Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={invoice.dueDate}
                      onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Payment Method
                    </label>
                    <select
                      value={invoice.paymentMethod}
                      onChange={(e) => setInvoice(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors bg-white"
                    >
                      {PAYMENT_METHODS.map(pm => (
                        <option key={pm.value} value={pm.value}>{pm.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Status
                    </label>
                    <select
                      value={invoice.status}
                      onChange={(e) => setInvoice(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors bg-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={invoice.notes}
                    onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    placeholder="Additional notes, terms, or instructions for this invoice..."
                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========== Right Sidebar: Totals Panel ========== */}
          <div className="xl:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Totals Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-emerald-600 px-6 py-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Invoice Totals
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {'\u20B9'}{formatCurrency(calculations.subtotal)}
                    </span>
                  </div>

                  {/* Item Discounts */}
                  {calculations.totalItemDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-orange-600">Item Discounts</span>
                      <span className="text-sm font-semibold text-orange-600">
                        -{'\u20B9'}{formatCurrency(calculations.totalItemDiscount)}
                      </span>
                    </div>
                  )}

                  {/* Total VAT */}
                  {!invoice.withoutVat && calculations.totalVat > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-600">Total VAT</span>
                      <span className="text-sm font-semibold text-blue-600">
                        +{'\u20B9'}{formatCurrency(calculations.totalVat)}
                      </span>
                    </div>
                  )}

                  {/* Overall Discount */}
                  {calculations.overallDiscountAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-amber-600">
                        Overall Discount
                        {invoice.overallDiscountType === 'percentage' && (
                          <span className="text-xs ml-1">({invoice.overallDiscountValue}%)</span>
                        )}
                      </span>
                      <span className="text-sm font-semibold text-amber-600">
                        -{'\u20B9'}{formatCurrency(calculations.overallDiscountAmount)}
                      </span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t-2 border-emerald-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Grand Total</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        {'\u20B9'}{formatCurrency(calculations.grandTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Item count */}
                  <div className="text-xs text-gray-400 text-center pt-1">
                    {items.length} line item{items.length !== 1 ? 's' : ''}
                    {invoice.withoutVat && ' | VAT excluded'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-3.5 rounded-xl font-semibold text-base transition-colors shadow-lg shadow-emerald-200"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isEditMode ? 'Update Invoice' : 'Create Invoice'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/invoices')}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors border border-gray-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Cancel
                </button>
              </div>

              {/* Quick Info */}
              {invoice.status === 'draft' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800 font-medium">
                    This invoice is saved as a Draft. You can change the status to "Sent" when ready to share with the customer.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default InvoiceFormPage




