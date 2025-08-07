import axios, { AxiosError } from 'axios';

// Configuration
const USE_MOCK_MODE = process.env.NODE_ENV === 'development';
const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

// Types
interface ApiErrorResponse {
  message: string;
}

interface PaymentMethod {
  name: string;
  currency: string;
  type: string;
  country: string;
}

interface PaymentMethodsResponse {
  success: boolean;
  data: Record<string, PaymentMethod>;
}

interface CreatePaymentRequest {
  planId?: string;
  addonId?: string;
  amount: number;
  currency?: string;
  paymentMethodType?: string;
  orderDescription?: string;
  redirectUrl?: string;
  notifyUrl?: string;
}

interface CreatePaymentResponse {
  success: boolean;
  message: string;
  data: {
    paymentRequestId: string;
    orderId: string;
    paymentUrl: string;
    redirectUrl: string;
    plan?: any;
    addon?: any;
    paymentResponse?: any;
  };
}

interface PaymentStatusResponse {
  success: boolean;
  data: {
    paymentRequestId: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    resultCode: string;
    paymentRecord: any;
    antomResponse: any;
  };
}

interface CancelPaymentResponse {
  success: boolean;
  message: string;
  data: {
    paymentRequestId: string;
    antomResponse: any;
  };
}

interface PaymentHistoryResponse {
  success: boolean;
  data: {
    payments: Array<{
      id: string;
      user_id: string;
      plan_id: string | null;
      addon_id: string | null;
      payment_request_id: string;
      order_id: string;
      amount: number;
      currency: string;
      payment_method_type: string;
      status: string;
      created_at: string;
      subscription_plans?: {
        name: string;
        description: string;
      };
      addon_plans?: {
        name: string;
        description: string;
      } | null;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface SubscriptionResult {
  success: boolean;
  message?: string;
  subscriptionId?: string;
  userId?: string;
  planId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

// Helper function to handle API errors
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    if (axiosError.response?.data?.message) {
      throw new Error(axiosError.response.data.message);
    }
  }
  throw error instanceof Error ? error : new Error('An unknown error occurred');
};

// Mock data for development
const mockPaymentMethods = {
  GCASH: { name: 'GCash', currency: 'PHP', type: 'wallet', country: 'PH' },
  MAYA: { name: 'Maya', currency: 'PHP', type: 'wallet', country: 'PH' },
  VISA: { name: 'Visa', currency: 'PHP', type: 'card', country: 'GLOBAL' },
  MASTERCARD: { name: 'Mastercard', currency: 'PHP', type: 'card', country: 'GLOBAL' }
};

export const antomPaymentService = {
  // Get available payment methods
  getPaymentMethods: async (): Promise<PaymentMethodsResponse> => {
    if (USE_MOCK_MODE) {
      console.log('[MOCK] Getting mock payment methods');
      return {
        success: true,
        data: mockPaymentMethods
      };
    }

    try {
      const response = await axios.get<PaymentMethodsResponse>(
        `${API_BASE_URL}/api/payment/methods`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Create a new payment
  createPayment: async (paymentData: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    if (USE_MOCK_MODE) {
      console.log('[MOCK] Creating mock payment for', paymentData);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const requestId = `mock_payment_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const orderId = `ORDER_${Date.now()}`;
      
      return {
        success: true,
        message: 'Payment created successfully',
        data: {
          paymentRequestId: requestId,
          orderId: orderId,
          paymentUrl: `https://mock-payment-gateway.com/pay/${requestId}`,
          redirectUrl: paymentData.redirectUrl || `https://mock-payment-gateway.com/pay/${requestId}`,
          plan: paymentData.planId ? { id: paymentData.planId, name: 'Mock Plan' } : undefined,
          addon: paymentData.addonId ? { id: paymentData.addonId, name: 'Mock Addon' } : undefined,
          paymentResponse: { status: 'created' }
        }
      };
    }

    try {
      const response = await axios.post<CreatePaymentResponse>(
        `${API_BASE_URL}/api/payment/create`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Check payment status
  getPaymentStatus: async (paymentRequestId: string): Promise<PaymentStatusResponse> => {
    if (USE_MOCK_MODE) {
      console.log('[MOCK] Getting mock payment status for', paymentRequestId);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Randomly determine status for testing different scenarios
      const statuses = ['pending', 'completed', 'failed', 'cancelled'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] as 'pending' | 'completed' | 'failed' | 'cancelled';
      
      return {
        success: true,
        data: {
          paymentRequestId,
          status: randomStatus,
          resultCode: randomStatus === 'completed' ? 'SUCCESS' : randomStatus === 'pending' ? 'PENDING' : 'FAILED',
          paymentRecord: {
            id: `record_${paymentRequestId}`,
            status: randomStatus,
            created_at: new Date().toISOString()
          },
          antomResponse: { status: randomStatus }
        }
      };
    }

    try {
      const response = await axios.get<PaymentStatusResponse>(
        `${API_BASE_URL}/api/payment/status/${paymentRequestId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Cancel a payment
  cancelPayment: async (paymentRequestId: string): Promise<CancelPaymentResponse> => {
    if (USE_MOCK_MODE) {
      console.log('[MOCK] Cancelling mock payment', paymentRequestId);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        message: 'Payment cancelled successfully',
        data: {
          paymentRequestId,
          antomResponse: { status: 'cancelled' }
        }
      };
    }

    try {
      const response = await axios.post<CancelPaymentResponse>(
        `${API_BASE_URL}/api/payment/cancel/${paymentRequestId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get payment history
  getPaymentHistory: async (page = 1, limit = 20, status?: string): Promise<PaymentHistoryResponse> => {
    if (USE_MOCK_MODE) {
      console.log('[MOCK] Getting mock payment history');
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock payment history
      const mockPayments = Array.from({ length: 5 }, (_, i) => ({
        id: `payment_${i + 1}`,
        user_id: 'mock_user_id',
        plan_id: i % 2 === 0 ? 'plan_id_1' : null,
        addon_id: i % 2 !== 0 ? 'addon_id_1' : null,
        payment_request_id: `REQUEST_${Date.now()}_${i}`,
        order_id: `ORDER_${Date.now()}_${i}`,
        amount: 99.99,
        currency: 'USD',
        payment_method_type: 'GCASH',
        status: status || (i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'pending' : 'failed'),
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        subscription_plans: i % 2 === 0 ? {
          name: 'Premium Plan',
          description: 'Premium features'
        } : undefined,
        addon_plans: i % 2 !== 0 ? {
          name: 'Extra Coins',
          description: '500 additional coins'
        } : null
      }));
      
      return {
        success: true,
        data: {
          payments: mockPayments,
          pagination: {
            page,
            limit,
            total: 15,
            totalPages: Math.ceil(15 / limit)
          }
        }
      };
    }

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (status) {
        queryParams.append('status', status);
      }

      const response = await axios.get<PaymentHistoryResponse>(
        `${API_BASE_URL}/api/payment/history?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Confirm subscription purchase
  confirmSubscriptionPurchase: async (
    uid: string, 
    plan: string, 
    amount: number | string, 
    couponId = "", 
    paymentRequestId: string
  ): Promise<SubscriptionResult> => {
    // Log both in real and mock mode
    console.log(`Confirming subscription purchase: uid=${uid}, plan=${plan}, amount=${amount}, couponId=${couponId}, paymentRequestId=${paymentRequestId}`);
    
    if (USE_MOCK_MODE) {
      console.log('[MOCK] Confirming mock subscription purchase');
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Check payment status first
      const paymentStatus = await antomPaymentService.getPaymentStatus(paymentRequestId);
      
      if (paymentStatus.data.status !== 'completed') {
        return {
          success: false,
          message: `Payment is not completed. Current status: ${paymentStatus.data.status}`
        };
      }
      
      return {
        success: true,
        message: 'Subscription purchased successfully',
        subscriptionId: `sub_${Date.now()}`,
        userId: uid,
        planId: plan,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days from now
        status: 'active'
      };
    }

    try {
      // First check if the payment is completed
      const paymentStatus = await antomPaymentService.getPaymentStatus(paymentRequestId);
      
      if (paymentStatus.data.status !== 'completed') {
        return {
          success: false,
          message: `Payment is not completed. Current status: ${paymentStatus.data.status}`
        };
      }
      
      // If payment is completed, confirm the subscription purchase
      const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      // Call the user service to buy subscription
      const response = await axios.post<SubscriptionResult>(
        `${API_BASE_URL}/api/user/BuySubscription`,
        {
          uid,
          plan,
          totalPrice: numericAmount,
          couponId: couponId || undefined
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};