import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Check, Download } from 'lucide-react'
import MarketingShell from '../components/MarketingShell.jsx'
import { getSoftwareSignupPath, softwareBySlug, staffRoles } from '../data/softwareCatalog.js'

const SoftwareProductPage = () => {
  const { slug } = useParams()
  const product = softwareBySlug[slug]

  if (!product) {
    return (
      <MarketingShell>
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
          <p className="section-kicker">Software Not Found</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">This software page does not exist.</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Go back to the main software page and choose restaurant, cafe, or shop software.
          </p>
          <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            Back to software store
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </MarketingShell>
    )
  }

  const HeroIcon = product.icon
  const recommendedPlan = product.licenseOptions.find(option => option.recommended) || product.licenseOptions[0]

  return (
    <MarketingShell>
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
            <div>
              <span className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${product.soft}`}>
                {product.badge}
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                {product.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{product.hero}</p>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{product.summary}</p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to={getSoftwareSignupPath(product.slug, recommendedPlan.planKey)}
                  className={`rounded-2xl px-6 py-3.5 text-center text-sm font-semibold text-white transition ${product.button}`}
                >
                  Buy {product.shortName} software
                </Link>
                <a
                  href={product.downloadFile}
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-white"
                >
                  <Download className="h-4 w-4" />
                  Download starter guide
                </a>
                <Link
                  to="/login"
                  className="rounded-2xl border border-slate-200 px-6 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                  Use web version
                </Link>
              </div>
            </div>

            <div className={`rounded-[32px] border bg-white p-8 shadow-sm ${product.border}`}>
              <div className={`inline-flex rounded-3xl bg-gradient-to-br p-5 text-white ${product.gradient}`}>
                <HeroIcon className="h-8 w-8" />
              </div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Why buy this</p>
              <div className="mt-4 space-y-4">
                {product.advantages.map(item => (
                  <div key={item} className="flex gap-3 text-sm leading-7 text-slate-600">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="section-kicker">Work Areas</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Features included in {product.title}
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {product.modules.map(module => {
              const ModuleIcon = module.icon

              return (
                <div key={module.title} className={`rounded-[28px] border p-6 ${product.border} ${product.surface}`}>
                  <div className="rounded-2xl bg-white p-3 shadow-sm w-fit">
                    <ModuleIcon className="h-5 w-5 text-slate-900" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">{module.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{module.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="section-kicker">Role Access</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Managers, accountants, and cashiers can all use {product.shortName.toLowerCase()} software.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {staffRoles.map(role => {
              const RoleIcon = role.icon
              const roleItems = product.roleHighlights[role.key] || []

              return (
                <div key={role.key} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className={`rounded-2xl p-3 w-fit ${product.surface}`}>
                    <RoleIcon className="h-5 w-5 text-slate-900" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">{role.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{role.summary}</p>

                  <div className="mt-5 space-y-3">
                    {roleItems.map(item => (
                      <div key={item} className="flex gap-3 text-sm leading-7 text-slate-600">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className={`rounded-[32px] border p-8 sm:p-10 ${product.border} ${product.surface}`}>
            <div className="grid gap-10 lg:grid-cols-[1fr,0.9fr]">
              <div>
                <p className="section-kicker">Branch Support</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  {product.title} also supports multi-branch operations.
                </h2>
                <div className="mt-6 space-y-4">
                  {product.branchHighlights.map(item => (
                    <div key={item} className="flex gap-3 text-sm leading-7 text-slate-600">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                {product.licenseOptions.map(option => (
                  <div key={option.name} className="rounded-3xl border border-white/70 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-semibold text-slate-900">{option.name}</p>
                      {option.recommended && (
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${product.soft}`}>
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{option.note}</p>
                    <div className="mt-4 space-y-3">
                      {option.points.map(point => (
                        <div key={point} className="flex gap-3 text-sm leading-7 text-slate-600">
                          <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                    <Link
                      to={getSoftwareSignupPath(product.slug, option.planKey)}
                      className={`mt-5 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${product.button}`}
                    >
                      Choose {option.name}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Ready to buy or download {product.title.toLowerCase()}?
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Buy the software, download the guide, then sign in to start using the cloud version with your staff and branches.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to={getSoftwareSignupPath(product.slug, recommendedPlan.planKey)}
              className={`rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition ${product.button}`}
            >
              Buy {product.shortName} software
            </Link>
            <a
              href={product.downloadFile}
              download
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-white"
            >
              <Download className="h-4 w-4" />
              Download starter guide
            </a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}

export default SoftwareProductPage
