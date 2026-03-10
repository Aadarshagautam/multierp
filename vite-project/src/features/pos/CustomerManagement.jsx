import React, { useContext, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit3, Plus, Search, Trash2, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { posCustomerApi } from '../../api/posApi'
import { getBusinessPosMeta } from '../../config/businessConfigs.js'
import AppContext from '../../context/app-context.js'

const TIER_CONFIG = {
  bronze: { label: 'Bronze', bg: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  silver: { label: 'Silver', bg: 'bg-gray-200 text-gray-700', dot: 'bg-gray-400' },
  gold: { label: 'Gold', bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  platinum: { label: 'Platinum', bg: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
}

const emptyForm = { name: '', phone: '', email: '', address: '', birthday: '', notes: '' }

export default function CustomerManagement() {
  const { orgBusinessType } = useContext(AppContext)
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const posMeta = getBusinessPosMeta(orgBusinessType)

  const { data, isLoading } = useQuery({
    queryKey: ['pos-customers', search],
    queryFn: () => posCustomerApi.list({ search }),
  })

  const customers = (data?.data || []).filter(customer => !tierFilter || customer.tier === tierFilter)
  const allCustomers = data?.data || []
  const tierCounts = Object.keys(TIER_CONFIG).reduce(
    (accumulator, tier) => ({ ...accumulator, [tier]: allCustomers.filter(customer => customer.tier === tier).length }),
    {}
  )

  const closeModal = () => {
    setShowModal(false)
    setEditId(null)
    setForm(emptyForm)
  }

  const createMut = useMutation({
    mutationFn: payload => posCustomerApi.create(payload),
    onSuccess: () => {
      toast.success('Customer created')
      qc.invalidateQueries({ queryKey: ['pos-customers'] })
      closeModal()
    },
    onError: error => toast.error(error.response?.data?.message || 'Error'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data: payload }) => posCustomerApi.update(id, payload),
    onSuccess: () => {
      toast.success('Customer updated')
      qc.invalidateQueries({ queryKey: ['pos-customers'] })
      closeModal()
    },
    onError: error => toast.error(error.response?.data?.message || 'Error'),
  })

  const deleteMut = useMutation({
    mutationFn: id => posCustomerApi.delete(id),
    onSuccess: () => {
      toast.success('Customer deleted')
      qc.invalidateQueries({ queryKey: ['pos-customers'] })
    },
    onError: error => toast.error(error.response?.data?.message || 'Error'),
  })

  const openEdit = customer => {
    setEditId(customer._id)
    setForm({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      birthday: customer.birthday || '',
      notes: customer.notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = event => {
    event.preventDefault()
    if (editId) {
      updateMut.mutate({ id: editId, data: form })
      return
    }

    createMut.mutate(form)
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 pt-20 lg:pl-[17.5rem]">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{posMeta.customerTitle}</h1>
            <p className="text-sm text-gray-500">{posMeta.customerSummary}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(TIER_CONFIG).map(([tier, config]) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tierFilter === tier ? '' : tier)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                tierFilter === tier ? `${config.bg} border-current ring-2 ring-offset-1 ring-indigo-400` : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                <span className="text-xs font-medium text-gray-500">{config.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{tierCounts[tier] || 0}</p>
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Users className="mb-3 h-12 w-12" />
              <p className="text-sm">No customers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Tier</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Points</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Visits</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Total Spent</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Credit Due</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.map(customer => {
                    const tier = TIER_CONFIG[customer.tier] || TIER_CONFIG.bronze

                    return (
                      <tr key={customer._id} className="transition-colors hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-xs text-gray-400">{customer.email || customer.address || '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{customer.phone || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tier.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${tier.dot}`} />
                            {tier.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-indigo-600">{customer.loyaltyPoints || 0}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{customer.visitCount || 0}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">Rs. {(customer.totalSpent || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium ${customer.creditBalance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            Rs. {(customer.creditBalance || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEdit(customer)} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete "${customer.name}"?`)) deleteMut.mutate(customer._id)
                              }}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">{editId ? 'Edit Customer' : 'Add Customer'}</h2>
              <button onClick={closeModal} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={event => setForm({ ...form, name: event.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={event => setForm({ ...form, phone: event.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Birthday</label>
                  <input
                    type="date"
                    value={form.birthday}
                    onChange={event => setForm({ ...form, birthday: event.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={event => setForm({ ...form, email: event.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Address</label>
                <textarea
                  value={form.address}
                  onChange={event => setForm({ ...form, address: event.target.value })}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={event => setForm({ ...form, notes: event.target.value })}
                  placeholder="Preferences, notes, or follow-up details"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={closeModal} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMut.isPending || updateMut.isPending}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createMut.isPending || updateMut.isPending ? 'Saving...' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
