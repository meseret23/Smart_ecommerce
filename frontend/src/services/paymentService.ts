export const initializeChapaPayment = async (data: {
  amount: number;
  email: string;
  firstName: string;
}): Promise<string> => {
  const response = await fetch('/api/checkout/chapa', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: data.amount,
      email: data.email,
      firstName: data.firstName,
      tx_ref: `SM-${Date.now()}`,
    }),
  });

  const result = await response.json();
  if (!response.ok || !result.checkout_url) {
    throw new Error(result.error || 'Failed to initialize payment');
  }

  return result.checkout_url;
};