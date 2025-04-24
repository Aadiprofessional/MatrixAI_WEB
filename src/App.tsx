import React, { useEffect } from 'react';
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
  ReferralPage,
  SpeechToTextPage,
  TranscriptionPage
} from './pageExports';

// Import components
import { Layout } from './components';

// Import ThemeProvider
import { ThemeProvider } from './context/ThemeContext';
// Import AuthProvider
import { AuthProvider, useAuth } from './context/AuthContext';
// Import UserProvider
import { UserProvider, useUser } from './context/UserContext';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // Show a loading screen while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Pro feature route component
const ProFeatureRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { userData, loading: userLoading, isPro } = useUser();
  
  // Show a loading screen while checking authentication
  if (authLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <Router>
            <Routes>
              {/* Main site route */}
              <Route 
                path="/" 
                element={
                  <Layout>
                    <HomePage />
                  </Layout>
                } 
              />
              
              {/* Auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
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
                  <ProFeatureRoute>
                    <ChatPage />
                  </ProFeatureRoute>
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
              
              {/* Tool routes */}
              <Route 
                path="/tools/image-generator" 
                element={
                  <ProFeatureRoute>
                    <Layout>
                      <ImageGeneratorPage />
                    </Layout>
                  </ProFeatureRoute>
                } 
              />
              
              <Route 
                path="/tools/video-creator" 
                element={
                  <ProFeatureRoute>
                    <Layout>
                      <VideoCreatorPage />
                    </Layout>
                  </ProFeatureRoute>
                } 
              />
              
              <Route 
                path="/tools/content-writer" 
                element={
                  <ProFeatureRoute>
                    <Layout>
                      <ContentWriterPage />
                    </Layout>
                  </ProFeatureRoute>
                } 
              />
              
              <Route 
                path="/tools/presentation-creator" 
                element={
                  <ProFeatureRoute>
                    <Layout>
                      <PresentationCreatorPage />
                    </Layout>
                  </ProFeatureRoute>
                } 
              />

              {/* Speech to Text routes */}
              <Route 
                path="/tools/speech-to-text" 
                element={
                  <ProFeatureRoute>
                    <Layout>
                      <SpeechToTextPage />
                    </Layout>
                  </ProFeatureRoute>
                } 
              />
              
              <Route 
                path="/transcription/:audioid" 
                element={
                  <ProFeatureRoute>
                    <Layout>
                      <TranscriptionPage />
                    </Layout>
                  </ProFeatureRoute>
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
              
              {/* Payment route */}
              <Route 
                path="/payment" 
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
