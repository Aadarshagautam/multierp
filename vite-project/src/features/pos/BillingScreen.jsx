import React, { useState, useRef, useEffect, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote,
  Smartphone, UserPlus, X, Check, Printer, Utensils, Package, Bike,
  ChevronDown, Star, Table2,
} from "lucide-react";
import toast from "react-hot-toast";
import { posProductApi, posCustomerApi, posSaleApi, posTableApi } from "../../api/posApi";
import PrintableInvoice from "./components/PrintableInvoice";
import { getBusinessPosMeta } from "../../config/businessConfigs.js";
import AppContext from "../../context/app-context.js";
import { POS_PAYMENT_METHODS, formatDateTimeNepal } from "../../utils/nepal.js";

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
    queryFn: () => posCustomerApi.list({ search: customerSearch }),
    enabled: customerSearch.length > 0,
  });
  const customerResults = customerData?.data || [];

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
      qc.invalidateQueries({ queryKey: ["pos-stats"] });
      qc.invalidateQueries({ queryKey: ["pos-tables"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Sale failed"),
  });

  // ─── Cart helpers ───
  const cartKey = (productId, modifiers) =>
    productId + "-" + JSON.stringify(modifiers || []);

  const addToCart = (product, qty = 1, modifiers = [], note = "") => {
    setSearch("");
    const key = cartKey(product._id, modifiers);
    const existing = cart.find((c) => c._key === key);
    if (existing && modifiers.length === 0) {
      setCart(cart.map((c) => c._key === key ? { ...c, qty: c.qty + qty } : c));
    } else {
      const extraPrice = modifiers.reduce((s, m) => s + (m.price || 0), 0);
      setCart([...cart, {
        _key: key,
        productId: product._id,
        name: product.name,
        sku: product.sku || "",
        price: product.sellingPrice + extraPrice,
        taxRate: product.taxRate,
        qty,
        discount: 0,
        stockQty: product.stockQty,
        modifiers,
        notes: note,
        hasModifiers: product.modifiers?.length > 0,
      }]);
    }
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
    setCart(cart.map((c) => {
      if (c._key === key) {
        const q = c.qty + delta;
        return q <= 0 ? null : { ...c, qty: q };
      }
      return c;
    }).filter(Boolean));
  };

  const removeItem = (key) => setCart(cart.filter((c) => c._key !== key));

  // ─── Totals ───
  const LOYALTY_POINT_VALUE = 0.5;
  const LOYALTY_EARN_RATE = 1;

  const subTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const lineDiscounts = cart.reduce((s, c) => s + (c.discount || 0), 0);
  const loyaltyDiscount = Math.round((loyaltyRedeem * LOYALTY_POINT_VALUE) * 100) / 100;
  const taxTotal = cart.reduce((s, c) => {
    const net = c.price * c.qty - (c.discount || 0);
    return s + (net * c.taxRate) / 100;
  }, 0);
  const grandTotal = Math.max(0, Math.round((subTotal - lineDiscounts - overallDiscount - loyaltyDiscount + taxTotal) * 100) / 100);
  const paid = paidAmount === "" ? grandTotal : Number(paidAmount);
  const change = paid - grandTotal;
  const pointsEarned = Math.floor(grandTotal * LOYALTY_EARN_RATE);

  const handleCheckout = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (activeOrderType === "dine-in" && !selectedTable) return toast.error("Please select a table");
    saleMut.mutate({
      items: cart.map((c) => ({
        productId: c.productId,
        qty: c.qty,
        price: c.price,
        discount: c.discount || 0,
        modifiers: c.modifiers || [],
        notes: c.notes || "",
      })),
      paymentMethod,
      paidAmount: paid,
      customerId: selectedCustomer?._id || null,
      overallDiscount,
      notes,
      orderType: activeOrderType,
      tableId: activeOrderType === "dine-in" ? selectedTable?._id || null : null,
      deliveryAddress,
      loyaltyPointsRedeemed: loyaltyRedeem,
    });
  };

  if (completedSale) {
    return (
      <div className="p-4 lg:pl-[17.5rem] pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h2 className="text-xl font-bold text-gray-900">Sale Complete</h2>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={() => setCompletedSale(null)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-semibold">
                <Plus className="w-4 h-4" /> New Sale
              </button>
            </div>
          </div>
          <PrintableInvoice sale={completedSale} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:pl-[17.5rem] pt-20 min-h-screen bg-gray-50/50">
      {modifierTarget && (
        <ModifierModal
          product={modifierTarget}
          onConfirm={({ qty, modifiers, notes: note }) => addToCart(modifierTarget, qty, modifiers, note)}
          onClose={() => setModifierTarget(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {branchName && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
            <Table2 className="h-3.5 w-3.5" />
            Billing branch: {branchName}
          </div>
        )}

        {/* Order type tabs */}
        <div className="mb-4 flex gap-2">
          {orderTypeOptions.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setOrderType(key); if (key !== "dine-in") setSelectedTable(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                activeOrderType === key ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ─── LEFT: Products ─── */}
          <div className="lg:col-span-2 space-y-3">
            {/* Search */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search product by name, SKU or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {search && searchResults.length > 0 && (
                <div className="mt-2 border border-gray-100 rounded-xl max-h-52 overflow-y-auto divide-y divide-gray-50">
                  {searchResults.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => handleProductClick(p)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sku || "No SKU"} · Stock: {p.stockQty}</p>
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
                {/* Category pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
                  {menuCats.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveMenuCat(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                        activeMenuCat === cat ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {/* Product grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[340px] overflow-y-auto">
                  {gridProducts.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => handleProductClick(p)}
                      disabled={!p.isAvailable || p.stockQty === 0}
                      className={`relative group text-left rounded-xl border p-2.5 transition-all ${
                        !p.isAvailable || p.stockQty === 0
                          ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                          : "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 active:scale-95"
                      }`}
                    >
                      {p.modifiers?.length > 0 && (
                        <Star className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      )}
                      <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{p.name}</p>
                      <p className="text-xs text-indigo-600 font-bold mt-1">Rs. {p.sellingPrice}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Stock: {p.stockQty}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Cart ({cart.length} items)</span>
              </div>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                  <ShoppingCart className="w-10 h-10 mb-2" />
                  <p className="text-sm">Add products to cart</p>
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
          <div className="space-y-3">
            {/* Table selector (dine-in only) */}
            {activeOrderType === "dine-in" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer</h3>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-indigo-900 text-sm">{selectedCustomer.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        selectedCustomer.tier === "platinum" ? "bg-purple-100 text-purple-700"
                        : selectedCustomer.tier === "gold" ? "bg-amber-100 text-amber-700"
                        : selectedCustomer.tier === "silver" ? "bg-gray-200 text-gray-700"
                        : "bg-orange-100 text-orange-700"
                      }`}>
                        {selectedCustomer.tier?.toUpperCase()}
                      </span>
                      <span className="text-xs text-indigo-600">{selectedCustomer.loyaltyPoints || 0} pts</span>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setLoyaltyRedeem(0); }} className="p-1 text-indigo-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customer..."
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {showCustomerDropdown && customerSearch && customerResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
                      {customerResults.map((c) => (
                        <button
                          key={c._id}
                          onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setShowCustomerDropdown(false); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm"
                        >
                          <span className="font-medium text-gray-900">{c.name}</span>
                          {c.phone && <span className="text-gray-400 ml-2 text-xs">{c.phone}</span>}
                          <span className="text-xs text-indigo-500 ml-2">{c.loyaltyPoints || 0} pts</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Loyalty redemption */}
              {selectedCustomer && (selectedCustomer.loyaltyPoints || 0) > 0 && (
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>Rs. {subTotal.toFixed(2)}</span>
              </div>
              {lineDiscounts > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>Discounts</span><span>- Rs. {lineDiscounts.toFixed(2)}</span>
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
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm text-purple-600">
                  <span>Loyalty Discount</span><span>- Rs. {loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax (VAT 13%)</span><span>Rs. {taxTotal.toFixed(2)}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span className="text-indigo-600">Rs. {grandTotal.toFixed(2)}</span>
              </div>
              {selectedCustomer && (
                <p className="text-xs text-amber-600">Will earn {pointsEarned} loyalty points</p>
              )}
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2.5">Payment</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {POS_PAYMENT_METHODS.map(({ key, label }) => {
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
                <input
                  type="number" min="0" step="0.01"
                  placeholder={grandTotal.toFixed(2)}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {paid > grandTotal && (
                  <p className="text-xs text-green-600 mt-1 font-medium">Change: Rs. {change.toFixed(2)}</p>
                )}
                {paidAmount !== "" && paid < grandTotal && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">Due: Rs. {(grandTotal - paid).toFixed(2)}</p>
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
              disabled={cart.length === 0 || saleMut.isPending || (orderType === "dine-in" && !selectedTable)}
              className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200"
            >
              {saleMut.isPending
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Check className="w-5 h-5" />
              }
              {saleMut.isPending ? "Processing..." : `Checkout  Rs. ${grandTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
