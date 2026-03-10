import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Package, 
  AlertTriangle,
  TrendingUp,
  Edit,
  Trash2,
  Search,
  DollarSign,
  X
} from 'lucide-react'
import api from './lib/axios'
import toast from 'react-hot-toast'

const InventoryPage = () => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [adjustingItem, setAdjustingItem] = useState(null)
  const [movements, setMovements] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantityDelta: '',
    reason: 'Wastage',
    note: ''
  })
  const [newItem, setNewItem] = useState({
    productName: '',
    quantity: '',
    costPrice: '',
    sellingPrice: '',
    category: '',
    supplier: '',
    lowStockAlert: '10',
    vatRate: '0',
    sku: ''
  })

  useEffect(() => {
    fetchInventory()
    fetchMovements()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const res = await api.get('/inventory')
      const payload = res.data?.data
      setInventory(Array.isArray(payload) ? payload : [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }
  const fetchMovements = async () => {
    try {
      const res = await api.get('/inventory/movements')
      setMovements(Array.isArray(res.data?.data) ? res.data.data : [])
    } catch (error) {
      console.error('Error fetching inventory movements:', error)
    }
  }

  const handleCreateItem = async (e) => {
    e.preventDefault()

    if (!newItem.productName || !newItem.quantity || !newItem.costPrice || !newItem.sellingPrice) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const res = await api.post('/inventory', {
        ...newItem,
        quantity: parseInt(newItem.quantity),
        costPrice: parseFloat(newItem.costPrice),
        sellingPrice: parseFloat(newItem.sellingPrice),
        lowStockAlert: parseInt(newItem.lowStockAlert),
        vatRate: parseFloat(newItem.vatRate) || 0,
        sku: newItem.sku
      })

      if (res.data.success) {
        const created = res.data?.data
        setInventory((prev) => {
          const safePrev = Array.isArray(prev) ? prev : []
          return created ? [created, ...safePrev] : safePrev
        })
        setNewItem({
          productName: '',
          quantity: '',
          costPrice: '',
          sellingPrice: '',
          category: '',
          supplier: '',
          lowStockAlert: '10',
          vatRate: '0',
          sku: ''
        })
        setShowAddForm(false)
        toast.success('Product added!')
        fetchMovements()
      }
    } catch (error) {
      console.error('Error creating item:', error)
      toast.error('Failed to add product')
    }
  }

  const handleUpdateItem = async (e) => {
    e.preventDefault()

    try {
      const res = await api.put(`/inventory/${editingItem._id}`, {
        ...editingItem,
        quantity: parseInt(editingItem.quantity),
        costPrice: parseFloat(editingItem.costPrice),
        sellingPrice: parseFloat(editingItem.sellingPrice),
        lowStockAlert: parseInt(editingItem.lowStockAlert)
      })

      if (res.data.success) {
        const updated = res.data?.data
        if (updated) {
          setInventory((prev) => (
            (Array.isArray(prev) ? prev : []).map(item => 
              item._id === editingItem._id ? updated : item
            )
          ))
        }
        setEditingItem(null)
        toast.success('Product updated!')
        fetchMovements()
      }
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update product')
    }
  }

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this product?')) return

    try {
      const res = await api.delete(`/inventory/${id}`)
      if (res.data.success) {
        setInventory((prev) => (
          Array.isArray(prev)
            ? prev.filter(item => item._id !== id)
            : []
        ))
        toast.success('Product deleted')
        fetchMovements()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete product')
    }
  }
  const handleAdjustItem = async (e) => {
    e.preventDefault()
    if (!adjustingItem) return

    try {
      const res = await api.post(`/inventory/${adjustingItem._id}/adjustments`, {
        quantityDelta: parseFloat(adjustmentForm.quantityDelta),
        reason: adjustmentForm.reason,
        note: adjustmentForm.note
      })

      if (res.data.success) {
        const updated = res.data?.data
        if (updated) {
          setInventory((prev) => (
            (Array.isArray(prev) ? prev : []).map(item =>
              item._id === updated._id ? updated : item
            )
          ))
        }
        setAdjustingItem(null)
        setAdjustmentForm({ quantityDelta: '', reason: 'Wastage', note: '' })
        fetchMovements()
        toast.success('Inventory adjusted')
      }
    } catch (error) {
      console.error('Error adjusting inventory:', error)
      toast.error(error.response?.data?.message || 'Failed to adjust inventory')
    }
  }

  const safeInventory = Array.isArray(inventory) ? inventory : []
  const filteredInventory = safeInventory.filter(item =>
    (item.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.supplier || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalProducts: safeInventory.length,
    totalValue: safeInventory.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0),
    lowStock: safeInventory.filter(item => item.quantity <= item.lowStockAlert).length,
    totalProfit: safeInventory.reduce((sum, item) => sum + ((item.sellingPrice - item.costPrice) * item.quantity), 0)
  }

  if (loading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ml-64 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p className="text-gray-600">Track and manage your shop's product inventory.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{'\u20B9'}{stats.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Potential Profit</p>
              <p className="text-2xl font-bold text-gray-900">{'\u20B9'}{stats.totalProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingItem) && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingItem ? 'Edit Product' : 'Add New Product'}
          </h3>
          <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={editingItem ? editingItem.productName : newItem.productName}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, productName: e.target.value })
                    : setNewItem({ ...newItem, productName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={editingItem ? editingItem.category : newItem.category}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, category: e.target.value })
                    : setNewItem({ ...newItem, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Electronics, Clothing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  value={editingItem ? editingItem.quantity : newItem.quantity}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, quantity: e.target.value })
                    : setNewItem({ ...newItem, quantity: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Alert</label>
                <input
                  type="number"
                  value={editingItem ? editingItem.lowStockAlert : newItem.lowStockAlert}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, lowStockAlert: e.target.value })
                    : setNewItem({ ...newItem, lowStockAlert: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="10"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price ({'\u20B9'}) *</label>
                <input
                  type="number"
                  value={editingItem ? editingItem.costPrice : newItem.costPrice}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, costPrice: e.target.value })
                    : setNewItem({ ...newItem, costPrice: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price ({'\u20B9'}) *</label>
                <input
                  type="number"
                  value={editingItem ? editingItem.sellingPrice : newItem.sellingPrice}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, sellingPrice: e.target.value })
                    : setNewItem({ ...newItem, sellingPrice: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">VAT Rate (%)</label>
                <input
                  type="number"
                  value={editingItem ? editingItem.vatRate : newItem.vatRate}
                  onChange={(e) => editingItem
                    ? setEditingItem({ ...editingItem, vatRate: e.target.value })
                    : setNewItem({ ...newItem, vatRate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0"
                  step="0.01"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                <input
                  type="text"
                  value={editingItem ? editingItem.sku : newItem.sku}
                  onChange={(e) => editingItem
                    ? setEditingItem({ ...editingItem, sku: e.target.value })
                    : setNewItem({ ...newItem, sku: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., SKU-001"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                <input
                  type="text"
                  value={editingItem ? editingItem.supplier : newItem.supplier}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, supplier: e.target.value })
                    : setNewItem({ ...newItem, supplier: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Supplier name"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
              >
                {editingItem ? 'Update Product' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingItem(null)
                }}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {adjustingItem && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Adjust Inventory</h3>
              <p className="text-sm text-gray-500">{adjustingItem.productName}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAdjustingItem(null)
                setAdjustmentForm({ quantityDelta: '', reason: 'Wastage', note: '' })
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAdjustItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Change</label>
              <input
                type="number"
                step="0.001"
                value={adjustmentForm.quantityDelta}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantityDelta: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="-2 for wastage, 3 for correction"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <input
                type="text"
                value={adjustmentForm.reason}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Wastage, stock count, damage..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
              <input
                type="text"
                value={adjustmentForm.note}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, note: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Optional note"
              />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
              >
                Save Adjustment
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustingItem(null)
                  setAdjustmentForm({ quantityDelta: '', reason: 'Wastage', note: '' })
                }}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Table */}
      {filteredInventory.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try a different search term' : 'Start by adding your first product to inventory'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
            >
              Add First Product
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit/Unit</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">VAT%</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const profit = item.sellingPrice - item.costPrice
                  const isLowStock = item.quantity <= item.lowStockAlert

                  return (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{item.productName}</span>
                          {isLowStock && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700">
                              <AlertTriangle className="w-3 h-3" />
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.category || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-semibold ${
                          isLowStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">{'\u20B9'}{item.costPrice.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">{'\u20B9'}{item.sellingPrice.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-semibold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {'\u20B9'}{profit.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{item.vatRate || 0}%</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.sku || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.supplier || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAdjustingItem(item)}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Adjust"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Stock Activity</h3>
          <p className="text-sm text-gray-500">Manual wastage, corrections, and purchase-driven stock changes.</p>
        </div>
        {movements.length === 0 ? (
          <p className="text-sm text-gray-500">No stock activity recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {movements.slice(0, 8).map((movement) => (
              <div key={movement._id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {movement.inventoryItemId?.productName || 'Inventory item'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {movement.reason || 'Stock update'}
                    {movement.note ? ` · ${movement.note}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${movement.type === 'OUT' ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {movement.type === 'OUT' ? '-' : '+'}{movement.qty}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(movement.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryPage


