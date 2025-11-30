
import axios from 'axios';

// ---------------------------------------------------------------------------
// Resolve API Base URL
// ---------------------------------------------------------------------------
let API_BASE_URL =
  // Vue CLI
  (typeof process !== 'undefined' && process.env && (
    process.env.VUE_APP_API_URL ||
    process.env.VITE_API_URL
  )) ||

  // Vite
  (typeof import.meta !== 'undefined' && import.meta.env && (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VUE_APP_API_URL
  )) ||

  // Default to production API
  'https://pann-pos.onrender.com/api/v1';

// Guard for invalid paths
if (!API_BASE_URL || (API_BASE_URL.startsWith('/'))) {
  API_BASE_URL = 'https://pann-pos.onrender.com/api/v1';
}

// Debug log
try {
  if (typeof window !== 'undefined') {
    console.log('[API] Resolved Base URL:', API_BASE_URL);
  }
} catch (err) {
  console.warn('[API] Failed to log base URL:', err);
}

// Export base URL
export const apiBaseUrl = API_BASE_URL;


// ---------------------------------------------------------------------------
// Axios Client
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Interceptor: Attach Auth Token
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_SERVICE_TOKEN) {
      config.headers.Authorization = `Bearer ${import.meta.env.VITE_API_SERVICE_TOKEN}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// AUTH API
// Registration ENABLED | getProfile → /auth/customer/profile/
// ============================================================================
export const authAPI = {
  // Registration (enabled)
  register: async (payload) => {
    try {
      console.log('[API] Register attempt:', payload.email);
      const res = await apiClient.post('/auth/customer/register/', payload);

      const { access_token, refresh_token } = res.data || {};

      if (access_token) localStorage.setItem('access_token', access_token);
      if (refresh_token) localStorage.setItem('refresh_token', refresh_token);

      return res.data;
    } catch (error) {
      console.error('[API] Registration error:', error.response?.data);
      throw error.response?.data || { error: 'Registration failed' };
    }
  },

  // Login
  login: async (email, password) => {
    try {
      console.log('[API] Login attempt:', email);
      const response = await apiClient.post('/auth/customer/login/', { email, password });

      const { access_token, refresh_token } = response.data || {};
      if (access_token) localStorage.setItem('access_token', access_token);
      if (refresh_token) localStorage.setItem('refresh_token', refresh_token);

      return response.data;
    } catch (error) {
      console.error('[API] Login error:', error.response?.data);
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  // Logout
  logout: async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('ramyeon_user_session');
  },

  // Profile (kept version)
  getProfile: async () => {
    try {
      const res = await apiClient.get('/auth/customer/profile/');
      return res.data;
    } catch (error) {
      console.error('[API] getProfile error:', error.response?.data);
      const err = new Error(error.response?.data?.message || 'Failed to fetch profile');
      err.data = error.response?.data;
      throw err;
    }
  },
};

// ============================================================================
// POS API (Website-inaccessible endpoints)
// ============================================================================
export const posAPI = {
  scanUserQR: async () => { throw { message: 'POS QR scan not supported' } },
  scanPromotionQR: async () => { throw { message: 'POS promotion scan not supported' } },
  redeemPromotion: async () => { throw { message: 'POS redemption not supported' } },
  awardPoints: async () => { throw { message: 'Award points not supported' } },
  processOrderPoints: async () => { throw { message: 'Order points not supported' } },
  getUserByQR: async () => { throw { message: 'POS user lookup not supported' } },
  getPromotionByQR: async () => { throw { message: 'POS promo lookup not supported' } },
  getDashboard: async () => { throw { message: 'POS dashboard not supported' } },
};

// ============================================================================
// PRODUCTS API
// ============================================================================
export const productsAPI = {
  // Get all products
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/products/', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products:', error.response?.data);
      throw error.response?.data || { message: 'Failed to fetch products' };
    }
  },

  // Get product by ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/products/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product:', error.response?.data);
      throw error.response?.data || { message: 'Failed to fetch product' };
    }
  },

  // Get products by category
  getByCategory: async (categoryId, subcategory = null, page = 1, limit = 20) => {
    try {
      const params = { page, limit };
      if (subcategory) params.subcategory = subcategory;

      const response = await apiClient.get(
        `/category/${categoryId}/subcategories/${subcategory || 'all'}/products/`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products by category:', error.response?.data);
      throw error.response?.data || { message: 'Failed to fetch products by category' };
    }
  },

  // Search products
  search: async (query) => {
    try {
      const response = await apiClient.get('/pos/search/', { params: { q: query } });
      return response.data;
    } catch (error) {
      console.error('Failed to search products:', error.response?.data);
      throw error.response?.data || { message: 'Failed to search products' };
    }
  }
};

// ============================================================================
// CATEGORIES API
// ============================================================================
export const categoriesAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/category/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch categories:', error.response?.data);
      throw error.response?.data || { message: 'Failed to fetch categories' };
    }
  },

  // Get category by ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/category/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch category:', error.response?.data);
      throw error.response?.data || { message: 'Failed to fetch category' };
    }
  },

  // Get subcategories
  getSubcategories: async (categoryId) => {
    try {
      const response = await apiClient.get(`/category/${categoryId}/subcategories/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch subcategories:', error.response?.data);
      throw error.response?.data || { message: 'Failed to fetch subcategories' };
    }
  }
};

// ============================================================================
// CART API (Backend not implemented; fallback only)
// ============================================================================
export const cartAPI = {
  getCart: async () => {
    console.warn('Cart API not available; using fallback');
    return { items: [], total: 0 };
  },

  addItem: async () => {
    console.warn('Cart API addItem not implemented');
    return { message: 'Cart API not available' };
  },

  removeItem: async () => {
    console.warn('Cart API removeItem not implemented');
    return { message: 'Cart API not available' };
  },

  clearCart: async () => {
    console.warn('Cart API clearCart not implemented');
    return { message: 'Cart API not available' };
  },
};

// ============================================================================
// ORDERS API (ENHANCED)
// Strict production version for getStatus()
// ============================================================================
export const ordersAPI = {

  // -------------------------------------------------------------------------
  // Get all orders for current user
  // -------------------------------------------------------------------------
  getAll: async (limit = 50, offset = 0) => {
    try {
      const userSession = JSON.parse(localStorage.getItem('ramyeon_user_session') || '{}');
      const customerId = userSession.id; // CUST-00040

      console.log('📦 Loading orders for customer:', customerId);

      if (!customerId) {
        const userOrdersKey = `ramyeon_orders_${userSession.email || 'guest'}`;
        const orders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
        return { success: true, results: orders };
      }

      // Call the backend endpoint
      const response = await apiClient.get(`/online-orders/customer/${customerId}/`, {
        params: { limit, offset }
      });

      console.log('✅ Backend response:', response.data);

      // The backend returns an ARRAY directly, not {results: array}
      // So we need to wrap it in the expected format
      return { 
        success: true, 
        results: response.data // response.data is the array of orders
      };

    } catch (error) {
      console.error('❌ Error fetching customer orders:', error);
      
      // Fallback to localStorage
      const userSession = JSON.parse(localStorage.getItem('ramyeon_user_session') || '{}');
      const userOrdersKey = `ramyeon_orders_${userSession.id || userSession.email || 'guest'}`;
      const fallbackOrders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
      
      return { 
        success: false, 
        results: fallbackOrders, 
        error: error.message
      };
    }
  },

  // -------------------------------------------------------------------------
  // Create new order
  // -------------------------------------------------------------------------
  create: async (orderData) => {
    try {
      const items = Array.isArray(orderData?.items) ? orderData.items : [];

      const payload = {
        customer_id: orderData?.customer_id || orderData?.user?.id,
        items: items.map((item) => ({
          product_id: item.product_id || item.id || item.productId,
          quantity: item.quantity || 1,
          price: item.price || item.unit_price || 0,
          product_name: item.name || item.product_name,
        })),
        delivery_address: orderData?.delivery_address || {},
        delivery_type: orderData?.delivery_type || 'delivery',
        payment_method: (orderData?.payment_method || 'cash').toLowerCase(),
        points_to_redeem: orderData?.points_to_redeem || orderData?.loyalty_points || 0,
        notes: orderData?.notes || orderData?.special_instructions || '',
        special_instructions: orderData?.special_instructions || orderData?.notes || '',
      };

      const response = await apiClient.post('/online-orders/', payload);
      
      // Backend returns { success: true, data: {...} } or { success: false, error: "..." }
      if (response.data && response.data.success) {
        return { success: true, data: response.data.data || response.data };
      } else {
        return { 
          success: false, 
          error: response.data?.error || response.data?.message || 'Failed to create order' 
        };
      }

    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || data?.error || error.message || 'Failed to create order';
      
      return { success: false, error: msg };
    }
  },

  // -------------------------------------------------------------------------
  // Get order by ID
  // -------------------------------------------------------------------------
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/sales/get/${id}/`);
      return response.data;
    } catch (error) {
      // fallback: localStorage lookup
      const orders = JSON.parse(localStorage.getItem('ramyeon_orders') || '[]');
      return orders.find((o) => o.id === id) || null;
    }
  },

  // -------------------------------------------------------------------------
  // Get order status (STRICT production version)
  // -------------------------------------------------------------------------
  getStatus: async (orderId) => {
    try {
      // Validate ID
      if (!orderId || orderId === 'undefined' || orderId === 'null') {
        return { success: false, error: 'Invalid order ID' };
      }

      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await apiClient.get(`/online/orders/${orderId}/status/`);
      return { success: true, ...response.data };

    } catch (error) {
      // Expected case: order not found in backend
      if (error.response?.status === 404) {
        return { success: false, error: 'Order not found' };
      }

      if (error.response?.status === 403) {
        return { success: false, error: 'Unauthorized access to order' };
      }

      if (error.response?.status === 401) {
        return { success: false, error: 'Authentication required' };
      }

      // Network or unexpected
      console.error('❌ Network error during order status:', error.message);
      return { success: false, error: error.message || 'Network error' };
    }
  },

  // -------------------------------------------------------------------------
  // Update order status (POS/Admin)
  // -------------------------------------------------------------------------
  updateStatus: async (orderId, newStatus, notes = '') => {
    try {
      const res = await apiClient.post(`/online-orders/${orderId}/status/`, {
        status: newStatus,
        notes: notes
      });

      return { success: true, ...res.data };

    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "Failed to update status"
      };
    }
  },

};


// ============================================================================
// LOYALTY API (Enhanced, local fallbacks where backend missing)
// ============================================================================
export const loyaltyAPI = {
  // Get customer loyalty points balance (local fallback)
  getBalance: async (customerId = null) => {
    try {
      // Try backend if customerId provided and endpoint exists
      if (customerId) {
        try {
          const response = await apiClient.get(`/customers/${customerId}/loyalty/`);
          return { success: true, ...response.data };
        } catch (err) {
          // Fallthrough to local fallback
          console.warn('[LOYALTY] Backend balance fetch failed, using fallback', err?.response?.data || err.message);
        }
      }

      // Local fallback
      return {
        success: true,
        balance: 0,
        points: 0,
        message: 'Using local fallback - backend endpoint not available'
      };
    } catch (error) {
      console.error('[LOYALTY] getBalance error:', error);
      return { success: false, error: error.message || 'Failed to fetch loyalty balance' };
    }
  },

  // Get customer loyalty history (local fallback)
  getHistory: async (customerId = null, limit = 50) => {
    try {
      if (customerId) {
        try {
          const response = await apiClient.get(`/customers/${customerId}/loyalty/history/`, { params: { limit } });
          return { success: true, ...response.data };
        } catch (err) {
          console.warn('[LOYALTY] Backend history fetch failed, using fallback', err?.response?.data || err.message);
        }
      }

      return {
        success: true,
        history: [],
        message: 'Using local fallback - backend endpoint not available'
      };
    } catch (error) {
      console.error('[LOYALTY] getHistory error:', error);
      return { success: false, error: error.message || 'Failed to fetch loyalty history' };
    }
  },

  // Validate points redemption
  validateRedemption: async (pointsToRedeem, subtotal, customerId) => {
    try {
      if (!customerId) {
        // cannot validate against backend without customer id; fallback
        return { success: false, error: 'Customer ID required for redemption validation' };
      }
      const response = await apiClient.get(`/customers/${customerId}/`);
      const available = response.data?.loyalty_points ?? 0;
      const valid = typeof pointsToRedeem === 'number' && pointsToRedeem > 0 && pointsToRedeem <= available;
      return { success: valid, available_points: available };
    } catch (error) {
      console.error('[LOYALTY] validateRedemption error:', error.response?.data || error.message);
      return { success: false, error: 'Failed to validate points redemption' };
    }
  },

  // Calculate loyalty points earned
  calculatePointsEarned: async (subtotalAfterDiscount) => {
    try {
      const subtotal = Number(subtotalAfterDiscount || 0);
      if (!Number.isFinite(subtotal) || subtotal <= 0) {
        return { success: true, data: { points_earned: 0 } };
      }
      const points = Math.floor(subtotal * 0.20); // 20% earn rate
      return { success: true, data: { points_earned: points } };
    } catch (error) {
      console.error('[LOYALTY] calculatePointsEarned error:', error);
      return { success: false, error: error.message || 'Failed to calculate points earned' };
    }
  },

  // Get current loyalty tier (local fallback)
  getCurrentTier: async (customerId = null) => {
    try {
      if (customerId) {
        try {
          const response = await apiClient.get(`/customers/${customerId}/loyalty/tier/`);
          return { success: true, ...response.data };
        } catch (err) {
          console.warn('[LOYALTY] Backend tier fetch failed, using fallback', err?.response?.data || err.message);
        }
      }

      return {
        success: true,
        tier: {
          name: 'Bronze',
          level: 1,
          min_points: 0,
          max_points: 999,
          benefits: ['Basic rewards']
        },
        message: 'Using local fallback - backend endpoint not available'
      };
    } catch (error) {
      console.error('[LOYALTY] getCurrentTier error:', error);
      return { success: false, error: error.message || 'Failed to fetch current tier' };
    }
  }
};

// ============================================================================
// STOCK VALIDATION API
// ============================================================================
export const stockAPI = {
  // Validate stock availability for order items
  validateStock: async (items) => {
    try {
      const checkout_data = (items || []).map((item) => ({
        product_id: item.product_id || item.id || item.productId,
        quantity: item.quantity || 1,
        price: item.price || item.unit_price || 0,
      }));
      const response = await apiClient.post('/pos/stock-validation/', { checkout_data });
      return response.data;
    } catch (error) {
      console.error('[STOCK] validateStock error:', error.response?.data || error.message);
      return { success: false, error: 'Failed to validate stock' };
    }
  },

  // Check individual product stock
  checkProductStock: async (productId, quantity = 1) => {
    try {
      const checkout_data = [{ product_id: productId, quantity, price: 0 }];
      const response = await apiClient.post('/pos/stock-validation/', { checkout_data });
      return response.data;
    } catch (error) {
      console.error('[STOCK] checkProductStock error:', error.response?.data || error.message);
      return { success: false, error: 'Failed to check product stock' };
    }
  }
};

// ============================================================================
// PROMOTIONS API
// ============================================================================
export const promotionsAPI = {
  // Get active promotions
  getActive: async () => {
    try {
      const response = await apiClient.get('/promotions/active/');
      return response.data;
    } catch (error) {
      console.error('[PROMO] getActive error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch promotions' };
    }
  },

  // Apply promotion to cart
  applyPromotion: async (promotionCode, cartItems) => {
    try {
      const response = await apiClient.post('/promotions/apply/', {
        promotion_code: promotionCode,
        cart_items: cartItems
      });
      return response.data;
    } catch (error) {
      console.error('[PROMO] applyPromotion error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to apply promotion' };
    }
  },

  // Validate promotion eligibility
  validatePromotion: async (promotionCode, cartItems) => {
    // No separate validate endpoint; reuse apply endpoint
    try {
      const response = await apiClient.post('/promotions/apply/', {
        promotion_code: promotionCode,
        cart_items: cartItems
      });
      return response.data;
    } catch (error) {
      console.error('[PROMO] validatePromotion error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to validate promotion' };
    }
  }
};

// ============================================================================
// NEWSLETTER API (Fallback)
// ============================================================================
export const newsletterAPI = {
  // eslint-disable-next-line no-unused-vars
  subscribe: async (email) => {
    try {
      console.warn('[NEWSLETTER] subscribe endpoint not implemented in backend');
      return { message: 'Newsletter subscription not available' };
    } catch (error) {
      console.error('[NEWSLETTER] subscribe error:', error);
      return { success: false, error: 'Failed to subscribe' };
    }
  }
};

// ============================================================================
// CONTACT API (Fallback)
// ============================================================================
export const contactAPI = {
  // eslint-disable-next-line no-unused-vars
  sendMessage: async (messageData) => {
    try {
      console.warn('[CONTACT] sendMessage endpoint not implemented in backend');
      return { message: 'Contact form not available' };
    } catch (error) {
      console.error('[CONTACT] sendMessage error:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }
};

// ============================================================================
// FINAL DEFAULT EXPORT
// ============================================================================
export default apiClient;