import Inventory from "../../modules/inventory/model.js";
import { DEFAULT_VAT_RATE } from "../../core/utils/nepal.js";
import {
  DEFAULT_PRODUCT_CATEGORY,
  DEFAULT_PRODUCT_TYPE,
  DEFAULT_PRODUCT_UNIT,
  DEFAULT_REORDER_LEVEL,
} from "./constants.js";
import {
  buildProductScopeFilter,
  getProductBranchId,
  productRepository,
} from "./repository.js";
import { normalizeProductPayload } from "./validation.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSearchClause = (search = "") => {
  const trimmed = search.trim();
  if (!trimmed) return null;

  const regex = new RegExp(escapeRegex(trimmed), "i");
  return [
    { name: regex },
    { sku: regex },
    { barcode: regex },
    { code: regex },
  ];
};

const buildScopedProductData = (data = {}, context = {}) => ({
  ...normalizeProductPayload(data),
  userId: context.userId,
  orgId: context.orgId || null,
  branchId: getProductBranchId(context),
  createdBy: context.userId,
  updatedBy: context.userId,
});

export const mapInventoryItemToProductInput = (inventoryItem = {}) =>
  normalizeProductPayload({
    name: inventoryItem.productName || inventoryItem.name || "",
    sku: inventoryItem.sku || "",
    barcode: inventoryItem.barcode || "",
    description: inventoryItem.description || "",
    type: DEFAULT_PRODUCT_TYPE,
    category: inventoryItem.category || DEFAULT_PRODUCT_CATEGORY,
    costPrice: inventoryItem.costPrice ?? 0,
    sellingPrice: inventoryItem.sellingPrice ?? 0,
    currentStock: inventoryItem.quantity ?? inventoryItem.stockQty ?? 0,
    unit: inventoryItem.unit || DEFAULT_PRODUCT_UNIT,
    taxRate: inventoryItem.vatRate ?? inventoryItem.taxRate ?? DEFAULT_VAT_RATE,
    reorderLevel: inventoryItem.lowStockAlert ?? DEFAULT_REORDER_LEVEL,
    trackStock: true,
    isActive: inventoryItem.isActive ?? true,
  });

export const resolveProductReference = async (
  productId,
  context = {},
  { session = null } = {}
) => {
  if (!productId) return null;

  let product = productRepository.findScopedById(productId, context);
  if (session) product = product.session(session);
  const existingProduct = await product;
  if (existingProduct) return existingProduct;

  let inventoryQuery = Inventory.findOne({
    _id: productId,
    ...buildProductScopeFilter(context),
  });

  if (session) inventoryQuery = inventoryQuery.session(session);
  const inventoryItem = await inventoryQuery;
  if (!inventoryItem) return null;

  const syncedProduct = await syncProductFromInventoryItem({
    inventoryItem,
    context,
    productId: inventoryItem.productId,
    session,
  });

  if (
    syncedProduct &&
    (!inventoryItem.productId ||
      inventoryItem.productId.toString() !== syncedProduct._id.toString())
  ) {
    inventoryItem.productId = syncedProduct._id;
    await inventoryItem.save(session ? { session } : undefined);
  }

  return syncedProduct;
};

export const hydrateInvoiceItemsWithProducts = async (
  items = [],
  context = {},
  { session = null } = {}
) => {
  const hydratedItems = [];

  for (const item of items) {
    const product = await resolveProductReference(item.productId, context, { session });

    hydratedItems.push({
      ...item,
      productId: product?._id?.toString() || item.productId,
      productName: item.productName?.trim() || product?.name || "",
      sku: item.sku?.trim() || product?.sku || "",
      unitPrice: item.unitPrice ?? product?.sellingPrice ?? 0,
      vatRate: item.vatRate ?? product?.taxRate ?? DEFAULT_VAT_RATE,
    });
  }

  return hydratedItems;
};

export const syncProductFromInventoryItem = async ({
  inventoryItem = {},
  context = {},
  productId = null,
  session = null,
}) => {
  const mappedData = mapInventoryItemToProductInput(inventoryItem);
  const scopedProductId =
    productId || inventoryItem.productId || inventoryItem.product?._id || null;

  let product = null;
  if (scopedProductId) {
    product = productRepository.findScopedById(scopedProductId, context);
    if (session) product = product.session(session);
    product = await product;
  }

  if (!product) {
    const createdProduct = productRepository.create(
      buildScopedProductData(mappedData, context)
    );
    await createdProduct.save(session ? { session } : undefined);
    return createdProduct;
  }

  Object.assign(product, {
    ...mappedData,
    updatedBy: context.userId,
  });
  await product.save(session ? { session } : undefined);
  return product;
};

export const sharedProductService = {
  async create(data, context) {
    const product = productRepository.create(buildScopedProductData(data, context));
    return product.save();
  },

  async list(context) {
    const filter = { ...buildProductScopeFilter(context), isActive: true };
    const { search, category, isAvailable, page = 1, limit = 50, type } = context.query || {};

    const searchClause = buildSearchClause(search);
    if (searchClause) filter.$or = searchClause;
    if (category) filter.category = category;
    if (type) filter.productType = type;
    if (isAvailable !== undefined) {
      filter.isAvailable = String(isAvailable) === "true";
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Number(limit) || 50);
    const skip = (pageNumber - 1) * limitNumber;

    const [products, total] = await Promise.all([
      productRepository.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
      productRepository.count(filter),
    ]);

    return {
      products,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    };
  },

  async getById(id, context) {
    return productRepository.findScopedById(id, context);
  },

  async update(id, data, context) {
    const updates = {
      ...normalizeProductPayload(data, { partial: true }),
      updatedBy: context.userId,
    };

    return productRepository.findScopedByIdAndUpdate(
      id,
      { $set: updates },
      context,
      { new: true, runValidators: true }
    );
  },

  async softDelete(id, context) {
    return productRepository.findScopedByIdAndUpdate(
      id,
      {
        $set: {
          isActive: false,
          updatedBy: context.userId,
        },
      },
      context,
      { new: true }
    );
  },

  async getLowStock(context) {
    const filter = {
      ...buildProductScopeFilter(context),
      isActive: true,
      trackStock: true,
    };
    const products = await productRepository.find(filter);
    return products.filter((product) => (product.stockQty || 0) <= (product.lowStockAlert || 0));
  },

  async getCategories(context) {
    const filter = { ...buildProductScopeFilter(context), isActive: true };
    return productRepository.distinct("category", filter);
  },
};
