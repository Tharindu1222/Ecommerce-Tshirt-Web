import { X, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

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

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      alert('Please select size and color');
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
                <p className="text-3xl font-bold text-white mb-2">${product.price}</p>
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
                      className={`px-6 py-2 border-2 rounded-lg font-medium transition-all ${
                        selectedSize === size
                          ? 'border-gray-700 bg-gray-800 text-white'
                          : 'border-gray-700 text-gray-300 hover:border-gray-600 bg-gray-900'
                      }`}
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
                      className={`px-6 py-2 border-2 rounded-lg font-medium transition-all ${
                        selectedColor === color
                          ? 'border-gray-700 bg-gray-800 text-white'
                          : 'border-gray-700 text-gray-300 hover:border-gray-600 bg-gray-900'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-gray-300"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-gray-300"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="w-full bg-gray-800 text-white py-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700"
              >
                {isAdding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
