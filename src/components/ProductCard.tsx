import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard = ({ product, onClick }: ProductCardProps) => {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-gray-900 border border-gray-800 rounded-lg overflow-hidden transition-all duration-300 hover:bg-gray-800 hover:border-gray-700"
    >
      <div className="relative overflow-hidden aspect-[3/4]">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {product.featured && (
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
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-white">${product.price}</span>
          <span className="text-xs text-gray-400 uppercase">{product.category}</span>
        </div>
      </div>
    </div>
  );
};
