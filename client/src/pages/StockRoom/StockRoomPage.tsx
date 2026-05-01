import React, { useState, useEffect, useCallback } from 'react';
import { stockRoomService } from '../../services/stockRoomService';
import { categoryService } from '../../services/inventoryService';
import { inventoryService } from '../../services/inventoryService';
import type { StockRoomProduct, StockRoomStats, ComputedStatus } from '../../types/stockRoom';
import type { Category, Product } from '../../types/product';
import { formatCurrency } from '../../utils/formatCurrency';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';

/* ── helpers ── */
const STATUS_COLORS: Record<ComputedStatus, string> = {
  available:   'bg-green-100 text-green-700',
  low_stock:   'bg-orange-100 text-orange-700',
  out_of_stock:'bg-red-100 text-red-700',
  reserved:    'bg-blue-100 text-blue-700',
  damaged:     'bg-gray-200 text-gray-700',
  hold:        'bg-yellow-100 text-yellow-700',
};
const STATUS_LABEL: Record<ComputedStatus, string> = {
  available:'Available', low_stock:'Low Stock', out_of_stock:'Out of Stock',
  reserved:'Reserved', damaged:'Damaged', hold:'Hold',
};

const emptyForm = {
  name:'', sku:'', description:'', category_id:'', supplier:'',
  cost_price:'', selling_price:'', quantity:'', low_stock_threshold:'5',
  status:'available' as string, added_by:'', notes:'',
};

export const StockRoomPage: React.FC = () => {
  const [products, setProducts]     = useState<StockRoomProduct[]>([]);
  const [stats, setStats]           = useState<StockRoomStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [invProducts, setInvProducts] = useState<Product[]>([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // modals
  const [showForm, setShowForm]         = useState(false);
  const [showAdjust, setShowAdjust]     = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showHistory, setShowHistory]   = useState(false);
  const [isEdit, setIsEdit]             = useState(false);
  const [selected, setSelected]         = useState<StockRoomProduct | null>(null);
  const [transferHistory, setTransferHistory]   = useState<any[]>([]);
  const [adjustHistory, setAdjustHistory]       = useState<any[]>([]);
  const [historyTab, setHistoryTab]             = useState<'transfer'|'adjust'>('transfer');

  const [form, setForm]                 = useState({ ...emptyForm });
  const [adjustForm, setAdjustForm]     = useState({ type:'add', quantity:'', adjusted_by:'', notes:'' });
  const [transferForm, setTransferForm] = useState({ quantity:'', inventory_product_id:'', transferred_by:'', notes:'' });

  const fetchAll = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([
        stockRoomService.getProducts({ search: search||undefined, category_id: catFilter ? +catFilter : undefined, status: statusFilter||undefined }),
        stockRoomService.getStats(),
      ]);
      setProducts(Array.isArray(p.data) ? p.data : p);
      setStats(s);
    } catch { /* ignore */ }
  }, [search, catFilter, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {});
    inventoryService.getProducts().then(d => setInvProducts(Array.isArray(d.data) ? d.data : d)).catch(() => {});
  }, []);

  /* ── form handlers ── */
  const openAdd = () => { setForm({ ...emptyForm }); setIsEdit(false); setShowForm(true); };
  const openEdit = (p: StockRoomProduct) => {
    setSelected(p);
    setForm({ name:p.name, sku:p.sku||'', description:p.description||'', category_id:String(p.category_id),
      supplier:p.supplier||'', cost_price:String(p.cost_price), selling_price:String(p.selling_price),
      quantity:String(p.quantity), low_stock_threshold:String(p.low_stock_threshold), status:p.status,
      added_by:p.added_by||'', notes:p.notes||'' });
    setIsEdit(true); setShowForm(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: any = { ...form, category_id:+form.category_id, cost_price:+form.cost_price,
        selling_price:+form.selling_price, quantity:+form.quantity, low_stock_threshold:+form.low_stock_threshold };
      if (isEdit && selected) await stockRoomService.updateProduct(selected.id, payload);
      else await stockRoomService.createProduct(payload);
      setShowForm(false); fetchAll();
    } catch (e:any) { alert(e.response?.data?.message || 'Error saving product'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (p: StockRoomProduct) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await stockRoomService.deleteProduct(p.id); fetchAll();
  };

  const handleAdjust = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await stockRoomService.adjust(selected.id, adjustForm.type as any, +adjustForm.quantity, adjustForm.adjusted_by, adjustForm.notes);
      setShowAdjust(false); fetchAll();
    } catch (e:any) { alert(e.response?.data?.message || 'Error adjusting'); }
    finally { setLoading(false); }
  };

  const handleTransfer = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await stockRoomService.transfer(selected.id, {
        quantity: +transferForm.quantity,
        inventory_product_id: transferForm.inventory_product_id ? +transferForm.inventory_product_id : undefined,
        transferred_by: transferForm.transferred_by,
        notes: transferForm.notes,
      });
      setShowTransfer(false); fetchAll();
    } catch (e:any) { alert(e.response?.data?.message || 'Error transferring'); }
    finally { setLoading(false); }
  };

  const openHistory = async (p: StockRoomProduct) => {
    setSelected(p);
    const [t, a] = await Promise.all([
      stockRoomService.getTransferHistory(p.id),
      stockRoomService.getAdjustHistory(p.id)
    ]);
    setTransferHistory(t);
    setAdjustHistory(a);
    setHistoryTab('transfer');
    setShowHistory(true);
  };

  const handleStatusChange = async (p: StockRoomProduct, status: string) => {
    await stockRoomService.updateStatus(p.id, status); fetchAll();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Stock Room</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Manage backroom inventory before transferring to selling floor</p>
        </div>
        <Button onClick={openAdd}>+ Add Stock Item</Button>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label:'Total Items', value:stats.total, color:'text-blue-600 dark:text-blue-400', bg:'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' },
            { label:'Low Stock', value:stats.lowStock, color:'text-orange-600 dark:text-orange-400', bg:'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700' },
            { label:'Out of Stock', value:stats.outOfStock, color:'text-red-600 dark:text-red-400', bg:'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' },
            { label:'Reserved', value:stats.reserved, color:'text-indigo-600 dark:text-indigo-400', bg:'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700' },
            { label:'Damaged', value:stats.damaged, color:'text-gray-600 dark:text-gray-400', bg:'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600' },
            { label:'Total Value', value:formatCurrency(stats.totalValue), color:'text-green-600 dark:text-green-400', bg:'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' },
          ].map(c => (
            <div key={c.label} className={`p-4 rounded-lg border ${c.bg}`}>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 relative min-w-[200px]">
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          <input type="text" placeholder="Search by name, SKU, supplier..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="reserved">Reserved</option>
          <option value="damaged">Damaged</option>
          <option value="hold">Hold</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-900/50">
              <tr>
                {['Product', 'Category', 'Supplier', 'Cost Price', 'Selling Price', 'Quantity', 'Status', 'Added By', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {products.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                  No stock room items found. Click "+ Add Stock Item" to get started.
                </td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-slate-200">{p.name}</div>
                    {p.sku && <div className="text-xs text-gray-400 dark:text-slate-500">SKU: {p.sku}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{p.supplier || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-300">{formatCurrency(p.cost_price)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(p.selling_price)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-lg ${p.quantity <= 0 ? 'text-red-600' : p.quantity <= p.low_stock_threshold ? 'text-orange-600' : 'text-gray-800 dark:text-slate-200'}`}>
                      {p.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[p.computed_status]}`}>
                      {STATUS_LABEL[p.computed_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{p.added_by || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => openEdit(p)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium">Edit</button>
                      <button onClick={() => { setSelected(p); setAdjustForm({ type:'add', quantity:'', adjusted_by:'', notes:'' }); setShowAdjust(true); }}
                        className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-medium">Adjust</button>
                      <button onClick={() => { setSelected(p); setTransferForm({ quantity:'', inventory_product_id:'', transferred_by:'', notes:'' }); setShowTransfer(true); }}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium">Transfer</button>
                      <button onClick={() => openHistory(p)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium">History</button>
                      <select value={p.status} onChange={e => handleStatusChange(p, e.target.value)}
                        className="px-1 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded dark:bg-slate-700 dark:text-white">
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="damaged">Damaged</option>
                        <option value="hold">Hold</option>
                      </select>
                      <button onClick={() => handleDelete(p)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={isEdit ? 'Edit Stock Item' : 'Add Stock Item'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Product Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <Input label="SKU / Code" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. UNI-001" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Category *</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-3 py-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Supplier" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cost Price" type="number" step="0.01" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} />
            <Input label="Selling Price" type="number" step="0.01" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Quantity *" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
            <Input label="Low Stock Threshold" type="number" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg">
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="damaged">Damaged</option>
                <option value="hold">Hold</option>
              </select>
            </div>
          </div>
          <Input label="Added By (Cashier/Staff)" value={form.added_by} onChange={e => setForm({ ...form, added_by: e.target.value })} placeholder="e.g. Juan Dela Cruz" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-3 py-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-700">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={loading}>{isEdit ? 'Update' : 'Add Item'}</Button>
          </div>
        </div>
      </Modal>

      {/* ADJUST MODAL */}
      <Modal isOpen={showAdjust} onClose={() => setShowAdjust(false)} title={`Adjust Quantity — ${selected?.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
            Current Quantity: <span className="font-bold text-gray-900 dark:text-white">{selected?.quantity}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Adjustment Type</label>
            <select value={adjustForm.type} onChange={e => setAdjustForm({ ...adjustForm, type: e.target.value })}
              className="w-full px-3 py-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg">
              <option value="add">Add Stock</option>
              <option value="subtract">Remove Stock</option>
              <option value="set">Set Exact Quantity</option>
            </select>
          </div>
          <Input label="Quantity" type="number" value={adjustForm.quantity} onChange={e => setAdjustForm({ ...adjustForm, quantity: e.target.value })} autoFocus />
          <Input label="Adjusted By (Name)" value={adjustForm.adjusted_by} onChange={e => setAdjustForm({ ...adjustForm, adjusted_by: e.target.value })} placeholder="e.g. Juan Dela Cruz" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Notes (optional)</label>
            <textarea value={adjustForm.notes} onChange={e => setAdjustForm({ ...adjustForm, notes: e.target.value })} rows={2}
              className="w-full px-3 py-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-700">
            <Button variant="outline" onClick={() => setShowAdjust(false)}>Cancel</Button>
            <Button onClick={handleAdjust} isLoading={loading}>Confirm Adjustment</Button>
          </div>
        </div>
      </Modal>

      {/* TRANSFER MODAL */}
      <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)} title={`Transfer to Selling Inventory — ${selected?.name}`}>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-sm">
            <p className="text-blue-800 dark:text-blue-300">Available in Stock Room: <strong>{selected?.quantity} units</strong></p>
            <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">This will deduct from Stock Room and add to Selling Inventory.</p>
          </div>
          <Input label="Quantity to Transfer *" type="number" min={1} max={selected?.quantity}
            value={transferForm.quantity} onChange={e => setTransferForm({ ...transferForm, quantity: e.target.value })} autoFocus />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Target Selling Inventory Product <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select value={transferForm.inventory_product_id} onChange={e => setTransferForm({ ...transferForm, inventory_product_id: e.target.value })}
              className="w-full px-3 py-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg">
              <option value="">— None / Transfer Only —</option>
              {invProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">If selected, stock will be added to that selling inventory product.</p>
          </div>
          <Input label="Transferred By" value={transferForm.transferred_by} onChange={e => setTransferForm({ ...transferForm, transferred_by: e.target.value })} placeholder="Staff name" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea value={transferForm.notes} onChange={e => setTransferForm({ ...transferForm, notes: e.target.value })} rows={2}
              className="w-full px-3 py-2 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-700">
            <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancel</Button>
            <Button onClick={handleTransfer} isLoading={loading}>Confirm Transfer</Button>
          </div>
        </div>
      </Modal>

      {/* HISTORY MODAL */}
      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title={`History — ${selected?.name}`} size="lg">
        <div className="flex border-b border-gray-200 dark:border-slate-700 mb-4">
          <button
            className={`px-4 py-2 font-medium text-sm transition-colors ${historyTab === 'transfer' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            onClick={() => setHistoryTab('transfer')}
          >
            Transfer History
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm transition-colors ${historyTab === 'adjust' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            onClick={() => setHistoryTab('adjust')}
          >
            Adjustment History
          </button>
        </div>

        {historyTab === 'transfer' && (
          transferHistory.length === 0 ? (
            <p className="text-center py-8 text-gray-400">No transfer history for this item.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900/50">
                  <tr>
                    {['Date', 'Qty Transferred', 'To Inventory Product', 'By', 'Notes'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {transferHistory.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400">{t.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{t.inventory_product?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{t.transferred_by || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{t.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {historyTab === 'adjust' && (
          adjustHistory.length === 0 ? (
            <p className="text-center py-8 text-gray-400">No adjustment history for this item.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900/50">
                  <tr>
                    {['Date', 'Type', 'Quantity', 'Adjusted By', 'Notes'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {adjustHistory.map((a: any) => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{new Date(a.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-slate-200 capitalize">{a.type}</td>
                      <td className="px-4 py-3 text-sm font-bold text-purple-600 dark:text-purple-400">{a.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{a.adjusted_by || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{a.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        <div className="flex justify-end pt-4 border-t dark:border-slate-700 mt-4">
          <Button variant="outline" onClick={() => setShowHistory(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
};
