import { productService } from "../services/productService.js";
import {
  sendSuccess,
  sendCreated,
  sendError,
} from "../../../core/utils/response.js";
import asyncHandler from "../asyncHandler.js";

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.create(req.validated?.body ?? req.body, req);
  return sendCreated(res, product, "Product created");
});

export const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.list(req);
  return sendSuccess(res, { data: result });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id, req);
  if (!product) return sendError(res, { status: 404, message: "Product not found" });
  return sendSuccess(res, { data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.update(
    req.params.id,
    req.validated?.body ?? req.body,
    req
  );
  if (!product) return sendError(res, { status: 404, message: "Product not found" });
  return sendSuccess(res, { data: product, message: "Product updated" });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.softDelete(req.params.id, req);
  if (!product) return sendError(res, { status: 404, message: "Product not found" });
  return sendSuccess(res, { message: "Product deactivated" });
});

export const getLowStock = asyncHandler(async (req, res) => {
  const products = await productService.getLowStock(req);
  return sendSuccess(res, { data: products });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await productService.getCategories(req);
  return sendSuccess(res, { data: categories });
});
