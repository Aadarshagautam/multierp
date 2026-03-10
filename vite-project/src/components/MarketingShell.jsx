import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const navItems = [
  { label: 'Software', href: '/#products' },
  { label: 'Roles', href: '/#roles' },
  { label: 'Branches', href: '/#branches' },
]

const MarketingShell = ({ children }) => {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(196,106,27,0.12),_transparent_30%),linear-gradient(180deg,_#fffaf2_0%,_#f7f3ea_100%)] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-amber-600 text-sm font-semibold text-white shadow-sm">
              CO
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">CommerceOS</p>
              <p className="text-xs text-slate-500">Nepal-first software for restaurant, cafe, and shop teams</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            {navItems.map(item => (
              <a key={item.href} href={item.href} className="transition hover:text-slate-900">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="rounded-2xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-stone-100 hover:text-slate-900">
              Log in
            </Link>
            <a href="/#products" className="rounded-2xl bg-gradient-to-r from-emerald-950 to-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95">
              Buy software
            </a>
          </div>

          <button
            className="rounded-2xl border border-slate-200 p-2 text-slate-600 md:hidden"
            onClick={() => setNavOpen(open => !open)}
          >
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {navOpen && (
          <div className="border-t border-slate-200 px-4 pb-4 md:hidden">
            <div className="space-y-1 pt-3">
              {navItems.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="mt-3 grid gap-2">
              <Link
                to="/login"
                onClick={() => setNavOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Log in
              </Link>
              <a
                href="/#products"
                onClick={() => setNavOpen(false)}
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Buy software
              </a>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-center sm:px-6 lg:flex-row lg:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-teal-600 text-xs font-semibold text-white">
              CO
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">CommerceOS</p>
              <p className="text-xs text-slate-500">Built around NPR, 13% VAT, eSewa, Khalti, and branch-led Nepal operations</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
            <a href="/#products" className="transition hover:text-slate-900">Software</a>
            <a href="/#roles" className="transition hover:text-slate-900">Roles</a>
            <a href="/#branches" className="transition hover:text-slate-900">Branches</a>
            <Link to="/login" className="transition hover:text-slate-900">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MarketingShell
