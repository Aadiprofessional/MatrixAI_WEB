import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import airwallexService, { PaymentIntentStatusResponse } from '../../services/airwallexService';
import './PaymentResult.css';

const PaymentSuccess: React.FC = () => {
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
        
        // Verify payment was actually successful
        if (details.status !== 'SUCCEEDED') {
          setError(`Payment status: ${details.status}`);
        }
      } catch (error) {
        console.error('Failed to fetch payment details:', error);
        setError('Failed to verify payment status');
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

  const handleContinue = () => {
    navigate('/');
  };

  const handleDownloadReceipt = () => {
    if (!paymentDetails) return;
    
    // Create a simple receipt text
    const receiptContent = `
PAYMENT RECEIPT
================

Payment ID: ${paymentDetails.id}
Order ID: ${paymentDetails.merchant_order_id}
Amount: ${formatAmount(paymentDetails.amount, paymentDetails.currency)}
Currency: ${paymentDetails.currency}
Status: ${paymentDetails.status}
Date: ${new Date().toLocaleDateString()}

Thank you for your payment!
MatrixAI Team
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${paymentDetails.merchant_order_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="payment-result-page">
        <div className="payment-result-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Verifying payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-result-page">
        <div className="payment-result-container">
          <div className="result-content error">
            <div className="result-icon error-icon">❌</div>
            <h2>Payment Verification Failed</h2>
            <p>{error}</p>
            <div className="result-actions">
              <button onClick={handleContinue} className="primary-button">
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-page">
      <div className="payment-result-container">
        <div className="result-content success">
          <div className="result-icon success-icon">✅</div>
          <h2>Payment Successful!</h2>
          <p>Thank you for your payment. Your transaction has been completed successfully.</p>
          
          {paymentDetails && (
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
                <span className="detail-value status-success">{paymentDetails.status}</span>
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
          )}
          
          <div className="result-actions">
            <button onClick={handleDownloadReceipt} className="secondary-button">
              📄 Download Receipt
            </button>
            <button onClick={handleContinue} className="primary-button">
              Continue to Dashboard
            </button>
          </div>
          
          <div className="success-message">
            <p>🎉 Your MatrixAI service is now active and ready to use!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;