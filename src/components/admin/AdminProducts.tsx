import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { Product } from '../../types';
import { Plus, Edit, Trash2, X, Search, Package, AlertTriangle, DollarSign, TrendingUp, Eye, Image as ImageIcon, Tag, Box } from 'lucide-react';

export const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 't-shirt' | 'hoodie'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 't-shirt' as 't-shirt' | 'hoodie',
    image_url: '',
    sizes: [] as string[],
    colors: [] as string[],
    stock: '',
    featured: false,
  });
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
    calculateStats();
  }, [products, searchQuery, categoryFilter, stockFilter, sortBy]);

  const loadProducts = async () => {
    try {
      const data = await adminApi.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Apply stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        const stock = Number(product.stock);
        if (stockFilter === 'out') return stock === 0;
        if (stockFilter === 'low') return stock > 0 && stock <= 10;
        if (stockFilter === 'in-stock') return stock > 10;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return Number(b.price) - Number(a.price);
        case 'stock':
          return Number(b.stock) - Number(a.stock);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  };

  const calculateStats = () => {
    const totalProducts = products.length;
    const lowStock = products.filter(p => {
      const stock = Number(p.stock);
      return stock > 0 && stock <= 10;
    }).length;
    const outOfStock = products.filter(p => Number(p.stock) === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (Number(p.price) * Number(p.stock)), 0);

    setStats({
      totalProducts,
      lowStock,
      outOfStock,
      totalValue,
    });
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        image_url: product.image_url,
        sizes: product.sizes,
        colors: product.colors,
        stock: product.stock.toString(),
        featured: product.featured,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 't-shirt',
        image_url: '',
        sizes: [],
        colors: [],
        stock: '',
        featured: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      };

      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, productData);
      } else {
        await adminApi.createProduct(productData);
      }

      await loadProducts();
      handleCloseModal();
    } catch (error: any) {
      alert(error.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await adminApi.deleteProduct(id);
      await loadProducts();
    } catch (error: any) {
      // Check if this is the "product has been ordered" error
      if (error.message && error.message.includes('has been ordered')) {
        const forceDelete = confirm(
          'This product has been ordered by customers. Deleting it will remove it from their order history.\n\n' +
          'Are you sure you want to force delete this product?\n\n' +
          'Click OK to force delete, or Cancel to keep the product.'
        );
        
        if (forceDelete) {
          try {
            await adminApi.deleteProduct(id, true);
            await loadProducts();
            alert('Product deleted successfully (including from order history)');
          } catch (forceError: any) {
            alert(forceError.message || 'Failed to force delete product');
          }
        }
      } else {
        alert(error.message || 'Failed to delete product');
      }
    }
  };

  const addSize = () => {
    if (newSize && !formData.sizes.includes(newSize.trim())) {
      setFormData({ ...formData, sizes: [...formData.sizes, newSize.trim().toUpperCase()] });
      setNewSize('');
    }
  };

  const removeSize = (size: string) => {
    setFormData({ ...formData, sizes: formData.sizes.filter(s => s !== size) });
  };

  const addColor = () => {
    if (newColor && !formData.colors.includes(newColor.trim())) {
      setFormData({ ...formData, colors: [...formData.colors, newColor.trim()] });
      setNewColor('');
    }
  };

  const removeColor = (color: string) => {
    setFormData({ ...formData, colors: formData.colors.filter(c => c !== color) });
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setIsViewModalOpen(true);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    if (stock <= 10) return { text: 'Low Stock', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
    return { text: 'In Stock', color: 'text-green-400 bg-green-500/10 border-green-500/30' };
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Product Management</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Products</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.lowStock}</p>
              <p className="text-xs text-gray-500 mt-1">≤ 10 items</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{stats.outOfStock}</p>
              <p className="text-xs text-gray-500 mt-1">0 items</p>
            </div>
            <Box className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Inventory Value</p>
              <p className="text-2xl font-bold text-green-400 mt-1">Rs. {stats.totalValue.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Total value</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | 't-shirt' | 'hoodie')}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            >
              <option value="all">All Categories</option>
              <option value="t-shirt">T-Shirts</option>
              <option value="hoodie">Hoodies</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'all' | 'in-stock' | 'low' | 'out')}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            >
              <option value="all">All Stock Levels</option>
              <option value="in-stock">In Stock (&gt; 10)</option>
              <option value="low">Low Stock (≤ 10)</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Sort and Results Count */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'stock')}
              className="px-3 py-1 bg-gray-800 border border-gray-700 text-white rounded text-sm focus:ring-2 focus:ring-gray-600"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="stock">Stock</option>
            </select>
          </div>
          <span className="text-sm text-gray-400">
            Showing {filteredProducts.length} of {products.length} products
          </span>
        </div>
      </div>

      {/* Products Grid/Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Variants</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(Number(product.stock));
                return (
                  <tr key={product.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center border border-gray-700">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<div class="text-gray-500"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" /></svg></div>';
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{product.name}</div>
                          <div className="text-xs text-gray-400 max-w-xs truncate">{product.description}</div>
                          {product.featured && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                              <TrendingUp className="w-3 h-3" />
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">Rs. {Number(product.price).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{product.stock}</div>
                      <div className="text-xs text-gray-400">units</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="text-xs text-gray-400">
                            <span className="text-gray-500">Sizes:</span> {product.sizes.slice(0, 3).join(', ')}
                            {product.sizes.length > 3 && ` +${product.sizes.length - 3}`}
                          </div>
                        )}
                        {product.colors && product.colors.length > 0 && (
                          <div className="text-xs text-gray-400">
                            <span className="text-gray-500">Colors:</span> {product.colors.slice(0, 2).join(', ')}
                            {product.colors.length > 2 && ` +${product.colors.length - 2}`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewProduct(product)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p>No products found</p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setStockFilter('all');
                }}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full my-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 't-shirt' | 'hoodie' })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                  >
                    <option value="t-shirt">T-Shirt</option>
                    <option value="hoodie">Hoodie</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                    placeholder="29.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image_url && (
                  <div className="mt-2 p-2 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">Preview:</p>
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg mx-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector('.error-message')) {
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'error-message text-xs text-red-400 text-center py-4';
                          errorDiv.textContent = 'Invalid image URL';
                          parent.appendChild(errorDiv);
                        }
                      }}
                      onLoad={(e) => {
                        const parent = e.currentTarget.parentElement;
                        const errorMsg = parent?.querySelector('.error-message');
                        if (errorMsg) errorMsg.remove();
                        e.currentTarget.style.display = 'block';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Available Sizes</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.sizes.map((size) => (
                    <span
                      key={size}
                      className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm flex items-center gap-2 text-gray-300"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => removeSize(size)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {formData.sizes.length === 0 && (
                    <span className="text-xs text-gray-500">No sizes added yet</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                    placeholder="e.g., S, M, L, XL"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={addSize}
                    disabled={!newSize.trim()}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Common sizes: XS, S, M, L, XL, XXL</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Available Colors</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.colors.map((color) => (
                    <span
                      key={color}
                      className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm flex items-center gap-2 text-gray-300"
                    >
                      <span 
                        className="w-3 h-3 rounded-full border border-gray-600" 
                        style={{ backgroundColor: color.toLowerCase() }}
                      />
                      {color}
                      <button
                        type="button"
                        onClick={() => removeColor(color)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {formData.colors.length === 0 && (
                    <span className="text-xs text-gray-500">No colors added yet</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                    placeholder="e.g., Black, White, Navy"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={addColor}
                    disabled={!newColor.trim()}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Use standard color names for best display</p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-300">Featured Product</span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 border border-gray-700"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-gray-700 rounded-lg font-semibold text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {isViewModalOpen && viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full my-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Product Details</h3>
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Product Image */}
              <div className="flex justify-center">
                <div className="w-64 h-64 rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                  {viewingProduct.image_url ? (
                    <img
                      src={viewingProduct.image_url}
                      alt={viewingProduct.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-500"><svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" /></svg></div>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">{viewingProduct.name}</h4>
                  <p className="text-gray-300">{viewingProduct.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Category</p>
                    <p className="text-white font-medium capitalize">{viewingProduct.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Price</p>
                    <p className="text-white font-bold text-lg">Rs. {Number(viewingProduct.price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Stock Quantity</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{viewingProduct.stock} units</p>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getStockStatus(Number(viewingProduct.stock)).color}`}>
                        {getStockStatus(Number(viewingProduct.stock)).text}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Value</p>
                    <p className="text-green-400 font-bold text-lg">
                      Rs. {(Number(viewingProduct.price) * Number(viewingProduct.stock)).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Sizes */}
                {viewingProduct.sizes && viewingProduct.sizes.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Available Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {viewingProduct.sizes.map((size) => (
                        <span
                          key={size}
                          className="px-3 py-1 bg-gray-900 border border-gray-700 rounded-full text-sm text-gray-300"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {viewingProduct.colors && viewingProduct.colors.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Available Colors</p>
                    <div className="flex flex-wrap gap-2">
                      {viewingProduct.colors.map((color) => (
                        <span
                          key={color}
                          className="px-3 py-1 bg-gray-900 border border-gray-700 rounded-full text-sm flex items-center gap-2 text-gray-300"
                        >
                          <span 
                            className="w-4 h-4 rounded-full border border-gray-600" 
                            style={{ backgroundColor: color.toLowerCase() }}
                          />
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Featured Badge */}
                {viewingProduct.featured && (
                  <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <span className="text-purple-400 font-medium">This is a featured product</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenModal(viewingProduct);
                  }}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 border border-gray-700 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Product
                </button>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-6 py-3 border border-gray-700 rounded-lg font-semibold text-gray-300 hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

