import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiCheck, 
  FiDownload, 
  FiHome, 
  FiLoader,
  FiCreditCard,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiStar
} from 'react-icons/fi';
import { Layout } from '../components';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import matrixLogo from '../assets/matrix.png';
import airwallexService, { PaymentIntentStatusResponse } from '../services/airwallexService';

const AirwallexPaymentSuccess: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const { userData } = useUser();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentIntentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const intentId = searchParams.get('intent_id');

  // Prevent back navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      navigate('/dashboard', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!intentId) {
        setError('Payment intent ID not found');
        setLoading(false);
        return;
      }

      try {
        const details = await airwallexService.getPaymentIntentStatus(intentId);
        setPaymentDetails(details);
        
        // Verify payment was successful
        if (details.status !== 'SUCCEEDED') {
          setError('Payment was not successful');
        }
      } catch (err) {
        console.error('Error fetching payment details:', err);
        setError('Failed to fetch payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [intentId]);

  const generatePdf = async () => {
    if (!paymentDetails) return;

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add logo
      try {
        pdf.addImage(matrixLogo, 'PNG', 20, 20, 40, 20);
      } catch (error) {
        console.warn('Could not load logo:', error);
      }
      
      // Title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INVOICE', pageWidth - 20, 35, { align: 'right' });
      
      // Invoice details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      let yPosition = 70;
      
      // Customer information
      pdf.setFont('helvetica', 'bold');
      pdf.text('Invoice To:', 20, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition += 10;
      
      const customerName = userData?.name || user?.email?.split('@')[0] || 'Customer';
       const customerEmail = userData?.email || user?.email || 'customer@email.com';
      
      pdf.text(customerName, 20, yPosition);
      yPosition += 8;
      pdf.text(customerEmail, 20, yPosition);
      yPosition += 8;
      
      // Company information (right side)
      let rightYPosition = 70;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Invoice From:', pageWidth - 20, rightYPosition, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      rightYPosition += 10;
      
      pdf.text('MatrixAI Global', pageWidth - 20, rightYPosition, { align: 'right' });
      rightYPosition += 8;
      pdf.text('support@matrixaiglobal.com', pageWidth - 20, rightYPosition, { align: 'right' });
      rightYPosition += 8;
      pdf.text('+1 (800) MATRIX-AI', pageWidth - 20, rightYPosition, { align: 'right' });
      
      yPosition = Math.max(yPosition, rightYPosition) + 20;
      
      // Invoice details
      pdf.setFont('helvetica', 'bold');
      pdf.text('Invoice Details:', 20, yPosition);
      yPosition += 15;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Invoice No: ${paymentDetails.id}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Payment ID: ${paymentDetails.id}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Order ID: ${paymentDetails.merchant_order_id}`, 20, yPosition);
      yPosition += 20;
      
      // Table header
      const tableStartY = yPosition;
      const rowHeight = 10;
      
      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, tableStartY, pageWidth - 40, rowHeight, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description', 25, tableStartY + 7);
      pdf.text('Amount', pageWidth - 60, tableStartY + 7);
      
      yPosition = tableStartY + rowHeight + 5;
      
      // Table content
      pdf.setFont('helvetica', 'normal');
      pdf.text('MatrixAI Subscription', 25, yPosition);
      pdf.text(`$${paymentDetails.amount} ${paymentDetails.currency}`, pageWidth - 60, yPosition);
      
      yPosition += 20;
      
      // Total
      pdf.setFont('helvetica', 'bold');
      pdf.text('Total Amount:', pageWidth - 100, yPosition);
      pdf.text(`$${paymentDetails.amount} ${paymentDetails.currency}`, pageWidth - 60, yPosition);
      
      // Footer
      yPosition = pageHeight - 30;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });
      
      // Save the PDF
      pdf.save(`invoice-${paymentDetails.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to simple text file
      const invoiceText = `
INVOICE

Customer: ${userData?.name || user?.email?.split('@')[0] || 'Customer'}
Email: ${userData?.email || user?.email || 'customer@email.com'}
Payment ID: ${paymentDetails.id}
Order ID: ${paymentDetails.merchant_order_id}
Amount: $${paymentDetails.amount} ${paymentDetails.currency}
Date: ${new Date().toLocaleDateString()}

Thank you for your business!
      `;
      
      const blob = new Blob([invoiceText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${paymentDetails.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadReceipt = () => {
    generatePdf();
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <Layout>
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
          <div className="text-center">
            <FiLoader className={`w-12 h-12 animate-spin mx-auto mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Loading payment details...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-8 h-8 text-red-600" />
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Error
            </h1>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {error}
            </p>
            <button
              onClick={handleGoHome}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FiCheck className="w-10 h-10 text-green-600" />
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className={`text-4xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🎉 Payment Successful!
              </h1>
              <p className={`text-xl mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Thank you for your payment!
              </p>
              <p className={`text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your transaction has been completed successfully. You can now access all premium features.
              </p>
              
              {/* Celebration Stars */}
              <div className="flex justify-center space-x-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                  >
                    <FiStar className={`w-6 h-6 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'} fill-current`} />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Payment Details */}
            {paymentDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 mb-8 text-left`}
              >
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Payment Details
                </h2>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiDollarSign className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Amount</span>
                    </div>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      ${paymentDetails.amount} {paymentDetails.currency}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiCreditCard className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Payment ID</span>
                    </div>
                    <span className={`font-mono text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {paymentDetails.id}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiCalendar className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Order ID</span>
                    </div>
                    <span className={`font-mono text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {paymentDetails.merchant_order_id}
                    </span>
                  </div>
                  
                  {paymentDetails.latest_payment_attempt?.payment_method && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FiCreditCard className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Payment Method</span>
                      </div>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {paymentDetails.latest_payment_attempt.payment_method.type}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={handleDownloadReceipt}
                className={`flex items-center justify-center space-x-2 px-8 py-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                  darkMode 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg'
                }`}
              >
                <FiFileText className="w-5 h-5" />
                <span>Download Invoice</span>
              </button>
              
              <button
                onClick={handleGoHome}
                className={`flex items-center justify-center space-x-2 px-8 py-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 shadow-lg' 
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-lg'
                }`}
              >
                <FiHome className="w-5 h-5" />
                <span>Go to Dashboard</span>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default AirwallexPaymentSuccess;