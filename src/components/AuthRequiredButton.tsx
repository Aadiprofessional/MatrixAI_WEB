import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AuthRequiredButtonProps {
  onClick?: (e?: any) => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
}

/**
 * AuthRequiredButton component that checks if a user is authenticated before
 * executing the provided onClick function. If the user is not authenticated,
 * it redirects to the login page instead.
 */
const AuthRequiredButton: React.FC<AuthRequiredButtonProps> = ({
  onClick,
  className,
  children,
  disabled = false,
  title,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) {
      // If user is not authenticated, redirect to login page
      navigate('/login');
    } else if (onClick) {
      // If user is authenticated, execute the provided onClick function
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
};

export default AuthRequiredButton;