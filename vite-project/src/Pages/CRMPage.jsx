import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  Plus,
  Search,
  GripVertical,
  DollarSign,
  Phone,
  Mail,
  Building2,
  X,
  ChevronDown,
  Trash2,
  ArrowRightLeft,
} from 'lucide-react'
import api from '../lib/api.js'
import { formatShortCurrencyNpr } from '../utils/nepal.js'

const STAGES = [
  { key: 'new', label: 'New', color: 'bg-blue-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { key: 'qualified', label: 'Qualified', color: 'bg-indigo-500' },
  { key: 'proposal', label: 'Proposal', color: 'bg-purple-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { key: 'won', label: 'Won', color: 'bg-green-500' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500' },
]

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
}

const SOURCES = ['website', 'referral', 'social', 'email', 'cold_call', 'advertisement', 'other']

const CRMPage = () => {
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editLead, setEditLead] = useState(null)
  const [draggedLead, setDraggedLead] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    try {
      const { data } = await api.get('/crm')
      setLeads(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to fetch leads')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/crm/stats')
      setStats(data)
    } catch {
      setStats(null)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
    fetchStats()
  }, [fetchLeads, fetchStats])

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', lead._id)
  }

  const handleDragOver = (e, stageKey) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stageKey)
  }

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = async (e, stageKey) => {
    e.preventDefault()
    setDragOverStage(null)
    if (!draggedLead || draggedLead.stage === stageKey) {
      setDraggedLead(null)
      return
    }

    setLeads((prev) => prev.map((lead) => (
      lead._id === draggedLead._id ? { ...lead, stage: stageKey } : lead
    )))

    try {
      await api.patch(`/crm/${draggedLead._id}/stage`, { stage: stageKey })
      fetchStats()
    } catch {
      toast.error('Failed to move lead')
      fetchLeads()
    }

    setDraggedLead(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return

    try {
      await api.delete(`/crm/${id}`)
      setLeads((prev) => prev.filter((lead) => lead._id !== id))
      fetchStats()
      toast.success('Lead deleted')
    } catch {
      toast.error('Failed to delete lead')
    }
  }

  const handleConvert = async (id) => {
    try {
      const { data } = await api.post(`/crm/${id}/convert`)
      if (data.success) {
        toast.success('Lead converted to customer')
        fetchLeads()
        fetchStats()
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Conversion failed')
    }
  }

  const filteredLeads = search
    ? leads.filter((lead) => (
      lead.name.toLowerCase().includes(search.toLowerCase())
      || lead.company?.toLowerCase().includes(search.toLowerCase())
      || lead.email?.toLowerCase().includes(search.toLowerCase())
    ))
    : leads

  const getStageLeads = (stageKey) => filteredLeads.filter((lead) => lead.stage === stageKey)

  return (
    <div className="lg:ml-64 mt-16 min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CRM Pipeline</h1>
            {stats && (
              <p className="mt-1 text-sm text-gray-500">
                {stats.total} leads | Expected: {formatShortCurrencyNpr(stats.totalExpectedRevenue)} | Weighted: {formatShortCurrencyNpr(Math.round(stats.weightedRevenue || 0))}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => {
                setEditLead(null)
                setShowForm(true)
              }}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Add Lead
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <div className="flex min-w-max gap-4">
          {STAGES.map((stage) => {
            const stageLeads = getStageLeads(stage.key)
            const stageRevenue = stageLeads.reduce((sum, lead) => sum + (lead.expectedRevenue || 0), 0)

            return (
              <div
                key={stage.key}
                className={`w-72 flex-shrink-0 rounded-xl transition-all ${dragOverStage === stage.key ? 'bg-indigo-50/50 ring-2 ring-indigo-400' : 'bg-gray-100'}`}
                onDragOver={(e) => handleDragOver(e, stage.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                <div className="border-b border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                      <span className="text-sm font-semibold text-gray-700">{stage.label}</span>
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">{stageLeads.length}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatShortCurrencyNpr(stageRevenue)}</span>
                  </div>
                </div>

                <div className="max-h-[calc(100vh-280px)] min-h-[200px] space-y-2 overflow-y-auto p-2">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent" />
                    </div>
                  ) : stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      {dragOverStage === stage.key ? 'Drop here' : 'No leads'}
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        className={`group cursor-grab rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-md active:cursor-grabbing ${draggedLead?._id === lead._id ? 'scale-95 opacity-50' : ''}`}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex items-center gap-1">
                            <GripVertical className="h-3 w-3 text-gray-300" />
                            <h3 className="line-clamp-1 text-sm font-semibold text-gray-800">{lead.name}</h3>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => {
                                setEditLead(lead)
                                setShowForm(true)
                              }}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(lead._id)}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {lead.company && (
                          <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                            <Building2 className="h-3 w-3" /> {lead.company}
                          </div>
                        )}

                        {lead.expectedRevenue > 0 && (
                          <div className="mb-2 flex items-center gap-1 text-xs font-medium text-green-600">
                            <DollarSign className="h-3 w-3" /> {formatShortCurrencyNpr(lead.expectedRevenue)}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[lead.priority]}`}>
                            {lead.priority}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-200">
                              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${lead.probability}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-400">{lead.probability}%</span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2 border-t border-gray-100 pt-2">
                          {lead.email && <Mail className="h-3 w-3 text-gray-400" />}
                          {lead.phone && <Phone className="h-3 w-3 text-gray-400" />}
                          {stage.key !== 'won' && stage.key !== 'lost' && !lead.customerId && (
                            <button
                              onClick={() => handleConvert(lead._id)}
                              className="ml-auto flex items-center gap-1 text-[10px] font-medium text-indigo-500 hover:text-indigo-700"
                            >
                              <ArrowRightLeft className="h-3 w-3" /> Convert
                            </button>
                          )}
                          {lead.customerId && (
                            <span className="ml-auto text-[10px] font-medium text-green-600">Converted</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showForm && (
        <LeadFormModal
          lead={editLead}
          onClose={() => {
            setShowForm(false)
            setEditLead(null)
          }}
          onSaved={() => {
            fetchLeads()
            fetchStats()
            setShowForm(false)
            setEditLead(null)
          }}
        />
      )}
    </div>
  )
}

const LeadFormModal = ({ lead, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company: lead?.company || '',
    stage: lead?.stage || 'new',
    expectedRevenue: lead?.expectedRevenue || 0,
    probability: lead?.probability || 10,
    source: lead?.source || 'other',
    priority: lead?.priority || 'medium',
    tags: lead?.tags?.join(', ') || '',
    notes: lead?.notes || '',
    nextFollowUp: lead?.nextFollowUp ? new Date(lead.nextFollowUp).toISOString().split('T')[0] : '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        expectedRevenue: Number(form.expectedRevenue) || 0,
        probability: Number(form.probability) || 10,
        tags: form.tags ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
        nextFollowUp: form.nextFollowUp || null,
      }

      if (lead) {
        await api.put(`/crm/${lead._id}`, payload)
        toast.success('Lead updated')
      } else {
        await api.post('/crm', payload)
        toast.success('Lead created')
      }

      onSaved()
    } catch {
      toast.error('Failed to save lead')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900">{lead ? 'Edit Lead' : 'New Lead'}</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Company</label>
              <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Stage</label>
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                {STAGES.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Expected Revenue (NPR)</label>
              <input type="number" value={form.expectedRevenue} onChange={(e) => setForm({ ...form, expectedRevenue: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" min="0" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Probability (%)</label>
              <input type="number" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" min="0" max="100" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                {SOURCES.map((source) => <option key={source} value={source}>{source.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Next Follow-Up</label>
              <input type="date" value={form.nextFollowUp} onChange={(e) => setForm({ ...form, nextFollowUp: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Tags (comma separated)</label>
              <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. restaurant, wholesale, follow-up" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : lead ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CRMPage
