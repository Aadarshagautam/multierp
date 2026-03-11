import React, { useState, useRef, useEffect, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote,
  Smartphone, UserPlus, X, Check, Printer, Utensils, Package, Bike,
  ChevronDown, Star, Table2,
} from "lucide-react";
import toast from "react-hot-toast";
import { posProductApi, posCustomerApi, posSaleApi, posTableApi } from "../../api/posApi";
import PrintableInvoice from "./components/PrintableInvoice";
import { EmptyCard, PageHeader, SearchField, WorkspacePage } from "../../components/ui/ErpPrimitives.jsx";
import { getBusinessPosMeta } from "../../config/businessConfigs.js";
import AppContext from "../../context/app-context.js";
import { POS_PAYMENT_METHODS, formatDateTimeNepal, formatShortCurrencyNpr } from "../../utils/nepal.js";
import {
  buildPosSalePayload,
  buildQuickTenderValues,
  calculateCartTotals,
  calculateTenderState,
  findExactProductMatch,
  getCheckoutIssues,
} from "./utils/billing.js";

const ORDER_TYPES = {
  "dine-in": { key: "dine-in", label: "Dine-in", icon: Utensils },
  takeaway: { key: "takeaway", label: "Takeaway", icon: Package },
  delivery: { key: "delivery", label: "Delivery", icon: Bike },
};

const PAYMENT_METHOD_ICONS = {
  cash: Banknote,
  card: CreditCard,
  esewa: Smartphone,
  khalti: Smartphone,
  credit: UserPlus,
};

const buildQuickCustomerSeed = (value = "") => {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D+/g, "");
  const hasLetters = /[A-Za-z]/.test(trimmed);

  if (!trimmed) {
    return { name: "", phone: "" };
  }

  if (!hasLetters && digits.length >= 7) {
    return { name: "", phone: trimmed };
  }

  return { name: trimmed, phone: "" };
};

const isProductSellable = (product) => {
  if (!product?.isAvailable) return false;

  const usesRecipe = Array.isArray(product.recipe) && product.recipe.length > 0;
  if (product.trackStock === false || usesRecipe) return true;

  return Number(product.stockQty || 0) > 0;
};

// ─── Modifier modal ───
function ModifierModal({ product, onConfirm, onClose }) {
  const [selections, setSelections] = useState({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const toggleOption = (modName, option, multiSelect) => {
    setSelections((prev) => {
      const current = prev[modName] || [];
      if (multiSelect) {
        return current.includes(option.label)
          ? { ...prev, [modName]: current.filter((o) => o !== option.label) }
          : { ...prev, [modName]: [...current, option.label] };
      }
      return { ...prev, [modName]: [option.label] };
    });
  };

  const extraPrice = product.modifiers?.reduce((sum, mod) => {
    const selected = selections[mod.name] || [];
    return sum + mod.options.filter((o) => selected.includes(o.label)).reduce((s, o) => s + o.price, 0);
  }, 0) || 0;

  const confirm = () => {
    const mods = [];
    for (const [name, opts] of Object.entries(selections)) {
      opts.forEach((opt) => {
        const mod = product.modifiers.find((m) => m.name === name);
        const option = mod?.options.find((o) => o.label === opt);
        mods.push({ name, option: opt, price: option?.price || 0 });
      });
    }
    onConfirm({ qty, modifiers: mods, notes: note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-500">Rs. {product.sellingPrice + extraPrice}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-5">
          {/* Quantity */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xl font-bold w-8 text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modifiers */}
          {product.modifiers?.map((mod) => (
            <div key={mod.name}>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                {mod.name} {mod.required && <span className="text-red-500">*</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {mod.options.map((opt) => {
                  const selected = (selections[mod.name] || []).includes(opt.label);
                  return (
                    <button
                      key={opt.label}
                      onClick={() => toggleOption(mod.name, opt, mod.multiSelect)}
                      className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                        selected ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {opt.label} {opt.price > 0 && <span className="text-xs opacity-70">+{opt.price}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Note */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Special note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. No onion, extra spicy..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={confirm} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillingScreen() {
  const { branchName, orgBusinessType } = useContext(AppContext);
  const qc = useQueryClient();
  const searchRef = useRef(null);
  const posMeta = getBusinessPosMeta(orgBusinessType);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("takeaway");
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showQuickCustomerForm, setShowQuickCustomerForm] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState({ name: "", phone: "" });
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [loyaltyRedeem, setLoyaltyRedeem] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [completedSale, setCompletedSale] = useState(null);
  const [modifierTarget, setModifierTarget] = useState(null);
  const [activeMenuCat, setActiveMenuCat] = useState("All");
  const orderTypeOptions = posMeta.orderTypes.map((key) => {
    const option = ORDER_TYPES[key];
    return key === "takeaway" && !posMeta.allowTables
      ? { ...option, label: "Counter" }
      : option;
  });
  const activeOrderType = posMeta.orderTypes.includes(orderType) ? orderType : posMeta.orderTypes[0];
  const hasSelectedCustomerAccount = Boolean(selectedCustomer?._id);
  const isWalkInSelection = Boolean(selectedCustomer) && !hasSelectedCustomerAccount;
  const paymentOptions = POS_PAYMENT_METHODS.filter(({ key }) => key !== "mixed");

  useEffect(() => { searchRef.current?.focus(); }, []);

  // Data
  const { data: productData } = useQuery({
    queryKey: ["pos-products-billing", search],
    queryFn: () => posProductApi.list({ search, limit: 12, isAvailable: true }),
    enabled: search.length > 0,
  });
  const searchResults = productData?.data?.products || [];

  const { data: allProductData } = useQuery({
    queryKey: ["pos-products-all"],
    queryFn: () => posProductApi.list({ limit: 100, isAvailable: true }),
  });
  const allProducts = allProductData?.data?.products || [];
  const menuCats = ["All", ...new Set(allProducts.map((p) => p.menuCategory || p.category).filter(Boolean))];
  const gridProducts = activeMenuCat === "All" ? allProducts : allProducts.filter((p) => (p.menuCategory || p.category) === activeMenuCat);

  const { data: customerData } = useQuery({
    queryKey: ["pos-customers-billing", customerSearch],
    queryFn: () =>
      posCustomerApi.list({
        search: customerSearch,
        includeWalkIn: true,
        limit: 8,
      }),
    enabled: customerSearch.length > 0,
  });
  const customerResults = customerData?.data || [];
  const activeSearchCatalog = searchResults.length > 0
    ? [...searchResults, ...allProducts]
    : allProducts;

  const { data: tablesData } = useQuery({
    queryKey: ["pos-tables"],
    queryFn: () => posTableApi.list(),
    enabled: posMeta.allowTables,
  });
  const availableTables = (tablesData?.data || []).filter((t) => t.status === "available" || t.status === "reserved");

  const saleMut = useMutation({
    mutationFn: (data) => posSaleApi.create(data),
    onSuccess: (res) => {
      toast.success("Sale completed!");
      setCompletedSale(res.data);
      setCart([]); setSearch(""); setOverallDiscount(0); setPaidAmount("");
      setSelectedCustomer(null); setSelectedTable(null); setNotes("");
      setLoyaltyRedeem(0); setDeliveryAddress("");
      qc.invalidateQueries({ queryKey: ["pos-products"] });
      qc.invalidateQueries({ queryKey: ["pos-products-billing"] });
      qc.invalidateQueries({ queryKey: ["pos-products-all"] });
      qc.invalidateQueries({ queryKey: ["pos-sales"] });
      qc.invalidateQueries({ queryKey: ["pos-stats"] });
      qc.invalidateQueries({ queryKey: ["pos-tables"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Sale failed"),
  });

  const quickCustomerMut = useMutation({
    mutationFn: (payload) => posCustomerApi.create(payload),
    onSuccess: (response) => {
      const createdCustomer = response?.data || response?.customer || response;
      toast.success("Customer created");
      setSelectedCustomer(createdCustomer || null);
      setCustomerSearch("");
      setShowCustomerDropdown(false);
      setShowQuickCustomerForm(false);
      setQuickCustomer({ name: "", phone: "" });
      qc.invalidateQueries({ queryKey: ["pos-customers"] });
      qc.invalidateQueries({ queryKey: ["pos-customers-billing"] });
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Could not create customer"),
  });


  // ─── Cart helpers ───
  const cartKey = (productId, modifiers) =>
    productId + "-" + JSON.stringify(modifiers || []);

  const addToCart = (product, qty = 1, modifiers = [], note = "") => {
    if (!isProductSellable(product)) {
      toast.error(`"${product.name}" is not available for billing right now.`);
      return;
    }

    setSearch("");
    const key = cartKey(product._id, modifiers);
    setCart((currentCart) => {
      const existing = currentCart.find((c) => c._key === key);
      if (existing && modifiers.length === 0) {
        return currentCart.map((c) => c._key === key ? { ...c, qty: c.qty + qty } : c);
      }

      const extraPrice = modifiers.reduce((sum, modifier) => sum + (modifier.price || 0), 0);
      return [...currentCart, {
        _key: key,
        productId: product._id,
        name: product.name,
        sku: product.sku || "",
        barcode: product.barcode || "",
        basePrice: product.sellingPrice,
        price: product.sellingPrice + extraPrice,
        taxRate: product.taxRate,
        qty,
        discount: 0,
        stockQty: product.stockQty,
        modifiers,
        notes: note,
        hasModifiers: product.modifiers?.length > 0,
      }];
    });
    setModifierTarget(null);
  };

  const handleProductClick = (product) => {
    if (product.modifiers?.length > 0) {
      setModifierTarget(product);
    } else {
      addToCart(product);
    }
  };

  const updateQty = (key, delta) => {
    setCart((currentCart) =>
      currentCart
        .map((c) => {
          if (c._key === key) {
            const q = c.qty + delta;
            return q <= 0 ? null : { ...c, qty: q };
          }
          return c;
        })
        .filter(Boolean)
    );
  };

  const removeItem = (key) =>
    setCart((currentCart) => currentCart.filter((c) => c._key !== key));

  // ─── Totals ───
  const totals = calculateCartTotals({
    cart,
    overallDiscount,
    loyaltyRedeem,
  });
  const paymentState = calculateTenderState({
    grandTotal: totals.grandTotal,
    amountTendered: paidAmount,
    paymentMethod,
  });
  const checkoutIssues = getCheckoutIssues({
    cart,
    orderType: activeOrderType,
    selectedTable,
    paymentMethod,
    selectedCustomer,
    paymentState,
  });
  const quickTenderValues = buildQuickTenderValues(totals.grandTotal);

  const handleCheckout = () => {
    if (checkoutIssues.length > 0) {
      toast.error(checkoutIssues[0]);
      return;
    }

    saleMut.mutate(
      buildPosSalePayload({
        cart,
        paymentMethod,
        paymentState,
        selectedCustomer,
        overallDiscount,
        notes,
        orderType: activeOrderType,
        selectedTable,
        deliveryAddress,
        loyaltyRedeem,
      })
    );
  };

  const handleQuickCustomerCreate = () => {
    if (!quickCustomer.name.trim() && !quickCustomer.phone.trim()) {
      toast.error("Enter a customer name or phone");
      return;
    }

    quickCustomerMut.mutate({
      ...quickCustomer,
      customerType: posMeta.allowTables ? "guest" : "regular",
    });
  };

  if (completedSale) {
    return (
      <WorkspacePage className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Sale Complete"
          title="The sale has been saved and is ready to print."
          description="Print the invoice now or move straight into the next bill."
          badges={[completedSale.invoiceNo || "Receipt ready"]}
          actions={
            <div className="flex flex-wrap gap-3">
              <button onClick={() => window.print()} className="btn-secondary">
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button onClick={() => setCompletedSale(null)} className="btn-primary">
                <Plus className="h-4 w-4" />
                New sale
              </button>
            </div>
          }
        />
          <PrintableInvoice sale={completedSale} />
      </WorkspacePage>
    );
  }

  return (
    <WorkspacePage className="mx-auto max-w-7xl">
      {modifierTarget && (
        <ModifierModal
          product={modifierTarget}
          onConfirm={({ qty, modifiers, notes: note }) => addToCart(modifierTarget, qty, modifiers, note)}
          onClose={() => setModifierTarget(null)}
        />
      )}

      <PageHeader
        eyebrow="Billing Desk"
        title={posMeta.allowTables ? "Service billing should stay quick during live floor operations." : "Counter billing should stay fast and easy to learn."}
        description="Keep item search, cart review, payment, and customer lookup inside one clear cashier workflow."
        badges={[
          branchName ? `Branch: ${branchName}` : "Main workspace",
          `${cart.length} cart items`,
          activeOrderType === "takeaway" && !posMeta.allowTables ? "Counter sale" : ORDER_TYPES[activeOrderType]?.label || activeOrderType,
          hasSelectedCustomerAccount
            ? `Customer: ${selectedCustomer.name}`
            : isWalkInSelection
              ? "Walk-in selected"
              : "Walk-in ready",
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/pos/shifts" className="btn-secondary">
              <ChevronDown className="h-4 w-4" />
              Shifts
            </Link>
            <Link to="/pos/sales" className="btn-secondary">
              <ShoppingCart className="h-4 w-4" />
              Sales history
            </Link>
          </div>
        }
      />

      <div className="space-y-4">
        {branchName && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
            <Table2 className="h-3.5 w-3.5" />
            Billing branch: {branchName}
          </div>
        )}

        {/* Order type tabs */}
        <section className="erp-toolbar">
          <div className="flex flex-wrap gap-2">
            {orderTypeOptions.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setOrderType(key); if (key !== "dine-in") setSelectedTable(null); }}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
                  activeOrderType === key ? "border-slate-900 bg-slate-900 text-white" : "bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="erp-chip">Subtotal {formatShortCurrencyNpr(totals.subtotal)}</span>
            <span className="erp-chip">VAT {formatShortCurrencyNpr(totals.taxTotal)}</span>
            <span className="erp-chip">Total {formatShortCurrencyNpr(totals.grandTotal)}</span>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* ─── LEFT: Products ─── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="panel p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Find products fast</p>
                  <p className="text-xs text-slate-500">Search by name, SKU, or barcode. Press Enter to bill a barcode instantly.</p>
                </div>
                <span className="erp-chip">Tap item to add</span>
              </div>
              <SearchField
                inputRef={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;

                  const exactMatch = findExactProductMatch(activeSearchCatalog, search);
                  if (!exactMatch) return;

                  event.preventDefault();
                  handleProductClick(exactMatch);
                }}
                placeholder="Search product name, SKU, or barcode..."
                inputClassName="py-2.5"
              />
              {search && searchResults.length > 0 && (
                <div className="mt-2 border border-gray-100 rounded-xl max-h-52 overflow-y-auto divide-y divide-gray-50">
                  {searchResults.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => handleProductClick(p)}
                      disabled={!isProductSellable(p)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                        isProductSellable(p)
                          ? "hover:bg-indigo-50"
                          : "cursor-not-allowed bg-gray-50 text-gray-400"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">
                          {p.barcode || p.sku || "No code"}
                          {" · "}
                          {p.trackStock === false || (Array.isArray(p.recipe) && p.recipe.length > 0)
                            ? "No stock lock"
                            : `Stock: ${p.stockQty}`}
                        </p>
                        {p.modifiers?.length > 0 && <p className="text-xs text-indigo-500">Has customizations</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">Rs. {p.sellingPrice}</p>
                        <p className="text-xs text-gray-400">+{p.taxRate}% tax</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Menu category pills + grid */}
            {!search && (
              <div className="panel p-4">
                {/* Category pills */}
                <div className="mb-3 flex gap-1.5 overflow-x-auto pb-2">
                  {menuCats.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveMenuCat(cat)}
                      className={`rounded-2xl px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                        activeMenuCat === cat ? "bg-slate-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {/* Product grid */}
                <div className="grid max-h-[420px] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
                  {gridProducts.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => handleProductClick(p)}
                      disabled={!isProductSellable(p)}
                      className={`relative group text-left rounded-2xl border p-3 transition-all ${
                        !isProductSellable(p)
                          ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                          : "border-stone-200 bg-white hover:border-slate-300 hover:bg-stone-50 active:scale-95"
                      }`}
                    >
                      {p.modifiers?.length > 0 && (
                        <Star className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      )}
                      <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{p.name}</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">Rs. {p.sellingPrice}</p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {p.trackStock === false || (Array.isArray(p.recipe) && p.recipe.length > 0)
                          ? "Ready to bill"
                          : `Stock: ${p.stockQty}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cart */}
            <div className="panel overflow-hidden p-0">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Cart ({cart.length} items)</span>
              </div>
              {cart.length === 0 ? (
                <div className="p-4">
                  <EmptyCard
                    icon={ShoppingCart}
                    title="Add products to start billing"
                    message="Search for an item or tap from the menu grid to build the bill."
                  />
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {cart.map((c) => (
                    <div key={c._key} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                        {c.modifiers?.length > 0 && (
                          <p className="text-xs text-indigo-500">{c.modifiers.map((m) => m.option).join(", ")}</p>
                        )}
                        {c.notes && <p className="text-xs text-rose-500 italic">{c.notes}</p>}
                        <p className="text-xs text-gray-400">Rs. {c.price} each</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(c._key, -1)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold">{c.qty}</span>
                        <button onClick={() => updateQty(c._key, 1)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 w-20 text-right">
                        Rs. {(c.price * c.qty).toFixed(0)}
                      </p>
                      <button onClick={() => removeItem(c._key)} className="p-1 hover:bg-red-50 rounded-lg text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT: Payment panel ─── */}
          <div className="space-y-4 lg:sticky lg:top-24">
            {/* Table selector (dine-in only) */}
            {activeOrderType === "dine-in" && (
              <div className="panel p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Table2 className="w-4 h-4" /> Select Table *
                </h3>
                {selectedTable ? (
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-indigo-900">Table #{selectedTable.number}</p>
                      {selectedTable.reservation?.customerName && (
                        <p className="mt-1 text-[11px] font-medium text-amber-700">
                          Reserved for {selectedTable.reservation.customerName}
                          {selectedTable.reservation.reservationAt
                            ? ` at ${formatDateTimeNepal(selectedTable.reservation.reservationAt)}`
                            : ""}
                        </p>
                      )}
                      <p className="text-xs text-indigo-600">{selectedTable.section} · {selectedTable.capacity} seats</p>
                    </div>
                    <button onClick={() => setSelectedTable(null)} className="p-1 text-indigo-400 hover:text-indigo-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
                    {availableTables.map((t) => {
                      const isReserved = t.status === "reserved";
                      return (
                        <button
                          key={t._id}
                          onClick={() => setSelectedTable(t)}
                          className={`rounded-xl p-2 text-center transition-colors ${
                            isReserved
                              ? "border border-amber-200 bg-amber-50 hover:bg-amber-100"
                              : "border border-green-200 bg-green-50 hover:bg-green-100"
                          }`}
                        >
                          <p className={`text-base font-bold ${isReserved ? "text-amber-700" : "text-green-700"}`}>{t.number}</p>
                          <p className={`text-[9px] ${isReserved ? "text-amber-500" : "text-green-500"}`}>
                            {isReserved ? "Reserved" : `${t.capacity}p`}
                          </p>
                        </button>
                      );
                    })}
                    {availableTables.length === 0 && <p className="col-span-4 text-xs text-gray-400 text-center py-4">No tables available</p>}
                  </div>
                )}
              </div>
            )}

            {/* Delivery address */}
            {activeOrderType === "delivery" && (
              <div className="panel p-4">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <Bike className="w-4 h-4" /> Delivery Address
                </label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            )}

            {/* Customer */}
            <div className="panel p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer</h3>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-indigo-900 text-sm">{selectedCustomer.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                        {isWalkInSelection
                          ? "Walk-in"
                          : String(selectedCustomer.customerType || "regular").replace(/_/g, " ")}
                      </span>
                      {selectedCustomer.phone ? (
                        <span className="text-xs text-indigo-700">{selectedCustomer.phone}</span>
                      ) : null}
                      {hasSelectedCustomerAccount ? (
                        <span className="text-xs text-indigo-600">{selectedCustomer.loyaltyPoints || 0} pts</span>
                      ) : null}
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setLoyaltyRedeem(0); }} className="p-1 text-indigo-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer({
                          _id: null,
                          name: "Walk-in Customer",
                          customerType: "walk_in",
                          loyaltyPoints: 0,
                        });
                        setCustomerSearch("");
                        setShowCustomerDropdown(false);
                        setShowQuickCustomerForm(false);
                        setLoyaltyRedeem(0);
                      }}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                    >
                      Walk-in
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickCustomerForm(current => !current)
                        setQuickCustomer(buildQuickCustomerSeed(customerSearch))
                      }}
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100"
                    >
                      Quick add
                    </button>
                  </div>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customer by name or phone..."
                      value={customerSearch}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setCustomerSearch(nextValue);
                        if (!showQuickCustomerForm) {
                          setQuickCustomer(buildQuickCustomerSeed(nextValue));
                        }
                        setShowCustomerDropdown(true);
                        if (!nextValue.trim()) {
                          setShowQuickCustomerForm(false);
                        }
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {showCustomerDropdown && customerSearch && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
                        {customerResults.length > 0 ? (
                          customerResults.map((c) => (
                            <button
                              key={c._id}
                              onClick={() => {
                                setSelectedCustomer(c);
                                setCustomerSearch("");
                                setShowCustomerDropdown(false);
                                setShowQuickCustomerForm(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm"
                            >
                              <span className="font-medium text-gray-900">{c.name}</span>
                              {c.phone ? (
                                <span className="text-gray-400 ml-2 text-xs">{c.phone}</span>
                              ) : null}
                              <span className="text-xs text-indigo-500 ml-2">
                                {c.loyaltyPoints || 0} pts
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-xs text-gray-500">
                            No matching customer found.
                          </div>
                        )}
                        <div className="border-t border-gray-100 bg-gray-50/80">
                          {!showQuickCustomerForm ? (
                            <button
                              type="button"
                              onClick={() => {
                                setShowQuickCustomerForm(true);
                                setQuickCustomer(buildQuickCustomerSeed(customerSearch));
                              }}
                              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                            >
                              <span>Create quick customer</span>
                              <Plus className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                  {showQuickCustomerForm ? (
                    <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={quickCustomer.name}
                          onChange={(e) =>
                            setQuickCustomer((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Name"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={quickCustomer.phone}
                          onChange={(e) =>
                            setQuickCustomer((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="Phone"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowQuickCustomerForm(false)}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickCustomerCreate}
                          disabled={
                            quickCustomerMut.isPending ||
                            (!quickCustomer.name.trim() &&
                              !quickCustomer.phone.trim())
                          }
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {quickCustomerMut.isPending ? "Saving..." : "Create"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Loyalty redemption */}
              {hasSelectedCustomerAccount && (selectedCustomer.loyaltyPoints || 0) > 0 && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl">
                  <p className="text-xs font-medium text-amber-800 mb-1.5">Redeem loyalty points</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={selectedCustomer.loyaltyPoints || 0}
                      value={loyaltyRedeem}
                      onChange={(e) => setLoyaltyRedeem(Math.min(Number(e.target.value), selectedCustomer.loyaltyPoints || 0))}
                      className="w-24 px-2 py-1.5 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                    />
                    <span className="text-xs text-amber-700">pts = Rs. {(loyaltyRedeem * 0.5).toFixed(2)} off</span>
                  </div>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="panel space-y-2 p-4">
              {checkoutIssues.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="space-y-1">
                      {checkoutIssues.map(issue => (
                        <p key={issue}>{issue}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>{formatShortCurrencyNpr(totals.subtotal)}</span>
              </div>
              {totals.itemDiscountTotal > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>Item discounts</span><span>- {formatShortCurrencyNpr(totals.itemDiscountTotal)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Overall Discount</span>
                <input
                  type="number" min="0" value={overallDiscount}
                  onChange={(e) => setOverallDiscount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-right text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              {totals.loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm text-purple-600">
                  <span>Loyalty Discount</span><span>- {formatShortCurrencyNpr(totals.loyaltyDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax (VAT 13%)</span><span>{formatShortCurrencyNpr(totals.taxTotal)}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span className="text-indigo-600">{formatShortCurrencyNpr(totals.grandTotal)}</span>
              </div>
              {hasSelectedCustomerAccount && (
                <p className="text-xs text-amber-600">Will earn {totals.pointsEarned} loyalty points</p>
              )}
            </div>

            {/* Payment method */}
            <div className="panel p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2.5">Payment</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {paymentOptions.map(({ key, label }) => {
                  const Icon = PAYMENT_METHOD_ICONS[key]

                  return (
                    <button
                      key={key}
                      onClick={() => setPaymentMethod(key)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        paymentMethod === key ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  )
                })}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount Tendered</label>
                {paymentMethod === "credit" ? (
                  <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    This bill will stay on the customer account as due. Pick a customer before saving.
                  </div>
                ) : null}
                <input
                  type="number" min="0" step="0.01"
                  placeholder={paymentMethod === "credit" ? "Due sale" : totals.grandTotal.toFixed(2)}
                  value={paymentMethod === "credit" ? "" : paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  disabled={paymentMethod === "credit"}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {paymentMethod === "credit" ? null : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickTenderValues.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPaidAmount(String(value))}
                        className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-100"
                      >
                        Rs. {value.toFixed(0)}
                      </button>
                    ))}
                  </div>
                )}
                {paymentState.changeAmount > 0 && (
                  <p className="text-xs text-green-600 mt-1 font-medium">Change: {formatShortCurrencyNpr(paymentState.changeAmount)}</p>
                )}
                {paymentState.dueAmount > 0 && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">Due: {formatShortCurrencyNpr(paymentState.dueAmount)}</p>
                )}
              </div>
              <div className="mt-2">
                <input
                  type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Order notes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Checkout */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || saleMut.isPending || checkoutIssues.length > 0}
              className="btn-primary w-full justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saleMut.isPending
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Check className="w-5 h-5" />
              }
              {saleMut.isPending
                ? "Processing..."
                : paymentMethod === "credit"
                  ? `Save Due Sale  ${formatShortCurrencyNpr(totals.grandTotal)}`
                  : `Checkout  ${formatShortCurrencyNpr(totals.grandTotal)}`}
            </button>
          </div>
        </div>
      </div>
    </WorkspacePage>
  );
}
