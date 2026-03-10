import {
  ChefHat,
  Clock,
  DollarSign,
  FileText,
  Kanban,
  LayoutDashboard,
  LayoutGrid,
  Monitor,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  Table2,
  TrendingUp,
  Users,
} from "lucide-react";

const overviewApp = {
  id: "overview",
  name: "Overview",
  icon: LayoutDashboard,
  accent: "amber",
  basePath: "/home",
  pathPrefixes: ["/home", "/dashboard", "/apps"],
  description: "Workspace home and work area launcher.",
  menu: [
    { label: "Suite Home", path: "/home", icon: LayoutDashboard, exact: true },
    { label: "Command Center", path: "/dashboard", icon: LayoutDashboard, exact: true },
    { label: "Work Areas", path: "/apps", icon: LayoutGrid, exact: true },
  ],
};

const settingsApp = {
  id: "settings",
  name: "Settings",
  icon: Settings,
  accent: "slate",
  basePath: "/settings",
  pathPrefixes: ["/settings"],
  description: "Workspace setup and team access.",
  permission: "settings.read",
  menu: [
    { label: "Workspace", path: "/settings", icon: Settings, permission: "settings.read" },
  ],
};

const stockApp = {
  id: "stock",
  name: "Stock",
  icon: Package,
  accent: "orange",
  basePath: "/inventory",
  pathPrefixes: ["/inventory"],
  description: "Stock counts, low-stock alerts, and replenishment.",
  permission: "inventory.read",
  menu: [
    { label: "Stock Room", path: "/inventory", icon: Package, permission: "inventory.read" },
  ],
};

const crmApp = {
  id: "crm",
  name: "CRM",
  icon: Kanban,
  accent: "rose",
  basePath: "/crm",
  pathPrefixes: ["/crm"],
  description: "Lead capture, pipeline, and conversion.",
  permission: "crm.read",
  menu: [
    { label: "Pipeline", path: "/crm", icon: Kanban, exact: true, permission: "crm.read" },
  ],
};

const financeApp = {
  id: "finance",
  name: "Finance",
  icon: DollarSign,
  accent: "emerald",
  basePath: "/invoices",
  pathPrefixes: ["/invoices", "/accounting", "/reports", "/purchases"],
  description: "Invoices, purchases, and reporting.",
  permission: "invoices.read",
  menu: [
    { label: "Invoices", path: "/invoices", icon: FileText, permission: "invoices.read" },
    { label: "New Invoice", path: "/invoices/new", icon: Receipt, permission: "invoices.create" },
    { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
    { label: "Reports", path: "/reports", icon: TrendingUp, permission: "reports.read" },
  ],
};

const generalFinanceApp = {
  id: "accounting",
  name: "Finance",
  icon: DollarSign,
  accent: "emerald",
  basePath: "/accounting",
  pathPrefixes: ["/accounting", "/reports", "/purchases"],
  description: "Cash flow, purchases, and reporting.",
  permission: "accounting.read",
  menu: [
    { label: "Transactions", path: "/accounting", icon: DollarSign, permission: "accounting.read" },
    { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
    { label: "Reports", path: "/reports", icon: TrendingUp, permission: "reports.read" },
  ],
};

const restaurantConfig = [
  overviewApp,
  {
    id: "pos",
    name: "Service",
    icon: Monitor,
    accent: "teal",
    basePath: "/pos",
    pathPrefixes: ["/pos"],
    description: "Billing, reservations, KOT flow, tables, guests, and shift close.",
    permission: "pos.read",
    menu: [
      { label: "Dashboard", path: "/pos", icon: Monitor, exact: true, permission: "pos.read" },
      { label: "New Bill", path: "/pos/billing", icon: ShoppingCart, permission: "pos.create" },
      { label: "Floor Plan", path: "/pos/tables", icon: Table2, permission: "pos.read" },
      { label: "Kitchen", path: "/pos/kds", icon: ChefHat, permission: "pos.read" },
      { label: "Menu Items", path: "/pos/products", icon: Package, permission: "pos.read" },
      { label: "Guests", path: "/pos/customers", icon: Users, permission: "pos.read" },
      { label: "Shifts", path: "/pos/shifts", icon: Clock, permission: "pos.read" },
      { label: "Sales History", path: "/pos/sales", icon: Receipt, permission: "pos.read" },
    ],
  },
  {
    id: "stock",
    name: "Stock",
    icon: Package,
    accent: "emerald",
    basePath: "/inventory",
    pathPrefixes: ["/inventory", "/reports", "/purchases"],
    description: "Stock room, supplier buying, and day-close summaries for the kitchen floor.",
    permission: "inventory.read",
    menu: [
      { label: "Stock Room", path: "/inventory", icon: Package, permission: "inventory.read" },
      { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
      { label: "Reports", path: "/reports", icon: TrendingUp, permission: "reports.read" },
    ],
  },
  settingsApp,
];

const cafeConfig = [
  overviewApp,
  {
    id: "pos",
    name: "Counter",
    icon: Monitor,
    accent: "teal",
    basePath: "/pos",
    pathPrefixes: ["/pos"],
    description: "Fast billing, menu, regulars, and shift close.",
    permission: "pos.read",
    menu: [
      { label: "Dashboard", path: "/pos", icon: Monitor, exact: true, permission: "pos.read" },
      { label: "New Sale", path: "/pos/billing", icon: ShoppingCart, permission: "pos.create" },
      { label: "Menu Items", path: "/pos/products", icon: Package, permission: "pos.read" },
      { label: "Regulars", path: "/pos/customers", icon: Users, permission: "pos.read" },
      { label: "Shifts", path: "/pos/shifts", icon: Clock, permission: "pos.read" },
      { label: "Sales History", path: "/pos/sales", icon: Receipt, permission: "pos.read" },
    ],
  },
  {
    id: "stock",
    name: "Stock",
    icon: Package,
    accent: "emerald",
    basePath: "/inventory",
    pathPrefixes: ["/inventory", "/reports", "/purchases"],
    description: "Beans, ingredients, restocking, and day-close summaries without office clutter.",
    permission: "inventory.read",
    menu: [
      { label: "Stock Room", path: "/inventory", icon: Package, permission: "inventory.read" },
      { label: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "purchases.read" },
      { label: "Reports", path: "/reports", icon: TrendingUp, permission: "reports.read" },
    ],
  },
  settingsApp,
];

const shopConfig = [
  overviewApp,
  {
    id: "sales",
    name: "Sales",
    icon: Store,
    accent: "teal",
    basePath: "/pos",
    pathPrefixes: ["/pos"],
    description: "Checkout, receipts, and sales history.",
    permission: "pos.read",
    menu: [
      { label: "Dashboard", path: "/pos", icon: Monitor, exact: true, permission: "pos.read" },
      { label: "New Sale", path: "/pos/billing", icon: ShoppingCart, permission: "pos.create" },
      { label: "Sales History", path: "/pos/sales", icon: Receipt, permission: "pos.read" },
    ],
  },
  {
    id: "products",
    name: "Products",
    icon: Package,
    accent: "orange",
    basePath: "/pos/products",
    pathPrefixes: ["/pos/products"],
    description: "Product catalog, prices, and barcode-ready items.",
    permission: "pos.read",
    menu: [
      { label: "Products", path: "/pos/products", icon: Package, permission: "pos.read" },
    ],
  },
  {
    id: "customers",
    name: "Customers",
    icon: Users,
    accent: "rose",
    basePath: "/customers",
    pathPrefixes: ["/customers", "/pos/customers"],
    description: "Customer accounts, dues, and follow-up history.",
    permission: "customers.read",
    menu: [
      { label: "Customer Accounts", path: "/customers", icon: Users, permission: "customers.read" },
    ],
  },
  stockApp,
  financeApp,
  settingsApp,
];

const generalConfig = [
  overviewApp,
  {
    id: "pos",
    name: "POS",
    icon: Monitor,
    accent: "teal",
    basePath: "/pos",
    pathPrefixes: ["/pos"],
    description: "Counter billing, tables, kitchen, and shifts.",
    permission: "pos.read",
    menu: [
      { label: "Dashboard", path: "/pos", icon: Monitor, exact: true, permission: "pos.read" },
      { label: "Billing", path: "/pos/billing", icon: ShoppingCart, permission: "pos.read" },
      { label: "Floor Plan", path: "/pos/tables", icon: Table2, permission: "pos.read" },
      { label: "Kitchen", path: "/pos/kds", icon: ChefHat, permission: "pos.read" },
      { label: "Products", path: "/pos/products", icon: Package, permission: "pos.read" },
      { label: "Customers", path: "/pos/customers", icon: Users, permission: "pos.read" },
      { label: "Sales History", path: "/pos/sales", icon: Receipt, permission: "pos.read" },
      { label: "Shifts", path: "/pos/shifts", icon: Clock, permission: "pos.read" },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    icon: FileText,
    accent: "blue",
    basePath: "/invoices",
    pathPrefixes: ["/customers", "/invoices"],
    description: "Customers, invoices, and collections.",
    menu: [
      { label: "Customers", path: "/customers", icon: Users, permission: "customers.read" },
      { label: "Invoices", path: "/invoices", icon: FileText, permission: "invoices.read" },
      { label: "New Invoice", path: "/invoices/new", icon: Receipt, permission: "invoices.create" },
    ],
  },
  crmApp,
  stockApp,
  generalFinanceApp,
  settingsApp,
];

export const BUSINESS_CONFIGS = {
  restaurant: restaurantConfig,
  cafe: cafeConfig,
  shop: shopConfig,
  general: generalConfig,
};

export const BUSINESS_META = {
  restaurant: {
    label: "Restaurant",
    shortLabel: "Restaurant",
    productName: "Restaurant Software",
    workspaceSummary: "Service, reservations, KOT flow, stock, and day close for Nepali restaurants.",
    settingsDescription: "Focused restaurant workflow for tables, reservations, kitchen tickets, billing, stock, and shift close.",
    launcherDescription: "Keep service, kitchen, stock, and day close in one focused restaurant workspace.",
    commandCenterSummary: "Service, kitchen flow, stock, and closing numbers stay visible without extra suite noise.",
    statusPill: "Restaurant workflow",
    spotlightTitle: "Focused for restaurant service",
    spotlightSummary: "Tables, kitchen tickets, guest history, stock, and shift close stay in one package.",
  },
  cafe: {
    label: "Cafe",
    shortLabel: "Cafe",
    productName: "Cafe Software",
    workspaceSummary: "Counter sales, regulars, stock, and shift close for Nepali cafes.",
    settingsDescription: "Focused cafe workflow for quick checkout, repeat guests, stock, and shift close.",
    launcherDescription: "Keep counter sales, regulars, stock, and closing in one focused cafe workspace.",
    commandCenterSummary: "Counter speed, regulars, stock, and shift close stay easy to scan without office clutter.",
    statusPill: "Cafe workflow",
    spotlightTitle: "Focused for cafe counters",
    spotlightSummary: "Menu, regulars, stock, and daily close stay close to the till.",
  },
  shop: {
    label: "Shop",
    shortLabel: "Shop",
    productName: "Shop Software",
    workspaceSummary: "Billing, products, stock, invoices, and customer dues.",
    settingsDescription: "Focused shop workflow for checkout, products, stock, invoices, and customer dues.",
    launcherDescription: "Open shop work areas without restaurant floor tools or CRM clutter.",
    commandCenterSummary: "Checkout, stock, invoices, and due follow-up stay in one retail flow.",
    statusPill: "Shop workflow",
    spotlightTitle: "Focused for shop operations",
    spotlightSummary: "Billing, products, invoices, and stock control stay in one package.",
  },
  general: {
    label: "Legacy Workspace",
    shortLabel: "Legacy",
    productName: "Legacy Workspace",
    workspaceSummary: "Fallback workspace for older accounts with broader access.",
    settingsDescription: "Legacy fallback package with broader access. Restaurant, Cafe, or Shop is the cleaner Nepal-first setup.",
    launcherDescription: "Legacy fallback workspace with broader access across sales, stock, finance, and support work.",
    commandCenterSummary: "This legacy workspace still spans more areas than the focused Nepal packages.",
    statusPill: "Legacy fallback",
    spotlightTitle: "Move this workspace to a focused package",
    spotlightSummary: "Restaurant, Cafe, and Shop trim daily work down to the flows Nepali teams actually use.",
  },
};

export const BUSINESS_POS_META = {
  restaurant: {
    dashboardTitle: "Service Dashboard",
    dashboardSummary: "Tables, kitchen flow, sales, and stock stay visible during service.",
    customerTitle: "Guests",
    customerSummary: "Guest history, loyalty, and service notes stay close to the floor.",
    allowTables: true,
    allowKitchen: true,
    orderTypes: ["dine-in", "takeaway", "delivery"],
  },
  cafe: {
    dashboardTitle: "Counter Dashboard",
    dashboardSummary: "Fast checkout, regulars, stock, and shift status stay within one counter view.",
    customerTitle: "Regulars",
    customerSummary: "Repeat guests, loyalty, and quick lookup stay close to the till.",
    allowTables: false,
    allowKitchen: false,
    orderTypes: ["takeaway", "delivery"],
  },
  shop: {
    dashboardTitle: "Sales Dashboard",
    dashboardSummary: "Checkout, products, stock, and repeat customers stay within one retail flow.",
    customerTitle: "Customers",
    customerSummary: "Customer balances, loyalty, and repeat sales stay easy to manage.",
    allowTables: false,
    allowKitchen: false,
    orderTypes: ["takeaway", "delivery"],
  },
  general: {
    dashboardTitle: "Legacy POS Dashboard",
    dashboardSummary: "Billing, reservations, tables, kitchen flow, stock, and shifts still run here until the workspace is moved to a focused package.",
    customerTitle: "Customers",
    customerSummary: "Customer management, loyalty, and repeat billing stay connected to POS.",
    allowTables: true,
    allowKitchen: true,
    orderTypes: ["dine-in", "takeaway", "delivery"],
  },
};

const WORKSPACE_TOOL_PATHS = ['/notes', '/todos'];
const PATH_REDIRECT_RULES = {
  restaurant: [
    { prefixes: ['/customers'], redirectTo: '/pos/customers' },
    { prefixes: ['/accounting', '/invoices'], redirectTo: '/pos/shifts' },
    { prefixes: ['/crm'], redirectTo: '/dashboard' },
  ],
  cafe: [
    { prefixes: ['/pos/tables', '/pos/kds'], redirectTo: '/pos' },
    { prefixes: ['/customers'], redirectTo: '/pos/customers' },
    { prefixes: ['/accounting', '/invoices'], redirectTo: '/pos/shifts' },
    { prefixes: ['/crm'], redirectTo: '/dashboard' },
  ],
  shop: [
    { prefixes: ['/pos/tables', '/pos/kds'], redirectTo: '/pos' },
    { prefixes: ['/crm'], redirectTo: '/dashboard' },
  ],
};

function findRedirectRule(pathname, businessType) {
  const type = businessType || "general";
  const redirectRules = PATH_REDIRECT_RULES[type] || [];

  return redirectRules.find((rule) =>
    rule.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
  );
}

export function getAppsForBusiness(businessType) {
  return BUSINESS_CONFIGS[businessType] || generalConfig;
}

export function getBusinessMeta(businessType) {
  return BUSINESS_META[businessType] || BUSINESS_META.general;
}

export function getBusinessPosMeta(businessType) {
  return BUSINESS_POS_META[businessType] || BUSINESS_POS_META.general;
}

export function getActiveAppForBusiness(pathname, businessType) {
  const apps = getAppsForBusiness(businessType);
  return (
    apps.find((app) =>
      (app.pathPrefixes || []).some((prefix) =>
        prefix === "/"
          ? pathname === "/"
          : pathname === prefix || pathname.startsWith(prefix + "/")
      )
    ) || null
  );
}

export function isPathSupportedForBusiness(pathname, businessType) {
  if (WORKSPACE_TOOL_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))) {
    return true;
  }

  if (findRedirectRule(pathname, businessType)) {
    return false;
  }

  return getActiveAppForBusiness(pathname, businessType) !== null;
}

export function getRedirectPathForBusiness(pathname, businessType) {
  const redirectRule = findRedirectRule(pathname, businessType);

  if (redirectRule) {
    return redirectRule.redirectTo;
  }

  return "/dashboard";
}

export function isMenuItemActive(item, pathname) {
  if (item.exact) return pathname === item.path;
  if (item.path === "/") return pathname === "/";
  return pathname === item.path || pathname.startsWith(item.path + "/");
}
