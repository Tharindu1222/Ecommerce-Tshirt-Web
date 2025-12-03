import { useState, useEffect } from 'react';
import { productsApi } from '../lib/api';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ProductModal } from './ProductModal';

export const ProductGrid = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState<'all' | 't-shirt' | 'hoodie'>('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = filter === 'all'
    ? products
    : products.filter(p => p.category === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-400">Loading products...</div>
      </div>
    );
  }

  return (
    <div id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">Our Collection</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Discover our range of premium oversized apparel, crafted for comfort and style.
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors border ${
            filter === 'all'
              ? 'bg-gray-800 text-white border-gray-700'
              : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border-gray-800'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('t-shirt')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors border ${
            filter === 't-shirt'
              ? 'bg-gray-800 text-white border-gray-700'
              : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border-gray-800'
          }`}
        >
          T-Shirts
        </button>
        <button
          onClick={() => setFilter('hoodie')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors border ${
            filter === 'hoodie'
              ? 'bg-gray-800 text-white border-gray-700'
              : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border-gray-800'
          }`}
        >
          Hoodies
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => setSelectedProduct(product)}
          />
        ))}
      </div>

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
