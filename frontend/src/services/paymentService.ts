
const API_URL = 'http://localhost:5000/api/orders';

interface InitializePaymentResponse {
  success: boolean;
  checkout_url: string;
  tx_ref: string;
  payment_id: number;
}

interface InitializedPayment {
  checkout_url: string;
  tx_ref: string;
  payment_id: number;
}

export const initializeChapaPayment = async (
  orderId: number
): Promise<InitializedPayment> => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Please log in before making a payment.');
  }

  const response = await fetch(`${API_URL}/${orderId}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const result: InitializePaymentResponse & { message?: string } =
    await response.json();

  if (!response.ok || !result.success || !result.checkout_url || !result.tx_ref) {
    throw new Error(
      result.message || 'Failed to initialize Chapa payment.'
    );
  }

  return {
    checkout_url: result.checkout_url,
    tx_ref: result.tx_ref,
    payment_id: result.payment_id,
  };
};

export async function verifyChapaPayment(txRef: string) {
  if (!txRef?.trim()) {
    throw new Error('Transaction reference is missing.');
  }

  const response = await fetch(
    `${API_URL}/verify/${encodeURIComponent(txRef)}`,
    {
      method: 'GET',
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Payment verification failed.');
  }

  return data;
}