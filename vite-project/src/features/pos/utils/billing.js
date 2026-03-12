const roundMoney = value =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100

const HELD_BILLS_STORAGE_KEY = 'erp-pos-held-bills:v1'

export const LOYALTY_POINT_VALUE = 0.5
export const LOYALTY_EARN_RATE = 1

export const calculateCartTotals = ({
  cart = [],
  overallDiscount = 0,
  loyaltyRedeem = 0,
} = {}) => {
  const safeCart = Array.isArray(cart) ? cart : []
  const subtotal = roundMoney(
    safeCart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0)
  )
  const itemDiscountTotal = roundMoney(
    safeCart.reduce((sum, item) => sum + (Number(item.discount) || 0), 0)
  )
  const taxTotal = roundMoney(
    safeCart.reduce((sum, item) => {
      const lineNet = Math.max(
        0,
        (Number(item.price) || 0) * (Number(item.qty) || 0) - (Number(item.discount) || 0)
      )
      return sum + lineNet * ((Number(item.taxRate) || 0) / 100)
    }, 0)
  )
  const overallDiscountAmount = roundMoney(Math.max(0, Number(overallDiscount) || 0))
  const loyaltyDiscount = roundMoney(Math.max(0, Number(loyaltyRedeem) || 0) * LOYALTY_POINT_VALUE)
  const discountTotal = roundMoney(itemDiscountTotal + overallDiscountAmount + loyaltyDiscount)
  const grandTotal = roundMoney(
    Math.max(0, subtotal - itemDiscountTotal - overallDiscountAmount - loyaltyDiscount + taxTotal)
  )

  return {
    subtotal,
    itemDiscountTotal,
    overallDiscountAmount,
    loyaltyDiscount,
    discountTotal,
    taxTotal,
    grandTotal,
    pointsEarned: Math.max(0, Math.floor(grandTotal * LOYALTY_EARN_RATE)),
  }
}

export const calculateTenderState = ({
  grandTotal = 0,
  amountTendered = '',
  paymentMethod = 'cash',
} = {}) => {
  const normalizedGrandTotal = roundMoney(Math.max(0, Number(grandTotal) || 0))
  const isCredit = paymentMethod === 'credit'
  const normalizedTender = isCredit
    ? 0
    : amountTendered === '' || amountTendered === null || amountTendered === undefined
      ? normalizedGrandTotal
      : roundMoney(Math.max(0, Number(amountTendered) || 0))
  const appliedAmount = isCredit
    ? 0
    : Math.min(normalizedTender, normalizedGrandTotal)
  const dueAmount = roundMoney(Math.max(0, normalizedGrandTotal - appliedAmount))
  const changeAmount = isCredit
    ? 0
    : roundMoney(Math.max(0, normalizedTender - normalizedGrandTotal))

  return {
    receivedAmount: normalizedTender,
    paidAmount: roundMoney(appliedAmount),
    dueAmount,
    changeAmount,
  }
}

export const buildQuickTenderValues = grandTotal =>
  Array.from(
    new Set(
      [
        grandTotal,
        Math.ceil(grandTotal / 100) * 100,
        Math.ceil(grandTotal / 500) * 500,
        Math.ceil(grandTotal / 1000) * 1000,
      ]
        .filter(value => Number.isFinite(value) && value > 0)
        .map(value => Number(roundMoney(value).toFixed(0)))
    )
  ).slice(0, 4)

export const buildPosSalePayload = ({
  cart = [],
  paymentMethod = 'cash',
  paymentState = {},
  selectedCustomer = null,
  overallDiscount = 0,
  notes = '',
  orderType = 'takeaway',
  selectedTable = null,
  deliveryAddress = '',
  loyaltyRedeem = 0,
} = {}) => ({
  items: (Array.isArray(cart) ? cart : []).map(item => ({
    productId: item.productId,
    qty: item.qty,
    price: item.basePrice ?? item.price,
    discount: item.discount || 0,
    modifiers: item.modifiers || [],
    notes: item.notes || '',
  })),
  paymentMethod,
  payments:
    paymentMethod === 'credit'
      ? []
      : [
          {
            method: paymentMethod,
            amount: paymentState.receivedAmount ?? paymentState.paidAmount ?? 0,
          },
        ],
  paidAmount:
    paymentMethod === 'credit'
      ? 0
      : paymentState.receivedAmount ?? paymentState.paidAmount ?? 0,
  customerId:
    selectedCustomer?._id && selectedCustomer?.customerType !== 'walk_in'
      ? selectedCustomer._id
      : null,
  overallDiscount,
  notes,
  orderType,
  tableId: orderType === 'dine-in' ? selectedTable?._id || null : null,
  deliveryAddress,
  loyaltyPointsRedeemed: loyaltyRedeem,
})

export const getCheckoutIssues = ({
  cart = [],
  orderType = 'takeaway',
  selectedTable = null,
  paymentMethod = 'cash',
  selectedCustomer = null,
  paymentState = {},
} = {}) => {
  const issues = []
  const hasCustomerAccount =
    Boolean(selectedCustomer?._id) && selectedCustomer?.customerType !== 'walk_in'

  if (!Array.isArray(cart) || cart.length === 0) {
    issues.push('Add at least one product to the cart.')
  }

  if (orderType === 'dine-in' && !selectedTable) {
    issues.push('Select a table before checkout.')
  }

  if (paymentState.dueAmount > 0 && !hasCustomerAccount) {
    issues.push('Select a customer before keeping any due amount.')
  }

  if (paymentState.dueAmount > 0 && !['credit', 'mixed'].includes(paymentMethod)) {
    issues.push('Use credit payment to keep a due balance.')
  }

  return issues
}

export const findExactProductMatch = (products = [], search = '') => {
  const trimmed = search.trim().toLowerCase()
  if (!trimmed) return null

  return (Array.isArray(products) ? products : []).find(product => {
    const candidates = [product.barcode, product.sku, product.code, product.name]
      .map(value => String(value || '').trim().toLowerCase())
      .filter(Boolean)
    return candidates.includes(trimmed)
  }) || null
}

export const readHeldBills = () => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(HELD_BILLS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const createHeldBillSnapshot = ({
  cart = [],
  paymentMethod = 'cash',
  paidAmount = '',
  selectedCustomer = null,
  overallDiscount = 0,
  notes = '',
  orderType = 'takeaway',
  selectedTable = null,
  deliveryAddress = '',
  loyaltyRedeem = 0,
} = {}) => {
  const totals = calculateCartTotals({
    cart,
    overallDiscount,
    loyaltyRedeem,
  })

  return {
    id: `held-${Date.now()}`,
    heldAt: new Date().toISOString(),
    cart,
    paymentMethod,
    paidAmount,
    selectedCustomer,
    overallDiscount,
    notes,
    orderType,
    selectedTable,
    deliveryAddress,
    loyaltyRedeem,
    summary: {
      itemCount: (Array.isArray(cart) ? cart : []).reduce(
        (sum, item) => sum + (Number(item.qty) || 0),
        0
      ),
      grandTotal: totals.grandTotal,
      customerName: selectedCustomer?.name || 'Walk-in Customer',
    },
  }
}

export const saveHeldBill = snapshot => {
  if (typeof window === 'undefined' || !snapshot) return []

  const currentBills = readHeldBills()
  const nextBills = [snapshot, ...currentBills].slice(0, 12)
  window.localStorage.setItem(HELD_BILLS_STORAGE_KEY, JSON.stringify(nextBills))
  return nextBills
}

export const removeHeldBill = heldBillId => {
  if (typeof window === 'undefined') return []

  const nextBills = readHeldBills().filter(bill => bill.id !== heldBillId)
  window.localStorage.setItem(HELD_BILLS_STORAGE_KEY, JSON.stringify(nextBills))
  return nextBills
}
