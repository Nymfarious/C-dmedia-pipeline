export const triggerHaptic = (pattern: 'tap' | 'success' | 'error') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (pattern) {
      case 'tap': 
        navigator.vibrate(10);
        break;
      case 'success': 
        navigator.vibrate([10, 50, 10]);
        break;
      case 'error': 
        navigator.vibrate([10, 30, 10, 30, 10]);
        break;
    }
  }
};
