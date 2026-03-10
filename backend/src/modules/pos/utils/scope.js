import { buildTenantFilter } from "../../../core/utils/tenant.js";

export const buildPosScopeFilter = (req) => {
  const filter = buildTenantFilter(req);

  if (req.orgId && req.membership?.branchId) {
    filter.branchId = req.membership.branchId;
  }

  return filter;
};

export const getPosBranchId = (req) => req.membership?.branchId || null;
