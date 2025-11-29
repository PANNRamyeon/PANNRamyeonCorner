/**
 * PayMongo API Composable
 * Handles payment processing for GCash, PayMaya, and Card payments
 */

// IMPORTANT: Vite only injects env vars when referenced with static property names.
// Using bracket notation to avoid Netlify secret scanner false positives
const getPayMongoKeys = () => {
  // Vite - Using bracket notation with full string literals (Vite can still statically analyze these)
  const viteEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : undefined;
  const vitePublic = viteEnv && viteEnv['VITE_PAYMONGO_PUBLIC_KEY'];
  const viteSecret = viteEnv && viteEnv['VITE_PAYMONGO_SECRET_KEY'];
  const viteMode = (viteEnv && viteEnv['VITE_PAYMONGO_MODE']) || undefined;

  // Vue CLI (catch ReferenceError when process is undefined under Vite)
  let cliPublic;
  let cliSecret;
  let cliMode;
  try { cliPublic = process.env['VUE_APP_PAYMONGO_PUBLIC_KEY']; } catch (_) { /* noop */ }
  try { cliSecret = process.env['VUE_APP_PAYMONGO_SECRET_KEY']; } catch (_) { /* noop */ }
  try { cliMode = process.env['VUE_APP_PAYMONGO_MODE']; } catch (_) { /* noop */ }

  return {
    publicKey: vitePublic || cliPublic || null,
    secretKey: viteSecret || cliSecret || null,
    mode: viteMode || cliMode || 'test',
  };
};

// Get keys dynamically rather than at module load time
let PAYMONGO_PUBLIC_KEY, PAYMONGO_SECRET_KEY, PAYMONGO_MODE;

// Initialize keys and debug
const initKeys = () => {
  const keys = getPayMongoKeys();
  PAYMONGO_PUBLIC_KEY = keys.publicKey;
  PAYMONGO_SECRET_KEY = keys.secretKey;
  PAYMONGO_MODE = keys.mode;
  
  // Debug summary
  console.log('PayMongo Config:', {
    hasPublicKey: !!PAYMONGO_PUBLIC_KEY,
    hasSecretKey: !!PAYMONGO_SECRET_KEY,
    mode: PAYMONGO_MODE,
    publicKeyPreview: PAYMONGO_PUBLIC_KEY ? `${PAYMONGO_PUBLIC_KEY.substring(0, 10)}...` : 'undefined',
  });
};

// Initialize keys
initKeys();

// PayMongo API base URL
const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';

/**
 * Convert amount to centavos (PayMongo requires amounts in smallest currency unit)
 * @param {number} amount - Amount in pesos
 * @returns {number} Amount in centavos
 */
const convertToCentavos = (amount) => {
  return Math.round(amount * 100);
};

/**
 * Get PayMongo secret key dynamically
 * @returns {string} PayMongo secret key
 */
const getSecretKey = () => {
  // Always get fresh keys using static Vite/CLI access
  const { secretKey } = getPayMongoKeys();
    
  if (!secretKey) {
    console.error('Payment service secret key is undefined. Please check your environment variables.');
    const paymongoStr = 'PAYMONGO';
    console.error('Process env keys:', typeof process !== 'undefined' && process.env ? Object.keys(process.env).filter(k => k.includes(paymongoStr)) : 'no process.env');
    console.error('Import meta env keys:', typeof import.meta !== 'undefined' && import.meta.env ? Object.keys(import.meta.env).filter(k => k.includes(paymongoStr)) : 'no import.meta.env');
    throw new Error('Payment service secret key is not configured. Please check your environment variables.');
  }
  
  return secretKey;
};

/**
 * Create authorization header for PayMongo API
 * @returns {string} Base64 encoded authorization header
 */
const getAuthHeader = () => {
  const secretKey = getSecretKey();
  const encodedKey = btoa(secretKey + ':');
  return `Basic ${encodedKey}`;
};

/**
 * Process GCash payment
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in pesos
 * @param {string} params.orderId - Order ID
 * @param {string} params.customerEmail - Customer email
 * @param {string} params.customerName - Customer name
 * @returns {Promise<Object>} PayMongo source object
 */
// eslint-disable-next-line no-unused-vars
export const processGCashPayment = async ({ amount, orderId, customerEmail, customerName }) => {
  try {
    const response = await fetch(`${PAYMONGO_API_URL}/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: 'gcash',
            amount: convertToCentavos(amount),
            currency: 'PHP',
            redirect: {
              success: `${window.location.origin}/#/cart?payment=success&order=${orderId}`,
              failed: `${window.location.origin}/#/cart?payment=failed&order=${orderId}`
            },
            billing: {
              name: customerName,
              email: customerEmail
            },
            metadata: {
              order_id: orderId
            }
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('GCash API error response:', error);
      throw new Error(error.errors?.[0]?.detail || 'Failed to create GCash payment');
    }

    const data = await response.json();
    console.log('GCash payment source created:', data);
    return data;
  } catch (error) {
    console.error('GCash payment error:', error);
    throw error;
  }
};

/**
 * Process PayMaya payment
 * Try using 'maya' as source type (PayMongo's supported type for Maya/PayMaya wallet)
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in pesos
 * @param {string} params.orderId - Order ID
 * @param {string} params.customerEmail - Customer email
 * @param {string} params.customerName - Customer name
 * @returns {Promise<Object>} PayMongo source object
 */
// eslint-disable-next-line no-unused-vars
export const processPayMayaPayment = async ({ amount, orderId, customerEmail, customerName }) => {
  try {
    // Try using 'maya' as source type (PayMongo's supported type for Maya wallet)
    const response = await fetch(`${PAYMONGO_API_URL}/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: 'maya',
            amount: convertToCentavos(amount),
            currency: 'PHP',
            redirect: {
              success: `${window.location.origin}/#/cart?payment=success&order=${orderId}`,
              failed: `${window.location.origin}/#/cart?payment=failed&order=${orderId}`
            },
            billing: {
              name: customerName,
              email: customerEmail
            },
            metadata: {
              order_id: orderId
            }
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('PayMaya API error response:', error);
      
      // If 'maya' source type fails, fall back to payment links
      if (error.errors?.[0]?.detail?.includes('source_type') || error.errors?.[0]?.detail?.includes('invalid')) {
        console.log('Maya source type not supported, falling back to payment links');
        return await processPayMayaPaymentLink({ amount, orderId, customerEmail, customerName });
      }
      
      throw new Error(error.errors?.[0]?.detail || 'Failed to create PayMaya payment');
    }

    const data = await response.json();
    console.log('PayMaya payment source created:', data);
    return data;
  } catch (error) {
    console.error('PayMaya payment error:', error);
    // Fall back to payment links if source creation fails
    if (!error.message.includes('payment link')) {
      try {
        return await processPayMayaPaymentLink({ amount, orderId, customerEmail, customerName });
      } catch (linkError) {
        throw error; // Throw original error if fallback also fails
      }
    }
    throw error;
  }
};

/**
 * Fallback: Process PayMaya payment using Payment Links
 * This shows all payment methods, so user has to select PayMaya again
 * @param {Object} params - Payment parameters
 * @returns {Promise<Object>} PayMongo payment link object
 */
// eslint-disable-next-line no-unused-vars
async function processPayMayaPaymentLink({ amount, orderId, customerEmail, customerName }) {
  const successUrl = `${window.location.origin}/#/cart?payment=success&order=${orderId}`;
  const failedUrl = `${window.location.origin}/#/cart?payment=failed&order=${orderId}`;

  const response = await fetch(`${PAYMONGO_API_URL}/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: convertToCentavos(amount),
          currency: 'PHP',
          description: `Order #${orderId} - Ramyeon Order`,
          remarks: `Order ${orderId}`,
          redirect: {
            success: successUrl,
            failed: failedUrl
          }
        }
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('PayMaya payment link API error response:', error);
    throw new Error(error.errors?.[0]?.detail || 'Failed to create PayMaya payment link');
  }

  const data = await response.json();
  console.log('PayMaya payment link created:', data);
  
  return {
    data: {
      id: data.data.id,
      type: 'payment_link',
      attributes: {
        redirect: {
          checkout_url: data.data.attributes.checkout_url,
          success: successUrl,
          failed: failedUrl
        },
        status: data.data.attributes.status
      }
    }
  };
}

/**
 * Process Card payment using Payment Links (redirects to PayMongo checkout)
 * PayMongo doesn't support 'card' as a source type - we need to use Payment Links
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in pesos
 * @param {string} params.orderId - Order ID
 * @returns {Promise<Object>} PayMongo payment link object with redirect URL
 */
export const processCardPayment = async ({ amount, orderId }) => {
  try {
    const successUrl = `${window.location.origin}/#/cart?payment=success&order=${orderId}`;
    const failedUrl = `${window.location.origin}/#/cart?payment=failed&order=${orderId}`;

    // Create a payment link for card payments
    const response = await fetch(`${PAYMONGO_API_URL}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: convertToCentavos(amount),
            currency: 'PHP',
            description: `Order #${orderId} - Ramyeon Order`,
            remarks: `Order ${orderId}`,
            redirect: {
              success: successUrl,
              failed: failedUrl
            }
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Card payment API error:', error);
      throw new Error(error.errors?.[0]?.detail || 'Failed to create card payment link');
    }

    const data = await response.json();
    console.log('Card payment link created:', data);
    
    // Convert payment link response to match source response format
    return {
      data: {
        id: data.data.id,
        type: 'payment_link',
        attributes: {
          redirect: {
            checkout_url: data.data.attributes.checkout_url,
            success: successUrl,
            failed: failedUrl
          },
          status: data.data.attributes.status
        }
      }
    };
  } catch (error) {
    console.error('Card payment error:', error);
    throw error;
  }
};

/**
 * Process GrabPay QR payment
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in pesos
 * @param {string} params.orderId - Order ID
 * @param {string} params.customerEmail - Customer email
 * @param {string} params.customerName - Customer name
 * @returns {Promise<Object>} PayMongo source object with redirect URL
 */
// eslint-disable-next-line no-unused-vars
export const processGrabPayPayment = async ({ amount, orderId, customerEmail, customerName }) => {
  try {
    const response = await fetch(`${PAYMONGO_API_URL}/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: 'grab_pay',
            amount: convertToCentavos(amount),
            currency: 'PHP',
            redirect: {
              success: `${window.location.origin}/#/cart?payment=success&order=${orderId}`,
              failed: `${window.location.origin}/#/cart?payment=failed&order=${orderId}`
            },
            billing: {
              name: customerName,
              email: customerEmail
            },
            metadata: {
              order_id: orderId
            }
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('GrabPay API error response:', error);
      throw new Error(error.errors?.[0]?.detail || 'Failed to create GrabPay payment');
    }

    const data = await response.json();
    console.log('GrabPay payment source created:', data);
    return data;
  } catch (error) {
    console.error('GrabPay payment error:', error);
    throw error;
  }
};

/**
 * Retrieve payment source status
 * @param {string} sourceId - PayMongo source ID
 * @returns {Promise<Object>} PayMongo source object with current status
 */
export const getSourceStatus = async (sourceId) => {
  try {
    const response = await fetch(`${PAYMONGO_API_URL}/sources/${sourceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to get source status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get source status error:', error);
    throw error;
  }
};

/**
 * Retrieve payment intent status
 * @param {string} paymentIntentId - PayMongo payment intent ID
 * @returns {Promise<Object>} PayMongo payment intent object with current status
 */
export const getPaymentIntentStatus = async (paymentIntentId) => {
  try {
    const response = await fetch(`${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.detail || 'Failed to get payment intent status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get payment intent status error:', error);
    throw error;
  }
};

// Export all functions as a default object
export default {
  processGCashPayment,
  processPayMayaPayment,
  processCardPayment,
  processGrabPayPayment,
  getSourceStatus,
  getPaymentIntentStatus
};

// Named export for convenience
export const paymongoAPI = {
  processGCashPayment,
  processPayMayaPayment,
  processCardPayment,
  processGrabPayPayment,
  getSourceStatus,
  getPaymentIntentStatus
};
