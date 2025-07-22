import { antomPaymentService } from './antomPaymentService';
import axios, { AxiosError } from 'axios';

// Set this to true to use mock implementation instead of real API calls
const USE_MOCK_MODE = process.env.NODE_ENV === 'development';

// API base URL
const API_BASE_URL = 'https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run';

interface ApiErrorResponse {
  message: string;
}

interface TransferStatus {
  id: string;
  status: string;
  created_at: string;
  amount: number;
  currency: string;
  paymentRequestId?: string;
}

interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  quote_id: string;
  paymentUrl?: string;
  redirectUrl?: string;
}

interface BalanceInfo {
  available_amount: number;
  currency: string;
  pending_amount: number;
  total_amount: number;
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

interface VirtualCard {
  id: string;
  card_type: string;
  status: string;
  name_on_card: string;
  last_four: string;
  expiry: string;
  currency: string;
  balance: number;
}

/**
 * Authenticate with Antom API and get access token
 */
export const authenticate = async (): Promise<string> => {
  // No authentication needed for Antom API as it's handled by the backend
  return 'antom_auth_token';
};

/**
 * Get current account balances
 */
export const getBalances = async (): Promise<BalanceInfo[]> => {
  if (USE_MOCK_MODE) {
    console.log('[MOCK] Returning mock balances');
    return [
      {
        available_amount: 10000,
        currency: "USD",
        pending_amount: 0,
        total_amount: 10000
      },
      {
        available_amount: 50000,
        currency: "PHP",
        pending_amount: 1000,
        total_amount: 51000
      }
    ];
  }

  try {
    // Get payment history to calculate balances
    const paymentHistory = await antomPaymentService.getPaymentHistory(1, 100, 'completed');
    
    // Group by currency and calculate totals
    const balanceMap = new Map<string, BalanceInfo>();
    
    paymentHistory.data.payments.forEach(payment => {
      if (!balanceMap.has(payment.currency)) {
        balanceMap.set(payment.currency, {
          available_amount: 0,
          currency: payment.currency,
          pending_amount: 0,
          total_amount: 0
        });
      }
      
      const balance = balanceMap.get(payment.currency)!;
      balance.available_amount += payment.amount;
      balance.total_amount += payment.amount;
    });
    
    // Also check for pending payments
    const pendingPayments = await antomPaymentService.getPaymentHistory(1, 100, 'pending');
    pendingPayments.data.payments.forEach(payment => {
      if (!balanceMap.has(payment.currency)) {
        balanceMap.set(payment.currency, {
          available_amount: 0,
          currency: payment.currency,
          pending_amount: payment.amount,
          total_amount: payment.amount
        });
      } else {
        const balance = balanceMap.get(payment.currency)!;
        balance.pending_amount += payment.amount;
        balance.total_amount += payment.amount;
      }
    });
    
    return Array.from(balanceMap.values());
  } catch (error) {
    console.error('Error getting balances:', error);
    throw error;
  }
};

/**
 * Create a payment intent with Antom Payment Service
 */
export const createPaymentIntent = async (amount: number | string, currency = 'PHP', paymentMethodType = 'GCASH'): Promise<PaymentIntent> => {
  console.log(`Creating payment intent for ${amount} ${currency} using ${paymentMethodType}`);
  
  if (USE_MOCK_MODE) {
    console.log('[MOCK] Creating mock payment intent for', amount, currency, paymentMethodType);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const requestId = `mock_payment_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const orderId = `ORDER_${Date.now()}`;
    
    return {
      id: requestId,
      client_secret: orderId,
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      currency: currency,
      quote_id: orderId,
      paymentUrl: `https://mock-payment-gateway.com/pay/${requestId}`,
      redirectUrl: `${window.location.origin}/payment/success?paymentRequestId=${requestId}`
    };
  }
  
  try {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Create payment using Antom payment service
    const paymentResponse = await antomPaymentService.createPayment({
      amount: numericAmount,
      currency: currency,
      paymentMethodType: paymentMethodType, // Use the provided payment method
      redirectUrl: window.location.origin + '/payment/success'
    });
    
    if (!paymentResponse.success) {
      throw new Error(paymentResponse.message || 'Failed to create payment');
    }
    
    return {
      id: paymentResponse.data.paymentRequestId,
      client_secret: paymentResponse.data.orderId,
      amount: numericAmount,
      currency: currency,
      quote_id: paymentResponse.data.orderId,
      paymentUrl: paymentResponse.data.paymentUrl,
      redirectUrl: paymentResponse.data.redirectUrl
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error instanceof Error ? error : new Error('Failed to create payment intent');
  }
};

/**
 * Check transfer status by ID
 */
export const getTransferStatus = async (paymentRequestId: string): Promise<TransferStatus> => {
  console.log(`Checking payment status for ${paymentRequestId}`);
  
  if (USE_MOCK_MODE) {
    console.log('[MOCK] Getting mock transfer status for', paymentRequestId);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      id: paymentRequestId,
      status: 'COMPLETED',
      created_at: new Date().toISOString(),
      amount: 1000,
      currency: 'PHP',
      paymentRequestId: paymentRequestId
    };
  }
  
  try {
    // Get payment status from Antom payment service
    const statusResponse = await antomPaymentService.getPaymentStatus(paymentRequestId);
    
    if (!statusResponse.success) {
      throw new Error('Failed to get payment status');
    }
    
    // Map Antom status to TransferStatus
    const statusMap: Record<string, string> = {
      'pending': 'PENDING',
      'completed': 'COMPLETED',
      'failed': 'FAILED',
      'cancelled': 'CANCELLED'
    };
    
    return {
      id: statusResponse.data.paymentRequestId,
      status: statusMap[statusResponse.data.status] || 'UNKNOWN',
      created_at: new Date().toISOString(),
      amount: statusResponse.data.paymentRecord?.amount || 0,
      currency: statusResponse.data.paymentRecord?.currency || 'PHP',
      paymentRequestId: statusResponse.data.paymentRequestId
    };
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error instanceof Error ? error : new Error('Failed to get payment status');
  }
};

/**
 * Confirm subscription purchase
 */
export const confirmSubscriptionPurchase = async (
  uid: string, 
  plan: string, 
  amount: number | string, 
  couponId = "", 
  paymentId: string
): Promise<SubscriptionResult> => {
  // Log both in real and mock mode
  console.log(`Confirming subscription for user ${uid}, plan ${plan}, payment ${paymentId}`);
  
  // Validate required parameters
  if (!uid) {
    console.error('Missing uid for subscription purchase');
    return { success: false, message: 'Missing user ID' };
  }
  
  if (!plan) {
    console.error('Missing plan for subscription purchase');
    return { success: false, message: 'Missing subscription plan' };
  }
  
  if (!paymentId) {
    console.error('Missing paymentId for subscription purchase');
    return { success: false, message: 'Missing payment information' };
  }
  
  // Ensure amount is a valid number
  const validAmount = amount && !isNaN(Number(amount)) ? Number(amount) : 0;
  
  // Create payload for API
  const payload = {
    uid,
    plan,
    totalPrice: validAmount,
    couponId: couponId || "",
    paymentIntentId: paymentId // Use our mock paymentId in place of paymentIntentId
  };
  
  // Log the payload for debugging
  console.log('Sending payload to BuySubscription API:', payload);
  
  try {
    if (USE_MOCK_MODE) {
      console.log('[MOCK] Making real API call even in mock mode to update coins');
      
      // Option to completely bypass API if it's causing errors
      const BYPASS_API_COMPLETELY = false;
      
      if (BYPASS_API_COMPLETELY) {
        console.log('[MOCK] Bypassing API completely and returning mock success response');
        return {
          success: true,
          message: 'Subscription confirmed successfully (mock response)',
          subscriptionId: `sub_${Date.now()}`,
          userId: uid,
          planId: plan,
          startDate: new Date().toISOString(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          status: 'active'
        };
      }
    }
    
    // Always call the real backend API to update coins, even in mock mode
    const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/user/BuySubscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error('Subscription API error:', response.status, response.statusText);
      
      // Try to get error details if available
      try {
        const errorData = await response.text();
        console.error('Error response:', errorData);
      } catch (e) {
        console.error('Could not parse error response');
      }
      
      // If in mock mode, return success even when API fails
      if (USE_MOCK_MODE) {
        console.log('[MOCK] API call failed, returning mock success response');
        return {
          success: true,
          message: 'Subscription confirmed successfully (mock response)',
          subscriptionId: `sub_${Date.now()}`,
          userId: uid,
          planId: plan,
          startDate: new Date().toISOString(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          status: 'active'
        };
      }
      
      return { success: false, message: 'Server error while confirming subscription' };
    }
    
    const result = await response.json();
    console.log('Subscription confirmation result from server:', result);
    return result;
  } catch (error) {
    console.error('Payment confirmation error:', error);
    
    if (USE_MOCK_MODE) {
      console.log('[MOCK] API call failed, returning mock success response');
      // In mock mode, still return success if API call fails
      return {
        success: true,
        message: 'Subscription confirmed successfully (mock response)',
        subscriptionId: `sub_${Date.now()}`,
        userId: uid,
        planId: plan,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        status: 'active'
      };
    }
    
    return { success: false, message: 'Failed to confirm subscription' };
  }
};

/**
 * Create a virtual card (for demonstration)
 */
export const createVirtualCard = async (amount: number | string, currency = 'HKD'): Promise<VirtualCard> => {
  if (USE_MOCK_MODE) {
    console.log('[MOCK] Creating mock virtual card for', amount, currency);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const cardId = `card_${Date.now()}`;
    
    return {
      id: cardId,
      card_type: 'VIRTUAL',
      status: 'ACTIVE',
      name_on_card: 'Customer Card',
      last_four: '4242',
      expiry: '12/25',
      currency: currency,
      balance: typeof amount === 'string' ? parseFloat(amount) : amount
    };
  }

  try {
    const token = await authenticate();
    
    const requestId = `card_${Date.now()}`;
    
    const response = await axios.post<VirtualCard>(
      `${API_BASE_URL}/issuing/cards/create`,
      {
        request_id: requestId,
        form_factor: "VIRTUAL",
        issue_to: "ORGANISATION",
        name_on_card: "Customer Card",
        authorization_controls: {
          allowed_transaction_count: "SINGLE",
          per_transaction_limits: [
            {
              currency: currency,
              limit: amount
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating virtual card:', error);
    const axiosError = error as AxiosError<ApiErrorResponse>;
    throw new Error(axiosError.response?.data?.message || 'Failed to create virtual card');
  }
};

// Function to create a subscription payment
export const createSubscriptionPayment = async (
  planId: string,
  amount: number | string,
  currency = 'PHP',
  paymentMethodType = 'GCASH',
  session: any
) => {
  console.log(`Creating subscription payment for plan ${planId}, amount ${amount} ${currency} using ${paymentMethodType}`);
  
  try {
    // Prepare the payment request data
    const paymentData = {
      planId,
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      currency,
      paymentMethodType,
      orderDescription: `Subscription Plan: ${planId}`,
      redirectUrl: `${window.location.origin}/payment/success`,
      notifyUrl: `${API_BASE_URL}/api/payment/notify`
    };
    
    // Call the Antom payment service to create the payment
    const response = await antomPaymentService.createPayment(paymentData);
    
    return response;
  } catch (error) {
    console.error('Error creating subscription payment:', error);
    return {
      success: false,
      error: 'Failed to create subscription payment'
    };
  }
};

// Function to create an addon payment
export const createAddonPayment = async (
  addonId: string,
  amount: number | string,
  currency = 'PHP',
  paymentMethodType = 'GCASH',
  session: any
) => {
  console.log(`Creating addon payment for addon ${addonId}, amount ${amount} ${currency} using ${paymentMethodType}`);
  
  try {
    // Prepare the payment request data
    const paymentData = {
      addonId,
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      currency,
      paymentMethodType,
      orderDescription: `Addon Purchase: ${addonId}`,
      redirectUrl: `${window.location.origin}/payment/success`,
      notifyUrl: `${API_BASE_URL}/api/payment/notify`
    };
    
    // Call the Antom payment service to create the payment
    const response = await antomPaymentService.createPayment(paymentData);
    
    return response;
  } catch (error) {
    console.error('Error creating addon payment:', error);
    return {
      success: false,
      error: 'Failed to create addon payment'
    };
  }
};

// Function to query payment status
export const queryPaymentStatus = async (paymentRequestId: string, session: any) => {
  console.log(`Querying payment status for ${paymentRequestId}`);
  
  try {
    // Call the Antom payment service to get the payment status
    const response = await antomPaymentService.getPaymentStatus(paymentRequestId);
    
    return response;
  } catch (error) {
    console.error('Error querying payment status:', error);
    return {
      success: false,
      error: 'Failed to query payment status'
    };
  }
};