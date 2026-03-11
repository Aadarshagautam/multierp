import React, { useEffect, useState } from 'react'
import {
  Building2,
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import StatePanel from '../components/StatePanel.jsx'
import {
  EmptyCard,
  FieldLabel,
  KpiCard,
  PageHeader,
  SearchField,
  SectionCard,
  WorkspacePage,
} from '../components/ui/ErpPrimitives.jsx'
import api from '../lib/api.js'
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
  notes: '',
}

const formatAddress = (address) => {
  if (!address) return ''
  const parts = [address.street, address.city, address.state, address.pincode].filter(Boolean)
  return parts.join(', ')
}

const emptyAddress = () => ({
  street: '',
  city: '',
  state: '',
  pincode: '',
  country: DEFAULT_COUNTRY,
})

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

  const handleCreateCustomer = async (event) => {
    event.preventDefault()

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
        toast.success('Customer added')
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error(error.response?.data?.message || 'Failed to add customer')
    }
  }

  const handleUpdateCustomer = async (event) => {
    event.preventDefault()

    if (!editingCustomer?.name?.trim()) {
      toast.error('Customer name is required')
      return
    }

    try {
      const res = await api.put(`/customers/${editingCustomer._id}`, editingCustomer)

      if (res.data.success) {
        const updated = res.data?.data
        if (updated) {
          setCustomers((prev) =>
            (Array.isArray(prev) ? prev : []).map((customer) =>
              customer._id === editingCustomer._id ? updated : customer
            )
          )
        }
        setEditingCustomer(null)
        toast.success('Customer updated')
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
        setCustomers((prev) => (Array.isArray(prev) ? prev.filter((customer) => customer._id !== id) : []))
        toast.success('Customer deleted')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error(error.response?.data?.message || 'Failed to delete customer')
    }
  }

  const safeCustomers = Array.isArray(customers) ? customers : []
  const filteredCustomers = safeCustomers.filter((customer) => {
    const term = searchTerm.toLowerCase()
    return (
      (customer.name || '').toLowerCase().includes(term) ||
      (customer.email || '').toLowerCase().includes(term) ||
      (customer.company || '').toLowerCase().includes(term) ||
      (customer.phone || '').toLowerCase().includes(term)
    )
  })

  const stats = {
    totalCustomers: safeCustomers.length,
    withEmail: safeCustomers.filter((customer) => customer.email && customer.email.trim() !== '').length,
    withCompany: safeCustomers.filter((customer) => customer.company && customer.company.trim() !== '').length,
    newThisMonth: safeCustomers.filter((customer) => {
      if (!customer.createdAt) return false
      const created = new Date(customer.createdAt)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length,
  }

  const activeCustomer = editingCustomer || newCustomer

  const handleFieldChange = (field, value) => {
    if (editingCustomer) {
      setEditingCustomer({ ...editingCustomer, [field]: value })
      return
    }

    setNewCustomer({ ...newCustomer, [field]: value })
  }

  const handleAddressChange = (field, value) => {
    if (editingCustomer) {
      setEditingCustomer({
        ...editingCustomer,
        address: { ...(editingCustomer.address || emptyAddress()), [field]: value },
      })
      return
    }

    setNewCustomer({
      ...newCustomer,
      address: { ...(newCustomer.address || emptyAddress()), [field]: value },
    })
  }

  const openCreateForm = () => {
    setEditingCustomer(null)
    setShowAddForm((open) => !open)
  }

  const openEditForm = (customer) => {
    setEditingCustomer({
      ...customer,
      address: customer.address || emptyAddress(),
    })
    setShowAddForm(false)
  }

  const closeForm = () => {
    setShowAddForm(false)
    setEditingCustomer(null)
    setNewCustomer({ ...initialCustomerState })
  }

  if (loading) {
    return (
      <WorkspacePage>
        <StatePanel
          title="Loading customer accounts"
          message="Collecting customer profiles, billing details, and contact records for this workspace."
          tone="teal"
        />
      </WorkspacePage>
    )
  }

  return (
    <WorkspacePage>
      <PageHeader
        eyebrow="Customer Accounts"
        title="Customer records should stay easy to search and easy to update."
        description="Keep contact details, billing information, and notes clean so shop, cafe, and restaurant teams can work without extra CRM clutter."
        badges={[`${stats.totalCustomers} accounts`, 'Nepal billing ready']}
        actions={
          <button onClick={openCreateForm} className="btn-primary">
            <Plus className="h-4 w-4" />
            {showAddForm ? 'Close form' : 'Add customer'}
          </button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} title="Total customers" value={stats.totalCustomers} detail="Customer accounts ready for billing and follow-up" tone="blue" />
        <KpiCard icon={Mail} title="With email" value={stats.withEmail} detail="Useful for invoices, reminders, and receipts" tone="teal" />
        <KpiCard icon={Building2} title="With company" value={stats.withCompany} detail="Business customers with organization details" tone="amber" />
        <KpiCard icon={UserPlus} title="New this month" value={stats.newThisMonth} detail="Recently added customer accounts" tone="emerald" />
      </section>

      <div className="erp-toolbar">
        <div className="flex-1">
          <SearchField
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by customer name, phone, email, or company..."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="erp-chip">{filteredCustomers.length} visible</span>
          <span className="erp-chip">{stats.withCompany} with company</span>
          <span className="erp-chip">{stats.withEmail} with email</span>
        </div>
      </div>

      {(showAddForm || editingCustomer) && (
        <SectionCard
          eyebrow={editingCustomer ? 'Edit Account' : 'New Account'}
          title={editingCustomer ? 'Update customer details' : 'Add a customer account'}
          description="Keep the form short and practical so owners and cashiers can capture billing details without extra training."
        >
          <form onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer} className="erp-stack">
            <div className="erp-form-grid">
              <div>
                <FieldLabel>Customer name</FieldLabel>
                <input
                  type="text"
                  value={activeCustomer.name || ''}
                  onChange={(event) => handleFieldChange('name', event.target.value)}
                  className="input-primary"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <FieldLabel optional>Email</FieldLabel>
                <input
                  type="email"
                  value={activeCustomer.email || ''}
                  onChange={(event) => handleFieldChange('email', event.target.value)}
                  className="input-primary"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <FieldLabel optional>Phone</FieldLabel>
                <input
                  type="tel"
                  value={activeCustomer.phone || ''}
                  onChange={(event) => handleFieldChange('phone', event.target.value)}
                  className="input-primary"
                  placeholder={DEFAULT_PHONE_PLACEHOLDER}
                />
              </div>

              <div>
                <FieldLabel optional>Company</FieldLabel>
                <input
                  type="text"
                  value={activeCustomer.company || ''}
                  onChange={(event) => handleFieldChange('company', event.target.value)}
                  className="input-primary"
                  placeholder="Company or trade name"
                />
              </div>

              <div>
                <FieldLabel optional>{TAX_REGISTRATION_LABEL}</FieldLabel>
                <input
                  type="text"
                  value={activeCustomer.gstin || ''}
                  onChange={(event) => handleFieldChange('gstin', event.target.value.toUpperCase())}
                  className="input-primary"
                  placeholder="PAN or VAT number"
                  maxLength={20}
                />
              </div>

              <div>
                <FieldLabel optional>Street address</FieldLabel>
                <input
                  type="text"
                  value={activeCustomer.address?.street || ''}
                  onChange={(event) => handleAddressChange('street', event.target.value)}
                  className="input-primary"
                  placeholder="Street, landmark, or area"
                />
              </div>

              <div>
                <FieldLabel optional>City / Municipality</FieldLabel>
                <input
                  type="text"
                  value={activeCustomer.address?.city || ''}
                  onChange={(event) => handleAddressChange('city', event.target.value)}
                  className="input-primary"
                  placeholder="Kathmandu"
                />
              </div>

              <div>
                <FieldLabel optional>Province</FieldLabel>
                <input
                  type="text"
                  value={activeCustomer.address?.state || ''}
                  onChange={(event) => handleAddressChange('state', event.target.value)}
                  className="input-primary"
                  placeholder="Bagmati"
                />
              </div>

              <div>
                <FieldLabel optional>Postal code</FieldLabel>
                <input
                  type="text"
                  value={activeCustomer.address?.pincode || ''}
                  onChange={(event) => handleAddressChange('pincode', event.target.value)}
                  className="input-primary"
                  placeholder="44600"
                  maxLength={10}
                />
              </div>

              <div>
                <FieldLabel optional>Country</FieldLabel>
                <input
                  type="text"
                  value={activeCustomer.address?.country || ''}
                  onChange={(event) => handleAddressChange('country', event.target.value)}
                  className="input-primary"
                  placeholder={DEFAULT_COUNTRY}
                />
              </div>

              <div className="md:col-span-2">
                <FieldLabel optional>Notes</FieldLabel>
                <textarea
                  value={activeCustomer.notes || ''}
                  onChange={(event) => handleFieldChange('notes', event.target.value)}
                  className="input-primary min-h-28 resize-y"
                  placeholder="Add context that helps billing or follow-up stay easy."
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary">
                {editingCustomer ? 'Save changes' : 'Add customer'}
              </button>
              <button type="button" onClick={closeForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard
        eyebrow="Customer List"
        title="Customer records"
        description="Desktop uses a scan-friendly ERP table. Mobile keeps the same data in simpler cards."
      >
        {filteredCustomers.length === 0 ? (
          <EmptyCard
            icon={Users}
            title="No customers found"
            message={
              searchTerm
                ? 'Try a different search term or clear the filter to see all customer accounts.'
                : 'Start by adding your first customer account so billing, dues, and repeat sales stay organized.'
            }
            action={
              !searchTerm ? (
                <button onClick={() => setShowAddForm(true)} className="btn-primary">
                  Add first customer
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="hidden md:block erp-table-shell">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Company</th>
                    <th>Address</th>
                    <th>{TAX_REGISTRATION_LABEL}</th>
                    <th>Updated</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer._id}>
                      <td>
                        <div>
                          <p className="font-semibold text-slate-900">{customer.name}</p>
                          {customer.notes ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{customer.notes}</p>
                          ) : (
                            <p className="mt-1 text-xs text-slate-400">No notes added</p>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1">
                          {customer.phone ? (
                            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-slate-700 hover:text-slate-900">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span>{customer.phone}</span>
                            </a>
                          ) : null}
                          {customer.email ? (
                            <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-slate-700 hover:text-slate-900">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate">{customer.email}</span>
                            </a>
                          ) : null}
                          {!customer.phone && !customer.email ? <span className="text-slate-400">No contact saved</span> : null}
                        </div>
                      </td>
                      <td>
                        {customer.company ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span>{customer.company}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Not set</span>
                        )}
                      </td>
                      <td>
                        {formatAddress(customer.address) ? (
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                            <span>{formatAddress(customer.address)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">No address</span>
                        )}
                      </td>
                      <td>
                        {customer.gstin ? (
                          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                            {customer.gstin}
                          </span>
                        ) : (
                          <span className="text-slate-400">Not set</span>
                        )}
                      </td>
                      <td className="text-slate-500">
                        {customer.updatedAt
                          ? new Date(customer.updatedAt).toLocaleDateString('en-NP', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '-'}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditForm(customer)}
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer._id)}
                            className="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:hidden">
              {filteredCustomers.map((customer) => (
                <div key={customer._id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{customer.name}</p>
                      {customer.company ? <p className="mt-1 text-sm text-slate-500">{customer.company}</p> : null}
                    </div>
                    <span className="erp-chip">{customer.gstin || 'No PAN/VAT'}</span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    {customer.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{customer.phone}</span>
                      </div>
                    ) : null}
                    {customer.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span>{customer.email}</span>
                      </div>
                    ) : null}
                    {formatAddress(customer.address) ? (
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                        <span>{formatAddress(customer.address)}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button onClick={() => openEditForm(customer)} className="btn-secondary flex-1 justify-center">
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button onClick={() => handleDeleteCustomer(customer._id)} className="btn-danger flex-1 justify-center">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>
    </WorkspacePage>
  )
}

export default CustomersPage
