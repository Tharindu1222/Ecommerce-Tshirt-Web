import { X, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { ordersApi } from '../lib/api';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    payhere: any;
  }
}

export const Checkout = ({ isOpen, onClose }: CheckoutProps) => {
  const { cartItems, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'payhere'>('cod');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Sri Lanka'
  });

  if (!isOpen) return null;

  const total = cartItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    const flashDeal = item.product?.flashDeal;
    const finalPrice = flashDeal 
      ? price * (1 - flashDeal.discount_percentage / 100)
      : price;
    return sum + finalPrice * item.quantity;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const orderItems = cartItems.map(item => {
        const price = item.product?.price || 0;
        const flashDeal = item.product?.flashDeal;
        const finalPrice = flashDeal 
          ? price * (1 - flashDeal.discount_percentage / 100)
          : price;
        
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: finalPrice
        };
      });

      if (paymentMethod === 'cod') {
        // Cash on Delivery - Create order directly
        await ordersApi.create(formData.email, total, formData, orderItems, 'cod');
        await clearCart();
        setOrderSuccess(true);
      } else {
        // PayHere Payment
        const order = await ordersApi.create(formData.email, total, formData, orderItems, 'payhere');
        initiatePayHerePayment(order, total);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process order. Please try again.');
      setIsProcessing(false);
    }
  };

  const initiatePayHerePayment = (order: any, amount: number) => {
    // PayHere Configuration
    const payment = {
      sandbox: true, // Set to false for production
      merchant_id: '1227907', // Replace with your Merchant ID
      return_url: window.location.origin + '/payment-success',
      cancel_url: window.location.origin + '/payment-cancel',
      notify_url: window.location.origin + '/api/payment/notify',
      order_id: order.id,
      items: cartItems.map(item => item.product?.name).join(', '),
      amount: amount.toFixed(2),
      currency: 'LKR',
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      hash: '', // This should be generated on backend for security
    };

    // Initialize PayHere
    if (window.payhere) {
      window.payhere.onCompleted = async function onCompleted(orderId: string) {
        console.log('Payment completed. OrderID:' + orderId);
        await clearCart();
        setOrderSuccess(true);
        setIsProcessing(false);
      };

      window.payhere.onDismissed = function onDismissed() {
        console.log('Payment dismissed');
        setIsProcessing(false);
      };

      window.payhere.onError = function onError(error: string) {
        console.log('Error:' + error);
        alert('Payment failed: ' + error);
        setIsProcessing(false);
      };

      window.payhere.startPayment(payment);
    } else {
      alert('PayHere payment gateway is not loaded. Please refresh the page.');
      setIsProcessing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
        <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Order Placed!</h2>
          <p className="text-gray-400 mb-6">
            Thank you for your order. You will receive a confirmation email shortly.
          </p>
          <button
            onClick={() => {
              setOrderSuccess(false);
              onClose();
            }}
            className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors border border-gray-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Checkout</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
            <div className="space-y-3">
              {cartItems.map((item) => {
                const price = item.product?.price || 0;
                const flashDeal = item.product?.flashDeal;
                const finalPrice = flashDeal 
                  ? price * (1 - flashDeal.discount_percentage / 100)
                  : price;
                
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {item.product?.name} ({item.size}, {item.color}) x{item.quantity}
                      {flashDeal && (
                        <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-0.5 rounded font-bold">
                          -{flashDeal.discount_percentage}% OFF
                        </span>
                      )}
                    </span>
                    <span className="font-medium text-white">
                      Rs. {(finalPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
              <div className="border-t border-gray-800 pt-3 flex justify-between font-bold text-lg text-white">
                <span>Total</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <DollarSign className={`w-8 h-8 ${paymentMethod === 'cod' ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${paymentMethod === 'cod' ? 'text-green-400' : 'text-white'}`}>
                    Cash on Delivery
                  </span>
                  <span className="text-xs text-gray-400">Pay when you receive</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('payhere')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'payhere'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <CreditCard className={`w-8 h-8 ${paymentMethod === 'payhere' ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${paymentMethod === 'payhere' ? 'text-blue-400' : 'text-white'}`}>
                    PayHere
                  </span>
                  <span className="text-xs text-gray-400">Credit/Debit Card</span>
                </div>
              </button>
            </div>
            
            {paymentMethod === 'cod' && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-400">
                  You will pay in cash when your order is delivered to your address.
                </p>
              </div>
            )}
            
            {paymentMethod === 'payhere' && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-400">
                  Secure payment powered by PayHere. All major credit and debit cards accepted.
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Shipping Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+94 77 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Street address, apartment, suite, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    State/Province *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    ZIP/Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Country *
                  </label>
                  <select
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Sri Lanka">Sri Lanka</option>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full py-4 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              paymentMethod === 'cod'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isProcessing
              ? 'Processing...'
              : paymentMethod === 'cod'
              ? '💵 Place Order (COD)'
              : '💳 Proceed to Payment'}
          </button>
        </form>
      </div>
    </div>
  );
};
