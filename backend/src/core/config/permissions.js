// All possible permissions in the system
export const ALL_PERMISSIONS = [
  // Notes
  "notes.read", "notes.create", "notes.update", "notes.delete",
  // Todos
  "todos.read", "todos.create", "todos.update", "todos.delete",
  // Accounting/Transactions
  "accounting.read", "accounting.create", "accounting.update", "accounting.delete",
  // Audit
  "audit.read",
  // Inventory
  "inventory.read", "inventory.create", "inventory.update", "inventory.delete", "inventory.adjust",
  // Customers
  "customers.read", "customers.create", "customers.update", "customers.delete",
  // Invoices
  "invoices.read", "invoices.create", "invoices.update", "invoices.delete",
  // Purchases
  "purchases.read", "purchases.create", "purchases.update", "purchases.delete", "purchases.return",
  // Reports
  "reports.read",
  // CRM
  "crm.read", "crm.create", "crm.update", "crm.delete",
  // Leads
  "leads.read", "leads.create", "leads.update", "leads.delete",
  // POS legacy module permissions
  "pos.read", "pos.create", "pos.update", "pos.delete",
  // POS resource and action permissions
  "pos.products.read", "pos.products.create", "pos.products.update", "pos.products.delete",
  "pos.customers.read", "pos.customers.create", "pos.customers.update", "pos.customers.delete",
  "pos.sales.read", "pos.sales.create", "pos.sales.update", "pos.sales.refund",
  "pos.tables.read", "pos.tables.create", "pos.tables.update", "pos.tables.delete",
  "pos.kitchen.read", "pos.kitchen.update",
  "pos.shifts.read", "pos.shifts.open", "pos.shifts.close",
  // Settings
  "settings.read", "settings.update",
  // User management
  "users.read", "users.invite", "users.update", "users.remove",
];

// Default permissions per role
export const ROLE_PERMISSIONS = {
  owner: ["*"],
  admin: ["*"],
  manager: [
    "notes.*", "todos.*", "accounting.*", "inventory.*",
    "customers.*", "invoices.*", "purchases.*", "reports.read",
    "crm.*", "leads.*", "pos.*", "audit.read", "settings.read",
    "users.read", "users.invite", "users.update",
  ],
  accountant: [
    "accounting.*", "customers.read", "customers.update",
    "invoices.read", "invoices.create", "invoices.update",
    "inventory.read", "purchases.*", "purchases.return",
    "reports.read", "crm.read", "audit.read",
  ],
  cashier: [
    "pos.read",
    "pos.sales.read", "pos.sales.create", "pos.sales.update",
    "pos.customers.read", "pos.customers.create", "pos.customers.update",
    "pos.products.read",
    "pos.tables.read", "pos.tables.update",
    "pos.shifts.read", "pos.shifts.open", "pos.shifts.close",
    "customers.read", "customers.create", "customers.update",
    "invoices.read", "invoices.create",
    "inventory.read", "reports.read",
  ],
  waiter: [
    "pos.read",
    "pos.sales.read", "pos.sales.create", "pos.sales.update",
    "pos.customers.read", "pos.customers.create",
    "pos.tables.read", "pos.tables.update",
  ],
  kitchen: [
    "pos.read",
    "pos.sales.read",
    "pos.kitchen.read", "pos.kitchen.update",
  ],
  member: [
    "notes.read", "notes.create", "notes.update",
    "todos.*",
    "accounting.read", "accounting.create",
    "inventory.read",
    "customers.read", "customers.create",
    "invoices.read", "invoices.create",
    "purchases.read",
    "reports.read",
    "crm.read", "crm.create", "crm.update",
    "leads.read", "leads.create", "leads.update",
    "pos.read", "pos.create",
  ],
  viewer: [
    "notes.read", "todos.read", "accounting.read",
    "inventory.read", "customers.read", "invoices.read",
    "purchases.read", "reports.read", "crm.read", "leads.read", "pos.read",
  ],
};

// Check if a permission matches (with wildcard support)
export function hasPermission(userPermissions, requiredPermission) {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes("*")) return true;
  if (userPermissions.includes(requiredPermission)) return true;

  const segments = String(requiredPermission || "").split(".").filter(Boolean);

  // Check progressively broader wildcards like "pos.products.*" and "pos.*"
  for (let index = segments.length - 1; index > 0; index -= 1) {
    const wildcard = `${segments.slice(0, index).join(".")}.*`;
    if (userPermissions.includes(wildcard)) return true;
  }

  // Preserve compatibility with older two-part permissions such as "pos.read"
  // when routes now check more specific nested permissions like "pos.sales.read".
  if (segments.length > 2) {
    const rootActionPermission = `${segments[0]}.${segments[segments.length - 1]}`;
    if (userPermissions.includes(rootActionPermission)) return true;
  }

  return false;
}
