import { X, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { CountdownTimer } from './CountdownTimer';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal = ({ product, onClose }: ProductModalProps) => {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();

  if (!product) return null;

  const stock = Number(product.stock) || 0;
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 5;

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      alert('Please select size and color');
      return;
    }

    if (isOutOfStock) {
      alert('This product is out of stock');
      return;
    }

    if (quantity > stock) {
      alert(`Only ${stock} items available in stock`);
      return;
    }

    try {
      setIsAdding(true);
      await addToCart(product, selectedSize, selectedColor, quantity);
      onClose();
    } catch (error) {
      alert('Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
      <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{product.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-[3/4] rounded-lg overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-6">
              <div>
                {/* Flash Deal Badge and Countdown */}
                {product.flashDeal && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-orange-400 font-bold text-sm flex items-center gap-2">
                        ⚡ FLASH DEAL - {product.flashDeal.discount_percentage}% OFF
                      </span>
                    </div>
                    <CountdownTimer endTime={product.flashDeal.end_time} />
                  </div>
                )}

                {/* Price Display */}
                <div className="flex items-center gap-3 mb-2">
                  {product.flashDeal ? (
                    <>
                      <p className="text-3xl font-bold text-orange-400">
                        Rs. {(product.price * (1 - product.flashDeal.discount_percentage / 100)).toFixed(2)}
                      </p>
                      <p className="text-xl text-gray-500 line-through">
                        Rs. {product.price}
                      </p>
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                        SAVE {product.flashDeal.discount_percentage}%
                      </span>
                    </>
                  ) : (
                    <p className="text-3xl font-bold text-white">Rs. {product.price}</p>
                  )}
                </div>

                {/* Stock Status */}
                <div className="mb-3">
                  {isOutOfStock ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-lg">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="text-red-400 font-semibold text-sm">Out of Stock</span>
                    </div>
                  ) : isLowStock ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/50 rounded-lg">
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                      <span className="text-orange-400 font-semibold text-sm">Only {stock} left in stock!</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-lg">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-green-400 font-semibold text-sm">In Stock ({stock} available)</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-400 leading-relaxed">{product.description}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={isOutOfStock}
                      className={`px-6 py-2 border-2 rounded-lg font-medium transition-all ${
                        selectedSize === size
                          ? 'border-gray-700 bg-gray-800 text-white'
                          : 'border-gray-700 text-gray-300 hover:border-gray-600 bg-gray-900'
                      } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      disabled={isOutOfStock}
                      className={`px-6 py-2 border-2 rounded-lg font-medium transition-all ${
                        selectedColor === color
                          ? 'border-gray-700 bg-gray-800 text-white'
                          : 'border-gray-700 text-gray-300 hover:border-gray-600 bg-gray-900'
                      } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Quantity {!isOutOfStock && <span className="text-gray-500 text-xs">(Max: {stock})</span>}
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock || quantity <= 1}
                    className="p-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                    disabled={isOutOfStock || quantity >= stock}
                    className="p-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {!isOutOfStock && quantity >= stock && (
                  <p className="text-xs text-orange-400 mt-2">Maximum available quantity</p>
                )}
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isAdding || isOutOfStock}
                className={`w-full py-4 rounded-lg font-semibold transition-colors border ${
                  isOutOfStock
                    ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                    : 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isOutOfStock ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
