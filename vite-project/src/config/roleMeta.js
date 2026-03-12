export const ROLE_META = {
  owner: {
    label: "Owner",
    summary: "Full business access, team control, and audit visibility.",
    tone: "amber",
  },
  manager: {
    label: "Manager",
    summary: "Daily operations, approvals, and branch oversight.",
    tone: "teal",
  },
  accountant: {
    label: "Accountant",
    summary: "Invoices, purchases, reports, and accounting controls.",
    tone: "emerald",
  },
  cashier: {
    label: "Cashier",
    summary: "Billing, customers, and cashier shift close.",
    tone: "blue",
  },
  waiter: {
    label: "Waiter",
    summary: "Table service, guest orders, and floor updates.",
    tone: "rose",
  },
  kitchen: {
    label: "Kitchen Staff",
    summary: "Kitchen tickets and order preparation flow.",
    tone: "orange",
  },
  admin: {
    label: "Legacy Admin",
    summary: "Legacy broad-access role kept for older workspaces.",
    tone: "slate",
  },
  member: {
    label: "Legacy Member",
    summary: "Legacy mixed-access role kept for older workspaces.",
    tone: "slate",
  },
  viewer: {
    label: "Legacy Viewer",
    summary: "Legacy read-only role kept for older workspaces.",
    tone: "slate",
  },
};

export const ASSIGNABLE_ROLE_OPTIONS = [
  "manager",
  "accountant",
  "cashier",
  "waiter",
  "kitchen",
  "admin",
  "member",
  "viewer",
];

export const getRoleMeta = (role) =>
  ROLE_META[role] || {
    label: role ? String(role) : "No role",
    summary: "Role information is not available for this account.",
    tone: "slate",
  };
