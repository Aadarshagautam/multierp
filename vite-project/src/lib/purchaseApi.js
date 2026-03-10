import api from "./api.js";

export const purchaseApi = {
  list: () => api.get("/purchases").then((response) => response.data),
  create: (data) => api.post("/purchases", data).then((response) => response.data),
  update: (id, data) => api.put(`/purchases/${id}`, data).then((response) => response.data),
  return: (id, data) => api.post(`/purchases/${id}/return`, data).then((response) => response.data),
  delete: (id) => api.delete(`/purchases/${id}`).then((response) => response.data),
  suppliers: () => api.get("/purchases/suppliers").then((response) => response.data),
  saveSupplier: (data) => api.post("/purchases/suppliers", data).then((response) => response.data),
};
