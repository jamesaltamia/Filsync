import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

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

  const { subtotal, total } = calculateTotals();
  const filteredProducts = products.filter((p) => p.is_active && p.stock > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Catalog */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>

        {/* Categories */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Products
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => addToCart(product)}
            >
              <div className="aspect-square bg-gray-200 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img 
                    src={product.image.startsWith('http') ? product.image : `http://localhost:8000${product.image}`} 
                    alt={product.name} 
                    className="w-full h-full object-cover rounded-lg" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-4xl">📦</span>';
                    }}
                  />
                ) : (
                  <span className="text-4xl">📦</span>
                )}
              </div>
              <h3 className="font-medium text-sm mb-1">{product.name}</h3>
              <p className="text-green-600 font-bold">{formatCurrency(product.price)}</p>
              <p className="text-xs text-gray-500">Stock: {product.stock}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Detail */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-xl font-semibold">Order Detail</h2>

        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCustomerModal(true)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50"
            >
              {selectedCustomer
                ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
                : 'Select Customer'}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCustomer(null)}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Payment Method (Teachers Only) */}
        {selectedCustomer && selectedCustomer.type === 'teacher' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  paymentMethod === 'cash'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  paymentMethod === 'credit'
                    ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Credit (On Account)
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Teachers may use credit. Students must pay in cash.
            </p>
          </div>
        )}

        {selectedCustomer && selectedCustomer.type === 'student' && (
          <p className="text-sm text-gray-600">
            Payment Method: <span className="font-semibold">Cash only (students must pay immediately)</span>
          </p>
        )}

        {/* Cart Items */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Cart is empty</p>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-gray-600">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                  >
                    −
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="ml-2 text-red-600 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Summary */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between font-bold text-lg text-green-600">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {paymentMethod === 'cash' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Cash:</span>
                <input
                  type="number"
                  min="0"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="ml-2 w-32 px-2 py-1 border border-gray-300 rounded-lg text-right"
                  placeholder="0.00"
                />
              </div>
              {cashTendered && !Number.isNaN(Number(cashTendered)) && Number(cashTendered) >= total && (
                <div className="flex justify-between text-sm font-semibold text-blue-600">
                  <span>Change:</span>
                  <span>{formatCurrency(Number(cashTendered) - total)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Complete Order Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleCompleteOrder}
          isLoading={loading}
          disabled={cart.length === 0}
        >
          🛒 Complete Order
        </Button>
      </div>

      {/* Customer Search Modal */}
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
            label="Search by ID or Last Name"
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              searchCustomers(e.target.value);
            }}
            placeholder="Enter ID number or last name..."
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

