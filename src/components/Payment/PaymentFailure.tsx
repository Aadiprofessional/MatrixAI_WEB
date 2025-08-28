import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import airwallexService, { PaymentIntentStatusResponse } from '../../services/airwallexService';
import './PaymentResult.css';

const PaymentFailure: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState<PaymentIntentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentIntentId = searchParams.get('id');

  useEffect(() => {
    if (!paymentIntentId) {
      setError('Payment ID not found');
      setLoading(false);
      return;
    }

    const fetchPaymentDetails = async () => {
      try {
        const details = await airwallexService.getPaymentIntentStatus(paymentIntentId);
        setPaymentDetails(details);
      } catch (error) {
        console.error('Failed to fetch payment details:', error);
        setError('Failed to fetch payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentIntentId]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100); // Convert from cents
  };

  const handleRetryPayment = () => {
    if (paymentDetails) {
      // Navigate back to payment page with the same amount
      const amount = paymentDetails.amount / 100;
      navigate(`/payment?amount=${amount}&currency=${paymentDetails.currency}`);
    } else {
      navigate('/payment');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getFailureReason = (status: string) => {
    switch (status) {
      case 'FAILED':
        return 'The payment was declined by your bank or card issuer.';
      case 'CANCELLED':
        return 'The payment was cancelled.';
      case 'REQUIRES_PAYMENT_METHOD':
        return 'A valid payment method is required to complete this transaction.';
      case 'REQUIRES_CONFIRMATION':
        return 'Additional confirmation is required to complete this payment.';
      case 'REQUIRES_ACTION':
        return 'Additional action is required to complete this payment.';
      default:
        return 'The payment could not be completed. Please try again.';
    }
  };

  const getFailureAdvice = (status: string) => {
    switch (status) {
      case 'FAILED':
        return 'Please check your card details and try again, or use a different payment method.';
      case 'CANCELLED':
        return 'You can retry the payment or contact support if you need assistance.';
      case 'REQUIRES_PAYMENT_METHOD':
        return 'Please ensure you have entered valid card details and try again.';
      default:
        return 'Please try again or contact our support team if the problem persists.';
    }
  };

  if (loading) {
    return (
      <div className="payment-result-page">
        <div className="payment-result-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Checking payment status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-page">
      <div className="payment-result-container">
        <div className="result-content failure">
          <div className="result-icon failure-icon">❌</div>
          <h2>Payment Failed</h2>
          
          {paymentDetails ? (
            <>
              <p>{getFailureReason(paymentDetails.status)}</p>
              
              <div className="payment-summary">
                <h3>Payment Details</h3>
                <div className="detail-row">
                  <span>Payment ID:</span>
                  <span className="detail-value">{paymentDetails.id}</span>
                </div>
                <div className="detail-row">
                  <span>Order ID:</span>
                  <span className="detail-value">{paymentDetails.merchant_order_id}</span>
                </div>
                <div className="detail-row">
                  <span>Amount:</span>
                  <span className="detail-value amount">
                    {formatAmount(paymentDetails.amount, paymentDetails.currency)}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Status:</span>
                  <span className="detail-value status-failed">{paymentDetails.status}</span>
                </div>
                <div className="detail-row">
                  <span>Date:</span>
                  <span className="detail-value">{new Date().toLocaleDateString()}</span>
                </div>
                {paymentDetails.latest_payment_attempt?.payment_method && (
                  <div className="detail-row">
                    <span>Payment Method:</span>
                    <span className="detail-value">
                      {paymentDetails.latest_payment_attempt.payment_method.type.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="failure-advice">
                <h4>What can you do?</h4>
                <p>{getFailureAdvice(paymentDetails.status)}</p>
                
                <div className="advice-list">
                  <ul>
                    <li>✓ Check that your card details are correct</li>
                    <li>✓ Ensure you have sufficient funds</li>
                    <li>✓ Try a different payment method</li>
                    <li>✓ Contact your bank if the issue persists</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <>
              <p>We couldn't process your payment at this time.</p>
              {error && (
                <div className="error-details">
                  <p><strong>Error:</strong> {error}</p>
                </div>
              )}
            </>
          )}
          
          <div className="result-actions">
            <button onClick={handleRetryPayment} className="primary-button">
              🔄 Try Again
            </button>
            <button onClick={handleGoHome} className="secondary-button">
              Return to Home
            </button>
          </div>
          
          <div className="support-info">
            <h4>Need Help?</h4>
            <p>If you continue to experience issues, please contact our support team:</p>
            <div className="support-contacts">
              <span>📧 support@matrixai.com</span>
              <span>📞 1-800-MATRIX-AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;