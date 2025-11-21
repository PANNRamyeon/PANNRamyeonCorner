import { ref, computed } from 'vue'
import { promotionsAPI } from '@/services/api'

/**
 * Composable for managing promotions
 * Handles fetching, validation, and application of promotions
 */
export function usePromotions() {
  // ================================================================
  // REACTIVE STATE
  // ================================================================
  
  const promotions = ref([])
  const activePromotions = ref([])
  const appliedPromotions = ref([]) // Track promotions applied to cart
  const isLoading = ref(false)
  const error = ref(null)
  const isValidating = ref(false)
  const validationError = ref(null)
  
  // Cache for performance
  const promotionsCache = ref(new Map())
  const lastFetchTime = ref(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // ================================================================
  // COMPUTED PROPERTIES
  // ================================================================
  
  const hasActivePromotions = computed(() => activePromotions.value.length > 0)
  const promotionCount = computed(() => promotions.value.length)
  const activePromotionCount = computed(() => activePromotions.value.length)

  // ================================================================
  // CORE METHODS
  // ================================================================

  /**
   * Fetch all promotions
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Result object
   */
  const getPromotions = async (filters = {}) => {
    try {
      isLoading.value = true
      error.value = null
      
      console.log('🎯 Fetching promotions with filters:', filters)
      
      const result = await promotionsAPI.getActive(filters)
      
      if (result.success) {
        promotions.value = result.promotions || result.data?.results || result.data || []
        lastFetchTime.value = Date.now()
        
        console.log(`✅ Fetched ${promotions.value.length} promotions`)
        return { success: true, data: promotions.value }
      } else {
        throw new Error(result.error || 'Failed to fetch promotions')
      }
    } catch (err) {
      console.error('❌ Error fetching promotions:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch active promotions
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Result object
   */
  const getActivePromotions = async (filters = {}) => {
    try {
      isLoading.value = true;
      error.value = null;

      console.log('🎯 Fetching active promotions');

      const result = await promotionsAPI.getActive(filters);

      if (result.success) {
        let fetchedPromotions = result.promotions || result.data?.results || result.data || [];

        // 🔥 ABSOLUTE SOURCE FILTER — REMOVE PWD & SENIOR HERE
        fetchedPromotions = fetchedPromotions.filter(promo =>
          promo.name !== 'PWD' &&
          promo.name !== 'Senior Citizen'
        );

        activePromotions.value = fetchedPromotions;
        promotions.value = fetchedPromotions; // keep in sync

        console.log(`✅ Filtered and loaded ${fetchedPromotions.length} active promotions`);

        return { success: true, data: fetchedPromotions };
      } else {
        throw new Error(result.error || 'Failed to fetch active promotions');
      }
    } catch (err) {
      console.error('❌ Error fetching active promotions:', err);
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      isLoading.value = false;
    }
  }   


  /**
   * Get promotion by ID or code
   * @param {string} id - Promotion ID or code
   * @returns {Object|null} Promotion object or null
   */
  const getPromotion = (id) => {
    return promotions.value.find(p => 
      p.id === id || 
      p._id === id || 
      p.promotion_id === id ||
      p.code === id ||
      p.name === id
    ) || null
  }

  /**
   * Search promotions
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Search results
   */
  const searchPromotions = async (query, filters = {}) => {
    try {
      isLoading.value = true
      error.value = null
      
      const searchFilters = { ...filters, search: query }
      return await getPromotions(searchFilters)
    } catch (err) {
      console.error('❌ Error searching promotions:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Validate promotion code (local validation)
   * @param {string} code - Promotion code
   * @returns {Promise<Object>} Validation result
   */
  const validatePromotion = async (code) => {
    try {
      isValidating.value = true
      validationError.value = null
      
      console.log('🔍 Validating promotion code locally:', code)
      
      // Find promotion in active promotions
      const promotion = activePromotions.value.find(p => 
        p.code === code || 
        p.name === code || 
        p.promotion_name === code
      )
      
      if (!promotion) {
        throw new Error('Promotion not found or not active')
      }
      
      // Check if promotion is active
      if (promotion.status !== 'active') {
        throw new Error('Promotion is not active')
      }
      
      // Check date validity
      const now = new Date()
      const startDate = new Date(promotion.start_date)
      const endDate = new Date(promotion.end_date)
      
      if (now < startDate) {
        throw new Error('Promotion has not started yet')
      }
      
      if (now > endDate) {
        throw new Error('Promotion has expired')
      }
      
      console.log('✅ Promotion validation successful (local)')
      return { 
        success: true, 
        data: { 
          promotion: promotion,
          valid: true,
          message: 'Promotion is valid'
        } 
      }
    } catch (err) {
      console.error('❌ Promotion validation error:', err)
      validationError.value = err.message
      return { success: false, error: err.message }
    } finally {
      isValidating.value = false
    }
  }

  /**
   * Check if promotion is applicable to cart
   * @param {Object} promotion - Promotion object
   * @param {Array} cartItems - Cart items
   * @returns {Object} Applicability result
   */
  const checkPromotionApplicability = (promotion, cartItems = []) => {
    try {
      // Basic checks
      if (!promotion || !cartItems.length) {
        return { applicable: false, reason: 'No promotion or empty cart' }
      }

      // Check minimum order amount
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      if (promotion.minimum_order && subtotal < promotion.minimum_order) {
        return { 
          applicable: false, 
          reason: `Minimum order of ₱${promotion.minimum_order} required` 
        }
      }

      // Check category restrictions
      if (promotion.applicable_categories && promotion.applicable_categories.length > 0) {
        const hasApplicableCategory = cartItems.some(item => 
          promotion.applicable_categories.includes(item.category_id) ||
          promotion.applicable_categories.includes(item.category)
        )
        
        if (!hasApplicableCategory) {
          return { 
            applicable: false, 
            reason: 'Promotion not applicable to cart items' 
          }
        }
      }

      return { applicable: true, reason: 'Promotion is applicable' }
    } catch (err) {
      console.error('❌ Error checking promotion applicability:', err)
      return { applicable: false, reason: 'Error checking applicability' }
    }
  }

  /**
   * Apply promotion to cart
   * @param {Object} promotion - Promotion object
   * @param {Array} cartItems - Cart items
   * @param {Object} context - Additional context
   * @returns {Object} Application result
   */
  const applyPromotion = async (promotion, cartItems = [], context = {}) => {
    try {
      if (!promotion) {
        console.warn('applyPromotion called with undefined promotion');
        return { success: false, error: 'Promotion not found' };
      }
      console.log('🎯 Applying promotion:', promotion.name)
      
      // Validate promotion first
      const validation = await validatePromotion(promotion.code || promotion.name)
      if (!validation.success) {
        throw new Error(validation.error)
      }

      // Check applicability
      const applicability = checkPromotionApplicability(promotion, cartItems, context)
      if (!applicability.applicable) {
        throw new Error(applicability.reason)
      }

      // Calculate discount
      const discount = calculatePromotionDiscount(promotion, cartItems, context)
      
      return {
        success: true,
        data: {
          promotion: promotion,
          discount: discount,
          message: 'Promotion applied successfully'
        }
      }
    } catch (err) {
      console.error('❌ Error applying promotion:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Remove promotion from cart
   * @param {string} promotionId - Promotion ID
   * @returns {Object} Removal result
   */
  const removePromotion = (promotionId) => {
    try {
      console.log('🗑️ Removing promotion:', promotionId)
      
      // Find and remove promotion
      const index = activePromotions.value.findIndex(p => 
        p.id === promotionId || 
        p._id === promotionId || 
        p.promotion_id === promotionId
      )
      
      if (index > -1) {
        activePromotions.value.splice(index, 1)
        console.log('✅ Promotion removed successfully')
        return { success: true, message: 'Promotion removed' }
      } else {
        throw new Error('Promotion not found')
      }
    } catch (err) {
      console.error('❌ Error removing promotion:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Calculate promotion discount
   * @param {Object} promotion - Promotion object
   * @param {Array} cartItems - Cart items
   * @returns {Object} Discount calculation
   */
  const calculatePromotionDiscount = (promotion, cartItems = []) => {
    try {
      if (!promotion || !cartItems.length) {
        return { amount: 0, percentage: 0, type: 'none' }
      }

      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      let discountAmount = 0
      let discountType = 'none'

      if (promotion.discount_type === 'percentage') {
        discountAmount = (subtotal * promotion.discount_value) / 100
        discountType = 'percentage'
      } else if (promotion.discount_type === 'fixed') {
        discountAmount = Math.min(promotion.discount_value, subtotal)
        discountType = 'fixed'
      }

      // Apply maximum discount limit if specified
      if (promotion.max_discount && discountAmount > promotion.max_discount) {
        discountAmount = promotion.max_discount
      }

      return {
        amount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
        percentage: promotion.discount_type === 'percentage' ? promotion.discount_value : 0,
        type: discountType,
        original_subtotal: subtotal,
        discounted_subtotal: subtotal - discountAmount
      }
    } catch (err) {
      console.error('❌ Error calculating promotion discount:', err)
      return { amount: 0, percentage: 0, type: 'none' }
    }
  }

  // ================================================================
  // UTILITY METHODS
  // ================================================================

  /**
   * Clear all promotions data
   */
  const clearPromotions = () => {
    promotions.value = []
    activePromotions.value = []
    appliedPromotions.value = []
    error.value = null
    validationError.value = null
    promotionsCache.value.clear()
    lastFetchTime.value = 0
  }

  /**
   * Refresh promotions data
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Refresh result
   */
  const refreshPromotions = async (filters = {}) => {
    clearPromotions()
    return await getActivePromotions(filters)
  }

  /**
   * Check if promotions are cached and valid
   * @returns {boolean} Cache validity
   */
  const isCacheValid = () => {
    return Date.now() - lastFetchTime.value < CACHE_DURATION
  }

  // ================================================================
  // RETURN COMPOSABLE INTERFACE
  // ================================================================

  return {
    // State
    promotions,
    activePromotions,
    appliedPromotions, // Export applied promotions for tracking
    isLoading,
    error,
    isValidating,
    validationError,
    
    // Computed
    hasActivePromotions,
    promotionCount,
    activePromotionCount,
    
    // Methods
    getPromotions,
    getActivePromotions,
    getPromotion,
    searchPromotions,
    validatePromotion,
    checkPromotionApplicability,
    applyPromotion,
    removePromotion,
    calculatePromotionDiscount,
    clearPromotions,
    refreshPromotions,
    isCacheValid
  }
}
