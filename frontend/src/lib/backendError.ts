/**
 * Formats backend errors into user-friendly messages while preserving the original error text.
 * Handles authorization errors and other backend traps.
 */
export function formatBackendError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Check for authorization errors
    if (message.includes('Unauthorized')) {
      return `Access denied: ${message}. Please make sure you are logged in.`;
    }
    
    // Check for actor not available
    if (message.includes('Actor not available')) {
      return 'Connection error: Unable to connect to the backend. Please refresh the page and try again.';
    }
    
    // Return the original error message for other cases
    return message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}
