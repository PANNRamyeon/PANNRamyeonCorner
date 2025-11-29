import { ref, computed } from 'vue'
import { loyaltyAPI } from '@/services/apiLoyalty'

/**
 * Composable for managing loyalty points
 * Handles balance, history, tiers, earning, and redemption
 */
export function useLoyalty() {
  // ================================================================
  // REACTIVE STATE
  // ================================================================
  
  const loyaltyBalance = ref(0)
  const loyaltyHistory = ref([])
  const loyaltyTiers = ref([])
  const currentTier = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  
  // Cache for performance
  const loyaltyCache = ref(new Map())
  const historyCache = ref(null)
  const lastFetchTime = ref(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // ================================================================
  // COMPUTED PROPERTIES
  // ================================================================
  
  const hasLoyaltyPoints = computed(() => loyaltyBalance.value > 0)
  const canRedeemPoints = computed(() => loyaltyBalance.value >= 40) // Minimum 40 points
  const maxRedemptionAmount = computed(() => Math.min(loyaltyBalance.value / 4, 20)) // Max ₱20
  const pointsValue = computed(() => loyaltyBalance.value / 4) // 4 points = ₱1

  // ================================================================
  // CORE METHODS
  // ================================================================

  /**
   * Get customer loyalty points balance
   * Note: Balance comes from user profile, not separate API endpoint
   * @returns {Promise<Object>} Balance result
   */
  const getLoyaltyBalance = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      // Check if user is authenticated
      const token = localStorage.getItem('access_token')
      if (!token) {
        loyaltyBalance.value = 0
        return { success: true, data: { balance: 0 } }
      }
      
      // Loyalty points come from user profile, not a separate endpoint
      // The endpoints /customer/loyalty/* don't exist in the backend
      // Points are fetched via authAPI.getProfile() and stored in userProfile.loyalty_points
      console.log('💎 Loyalty balance from user profile (no separate API call needed)')
      
      // Return success without making API call
      // The actual balance will be set from userProfile.loyalty_points in Cart.vue
      return { success: true, data: { balance: loyaltyBalance.value } }
    } catch (err) {
      error.value = err.message
      loyaltyBalance.value = 0
      return { success: true, data: { balance: 0 } }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get customer loyalty points history
   * Note: History endpoint doesn't exist in backend
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} History result
   */
  // eslint-disable-next-line no-unused-vars
  const getLoyaltyHistory = async (filters = {}) => {
    try {
      isLoading.value = true
      error.value = null
      
      // Check if user is authenticated
      const token = localStorage.getItem('access_token')
      if (!token) {
        loyaltyHistory.value = []
        return { success: true, data: [] }
      }
      
      // Loyalty history endpoint doesn't exist in backend
      // Return empty history without making API call
      console.log('📜 Loyalty history not available (no backend endpoint)')
      loyaltyHistory.value = []
      return { success: true, data: [] }
    } catch (err) {
      error.value = err.message
      loyaltyHistory.value = []
      return { success: true, data: [] }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get loyalty tiers
   * @returns {Promise<Object>} Tiers result
   */
  const getLoyaltyTiers = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      console.log('👑 Fetching loyalty tiers')
      
      const result = await loyaltyAPI.getTiers()
      
      if (result.success) {
        loyaltyTiers.value = result.data?.tiers || result.tiers || []
        console.log(`✅ Fetched ${loyaltyTiers.value.length} loyalty tiers`)
        return { success: true, data: loyaltyTiers.value }
      } else {
        throw new Error(result.error || 'Failed to fetch loyalty tiers')
      }
    } catch (err) {
      console.error('❌ Error fetching loyalty tiers:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get current loyalty tier for customer
   * Note: Tier endpoint doesn't exist, using default Bronze tier
   * @returns {Promise<Object>} Current tier result
   */
  const getCurrentTier = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      // Check if user is authenticated
      const token = localStorage.getItem('access_token')
      if (!token) {
        currentTier.value = { name: 'Bronze', min_points: 0, max_points: 499, multiplier: 1.0 }
        return { success: true, data: currentTier.value }
      }
      
      // Loyalty tier endpoint doesn't exist in backend
      // Use default Bronze tier without making API call
      console.log('👑 Using default Bronze tier (no backend endpoint)')
      currentTier.value = { name: 'Bronze', min_points: 0, max_points: 499, multiplier: 1.0 }
      return { success: true, data: currentTier.value }
    } catch (err) {
      error.value = err.message
      currentTier.value = { name: 'Bronze', min_points: 0, max_points: 499, multiplier: 1.0 }
      return { success: true, data: currentTier.value }
    } finally {
      isLoading.value = false
    }
  }

  // ================================================================
  // POINTS CALCULATION METHODS
  // ================================================================

  /**
   * Calculate loyalty points earned from order
   * @param {number} subtotalAfterDiscount - Subtotal after discounts
   * @returns {Promise<Object>} Points calculation result
   */
  const calculatePointsEarned = async (subtotalAfterDiscount) => {
    try {
      console.log('🧮 Calculating loyalty points earned for subtotal:', subtotalAfterDiscount)
      
      // apiLoyalty.calculatePointsEarned returns a number directly, not an object
      const points = loyaltyAPI.calculatePointsEarned(subtotalAfterDiscount)
      
      if (typeof points === 'number' && points >= 0) {
        console.log(`✅ Points earned: ${points}`)
        return { success: true, data: { points_earned: points } }
      } else {
        throw new Error('Invalid points calculation result')
      }
    } catch (err) {
      console.error('❌ Error calculating points earned:', err)
      return { success: false, error: err.message || 'Failed to calculate points earned' }
    }
  }

  /**
   * Calculate discount from loyalty points
   * @param {number} pointsToRedeem - Points to redeem
   * @returns {Object} Discount calculation
   */
  const calculatePointsDiscount = (pointsToRedeem) => {
    try {
      // 4 points = ₱1 discount
      const discountAmount = pointsToRedeem / 4
      const maxDiscount = 20 // Maximum ₱20 discount
      const actualDiscount = Math.min(discountAmount, maxDiscount)
      
      return {
        points_used: pointsToRedeem,
        discount_amount: Math.round(actualDiscount * 100) / 100,
        max_discount: maxDiscount,
        points_remaining: loyaltyBalance.value - pointsToRedeem
      }
    } catch (err) {
      console.error('❌ Error calculating points discount:', err)
      return { points_used: 0, discount_amount: 0, max_discount: 20, points_remaining: loyaltyBalance.value }
    }
  }

  /**
   * Validate points redemption
   * @param {string} customerId - Customer ID
   * @param {number} pointsToRedeem - Points to redeem
   * @param {number} subtotal - Order subtotal
   * @returns {Promise<Object>} Validation result
   */
  const validatePointsRedemption = async (customerId, pointsToRedeem, subtotal) => {
    try {
      console.log('🔍 Validating points redemption:', { customerId, pointsToRedeem, subtotal })
      
      const result = await loyaltyAPI.validateRedemption(pointsToRedeem, subtotal, customerId)
      
      if (result.success) {
        console.log('✅ Points redemption validation successful')
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Points redemption validation failed')
      }
    } catch (err) {
      console.error('❌ Error validating points redemption:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Redeem loyalty points
   * @param {number} pointsToRedeem - Points to redeem
   * @param {string} customerId - Customer ID
   * @param {Object} options - Additional options (order_id, description)
   * @returns {Promise<Object>} Redemption result
   */
  const redeemPoints = async (pointsToRedeem, customerId, options = {}) => {
    try {
      console.log('💎 Redeeming loyalty points from DATABASE:', { pointsToRedeem, customerId, options })
      
      // Call backend API to redeem points (saves to MongoDB)
      const result = await loyaltyAPI.redeemPoints(pointsToRedeem, options.order_id)
      
      if (result.success) {
        // Update local balance from database response
        loyaltyBalance.value = result.data.new_balance
        
        console.log('✅ Points redeemed successfully in DATABASE, new balance:', loyaltyBalance.value)
        return { 
          success: true, 
          data: { 
            new_balance: result.data.new_balance,
            points_redeemed: result.data.points_redeemed 
          } 
        }
      } else {
        throw new Error(result.error || 'Failed to redeem points')
      }
    } catch (err) {
      console.error('❌ Error redeeming points from DATABASE:', err)
      // Fallback: Update locally only if backend fails
      console.warn('⚠️ Using local fallback for points redemption')
      loyaltyBalance.value = Math.max(0, loyaltyBalance.value - pointsToRedeem)
      return { 
        success: true, 
        data: { new_balance: loyaltyBalance.value },
        fallback: true 
      }
    }
  }

  /**
   * Award loyalty points
   * @param {number} pointsToAward - Points to award (or order amount)
   * @param {string} customerId - Customer ID
   * @param {Object} options - Additional options (order_id, description)
   * @returns {Promise<Object>} Award result
   */
  const awardPoints = async (pointsToAward, customerId, options = {}) => {
    try {
      console.log('🎁 Awarding loyalty points to DATABASE:', { orderAmount: pointsToAward, customerId, options })
      
      // Call backend API to award points (saves to MongoDB)
      // The backend expects order_amount and calculates points (20% rule)
      const result = await loyaltyAPI.awardPoints(pointsToAward, options.order_id)
      
      if (result.success) {
        // Update local balance with database response
        const actualPointsAwarded = result.award?.points_awarded || result.points_awarded
        loyaltyBalance.value = result.award?.total_points || result.total_points
        
        // Add to history
        const newTransaction = {
          id: Date.now().toString(),
          type: 'earned',
          points: actualPointsAwarded,
          reason: options.description || 'Order completion',
          timestamp: new Date().toISOString(),
          balance_after: loyaltyBalance.value
        }
        
        loyaltyHistory.value.unshift(newTransaction)
        
        console.log('✅ Points awarded successfully in DATABASE:', {
          pointsAwarded: actualPointsAwarded,
          newBalance: loyaltyBalance.value,
          orderAmount: pointsToAward
        })
        return { 
          success: true, 
          award: result.award || { 
            points_awarded: actualPointsAwarded, 
            total_points: loyaltyBalance.value 
          }, 
          data: { 
            new_balance: loyaltyBalance.value, 
            transaction: newTransaction 
          } 
        }
      } else {
        throw new Error(result.error || 'Failed to award points')
      }
    } catch (err) {
      console.error('❌ Error awarding points to DATABASE:', err)
      // Fallback: Update locally only if backend fails
      console.warn('⚠️ Using local fallback for points award')
      const pointsToAdd = Math.floor(pointsToAward * 0.20) // Calculate 20% locally
      loyaltyBalance.value += pointsToAdd
      
      const newTransaction = {
        id: Date.now().toString(),
        type: 'earned',
        points: pointsToAdd,
        reason: options.description || 'Order completion (local)',
        timestamp: new Date().toISOString(),
        balance_after: loyaltyBalance.value
      }
      
      loyaltyHistory.value.unshift(newTransaction)
      
      return { 
        success: true, 
        award: { points_awarded: pointsToAdd, total_points: loyaltyBalance.value },
        data: { new_balance: loyaltyBalance.value, transaction: newTransaction },
        fallback: true 
      }
    }
  }

  // ================================================================
  // UTILITY METHODS
  // ================================================================

  /**
   * Set loyalty balance from user profile
   * @param {number} points - Points from user profile
   */
  const setLoyaltyBalance = (points) => {
    loyaltyBalance.value = points || 0
    console.log('💎 Loyalty balance set from user profile:', loyaltyBalance.value)
  }

  /**
   * Clear all loyalty data
   */
  const clearLoyaltyData = () => {
    loyaltyBalance.value = 0
    loyaltyHistory.value = []
    loyaltyTiers.value = []
    currentTier.value = null
    error.value = null
    loyaltyCache.value.clear()
    historyCache.value = null
    lastFetchTime.value = 0
  }

  /**
   * Refresh loyalty data
   * Note: Customer ID is retrieved from JWT token, no need to pass it
   * @returns {Promise<Object>} Refresh result
   */
  const refreshLoyaltyData = async () => {
    clearLoyaltyData()
    const balanceResult = await getLoyaltyBalance()
    const historyResult = await getLoyaltyHistory()
    const tierResult = await getCurrentTier()
    
    return {
      success: balanceResult.success && historyResult.success && tierResult.success,
      data: {
        balance: balanceResult.data,
        history: historyResult.data,
        tier: tierResult.data
      }
    }
  }

  /**
   * Check if loyalty data is cached and valid
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
    loyaltyBalance,
    loyaltyHistory,
    loyaltyTiers,
    currentTier,
    isLoading,
    error,
    
    // Computed
    hasLoyaltyPoints,
    canRedeemPoints,
    maxRedemptionAmount,
    pointsValue,
    
    // Methods
    getLoyaltyBalance,
    getLoyaltyHistory,
    getLoyaltyTiers,
    getCurrentTier,
    calculatePointsEarned,
    calculatePointsDiscount,
    validatePointsRedemption,
    redeemPoints,
    awardPoints,
    setLoyaltyBalance,
    clearLoyaltyData,
    refreshLoyaltyData,
    isCacheValid
  }
}
