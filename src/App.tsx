import React, { useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';

// Import pages
import { 
  SignupPage,
  LoginPage, 
  DashboardPage, 
  ChatPage, 
  CallPage,
  HomePage,
  NotFoundPage,
  ImageGeneratorPage,
  VideoCreatorPage,
  ContentWriterPage,
  PresentationCreatorPage,
  ProfilePage,
  SettingsPage,
  HelpPage,
  SubscriptionPage,
  TransactionsPage,
  OrderHistoryPage,
  PaymentPage,
  PaymentSuccessPage,
  ReferralPage,
  SpeechToTextPage,
  TranscriptionPage,
  EmailVerificationPage,
  BuyPage,
  HumaniseTextPage,
  DetectAIPage,
  // Footer pages
  AboutPage,
  ContactPage,
  CareersPage,
  BlogPage,
  PrivacyPage,
  TermsPage,
  CookiesPage,
  StatusPage,
  FAQPage
} from './pageExports';

// Import components
import { Layout, PublicToolLayout, PublicResourceLayout } from './components';

// Import ThemeProvider
import { ThemeProvider } from './context/ThemeContext';
// Import AuthProvider
import { AuthProvider, useAuth } from './context/AuthContext';
// Import UserProvider
import { UserProvider, useUser } from './context/UserContext';
// Import LanguageProvider
import { LanguageProvider } from './context/LanguageContext';
// Import AlertProvider
import { AlertProvider } from './context/AlertContext';
import PricingPage from './pages/PricingPage';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // Use localStorage to prevent flashing loading screens when switching tabs
  // This helps maintain state when browser tabs are switched
  const userFromLocalStorage = useMemo(() => {
    try {
      const storedUser = localStorage.getItem('matrixai_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  }, []);
  
  // If we have a user or a user in localStorage, show the children immediately
  if (user || (!loading && userFromLocalStorage)) {
    return <>{children}</>;
  }
  
  // Show a loading screen only if actively checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If we're not loading and there's no user, redirect to login
  return <Navigate to="/login" replace />;
};

// Pro feature route component
const ProFeatureRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { userData, loading: userLoading, isPro } = useUser();
  
  // Use localStorage to prevent flashing loading screens when switching tabs
  const cachedData = useMemo(() => {
    try {
      const storedUser = localStorage.getItem('matrixai_user');
      const storedUserData = localStorage.getItem('matrixai_userData');
      return {
        user: storedUser ? JSON.parse(storedUser) : null,
        userData: storedUserData ? JSON.parse(storedUserData) : null
      };
    } catch (e) {
      return { user: null, userData: null };
    }
  }, []);
  
  // If we have the data in memory or localStorage, show the children immediately
  if ((user && userData) || (!authLoading && !userLoading && cachedData.user && cachedData.userData)) {
    // We'll use the actual API data if available, otherwise the cached data
    const effectiveUserData = userData || cachedData.userData;
    const isProUser = effectiveUserData?.subscription_active || false;
    
    // We show the content even for non-pro users, but the components can
    // internally handle showing a pro upgrade prompt if needed
    return <>{children}</>;
  }
  
  // Show a loading screen only if actively checking authentication
  if (authLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If we're not loading and there's no user, redirect to login
  if (!user && !cachedData.user) {
    return <Navigate to="/login" replace />;
  }
  
  // If we have a user but no user data, show a generic loading
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

const App: React.FC = () => {
  // Add a handler for page visibility changes to help with browser tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // On tab becoming visible, set a flag to prevent unnecessary reloads
        sessionStorage.setItem('tab_recently_visible', 'true');
        
        // Clear this flag after a short delay
        setTimeout(() => {
          sessionStorage.removeItem('tab_recently_visible');
        }, 1000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <UserProvider>
            <AlertProvider>
              <Router>
            <Routes>
              {/* Main site route */}
              <Route 
                path="/" 
                element={<PublicResourceLayout><HomePage /></PublicResourceLayout>} 
              />
              
              {/* Auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              
              {/* AI feature routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Chat has its own full-screen layout */}
              <Route 
                path="/chat" 
                element={
                  <PublicToolLayout>
                    <ChatPage />
                  </PublicToolLayout>
                } 
              />
              
              {/* Individual chat route with ID */}
              <Route 
                path="/chat/:chatId" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ChatPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Call page with voice interaction */}
              <Route 
                path="/call" 
                element={
                  <ProFeatureRoute>
                    <CallPage />
                  </ProFeatureRoute>
                } 
              />
              
              {/* Tool routes - Public access with conditional layout */}
              <Route 
                path="/tools/image-generator" 
                element={
                  <PublicToolLayout>
                    <ImageGeneratorPage />
                  </PublicToolLayout>
                } 
              />
              
              <Route 
                path="/tools/video-creator" 
                element={
                  <PublicToolLayout>
                    <VideoCreatorPage />
                  </PublicToolLayout>
                } 
              />
              
              <Route 
                path="/tools/content-writer" 
                element={
                  <PublicToolLayout>
                    <ContentWriterPage />
                  </PublicToolLayout>
                } 
              />
               <Route 
                path="/pricing" 
                element={
                  <PublicToolLayout>
                    <PricingPage />
                  </PublicToolLayout>
                } 
              />
              
              <Route 
                path="/tools/humanise-text" 
                element={
                  <PublicToolLayout>
                    <HumaniseTextPage />
                  </PublicToolLayout>
                } 
              />
              
              <Route 
                path="/tools/detect-ai" 
                element={
                  <PublicToolLayout>
                    <DetectAIPage />
                  </PublicToolLayout>
                } 
              />
              
              <Route 
                path="/tools/presentation-creator" 
                element={
                  <PublicToolLayout>
                    <PresentationCreatorPage />
                  </PublicToolLayout>
                } 
              />

              {/* Speech to Text routes */}
              <Route 
                path="/tools/speech-to-text" 
                element={
                  <PublicToolLayout>
                    <SpeechToTextPage />
                  </PublicToolLayout>
                } 
              />
              
              <Route 
                path="/transcription/:audioid" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TranscriptionPage />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* User account routes */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/transactions" 
                element={
                  <ProtectedRoute>
                    <TransactionsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/order-history" 
                element={
                  <ProtectedRoute>
                    <OrderHistoryPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/referral" 
                element={
                  <ProtectedRoute>
                    <ReferralPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/help" 
                element={
                  <ProtectedRoute>
                    <HelpPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Subscription page */}
              <Route 
                path="/subscription" 
                element={
                  <ProtectedRoute>
                    <SubscriptionPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Buy page */}
              <Route 
                path="/buy" 
                element={
                  <ProtectedRoute>
                    <BuyPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Payment route */}
              <Route 
                path="/payment" 
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Payment success route for Antom */}
              <Route 
                path="/payment/success" 
                element={
                  <ProtectedRoute>
                    <PaymentSuccessPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Payment with Airwallex route (legacy) */}
              <Route 
                path="/payment/airwallex" 
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Footer page routes */}
              <Route 
                path="/about" 
                element={
                  <PublicResourceLayout>
                    <AboutPage />
                  </PublicResourceLayout>
                } 
              />
              
              <Route 
                path="/contact" 
                element={
                  <PublicResourceLayout>
                    <ContactPage />
                  </PublicResourceLayout>
                } 
              />
              
              <Route 
                path="/faq" 
                element={
                  <PublicResourceLayout>
                    <FAQPage />
                  </PublicResourceLayout>
                } 
              />
              
              <Route 
                path="/careers" 
                element={
                  <PublicResourceLayout>
                    <CareersPage />
                  </PublicResourceLayout>
                } 
              />
              
              <Route 
                path="/blog" 
                element={
                  <PublicResourceLayout>
                    <BlogPage />
                  </PublicResourceLayout>
                } 
              />
              
              <Route 
                path="/privacy" 
                element={
                  <PublicResourceLayout>
                    <PrivacyPage />
                  </PublicResourceLayout>
                } 
              />
              
              <Route 
                path="/terms" 
                element={
                  <PublicResourceLayout>
                    <TermsPage />
                  </PublicResourceLayout>
                } 
              />
              
              <Route 
                path="/cookies" 
                element={
                  <PublicResourceLayout>
                    <CookiesPage />
                  </PublicResourceLayout>
                } 
              />
              
              <Route 
                path="/status" 
                element={
                  <PublicResourceLayout>
                    <StatusPage />
                  </PublicResourceLayout>
                } 
              />
              
              {/* 404 route */}
              <Route path="*" element={<PublicResourceLayout><NotFoundPage /></PublicResourceLayout>} />
            </Routes>
            </Router>
            </AlertProvider>
          </UserProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
