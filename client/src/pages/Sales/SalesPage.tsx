import React, { useState, useEffect, useRef } from 'react';
import { salesService } from '../../services/salesService';
import { categoryService } from '../../services/inventoryService';
import { customerService } from '../../services/customerService';
import type { Product, Category } from '../../types/product';
import type { Customer } from '../../types/customer';
import type { OrderItem } from '../../types/order';
import { formatCurrency } from '../../utils/formatCurrency';
import { printReceipt } from '../../utils/generateReceipt';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';

interface CartItem extends OrderItem {
  product: Product;
}

export const SalesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');

  // Barcode scanning state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode || barcode.length < 3) return; // Minimum barcode length

    setIsScanning(true);
    try {
      const product = await salesService.getProductByBarcode(barcode);

      // Check stock
      if (product.stock <= 0) {
        alert(`Product "${product.name}" is out of stock!`);
        return;
      }

      // Add to cart
      addToCart(product);

      // Visual feedback - show success message briefly
      console.log(`✓ Scanned: ${product.name}${product.size ? ` (${product.size})` : ''}`);

    } catch (error: any) {
      if (error.response?.status === 404) {
        alert(`Product with barcode "${barcode}" not found!`);
      } else {
        alert('Error scanning barcode. Please try again.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await salesService.getProducts({
        category_id: selectedCategory || undefined,
        search: searchQuery || undefined,
      });
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Product out of stock');
      return;
    }

    const existingItem = cart.find((item) => item.product_id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Insufficient stock');
        return;
      }
      updateCartQuantity(existingItem.product_id, existingItem.quantity + 1);
    } else {
      const price = Number(product.price);
      const newItem: CartItem = {
        id: Date.now(),
        order_id: 0,
        product_id: product.id,
        product,
        quantity: 1,
        price: price,
        subtotal: price,
        created_at: '',
        updated_at: '',
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    const item = cart.find((i) => i.product_id === productId);
    if (!item) return;

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (quantity > item.product.stock) {
      alert('Insufficient stock');
      return;
    }

    setCart(
      cart.map((item) =>
        item.product_id === productId
          ? {
            ...item,
            quantity,
            subtotal: Number(item.price) * quantity,
          }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setCustomerResults([]);
      return;
    }
    try {
      const results = await customerService.searchCustomers(query);
      setCustomerResults(results);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => {
      const itemSubtotal = Number(item.subtotal) || 0;
      return sum + itemSubtotal;
    }, 0);
    const total = subtotal;
    return { subtotal, total };
  };

  const handleCompleteOrder = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    // Enforce credit rules
    if (paymentMethod === 'credit') {
      if (!selectedCustomer) {
        alert('Credit sales require a selected teacher.');
        return;
      }
      if (selectedCustomer.type !== 'teacher') {
        alert('Only teachers are allowed to use credit sales.');
        return;
      }
    }

    // For cash sales, validate cash tendered and compute change
    let cashValue: number | undefined;
    let changeValue: number | undefined;
    if (paymentMethod === 'cash') {
      if (!cashTendered) {
        alert('Please enter cash received from customer.');
        return;
      }
      cashValue = Number(cashTendered);
      if (Number.isNaN(cashValue) || cashValue <= 0) {
        alert('Please enter a valid cash amount.');
        return;
      }
      if (cashValue < total) {
        alert('Cash is not enough for the total amount.');
        return;
      }
      changeValue = cashValue - total;
    }

    setLoading(true);
    try {
      const order = await salesService.createOrder({
        customer_id: selectedCustomer?.id,
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        tax_rate: 0,
        payment_method: paymentMethod,
        cash_tendered: cashValue,
        change_due: changeValue,
      });

      // Print receipt
      printReceipt({
        ...order,
        cash_tendered: cashValue,
        change_due: changeValue,
      });

      // Clear cart and customer
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod('cash');
      setCashTendered('');

      alert('Order completed successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error completing order');
    } finally {
      setLoading(false);
    }
  };

  const { total } = calculateTotals();
  const filteredProducts = products.filter((p) => p.is_active && p.stock > 0);

  return (
    // Main container with fixed height relative to viewport to prevent body scroll
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-6rem)]">

      {/* ----------------- LEFT: PRODUCT CATALOG ----------------- */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-md flex flex-col h-full overflow-hidden">

        {/* Fixed Header Section (Does not scroll) */}
        <div className="p-4 border-b space-y-4 bg-white z-10 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800">Product List</h2>
          {/* Barcode Scanner */}
          <div className="relative">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && barcodeInput.trim()) {
                  e.preventDefault();
                  const barcode = barcodeInput.trim();
                  setBarcodeInput('');
                  await handleBarcodeScan(barcode);
                }
              }}
              placeholder={isScanning ? "⏳ Scanning..." : "📷 Scan barcode here..."}
              className="w-full px-4 py-2 border-2 border-dashed border-green-400 bg-green-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center font-mono text-lg"
              autoFocus
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              {/* Categories */}
              <br />  <br />
              <div className="flex space-x-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${selectedCategory === null
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${selectedCategory === category.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

            </div>

          </div>
        </div>

        {/* Scrollable Product Grid (Only this part scrolls) */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer hover:shadow-lg hover:border-green-400 transition-all flex flex-col"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image.startsWith('http') ? product.image : `http://localhost:8000${product.image}`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-3xl">📦</span>';
                      }}
                    />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>
                <div className="mt-auto">
                  <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2" title={product.name}>
                    {product.name}
                    {product.size && <span className="text-gray-500 font-normal"> ({product.size})</span>}
                  </h3>
                  <div className="flex justify-between items-end">
                    <p className="text-green-600 font-bold">{formatCurrency(product.price)}</p>
                    <p className="text-xs text-gray-400">Qty: {product.stock}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-400">
                <p className="text-4xl mb-2">🔍</p>
                <p>No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----------------- RIGHT: ORDER DETAIL ----------------- */}
      <div className="bg-white rounded-lg shadow-md flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Order Detail</h2>
        </div>

        {/* Scrollable Order Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
              Customer
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCustomerModal(true)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 flex justify-between items-center text-sm"
              >
                {selectedCustomer
                  ? <span className="font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</span>
                  : <span className="text-gray-400">Select Customer...</span>}
                <span className="text-xs">▼</span>
              </button>
              {selectedCustomer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                >
                  ✕
                </Button>
              )}
            </div>
          </div>

          {/* Payment Method */}
          {selectedCustomer && selectedCustomer.type === 'teacher' && (
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1">
                Payment Type
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-1.5 rounded text-sm font-medium border ${paymentMethod === 'cash'
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-white text-gray-600 border-gray-200'
                    }`}
                >
                  Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('credit')}
                  className={`flex-1 py-1.5 rounded text-sm font-medium border ${paymentMethod === 'credit'
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                      : 'bg-white text-gray-600 border-gray-200'
                    }`}
                >
                  Credit
                </button>
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div>
            <label className="block text-xs uppercase font-bold text-gray-500 mb-2">
              Cart Items ({cart.length})
            </label>
            <div className="space-y-2">
              {cart.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <span className="text-2xl opacity-50">🛒</span>
                  <p className="text-sm text-gray-400 mt-1">Empty Cart</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 group">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-sm truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-green-600 font-mono">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white border rounded text-gray-600 hover:bg-gray-100"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white border rounded text-gray-600 hover:bg-gray-100"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="ml-2 text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer (Totals & Action) - Fixed at bottom */}
        <div className="border-t p-4 bg-gray-50 space-y-3">
          <div className="flex justify-between items-center text-lg font-bold">
            <span className="text-gray-700">Total</span>
            <span className="text-green-700">{formatCurrency(total)}</span>
          </div>

          {paymentMethod === 'cash' && cart.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cash Received:</span>
                <input
                  type="number"
                  min="0"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm focus:ring-1 focus:ring-green-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              {cashTendered && !Number.isNaN(Number(cashTendered)) && Number(cashTendered) >= total && (
                <div className="flex justify-between text-sm font-bold text-blue-600">
                  <span>Change Due:</span>
                  <span>{formatCurrency(Number(cashTendered) - total)}</span>
                </div>
              )}
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full mt-2"
            onClick={handleCompleteOrder}
            isLoading={loading}
            disabled={cart.length === 0}
          >
            Complete Order
          </Button>
        </div>
      </div>

      {/* Customer Search Modal (Kept same) */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setCustomerSearch('');
          setCustomerResults([]);
        }}
        title="Select Customer"
      >
        <div className="space-y-4">
          <Input
            label="Search by ID or Name"
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              searchCustomers(e.target.value);
            }}
            placeholder="Enter ID number or Name..."
          />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {customerResults.map((customer) => (
              <div
                key={customer.id}
                onClick={() => {
                  setSelectedCustomer(customer);
                  setShowCustomerModal(false);
                  setCustomerSearch('');
                  setCustomerResults([]);
                }}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <p className="font-medium">
                  {customer.first_name} {customer.last_name}
                </p>
                {customer.student_id && (
                  <p className="text-sm text-gray-600">ID: {customer.student_id}</p>
                )}
                <p className="text-xs text-gray-500 capitalize">{customer.type}</p>
              </div>
            ))}
            {customerSearch.length >= 2 && customerResults.length === 0 && (
              <p className="text-center text-gray-500 py-4">No customers found</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};