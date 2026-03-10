import React, { useContext } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart2,
  CheckSquare,
  DollarSign,
  FileText,
  Kanban,
  LayoutDashboard,
  Monitor,
  Package,
  Settings,
  StickyNote,
  Users,
} from "lucide-react";
import AppContext from "../context/app-context.js";
import { getAppsForBusiness } from "../config/businessConfigs";

const TYPE_CONFIG = {
  restaurant: {
    kicker: "Restaurant Software",
    tagline: "Tables, kitchen, billing, and shift close in one restaurant workflow.",
    pills: ["Tables", "Kitchen", "Fast billing", "Daily close"],
    heroGradient: "from-amber-900 via-slate-900 to-slate-900",
    highlights: [
      {
        title: "Dining floor",
        desc: "See table status, assign orders, and split bills without jumping between screens.",
        path: "/pos/tables",
      },
      {
        title: "Kitchen flow",
        desc: "Push confirmed orders to the kitchen display and keep service moving.",
        path: "/pos/kds",
      },
      {
        title: "Fast billing",
        desc: "Open a bill, add items, collect payment, and close service quickly.",
        path: "/pos/billing",
      },
    ],
    setupSteps: [
      {
        title: "Add your menu",
        description: "Create dishes, prices, tax, and service-ready categories before opening.",
        path: "/pos/products",
      },
      {
        title: "Set up tables",
        description: "Add table numbers and zones for your dining area.",
        path: "/pos/tables",
      },
      {
        title: "Set shift rules",
        description: "Choose payment methods and daily closing rules for cashiers.",
        path: "/settings",
      },
    ],
    workflows: [
      {
        title: "Table to bill",
        description: "Seat guests, take the order, route it to the kitchen, and close the bill.",
        path: "/pos/billing",
      },
      {
        title: "Kitchen coordination",
        description: "Keep the kitchen updated with live tickets and status changes.",
        path: "/pos/kds",
      },
      {
        title: "Day closing",
        description: "Close shifts, review cash, and check the service summary.",
        path: "/pos/shifts",
      },
    ],
    primaryCTA: { label: "Start billing", path: "/pos/billing" },
    secondaryCTA: { label: "Open floor plan", path: "/pos/tables" },
  },
  cafe: {
    kicker: "Cafe Software",
    tagline: "Fast counter sales, regulars, stock, and shift close without restaurant clutter.",
    pills: ["Quick checkout", "Regulars", "Daily stock", "Shift close"],
    heroGradient: "from-teal-900 via-slate-900 to-slate-900",
    highlights: [
      {
        title: "Counter speed",
        desc: "Take orders and collect payment quickly during rush hours.",
        path: "/pos/billing",
      },
      {
        title: "Regular customers",
        desc: "Keep repeat guest profiles and simple loyalty nearby, not in a bulky sales pipeline.",
        path: "/pos/customers",
      },
      {
        title: "Daily close",
        desc: "Open and close shifts with clear totals and handover control.",
        path: "/pos/shifts",
      },
    ],
    setupSteps: [
      {
        title: "Build the menu",
        description: "Add drinks, snacks, combos, and price points before the first sale.",
        path: "/pos/products",
      },
      {
        title: "Set payment methods",
        description: "Configure cash, card, eSewa, and Khalti for the counter.",
        path: "/settings",
      },
      {
        title: "Add stock items",
        description: "Track ingredients and consumables without a large back-office setup.",
        path: "/inventory",
      },
    ],
    workflows: [
      {
        title: "Order to receipt",
        description: "Take the order, collect payment, and issue the receipt in one flow.",
        path: "/pos/billing",
      },
      {
        title: "Regular guest checkout",
        description: "Attach sales to repeat customers and reward them without slowing service.",
        path: "/pos/customers",
      },
      {
        title: "Daily summary",
        description: "Close the shift and review top items, totals, and stock needs.",
        path: "/reports",
      },
    ],
    primaryCTA: { label: "Open counter", path: "/pos/billing" },
    secondaryCTA: { label: "View regulars", path: "/pos/customers" },
  },
  shop: {
    kicker: "Shop Software",
    tagline: "Barcode billing, products, invoices, and stock control for growing shops.",
    pills: ["Billing", "Inventory", "Invoices", "Customer dues"],
    heroGradient: "from-blue-900 via-slate-900 to-slate-900",
    highlights: [
      {
        title: "Product catalog",
        desc: "Manage items, prices, and barcode-ready products from one place.",
        path: "/pos/products",
      },
      {
        title: "Invoices and dues",
        desc: "Track customer balances, invoice status, and collections cleanly.",
        path: "/invoices",
      },
      {
        title: "Stock control",
        desc: "Watch stock movement and buying needs without manual stock-sheet work.",
        path: "/inventory",
      },
    ],
    setupSteps: [
      {
        title: "Add products",
        description: "Create items with price, tax, and opening stock quantity.",
        path: "/pos/products",
      },
      {
        title: "Prepare customer accounts",
        description: "Create accounts for invoices, credit sales, and due tracking.",
        path: "/customers",
      },
      {
        title: "Set finance rules",
        description: "Configure invoices, purchases, and reporting before going live.",
        path: "/invoices",
      },
    ],
    workflows: [
      {
        title: "Sale to receipt",
        description: "Bill products quickly and keep payment records clean.",
        path: "/pos/billing",
      },
      {
        title: "Stock in to stock out",
        description: "Log purchases, watch stock levels, and plan replenishment.",
        path: "/inventory",
      },
      {
        title: "Invoice follow-up",
        description: "Review unpaid invoices and track customer collections.",
        path: "/invoices",
      },
    ],
    primaryCTA: { label: "Open checkout", path: "/pos/billing" },
    secondaryCTA: { label: "View products", path: "/pos/products" },
  },
  general: {
    kicker: "Legacy Workspace",
    tagline: "Broad access for older accounts. Switch to Restaurant, Cafe, or Shop for the cleaner Nepal-ready setup.",
    pills: ["Legacy access", "Sales", "Stock", "Finance"],
    heroGradient: "from-stone-800 via-slate-900 to-emerald-950",
    highlights: [
      {
        title: "Restaurant package",
        desc: "Tables, kitchen, billing, stock, and shift close in one operational flow.",
        path: "/settings",
      },
      {
        title: "Cafe package",
        desc: "Counter sales, regulars, stock, and day close without restaurant clutter.",
        path: "/settings",
      },
      {
        title: "Shop package",
        desc: "Billing, products, stock, invoices, and customer dues for retail counters.",
        path: "/settings",
      },
    ],
    setupSteps: [
      {
        title: "Choose your package",
        description: "Move this workspace to Restaurant, Cafe, or Shop so teams only see the work areas they need.",
        path: "/settings",
      },
      {
        title: "Trim the workspace",
        description: "Reduce extra CRM and finance surfaces that are not part of the day-to-day flow.",
        path: "/apps",
      },
      {
        title: "Go live with one main flow",
        description: "Keep the team centered on service, counter, or checkout instead of a broad suite.",
        path: "/settings",
      },
    ],
    workflows: [
      {
        title: "Restaurant flow",
        description: "Tables, kitchen, billing, stock, and shift close stay in one package.",
        path: "/settings",
      },
      {
        title: "Cafe flow",
        description: "Counter sales, repeat guests, stock, and day close stay near the till.",
        path: "/settings",
      },
      {
        title: "Shop flow",
        description: "Billing, products, invoices, and collections stay in one retail rhythm.",
        path: "/settings",
      },
    ],
    primaryCTA: { label: "Choose package", path: "/settings" },
    secondaryCTA: { label: "Browse work areas", path: "/apps" },
  },
};

const workspaceTools = [
  {
    name: "Notes",
    icon: StickyNote,
    description: "Keep SOPs, supplier notes, recipes, and store instructions nearby.",
    path: "/notes",
    permission: "notes.read",
  },
  {
    name: "Tasks",
    icon: CheckSquare,
    description: "Track buying tasks, follow-ups, and day-closing checklists across the team.",
    path: "/todos",
    permission: "todos.read",
  },
];

const accentTone = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
};

const moduleIcons = {
  pos: Monitor,
  sales: DollarSign,
  menu: FileText,
  products: Package,
  guests: Users,
  regulars: Users,
  customers: Users,
  stock: Package,
  inventory: Package,
  backoffice: BarChart2,
  finance: DollarSign,
  accounting: DollarSign,
  crm: Kanban,
  settings: Settings,
};

const SuiteHomePage = () => {
  const { currentOrgName, userData, hasPermission, orgBusinessType } = useContext(AppContext);

  const businessType = orgBusinessType || "general";
  const config = TYPE_CONFIG[businessType] || TYPE_CONFIG.general;
  const isLegacyWorkspace = businessType === "general";

  const apps = getAppsForBusiness(businessType);
  const visibleModules = apps.filter(
    (app) => app.id !== "overview" && app.id !== "settings" && (!app.permission || hasPermission(app.permission))
  );
  const visibleWorkspaceTools = workspaceTools.filter(
    (tool) => !tool.permission || hasPermission(tool.permission)
  );

  return (
    <div className="page-shell">
      <section className={`panel relative overflow-hidden bg-gradient-to-br ${config.heroGradient} p-6 text-white sm:p-8`}>
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-white/5 to-transparent lg:block" />
        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{config.kicker}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {config.tagline}
            </h1>
            <div className="mt-5 flex flex-wrap gap-2">
              {config.pills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[28rem]">
            <Link to={config.primaryCTA.path} className="rounded-3xl bg-white px-5 py-4 transition hover:bg-white/90">
              <p className="text-sm font-semibold text-slate-900">{config.primaryCTA.label}</p>
              <p className="mt-1 text-xs text-slate-500">Jump into the main daily workflow.</p>
            </Link>
            <Link
              to={config.secondaryCTA.path}
              className="rounded-3xl border border-white/20 bg-white/10 px-5 py-4 transition hover:bg-white/15"
            >
              <p className="text-sm font-semibold text-white">{config.secondaryCTA.label}</p>
              <p className="mt-1 text-xs text-white/60">Open the next most-used area.</p>
            </Link>
            <div className="rounded-3xl border border-white/20 bg-white/5 p-5 sm:col-span-2">
              <p className="text-xs text-white/50">Active workspace</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-lg font-semibold text-white">{currentOrgName || "My Business"}</p>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">
                  {userData?.username || "Operator"}
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/70">
                  {config.kicker}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isLegacyWorkspace && (
        <section className="panel border-amber-200 bg-amber-50/90 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">Legacy workspace detected</p>
              <p className="mt-1 text-sm leading-6 text-amber-700">
                Restaurant, Cafe, and Shop match the Nepal market better and remove work areas your team does not need every day.
              </p>
            </div>
            <Link
              to="/settings"
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-amber-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              Choose software
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-3">
        {config.highlights.map((item) => (
          <Link key={item.title} to={item.path} className="group panel p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              Open
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </section>

      {visibleModules.length > 0 && (
        <section className="panel p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Work Areas</p>
              <h2 className="mt-2 section-heading">
                {isLegacyWorkspace ? "Only keep the work areas you still need until this workspace is focused." : "Only the work areas that fit this business package."}
              </h2>
            </div>
            <Link to={isLegacyWorkspace ? "/settings" : "/apps"} className="text-sm font-semibold text-slate-900">
              {isLegacyWorkspace ? "Choose package" : "See all work areas"}
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleModules.map((module) => {
              const Icon = module.icon || moduleIcons[module.id] || LayoutDashboard;
              const tone = accentTone[module.accent] || accentTone.slate;
              const visibleMenu = module.menu.filter((item) => !item.permission || hasPermission(item.permission));

              return (
                <Link
                  key={module.id}
                  to={module.basePath}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className={`inline-flex rounded-2xl border px-3 py-3 ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{module.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {visibleMenu.slice(0, 3).map((item) => (
                      <span key={item.path} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {item.label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Open area
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="panel p-6">
          <p className="section-kicker">Setup Steps</p>
          <h2 className="mt-2 section-heading">
            {isLegacyWorkspace ? "Use these steps to move this workspace into a focused setup." : "Complete these before your first live transaction."}
          </h2>
          <div className="mt-6 space-y-4">
            {config.setupSteps.map((item, index) => (
              <div key={item.title} className="flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  <Link to={item.path} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Configure now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <p className="section-kicker">{isLegacyWorkspace ? "Focused Packages" : "Key Workflows"}</p>
          <h2 className="mt-2 section-heading">
            {isLegacyWorkspace ? "The Nepal-first operating patterns available once this workspace is focused." : "The operating patterns this software is built around."}
          </h2>
          <div className="mt-6 space-y-4">
            {config.workflows.map((card) => (
              <Link
                key={card.title}
                to={card.path}
                className="group flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {visibleWorkspaceTools.length > 0 && (
        <section className="panel p-6">
          <p className="section-kicker">Workspace Tools</p>
          <h2 className="mt-2 section-heading">Supporting tools that stay nearby without taking over the main business flow.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {visibleWorkspaceTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.name}
                  to={tool.path}
                  className="group flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <Icon className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{tool.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default SuiteHomePage;
