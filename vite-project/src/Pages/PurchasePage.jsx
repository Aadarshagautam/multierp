import React, { useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Edit3,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  User,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { purchaseApi } from "../lib/purchaseApi.js";
import AppContext from "../context/app-context.js";
import {
  DEFAULT_PHONE_PLACEHOLDER,
  PAYMENT_METHOD_LABELS,
  formatCurrencyNpr,
  formatDateNepal,
} from "../utils/nepal.js";

const PAYMENT_OPTIONS = [
  "cash",
  "card",
  "bank_transfer",
  "esewa",
  "khalti",
  "credit",
  "cheque",
  "other",
];

const DELIVERY_OPTIONS = ["pending", "in_transit", "delivered"];
const PAYMENT_STATUS_OPTIONS = ["pending", "partial", "paid"];

const emptyForm = {
  supplierName: "",
  supplierContact: "",
  productName: "",
  quantity: "",
  unitPrice: "",
  purchaseDate: new Date().toISOString().split("T")[0],
  paymentStatus: "pending",
  paidAmount: "",
  paymentMethod: "cash",
  deliveryStatus: "pending",
  notes: "",
};
const emptyReturnForm = {
  quantity: "",
  notes: "",
};

const statusTone = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  partial: "border-sky-200 bg-sky-50 text-sky-800",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_transit: "border-sky-200 bg-sky-50 text-sky-800",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  returned: "border-rose-200 bg-rose-50 text-rose-800",
};

const formatTitle = (value) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function PurchasePage() {
  const { hasPermission } = useContext(AppContext);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnForm, setReturnForm] = useState(emptyReturnForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const purchasesQuery = useQuery({
    queryKey: ["purchases"],
    queryFn: () => purchaseApi.list(),
  });

  const suppliersQuery = useQuery({
    queryKey: ["purchase-suppliers"],
    queryFn: () => purchaseApi.suppliers(),
  });

  const purchases = purchasesQuery.data?.data || [];
  const suppliers = suppliersQuery.data?.data || [];
  const canCreatePurchase = hasPermission("purchases.create");
  const canUpdatePurchase = hasPermission("purchases.update");
  const canReturnPurchase = hasPermission("purchases.return");
  const canDeletePurchase = hasPermission("purchases.delete");

  const invalidatePurchases = () => {
    qc.invalidateQueries({ queryKey: ["purchases"] });
    qc.invalidateQueries({ queryKey: ["purchase-suppliers"] });
  };

  const savePurchaseMut = useMutation({
    mutationFn: (payload) =>
      editingPurchase
        ? purchaseApi.update(editingPurchase._id, payload)
        : purchaseApi.create(payload),
    onSuccess: () => {
      toast.success(editingPurchase ? "Purchase updated" : "Purchase saved");
      invalidatePurchases();
      resetForm();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Unable to save purchase"),
  });

  const deletePurchaseMut = useMutation({
    mutationFn: (id) => purchaseApi.delete(id),
    onSuccess: () => {
      toast.success("Purchase deleted");
      invalidatePurchases();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Unable to delete purchase"),
  });
  const returnPurchaseMut = useMutation({
    mutationFn: ({ id, payload }) => purchaseApi.return(id, payload),
    onSuccess: () => {
      toast.success("Purchase return saved");
      invalidatePurchases();
      setReturnTarget(null);
      setReturnForm(emptyReturnForm);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Unable to return purchase"),
  });

  const totalAmount =
    (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0);

  const filteredPurchases = purchases.filter((purchase) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      purchase.productName?.toLowerCase().includes(term) ||
      purchase.supplierName?.toLowerCase().includes(term);
    const matchesStatus =
      filterStatus === "all" || purchase.paymentStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: purchases.length,
    amount: purchases.reduce(
      (sum, purchase) => sum + (Number(purchase.totalAmount) || 0),
      0
    ),
    outstanding: purchases.reduce(
      (sum, purchase) => sum + (Number(purchase.outstandingAmount) || 0),
      0
    ),
    supplierCredit: purchases.reduce(
      (sum, purchase) => sum + (Number(purchase.creditAmount) || 0),
      0
    ),
    returned: purchases.reduce(
      (sum, purchase) => sum + (Number(purchase.returnedAmount) || 0),
      0
    ),
    pending: purchases.filter((purchase) => purchase.paymentStatus === "pending")
      .length,
    paid: purchases.filter((purchase) => purchase.paymentStatus === "paid")
      .length,
    delivered: purchases.filter(
      (purchase) => purchase.deliveryStatus === "delivered"
    ).length,
  };
  const supplierBalances = suppliers.filter(
    (supplier) =>
      Number(supplier.ledger?.totalOutstanding || 0) > 0 ||
      Number(supplier.ledger?.totalCredit || 0) > 0
  );

  const resetForm = () => {
    setShowForm(false);
    setEditingPurchase(null);
    setForm(emptyForm);
  };
  const closeReturnForm = () => {
    setReturnTarget(null);
    setReturnForm(emptyReturnForm);
  };

  const openCreateForm = () => {
    if (!canCreatePurchase) return;
    setEditingPurchase(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (purchase) => {
    if (!canUpdatePurchase) return;
    setEditingPurchase(purchase);
    setForm({
      supplierName: purchase.supplierName || "",
      supplierContact: purchase.supplierContact || "",
      productName: purchase.productName || "",
      quantity: String(purchase.quantity || ""),
      unitPrice: String(purchase.unitPrice || ""),
      purchaseDate: purchase.purchaseDate
        ? new Date(purchase.purchaseDate).toISOString().slice(0, 10)
        : new Date().toISOString().split("T")[0],
      paymentStatus: purchase.paymentStatus || "pending",
      paidAmount:
        purchase.paidAmount === undefined ? "" : String(purchase.paidAmount || 0),
      paymentMethod: purchase.paymentMethod || "cash",
      deliveryStatus: purchase.deliveryStatus || "pending",
      notes: purchase.notes || "",
    });
    setShowForm(true);
  };
  const openReturnForm = (purchase) => {
    if (!canReturnPurchase) return;
    setReturnTarget(purchase);
    setReturnForm(emptyReturnForm);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if ((editingPurchase && !canUpdatePurchase) || (!editingPurchase && !canCreatePurchase)) {
      toast.error("Your role cannot save purchase changes.");
      return;
    }

    if (
      !form.supplierName.trim() ||
      !form.productName.trim() ||
      !form.quantity ||
      !form.unitPrice
    ) {
      toast.error("Supplier, product, quantity, and unit price are required");
      return;
    }
    if (form.paymentStatus === "partial" && (form.paidAmount === "" || Number(form.paidAmount) <= 0)) {
      toast.error("Enter an amount paid for partial supplier payments");
      return;
    }

    savePurchaseMut.mutate({
      supplierName: form.supplierName.trim(),
      supplierContact: form.supplierContact.trim(),
      productName: form.productName.trim(),
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      purchaseDate: form.purchaseDate,
      paymentStatus: form.paymentStatus,
      paidAmount: form.paidAmount === "" ? undefined : Number(form.paidAmount),
      paymentMethod: form.paymentMethod,
      deliveryStatus: form.deliveryStatus,
      notes: form.notes.trim(),
    });
  };
  const handleReturnSubmit = (event) => {
    event.preventDefault();
    if (!returnTarget) return;
    if (!returnForm.quantity || Number(returnForm.quantity) <= 0) {
      toast.error("Enter a return quantity");
      return;
    }

    returnPurchaseMut.mutate({
      id: returnTarget._id,
      payload: {
        quantity: Number(returnForm.quantity),
        notes: returnForm.notes.trim(),
      },
    });
  };

  if (purchasesQuery.isLoading) {
    return (
      <div className="page-shell">
        <div className="panel flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-emerald-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="panel p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Supplier Buying</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Keep supplier bills and stock buying in one ledger.
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Purchases now live in the workspace, not local storage. Supplier
              contact, payment status, and delivery follow-up stay attached to
              each purchase record.
            </p>
          </div>
          {canCreatePurchase && (
            <button onClick={openCreateForm} className="btn-primary">
              <Plus className="h-4 w-4" />
              Add purchase
            </button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="panel p-5">
          <p className="section-kicker">Purchases</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            {stats.total}
          </p>
        </div>
        <div className="panel p-5">
          <p className="section-kicker">Total Spend</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            {formatCurrencyNpr(stats.amount)}
          </p>
        </div>
        <div className="panel p-5">
          <p className="section-kicker">Supplier Due</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-amber-800">
            {formatCurrencyNpr(stats.outstanding)}
          </p>
        </div>
        <div className="panel p-5">
          <p className="section-kicker">Supplier Credit</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-sky-800">
            {formatCurrencyNpr(stats.supplierCredit)}
          </p>
        </div>
        <div className="panel p-5">
          <p className="section-kicker">Delivered</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            {stats.delivered}
          </p>
        </div>
        <div className="panel p-5">
          <p className="section-kicker">Returned</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-rose-800">
            {formatCurrencyNpr(stats.returned)}
          </p>
        </div>
        <div className="panel p-5">
          <p className="section-kicker">Pending Bills</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            {stats.pending}
          </p>
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-kicker">Supplier Balances</p>
            <h2 className="mt-2 section-heading">
              Keep due and credit visible before the next supplier call.
            </h2>
          </div>
        </div>
        {supplierBalances.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Supplier balances will appear here when a bill is unpaid or a return creates credit.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {supplierBalances.slice(0, 6).map((supplier) => (
              <article key={supplier._id} className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{supplier.name}</h3>
                    {supplier.contact && (
                      <p className="mt-1 text-sm text-slate-500">{supplier.contact}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                    {supplier.ledger?.purchaseCount || 0} bills
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Due</p>
                    <p className="mt-2 text-base font-semibold text-amber-900">
                      {formatCurrencyNpr(supplier.ledger?.totalOutstanding || 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">Credit</p>
                    <p className="mt-2 text-base font-semibold text-sky-900">
                      {formatCurrencyNpr(supplier.ledger?.totalCredit || 0)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <section className="panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">
                {editingPurchase ? "Update Purchase" : "New Purchase"}
              </p>
              <h2 className="mt-2 section-heading">
                {editingPurchase
                  ? "Edit supplier purchase"
                  : "Record supplier purchase"}
              </h2>
            </div>
            <button onClick={resetForm} className="btn-secondary">
              <X className="h-4 w-4" />
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <User className="h-4 w-4 text-emerald-700" />
                  Supplier
                </div>
                <div className="mt-4 grid gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Supplier name
                    </label>
                    <input
                      type="text"
                      list="supplier-options"
                      value={form.supplierName}
                      onChange={(event) => {
                        const supplier = suppliers.find(
                          (item) => item.name === event.target.value
                        );
                        setForm((current) => ({
                          ...current,
                          supplierName: event.target.value,
                          supplierContact:
                            supplier?.contact || current.supplierContact,
                        }));
                      }}
                      placeholder="Hulas Trading"
                      className="input-primary"
                      required
                    />
                    <datalist id="supplier-options">
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Contact
                    </label>
                    <input
                      type="text"
                      value={form.supplierContact}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          supplierContact: event.target.value,
                        }))
                      }
                      placeholder={DEFAULT_PHONE_PLACEHOLDER}
                      className="input-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Package className="h-4 w-4 text-amber-700" />
                  Product
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Product name
                    </label>
                    <input
                      type="text"
                      value={form.productName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          productName: event.target.value,
                        }))
                      }
                      placeholder="Tokla Tea 500g"
                      className="input-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          quantity: event.target.value,
                        }))
                      }
                      className="input-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Unit price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.unitPrice}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          unitPrice: event.target.value,
                        }))
                      }
                      className="input-primary"
                      required
                    />
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                      Total
                    </p>
                    <p className="mt-2 text-lg font-semibold text-amber-900">
                      {formatCurrencyNpr(totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Purchase date
                </label>
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      purchaseDate: event.target.value,
                    }))
                  }
                  className="input-primary"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Payment method
                </label>
                <select
                  value={form.paymentMethod}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      paymentMethod: event.target.value,
                    }))
                  }
                  className="input-primary"
                >
                  {PAYMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {PAYMENT_METHOD_LABELS[option] || formatTitle(option)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Payment status
                </label>
                <select
                  value={form.paymentStatus}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      paymentStatus: event.target.value,
                    }))
                  }
                  className="input-primary"
                >
                  {PAYMENT_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {formatTitle(option)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Amount paid
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.paidAmount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      paidAmount: event.target.value,
                    }))
                  }
                  placeholder="Leave blank to infer from status"
                  className="input-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Delivery status
                </label>
                <select
                  value={form.deliveryStatus}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryStatus: event.target.value,
                    }))
                  }
                  className="input-primary"
                >
                  {DELIVERY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {formatTitle(option)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Notes
              </label>
              <textarea
                rows="3"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Invoice number, due reminder, delivery note..."
                className="input-primary resize-none"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={savePurchaseMut.isPending}
              >
                {savePurchaseMut.isPending
                  ? "Saving..."
                  : editingPurchase
                    ? "Update purchase"
                    : "Save purchase"}
              </button>
            </div>
          </form>
        </section>
      )}

      {returnTarget && (
        <section className="panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Purchase Return</p>
              <h2 className="mt-2 section-heading">
                Return stock from {returnTarget.productName}
              </h2>
            </div>
            <button onClick={closeReturnForm} className="btn-secondary">
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
          <form onSubmit={handleReturnSubmit} className="mt-6 grid gap-4 lg:grid-cols-[0.9fr,1.1fr,auto]">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Return quantity
              </label>
              <input
                type="number"
                min="1"
                max={Math.max(0, (returnTarget.quantity || 0) - (returnTarget.returnedQty || 0))}
                value={returnForm.quantity}
                onChange={(event) =>
                  setReturnForm((current) => ({
                    ...current,
                    quantity: event.target.value,
                  }))
                }
                className="input-primary"
                placeholder={`Available: ${Math.max(0, (returnTarget.quantity || 0) - (returnTarget.returnedQty || 0))}`}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Return note
              </label>
              <input
                type="text"
                value={returnForm.notes}
                onChange={(event) =>
                  setReturnForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                className="input-primary"
                placeholder="Damaged pack, expired, wrong delivery..."
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary" disabled={returnPurchaseMut.isPending}>
                {returnPurchaseMut.isPending ? "Saving..." : "Save return"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker">Purchase Ledger</p>
            <h2 className="mt-2 section-heading">
              Track supplier spend, delivery, and payment follow-up.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(16rem,1fr),12rem]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search product or supplier"
                className="input-primary pl-10"
              />
            </label>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="input-primary"
            >
              <option value="all">All payment states</option>
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatTitle(option)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
              <ShoppingCart className="h-6 w-6 text-stone-500" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">
              No purchases found
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Start with one supplier bill and the ledger will stay visible here.
            </p>
            {canCreatePurchase && (
              <button onClick={openCreateForm} className="btn-primary mt-5">
                <Plus className="h-4 w-4" />
                Add first purchase
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredPurchases.map((purchase) => (
              <article
                key={purchase._id}
                className="rounded-3xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {purchase.productName}
                      </h3>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                          statusTone[purchase.paymentStatus] ||
                          "border-stone-200 bg-stone-100 text-stone-700"
                        }`}
                      >
                        {formatTitle(purchase.paymentStatus)}
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                          statusTone[purchase.deliveryStatus] ||
                          "border-stone-200 bg-stone-100 text-stone-700"
                        }`}
                      >
                        {formatTitle(purchase.deliveryStatus)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-emerald-700" />
                        {purchase.supplierName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-amber-700" />
                        {formatDateNepal(purchase.purchaseDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-sky-700" />
                        {purchase.quantity} units
                      </div>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-rose-700" />
                        {PAYMENT_METHOD_LABELS[purchase.paymentMethod] ||
                          formatTitle(purchase.paymentMethod)}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Unit Price
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                          {formatCurrencyNpr(purchase.unitPrice)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Total
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                          {formatCurrencyNpr(purchase.totalAmount)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Amount Paid
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                          {formatCurrencyNpr(purchase.paidAmount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                          Supplier Due
                        </p>
                        <p className="mt-2 text-base font-semibold text-amber-900">
                          {formatCurrencyNpr(purchase.outstandingAmount || 0)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                          Supplier Credit
                        </p>
                        <p className="mt-2 text-base font-semibold text-sky-900">
                          {formatCurrencyNpr(purchase.creditAmount || 0)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
                          Returned
                        </p>
                        <p className="mt-2 text-base font-semibold text-rose-900">
                          {purchase.returnedQty || 0} units
                          {purchase.returnedAmount
                            ? ` · ${formatCurrencyNpr(purchase.returnedAmount)}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    {(purchase.supplierContact || purchase.notes || purchase.returnNotes) && (
                      <div className="mt-4 space-y-2 text-sm text-slate-500">
                        {purchase.supplierContact && (
                          <p>Contact: {purchase.supplierContact}</p>
                        )}
                        {purchase.notes && <p>{purchase.notes}</p>}
                        {purchase.returnNotes && (
                          <p className="text-rose-700">Return note: {purchase.returnNotes}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {canUpdatePurchase && (
                      <button
                        onClick={() => openEditForm(purchase)}
                        className="btn-secondary"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>
                    )}
                    {canReturnPurchase && purchase.deliveryStatus === "delivered" &&
                      purchase.quantity > (purchase.returnedQty || 0) && (
                        <button
                          onClick={() => openReturnForm(purchase)}
                          className="btn-secondary text-amber-700"
                        >
                          <Truck className="h-4 w-4" />
                          Return
                        </button>
                      )}
                    {canDeletePurchase && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete purchase for ${purchase.productName}?`
                            )
                          ) {
                            deletePurchaseMut.mutate(purchase._id);
                          }
                        }}
                        className="btn-secondary text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
