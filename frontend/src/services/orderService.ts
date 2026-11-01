import { API } from './api';

export interface CheckoutPayload {
  customerName: string;
  phone: string;
  deliveryAddress: string;
  items: { productId: number; quantity: number; price: number }[];
}

export const submitOrder = async (payload: CheckoutPayload) => {
  try {
   
    const response = await API.post('/orders', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to process secure checkout');
  }
};