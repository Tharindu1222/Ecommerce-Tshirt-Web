import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const Cart = ({ isOpen, onClose, onCheckout }: CartProps) => {
  const { cartItems, removeFromCart, updateQuantity, refreshCart } = useCart();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Refresh cart when opened to get latest flash deals
  useEffect(() => {
    if (isOpen) {
      refreshCart();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((total, item) => {
    const price = item.product?.price || 0;
    const flashDeal = item.product?.flashDeal;
    const finalPrice = flashDeal 
      ? price * (1 - flashDeal.discount_percentage / 100)
      : price;
    return total + finalPrice * item.quantity;
  }, 0);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number, stock: number) => {
    // Validate stock
    if (newQuantity > stock) {
      alert(`Only ${stock} items available in stock`);
      return;
    }

    if (newQuantity < 1) {
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      alert('Failed to update quantity');
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black bg-opacity-80" onClick={onClose} />

      <div className="relative bg-gray-900 border-l border-gray-800 w-full max-w-md h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-gray-400 text-lg mb-2">Your cart is empty</p>
              <p className="text-gray-500 text-sm">Add some items to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const stock = Number(item.product?.stock) || 0;
                const isOutOfStock = stock === 0;
                const exceedsStock = item.quantity > stock;
                
                return (
                  <div key={item.id} className="flex gap-4 p-4 border border-gray-800 bg-gray-800 rounded-lg">
                    <img
                      src={item.product?.image_url}
                      alt={item.product?.name}
                      className="w-24 h-32 object-cover rounded-md"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{item.product?.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {item.size} / {item.color}
                        </p>
                        
                        {/* Stock Warning */}
                        {isOutOfStock && (
                          <div className="mt-2 text-xs text-red-400 font-semibold">
                            ⚠️ Out of Stock - Remove from cart
                          </div>
                        )}
                        {!isOutOfStock && exceedsStock && (
                          <div className="mt-2 text-xs text-orange-400 font-semibold">
                            ⚠️ Only {stock} available - Adjust quantity
                          </div>
                        )}
                        {!isOutOfStock && !exceedsStock && stock <= 5 && (
                          <div className="mt-2 text-xs text-orange-400">
                            Only {stock} left in stock
                          </div>
                        )}
                        
                        {item.product?.flashDeal ? (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold text-orange-400">
                                Rs. {(item.product.price * (1 - item.product.flashDeal.discount_percentage / 100)).toFixed(2)}
                              </p>
                              <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded font-bold">
                                -{item.product.flashDeal.discount_percentage}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 line-through">
                              Rs. {item.product.price}
                            </p>
                          </div>
                        ) : (
                          <p className="text-lg font-bold text-white mt-2">
                            Rs. {item.product?.price}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, stock)}
                            disabled={updatingItems.has(item.id) || item.quantity <= 1}
                            className="p-1 border border-gray-700 rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-medium w-8 text-center text-white">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, stock)}
                            disabled={updatingItems.has(item.id) || isOutOfStock || item.quantity >= stock}
                            className="p-1 border border-gray-700 rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-gray-800 p-6 space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold text-white">Subtotal</span>
              <span className="font-bold text-white">Rs. {subtotal.toFixed(2)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-gray-800 text-white py-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors border border-gray-700"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
