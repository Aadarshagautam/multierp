import {
  BarChart2,
  Building2,
  ChefHat,
  Clock,
  Coffee,
  FileText,
  Package,
  Receipt,
  ShoppingCart,
  Store,
  Table2,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react";

export const staffRoles = [
  {
    key: "manager",
    name: "Manager",
    icon: Building2,
    summary: "Runs daily operations, pricing, team activity, and branch performance.",
  },
  {
    key: "accountant",
    name: "Accountant",
    icon: TrendingUp,
    summary: "Handles purchases, invoices, tax, reconciliations, and reporting.",
  },
  {
    key: "cashier",
    name: "Cashier",
    icon: ShoppingCart,
    summary: "Handles billing, payments, customer lookup, and shift closing.",
  },
];

export const softwareCatalog = [
  {
    slug: "restaurant",
    shortName: "Restaurant",
    title: "Restaurant Software",
    icon: UtensilsCrossed,
    audience: "For dine-in restaurants, food courts, and busy service floors",
    hero: "Focused restaurant software for reservations, tables, kitchen flow, billing, stock, and shift close.",
    summary:
      "Run reservations, table service, kitchen tickets, fast billing, and prep stock without shop finance screens getting in the way.",
    badge: "Focused restaurant software",
    gradient: "from-orange-500 to-red-500",
    surface: "bg-orange-50",
    soft: "bg-orange-100 text-orange-700",
    border: "border-orange-200",
    button: "bg-orange-500 hover:bg-orange-600",
    ring: "ring-orange-200",
    downloadFile: "/downloads/restaurant-software-guide.txt",
    launchPath: "/pos",
    advantages: [
      "Reservations, tables, kitchen display, and billing stay in one operator workflow.",
      "Keeps stock, shift close, and daily reporting nearby without extra back-office noise.",
      "Ready for one branch or multiple branches with role-based access.",
    ],
    modules: [
      { icon: Table2, title: "Dining floor", description: "Manage reservations, tables, and occupancy." },
      { icon: ChefHat, title: "Kitchen display", description: "Send live tickets to the kitchen and track progress." },
      { icon: ShoppingCart, title: "Fast billing", description: "Close dine-in, takeaway, and delivery orders quickly." },
      { icon: Package, title: "Prep stock", description: "Track ingredients, low stock, and buying needs." },
      { icon: Clock, title: "Shift close", description: "Open and close service with better cashier control." },
    ],
    roleHighlights: {
      manager: [
        "Watch floor load and kitchen speed",
        "Approve discounts and review branch sales",
        "Track branch performance without extra apps",
      ],
      accountant: [
        "Review supplier bills and daily summaries",
        "Monitor food cost and branch reports",
        "Close the day without a heavy accounting screen",
      ],
      cashier: [
        "Open bills fast and collect payments",
        "Move between dine-in and takeaway smoothly",
        "Open and close shifts with cash count",
      ],
    },
    branchHighlights: [
      "Keep one focused restaurant workflow across branches.",
      "Assign branch managers, accountants, and cashiers with clean access rules.",
      "Compare daily sales, stock, and service performance by branch.",
    ],
    licenseOptions: [
      {
        planKey: "single-branch",
        name: "Starter Floor",
        note: "One restaurant location",
        points: ["Tables and billing", "Kitchen display", "Shift close"],
      },
      {
        planKey: "growth",
        name: "Service Control",
        note: "One branch with stock and reporting",
        points: ["Prep stock and purchases", "Reservations", "Daily reports"],
        recommended: true,
      },
      {
        planKey: "multi-branch",
        name: "Group Control",
        note: "For restaurant chains",
        points: ["Central branch view", "Role assignment by branch", "Cross-branch reporting"],
      },
    ],
  },
  {
    slug: "cafe",
    shortName: "Cafe",
    title: "Cafe Software",
    icon: Coffee,
    audience: "For cafes, bakeries, coffee bars, and quick counter service",
    hero: "Focused cafe software for quick checkout, regulars, stock, and shift close.",
    summary:
      "Keep counter billing fast and simple. Show only the screens a cafe needs: menu, regulars, stock, and daily closing.",
    badge: "Focused cafe software",
    gradient: "from-teal-500 to-cyan-500",
    surface: "bg-teal-50",
    soft: "bg-teal-100 text-teal-700",
    border: "border-teal-200",
    button: "bg-teal-500 hover:bg-teal-600",
    ring: "ring-teal-200",
    downloadFile: "/downloads/cafe-software-guide.txt",
    launchPath: "/pos",
    advantages: [
      "Counter-first design keeps checkout quick during rush hours.",
      "Regular customer tracking stays simple instead of turning into a sales pipeline tool.",
      "Daily stock and supplier buying stay nearby without restaurant-only screens.",
    ],
    modules: [
      { icon: ShoppingCart, title: "Counter POS", description: "Take orders, collect payment, and print receipts fast." },
      { icon: Users, title: "Regulars", description: "Track repeat guests and simple loyalty balances." },
      { icon: FileText, title: "Menu setup", description: "Manage drinks, snacks, combos, and prices." },
      { icon: Package, title: "Daily stock", description: "Watch ingredients and consumables with low-stock alerts." },
      { icon: Clock, title: "Shift close", description: "Handle cashier opening, closing, and handover." },
    ],
    roleHighlights: {
      manager: [
        "Track rush-hour speed and top sellers",
        "Adjust pricing and watch repeat guest activity",
        "Compare branch performance without extra clutter",
      ],
      accountant: [
        "Review daily totals and supplier buying",
        "Track tax summaries and purchase reports",
        "Reconcile closing totals branch by branch",
      ],
      cashier: [
        "Bill quickly and apply regular-customer rewards",
        "Find customer profiles without slowing the queue",
        "Handle shift open and close cleanly",
      ],
    },
    branchHighlights: [
      "Keep each branch on the same fast counter workflow.",
      "Assign separate cashiers, managers, and accountants by branch.",
      "Compare sales, top items, and repeat visits by branch.",
    ],
    licenseOptions: [
      {
        planKey: "single-branch",
        name: "Counter",
        note: "One cafe branch",
        points: ["Fast billing", "Regular customer profiles", "Shift close"],
      },
      {
        planKey: "growth",
        name: "Daily Control",
        note: "One branch with stock and reports",
        points: ["Daily stock", "Purchases", "Branch reports"],
        recommended: true,
      },
      {
        planKey: "multi-branch",
        name: "Cafe Chain",
        note: "Multiple cafe locations",
        points: ["Branch dashboard", "Shared standards", "Central reporting"],
      },
    ],
  },
  {
    slug: "shop",
    shortName: "Shop",
    title: "Shop Software",
    icon: Store,
    audience: "For shops, mini marts, wholesalers, and general stores",
    hero: "Focused shop software for billing, stock, invoices, and customer dues.",
    summary:
      "Handle barcode-ready billing, product stock, invoices, and customer balances without kitchen, table, or service-floor tools.",
    badge: "Focused shop software",
    gradient: "from-indigo-500 to-blue-500",
    surface: "bg-indigo-50",
    soft: "bg-indigo-100 text-indigo-700",
    border: "border-indigo-200",
    button: "bg-indigo-500 hover:bg-indigo-600",
    ring: "ring-indigo-200",
    downloadFile: "/downloads/shop-software-guide.txt",
    launchPath: "/pos",
    advantages: [
      "Built around products, stock, invoices, and repeat customers.",
      "Keeps invoices, supplier buying, and stock in one flow built for shop teams.",
      "Supports branch stores with clean cashier, manager, and accountant access.",
    ],
    modules: [
      { icon: ShoppingCart, title: "Shop billing", description: "Bill products fast and keep checkout simple." },
      { icon: Package, title: "Product catalog", description: "Manage items, prices, and barcode-ready products." },
      { icon: BarChart2, title: "Stock counts", description: "Track stock movement, low stock, and replenishment." },
      { icon: Receipt, title: "Invoices and dues", description: "Issue invoices and follow unpaid customer balances." },
      { icon: TrendingUp, title: "Sales reporting", description: "Review top products, branch sales, and daily totals." },
    ],
    roleHighlights: {
      manager: [
        "Watch sales and stock turnover",
        "Approve discounts and stock adjustments",
        "Track branch performance and customer dues",
      ],
      accountant: [
        "Handle invoices, supplier buying, and payment follow-up",
        "Track receivables, expenses, and tax summaries",
        "Review reports without extra CRM tools",
      ],
      cashier: [
        "Scan or select items for billing",
        "Handle receipts and customer payments",
        "Close the counter with daily totals",
      ],
    },
    branchHighlights: [
      "Run multiple shop branches under one account.",
      "Assign branch-level users for billing, finance, and stock control.",
      "View stock, invoices, and sales per branch or across the business.",
    ],
    licenseOptions: [
      {
        planKey: "single-branch",
        name: "Starter Store",
        note: "One branch shop",
        points: ["Shop billing", "Products and stock", "Customer accounts"],
      },
      {
        planKey: "growth",
        name: "Store Control",
        note: "One branch with invoices and supplier buying",
        points: ["Invoices and dues", "Supplier buying", "Business reports"],
        recommended: true,
      },
      {
        planKey: "multi-branch",
        name: "Branch Network",
        note: "For multiple stores",
        points: ["Branch users", "Central stock view", "Group reporting"],
      },
    ],
  },
];

export const softwareBySlug = Object.fromEntries(
  softwareCatalog.map((product) => [product.slug, product])
);

export function getSoftwareSignupPath(slug, planKey = "growth") {
  const params = new URLSearchParams({
    mode: "signup",
    software: slug,
    plan: planKey,
  });

  return `/login?${params.toString()}`;
}
