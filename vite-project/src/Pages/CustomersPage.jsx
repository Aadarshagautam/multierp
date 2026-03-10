import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Building2,
  Phone,
  Mail,
  MapPin,
  Search,
  Edit,
  Trash2,
  Plus
} from 'lucide-react'
import api from './lib/axios'
import toast from 'react-hot-toast'
import {
  DEFAULT_COUNTRY,
  DEFAULT_PHONE_PLACEHOLDER,
  TAX_REGISTRATION_LABEL,
} from '../utils/nepal.js'

const initialCustomerState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: { street: '', city: '', state: '', pincode: '', country: DEFAULT_COUNTRY },
  gstin: '',
  notes: ''
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newCustomer, setNewCustomer] = useState({ ...initialCustomerState })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/customers')
      const payload = res.data?.data
      setCustomers(Array.isArray(payload) ? payload : [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomer = async (e) => {
    e.preventDefault()

    if (!newCustomer.name.trim()) {
      toast.error('Customer name is required')
      return
    }

    try {
      const res = await api.post('/customers', newCustomer)

      if (res.data.success) {
        const created = res.data?.data
        setCustomers((prev) => {
          const safePrev = Array.isArray(prev) ? prev : []
          return created ? [created, ...safePrev] : safePrev
        })
        setNewCustomer({ ...initialCustomerState })
        setShowAddForm(false)
        toast.success('Customer added!')
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error(error.response?.data?.message || 'Failed to add customer')
    }
  }

  const handleUpdateCustomer = async (e) => {
    e.preventDefault()

    if (!editingCustomer.name.trim()) {
      toast.error('Customer name is required')
      return
    }

    try {
      const res = await api.put(`/customers/${editingCustomer._id}`, editingCustomer)

      if (res.data.success) {
        const updated = res.data?.data
        if (updated) {
          setCustomers((prev) => (
            (Array.isArray(prev) ? prev : []).map(c =>
              c._id === editingCustomer._id ? updated : c
            )
          ))
        }
        setEditingCustomer(null)
        toast.success('Customer updated!')
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error(error.response?.data?.message || 'Failed to update customer')
    }
  }

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Delete this customer?')) return

    try {
      const res = await api.delete(`/customers/${id}`)
      if (res.data.success) {
        setCustomers((prev) => (
          Array.isArray(prev)
            ? prev.filter(c => c._id !== id)
            : []
        ))
        toast.success('Customer deleted')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error(error.response?.data?.message || 'Failed to delete customer')
    }
  }

  const safeCustomers = Array.isArray(customers) ? customers : []
  const filteredCustomers = safeCustomers.filter(c => {
    const term = searchTerm.toLowerCase()
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.company || '').toLowerCase().includes(term) ||
      (c.phone || '').toLowerCase().includes(term)
    )
  })

  const stats = {
    totalCustomers: safeCustomers.length,
    withEmail: safeCustomers.filter(c => c.email && c.email.trim() !== '').length,
    withCompany: safeCustomers.filter(c => c.company && c.company.trim() !== '').length,
    newThisMonth: safeCustomers.filter(c => {
      if (!c.createdAt) return false
      const created = new Date(c.createdAt)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length
  }

  const handleFieldChange = (field, value) => {
    if (editingCustomer) {
      setEditingCustomer({ ...editingCustomer, [field]: value })
    } else {
      setNewCustomer({ ...newCustomer, [field]: value })
    }
  }

  const handleAddressChange = (field, value) => {
    if (editingCustomer) {
      setEditingCustomer({
        ...editingCustomer,
        address: { ...editingCustomer.address, [field]: value }
      })
    } else {
      setNewCustomer({
        ...newCustomer,
        address: { ...newCustomer.address, [field]: value }
      })
    }
  }

  const getFieldValue = (field) => {
    return editingCustomer ? (editingCustomer[field] || '') : (newCustomer[field] || '')
  }

  const getAddressValue = (field) => {
    if (editingCustomer) {
      return editingCustomer.address ? (editingCustomer.address[field] || '') : ''
    }
    return newCustomer.address[field] || ''
  }

  const formatAddress = (address) => {
    if (!address) return ''
    const parts = [address.street, address.city, address.state, address.pincode].filter(Boolean)
    return parts.join(', ')
  }

  if (loading) {
    return (
      <div className="lg:ml-64 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:ml-64 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customers</h1>
        <p className="text-gray-600">Manage customer contacts, billing details, and follow-up notes.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">With Email</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withEmail}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">With Company</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withCompany}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers, phone, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            setEditingCustomer(null)
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingCustomer) && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <form onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                <input
                  type="text"
                  value={getFieldValue('name')}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={getFieldValue('email')}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={getFieldValue('phone')}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={DEFAULT_PHONE_PLACEHOLDER}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  value={getFieldValue('company')}
                  onChange={(e) => handleFieldChange('company', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{TAX_REGISTRATION_LABEL}</label>
                <input
                  type="text"
                  value={getFieldValue('gstin')}
                  onChange={(e) => handleFieldChange('gstin', e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="PAN or VAT number"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  value={getAddressValue('street')}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Street, area, or landmark"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City / Municipality</label>
                <input
                  type="text"
                  value={getAddressValue('city')}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Kathmandu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                <input
                  type="text"
                  value={getAddressValue('state')}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Bagmati"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  value={getAddressValue('pincode')}
                  onChange={(e) => handleAddressChange('pincode', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="44600"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  value={getAddressValue('country')}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={DEFAULT_COUNTRY}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={getFieldValue('notes')}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Additional notes about this customer..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingCustomer(null)
                  setNewCustomer({ ...initialCustomerState })
                }}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try a different search term' : 'Start by adding your first customer account'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Add First Customer
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer._id}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-semibold text-sm">
                      {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                    {customer.company && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{customer.company}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => {
                      setEditingCustomer({
                        ...customer,
                        address: customer.address || { street: '', city: '', state: '', pincode: '', country: DEFAULT_COUNTRY }
                      })
                      setShowAddForm(false)
                    }}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Details */}
              <div className="space-y-2.5">
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <a
                      href={`mailto:${customer.email}`}
                      className="hover:text-indigo-600 transition-colors truncate"
                    >
                      {customer.email}
                    </a>
                  </div>
                )}

                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <a
                      href={`tel:${customer.phone}`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      {customer.phone}
                    </a>
                  </div>
                )}

                {formatAddress(customer.address) && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>{formatAddress(customer.address)}</span>
                  </div>
                )}

                {customer.gstin && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {TAX_REGISTRATION_LABEL}
                    </span>
                    <span className="font-mono text-xs">{customer.gstin}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {customer.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500 line-clamp-2">{customer.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomersPage
