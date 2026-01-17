import { Product } from '../types';
import { CountdownTimer } from './CountdownTimer';
import { Zap } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const flashDeal = product.flashDeal;
  const originalPrice = Number(product.price);
  const discountedPrice = flashDeal 
    ? originalPrice * (1 - flashDeal.discount_percentage / 100)
    : originalPrice;
  
  const stock = Number(product.stock) || 0;
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 5;

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer bg-gray-900 border border-gray-800 rounded-lg overflow-hidden transition-all duration-300 hover:bg-gray-800 hover:border-gray-700 ${
        isOutOfStock ? 'opacity-75' : ''
      }`}
    >
      <div className="relative overflow-hidden aspect-[3/4]">
        <img
          src={product.image_url}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            isOutOfStock ? 'grayscale' : ''
          }`}
        />
        
        {/* Out of Stock Badge - Top Right */}
        {isOutOfStock && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
            OUT OF STOCK
          </div>
        )}
        
        {/* Low Stock Badge */}
        {isLowStock && !flashDeal && (
          <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
            ONLY {stock} LEFT
          </div>
        )}
        
        {/* Flash Deal Badge - Top Left */}
        {flashDeal && !isOutOfStock && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <Zap className="w-3 h-3 fill-white" />
              {flashDeal.discount_percentage}% OFF
            </span>
            <div className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded">
              <CountdownTimer endTime={flashDeal.end_time} compact />
            </div>
          </div>
        )}
        
        {/* Featured Badge */}
        {!flashDeal && !isOutOfStock && !isLowStock && product.featured && (
          <span className="absolute top-4 left-4 bg-gray-800 text-white text-xs font-medium px-3 py-1 rounded-full border border-gray-700">
            Featured
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-gray-200 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            {isOutOfStock ? (
              <>
                <span className="text-xl font-bold text-gray-500">Rs. {originalPrice.toFixed(2)}</span>
                <span className="text-xs text-red-400 font-semibold">Unavailable</span>
              </>
            ) : flashDeal ? (
              <>
                <span className="text-xl font-bold text-orange-400">Rs. {discountedPrice.toFixed(2)}</span>
                <span className="text-sm text-gray-500 line-through">Rs. {originalPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-xl font-bold text-white">Rs. {originalPrice.toFixed(2)}</span>
            )}
          </div>
          <span className="text-xs text-gray-400 uppercase">{product.category}</span>
        </div>
        
        {/* Stock Indicator */}
        {!isOutOfStock && isLowStock && (
          <div className="flex items-center gap-1 text-xs text-orange-400">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></span>
            <span>Only {stock} left</span>
          </div>
        )}
        
        {!isOutOfStock && !isLowStock && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            <span>In Stock</span>
          </div>
        )}
      </div>
    </div>
  );
};
