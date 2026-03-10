// All possible permissions in the system
export const ALL_PERMISSIONS = [
  // Notes
  "notes.read", "notes.create", "notes.update", "notes.delete",
  // Todos
  "todos.read", "todos.create", "todos.update", "todos.delete",
  // Accounting/Transactions
  "accounting.read", "accounting.create", "accounting.update", "accounting.delete",
  // Inventory
  "inventory.read", "inventory.create", "inventory.update", "inventory.delete",
  // Customers
  "customers.read", "customers.create", "customers.update", "customers.delete",
  // Invoices
  "invoices.read", "invoices.create", "invoices.update", "invoices.delete",
  // Purchases
  "purchases.read", "purchases.create", "purchases.update", "purchases.delete",
  // Reports
  "reports.read",
  // CRM
  "crm.read", "crm.create", "crm.update", "crm.delete",
  // Leads
  "leads.read", "leads.create", "leads.update", "leads.delete",
  // POS
  "pos.read", "pos.create", "pos.update", "pos.delete",
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
    "crm.*", "leads.*", "pos.*", "settings.read", "users.read",
  ],
  accountant: [
    "accounting.*", "customers.read", "customers.update",
    "invoices.read", "invoices.create", "invoices.update",
    "inventory.read", "purchases.*", "reports.read", "crm.read",
  ],
  cashier: [
    "pos.read", "pos.create", "pos.update",
    "customers.read", "customers.create", "customers.update",
    "invoices.read", "invoices.create",
    "inventory.read", "reports.read",
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
  // Check module-level wildcards like "inventory.*"
  const [module] = requiredPermission.split(".");
  if (userPermissions.includes(`${module}.*`)) return true;
  return false;
}
