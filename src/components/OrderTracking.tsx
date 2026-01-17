import { useState } from 'react';
import { Search, Package, Clock, Truck, CheckCircle, XCircle, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../lib/api';
import { downloadInvoice } from '../utils/invoiceGenerator';

interface Order {
  id: string;
  email: string;
  total_amount: number;
  status: string;
  payment_method: string;
  shipping_address: any;
  created_at: string;
  items: any[];
}

export const OrderTracking = () => {
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const data = await ordersApi.getByEmail(email);
      setOrders(data || []);
    } catch (err) {
      setError('Failed to fetch orders. Please try again.');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'processing':
        return <Package className="w-5 h-5 text-blue-400" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-400" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'shipped':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'delivered':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    try {
      const shippingAddress = typeof order.shipping_address === 'string'
        ? JSON.parse(order.shipping_address)
        : order.shipping_address;

      // Safety check for items
      if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
        alert('Order items not found. Please refresh and try again.');
        return;
      }

      const subtotal = order.items.reduce((sum, item) => 
        sum + (Number(item.price) * Number(item.quantity)), 0
      );

      downloadInvoice({
        orderId: order.id,
        orderDate: order.created_at,
        customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        customerEmail: order.email,
        customerPhone: shippingAddress.phone || 'N/A',
        shippingAddress: shippingAddress,
        items: order.items.map(item => ({
          name: item.product_name || 'Product',
          quantity: Number(item.quantity),
          price: Number(item.price),
          size: item.size,
          color: item.color,
        })),
        subtotal: subtotal,
        tax: 0,
        total: Number(order.total_amount),
        status: order.status,
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-8 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Shop</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Track Your Order</h1>
          <p className="text-gray-400 text-lg">
            Enter your email address to view all your orders
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <form onSubmit={handleSearch}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                {loading ? 'Searching...' : 'Track Orders'}
              </button>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            )}
          </form>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-gray-400 mt-4">Searching for your orders...</p>
          </div>
        )}

        {!loading && searched && orders.length === 0 && (
          <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-lg">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Orders Found</h3>
            <p className="text-gray-400">
              We couldn't find any orders associated with this email address.
            </p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                Your Orders ({orders.length})
              </h2>
            </div>

            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-800">
                  <div>
                    <p className="text-sm text-gray-400">Order ID</p>
                    <p className="text-white font-mono text-sm">
                      #{order.id.substring(0, 8)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Order Date</p>
                    <p className="text-white">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Status</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="text-sm font-semibold capitalize">
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total</p>
                    <p className="text-white font-bold text-lg">
                      Rs. {Number(order.total_amount).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Order Items:</h4>
                  <div className="space-y-2">
                    {order.items && order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm bg-gray-800 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {item.product_image && (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="text-white font-medium">
                              {item.product_name || 'Product'}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {item.size} / {item.color} • Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="text-white font-semibold">
                          Rs. {(Number(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Shipping Address:</h4>
                  <div className="text-sm text-gray-300 bg-gray-800 p-3 rounded-lg">
                    {(() => {
                      const address = typeof order.shipping_address === 'string'
                        ? JSON.parse(order.shipping_address)
                        : order.shipping_address;
                      return (
                        <>
                          <p>{address.firstName} {address.lastName}</p>
                          <p>{address.address}</p>
                          <p>{address.city}, {address.state} {address.zipCode}</p>
                          <p>{address.country}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownloadInvoice(order)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
                  >
                    <Download className="w-4 h-4" />
                    Download Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
