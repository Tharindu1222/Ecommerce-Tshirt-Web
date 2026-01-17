import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { ShoppingBag, Search, Filter, CheckCircle, Clock, Truck, XCircle, Package, CreditCard, DollarSign } from 'lucide-react';

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
  payment_method?: 'cod' | 'payhere';
  payment_status?: 'pending' | 'awaiting_payment' | 'paid' | 'failed';
  payment_id?: string;
  transaction_id?: string;
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

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  processing: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  shipped: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
  delivered: 'bg-green-500/10 text-green-400 border border-green-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border border-red-500/30',
  payment_pending: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  payment_pending: Clock,
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

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${numAmount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-400">Loading orders...</p>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        
        <div className="bg-gray-900 border border-yellow-500/30 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-400 uppercase">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400/50" />
          </div>
        </div>
        
        <div className="bg-gray-900 border border-blue-500/30 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-400 uppercase">Processing</p>
              <p className="text-2xl font-bold text-blue-400">{stats.processing}</p>
            </div>
            <Package className="w-8 h-8 text-blue-400/50" />
          </div>
        </div>
        
        <div className="bg-gray-900 border border-purple-500/30 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-400 uppercase">Shipped</p>
              <p className="text-2xl font-bold text-purple-400">{stats.shipped}</p>
            </div>
            <Truck className="w-8 h-8 text-purple-400/50" />
          </div>
        </div>
        
        <div className="bg-gray-900 border border-green-500/30 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-400 uppercase">Delivered</p>
              <p className="text-2xl font-bold text-green-400">{stats.delivered}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400/50" />
          </div>
        </div>
        
        <div className="bg-gray-900 border border-red-500/30 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-400 uppercase">Cancelled</p>
              <p className="text-2xl font-bold text-red-400">{stats.cancelled}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400/50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by customer email..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-w-[150px]"
            >
              <option value="all">All Orders</option>
              <option value="pending">🟡 Pending</option>
              <option value="processing">🔵 Processing</option>
              <option value="shipped">🟣 Shipped</option>
              <option value="delivered">🟢 Delivered</option>
              <option value="cancelled">🔴 Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Orders ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-lg text-gray-400 mb-2">No orders found</p>
            <p className="text-sm text-gray-500">
              {statusFilter !== 'all' ? 'Try changing the filter' : 'Orders will appear here when customers make purchases'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {orders.map((order) => {
              const StatusIcon = statusIcons[order.status] || Clock;
              const customerName = (order.shipping_address?.firstName && order.shipping_address?.lastName)
                ? `${order.shipping_address.firstName} ${order.shipping_address.lastName}`
                : (order.first_name && order.last_name)
                ? `${order.first_name} ${order.last_name}`
                : 'Guest';

              return (
                <div
                  key={order.id}
                  className="p-6 hover:bg-gray-800/50 transition-all cursor-pointer group"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center group-hover:border-gray-600 transition-colors">
                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white text-base truncate">
                              {customerName}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                statusColors[order.status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                              }`}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              {order.status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 truncate">
                            {order.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(order.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span className="font-mono text-gray-500">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xl font-bold text-white mb-1">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <button className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        View Details →
                      </button>
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
              className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm"
              onClick={() => setSelectedOrder(null)}
            />
            <div className="relative bg-gray-900 border border-gray-700 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-6 py-5 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Order Details
                  </h2>
                  <p className="text-sm text-gray-400">
                    Order ID: <span className="font-mono text-gray-300">#{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <p className="text-xs text-gray-400 uppercase font-medium">Order Date</p>
                    </div>
                    <p className="font-semibold text-white text-sm">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <p className="text-xs text-gray-400 uppercase font-medium">Items</p>
                    </div>
                    <p className="font-semibold text-white">{selectedOrder.items?.length || 0} {selectedOrder.items?.length === 1 ? 'Product' : 'Products'}</p>
                  </div>
                  
                  <div className={`border p-4 rounded-lg ${
                    selectedOrder.payment_method === 'payhere' 
                      ? 'bg-blue-500/10 border-blue-500/30' 
                      : 'bg-green-500/10 border-green-500/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedOrder.payment_method === 'payhere' ? (
                        <CreditCard className="w-4 h-4 text-blue-400" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-green-400" />
                      )}
                      <p className={`text-xs uppercase font-medium ${
                        selectedOrder.payment_method === 'payhere' ? 'text-blue-400' : 'text-green-400'
                      }`}>Payment</p>
                    </div>
                    <p className={`font-semibold ${
                      selectedOrder.payment_method === 'payhere' ? 'text-blue-400' : 'text-green-400'
                    }`}>
                      {selectedOrder.payment_method === 'payhere' ? 'PayHere' : 'Cash on Delivery'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedOrder.payment_status === 'paid' ? '✓ Paid' : 
                       selectedOrder.payment_status === 'awaiting_payment' ? '⏳ Awaiting' : 
                       selectedOrder.payment_status === 'failed' ? '✗ Failed' : '• Pending'}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="w-4 h-4 text-blue-400" />
                      <p className="text-xs text-blue-400 uppercase font-medium">Total Amount</p>
                    </div>
                    <p className="font-bold text-2xl text-white">{formatCurrency(selectedOrder.total_amount)}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-5">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 text-sm font-bold">
                        {selectedOrder.shipping_address?.firstName?.charAt(0) || selectedOrder.email?.charAt(0).toUpperCase() || 'G'}
                      </span>
                    </div>
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Email</p>
                      <p className="text-sm text-white">{selectedOrder.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Phone</p>
                      <p className="text-sm text-white">{selectedOrder.shipping_address?.phone || selectedOrder.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Status Update */}
                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-5">
                  <label className="block text-sm font-semibold text-white mb-4">
                    Update Order Status
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((status) => {
                      const StatusIcon = statusIcons[status] || Clock;
                      const isCurrentStatus = selectedOrder.status === status;
                      const isUpdating = updatingStatus === selectedOrder.id;

                      return (
                        <button
                          key={status}
                          onClick={() => !isCurrentStatus && updateOrderStatus(selectedOrder.id, status)}
                          disabled={isUpdating || isCurrentStatus}
                          className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                            isCurrentStatus
                              ? (statusColors[status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/30') + ' ring-2 ring-offset-2 ring-offset-gray-900 shadow-lg'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700 disabled:opacity-50'
                          }`}
                        >
                          <StatusIcon className="w-5 h-5" />
                          <span className="text-xs">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                          {isCurrentStatus && (
                            <span className="text-[10px] opacity-75">Current</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {updatingStatus === selectedOrder.id && (
                    <p className="text-xs text-blue-400 mt-3 text-center">Updating status...</p>
                  )}
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-5">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-purple-400" />
                    Shipping Address
                  </h3>
                  <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg space-y-2">
                    <p className="text-white font-semibold text-lg">
                      {selectedOrder.shipping_address?.firstName || 'N/A'}{' '}
                      {selectedOrder.shipping_address?.lastName || ''}
                    </p>
                    <p className="text-gray-300">{selectedOrder.shipping_address?.address || 'No address provided'}</p>
                    <p className="text-gray-300">
                      {selectedOrder.shipping_address?.city || 'N/A'}, {selectedOrder.shipping_address?.state || 'N/A'}{' '}
                      {selectedOrder.shipping_address?.zipCode || ''}
                    </p>
                    <p className="text-gray-300">{selectedOrder.shipping_address?.country || 'N/A'}</p>
                    <div className="pt-2 mt-2 border-t border-gray-700">
                      <p className="text-sm text-gray-400">
                        📞 Phone: <span className="text-white">{selectedOrder.shipping_address?.phone || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-5">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-400" />
                    Order Items ({selectedOrder.items?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 border border-gray-700 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                        <div className="flex-shrink-0">
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-700"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-white text-base">{item.product_name}</h4>
                            <p className="font-bold text-white whitespace-nowrap">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            <span className="inline-flex items-center px-2 py-1 bg-gray-900 border border-gray-700 rounded text-gray-300">
                              Size: <span className="font-semibold ml-1">{item.size}</span>
                            </span>
                            <span className="inline-flex items-center px-2 py-1 bg-gray-900 border border-gray-700 rounded text-gray-300">
                              Color: <span className="font-semibold ml-1">{item.color}</span>
                            </span>
                            <span className="inline-flex items-center px-2 py-1 bg-gray-900 border border-gray-700 rounded text-gray-300">
                              Qty: <span className="font-semibold ml-1">{item.quantity}</span>
                            </span>
                            <span className="text-gray-500">
                              {formatCurrency(item.price)} each
                            </span>
                          </div>
                        </div>
                      </div>
                    )) || <p className="text-gray-400 text-center py-4">No items found</p>}
                    
                    {/* Order Total */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-between text-lg">
                        <span className="font-semibold text-white">Order Total</span>
                        <span className="font-bold text-2xl text-white">{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
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

