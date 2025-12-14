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
  const [isEditMode, setIsEditMode] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    stock: '',
    low_stock_threshold: '10',
    sku: '',
    is_active: true,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLowStock();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const data = await inventoryService.getProducts({
        category_id: selectedCategory || undefined,
        search: searchQuery || undefined,
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
      if (isEditMode && selectedProduct) {
        await inventoryService.updateProduct(selectedProduct.id, {
          ...productForm,
          category_id: Number(productForm.category_id),
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          low_stock_threshold: Number(productForm.low_stock_threshold),
        });
      } else {
        await inventoryService.createProduct({
          ...productForm,
          category_id: Number(productForm.category_id),
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          low_stock_threshold: Number(productForm.low_stock_threshold),
        });
      }
      setShowProductModal(false);
      resetForm();
      setIsEditMode(false);
      setSelectedProduct(null);
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
      description: product.description || '',
      category_id: String(product.category_id),
      price: String(product.price),
      stock: String(product.stock),
      low_stock_threshold: String(product.low_stock_threshold),
      sku: product.sku || '',
      is_active: product.is_active,
    });
    setIsEditMode(true);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await inventoryService.deleteProduct(product.id);
      fetchProducts();
      fetchLowStock();
      alert('Product deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error deleting product';
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
      description: '',
      category_id: '',
      price: '',
      stock: '',
      low_stock_threshold: '10',
      sku: '',
      is_active: true,
    });
    setIsEditMode(false);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button onClick={() => setShowProductModal(true)}>+ Add Product</Button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">⚠️ Low Stock Alerts</h3>
          <div className="space-y-2">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex justify-between items-center">
                <span>
                  {product.name} - Stock: {product.stock} (Threshold: {product.low_stock_threshold})
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowStockModal(true);
                  }}
                >
                  Add Stock
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.category?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(product.price)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={product.stock <= product.low_stock_threshold ? 'text-red-600 font-bold' : ''}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowStockModal(true);
                      }}
                    >
                      Add Stock
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
                      variant="danger"
                      onClick={() => handleDeleteProduct(product)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Product Modal */}
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
              onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
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
          <Input
            label="Low Stock Threshold"
            type="number"
            value={productForm.low_stock_threshold}
            onChange={(e) => setProductForm({ ...productForm, low_stock_threshold: e.target.value })}
            required
          />
          <Input
            label="SKU (Optional)"
            value={productForm.sku}
            onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
          />
          <div className="flex justify-end space-x-2">
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

      {/* Add Stock Modal */}
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
          <p className="text-gray-600">Current Stock: {selectedProduct?.stock}</p>
          <Input
            label="Quantity to Add"
            type="number"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-2">
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

