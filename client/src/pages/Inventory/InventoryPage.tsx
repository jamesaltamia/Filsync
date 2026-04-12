import React, { useState, useEffect } from 'react';
import { inventoryService, categoryService } from '../../services/inventoryService';
import type { Product, Category } from '../../types/product';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { formatCurrency } from '../../utils/formatCurrency';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [isEditMode, setIsEditMode] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '',
    size: '',
    description: '',
    category_id: '',
    price: '',
    unit_price: '',
    stock: '',
    low_stock_threshold: '',
    barcode: '',
    supplier: '',
    supplier_date: '',
    is_active: true,
    is_for_sale: true,
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLowStock();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory, statusFilter]);

  const fetchProducts = async () => {
    try {
      const data = await inventoryService.getProducts({
        category_id: selectedCategory || undefined,
        search: searchQuery || undefined,
        is_active: statusFilter === 'all' ? undefined : (statusFilter === 'active' ? true : false),
      });
      setProducts(Array.isArray(data.data) ? data.data : data);
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

  const fetchLowStock = async () => {
    try {
      const data = await inventoryService.getLowStockProducts();
      setLowStockProducts(data);
    } catch (error) {
      console.error('Error fetching low stock:', error);
    }
  };

  const handleCreateProduct = async () => {
    if (!productForm.category_id) {
      alert('Please select a category');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      if (productForm.size) {
        formData.append('size', productForm.size);
      }
      formData.append('description', productForm.description || '');
      formData.append('category_id', String(productForm.category_id));
      formData.append('price', String(productForm.price));
      if (productForm.unit_price) {
        formData.append('unit_price', String(productForm.unit_price));
      }
      formData.append('stock', String(productForm.stock));
      formData.append('low_stock_threshold', String(productForm.low_stock_threshold));
      if (productForm.barcode) {
        formData.append('barcode', productForm.barcode);
      }
      if (productForm.supplier) {
        formData.append('supplier', productForm.supplier);
      }
      if (productForm.supplier_date) {
        formData.append('supplier_date', productForm.supplier_date);
      }

      // Auto-disable if creating with 0 stock
      const shouldBeActive = Number(productForm.stock) > 0 ? (productForm.is_active ? '1' : '0') : '0';
      formData.append('is_active', shouldBeActive);
      formData.append('is_for_sale', productForm.is_for_sale ? '1' : '0');

      if (productImage) {
        formData.append('image', productImage);
      }

      if (isEditMode && selectedProduct) {
        await inventoryService.updateProduct(selectedProduct.id, formData);
      } else {
        await inventoryService.createProduct(formData);
      }
      setShowProductModal(false);
      resetForm();
      setIsEditMode(false);
      setSelectedProduct(null);
      setProductImage(null);
      setImagePreview(null);
      fetchProducts();
      fetchLowStock();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        `Error ${isEditMode ? 'updating' : 'creating'} product`;
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      size: product.size || '',
      description: product.description || '',
      category_id: String(product.category_id),
      price: String(product.price),
      unit_price: String(product.unit_price || ''),
      stock: String(product.stock),
      low_stock_threshold: String(product.low_stock_threshold),
      barcode: product.barcode || '',
      supplier: product.supplier || '',
      supplier_date: product.supplier_date || '',
      is_active: product.is_active,
      is_for_sale: product.is_for_sale !== undefined ? product.is_for_sale : true,
    });
    setImagePreview(product.image || null);
    setProductImage(null);
    setIsEditMode(true);
    setShowProductModal(true);
  };

  const handleToggleStatus = async (product: Product) => {
    // Prevent enabling if stock is 0
    if (!product.is_active && product.stock <= 0) {
      alert("Cannot enable a product with 0 stock. Please add stock first.");
      return;
    }

    const action = product.is_active ? 'disable' : 'enable';
    if (!confirm(`Are you sure you want to ${action} "${product.name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('is_active', product.is_active ? '0' : '1');
      formData.append('name', product.name);
      formData.append('category_id', String(product.category_id));
      formData.append('price', String(product.price));
      formData.append('stock', String(product.stock));
      formData.append('low_stock_threshold', String(product.low_stock_threshold));

      await inventoryService.updateProduct(product.id, formData);
      fetchProducts();
      fetchLowStock();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Error updating product status';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    if (!selectedProduct || !stockQuantity) return;
    setLoading(true);
    try {
      await inventoryService.updateStock(
        selectedProduct.id,
        Number(stockQuantity),
        'add'
      );

      // AUTO-ENABLE LOGIC: If we add stock and the product was disabled/out of stock,
      // we can send a second request to enable it, or rely on the backend to handle it.
      // For now, we manually enable it if the previous stock was 0.
      if (!selectedProduct.is_active && Number(stockQuantity) > 0) {
        const formData = new FormData();
        formData.append('is_active', '1');
        formData.append('name', selectedProduct.name);
        formData.append('category_id', String(selectedProduct.category_id));
        formData.append('price', String(selectedProduct.price));
        formData.append('stock', String(selectedProduct.stock + Number(stockQuantity)));
        formData.append('low_stock_threshold', String(selectedProduct.low_stock_threshold));

        await inventoryService.updateProduct(selectedProduct.id, formData);
      }

      setShowStockModal(false);
      setSelectedProduct(null);
      setStockQuantity('');
      fetchProducts();
      fetchLowStock();
    } catch (error) {
      alert('Error updating stock');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      size: '',
      description: '',
      category_id: '',
      price: '',
      unit_price: '',
      stock: '',
      low_stock_threshold: '',
      barcode: '',
      supplier: '',
      supplier_date: '',
      is_active: true,
      is_for_sale: true,
    });
    setProductImage(null);
    setImagePreview(null);
    setIsEditMode(false);
    setSelectedProduct(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)]">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md flex flex-col h-full overflow-hidden">

        <div className="p-4 border-b dark:border-slate-700 bg-white dark:bg-slate-800 z-10 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inventory Management</h1>
            <Button onClick={() => setShowProductModal(true)}>+ Add Product</Button>
          </div>

          {lowStockProducts.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3 text-sm max-h-24 overflow-y-auto">
              <h3 className="font-semibold text-red-800 dark:text-red-200 flex items-center gap-2 sticky top-0 bg-red-50 dark:bg-red-900/1 py-1 -mt-1">
                ⚠️ Low Stock Alerts ({lowStockProducts.length})
              </h3>
              <div className="mt-1 space-y-1">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex justify-between items-center text-red-700 dark:text-red-300">
                    <span>{product.name} - Stock: {product.stock}</span>
                    <button
                      className="underline text-xs hover:text-red-900 dark:hover:text-red-100"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowStockModal(true);
                      }}
                    >
                      Restock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>

            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900/50">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800/80 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-gray-500 dark:text-slate-400">
                    No products found in inventory.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const totalUnitPrice = (product.unit_price || 0) * product.stock;

                  // LOGIC: Check if it should be marked as out of stock visually
                  const isOutOfStock = product.stock <= 0;
                  const isActive = product.is_active && !isOutOfStock;

                  return (
                    <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${!isActive ? 'opacity-60 bg-gray-50 dark:bg-slate-800/50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-slate-200">{product.name}</div>
                        {product.size && <div className="text-xs text-gray-500 dark:text-slate-400">Size: {product.size}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                        {product.category?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                        {product.supplier || '-'}
                        {product.supplier_date && (
                          <div className="text-xs text-gray-400 dark:text-slate-500">
                            {new Date(product.supplier_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-slate-200">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                        {product.unit_price ? formatCurrency(product.unit_price) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-mono font-bold ${isOutOfStock ? 'text-red-700 dark:text-red-400' : product.stock <= product.low_stock_threshold ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-slate-200'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 dark:text-blue-400">
                        {product.unit_price ? formatCurrency(totalUnitPrice) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${isActive && product.stock > product.low_stock_threshold
                            ? 'bg-green-100 text-green-700'
                            : isOutOfStock
                              ? 'bg-red-200 text-red-800'
                              : !product.is_active
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                        >
                          {isOutOfStock ? 'OUT OF STOCK' : !product.is_active ? 'Disabled' : product.stock > product.low_stock_threshold ? 'In Stock' : 'Low Stock'}
                        </span>
                        {product.is_for_sale === false && (
                          <div className="mt-1 flex">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200" title="Hidden from POS">
                              STOCK ONLY
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowStockModal(true);
                            }}
                            title="Add Stock"
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEditProduct(product)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={product.is_active ? "danger" : "outline"}
                            onClick={() => handleToggleStatus(product)}
                            disabled={loading}
                          >
                            {product.is_active ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS REMAIN THE SAME */}
      <Modal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          resetForm();
        }}
        title={isEditMode ? "Edit Product" : "Add Product"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Product Name"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={productForm.description}
            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={productForm.category_id}
              onChange={(e) => {
                setProductForm({ ...productForm, category_id: e.target.value, size: '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          {productForm.category_id && categories.find(cat => cat.id === Number(productForm.category_id))?.name === 'Uniforms' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <select
                value={productForm.size}
                onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Size</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              step="0.01"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              required
            />
            <Input
              label="Initial Stock"
              type="number"
              value={productForm.stock}
              onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Low Stock Threshold"
              type="number"
              value={productForm.low_stock_threshold}
              onChange={(e) => setProductForm({ ...productForm, low_stock_threshold: e.target.value })}
              required
            />
            <Input
              label="Unit Price (Optional)"
              type="number"
              step="0.01"
              value={productForm.unit_price}
              onChange={(e) => setProductForm({ ...productForm, unit_price: e.target.value })}
              placeholder="Enter unit price (e.g., 500)"
              description="Cost per unit for inventory valuation"
            />
          </div>
          <Input
            label="Barcode (Optional)"
            value={productForm.barcode}
            onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
            placeholder="Scan or enter barcode"
            description="Unique barcode for this product variant"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Supplier (Optional)"
              value={productForm.supplier}
              onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })}
              placeholder="Enter supplier name"
            />
            <Input
              label="Date (Optional)"
              type="date"
              value={productForm.supplier_date}
              onChange={(e) => setProductForm({ ...productForm, supplier_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              Product Placement
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={productForm.is_for_sale === true}
                  onChange={() => setProductForm({ ...productForm, is_for_sale: true })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-slate-300">Sale Item (Appears in POS)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={productForm.is_for_sale === false}
                  onChange={() => setProductForm({ ...productForm, is_for_sale: false })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-slate-300">Stock Only (Hidden from POS)</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {productForm.is_for_sale
                ? "This item will be visible to cashiers for sale."
                : "This item will only be tracked in inventory (e.g., ingredients, packaging, assets)."}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowProductModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProduct} isLoading={loading}>
              {isEditMode ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setSelectedProduct(null);
          setStockQuantity('');
        }}
        title={`Add Stock - ${selectedProduct?.name}`}
      >
        <div className="space-y-4">
          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border">
            Current Stock: <span className="font-bold text-gray-900">{selectedProduct?.stock}</span>
          </p>
          <Input
            label="Quantity to Add"
            type="number"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowStockModal(false);
                setSelectedProduct(null);
                setStockQuantity('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddStock} isLoading={loading}>
              Add Stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};