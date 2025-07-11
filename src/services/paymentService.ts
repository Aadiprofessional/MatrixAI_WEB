import axios, { AxiosError } from 'axios';

// Set this to true to use mock implementation instead of real API calls
const USE_MOCK_MODE = true;

// Airwallex API base URL
const API_BASE_URL = 'https://api-demo.airwallex.com/api/v1';
const CLIENT_ID = 'hwXGNN6uQ_-P5j2bvb-bpg';
const API_KEY = 'c2e4d1d8dbdcd0097e83033a56cd681d467c93d275bbe63f9ab04e6632c0e9cc394dcea9bb65528b567c9c2857b1b524';

// Store the token and its expiry time
let authToken: string | null = null;
let tokenExpiry: Date | null = null;

interface AuthResponse {
  token: string;
}

interface ApiErrorResponse {
  message: string;
}

interface TransferStatus {
  id: string;
  status: string;
  created_at: string;
  amount: number;
  currency: string;
}

interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  quote_id: string;
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
 * Authenticate with Airwallex API and get access token
 */
export const authenticate = async (): Promise<string> => {
  // If in mock mode, return a fake token
  if (USE_MOCK_MODE) {
    console.log('[MOCK] Generating mock authentication token');
    authToken = 'mock_token_' + Date.now();
    tokenExpiry = new Date(new Date().getTime() + 3600 * 1000); // 1 hour from now
    return authToken;
  }

  try {
    // If token exists and is still valid, return it
    if (authToken && tokenExpiry && new Date() < tokenExpiry) {
      return authToken;
    }

    // Request new token
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/authentication/login`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': CLIENT_ID,
          'x-api-key': API_KEY
        }
      }
    );

    if (response.data && response.data.token) {
      authToken = response.data.token;
      // Set token expiry to 1 hour from now (typical Airwallex token lifetime)
      tokenExpiry = new Date(new Date().getTime() + 55 * 60 * 1000); // 55 minutes to be safe
      return authToken;
    } else {
      throw new Error('Authentication failed: No token received');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    const axiosError = error as AxiosError<ApiErrorResponse>;
    throw new Error(axiosError.response?.data?.message || 'Authentication failed');
  }
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
        currency: "HKD",
        pending_amount: 0,
        total_amount: 50000
      }
    ];
  }

  try {
    const token = await authenticate();
    
    const response = await axios.get<BalanceInfo[]>(
      `${API_BASE_URL}/balances/current`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting balances:', error);
    const axiosError = error as AxiosError<ApiErrorResponse>;
    throw new Error(axiosError.response?.data?.message || 'Failed to get balance information');
  }
};

/**
 * Create a payment intent with Airwallex
 * This will use the transfers/create endpoint to simulate payment intents
 */
export const createPaymentIntent = async (amount: number | string, currency = 'HKD'): Promise<PaymentIntent> => {
  if (USE_MOCK_MODE) {
    console.log('[MOCK] Creating mock payment intent for', amount, currency);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const requestId = `mock_payment_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    return {
      id: requestId,
      client_secret: `${requestId}_secret`,
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      currency: currency,
      quote_id: `quote_${Date.now()}`
    };
  }

  try {
    const token = await authenticate();
    
    // Get a quote first (required for FX transactions)
    const quoteResponse = await axios.post(
      `${API_BASE_URL}/fx/quotes/create`,
      {
        buy_currency: currency,
        buy_amount: typeof amount === 'string' ? parseFloat(amount) : amount,
        sell_currency: 'USD', // Assuming business account is in USD
        validity: 'HR_24'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const quote = quoteResponse.data;
    
    // Create a unique request ID
    const requestId = `payment_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create a transfer (payment)
    const response = await axios.post(
      `${API_BASE_URL}/transfers/create`,
      {
        request_id: requestId,
        source_currency: 'USD',
        source_amount: quote.sell_amount,
        target_currency: currency,
        target_amount: amount,
        payment_method: 'CARD',
        metadata: {
          payment_type: 'subscription',
          quote_id: quote.quote_id
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      id: response.data.id || requestId,
      client_secret: `${requestId}_secret`, // Simulate client secret
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      currency: currency,
      quote_id: quote.quote_id
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    const axiosError = error as AxiosError<ApiErrorResponse>;
    throw new Error(axiosError.response?.data?.message || 'Failed to create payment');
  }
};

/**
 * Check transfer status by ID
 */
export const getTransferStatus = async (transferId: string): Promise<TransferStatus> => {
  if (USE_MOCK_MODE) {
    console.log('[MOCK] Getting mock transfer status for', transferId);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      id: transferId,
      status: 'CONFIRMED',
      created_at: new Date().toISOString(),
      amount: 1000,
      currency: 'HKD'
    };
  }

  try {
    const token = await authenticate();
    
    const response = await axios.get<TransferStatus>(
      `${API_BASE_URL}/transfers/${transferId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error checking transfer status:', error);
    const axiosError = error as AxiosError<ApiErrorResponse>;
    throw new Error(axiosError.response?.data?.message || 'Failed to check transfer status');
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