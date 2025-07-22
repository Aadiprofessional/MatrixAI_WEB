import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Layout } from './';

interface PublicToolLayoutProps {
  children: React.ReactNode;
}

/**
 * PublicToolLayout component that conditionally renders the Layout component
 * based on user authentication status. If the user is not logged in, it renders
 * only the children without the Layout (no sidebar, header, or footer).
 */
const PublicToolLayout: React.FC<PublicToolLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  
  // If user is logged in, render with Layout
  if (user) {
    return <Layout>{children}</Layout>;
  }
  
  // If user is not logged in, render only the children without Layout
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="flex-1 flex flex-col bg-gray-900">
        <div className="flex-1 overflow-auto pb-20 px-4 md:px-6 pt-2 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PublicToolLayout;