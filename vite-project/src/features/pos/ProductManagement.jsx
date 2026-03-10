import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit3, Trash2, X, Package, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import { posProductApi } from "../../api/posApi";
import api from "../../Pages/lib/axios";

const MENU_CATEGORIES = ["Starters", "Mains", "Beverages", "Desserts", "Snacks", "Specials"];
const UNITS = ["pcs", "kg", "g", "L", "ml", "plate", "cup", "bowl", "serving", "pair"];

const emptyForm = {
  name: "", sku: "", barcode: "", description: "",
  category: "General", menuCategory: "",
  costPrice: "", sellingPrice: "", stockQty: "",
  unit: "pcs", taxRate: 13, lowStockAlert: 10,
  preparationTime: 0, isAvailable: true,
  recipe: [],
  modifiers: [],
};

const emptyModifier = { name: "", required: false, multiSelect: false, options: [{ label: "", price: 0 }] };
const emptyRecipeItem = { inventoryItemId: "", ingredientName: "", qty: 1, unit: "" };

export default function ProductManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedModifier, setExpandedModifier] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["pos-products", search, catFilter, page],
    queryFn: () => posProductApi.list({ search, category: catFilter, page, limit: 20 }),
  });

  const { data: catData } = useQuery({
    queryKey: ["pos-categories"],
    queryFn: () => posProductApi.categories(),
  });
  const { data: inventoryData } = useQuery({
    queryKey: ["inventory-for-recipes"],
    queryFn: () => api.get("/inventory").then((response) => response.data),
  });

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination || {};
  const categories = catData?.data || [];
  const inventoryItems = inventoryData?.data || [];

  const createMut = useMutation({
    mutationFn: (d) => posProductApi.create(d),
    onSuccess: () => { toast.success("Product created"); qc.invalidateQueries({ queryKey: ["pos-products"] }); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => posProductApi.update(id, data),
    onSuccess: () => { toast.success("Product updated"); qc.invalidateQueries({ queryKey: ["pos-products"] }); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => posProductApi.delete(id),
    onSuccess: () => { toast.success("Product deactivated"); qc.invalidateQueries({ queryKey: ["pos-products"] }); },
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const toggleAvailMut = useMutation({
    mutationFn: ({ id, val }) => posProductApi.update(id, { isAvailable: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pos-products"] }),
    onError: (e) => toast.error(e.response?.data?.message || "Error"),
  });

  const openEdit = (p) => {
    setEditId(p._id);
    setForm({
      name: p.name, sku: p.sku || "", barcode: p.barcode || "",
      description: p.description || "",
      category: p.category || "General", menuCategory: p.menuCategory || "",
      costPrice: p.costPrice, sellingPrice: p.sellingPrice, stockQty: p.stockQty,
      unit: p.unit || "pcs", taxRate: p.taxRate ?? 13, lowStockAlert: p.lowStockAlert ?? 10,
      preparationTime: p.preparationTime ?? 0, isAvailable: p.isAvailable ?? true,
      recipe: p.recipe || [],
      modifiers: p.modifiers || [],
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditId(null); setForm(emptyForm); setExpandedModifier(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      stockQty: Number(form.stockQty),
      taxRate: Number(form.taxRate),
      lowStockAlert: Number(form.lowStockAlert),
      preparationTime: Number(form.preparationTime),
      recipe: (form.recipe || [])
        .filter((item) => item.inventoryItemId && Number(item.qty) > 0)
        .map((item) => ({
          inventoryItemId: item.inventoryItemId,
          ingredientName: item.ingredientName || "",
          qty: Number(item.qty),
          unit: item.unit || "",
        })),
    };
    editId ? updateMut.mutate({ id: editId, data: payload }) : createMut.mutate(payload);
  };

  // ─── Modifier helpers ───
  const addModifier = () => setForm({ ...form, modifiers: [...form.modifiers, { ...emptyModifier }] });
  const removeModifier = (i) => setForm({ ...form, modifiers: form.modifiers.filter((_, idx) => idx !== i) });
  const updateModifier = (i, key, val) => {
    const mods = [...form.modifiers];
    mods[i] = { ...mods[i], [key]: val };
    setForm({ ...form, modifiers: mods });
  };
  const addOption = (modIdx) => {
    const mods = [...form.modifiers];
    mods[modIdx] = { ...mods[modIdx], options: [...mods[modIdx].options, { label: "", price: 0 }] };
    setForm({ ...form, modifiers: mods });
  };
  const removeOption = (modIdx, optIdx) => {
    const mods = [...form.modifiers];
    mods[modIdx] = { ...mods[modIdx], options: mods[modIdx].options.filter((_, i) => i !== optIdx) };
    setForm({ ...form, modifiers: mods });
  };
  const updateOption = (modIdx, optIdx, key, val) => {
    const mods = [...form.modifiers];
    const opts = [...mods[modIdx].options];
    opts[optIdx] = { ...opts[optIdx], [key]: val };
    mods[modIdx] = { ...mods[modIdx], options: opts };
    setForm({ ...form, modifiers: mods });
  };
  const addRecipeItem = () => setForm({ ...form, recipe: [...(form.recipe || []), { ...emptyRecipeItem }] });
  const removeRecipeItem = (index) => setForm({ ...form, recipe: form.recipe.filter((_, itemIndex) => itemIndex !== index) });
  const updateRecipeItem = (index, updates) => {
    const recipe = [...(form.recipe || [])];
    recipe[index] = { ...recipe[index], ...updates };
    setForm({ ...form, recipe });
  };

  return (
    <div className="p-4 lg:pl-[17.5rem] pt-20 min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products &amp; Menu</h1>
            <p className="text-sm text-gray-500">Manage your products, menu items, and customizations</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Search by name, SKU, barcode..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <select
            value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Package className="w-12 h-12 mb-3" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Cost</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Available</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Mods</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sku || "No SKU"} {p.barcode && `· ${p.barcode}`}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg">{p.menuCategory || p.category}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">Rs. {p.costPrice}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">Rs. {p.sellingPrice}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold tabular-nums ${p.stockQty <= (p.lowStockAlert || 10) ? "text-red-600" : "text-green-600"}`}>
                          {p.stockQty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleAvailMut.mutate({ id: p._id, val: !p.isAvailable })}>
                          {p.isAvailable
                            ? <ToggleRight className="w-6 h-6 text-green-500 mx-auto" />
                            : <ToggleLeft className="w-6 h-6 text-gray-300 mx-auto" />
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.modifiers?.length > 0
                          ? <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{p.modifiers.length}</span>
                          : <span className="text-xs text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (window.confirm(`Deactivate "${p.name}"?`)) deleteMut.mutate(p._id); }}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages} ({pagination.total} items)</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Previous</button>
                <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-semibold text-gray-900">{editId ? "Edit Product" : "Add Product"}</h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Basic info */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                  <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Barcode</label>
                  <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Menu Category</label>
                  <select value={form.menuCategory} onChange={(e) => setForm({ ...form, menuCategory: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="">None</option>
                    {MENU_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cost Price</label>
                  <input type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price *</label>
                  <input type="number" required min="0" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tax %</label>
                  <input type="number" min="0" max="100" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Stock + Unit */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock Qty</label>
                  <input type="number" min="0" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Prep Time (min)</label>
                  <input type="number" min="0" value={form.preparationTime} onChange={(e) => setForm({ ...form, preparationTime: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              {/* Available toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.isAvailable ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isAvailable ? "translate-x-5" : "translate-x-1"}`} />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {form.isAvailable ? "Available for sale" : "Marked as unavailable"}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Recipe Stock Deduction</label>
                  <button type="button" onClick={addRecipeItem}
                    className="text-xs text-emerald-700 hover:underline font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add ingredient
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Optional. When this item sells, linked inventory ingredients will be deducted automatically.
                </p>
                {form.recipe.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
                    No recipe linked yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.recipe.map((ingredient, index) => (
                      <div key={`${ingredient.inventoryItemId || "recipe"}-${index}`} className="grid grid-cols-[1.6fr_0.7fr_0.6fr_auto] gap-2 items-center">
                        <select
                          value={ingredient.inventoryItemId}
                          onChange={(e) => {
                            const selected = inventoryItems.find((item) => item._id === e.target.value);
                            updateRecipeItem(index, {
                              inventoryItemId: e.target.value,
                              ingredientName: selected?.productName || "",
                            });
                          }}
                          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="">Select inventory item</option>
                          {inventoryItems.map((item) => (
                            <option key={item._id} value={item._id}>
                              {item.productName}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={ingredient.qty}
                          onChange={(e) => updateRecipeItem(index, { qty: e.target.value })}
                          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Qty"
                        />
                        <input
                          type="text"
                          value={ingredient.unit || ""}
                          onChange={(e) => updateRecipeItem(index, { unit: e.target.value })}
                          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Unit"
                        />
                        <button type="button" onClick={() => removeRecipeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {inventoryItems.length === 0 && (
                  <p className="mt-2 text-xs text-amber-700">
                    Add inventory items first if you want automatic recipe deduction.
                  </p>
                )}
              </div>

              {/* Modifiers section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Customizations / Modifiers</label>
                  <button type="button" onClick={addModifier}
                    className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Group
                  </button>
                </div>
                <div className="space-y-3">
                  {form.modifiers.map((mod, mi) => (
                    <div key={mi} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div
                        className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedModifier(expandedModifier === mi ? null : mi)}
                      >
                        <input
                          type="text"
                          placeholder="Group name (e.g. Size, Spice Level)"
                          value={mod.name}
                          onChange={(e) => { e.stopPropagation(); updateModifier(mi, "name", e.target.value); }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 text-sm font-medium bg-transparent focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={mod.required} onChange={(e) => updateModifier(mi, "required", e.target.checked)} className="rounded" />
                            Required
                          </label>
                          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={mod.multiSelect} onChange={(e) => updateModifier(mi, "multiSelect", e.target.checked)} className="rounded" />
                            Multi
                          </label>
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeModifier(mi); }} className="p-1 text-red-400 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {expandedModifier === mi ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                      {expandedModifier === mi && (
                        <div className="p-3 space-y-2">
                          {mod.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Option label (e.g. Large, Extra Spicy)"
                                value={opt.label}
                                onChange={(e) => updateOption(mi, oi, "label", e.target.value)}
                                className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="Price"
                                value={opt.price}
                                onChange={(e) => updateOption(mi, oi, "price", Number(e.target.value))}
                                className="w-20 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <button type="button" onClick={() => removeOption(mi, oi)} disabled={mod.options.length === 1}
                                className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addOption(mi)}
                            className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1 mt-1">
                            <Plus className="w-3 h-3" /> Add option
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-4 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold">
                  {createMut.isPending || updateMut.isPending ? "Saving..." : editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
