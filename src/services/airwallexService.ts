// Airwallex Payment Service

// Interfaces for Airwallex API
interface AuthenticationResponse {
  token: string;
}

interface PaymentIntentRequest {
  request_id: string;
  amount: number;
  currency: string;
  merchant_order_id: string;
  return_url: string;
  order?: {
    products?: Array<{
      name: string;
      desc?: string;
      sku?: string;
      type?: string;
      unit_price?: number;
      url?: string;
      quantity?: number;
    }>;
  };
}

interface PaymentIntentResponse {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
  merchant_order_id: string;
  created_at: string;
}

interface PaymentIntentStatusResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  merchant_order_id: string;
  latest_payment_attempt?: {
    id: string;
    status: string;
    payment_method?: {
      type: string;
    };
  };
}

class AirwallexService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:3000';
  }

  /**
   * No authentication needed - backend handles it
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create a payment intent via backend API
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    merchantOrderId: string;
    returnUrl: string;
    products?: Array<{
      name: string;
      desc?: string;
      sku?: string;
      type?: string;
      unit_price?: number;
      url?: string;
      quantity?: number;
    }>;
  }): Promise<PaymentIntentResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const requestData: PaymentIntentRequest = {
        request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: params.amount,
        currency: params.currency,
        merchant_order_id: params.merchantOrderId,
        return_url: params.returnUrl,
      };

      // Add order information if products are provided
      if (params.products && params.products.length > 0) {
        requestData.order = {
          products: params.products,
        };
      }

      const response = await fetch(`${this.backendUrl}/api/payment/airwallex/create-intent`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Payment intent creation failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      return result.data; // Backend wraps response in { success, message, data }
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve payment intent status via backend API
   */
  async getPaymentIntentStatus(paymentIntentId: string): Promise<PaymentIntentStatusResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.backendUrl}/api/payment/airwallex/status/${paymentIntentId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to retrieve payment intent: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      return result.data; // Backend wraps response in { success, message, data }
    } catch (error) {
      console.error('Get payment intent status error:', error);
      throw new Error(`Failed to get payment intent status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a unique merchant order ID
   */
  generateMerchantOrderId(prefix: string = 'ORDER'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }
}

// Export singleton instance
export const airwallexService = new AirwallexService();
export default airwallexService;

// Export types for use in components
export type {
  PaymentIntentResponse,
  PaymentIntentStatusResponse,
};