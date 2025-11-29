// useOnlineOrder Composable
// Provides comprehensive online order management with promotions, loyalty points, and stock validation
import { ref, computed, watch } from 'vue'
import { ordersAPI } from '@/services/api.js'
import { usePromotions } from './usePromotions.js'
import { useLoyalty } from './useLoyalty.js'
import { useProducts } from './useProducts.js'

/**
 * useOnlineOrder Composable
 * Manages online orders with promotions, loyalty points, stock validation, and order tracking
 * Used across multiple components: Cart, Checkout, OrderHistory, Profile, OrderTracking
 */
export function useOnlineOrder() {
  // ================================================================
  // REACTIVE STATE
  // ================================================================
  
  // Order data
  const orders = ref([])
  const currentOrder = ref(null)
  const orderHistory = ref([])
  const orderStatus = ref(null)
  const searchResults = ref([])
  
  // Cart data
  const cartItems = ref([])
  const cartTotal = ref(0)
  const cartSubtotal = ref(0)
  const cartTax = ref(0)
  const cartShipping = ref(0)
  const cartDiscount = ref(0)
  
  // Loading states
  const isLoading = ref(false)
  const isSearching = ref(false)
  const isCreating = ref(false)
  const isUpdating = ref(false)
  const isCancelling = ref(false)
  const isStockValidating = ref(false)
  
  // Error handling
  const error = ref(null)
  const searchError = ref(null)
  const creationError = ref(null)
  const updateError = ref(null)
  const cancellationError = ref(null)
  const stockError = ref(null)
  
  // Cache management
  const ordersCache = ref(new Map())
  const orderHistoryCache = ref(null)
  const lastFetchTime = ref(null)
  
  // Use other composables
  const {
    // Promotions
    promotions,
    activePromotions,
    appliedPromotions,
    validatePromotion,
    applyPromotion,
    removePromotion
  } = usePromotions()
  
  const {
    // Loyalty
    loyaltyBalance,
    loyaltyHistory,
    currentTier,
    calculatePointsEarned,
    calculatePointsDiscount,
    validatePointsRedemption,
    awardPoints
  } = useLoyalty()
  
  const {
    // Products
    products,
    checkStock,
    validateStock
  } = useProducts()
  
  // Helper to persist cart changes to localStorage
  const persistCartToStorage = () => {
    if (typeof window === 'undefined') return

    try {
      if (cartItems.value && cartItems.value.length > 0) {
        localStorage.setItem('ramyeon_cart', JSON.stringify(cartItems.value))
      } else {
        localStorage.removeItem('ramyeon_cart')
      }
    } catch (err) {
      console.error('❌ Failed to persist cart to localStorage:', err)
    }
  }

  watch(cartItems, () => {
    persistCartToStorage()
  }, { deep: true })

  // ================================================================
  // COMPUTED PROPERTIES
  // ================================================================
  
  // Cart item count
  const cartItemCount = computed(() => {
    return cartItems.value.reduce((total, item) => total + item.quantity, 0)
  })
  
  // Cart total with all adjustments
  const cartTotalWithAdjustments = computed(() => {
    return cartSubtotal.value + cartTax.value + cartShipping.value - cartDiscount.value
  })
  
  // Available promotions for cart
  const availablePromotions = computed(() => {
    return activePromotions.value.filter(promotion => {
      // Check if promotion is applicable to current cart
      return promotion.is_active && 
             promotion.start_date <= new Date() && 
             promotion.end_date >= new Date()
    })
  })
  
  // Maximum points that can be redeemed
  const maxRedeemablePoints = computed(() => {
    const maxPoints = Math.floor(cartSubtotal.value * 0.5) // Max 50% of subtotal
    return Math.min(maxPoints, loyaltyBalance.value)
  })
  
  // Points discount amount
  const pointsDiscountAmount = computed(() => {
    if (!appliedPromotions.value.length) return 0
    const pointsPromotion = appliedPromotions.value.find(p => p.type === 'loyalty_points')
    return pointsPromotion ? pointsPromotion.discount_amount : 0
  })
  
  // Order status summary
  const orderStatusSummary = computed(() => {
    if (!currentOrder.value) return null
    
    const status = currentOrder.value.status
    const statusMap = {
      'pending': { text: 'Pending', color: 'yellow', icon: '⏳' },
      'confirmed': { text: 'Confirmed', color: 'blue', icon: '✅' },
      'preparing': { text: 'Preparing', color: 'orange', icon: '👨‍🍳' },
      'ready': { text: 'Ready for Pickup', color: 'green', icon: '📦' },
      'completed': { text: 'Completed', color: 'green', icon: '🎉' },
      'cancelled': { text: 'Cancelled', color: 'red', icon: '❌' },
      'refunded': { text: 'Refunded', color: 'gray', icon: '💰' }
    }
    
    return statusMap[status] || { text: 'Unknown', color: 'gray', icon: '❓' }
  })
  
  // Recent orders (last 5)
  const recentOrders = computed(() => {
    return orders.value
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
  })
  
  // Pending orders
  const pendingOrders = computed(() => {
    return orders.value.filter(order => 
      ['pending', 'confirmed', 'preparing'].includes(order.status)
    )
  })
  
  // Completed orders
  const completedOrders = computed(() => {
    return orders.value.filter(order => 
      ['completed', 'cancelled', 'refunded'].includes(order.status)
    )
  })
  
  // ================================================================
  // CORE ORDER METHODS
  // ================================================================
  
  /**
   * Get all orders for user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options (status, date range, etc.)
   * @returns {Promise<Object>} Orders data
   */
  const getOrders = async (userId, filters = {}) => {
    try {
      isLoading.value = true
      error.value = null
      
      console.log('📦 Fetching orders for user:', userId)
      
      // Check cache first
      const cacheKey = `orders_${userId}_${JSON.stringify(filters)}`
      if (ordersCache.value.has(cacheKey)) {
        const cachedData = ordersCache.value.get(cacheKey)
        const cacheAge = Date.now() - cachedData.timestamp
        
        if (cacheAge < 300000) { // 5 minutes
          console.log('✅ Using cached orders data')
          orders.value = cachedData.data
          isLoading.value = false
          return { success: true, data: cachedData.data }
        }
      }
      
      // Fetch from API
      const result = await ordersAPI.getAll(userId, filters)
      
      if (result.success) {
        orders.value = result.data.results || result.data
        lastFetchTime.value = Date.now()
        
        // Cache the result
        ordersCache.value.set(cacheKey, {
          data: orders.value,
          timestamp: Date.now()
        })
        
        console.log(`✅ Fetched ${orders.value.length} orders`)
        return { success: true, data: orders.value }
      } else {
        throw new Error(result.error || 'Failed to fetch orders')
      }
    } catch (err) {
      console.error('❌ Error fetching orders:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Get single order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order data
   */
  const getOrder = async (orderId) => {
    try {
      isLoading.value = true
      error.value = null
      
      console.log('📦 Fetching order:', orderId)
      
      // Check cache first
      if (ordersCache.value.has(orderId)) {
        const cachedData = ordersCache.value.get(orderId)
        const cacheAge = Date.now() - cachedData.timestamp
        
        if (cacheAge < 300000) { // 5 minutes
          console.log('✅ Using cached order data')
          currentOrder.value = cachedData.data
          isLoading.value = false
          return { success: true, data: cachedData.data }
        }
      }
      
      // Fetch from API
      const result = await ordersAPI.getById(orderId)
      
      if (result.success) {
        currentOrder.value = result.data
        lastFetchTime.value = Date.now()
        
        // Cache the result
        ordersCache.value.set(orderId, {
          data: result.data,
          timestamp: Date.now()
        })
        
        console.log('✅ Order fetched successfully')
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Failed to fetch order')
      }
    } catch (err) {
      console.error('❌ Error fetching order:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Get order status
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order status data
   */
  const getOrderStatus = async (orderId) => {
    try {
      isLoading.value = true
      error.value = null
      
      console.log('📊 Fetching order status:', orderId)
      
      const result = await ordersAPI.getStatus(orderId)
      
      if (result.success) {
        orderStatus.value = result.data
        console.log(`✅ Order status: ${result.data.status}`)
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Failed to fetch order status')
      }
    } catch (err) {
      console.error('❌ Error fetching order status:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Search orders
   * @param {string} query - Search query
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Search results
   */
  const searchOrders = async (query, userId) => {
    try {
      isSearching.value = true
      searchError.value = null
      
      if (!query || query.trim().length < 2) {
        searchResults.value = []
        return { success: true, data: [] }
      }
      
      console.log('🔍 Searching orders:', query)
      
      const result = await ordersAPI.search(query, userId)
      
      if (result.success) {
        searchResults.value = result.data.results || result.data
        console.log(`✅ Found ${searchResults.value.length} orders`)
        return { success: true, data: searchResults.value }
      } else {
        throw new Error(result.error || 'Order search failed')
      }
    } catch (err) {
      console.error('❌ Order search error:', err)
      searchError.value = err.message
      return { success: false, error: err.message }
    } finally {
      isSearching.value = false
    }
  }
  
  // ================================================================
  // ORDER CREATION METHODS
  // ================================================================
  
  /**
   * Create new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Order creation result
   */
  const createOrder = async (orderData) => {
    try {
      isCreating.value = true
      creationError.value = null
      
      console.log('🛒 Creating new order:', orderData)
      
      // Validate stock before creating order (allow fallback to local validation)
      try {
        const stockValidation = await validateStock(orderData.items)
        if (!stockValidation.success) {
          console.warn('⚠️ Stock validation failed, but proceeding with order:', stockValidation.error)
          // Don't throw - allow order to proceed as stock validation has local fallback
        }
      } catch (stockError) {
        console.warn('⚠️ Stock validation error, but proceeding with order:', stockError.message)
        // Don't throw - allow order to proceed as stock validation has local fallback
      }
      
      // Apply promotions if any
      if (orderData.promotions && orderData.promotions.length > 0) {
        for (const promotionId of orderData.promotions) {
          const promotionResult = await applyPromotion(promotionId, orderData.items, orderData.user)
          if (!promotionResult.success) {
            console.warn('Failed to apply promotion:', promotionId)
          }
        }
      }
      
      // Calculate loyalty points earned (backend will calculate this, so we can skip or make it optional)
      if (orderData.user && orderData.total_amount) {
        try {
          // Use subtotal after discount for points calculation
          const subtotalAfterDiscount = (orderData.total_amount || 0) - (orderData.discount || 0)
          const pointsResult = await calculatePointsEarned(subtotalAfterDiscount)
          if (pointsResult && pointsResult.success) {
            orderData.points_earned = pointsResult.data?.points_earned || pointsResult.data?.points || 0
          } else {
            // Points calculation failed, but don't block order
            console.warn('⚠️ Points calculation failed, but proceeding with order:', pointsResult?.error)
            orderData.points_earned = 0
          }
        } catch (pointsError) {
          console.warn('⚠️ Points calculation error, but proceeding with order:', pointsError.message)
          // Don't block order creation if points calculation fails
          orderData.points_earned = 0
        }
      }
      
      // Create order via API
      const result = await ordersAPI.create(orderData)
      
      if (result.success) {
        // Add to orders list
        orders.value.unshift(result.data)
        currentOrder.value = result.data
        
        // Award loyalty points if earned
        if (orderData.points_earned > 0 && orderData.user) {
          await awardPoints(orderData.points_earned, orderData.user.id, {
            order_id: result.data.id,
            description: `Points earned from order #${result.data.order_number}`
          })
        }
        
        console.log('✅ Order created successfully')
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Order creation failed')
      }
    } catch (err) {
      console.error('❌ Order creation error:', err)
      creationError.value = err.message
      return { success: false, error: err.message }
    } finally {
      isCreating.value = false
    }
  }
  
  /**
   * Update order
   * @param {string} orderId - Order ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Update result
   */
  const updateOrder = async (orderId, updateData) => {
    try {
      isUpdating.value = true
      updateError.value = null
      
      console.log('📝 Updating order:', orderId)
      
      const result = await ordersAPI.update(orderId, updateData)
      
      if (result.success) {
        // Update local order
        const orderIndex = orders.value.findIndex(order => order.id === orderId)
        if (orderIndex > -1) {
          orders.value[orderIndex] = { ...orders.value[orderIndex], ...result.data }
        }
        
        if (currentOrder.value && currentOrder.value.id === orderId) {
          currentOrder.value = { ...currentOrder.value, ...result.data }
        }
        
        console.log('✅ Order updated successfully')
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Order update failed')
      }
    } catch (err) {
      console.error('❌ Order update error:', err)
      updateError.value = err.message
      return { success: false, error: err.message }
    } finally {
      isUpdating.value = false
    }
  }
  
  /**
   * Cancel order
   * @param {string} orderId - Order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation result
   */
  const cancelOrder = async (orderId, reason = '') => {
    try {
      isCancelling.value = true
      cancellationError.value = null
      
      console.log('❌ Cancelling order:', orderId)
      
      const result = await ordersAPI.cancel(orderId, reason)
      
      if (result.success) {
        // Update local order status
        const orderIndex = orders.value.findIndex(order => order.id === orderId)
        if (orderIndex > -1) {
          orders.value[orderIndex].status = 'cancelled'
          orders.value[orderIndex].cancellation_reason = reason
        }
        
        if (currentOrder.value && currentOrder.value.id === orderId) {
          currentOrder.value.status = 'cancelled'
          currentOrder.value.cancellation_reason = reason
        }
        
        console.log('✅ Order cancelled successfully')
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Order cancellation failed')
      }
    } catch (err) {
      console.error('❌ Order cancellation error:', err)
      cancellationError.value = err.message
      return { success: false, error: err.message }
    } finally {
      isCancelling.value = false
    }
  }
  
  // ================================================================
  // CART MANAGEMENT METHODS
  // ================================================================
  
  /**
   * Add item to cart
   * @param {Object} item - Item to add
   * @returns {Promise<Object>} Add result
   */
  const addToCart = async (item) => {
    try {
      console.log('🛒 Adding item to cart:', item)
      
      // Check stock availability
      const stockCheck = await checkStock(item.product_id, item.quantity)
      if (!stockCheck.success) {
        throw new Error('Insufficient stock: ' + stockCheck.error)
      }
      
      // Check if item already exists in cart
      const existingItemIndex = cartItems.value.findIndex(
        cartItem => cartItem.product_id === item.product_id
      )
      
      if (existingItemIndex > -1) {
        // Update quantity
        cartItems.value[existingItemIndex].quantity += item.quantity
      } else {
        // Add new item
        cartItems.value.push({
          ...item,
          added_at: new Date().toISOString()
        })
      }
      
      // Recalculate cart totals
      await calculateCartTotals()
      
      console.log('✅ Item added to cart')
      return { success: true, data: { item, cartItems: cartItems.value } }
    } catch (err) {
      console.error('❌ Add to cart error:', err)
      return { success: false, error: err.message }
    }
  }
  
  /**
   * Remove item from cart
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Remove result
   */
  const removeFromCart = async (productId) => {
    try {
      console.log('🗑️ Removing item from cart:', productId)
      
      const itemIndex = cartItems.value.findIndex(
        item => item.product_id === productId
      )
      
      if (itemIndex > -1) {
        cartItems.value.splice(itemIndex, 1)
        
        // Recalculate promotion discounts for all applied promotions
        if (appliedPromotions.value && appliedPromotions.value.length > 0) {
          console.log('🔄 Recalculating promotion discounts after item removal...')
          
          // Reset cart discount
          cartDiscount.value = 0
          
          // Recalculate discount for each applied promotion
          for (const promotion of appliedPromotions.value) {
            const newDiscount = calculatePromotionDiscount(promotion, cartItems.value)
            promotion.discount_amount = newDiscount
            cartDiscount.value += newDiscount
            
            console.log('🎯 Updated promotion discount:', {
              promotion: promotion.name,
              newDiscount: newDiscount
            })
          }
          
          // Remove promotions that no longer apply (discount = 0)
          appliedPromotions.value = appliedPromotions.value.filter(p => p.discount_amount > 0)
        }
        
        // Recalculate cart totals
        await calculateCartTotals()
        
        console.log('✅ Item removed from cart with promotion recalculation')
        return { success: true, data: { cartItems: cartItems.value } }
      } else {
        throw new Error('Item not found in cart')
      }
    } catch (err) {
      console.error('❌ Remove from cart error:', err)
      return { success: false, error: err.message }
    }
  }
  
  /**
   * Update cart item quantity
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Update result
   */
  const updateCartItemQuantity = async (productId, quantity) => {
    try {
      console.log('📝 Updating cart item quantity:', productId, quantity)
      
      if (quantity <= 0) {
        return await removeFromCart(productId)
      }
      
      // Check stock availability
      const stockCheck = await checkStock(productId, quantity)
      if (!stockCheck.success) {
        throw new Error('Insufficient stock: ' + stockCheck.error)
      }
      
      const itemIndex = cartItems.value.findIndex(
        item => item.product_id === productId
      )
      
      if (itemIndex > -1) {
        cartItems.value[itemIndex].quantity = quantity
        
        // Recalculate promotion discounts for all applied promotions
        if (appliedPromotions.value && appliedPromotions.value.length > 0) {
          console.log('🔄 Recalculating promotion discounts after quantity change...')
          
          // Reset cart discount
          cartDiscount.value = 0
          
          // Recalculate discount for each applied promotion
          for (const promotion of appliedPromotions.value) {
            const newDiscount = calculatePromotionDiscount(promotion, cartItems.value)
            promotion.discount_amount = newDiscount
            cartDiscount.value += newDiscount
            
            console.log('🎯 Updated promotion discount:', {
              promotion: promotion.name,
              oldDiscount: promotion.discount_amount,
              newDiscount: newDiscount
            })
          }
        }
        
        // Recalculate cart totals
        await calculateCartTotals()
        
        console.log('✅ Cart item quantity updated with promotion recalculation')
        return { success: true, data: { cartItems: cartItems.value } }
      } else {
        throw new Error('Item not found in cart')
      }
    } catch (err) {
      console.error('❌ Update cart item error:', err)
      return { success: false, error: err.message }
    }
  }
  
  /**
   * Clear cart
   */
  const clearCart = () => {
    cartItems.value = []
    cartTotal.value = 0
    cartSubtotal.value = 0
    cartTax.value = 0
    cartShipping.value = 0
    cartDiscount.value = 0
    
    // Clear applied promotions
    appliedPromotions.value = []
    
    // Clear localStorage
    localStorage.removeItem('ramyeon_cart')
    
    console.log('🗑️ Cart cleared (including localStorage)')
  }
  
  /**
   * Calculate cart totals
   */
  const calculateCartTotals = async () => {
    try {
      // Calculate subtotal
      cartSubtotal.value = cartItems.value.reduce((total, item) => {
        return total + (item.price * item.quantity)
      }, 0)
      
      // Calculate tax (assuming 10% tax rate)
      cartTax.value = cartSubtotal.value * 0.1
      
      // Calculate shipping (free over $50, otherwise $5)
      // Calculate shipping (fixed ₱50.00 delivery fee)
      cartShipping.value = 50.00
      
      // Calculate total
      cartTotal.value = cartSubtotal.value + cartTax.value + cartShipping.value - cartDiscount.value
      
      console.log('💰 Cart totals calculated:', {
        subtotal: cartSubtotal.value,
        tax: cartTax.value,
        shipping: cartShipping.value,
        discount: cartDiscount.value,
        total: cartTotal.value
      })
    } catch (err) {
      console.error('❌ Calculate cart totals error:', err)
    }
  }

  /**
   * Restore cart data from localStorage on composable init
   */
  const loadCartFromStorage = async () => {
    if (typeof window === 'undefined') return

    try {
      const savedCart = localStorage.getItem('ramyeon_cart')
      if (!savedCart) {
        cartItems.value = []
        return
      }

      const parsedCart = JSON.parse(savedCart)
      if (Array.isArray(parsedCart)) {
        cartItems.value = parsedCart
        await calculateCartTotals()
        console.log('🛒 Cart restored from localStorage:', parsedCart.length, 'items')
      } else {
        console.warn('⚠️ Invalid cart data found in localStorage, clearing')
        localStorage.removeItem('ramyeon_cart')
        cartItems.value = []
      }
    } catch (err) {
      console.error('❌ Failed to restore cart from localStorage:', err)
      localStorage.removeItem('ramyeon_cart')
      cartItems.value = []
    }
  }
  
  // ================================================================
  // PROMOTION METHODS
  // ================================================================
  
  /**
   * Calculate promotion discount locally
   * @param {Object} promotion - Promotion object
   * @param {Array} cartItems - Cart items
   * @returns {number} Discount amount
   */
  const calculatePromotionDiscount = (promotion, cartItems) => {
    try {
      console.log('🧮 Calculating promotion discount:', promotion.name)
      console.log('🧮 Cart items for discount calculation:', cartItems)
      
      // For drinks promotion (10% off)
      if (promotion.name && promotion.name.toLowerCase().includes('drink')) {
        // Find drinks in cart - check both category and name
        const drinksItems = cartItems.filter(item => {
          const itemName = (item.name || item.product_name || '').toLowerCase()
          const itemCategory = (item.category || '').toLowerCase()
          
          // Check if category is drinks
          if (itemCategory.includes('drink') || itemCategory.includes('beverage')) {
            return true
          }
          
          // Check name for drink-related keywords (expanded list)
          return itemName.includes('drink') || 
                 itemName.includes('7 up') || 
                 itemName.includes('bottle') || 
                 itemName.includes('can') ||
                 itemName.includes('juice') ||
                 itemName.includes('soda') ||
                 itemName.includes('water') ||
                 itemName.includes('alaska') ||  // Added Alaska
                 itemName.includes('coke') ||
                 itemName.includes('pepsi') ||
                 itemName.includes('sprite') ||
                 itemName.includes('mountain dew') ||
                 itemName.includes('gatorade') ||
                 itemName.includes('powerade') ||
                 itemName.includes('tea') ||
                 itemName.includes('coffee') ||
                 itemName.includes('milk')
        })
        
        console.log('🧮 Filtered drinks items:', drinksItems)
        
        if (drinksItems.length > 0) {
          // Calculate 10% discount on drinks
          const drinksSubtotal = drinksItems.reduce((total, item) => {
            const itemPrice = item.price || item.selling_price || 0
            const itemQty = item.quantity || 1
            const itemTotal = itemPrice * itemQty
            console.log(`🧮 Item: ${item.name}, Price: ${itemPrice}, Qty: ${itemQty}, Total: ${itemTotal}`)
            return total + itemTotal
          }, 0)
          
          const discount = drinksSubtotal * 0.1 // 10% discount
          console.log('🧮 Drinks subtotal:', drinksSubtotal)
          console.log('🧮 Drinks discount calculated:', discount)
          return Math.round(discount * 100) / 100 // Round to 2 decimal places
        }
      }
      
      // For other promotions, you can add more logic here
      console.log('🧮 No applicable discount found')
      return 0
    } catch (error) {
      console.error('❌ Error calculating promotion discount:', error)
      return 0
    }
  }
  
  /**
   * Apply promotion to cart
   * @param {string|Object} promotionCodeOrObject - Promotion code or promotion object
   * @returns {Promise<Object>} Application result
   */
  const applyPromotionToCart = async (promotionCodeOrObject) => {
    try {
      console.log('🎯 Applying promotion to cart:', promotionCodeOrObject)
      
      let promotionObject
      
      // Check if we have a promotion object or just a code
      console.log('🔍 Debug promotion object:', {
        hasObject: !!promotionCodeOrObject,
        hasId: !!promotionCodeOrObject?.id,
        hasName: !!promotionCodeOrObject?.name,
        id: promotionCodeOrObject?.id,
        name: promotionCodeOrObject?.name,
        type: typeof promotionCodeOrObject,
        allFields: Object.keys(promotionCodeOrObject || {}),
        fullObject: promotionCodeOrObject
      })
      
      // Check for different ID field names (id, _id, promotion_id)
      let promotionId = promotionCodeOrObject?.id || promotionCodeOrObject?._id || promotionCodeOrObject?.promotion_id
      
      if (promotionCodeOrObject && promotionId && promotionCodeOrObject.name) {
        // We have a promotion object, use it directly
        promotionObject = promotionCodeOrObject
        console.log('🎯 Using promotion object directly:', promotionObject.name, 'ID:', promotionId)
      } else {
        // We have a code, validate it first
        const validation = await validatePromotion(promotionCodeOrObject, {
          cartItems: cartItems.value,
          cartTotal: cartTotal.value
        })
        
        if (!validation.success) {
          throw new Error('Promotion validation failed: ' + validation.error)
        }
        
        promotionObject = validation.data.promotion
        promotionId = promotionObject.id || promotionObject._id || promotionObject.promotion_id
      }
      
      // Apply promotion locally (simulate discount)
      const discountAmount = calculatePromotionDiscount(promotionObject, cartItems.value)
      
      if (discountAmount > 0) {
        // Update cart discount
        cartDiscount.value += discountAmount
        
        // Add to applied promotions
        if (!appliedPromotions.value.find(p => (p.id || p._id || p.promotion_id) === promotionId)) {
          appliedPromotions.value.push({
            ...promotionObject,
            discount_amount: discountAmount,
            applied_at: new Date().toISOString()
          })
        }
        
        // Recalculate totals
        await calculateCartTotals()
        
        console.log('✅ Promotion applied to cart locally')
        return { 
          success: true, 
          data: { 
            promotion: promotionObject,
            discount_amount: discountAmount 
          } 
        }
      } else {
        throw new Error('No discount applicable')
      }
    } catch (err) {
      console.error('❌ Apply promotion error:', err)
      return { success: false, error: err.message }
    }
  }
  
  /**
   * Remove promotion from cart
   * @param {string} promotionId - Promotion ID
   * @returns {Promise<Object>} Removal result
   */
  const removePromotionFromCart = async (promotionId) => {
    try {
      console.log('🗑️ Removing promotion from cart:', promotionId)
      
      const result = await removePromotion(promotionId)
      
      if (result.success) {
        // Update cart discount
        const promotion = appliedPromotions.value.find(p => p.id === promotionId)
        if (promotion) {
          cartDiscount.value -= promotion.discount_amount
        }
        
        // Recalculate totals
        await calculateCartTotals()
        
        console.log('✅ Promotion removed from cart')
        return { success: true, data: result.data }
      } else {
        throw new Error('Promotion removal failed: ' + result.error)
      }
    } catch (err) {
      console.error('❌ Remove promotion error:', err)
      return { success: false, error: err.message }
    }
  }
  
  // ================================================================
  // LOYALTY POINTS METHODS
  // ================================================================
  
  /**
   * Apply loyalty points to cart
   * @param {number} points - Points to redeem
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Application result
   */
  const applyLoyaltyPoints = async (points, userId) => {
    try {
      console.log('💎 Applying loyalty points to cart:', points)
      
      // Validate points redemption
      const validation = await validatePointsRedemption(points, userId, {
        cartItems: cartItems.value,
        cartTotal: cartTotal.value
      })
      
      if (!validation.success) {
        throw new Error('Points validation failed: ' + validation.error)
      }
      
      // Calculate discount
      const discountResult = await calculatePointsDiscount(points, { id: userId }, currentTier.value)
      
      if (discountResult.success) {
        // Update cart discount
        cartDiscount.value += discountResult.data.discount_amount
        
        // Recalculate totals
        await calculateCartTotals()
        
        console.log('✅ Loyalty points applied to cart')
        return { success: true, data: discountResult.data }
      } else {
        throw new Error('Points discount calculation failed: ' + discountResult.error)
      }
    } catch (err) {
      console.error('❌ Apply loyalty points error:', err)
      return { success: false, error: err.message }
    }
  }
  
  /**
   * Remove loyalty points from cart
   */
  const removeLoyaltyPoints = () => {
    // Find loyalty points promotion
    const pointsPromotion = appliedPromotions.value.find(p => p.type === 'loyalty_points')
    
    if (pointsPromotion) {
      // Remove from applied promotions
      const index = appliedPromotions.value.findIndex(p => p.id === pointsPromotion.id)
      if (index > -1) {
        appliedPromotions.value.splice(index, 1)
      }
      
      // Update cart discount - safely handle undefined discount_amount
      const discountAmount = pointsPromotion.discount_amount || 0
      cartDiscount.value -= discountAmount
      
      // Recalculate totals
      calculateCartTotals()
      
      console.log('✅ Loyalty points removed from cart')
    } else {
      console.log('ℹ️ No loyalty points promotion to remove')
    }
  }
  
  // ================================================================
  // UTILITY METHODS
  // ================================================================
  
  /**
   * Clear all errors
   */
  const clearError = () => {
    error.value = null
    searchError.value = null
    creationError.value = null
    updateError.value = null
    cancellationError.value = null
    stockError.value = null
  }
  
  /**
   * Clear search results
   */
  const clearSearch = () => {
    searchResults.value = []
    searchError.value = null
  }
  
  /**
   * Refresh orders data
   */
  const refreshOrders = async (userId) => {
    console.log('🔄 Refreshing orders data')
    ordersCache.value.clear()
    orderHistoryCache.value = null
    lastFetchTime.value = null
    return await getOrders(userId)
  }
  
  /**
   * Clear all cache
   */
  const clearCache = () => {
    console.log('🗑️ Clearing orders cache')
    ordersCache.value.clear()
    orderHistoryCache.value = null
    lastFetchTime.value = null
  }
  
  /**
   * Get order by ID from current orders list
   * @param {string} orderId - Order ID
   * @returns {Object|null} Order object or null
   */
  const findOrderById = (orderId) => {
    return orders.value.find(order => order.id === orderId) || null
  }
  
  /**
   * Get orders by status
   * @param {string} status - Order status
   * @returns {Array} Orders with specified status
   */
  const getOrdersByStatus = (status) => {
    return orders.value.filter(order => order.status === status)
  }
  
  // ================================================================
  // RETURN COMPOSABLE
  // ================================================================
  
  // Initialize cart state from persisted storage on composable creation
  loadCartFromStorage().catch(err => {
    console.error('❌ Failed to load cart during initialization:', err)
  })

  return {
    // State
    orders,
    currentOrder,
    orderHistory,
    orderStatus,
    searchResults,
    cartItems,
    cartTotal,
    cartSubtotal,
    cartTax,
    cartShipping,
    cartDiscount,
    isLoading,
    isSearching,
    isCreating,
    isUpdating,
    isCancelling,
    isStockValidating,
    error,
    searchError,
    creationError,
    updateError,
    cancellationError,
    stockError,
    
    // Computed
    cartItemCount,
    cartTotalWithAdjustments,
    availablePromotions,
    maxRedeemablePoints,
    pointsDiscountAmount,
    orderStatusSummary,
    recentOrders,
    pendingOrders,
    completedOrders,
    
    // Core methods
    getOrders,
    getOrder,
    getOrderStatus,
    searchOrders,
    
    // Order management
    createOrder,
    updateOrder,
    cancelOrder,
    
    // Cart management
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    calculateCartTotals,
    
    // Promotion methods
    applyPromotionToCart,
    removePromotionFromCart,
    
    // Loyalty methods
    applyLoyaltyPoints,
    removeLoyaltyPoints,
    
    // Utility methods
    clearError,
    clearSearch,
    refreshOrders,
    clearCache,
    findOrderById,
    getOrdersByStatus,
    
    // Exposed composables
    promotions,
    activePromotions,
    appliedPromotions,
    loyaltyBalance,
    loyaltyHistory,
    currentTier,
    products
  }
}
