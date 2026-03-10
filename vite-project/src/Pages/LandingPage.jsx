import React, { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Check, Download, Shield, TrendingUp } from "lucide-react";
import MarketingShell from "../components/MarketingShell.jsx";
import AppContext from "../context/app-context.js";
import { getSoftwareSignupPath, softwareCatalog, staffRoles } from "../data/softwareCatalog.js";

const LandingPage = () => {
  const { isLoggedin, hasCheckedAuth } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasCheckedAuth && isLoggedin) {
      navigate("/dashboard", { replace: true });
    }
  }, [hasCheckedAuth, isLoggedin, navigate]);

  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute left-10 top-14 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-28">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-teal-100">
              Focused Nepal software for restaurants, cafes, and shops
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Restaurant, cafe, and shop software with only the work areas each team needs.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              CommerceOS now sells narrower product packages. Restaurant gets tables and kitchen flow.
              Cafe gets fast counter checkout and regulars. Shop gets billing, stock, invoices, and dues.
              Every product supports NPR, 13% VAT, eSewa, and Khalti.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a href="#products" className="rounded-xl bg-teal-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-400">
                Browse software
              </a>
              <Link to="/login" className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15">
                Use web version
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-3xl font-semibold text-white">3</p>
              <p className="mt-1 text-sm text-slate-300">Focused software packages instead of one crowded suite</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-3xl font-semibold text-white">NPR</p>
              <p className="mt-1 text-sm text-slate-300">Nepal currency, 13% VAT, and local payment labels</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-3xl font-semibold text-white">Role-based</p>
              <p className="mt-1 text-sm text-slate-300">Manager, accountant, and cashier each get cleaner access</p>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="section-kicker">Software Store</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Buy only the workflows your business uses every day.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Restaurant focuses on service floor and kitchen. Cafe focuses on counter speed and regulars.
              Shop focuses on products, stock, invoices, and customer dues. Each package keeps the rest out of the way.
            </p>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-3">
            {softwareCatalog.map((product) => {
              const Icon = product.icon;
              const recommendedPlan =
                product.licenseOptions.find((option) => option.recommended) || product.licenseOptions[0];

              return (
                <article key={product.slug} className={`rounded-[28px] border bg-white p-6 shadow-sm ${product.border}`}>
                  <div className={`inline-flex rounded-2xl px-3 py-1 text-xs font-semibold ${product.soft}`}>
                    {product.badge}
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <div className={`rounded-2xl bg-gradient-to-br p-4 text-white ${product.gradient}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{product.title}</h3>
                      <p className="text-sm text-slate-500">{product.audience}</p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-slate-600">{product.summary}</p>

                  <div className="mt-5 space-y-3">
                    {product.advantages.map((item) => (
                      <div key={item} className="flex gap-3 text-sm text-slate-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {product.modules.slice(0, 4).map((module) => (
                      <span key={module.title} className={`rounded-full border px-3 py-1 text-xs font-medium ${product.surface} ${product.border}`}>
                        {module.title}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 grid gap-3">
                    <Link
                      to={`/software/${product.slug}`}
                      className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold text-white transition ${product.button}`}
                    >
                      View {product.shortName} software
                    </Link>
                    <Link
                      to={getSoftwareSignupPath(product.slug, recommendedPlan.planKey)}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      Start with {recommendedPlan.name}
                    </Link>
                    <a
                      href={product.downloadFile}
                      download
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4" />
                      Download guide
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="roles" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="section-kicker">Team Access</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Separate logins for manager, accountant, and cashier.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The product stays focused, but each role still gets the access it needs for daily work.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {staffRoles.map((role) => {
              const Icon = role.icon;

              return (
                <div key={role.key} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                  <div className="w-fit rounded-2xl bg-white p-3 shadow-sm">
                    <Icon className="h-5 w-5 text-slate-900" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">{role.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{role.summary}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="branches" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-[32px] bg-gradient-to-br from-slate-900 to-teal-900 p-8 text-white sm:p-10 lg:p-14">
            <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr]">
              <div>
                <p className="section-kicker text-teal-200">Branch Ready</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Focused software packages that still scale across branches.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                  Keep the product narrow for branch teams, then compare sales, stock, and finance from one owner account
                  when you grow to multiple locations.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <Building2 className="h-5 w-5 text-teal-300" />
                    <p className="mt-4 text-sm font-semibold">Branch-level teams</p>
                    <p className="mt-2 text-sm text-slate-300">Assign access by location and keep the workflow clean.</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <Shield className="h-5 w-5 text-teal-300" />
                    <p className="mt-4 text-sm font-semibold">Focused navigation</p>
                    <p className="mt-2 text-sm text-slate-300">Restaurant, cafe, and shop teams see different work areas.</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <TrendingUp className="h-5 w-5 text-teal-300" />
                    <p className="mt-4 text-sm font-semibold">Central reporting</p>
                    <p className="mt-2 text-sm text-slate-300">Compare branches without opening extra work areas for every team.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {softwareCatalog.map((product) => (
                  <Link
                    key={product.slug}
                    to={`/software/${product.slug}`}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-white">{product.title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Keep the same focused package at one branch or many branches.
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Start with the right package, not the biggest package.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Choose the product that matches your daily work, review the guide, and start with a cleaner workspace from day one.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="#products" className="rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              Choose software
            </a>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
              Use web version
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
};

export default LandingPage;
