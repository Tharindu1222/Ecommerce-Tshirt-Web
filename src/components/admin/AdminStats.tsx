import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { Product } from '../../types';
import { BarChart3, Users, Package, ShoppingCart, TrendingUp, AlertTriangle, X, ExternalLink } from 'lucide-react';

interface ProductModalProps {
  title: string;
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProducts?: () => void;
}

const ProductModal = ({ title, products, isOpen, onClose, onNavigateToProducts }: ProductModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black bg-opacity-80" onClick={onClose} />
        <div className="relative bg-gray-900 border border-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <div className="flex items-center gap-2">
              {onNavigateToProducts && (
                <button
                  onClick={onNavigateToProducts}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 border border-gray-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  View All in Products
                </button>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="border border-gray-800 bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                    <div className="flex gap-4">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Category: <span className="font-medium capitalize text-gray-300">{product.category}</span></p>
                            <p className="text-sm text-gray-500">Stock: <span className={`font-medium ${product.stock < 10 ? 'text-gray-400' : 'text-white'}`}>{product.stock}</span></p>
                          </div>
                          <p className="text-lg font-bold text-white">${product.price}</p>
                        </div>
                        {product.featured && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-gray-700 text-gray-300 border border-gray-600">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminStats = ({ onNavigateToProducts }: { onNavigateToProducts?: (filter?: string) => void }) => {
  const [userStats, setUserStats] = useState<any>(null);
  const [productStats, setProductStats] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [modalTitle, setModalTitle] = useState('');

  useEffect(() => {
    loadStats();
    loadProducts();
  }, []);

  const loadStats = async () => {
    try {
      const [userData, productData] = await Promise.all([
        adminApi.getUserStats(),
        adminApi.getProductStats()
      ]);
      setUserStats(userData);
      setProductStats(productData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await adminApi.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleStatClick = (filterType: string, title: string) => {
    let filtered: Product[] = [];

    switch (filterType) {
      case 'all':
        filtered = products;
        break;
      case 'featured':
        filtered = products.filter(p => p.featured);
        break;
      case 'lowStock':
        filtered = products.filter(p => p.stock < 10);
        break;
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = products.filter(p => new Date(p.created_at) >= thirtyDaysAgo);
        break;
      default:
        if (filterType.startsWith('category:')) {
          const category = filterType.split(':')[1];
          filtered = products.filter(p => p.category === category);
        }
    }

    setFilteredProducts(filtered);
    setModalTitle(title);
    setSelectedFilter(filterType);
  };

  const handleNavigateToProducts = () => {
    if (onNavigateToProducts) {
      onNavigateToProducts(selectedFilter || undefined);
    }
    setSelectedFilter(null);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Users</p>
                <p className="text-3xl font-bold text-white mt-2">{userStats?.totalUsers || 0}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-3 rounded-full">
                <Users className="w-8 h-8 text-gray-300" />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Admin Users</p>
                <p className="text-3xl font-bold text-white mt-2">{userStats?.totalAdmins || 0}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-3 rounded-full">
                <BarChart3 className="w-8 h-8 text-gray-300" />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">New Users (30 days)</p>
                <p className="text-3xl font-bold text-white mt-2">{userStats?.recentUsers || 0}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-3 rounded-full">
                <Users className="w-8 h-8 text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Product Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => handleStatClick('all', 'All Products')}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 hover:border-gray-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Products</p>
                <p className="text-3xl font-bold text-white mt-2">{productStats?.totalProducts || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Click to view</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-3 rounded-full">
                <Package className="w-8 h-8 text-gray-300" />
              </div>
            </div>
          </button>

          <button
            onClick={() => handleStatClick('featured', 'Featured Products')}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 hover:border-gray-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Featured Products</p>
                <p className="text-3xl font-bold text-white mt-2">{productStats?.featuredProducts || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Click to view</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-gray-300" />
              </div>
            </div>
          </button>

          <button
            onClick={() => handleStatClick('lowStock', 'Low Stock Items')}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 hover:border-gray-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Low Stock Items</p>
                <p className="text-3xl font-bold text-white mt-2">{productStats?.lowStock || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Stock &lt; 10 • Click to view</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8 text-gray-300" />
              </div>
            </div>
          </button>

          <button
            onClick={() => handleStatClick('recent', 'New Products (30 days)')}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 hover:border-gray-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">New Products (30 days)</p>
                <p className="text-3xl font-bold text-white mt-2">{productStats?.recentProducts || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Click to view</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-3 rounded-full">
                <Package className="w-8 h-8 text-gray-300" />
              </div>
            </div>
          </button>
        </div>

        {/* Additional Product Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Products by Category</h3>
            <div className="space-y-3">
              {productStats?.categoryCounts && Object.entries(productStats.categoryCounts).map(([category, count]: [string, any]) => (
                <button
                  key={category}
                  onClick={() => handleStatClick(`category:${category}`, `${category.charAt(0).toUpperCase() + category.slice(1)} Products`)}
                  className="w-full flex items-center justify-between hover:bg-gray-800 p-2 rounded-lg transition-colors"
                >
                  <span className="text-sm text-gray-400 capitalize">{category}</span>
                  <span className="text-lg font-semibold text-white">{count}</span>
                </button>
              ))}
              {(!productStats?.categoryCounts || Object.keys(productStats.categoryCounts).length === 0) && (
                <p className="text-sm text-gray-500">No categories found</p>
              )}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Stock</p>
                <p className="text-3xl font-bold text-white mt-2">{productStats?.totalStock || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Units in inventory</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 p-3 rounded-full">
                <ShoppingCart className="w-8 h-8 text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      <ProductModal
        title={modalTitle}
        products={filteredProducts}
        isOpen={selectedFilter !== null}
        onClose={() => setSelectedFilter(null)}
        onNavigateToProducts={onNavigateToProducts ? handleNavigateToProducts : undefined}
      />
    </div>
  );
};

