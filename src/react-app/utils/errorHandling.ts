import { AxiosError } from 'axios';

export const isAuthError = (error: any): boolean => {
  return error?.response?.status === 401;
};

export const handleServiceError = (error: any) => {
  if (error instanceof AxiosError && error.response?.data) {
    // Return the error response directly to preserve the API error structure
    return Promise.reject({
      ...error.response.data,
      message: error.response.data.message || 'An unexpected error occurred'
    });
  }
  
  // For network or other errors
  return Promise.reject({
    success: false,
    message: error.message || 'Network error occurred'
  });
};
