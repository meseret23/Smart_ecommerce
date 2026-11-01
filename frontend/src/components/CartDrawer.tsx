import React from 'react';
import type { CartItem } from '../App';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onIncreaseQuantity: (id: number) => void;
  onDecreaseQuantity: (id: number) => void;
  onRemoveItem: (id: number) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
        <div>
        
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Your Shopping Cart ({totalCartCount})
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 font-bold text-2xl cursor-pointer p-1"
            >
              &times;
            </button>
          </div>

        
          {cart.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-4xl mb-3">🛒</p>
              <p className="font-medium">Your cart is empty.</p>
              <p className="text-xs text-gray-400 mt-1">Add items from the catalog to get started!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100"
                >
                  <div className="flex-1 pr-2">
                    <h4 className="font-semibold text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">{item.price} ETB each</p>

                   
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => onDecreaseQuantity(item.id)}
                        className="w-6 h-6 bg-white border border-gray-300 rounded-md font-bold text-xs flex items-center justify-center hover:bg-gray-100 cursor-pointer shadow-xs"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-gray-700 px-1">{item.quantity}</span>
                      <button
                        onClick={() => onIncreaseQuantity(item.id)}
                        className="w-6 h-6 bg-white border border-gray-300 rounded-md font-bold text-xs flex items-center justify-center hover:bg-gray-100 cursor-pointer shadow-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end justify-between h-full">
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-500 text-xs font-semibold cursor-pointer mb-2"
                      title="Remove item"
                    >
                      🗑️
                    </button>
                    <span className="font-bold text-sm text-gray-900">
                      {(Number(item.price) * item.quantity).toFixed(2)} ETB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      
        <div className="border-t border-gray-200 pt-4 bg-white">
          <div className="flex justify-between font-bold text-base mb-4 text-gray-800">
            <span>Total Amount:</span>
            <span className="text-indigo-600">{totalAmount.toFixed(2)} ETB</span>
          </div>
          <button
            onClick={onCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl font-semibold transition cursor-pointer shadow-sm ${
              cart.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};