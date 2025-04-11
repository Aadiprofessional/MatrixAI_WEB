import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';

// Import pages
import { 
  SignupPage,
  LoginPage, 
  DashboardPage, 
  ChatPage, 
  HomePage,
  NotFoundPage,
  ImageGeneratorPage,
  VideoCreatorPage,
  ContentWriterPage,
  PresentationCreatorPage,
  ProfilePage,
  SettingsPage,
  HelpPage
} from './pageExports';

// Import components
import { Layout } from './components';

// Import ThemeProvider
import { ThemeProvider } from './context/ThemeContext';

// Auth context
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // This is a simplified version - in a real app, you'd check if the user is authenticated
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
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
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Tool routes */}
            <Route 
              path="/tools/image-generator" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImageGeneratorPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/tools/video-creator" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <VideoCreatorPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/tools/content-writer" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ContentWriterPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/tools/presentation-creator" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <PresentationCreatorPage />
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
              path="/help" 
              element={
                <ProtectedRoute>
                  <HelpPage />
                </ProtectedRoute>
              } 
            />
            
            {/* 404 route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
