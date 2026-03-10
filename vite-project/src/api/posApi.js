import api from "../Pages/lib/axios";

// ─── Products ───
export const posProductApi = {
  list: (params) => api.get("/pos/products", { params }).then((r) => r.data),
  get: (id) => api.get(`/pos/products/${id}`).then((r) => r.data),
  create: (data) => api.post("/pos/products", data).then((r) => r.data),
  update: (id, data) => api.patch(`/pos/products/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/pos/products/${id}`).then((r) => r.data),
  lowStock: () => api.get("/pos/products/low-stock").then((r) => r.data),
  categories: () => api.get("/pos/products/categories").then((r) => r.data),
};

// ─── Customers ───
export const posCustomerApi = {
  list: (params) => api.get("/pos/customers", { params }).then((r) => r.data),
  get: (id) => api.get(`/pos/customers/${id}`).then((r) => r.data),
  create: (data) => api.post("/pos/customers", data).then((r) => r.data),
  update: (id, data) => api.patch(`/pos/customers/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/pos/customers/${id}`).then((r) => r.data),
};

// ─── Sales ───
export const posSaleApi = {
  list: (params) => api.get("/pos/sales", { params }).then((r) => r.data),
  get: (id) => api.get(`/pos/sales/${id}`).then((r) => r.data),
  create: (data) => api.post("/pos/sales", data).then((r) => r.data),
  refund: (id) => api.post(`/pos/sales/${id}/refund`).then((r) => r.data),
  stats: () => api.get("/pos/sales/stats").then((r) => r.data),
  updateOrderStatus: (id, orderStatus) =>
    api.patch(`/pos/sales/${id}/order-status`, { orderStatus }).then((r) => r.data),
};

// ─── Tables ───
export const posTableApi = {
  list: () => api.get("/pos/tables").then((r) => r.data),
  create: (data) => api.post("/pos/tables", data).then((r) => r.data),
  update: (id, data) => api.patch(`/pos/tables/${id}`, data).then((r) => r.data),
  updateStatus: (id, status) => api.patch(`/pos/tables/${id}/status`, { status }).then((r) => r.data),
  reserve: (id, data) => api.patch(`/pos/tables/${id}/reservation`, data).then((r) => r.data),
  cancelReservation: (id) => api.delete(`/pos/tables/${id}/reservation`).then((r) => r.data),
  delete: (id) => api.delete(`/pos/tables/${id}`).then((r) => r.data),
};

// ─── Shifts ───
export const posShiftApi = {
  current: () => api.get("/pos/shifts/current").then((r) => r.data),
  list: () => api.get("/pos/shifts").then((r) => r.data),
  get: (id) => api.get(`/pos/shifts/${id}`).then((r) => r.data),
  open: (data) => api.post("/pos/shifts/open", data).then((r) => r.data),
  close: (id, data) => api.post(`/pos/shifts/${id}/close`, data).then((r) => r.data),
};

// ─── KDS ───
export const posKdsApi = {
  list: () => api.get("/pos/kds").then((r) => r.data),
};
