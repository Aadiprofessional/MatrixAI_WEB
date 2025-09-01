import React, { useState, useEffect } from 'react';
import { init } from '@airwallex/components-sdk';
import airwallexService, { PaymentIntentResponse } from '../../services/airwallexService';
import './PaymentPage.css';

interface PaymentPageProps {
  amount: number;
  currency?: string;
  productName?: string;
  productDescription?: string;
  uid: string;
  plan: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({
  amount,
  currency = 'USD',
  productName = 'MatrixAI Service',
  productDescription = 'AI Agent Service Payment',
  uid,
  plan,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null);
  const [airwallexInitialized, setAirwallexInitialized] = useState(false);

  // Initialize Airwallex SDK
  useEffect(() => {
    const initializeAirwallex = async () => {
      try {
        await init({
          env: 'prod', // Production environment
          enabledElements: ['payments'],
        });
        setAirwallexInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Airwallex:', error);
        setError('Failed to initialize payment system');
        onError?.('Failed to initialize payment system');
      }
    };

    initializeAirwallex();
  }, [onError]);

  // Create payment intent when component mounts
  useEffect(() => {
    if (airwallexInitialized && !paymentIntent) {
      createPaymentIntent();
    }
  }, [airwallexInitialized, paymentIntent]);

  const createPaymentIntent = async () => {
    setLoading(true);
    setError(null);

    try {
      const merchantOrderId = airwallexService.generateMerchantOrderId('MATRIXAI');
      const returnUrl = `${window.location.origin}/payment/result`;

      const intent = await airwallexService.createPaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toUpperCase(),
        merchantOrderId,
        returnUrl,
        uid,
        plan,
        products: [
          {
            name: productName,
            desc: productDescription,
            type: 'service',
            unit_price: Math.round(amount * 100),
            quantity: 1,
          },
        ],
      });

      setPaymentIntent(intent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentIntent || !airwallexInitialized) {
      setError('Payment system not ready');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const airwallex = await init({
        env: (process.env.REACT_APP_AIRWALLEX_ENV as 'demo' | 'dev' | 'staging' | 'prod') || 'demo',
        enabledElements: ['payments'],
      });

      // Redirect to Airwallex hosted payment page
      airwallex.payments?.redirectToCheckout({
        intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        currency: paymentIntent.currency,
        country_code: 'US', // You can make this dynamic based on user location
        successUrl: `${window.location.origin}/payment/success?id=${paymentIntent.id}`,
        failUrl: `${window.location.origin}/payment/failure?id=${paymentIntent.id}`,
        logoUrl: `${window.location.origin}/logo.png`, // Optional: Add your logo
        appearance: {
          mode: 'light',
          variables: {
            colorBrand: '#1976d2',
            colorText: '#333333',
            colorBackground: '#ffffff',
          },
        },
        shopper_name: 'MatrixAI User',
        methods: ['card', 'applepay', 'googlepay'], // Specify payment methods
      });

      // If we reach here, the redirect was successful
      onSuccess?.(paymentIntent.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading && !paymentIntent) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Initializing payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="error-message">
            <h3>Payment Error</h3>
            <p>{error}</p>
            <button 
              onClick={createPaymentIntent}
              className="retry-button"
              disabled={loading}
            >
              {loading ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <h2>Complete Your Payment</h2>
          <p>Secure payment powered by Airwallex</p>
        </div>

        <div className="payment-details">
          <div className="product-info">
            <h3>{productName}</h3>
            <p>{productDescription}</p>
          </div>

          <div className="amount-info">
            <div className="amount-row">
              <span>Amount:</span>
              <span className="amount">{formatAmount(amount, currency)}</span>
            </div>
            <div className="amount-row">
              <span>Currency:</span>
              <span>{currency.toUpperCase()}</span>
            </div>
            {paymentIntent && (
              <div className="amount-row">
                <span>Order ID:</span>
                <span className="order-id">{paymentIntent.merchant_order_id}</span>
              </div>
            )}
          </div>
        </div>

        <div className="payment-actions">
          <button
            onClick={handlePayment}
            disabled={loading || !paymentIntent || !airwallexInitialized}
            className="pay-button"
          >
            {loading ? (
              <>
                <div className="button-spinner"></div>
                Processing...
              </>
            ) : (
              `Pay ${formatAmount(amount, currency)}`
            )}
          </button>
        </div>

        <div className="payment-security">
          <div className="security-badges">
            <span className="security-badge">🔒 SSL Secured</span>
            <span className="security-badge">💳 PCI Compliant</span>
            <span className="security-badge">🛡️ 3D Secure</span>
          </div>
          <p className="security-text">
            Your payment information is encrypted and secure. We never store your card details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;