import { AxiosError } from 'axios';

export const handleServiceError = (error: any) => {
  console.log('Handling service error:', error);
  if (error instanceof AxiosError && error.response?.data) {
    if (error.response.status === 401) {
      // Suppress console error for 401
    } else {
      // Log other errors
      console.error(error);
    }
    // Return the error response directly to preserve the API error structure
    return Promise.reject({
      ...error.response.data,
      message: error.response.data.message || 'An unexpected error occurred'
    });
  }
  // For network or other errors
  console.error(error);
  return Promise.reject({
    success: false,
    message: error.message || 'Network error occurred'
  });
};
