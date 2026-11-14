
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchOrderStatus 
} from '../services/orderService';
import { verifyChapaPayment } from '../services/paymentService';

interface OrderData {
  id: number;
  status: string;
  total_amount: number | string;
  payment_status: string | null;
}

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();

  const orderId = Number(searchParams.get('order_id'));

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const checkPayment = useCallback(async () => {
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      setError('Invalid order reference.');
      setLoading(false);
      return;
    }

    const txRef =
      searchParams.get('tx_ref') ||
      sessionStorage.getItem('chapa_tx_ref');

    if (!txRef) {
      setError('Transaction reference is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Step 1: Ask the backend to verify the transaction with Chapa.
      try {
        const verification = await verifyChapaPayment(txRef);

        console.log('Chapa verification result:', verification);

        // Remove the stored reference after successful verification.
        sessionStorage.removeItem('chapa_tx_ref');
      } catch (verificationError) {
        // The payment may still be processing.
        // We still retrieve the latest order status below.
        console.warn(
          'Chapa payment is not confirmed yet:',
          verificationError
        );
      }

      // Step 2: Retrieve the latest order status from our database.
      const response = await fetchOrderStatus(orderId);

      setOrder(response.order);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not retrieve your order.'
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, searchParams]);

  useEffect(() => {
    void checkPayment();
  }, [checkPayment]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto mb-4" />

          <h2 className="text-xl font-bold text-gray-800">
            Checking your payment...
          </h2>

          <p className="text-gray-500 mt-2">
            Please wait while we confirm your order.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-3">
            Unable to verify payment
          </h2>

          <p className="text-gray-600 mb-6">{error}</p>

          <button
            onClick={() => void checkPayment()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  const isPaid =
    order?.status === 'paid' &&
    order?.payment_status === 'successful';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">

        {isPaid ? (
          <>
            <div className="text-6xl mb-4">✓</div>

            <h1 className="text-3xl font-bold text-green-600 mb-3">
              Payment Successful!
            </h1>

            <p className="text-gray-600 mb-6">
              Your payment has been verified and your order is confirmed.
            </p>

            <div className="bg-gray-50 rounded-xl p-5 text-left mb-6">
              <p className="text-gray-600 mb-2">
                Order ID: <strong>#{order?.id}</strong>
              </p>

              <p className="text-gray-600">
                Total:{' '}
                <strong>
                  {Number(order?.total_amount).toFixed(2)} ETB
                </strong>
              </p>

              <p className="text-gray-600 mt-2">
                Payment:{' '}
                <strong className="text-green-600">
                  Verified
                </strong>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">!</div>

            <h1 className="text-2xl font-bold text-amber-600 mb-3">
              Payment Not Confirmed Yet
            </h1>

            <p className="text-gray-600 mb-6">
              Your order exists, but we haven't confirmed successful payment.
              Please check again.
            </p>

            <div className="bg-gray-50 rounded-xl p-5 text-left mb-6">
              <p className="text-gray-600">
                Order ID: <strong>#{order?.id}</strong>
              </p>

              <p className="text-gray-600 mt-2">
                Order status: <strong>{order?.status}</strong>
              </p>

              <p className="text-gray-600 mt-2">
                Payment status:{' '}
                <strong>
                  {order?.payment_status || 'Unknown'}
                </strong>
              </p>
            </div>

            <button
              onClick={() => void checkPayment()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              Check Payment Again
            </button>
          </>
        )}

        <button
          onClick={() => {
            window.location.href = '/';
          }}
          className="mt-4 block w-full border border-gray-300 hover:bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold"
        >
          Return to Store
        </button>
      </div>
    </div>
  );
}
