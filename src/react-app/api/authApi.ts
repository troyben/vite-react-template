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
  console.log('[AuthApi] setAuthHandlers called');
  getAccessTokenHandler = handlers.getAccessToken;
  refreshHandler = handlers.refresh;
  logoutHandler = handlers.logout;

  // Verify handlers were set correctly
  checkHandlers();
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
  return res.json();
}

export async function refresh(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Refresh failed');
  return res.json();
}

export async function logout(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Logout failed');
  return res.json();
}

// Authenticated fetch with auto-refresh
export async function authFetch(url: string, options: RequestInit = {}) {
  checkHandlers();
  
  const getToken = () => {
    const token = getAccessTokenHandler!();
    if (!token) throw new Error('No access token available');
    return token;
  };

  const makeRequest = (token: string) => fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  try {
    // First attempt with current token
    let token = getToken();
    let response = await makeRequest(token);

    // If unauthorized, try refreshing token
    if (response.status === 401 && refreshHandler) {
      await refreshHandler();
      token = getToken();
      response = await makeRequest(token);
    }

    return response;
  } catch (error) {
    if (logoutHandler) {
      await logoutHandler();
    }
    throw new Error('Authentication required');
  }
}

export async function fetchProfile() {
  const res = await authFetch(`${API_URL}/auth/me`);
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch profile');
  return (await res.json()).data.user;
}

export async function updateProfile(id: number, updates: Partial<{ name: string; email: string; mobile: string; avatar?: string; password?: string; }>) {
  const res = await authFetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update profile');
  return (await res.json()).data;
}

// User CRUD
export async function getUsers() {
  const res = await authFetch(`${API_URL}/users`);
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch users');
  return (await res.json()).data;
}

export async function getUser(id: number) {
  const res = await authFetch(`${API_URL}/users/${id}`);
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch user');
  return (await res.json()).data;
}

export async function createUser(user: { name: string; email: string; password: string; mobile: string; role: string; }) {
  const res = await authFetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create user');
  return (await res.json()).data;
}

export async function updateUser(id: number, updates: Partial<{ name: string; email: string; mobile: string; role: string; password?: string; status?: string; }>) {
  const res = await authFetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update user');
  return (await res.json()).data;
}

export async function deleteUser(id: number) {
  const res = await authFetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete user');
  return (await res.json()).message;
}

export async function resetUserPassword(userId: number) {
  const res = await authFetch(`${API_URL}/auth/reset-password/${userId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Password reset failed');
  return res.json();
}