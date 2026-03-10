import React, { useContext, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowRight, Building2, Check, Download } from 'lucide-react'
import AppContext from '../../context/app-context.js'
import { softwareBySlug, softwareCatalog } from '../../data/softwareCatalog.js'
import api from '../../lib/api.js'

const DEFAULT_SOFTWARE = softwareCatalog[0]?.slug || 'restaurant'

const getDefaultPlan = product =>
  product?.licenseOptions.find(option => option.recommended) || product?.licenseOptions[0]

const Login = () => {
  const {
    setIsLoggedin,
    getUserData,
    setCurrentOrgId,
    setCurrentOrgName,
  } = useContext(AppContext)
  const location = useLocation()
  const navigate = useNavigate()

  const [state, setState] = useState('Login')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    orgName: '',
    branchName: '',
    businessType: DEFAULT_SOFTWARE,
    softwarePlan: getDefaultPlan(softwareBySlug[DEFAULT_SOFTWARE])?.planKey || 'single-branch',
  })
  const [loading, setLoading] = useState(false)

  const redirectTo = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search || ''}${location.state.from.hash || ''}`
    : '/dashboard'

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const requestedMode = params.get('mode') === 'signup' ? 'Sign Up' : 'Login'
    const requestedSoftware = softwareBySlug[params.get('software')] ? params.get('software') : DEFAULT_SOFTWARE
    const product = softwareBySlug[requestedSoftware]
    const requestedPlan = product?.licenseOptions.some(option => option.planKey === params.get('plan'))
      ? params.get('plan')
      : getDefaultPlan(product)?.planKey || 'single-branch'

    setState(requestedMode)
    setFormData(prev => ({
      ...prev,
      businessType: requestedSoftware,
      softwarePlan: requestedPlan,
    }))
  }, [location.search])

  const selectedProduct = softwareBySlug[formData.businessType] || softwareBySlug[DEFAULT_SOFTWARE]
  const selectedPlan = selectedProduct?.licenseOptions.find(option => option.planKey === formData.softwarePlan)
    || getDefaultPlan(selectedProduct)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSoftwareChange = (slug) => {
    const product = softwareBySlug[slug]
    const defaultPlan = getDefaultPlan(product)

    setFormData(prev => ({
      ...prev,
      businessType: slug,
      softwarePlan: defaultPlan?.planKey || 'single-branch',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const isSignup = state === 'Sign Up'
    if (!formData.email || !formData.password || (isSignup && (!formData.username || !formData.orgName || !formData.branchName))) {
      toast.error('Please fill all required fields')
      return
    }

    setLoading(true)

    try {
      const endpoint = isSignup ? '/api/auth/register' : '/api/auth/login'
      const payload = isSignup
        ? {
            username: formData.username.trim(),
            email: formData.email.trim(),
            password: formData.password,
            orgName: formData.orgName.trim(),
            branchName: formData.branchName.trim(),
            businessType: formData.businessType,
            softwarePlan: formData.softwarePlan,
          }
        : {
            email: formData.email.trim(),
            password: formData.password,
          }

      const { data } = await api.post(endpoint.replace('/api', ''), payload)

      if (data.success) {
        setIsLoggedin(true)
        setCurrentOrgId(data.data?.orgId || null)
        setCurrentOrgName(data.data?.orgName || null)
        await getUserData()
        toast.success(isSignup ? 'Software workspace created' : 'Login successful')
        navigate(redirectTo, { replace: true })
      } else {
        toast.error(data.message || 'Request failed')
        setIsLoggedin(false)
        setCurrentOrgId(null)
        setCurrentOrgName(null)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Request failed')
      setIsLoggedin(false)
      setCurrentOrgId(null)
      setCurrentOrgName(null)
    } finally {
      setLoading(false)
    }
  }

  const isSignup = state === 'Sign Up'

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] lg:grid-cols-[1.05fr,0.95fr]">
        <div className="relative overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-10">
          <div className="absolute inset-0 opacity-80">
            <div className="absolute left-8 top-10 h-48 w-48 rounded-full bg-teal-500/25 blur-3xl" />
            <div className="absolute bottom-8 right-8 h-56 w-56 rounded-full bg-amber-500/20 blur-3xl" />
          </div>

          <div className="relative flex h-full flex-col">
            <Link to="/" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-200 transition hover:text-white">
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to software store
            </Link>

            <div className="mt-10">
              <span className={`inline-flex rounded-full px-4 py-1.5 text-xs font-semibold ${selectedProduct?.soft || 'bg-white/10 text-white'}`}>
                {selectedProduct?.badge || 'Business software'}
              </span>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                {isSignup ? `Start ${selectedProduct?.title || 'your software'}` : 'Sign in to your software'}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                {isSignup
                  ? 'Choose the software and plan, create your main branch, then start working with your accountant, manager, and cashier in the same workspace.'
                  : 'Use the same login page for restaurant, cafe, and shop software. Your account opens the package and branch assigned to you.'}
              </p>
            </div>

            {selectedProduct && (
              <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">{selectedProduct.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{selectedProduct.audience}</p>
                  </div>
                  <a
                    href={selectedProduct.downloadFile}
                    download
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                  >
                    <Download className="h-4 w-4" />
                    Guide
                  </a>
                </div>

                <div className="mt-5 space-y-3">
                  {(selectedPlan?.points || selectedProduct.advantages || []).slice(0, 3).map(item => (
                    <div key={item} className="flex gap-3 text-sm text-slate-200">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {selectedPlan && (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Selected plan</p>
                    <p className="mt-2 text-base font-semibold text-white">{selectedPlan.name}</p>
                    <p className="mt-1 text-sm text-slate-300">{selectedPlan.note}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <Building2 className="h-5 w-5 text-teal-300" />
                <p className="mt-3 text-sm font-semibold">Main branch setup</p>
                <p className="mt-2 text-sm text-slate-300">Start with one branch, then expand when your plan allows it.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <Check className="h-5 w-5 text-teal-300" />
                <p className="mt-3 text-sm font-semibold">Separate product flow</p>
                <p className="mt-2 text-sm text-slate-300">Restaurant, cafe, and shop each keep their own focused onboarding path.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <ArrowRight className="h-5 w-5 text-teal-300" />
                <p className="mt-3 text-sm font-semibold">Role-based use</p>
                <p className="mt-2 text-sm text-slate-300">Owner, manager, accountant, and cashier can all work from one account setup.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                {isSignup ? 'Buy and start' : 'Account access'}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                {isSignup ? 'Create your workspace' : 'Welcome back'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setState(isSignup ? 'Login' : 'Sign Up')}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {isSignup ? 'Login instead' : 'Buy software'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {isSignup && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Choose software</label>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {softwareCatalog.map(product => (
                      <button
                        key={product.slug}
                        type="button"
                        onClick={() => handleSoftwareChange(product.slug)}
                        className={`rounded-3xl border p-4 text-left transition ${
                          formData.businessType === product.slug
                            ? `${product.border} ${product.surface} shadow-sm`
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900">{product.shortName}</p>
                        <p className="mt-2 text-xs leading-6 text-slate-500">{product.audience}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Choose plan</label>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {selectedProduct?.licenseOptions.map(option => (
                      <button
                        key={option.planKey}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, softwarePlan: option.planKey }))}
                        className={`rounded-3xl border p-4 text-left transition ${
                          formData.softwarePlan === option.planKey
                            ? `${selectedProduct.border} ${selectedProduct.surface} shadow-sm`
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{option.name}</p>
                          {option.recommended && (
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${selectedProduct.soft}`}>
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs leading-6 text-slate-500">{option.note}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Your name</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                      placeholder="Owner or admin name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Company name</label>
                    <input
                      type="text"
                      name="orgName"
                      value={formData.orgName}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                      placeholder="Business or company name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Primary branch name</label>
                  <input
                    type="text"
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                    placeholder="Main branch, downtown branch, or head office"
                    required
                  />
                </div>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                  placeholder="owner@business.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {isSignup ? 'Password for the owner account' : 'Password'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                  placeholder={isSignup ? 'Use 8+ chars, Aa1' : 'Enter your password'}
                  required
                />
                {isSignup && (
                  <p className="mt-2 text-xs text-slate-500">
                    Use 8+ characters with uppercase, lowercase, and a number.
                  </p>
                )}
              </div>
            </div>

            {!isSignup && (
              <div className="flex justify-end">
                <Link
                  to="/reset-password"
                  className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selectedProduct?.button || 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {loading
                ? 'Please wait...'
                : isSignup
                  ? `Create ${selectedProduct?.shortName || 'software'} workspace`
                  : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
