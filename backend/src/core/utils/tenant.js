export function buildTenantFilter(context = {}) {
  if (context.orgId) {
    return { orgId: context.orgId };
  }

  if (context.userId) {
    return { userId: context.userId };
  }

  return {};
}

export function mergeTenantFilter(context = {}, filter = {}) {
  return { ...filter, ...buildTenantFilter(context) };
}
