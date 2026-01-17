import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { Plus, Edit, Trash2, X, Zap, Calendar } from 'lucide-react';
import { CountdownTimer } from '../CountdownTimer';

export const AdminFlashDeals = () => {
  const [deals, setDeals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    discount_percentage: '',
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    loadDeals();
    loadProducts();
  }, []);

  const loadDeals = async () => {
    try {
      const data = await adminApi.getFlashDeals();
      setDeals(data);
    } catch (error) {
      console.error('Failed to load flash deals:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createFlashDeal({
        ...formData,
        discount_percentage: parseFloat(formData.discount_percentage),
      });
      await loadDeals();
      handleCloseModal();
      alert('Flash deal created successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to create flash deal');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flash deal?')) return;
    try {
      await adminApi.deleteFlashDeal(id);
      await loadDeals();
    } catch (error: any) {
      alert(error.message || 'Failed to delete flash deal');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      product_id: '',
      discount_percentage: '',
      start_time: '',
      end_time: '',
    });
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading flash deals...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-400 fill-orange-400" />
            Flash Deals
          </h2>
          <p className="text-sm text-gray-400 mt-1">Create time-limited discounts to boost sales</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors font-semibold shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Flash Deal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-900/20 to-gray-900 border border-green-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Deals</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                {deals.filter(d => {
                  const now = new Date();
                  return d.is_active && now >= new Date(d.start_time) && now <= new Date(d.end_time);
                }).length}
              </p>
            </div>
            <Zap className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-900/20 to-gray-900 border border-yellow-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">
                {deals.filter(d => new Date() < new Date(d.start_time)).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-900/20 to-gray-900 border border-red-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Expired</p>
              <p className="text-2xl font-bold text-red-400 mt-1">
                {deals.filter(d => new Date() > new Date(d.end_time)).length}
              </p>
            </div>
            <X className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Active Deals */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time Remaining</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {deals.map((deal) => {
                const now = new Date();
                const start = new Date(deal.start_time);
                const end = new Date(deal.end_time);
                const isActive = deal.is_active && now >= start && now <= end;
                const isPending = now < start;
                const isExpired = now > end;

                return (
                  <tr key={deal.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {deal.image_url && (
                          <img src={deal.image_url} alt={deal.product_name} className="w-12 h-12 rounded object-cover" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-white">{deal.product_name}</div>
                          <div className="text-xs text-gray-400">
                            Original: Rs. {Number(deal.original_price).toFixed(2)} → 
                            <span className="text-orange-400 font-semibold ml-1">
                              Rs. {(Number(deal.original_price) * (1 - deal.discount_percentage / 100)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-sm font-bold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1 w-fit">
                        <Zap className="w-3 h-3 fill-orange-400" />
                        {deal.discount_percentage}% OFF
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isActive && <CountdownTimer endTime={deal.end_time} onExpire={loadDeals} />}
                      {isPending && (
                        <div className="text-sm text-yellow-400">
                          Starts in: {Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60))}h
                        </div>
                      )}
                      {isExpired && <span className="text-sm text-red-400">Expired</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Start:</span>
                          <span>{new Date(deal.start_time).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">End:</span>
                          <span>{new Date(deal.end_time).toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isActive && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
                          🔥 Active
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          ⏳ Pending
                        </span>
                      )}
                      {isExpired && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          ❌ Expired
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(deal.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {deals.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Zap className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-semibold mb-2">No flash deals created yet</p>
            <p className="text-sm">Create your first flash deal to boost sales!</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-orange-400 fill-orange-400" />
                Create Flash Deal
              </h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Product *</label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Rs. {Number(product.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Discount Percentage (1-99%) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="99"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., 30"
                />
                <p className="text-xs text-gray-500 mt-1">Higher discounts attract more customers!</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Preview */}
              {formData.product_id && formData.discount_percentage && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Preview:</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">
                        {products.find(p => p.id === formData.product_id)?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-orange-400">
                          Rs. {(Number(products.find(p => p.id === formData.product_id)?.price || 0) * (1 - Number(formData.discount_percentage) / 100)).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          Rs. {Number(products.find(p => p.id === formData.product_id)?.price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-sm font-bold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {formData.discount_percentage}% OFF
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 shadow-lg transition-all"
                >
                  Create Flash Deal
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-gray-700 rounded-lg font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
