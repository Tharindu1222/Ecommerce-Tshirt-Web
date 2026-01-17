import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminProducts } from './AdminProducts';
import { AdminUsers } from './AdminUsers';
import { AdminStats } from './AdminStats';
import { AdminOrders } from './AdminOrders';
import { AdminFlashDeals } from './AdminFlashDeals';
import { Package, Users, BarChart3, LogOut, ShoppingBag, Zap } from 'lucide-react';

type Tab = 'stats' | 'products' | 'users' | 'orders' | 'flash-deals';

export const AdminDashboard = () => {
  const { user, logout, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  useEffect(() => {
    // Redirect to home if not admin and not loading
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-4">You need admin privileges to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 border border-gray-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-400">Welcome, {user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors border border-gray-700 rounded-lg hover:bg-gray-800"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8 border-b border-gray-800">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stats'
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'products'
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <Package className="w-5 h-5" />
              Products
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <Users className="w-5 h-5" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'orders'
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('flash-deals')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'flash-deals'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-orange-300 hover:border-orange-600'
              }`}
            >
              <Zap className={`w-5 h-5 ${activeTab === 'flash-deals' ? 'fill-orange-400' : ''}`} />
              Flash Deals
            </button>
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'stats' && (
            <AdminStats 
              onNavigateToProducts={(filter) => {
                setActiveTab('products');
                // Store filter for AdminProducts to use
                sessionStorage.setItem('productFilter', filter || 'all');
              }}
            />
          )}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'flash-deals' && <AdminFlashDeals />}
        </div>
      </div>
    </div>
  );
};

