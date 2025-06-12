import api from '../api';
import { handleServiceError } from '../utils/errorHandling';

let getAccessTokenHandler: (() => string | null) | null = null;
let refreshHandler: (() => Promise<void>) | null = null;
let logoutHandler: (() => Promise<void>) | null = null;

// Function to check if handlers are set
function checkHandlers() {
  if (!getAccessTokenHandler || !refreshHandler || !logoutHandler) {
    console.error('[AuthApi] Handlers not properly initialized. Current state:', {
      getAccessTokenHandler: !!getAccessTokenHandler,
      refreshHandler: !!refreshHandler,
      logoutHandler: !!logoutHandler
    });
    throw new Error('Auth handlers not set. Call setAuthHandlers from AuthContext.');
  }
}

export function setAuthHandlers(
  handlers: {
    getAccessToken: () => string | null;
    refresh: () => Promise<void>;
    logout: () => Promise<void>;
  }
) {
  getAccessTokenHandler = handlers.getAccessToken;
  refreshHandler = handlers.refresh;
  logoutHandler = handlers.logout;
  // Verify handlers were set correctly
  checkHandlers();
}

export async function login(email: string, password: string) {
  try {
    return await api.post('/auth/login', { email, password });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function refresh(refreshToken: string) {
  try {
    return await api.post('/auth/refresh', { refreshToken });
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function logout(refreshToken: string) {
  try {
    return await api.post('/auth/logout', { refreshToken });
  } catch (error) {
    return handleServiceError(error);
  }
}

async function resetUserPassword(userId: number) {
  try {
    const response = await api.post(`/auth/reset-password/${userId}`);
    return response.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

export {
  resetUserPassword,
  getAccessTokenHandler,
  refreshHandler,
  logoutHandler
};