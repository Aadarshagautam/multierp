import { sharedProductService } from "../../../shared/products/service.js";

export const productService = {
  async create(data, req) {
    return sharedProductService.create(data, req);
  },

  async list(req) {
    return sharedProductService.list(req);
  },

  async getById(id, req) {
    return sharedProductService.getById(id, req);
  },

  async update(id, data, req) {
    return sharedProductService.update(id, data, req);
  },

  async softDelete(id, req) {
    return sharedProductService.softDelete(id, req);
  },

  async getLowStock(req) {
    return sharedProductService.getLowStock(req);
  },

  async getCategories(req) {
    return sharedProductService.getCategories(req);
  },
};
