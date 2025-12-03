import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { ShoppingBag, Search, Filter, CheckCircle, Clock, Truck, XCircle, Package } from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
}

interface Order {
  id: string;
  email: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  created_at: string;
  items: OrderItem[];
  first_name?: string;
  last_name?: string;
  phone?: string;
}

const statusColors = {
  pending: 'bg-gray-800 text-gray-300 border border-gray-700',
  processing: 'bg-gray-800 text-gray-300 border border-gray-700',
  shipped: 'bg-gray-800 text-gray-300 border border-gray-700',
  delivered: 'bg-gray-800 text-gray-300 border border-gray-700',
  cancelled: 'bg-gray-800 text-gray-400 border border-gray-700',
};

const statusIcons = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [emailFilter, setEmailFilter] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, emailFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (emailFilter) {
        params.append('email', emailFilter);
      }
      
      const queryString = params.toString();
      const data = await adminApi.getOrders(queryString);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      const updatedOrder = await adminApi.updateOrderStatus(orderId, newStatus);
      
      setOrders(orders.map(order => 
        order.id === orderId ? updatedOrder : order
      ));
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-400">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by email..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-500 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            Orders ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No orders found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {orders.map((order) => {
              const StatusIcon = statusIcons[order.status];
              return (
                <div
                  key={order.id}
                  className="p-6 hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">
                          Order #{order.id.slice(0, 8)}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[order.status]
                          }`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">
                        {order.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.created_at)} • {order.items.length} item(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-80"
              onClick={() => setSelectedOrder(null)}
            />
            <div className="relative bg-gray-900 border border-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  Order Details
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-medium text-white">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-white">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-white">{selectedOrder.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium text-lg text-white">{formatCurrency(selectedOrder.total_amount)}</p>
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Order Status
                  </label>
                  <div className="flex gap-2">
                    {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((status) => {
                      const StatusIcon = statusIcons[status];
                      const isCurrentStatus = selectedOrder.status === status;
                      const isUpdating = updatingStatus === selectedOrder.id;

                      return (
                        <button
                          key={status}
                          onClick={() => !isCurrentStatus && updateOrderStatus(selectedOrder.id, status)}
                          disabled={isUpdating || isCurrentStatus}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isCurrentStatus
                              ? statusColors[status] + ' cursor-default'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 disabled:opacity-50'
                          }`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="font-semibold text-white mb-3">Shipping Address</h3>
                  <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
                    <p className="text-white">
                      {selectedOrder.shipping_address.firstName}{' '}
                      {selectedOrder.shipping_address.lastName}
                    </p>
                    <p className="text-gray-400">{selectedOrder.shipping_address.address}</p>
                    <p className="text-gray-400">
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}{' '}
                      {selectedOrder.shipping_address.zipCode}
                    </p>
                    <p className="text-gray-400">{selectedOrder.shipping_address.country}</p>
                    <p className="text-gray-400 mt-2">Phone: {selectedOrder.shipping_address.phone}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-white mb-3">Order Items</h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 border border-gray-800 bg-gray-800 rounded-lg">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{item.product_name}</h4>
                          <p className="text-sm text-gray-400">
                            Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-medium text-white mt-1">
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

