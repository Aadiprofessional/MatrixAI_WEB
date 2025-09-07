import React from 'react';
import './ImageSkeleton.css';

interface ImageSkeletonProps {
  className?: string;
}

const ImageSkeleton: React.FC<ImageSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`image-skeleton ${className}`}>
      <div className="skeleton-content">
        <div className="skeleton-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 19 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor" opacity="0.3"/>
          </svg>
        </div>
        <div className="skeleton-text">
          <div className="skeleton-line skeleton-line-1"></div>
          <div className="skeleton-line skeleton-line-2"></div>
        </div>
      </div>
    </div>
  );
};

export default ImageSkeleton;