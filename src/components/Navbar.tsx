import { ShoppingCart, Menu, X, User, LogOut, Settings, Package } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import zanLogo from './zan1.png';

interface NavbarProps {
  onCartClick: () => void;
  onLoginClick: () => void;
  onProfileClick: () => void;
}

export const Navbar = ({ onCartClick, onLoginClick, onProfileClick }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { user, logout, isAdmin } = useAuth();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={zanLogo} 
                alt="ZANRU Logo" 
                className="h-20 w-auto"
              />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Shop</a>
            <a href="#new" className="text-gray-300 hover:text-white transition-colors">New Arrivals</a>
            <Link to="/customize" className="text-gray-300 hover:text-white transition-colors">Customize</Link>
            <Link to="/track-order" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
              <Package className="w-4 h-4" />
              Track Order
            </Link>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="p-2 text-gray-300 hover:text-white transition-colors"
                    title="Admin Dashboard"
                  >
                    <Settings className="w-6 h-6" />
                  </Link>
                )}
                <button
                  onClick={onProfileClick}
                  className="p-2 text-gray-300 hover:text-white transition-colors"
                  title="Profile"
                >
                  <User className="w-6 h-6" />
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-gray-300 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
              >
                Login
              </button>
            )}
            <button
              onClick={onCartClick}
              className="relative p-2 text-gray-300 hover:text-white transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border border-gray-700">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-300"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900">
          <div className="px-4 py-3 space-y-3">
            <a href="#" className="block text-gray-300 hover:text-white">Shop</a>
            <a href="#new" className="block text-gray-300 hover:text-white">New Arrivals</a>
            <Link to="/customize" className="block text-gray-300 hover:text-white">Customize</Link>
            <a href="#about" className="block text-gray-300 hover:text-white">About</a>
          </div>
        </div>
      )}
    </nav>
  );
};
