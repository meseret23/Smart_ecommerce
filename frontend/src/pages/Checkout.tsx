import React, { useState } from 'react';
import type { CartItem } from '../App';
import { submitOrder } from '../services/orderService';

interface CheckoutProps {
  cart: CartItem[];
  onClearCart: () => void;
  onBackToShop: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ cart, onClearCart, onBackToShop }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    deliveryAddress: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate total amount securely for display purposes
  const totalAmount = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  // Secure validation function for Ethiopian phone numbers (+2519... or 09... / 07...)
  const validatePhone = (phone: string) => {
    const ethiopianPhoneRegex = /^(?:\+251|0)[97]\d{8}$/;
    return ethiopianPhoneRegex.test(phone.trim());
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Frontend Validation Security Checks
    if (!formData.customerName.trim() || !formData.phone.trim() || !formData.deliveryAddress.trim()) {
      setError('Please fill in all required delivery fields.');
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError('Please enter a valid Ethiopian phone number (e.g., 0911223344 or +251911223344).');
      return;
    }

    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setLoading(true);

    try {
      // 2. Prepare payload (Only sending IDs and quantities to prevent price tampering)
      const payload = {
        customerName: formData.customerName.trim(),
        phone: formData.phone.trim(),
        deliveryAddress: formData.deliveryAddress.trim(),
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: Number(item.price), // Sent for reference, but backend must re-verify!
        })),
      };

      await submitOrder(payload);
      setSuccess(true);
      onClearCart(); // Clear cart on success
    } catch (err: any) {
      setError(err.message || 'Failed to submit order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 shadow-sm">
          <span className="text-5xl">🎉</span>
          <h2 className="text-2xl font-bold text-green-800 mt-4">Order Placed Successfully!</h2>
          <p className="text-gray-600 mt-2 text-sm">
            Thank you, {formData.customerName}! Your order has been securely logged and will be delivered to your address.
          </p>
          <button
            onClick={onBackToShop}
            className="mt-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Secure Checkout</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <form onSubmit={handleSubmitOrder} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-lg border-b pb-2">Delivery Information</h3>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Full Name</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Abebe Kebede"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Phone Number (Ethiopia)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0911223344"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
            <span className="text-[11px] text-gray-400 mt-1 block">Format: 09xxxxxxxx or +2519xxxxxxxx</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Delivery Address</label>
            <textarea
              name="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={handleChange}
              placeholder="Bole Sub-city, Woreda 03, House No. 123, Addis Ababa"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || cart.length === 0}
            className={`w-full py-3 rounded-xl font-semibold transition cursor-pointer shadow-sm ${
              loading || cart.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Processing Order...' : `Place Order (${totalAmount.toFixed(2)} ETB)`}
          </button>
        </form>

        {/* Order Summary Column */}
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 h-fit">
          <h3 className="font-bold text-gray-800 text-lg border-b pb-2 mb-4">Order Summary</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600 line-clamp-1 flex-1 pr-2">
                  {item.name} <strong className="text-gray-900">× {item.quantity}</strong>
                </span>
                <span className="font-semibold text-gray-900">
                  {(Number(item.price) * item.quantity).toFixed(2)} ETB
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-6 pt-4 flex justify-between font-extrabold text-base text-gray-900">
            <span>Total:</span>
            <span className="text-indigo-600">{totalAmount.toFixed(2)} ETB</span>
          </div>
        </div>
      </div>
    </div>
  );
};