import CustomerModel from "./model.js";
import { DEFAULT_WALK_IN_NAME } from "./constants.js";
import {
  combineCustomerConditions,
  customerRepository,
  buildCustomerScopeConditions,
  getCustomerBranchId,
} from "./repository.js";
import {
  escapeRegex,
  buildCustomerSnapshot,
  computeCustomerTier,
  normalizeCustomerPayload,
  normalizePhoneDigits,
} from "./utils.js";

const createSearchClause = (search = "") => {
  const trimmed = String(search || "").trim();
  if (!trimmed) return null;

  const regex = new RegExp(escapeRegex(trimmed), "i");
  const digits = normalizePhoneDigits(trimmed);
  const clauses = [
    { name: regex },
    { email: regex },
    { company: regex },
    { taxNumber: regex },
    { notes: regex },
  ];

  if (digits) {
    clauses.push({ phoneDigits: { $regex: escapeRegex(digits) } });
  } else {
    clauses.push({ phone: regex });
  }

  return { $or: clauses };
};

const createBaseCustomerFilter = (
  context = {},
  query = {},
  options = {}
) => {
  const {
    branchMode = "all",
    includeInactive = false,
    branchId = undefined,
  } = options;
  const conditions = buildCustomerScopeConditions(context, { branchMode, branchId });

  const shouldIncludeInactive =
    includeInactive || String(query.includeInactive || "") === "true";
  if (!shouldIncludeInactive) {
    conditions.push({ isActive: true });
  }

  const customerType = query.customerType || query.type;
  if (customerType) {
    conditions.push({ customerType });
  }

  const searchClause = createSearchClause(query.search || query.q || "");
  if (searchClause) {
    conditions.push(searchClause);
  }

  return combineCustomerConditions(conditions);
};

const buildScopedCustomerData = (
  data = {},
  context = {},
  { defaultToCurrentBranch = false, source = "shared" } = {}
) => {
  const normalized = normalizeCustomerPayload(data);
  const branchId =
    normalized.branchId !== undefined
      ? normalized.branchId || null
      : defaultToCurrentBranch
        ? getCustomerBranchId(context)
        : null;

  return {
    ...normalized,
    userId: context.userId,
    orgId: context.orgId || null,
    branchId,
    createdBy: context.userId || null,
    updatedBy: context.userId || null,
    source,
  };
};

const buildScopedCustomerUpdates = (data = {}, context = {}) => {
  const normalized = normalizeCustomerPayload(data, { partial: true });
  const updates = Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(updates).length === 0) {
    return updates;
  }

  return {
    ...updates,
    updatedBy: context.userId || null,
  };
};

export const sharedCustomerService = {
  async create(data, context, options = {}) {
    const customer = customerRepository.create(
      buildScopedCustomerData(data, context, options)
    );
    return customer.save();
  },

  async list(context, options = {}) {
    const query = context.query || {};
    const limit = Math.max(0, Number(query.limit) || Number(options.limit) || 0);
    const filter = createBaseCustomerFilter(context, query, options);

    let customerQuery = customerRepository
      .find(filter)
      .sort({ customerType: 1, updatedAt: -1, createdAt: -1 });

    if (limit > 0) {
      customerQuery = customerQuery.limit(limit);
    }

    let customers = await customerQuery;

    if (String(query.includeWalkIn || "") === "true") {
      const walkInCustomer = await this.ensureWalkInCustomer(context, {
        branchMode: options.branchMode || "all",
        defaultToCurrentBranch: options.defaultToCurrentBranch || false,
      });
      customers = [
        walkInCustomer,
        ...customers.filter(
          (customer) => customer._id.toString() !== walkInCustomer._id.toString()
        ),
      ];
    }

    return customers;
  },

  async search(context, options = {}) {
    const search = String(context.query?.q || context.query?.search || "").trim();
    if (!search) return [];

    return this.list(
      {
        ...context,
        query: {
          ...(context.query || {}),
          search,
          limit: context.query?.limit || 10,
        },
      },
      options
    );
  },

  async getById(id, context, options = {}) {
    return customerRepository.findScopedById(id, context, options);
  },

  async update(id, data, context, options = {}) {
    const updates = buildScopedCustomerUpdates(data, context);
    if (Object.keys(updates).length === 0) {
      return undefined;
    }

    return customerRepository.findScopedByIdAndUpdate(
      id,
      { $set: updates },
      context,
      options,
      { new: true, runValidators: true }
    );
  },

  async softDelete(id, context, options = {}) {
    return customerRepository.findScopedByIdAndUpdate(
      id,
      {
        $set: {
          isActive: false,
          updatedBy: context.userId || null,
        },
      },
      context,
      options,
      { new: true }
    );
  },

  async adjustCredit(id, amount, context, options = {}) {
    return customerRepository.findScopedByIdAndUpdate(
      id,
      {
        $inc: { creditBalance: amount },
        $set: { updatedBy: context.userId || null },
      },
      context,
      options,
      { new: true }
    );
  },

  async applySaleMetrics(id, deltas = {}, context = {}, options = {}) {
    const {
      totalSpent = 0,
      visitCount = 0,
      loyaltyPoints = 0,
      creditBalance = 0,
      lastSaleAt = null,
      session = null,
    } = deltas;
    const filter = combineCustomerConditions(
      { _id: id },
      buildCustomerScopeConditions(context, options)
    );
    const update = {
      $inc: {
        totalSpent,
        visitCount,
        loyaltyPoints,
        creditBalance,
      },
      $set: {
        updatedBy: context.userId || null,
      },
    };

    if (lastSaleAt) {
      update.$set.lastSaleAt = lastSaleAt;
    }

    let customer = CustomerModel.findOneAndUpdate(filter, update, {
      new: true,
      session,
    });
    customer = await customer;

    if (!customer) return null;

    let shouldPersist = false;
    if ((customer.totalSpent || 0) < 0) {
      customer.totalSpent = 0;
      shouldPersist = true;
    }
    if ((customer.visitCount || 0) < 0) {
      customer.visitCount = 0;
      shouldPersist = true;
    }
    if ((customer.loyaltyPoints || 0) < 0) {
      customer.loyaltyPoints = 0;
      shouldPersist = true;
    }
    if ((customer.creditBalance || 0) < 0) {
      customer.creditBalance = 0;
      shouldPersist = true;
    }

    const nextTier = computeCustomerTier(customer.totalSpent || 0);
    if (nextTier !== customer.tier) {
      customer.tier = nextTier;
      shouldPersist = true;
    }

    if (shouldPersist) {
      customer.updatedBy = context.userId || null;
      await customer.save(session ? { session } : undefined);
    }

    return customer;
  },

  async ensureWalkInCustomer(
    context = {},
    { branchMode = "all", defaultToCurrentBranch = false } = {}
  ) {
    const branchId =
      defaultToCurrentBranch && context.orgId ? getCustomerBranchId(context) : null;
    const filter = combineCustomerConditions(
      [{ customerType: "walk_in", isActive: true }],
      buildCustomerScopeConditions(context, { branchMode, branchId })
    );
    let customer = await customerRepository.findOne(filter);

    if (customer) return customer;

    customer = customerRepository.create(
      buildScopedCustomerData(
        {
          name: DEFAULT_WALK_IN_NAME,
          customerType: "walk_in",
          branchId,
          isActive: true,
        },
        context,
        {
          defaultToCurrentBranch,
          source: "shared",
        }
      )
    );

    return customer.save();
  },

  buildSnapshot(customer) {
    return buildCustomerSnapshot(customer);
  },
};
