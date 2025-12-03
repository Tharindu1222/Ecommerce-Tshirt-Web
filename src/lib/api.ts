import { Product, CartItem } from '../types';

// Use environment variable if set, otherwise use relative path (works with Vite proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Get session ID from localStorage
export const getSessionId = () => {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const sessionId = getSessionId();
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
    ...options.headers,
  };

  // Add auth token if available
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// Products API
export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    return apiRequest('/products');
  },
  
  getById: async (id: string): Promise<Product> => {
    return apiRequest(`/products/${id}`);
  },
};

// Cart API
export const cartApi = {
  getAll: async (): Promise<CartItem[]> => {
    return apiRequest('/cart');
  },
  
  add: async (productId: string, size: string, color: string, quantity: number): Promise<CartItem> => {
    return apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, size, color, quantity }),
    });
  },
  
  update: async (itemId: string, quantity: number): Promise<CartItem> => {
    return apiRequest(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },
  
  remove: async (itemId: string): Promise<void> => {
    await apiRequest(`/cart/${itemId}`, {
      method: 'DELETE',
    });
  },
  
  clear: async (): Promise<void> => {
    await apiRequest('/cart', {
      method: 'DELETE',
    });
  },
};

// Orders API
export const ordersApi = {
  create: async (email: string, totalAmount: number, shippingAddress: any, cartItems: any[]): Promise<any> => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({
        email,
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        cartItems,
      }),
    });
  },
  
  getByEmail: async (email: string): Promise<any[]> => {
    return apiRequest(`/orders?email=${encodeURIComponent(email)}`);
  },
};

// Auth API
export const authApi = {
  register: async (email: string, password: string, firstName?: string, lastName?: string, phone?: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, firstName, lastName, phone }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  getProfile: async (): Promise<any> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    return apiRequest('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  updateProfile: async (profileData: any): Promise<any> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    return apiRequest('/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    await apiRequest('/auth/change-password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Admin API
export const adminApi = {
  // Products
  getProducts: async (): Promise<Product[]> => {
    return apiRequest('/admin/products');
  },
  
  getProduct: async (id: string): Promise<Product> => {
    return apiRequest(`/admin/products/${id}`);
  },
  
  createProduct: async (product: any): Promise<Product> => {
    return apiRequest('/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },
  
  updateProduct: async (id: string, product: any): Promise<Product> => {
    return apiRequest(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },
  
  deleteProduct: async (id: string): Promise<void> => {
    await apiRequest(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  },
  
  getProductStats: async (): Promise<any> => {
    return apiRequest('/admin/products/stats/overview');
  },
  
  // Users
  getUsers: async (): Promise<any[]> => {
    return apiRequest('/admin/users');
  },
  
  getUser: async (id: string): Promise<any> => {
    return apiRequest(`/admin/users/${id}`);
  },
  
  updateUser: async (id: string, userData: any): Promise<any> => {
    return apiRequest(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  
  deleteUser: async (id: string): Promise<void> => {
    await apiRequest(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },
  
  resetUserPassword: async (id: string, newPassword: string): Promise<void> => {
    await apiRequest(`/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },
  
  getUserStats: async (): Promise<any> => {
    return apiRequest('/admin/users/stats/overview');
  },
  
  // Orders
  getOrders: async (queryString?: string): Promise<any[]> => {
    const url = queryString ? `/admin/orders?${queryString}` : '/admin/orders';
    return apiRequest(url);
  },
  
  getOrderById: async (id: string): Promise<any> => {
    return apiRequest(`/admin/orders/${id}`);
  },
  
  updateOrderStatus: async (id: string, status: string): Promise<any> => {
    return apiRequest(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
  
  getOrderStats: async (): Promise<any> => {
    return apiRequest('/admin/orders/stats/overview');
  },
};

