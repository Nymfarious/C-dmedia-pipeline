import { NavigateFunction } from 'react-router-dom';

/**
 * Utility for proper navigation without page reloads
 */
export const navigateToRoute = (navigate: NavigateFunction, route: string) => {
  // Use React Router navigation instead of window.location.href
  navigate(route);
};

/**
 * Navigate to dashboard
 */
export const navigateToDashboard = (navigate: NavigateFunction) => {
  navigateToRoute(navigate, '/');
};

/**
 * Navigate to assets page
 */
export const navigateToAssets = (navigate: NavigateFunction) => {
  navigateToRoute(navigate, '/assets');
};

/**
 * Navigate to AI gallery
 */
export const navigateToAIGallery = (navigate: NavigateFunction) => {
  navigateToRoute(navigate, '/ai-gallery');
};