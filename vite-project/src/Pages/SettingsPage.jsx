import React, { useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Building2, ChefHat, GitBranch, Package, Plus, Shield, ShoppingCart } from 'lucide-react'
import StatePanel from '../components/StatePanel.jsx'
import { FieldLabel, PageHeader, WorkspacePage } from '../components/ui/ErpPrimitives.jsx'
import AppContext from '../context/app-context.js'
import { getBusinessMeta } from '../config/businessConfigs.js'
import { ASSIGNABLE_ROLE_OPTIONS, getRoleMeta } from '../config/roleMeta.js'
import api from '../lib/api.js'
import { DEFAULT_PHONE_PLACEHOLDER } from '../utils/nepal.js'

const SOFTWARE_STYLES = {
  restaurant: {
    icon: ChefHat,
    base: 'border-amber-300 bg-amber-50 text-amber-800',
    active: 'border-amber-500 bg-amber-100 ring-2 ring-amber-400',
    dot: 'bg-amber-500',
  },
  cafe: {
    icon: ShoppingCart,
    base: 'border-teal-300 bg-teal-50 text-teal-800',
    active: 'border-teal-500 bg-teal-100 ring-2 ring-teal-400',
    dot: 'bg-teal-500',
  },
  shop: {
    icon: Package,
    base: 'border-blue-300 bg-blue-50 text-blue-800',
    active: 'border-blue-500 bg-blue-100 ring-2 ring-blue-400',
    dot: 'bg-blue-500',
  },
  general: {
    icon: Building2,
    base: 'border-stone-300 bg-stone-50 text-stone-700',
    active: 'border-stone-400 bg-stone-100 ring-2 ring-stone-300',
    dot: 'bg-stone-500',
  },
}

const buildSoftwareOptions = (includeGeneral = false) =>
  ['restaurant', 'cafe', 'shop', ...(includeGeneral ? ['general'] : [])].map(value => ({
    value,
    label: getBusinessMeta(value).label,
    description: getBusinessMeta(value).settingsDescription,
    ...SOFTWARE_STYLES[value],
  }))

const SettingsPage = () => {
  const { currentOrgId, orgBusinessType, setOrgBusinessType, setCurrentOrgName, hasPermission } = useContext(AppContext)
  const [loading, setLoading] = useState(true)
  const [noOrg, setNoOrg] = useState(false)
  const [members, setMembers] = useState([])
  const [branches, setBranches] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [selectedType, setSelectedType] = useState(orgBusinessType || 'general')
  const [softwarePlan, setSoftwarePlan] = useState('single-branch')
  const [saving, setSaving] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMember, setNewMember] = useState({ username: '', email: '', password: '', role: 'cashier', branchId: '' })
  const [addingMember, setAddingMember] = useState(false)
  const [newBranch, setNewBranch] = useState({ name: '', code: '', email: '', phone: '' })
  const [addingBranch, setAddingBranch] = useState(false)
  const softwareOptions = buildSoftwareOptions(selectedType === 'general' || orgBusinessType === 'general')

  const selectedSoftware = softwareOptions.find(option => option.value === selectedType) || softwareOptions[0]

  useEffect(() => {
    if (!currentOrgId) {
      setNoOrg(true)
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const [orgRes, membersRes, branchesRes] = await Promise.all([
          api.get('/org/'),
          hasPermission('users.read') ? api.get('/org/members') : Promise.resolve(null),
          hasPermission('settings.read') ? api.get('/org/branches') : Promise.resolve(null),
        ])

        if (orgRes.data?.success) {
          const organization = orgRes.data.data
          setName(organization.name || '')
          setPhone(organization.phone || '')
          setEmail(organization.email || '')
          setSelectedType(organization.businessType || 'general')
          setSoftwarePlan(organization.softwarePlan || 'single-branch')
        } else if (orgRes.data?.message === 'No organization selected') {
          setNoOrg(true)
        }

        if (membersRes?.data?.success) setMembers(membersRes.data.data || [])
        if (branchesRes?.data?.success) setBranches(branchesRes.data.data || [])
      } catch (error) {
        if (error.response?.status === 400) {
          setNoOrg(true)
        } else {
          toast.error('Failed to load settings')
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [currentOrgId, hasPermission])

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Company name is required')

    setSaving(true)
    try {
      const { data } = await api.put('/org/', {
        name: name.trim(),
        phone,
        email,
        businessType: selectedType,
      })

      if (data.success) {
        setOrgBusinessType(selectedType)
        setCurrentOrgName(name.trim())
        toast.success('Settings saved')
      } else {
        toast.error(data.message || 'Save failed')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMember.username || !newMember.email || !newMember.role) {
      return toast.error('Username, email, and role are required')
    }

    setAddingMember(true)
    try {
      const payload = { ...newMember }
      if (!payload.branchId) delete payload.branchId
      if (!payload.password) delete payload.password

      const { data } = await api.post('/org/members', payload)
      if (data.success) {
        setMembers(prev => [...prev, data.data])
        setNewMember({ username: '', email: '', password: '', role: 'cashier', branchId: '' })
        setShowAddMember(false)
        toast.success('Team member added')
      } else {
        toast.error(data.message || 'Failed to add member')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleCreateBranch = async () => {
    if (!newBranch.name.trim()) return toast.error('Branch name is required')

    setAddingBranch(true)
    try {
      const { data } = await api.post('/org/branches', {
        name: newBranch.name.trim(),
        code: newBranch.code.trim(),
        email: newBranch.email.trim(),
        phone: newBranch.phone.trim(),
      })

      if (data.success) {
        setBranches(prev => [...prev, data.data])
        setNewBranch({ name: '', code: '', email: '', phone: '' })
        toast.success('Branch created')
      } else {
        toast.error(data.message || 'Failed to create branch')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create branch')
    } finally {
      setAddingBranch(false)
    }
  }

  const handleMemberUpdate = async (memberId, nextRole, nextBranchId) => {
    const current = members.find(member => member._id === memberId)
    if (!current) return

    const payload = {
      role: nextRole || current.role,
      branchId: typeof nextBranchId === 'string' ? nextBranchId || null : current.branchId || null,
    }

    try {
      const { data } = await api.patch(`/org/members/${memberId}/role`, payload)
      if (data.success) {
        setMembers(prev =>
          prev.map(member => {
            if (member._id !== memberId) return member

            return {
              ...member,
              role: payload.role,
              branchId: payload.branchId,
              branchName: payload.branchId ? branches.find(branch => branch._id === payload.branchId)?.name || '' : '',
            }
          })
        )
        toast.success('Member updated')
      } else {
        toast.error(data.message || 'Failed to update member')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update member')
    }
  }

  if (loading) {
    return (
      <WorkspacePage>
        <StatePanel
          tone="teal"
          title="Loading settings"
          message="Checking company details, team members, branches, and package settings for this workspace."
        />
      </WorkspacePage>
    )
  }

  if (noOrg) {
    return (
      <WorkspacePage>
        <StatePanel
          tone="amber"
          icon={Building2}
          title="No organization linked"
          message="Your account is not linked to an organization. This usually happens with legacy accounts. Please log out and register again, or contact support. Error: No organization selected (400)."
        />
      </WorkspacePage>
    )
  }

  return (
    <WorkspacePage>
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Manage the business package, company details, team access, and branches from one clear admin workspace."
        badges={[selectedSoftware.label, softwarePlan === 'multi-branch' ? 'Multi-branch' : softwarePlan === 'growth' ? 'Growth plan' : 'Single branch']}
      />

      <section className="panel p-6 sm:p-8">
        <p className="section-kicker">Business Package</p>
        <h2 className="mt-2 section-heading">Choose the package that matches your Nepal business.</h2>
        <p className="mt-2 text-sm text-slate-500">
          This controls which focused work areas and daily workflow appear across your workspace.
        </p>
        <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
          Active plan: {softwarePlan === 'multi-branch' ? 'Multi-Branch' : softwarePlan === 'growth' ? 'Growth' : 'Single Branch'}
        </div>
        {softwareOptions.some(option => option.value === 'general') && (
          <p className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
            Legacy Workspace is shown only because this organization already uses it. New Nepal-first workspaces should stay on Restaurant, Cafe, or Shop.
          </p>
        )}
        <div className={`mt-6 grid gap-4 sm:grid-cols-2 ${softwareOptions.length > 3 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
          {softwareOptions.map(option => {
            const Icon = option.icon
            const isActive = selectedType === option.value

            return (
              <button
                key={option.value}
                onClick={() => setSelectedType(option.value)}
                className={`rounded-3xl border p-5 text-left transition ${isActive ? option.active : `${option.base} hover:shadow-sm`}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-semibold">{option.label}</span>
                  {isActive && <div className={`ml-auto h-2.5 w-2.5 rounded-full ${option.dot}`} />}
                </div>
                <p className="mt-3 text-xs leading-5 opacity-80">{option.description}</p>
              </button>
            )
          })}
        </div>
        {selectedType !== orgBusinessType && (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Save to apply <strong>{selectedSoftware.label}</strong> across your workspace.
          </p>
        )}
        {selectedType === 'general' && (
          <p className="mt-4 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
            Legacy Workspace keeps broader access and more clutter. Use it only if this older workspace cannot move to Restaurant, Cafe, or Shop yet.
          </p>
        )}
      </section>

      <section className="panel p-6 sm:p-8">
        <p className="section-kicker">Company Info</p>
        <h2 className="mt-2 section-heading">Update your organization details.</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Company name</FieldLabel>
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              className="input-primary"
              placeholder="My Business"
            />
          </div>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <input
              value={phone}
              onChange={event => setPhone(event.target.value)}
              className="input-primary"
              placeholder={DEFAULT_PHONE_PLACEHOLDER}
            />
          </div>
          <div>
            <FieldLabel>Business email</FieldLabel>
            <input
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="input-primary"
              placeholder="contact@mybusiness.com"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </section>

      {hasPermission('users.read') && (
        <section className="panel p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Team Members</p>
              <h2 className="mt-2 section-heading">Manage who has access to your workspace.</h2>
            </div>
            {hasPermission('users.invite') && (
              <button
                onClick={() => setShowAddMember(previous => !previous)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" />
                Add member
              </button>
            )}
          </div>
          {showAddMember && (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-4 text-sm font-semibold text-slate-900">New team member</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Username</FieldLabel>
                  <input
                    value={newMember.username}
                    onChange={event => setNewMember(previous => ({ ...previous, username: event.target.value }))}
                    className="input-primary"
                    placeholder="John"
                  />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <input
                    value={newMember.email}
                    onChange={event => setNewMember(previous => ({ ...previous, email: event.target.value }))}
                    className="input-primary"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <FieldLabel>Password (new users only)</FieldLabel>
                  <input
                    type="password"
                    value={newMember.password}
                    onChange={event => setNewMember(previous => ({ ...previous, password: event.target.value }))}
                    className="input-primary"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div>
                  <FieldLabel>Role</FieldLabel>
                  <select
                    value={newMember.role}
                    onChange={event => setNewMember(previous => ({ ...previous, role: event.target.value }))}
                    className="input-primary"
                  >
                    {ASSIGNABLE_ROLE_OPTIONS.map(role => (
                      <option key={role} value={role}>
                        {getRoleMeta(role).label}
                      </option>
                    ))}
                  </select>
                </div>
                {branches.length > 1 && (
                  <div>
                    <FieldLabel>Branch</FieldLabel>
                    <select
                      value={newMember.branchId}
                      onChange={event => setNewMember(previous => ({ ...previous, branchId: event.target.value }))}
                      className="input-primary"
                    >
                      <option value="">Primary branch</option>
                      {branches.map(branch => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleAddMember}
                  disabled={addingMember}
                  className="btn-primary disabled:opacity-60"
                >
                  {addingMember ? 'Adding...' : 'Add member'}
                </button>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <div className="mt-5 space-y-3">
            {members.length === 0 ? (
              <p className="text-sm text-slate-500">No team members yet.</p>
            ) : (
              members.map(member => (
                <div key={member._id} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                      {member.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{member.username}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                      <p className="text-xs text-slate-400">{getRoleMeta(member.role).summary}</p>
                      {member.branchName && <p className="text-xs text-slate-400">{member.branchName}</p>}
                    </div>
                  </div>
                  {hasPermission('users.update') && member.role !== 'owner' ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={member.role}
                        onChange={event => handleMemberUpdate(member._id, event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                      >
                        {ASSIGNABLE_ROLE_OPTIONS.map(role => (
                          <option key={role} value={role}>
                            {getRoleMeta(role).label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={member.branchId || ''}
                        onChange={event => handleMemberUpdate(member._id, member.role, event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
                      >
                        <option value="">No branch</option>
                        {branches.map(branch => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      {getRoleMeta(member.role).label}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {hasPermission('settings.read') && (
        <section className="panel p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Branches</p>
              <h2 className="mt-2 section-heading">Locations running under this organization.</h2>
            </div>
            {hasPermission('settings.update') && (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                <GitBranch className="h-3.5 w-3.5" />
                {branches.length} branch{branches.length === 1 ? '' : 'es'}
              </div>
            )}
          </div>
          {hasPermission('settings.update') && (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="mb-4 text-sm font-semibold text-slate-900">Create branch</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Branch name</FieldLabel>
                  <input
                    value={newBranch.name}
                    onChange={event => setNewBranch(previous => ({ ...previous, name: event.target.value }))}
                    className="input-primary"
                    placeholder="Downtown Branch"
                  />
                </div>
                <div>
                  <FieldLabel>Code</FieldLabel>
                  <input
                    value={newBranch.code}
                    onChange={event => setNewBranch(previous => ({ ...previous, code: event.target.value }))}
                    className="input-primary"
                    placeholder="DT01"
                  />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <input
                    value={newBranch.email}
                    onChange={event => setNewBranch(previous => ({ ...previous, email: event.target.value }))}
                    className="input-primary"
                    placeholder="branch@example.com"
                  />
                </div>
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    value={newBranch.phone}
                    onChange={event => setNewBranch(previous => ({ ...previous, phone: event.target.value }))}
                    className="input-primary"
                    placeholder={DEFAULT_PHONE_PLACEHOLDER}
                  />
                </div>
              </div>
              <button
                onClick={handleCreateBranch}
                disabled={addingBranch}
                className="btn-primary mt-4 disabled:opacity-60"
              >
                <GitBranch className="h-4 w-4" />
                {addingBranch ? 'Creating...' : 'Create branch'}
              </button>
            </div>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {branches.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No branches found yet.
              </p>
            ) : (
              branches.map(branch => (
                <div key={branch._id} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="rounded-2xl bg-white p-2 shadow-sm">
                    <Shield className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{branch.name}</p>
                    {branch.code && <p className="text-xs text-slate-500">{branch.code}</p>}
                  </div>
                  {branch.isPrimary && (
                    <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Primary
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </WorkspacePage>
  )
}

export default SettingsPage
