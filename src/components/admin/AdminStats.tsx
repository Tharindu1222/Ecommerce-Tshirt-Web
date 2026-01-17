import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api';
import { Product } from '../../types';
import { BarChart3, Users, Package, ShoppingCart, TrendingUp, AlertTriangle, X, ExternalLink, DollarSign, TrendingDown, Calendar, Activity, Star, Eye, RefreshCw } from 'lucide-react';

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
                            <p className="text-sm text-gray-500">Stock: <span className={`font-medium ${Number(product.stock) < 10 ? 'text-yellow-400' : 'text-white'}`}>{product.stock}</span></p>
                          </div>
                          <p className="text-lg font-bold text-white">Rs. {Number(product.price).toFixed(2)}</p>
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
  const [orderStats, setOrderStats] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [modalTitle, setModalTitle] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadStats();
    loadProducts();
  }, []);

  const loadStats = async () => {
    try {
      const [userData, productData, orderData] = await Promise.all([
        adminApi.getUserStats().catch(() => null),
        adminApi.getProductStats().catch(() => null),
        adminApi.getOrderStats().catch(() => null)
      ]);
      setUserStats(userData);
      setProductStats(productData);
      setOrderStats(orderData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadProducts()]);
    setRefreshing(false);
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
        filtered = products.filter(p => Number(p.stock) < 10);
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
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
          <p className="text-sm text-gray-400 mt-1">Real-time business insights and analytics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 border border-gray-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-900/20 to-gray-900 border border-green-800/30 rounded-lg p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-green-500/10 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            {orderStats?.revenueGrowth && (
              <div className={`flex items-center gap-1 text-xs font-medium ${orderStats.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {orderStats.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(orderStats.revenueGrowth)}%
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-white">Rs. {(orderStats?.totalRevenue || 0).toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">
            {orderStats?.totalOrders || 0} orders completed
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-gradient-to-br from-blue-900/20 to-gray-900 border border-blue-800/30 rounded-lg p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-400" />
            </div>
            {orderStats?.ordersGrowth && (
              <div className={`flex items-center gap-1 text-xs font-medium ${orderStats.ordersGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {orderStats.ordersGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(orderStats.ordersGrowth)}%
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-white">{orderStats?.totalOrders || 0}</p>
          <p className="text-xs text-gray-500 mt-2">
            Rs. {(orderStats?.averageOrderValue || 0).toFixed(2)} avg. order value
          </p>
        </div>

        {/* Total Customers */}
        <div className="bg-gradient-to-br from-purple-900/20 to-gray-900 border border-purple-800/30 rounded-lg p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            {userStats?.userGrowth && (
              <div className={`flex items-center gap-1 text-xs font-medium ${userStats.userGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {userStats.userGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(userStats.userGrowth)}%
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-1">Total Customers</p>
          <p className="text-3xl font-bold text-white">{userStats?.totalUsers || 0}</p>
          <p className="text-xs text-gray-500 mt-2">
            {userStats?.recentUsers || 0} new in last 30 days
          </p>
        </div>

        {/* Total Products */}
        <div className="bg-gradient-to-br from-orange-900/20 to-gray-900 border border-orange-800/30 rounded-lg p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-orange-500/10 p-3 rounded-lg">
              <Package className="w-6 h-6 text-orange-400" />
            </div>
            {productStats?.lowStock > 0 && (
              <div className="flex items-center gap-1 text-xs font-medium text-yellow-400">
                <AlertTriangle className="w-3 h-3" />
                {productStats.lowStock} low
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-1">Total Products</p>
          <p className="text-3xl font-bold text-white">{productStats?.totalProducts || 0}</p>
          <p className="text-xs text-gray-500 mt-2">
            {productStats?.totalStock || 0} items in stock
          </p>
        </div>
      </div>

      {/* Order Status Breakdown */}
      {orderStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Pending Orders</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{orderStats.pendingOrders || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-yellow-400/50" />
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Processing</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{orderStats.processingOrders || 0}</p>
              </div>
              <Package className="w-8 h-8 text-blue-400/50" />
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Shipped</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">{orderStats.shippedOrders || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400/50" />
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Delivered</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{orderStats.deliveredOrders || 0}</p>
              </div>
              <Star className="w-8 h-8 text-green-400/50" />
            </div>
          </div>
        </div>
      )}

      {/* User Statistics Details */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Customer Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-white mt-1">{userStats?.totalUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <div className="h-px bg-gray-800 my-3"></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Regular Users:</span>
                <span className="text-white font-medium">{(userStats?.totalUsers || 0) - (userStats?.totalAdmins || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Admin Users:</span>
                <span className="text-white font-medium">{userStats?.totalAdmins || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-400">New Customers</p>
                <p className="text-2xl font-bold text-white mt-1">{userStats?.recentUsers || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
            <div className="h-px bg-gray-800 my-3"></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Last 30 days:</span>
                <span className="text-white font-medium">{userStats?.recentUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Growth Rate:</span>
                <span className="text-green-400 font-medium">+{userStats?.userGrowth || 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Customers</p>
                <p className="text-2xl font-bold text-white mt-1">{userStats?.activeUsers || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="h-px bg-gray-800 my-3"></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Last 90 days:</span>
                <span className="text-white font-medium">{userStats?.activeUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Engagement:</span>
                <span className="text-cyan-400 font-medium">
                  {userStats?.totalUsers > 0 
                    ? ((userStats.activeUsers / userStats.totalUsers) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Statistics */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-400" />
          Product Inventory
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleStatClick('all', 'All Products')}
            className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:bg-gray-800 hover:border-orange-800/50 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-500/10 p-2 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                <Package className="w-6 h-6 text-orange-400" />
              </div>
              <Eye className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Total Products</p>
            <p className="text-2xl font-bold text-white">{productStats?.totalProducts || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Click to view all</p>
          </button>

          <button
            onClick={() => handleStatClick('featured', 'Featured Products')}
            className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:bg-gray-800 hover:border-purple-800/50 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500/10 p-2 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <Star className="w-6 h-6 text-purple-400" />
              </div>
              <Eye className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Featured</p>
            <p className="text-2xl font-bold text-white">{productStats?.featuredProducts || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Highlighted products</p>
          </button>

          <button
            onClick={() => handleStatClick('lowStock', 'Low Stock Items')}
            className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:bg-gray-800 hover:border-yellow-800/50 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-500/10 p-2 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <Eye className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-400">{productStats?.lowStock || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Stock &lt; 10 items</p>
          </button>

          <button
            onClick={() => handleStatClick('recent', 'New Products (30 days)')}
            className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:bg-gray-800 hover:border-green-800/50 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/10 p-2 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <Eye className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">New (30d)</p>
            <p className="text-2xl font-bold text-white">{productStats?.recentProducts || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Recently added</p>
          </button>
        </div>

        {/* Additional Product Stats */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Products by Category
            </h4>
            <div className="space-y-3">
              {productStats?.categoryCounts && Object.entries(productStats.categoryCounts).map(([category, count]: [string, any]) => {
                const total = productStats.totalProducts || 1;
                const percentage = ((count / total) * 100).toFixed(0);
                return (
                  <button
                    key={category}
                    onClick={() => handleStatClick(`category:${category}`, `${category.charAt(0).toUpperCase() + category.slice(1)} Products`)}
                    className="w-full group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400 capitalize group-hover:text-white transition-colors">{category}</span>
                      <span className="text-sm font-semibold text-white">{count}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-300 group-hover:bg-blue-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{percentage}% of total</div>
                  </button>
                );
              })}
              {(!productStats?.categoryCounts || Object.keys(productStats.categoryCounts).length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No categories found</p>
              )}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-cyan-400" />
              Inventory Overview
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-xs text-gray-400">Total Stock</p>
                  <p className="text-2xl font-bold text-white mt-1">{productStats?.totalStock || 0}</p>
                </div>
                <Package className="w-8 h-8 text-cyan-400/50" />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-xs text-gray-400">Inventory Value</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    Rs. {((productStats?.totalStock || 0) * 25).toFixed(0)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400/50" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-gray-800 rounded text-center">
                  <p className="text-gray-400 text-xs">In Stock</p>
                  <p className="text-white font-bold mt-1">{(productStats?.totalProducts || 0) - (productStats?.lowStock || 0)}</p>
                </div>
                <div className="p-2 bg-gray-800 rounded text-center">
                  <p className="text-gray-400 text-xs">Categories</p>
                  <p className="text-white font-bold mt-1">
                    {productStats?.categoryCounts ? Object.keys(productStats.categoryCounts).length : 0}
                  </p>
                </div>
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

