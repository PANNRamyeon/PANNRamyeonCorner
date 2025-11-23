<template>
  <div class="cart-page">
    <div class="cart-container">
      <!-- Cart Header -->
      <div class="cart-header">
        <h1>Your Cart</h1>
        <p v-if="cartItems.length === 0">Your cart is empty</p>
        <p v-else>{{ cartItems.length }} item{{ cartItems.length > 1 ? 's' : '' }} in your cart</p>
      </div>

      <div class="cart-content" v-if="cartItems.length > 0">
        <!-- Cart Items -->
        <div class="cart-items">
          <div class="cart-item" v-for="item in cartItems" :key="item.id">
            <img :src="item.image" :alt="item.name" class="item-image" />
            <div class="item-details">
              <h3>{{ item.name }}</h3>
              <p class="item-description">{{ item.description }}</p>
              <div class="item-price-section">
                <div class="item-price" :class="{ 'has-discount': getItemDiscount(item) > 0 }">
                  <span v-if="getItemDiscount(item) > 0" class="original-price">₱{{ item.price }}</span>
                  <span class="current-price">₱{{ getItemDiscountedPrice(item).toFixed(2) }}</span>
                </div>
                <div v-if="getItemDiscount(item) > 0" class="item-discount-info">
                  <span class="discount-badge">{{ getItemDiscountText(item) }}</span>
                  <span class="savings">You save ₱{{ (getItemDiscount(item) * item.quantity).toFixed(2) }}</span>
                </div>
              </div>
            </div>
            <div class="item-controls">
              <button class="quantity-btn" @click="decreaseQuantity(item.id)">-</button>
              <span class="quantity">{{ item.quantity }}</span>
              <button class="quantity-btn" @click="increaseQuantity(item.id)">+</button>
            </div>
            <div class="item-total">
              <div v-if="getItemDiscount(item) > 0" class="total-with-discount">
                <span class="original-total">₱{{ (item.price * item.quantity).toFixed(2) }}</span>
                <span class="discounted-total">₱{{ (getItemDiscountedPrice(item) * item.quantity).toFixed(2) }}</span>
              </div>
              <div v-else class="regular-total">₱{{ (item.price * item.quantity).toFixed(2) }}</div>
            </div>
            <button class="remove-btn" @click="removeItem(item.id)">×</button>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="order-summary">
          <h2>Order Summary</h2>
          <div class="summary-row">
            <span>Subtotal</span>
            <span>₱{{ subtotal.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>Delivery Fee</span>
            <span>₱{{ deliveryFee.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>Service Fee</span>
            <span>₱{{ serviceFee.toFixed(2) }}</span>
          </div>
          
          <!-- Loyalty Points Section -->
          <div class="loyalty-points-section" v-if="userProfile">
            <div class="points-header">
              <div class="points-info">
                <span class="points-icon">⭐</span>
                <span class="points-label">Your Points:</span>
                <span class="points-balance">{{ userProfile.loyalty_points || 0 }}</span>
                <span class="points-value">(₱{{ ((userProfile.loyalty_points || 0) / 4).toFixed(2) }} value)</span>
              </div>
            </div>
            
            <div class="points-redemption">
              <label class="points-checkbox">
                <input 
                  type="checkbox" 
                  v-model="useLoyaltyPoints"
                  @change="onPointsToggle"
                />
                <span class="checkbox-text">Use loyalty points</span>
              </label>
              
              <div v-if="useLoyaltyPoints && (userProfile.loyalty_points || 0) >= 40" class="points-input-group">
                <div class="points-input-wrapper">
                  <input 
                    type="text"
                    v-model="pointsToRedeem"
                    placeholder="Enter points (40-80)"
                    class="points-input"
                    @input="handlePointsInput"
                    @keyup.enter="validatePointsInput"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    ref="pointsInput"
                  />
                  <div class="quick-select-points">
                    <button type="button" @click="setPoints(40)" class="quick-btn">40</button>
                    <button type="button" @click="setPoints(60)" class="quick-btn">60</button>
                    <button type="button" @click="setPoints(80)" class="quick-btn">80</button>
                  </div>
                </div>
                <span class="points-discount">= ₱{{ pointsDiscount.toFixed(2) }} off</span>
                <div class="points-rates">
                  <small>40 pts = ₱10 | 80 pts = ₱20 (max per order)</small>
                </div>
              </div>
              <div v-else-if="useLoyaltyPoints && (userProfile.loyalty_points || 0) < 40" class="points-insufficient">
                <span class="insufficient-message">⚠️ You need at least 40 points to redeem (₱10 minimum)</span>
              </div>
            </div>
          </div>

          <!-- Promotion Code Input -->
          <div class="promo-code-section">
            <div class="promo-input-group">
              <input 
                type="text" 
                v-model="promoCode" 
                placeholder="Enter promo code"
                class="promo-input"
                :disabled="appliedPromotion"
                @keyup.enter="applyPromoCode"
              />
              <button 
                v-if="!appliedPromotion"
                class="apply-promo-btn" 
                @click="applyPromoCode"
                :disabled="!promoCode || applyingPromo"
              >
                <span v-if="!applyingPromo">Apply</span>
                <span v-else class="loading-spinner-small"></span>
              </button>
              <button 
                v-else
                class="remove-promo-btn" 
                @click="removePromoCode"
              >
                Remove
              </button>
            </div>
            
            <!-- Promo Error Message -->
            <div v-if="promoError" class="promo-error">
              <span class="error-icon">⚠️</span>
              {{ promoError }}
            </div>
          </div>
          
          <!-- Points Discount Row (if points used) -->
          <div v-if="pointsDiscount > 0" class="summary-row points-discount-row">
            <span>Points Discount</span>
            <span class="discount-amount">-₱{{ pointsDiscount.toFixed(2) }}</span>
          </div>
          
          <!-- ✅ UPDATED: Voucher/Promotion Display (if applied) -->
          <div v-if="appliedPromotion" class="applied-voucher-summary">
            <div class="voucher-info-row">
              <div class="voucher-details">
                <span class="voucher-icon">🎁</span>
                <div>
                  <div class="voucher-name">{{ appliedPromotion.name }}</div>
                  <div class="voucher-description">{{ getPromotionDescription(appliedPromotion) }}</div>
                </div>
              </div>
            </div>
            <div class="summary-row discount-row">
              <span>Voucher Discount</span>
              <span class="discount-amount">-₱{{ promotionDiscount.toFixed(2) }}</span>
            </div>
          </div>
          
          <div class="summary-row total">
            <span>Total</span>
            <span>₱{{ finalTotal.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Rest of template (Delivery Options, Payment Methods, etc.) remains the same -->
        <!-- Delivery Options -->
        <div class="delivery-options">
          <h2>Delivery Options</h2>
          <div class="option-group">
            <label class="option-label">
              <input type="radio" v-model="deliveryType" value="delivery" />
              <div class="option-content">
                <div class="option-icon">🚚</div>
                <div class="option-text">
                  <h3>Delivery</h3>
                  <p>Get it delivered to your doorstep</p>
                  <span class="option-time">30-45 mins</span>
                </div>
              </div>
            </label>
            <label class="option-label">
              <input type="radio" v-model="deliveryType" value="pickup" />
              <div class="option-content">
                <div class="option-icon">🏪</div>
                <div class="option-text">
                  <h3>Pickup</h3>
                  <p>Pick up from our store</p>
                  <span class="option-time">15-20 mins</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Delivery Address (only show if delivery is selected) -->
        <div class="delivery-address" v-if="deliveryType === 'delivery'">
          <h2>Delivery Address</h2>
          <div class="address-input">
            <input 
              type="text" 
              v-model="deliveryAddress" 
              placeholder="Enter your delivery address"
              class="address-field"
            />
            <button class="map-btn" @click="openMap">📍 Use Map</button>
          </div>
          
          <!-- Google Map -->
          <div class="map-container" v-if="showMap">
            <p class="map-instructions">📍 Click anywhere on the map to set your delivery location</p>
            <div id="google-map" class="google-map"></div>
            <button class="close-map-btn" @click="closeMap">Close Map</button>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="payment-methods">
          <h2>Payment Method</h2>
          <div class="payment-options">
            <label class="payment-option">
              <input type="radio" v-model="paymentMethod" value="cash" />
              <div class="payment-content">
                <div class="payment-icon">💵</div>
                <span>Cash on Delivery</span>
              </div>
            </label>
            <label class="payment-option">
              <input type="radio" v-model="paymentMethod" value="gcash" />
              <div class="payment-content">
                <div class="payment-icon">📱</div>
                <span>GCash</span>
              </div>
            </label>
            <label class="payment-option">
              <input type="radio" v-model="paymentMethod" value="card" />
              <div class="payment-content">
                <div class="payment-icon">💳</div>
                <span>Credit/Debit Card</span>
              </div>
            </label>
            <label class="payment-option">
              <input type="radio" v-model="paymentMethod" value="paymaya" />
              <div class="payment-content">
                <div class="payment-icon">🏦</div>
                <span>PayMaya</span>
              </div>
            </label>
            <label class="payment-option">
              <input type="radio" v-model="paymentMethod" value="grabpay" />
              <div class="payment-content">
                <div class="payment-icon">🎯</div>
                <span>GrabPay QR</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Special Instructions -->
        <div class="special-instructions">
          <h2>Special Instructions</h2>
          <textarea 
            v-model="specialInstructions" 
            placeholder="Any special requests or instructions for your order..."
            class="instructions-field"
          ></textarea>
        </div>

        <!-- Checkout Button -->
        <div class="checkout-section">
          <button class="checkout-btn" @click="proceedToCheckout" :disabled="!canCheckout">
            <span v-if="isProcessing" class="loading-spinner"></span>
            {{ isProcessing ? 'Processing...' : `Place Order - ₱${finalTotal.toFixed(2)}` }}
          </button>
        </div>
      </div>

      <!-- Empty Cart State -->
      <div class="empty-cart" v-else>
        <div class="empty-cart-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add some delicious ramyeon to get started!</p>
        <button class="browse-menu-btn" @click="$emit('setCurrentPage', 'Menu')">
          Browse Menu
        </button>
      </div>
    </div>

    <!-- Order Confirmation Modal -->
    <teleport to="body">
      <transition name="modal-fade">
        <div v-if="showOrderConfirmation" class="confirmation-modal-overlay" @click="closeConfirmationModal">
          <div class="confirmation-modal" @click.stop>
            <div class="confirmation-success-icon">
              <div class="checkmark-circle">
                <div class="checkmark"></div>
              </div>
            </div>
            
            <h2 class="confirmation-title">Order Placed Successfully! 🎉</h2>
          
            <div class="confirmation-details">
              <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value order-id">{{ confirmedOrder.id }}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value total-amount">₱{{ confirmedOrder.total }}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">{{ confirmedOrder.paymentMethod?.toUpperCase() }}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Delivery Type:</span>
                <span class="detail-value">{{ confirmedOrder.deliveryType === 'delivery' ? 'Delivery 🚚' : 'Pickup 🏪' }}</span>
              </div>
              
              <div class="detail-row estimated-time">
                <span class="detail-label">Estimated Time:</span>
                <span class="detail-value">{{ confirmedOrder.deliveryType === 'delivery' ? '30-45' : '15-20' }} minutes</span>
              </div>
              
              <!-- Loyalty Points Info -->
              <div v-if="confirmedOrder.pointsEarned > 0 || confirmedOrder.pointsUsed > 0" class="loyalty-points-summary">
                <div v-if="confirmedOrder.pointsUsed > 0" class="detail-row">
                  <span class="detail-label">Points Used:</span>
                  <span class="detail-value points-used">-{{ confirmedOrder.pointsUsed }} points</span>
                </div>
                <div v-if="confirmedOrder.pointsEarned > 0" class="detail-row">
                  <span class="detail-label">Points Earned:</span>
                  <span class="detail-value points-earned">+{{ confirmedOrder.pointsEarned }} points</span>
                </div>
              </div>
            </div>
          
            <div class="confirmation-message">
              <p>✅ Your order has been sent to our kitchen!</p>
              <p>📱 You'll receive updates on your order status.</p>
              <p v-if="confirmedOrder.pointsEarned > 0">⭐ You earned {{ confirmedOrder.pointsEarned }} loyalty points!</p>
            </div>
          
            <button class="confirmation-btn" @click="goToHome">
              Back to Home
            </button>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script>
import { paymongoAPI } from '../composables/usePaymongo.js';
import { authAPI } from '../services/api.js';
import { useOnlineOrder } from '../composables/api/useOnlineOrder.js';
import { useProducts } from '../composables/api/useProducts.js';
import { usePromotions } from '../composables/api/usePromotions.js';
import { useLoyalty } from '../composables/api/useLoyalty.js';

// Toggle verbose cart logging
const CART_DEBUG = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DEBUG_CART === 'true') ||
  (typeof process !== 'undefined' && process.env && process.env.VUE_APP_DEBUG_CART === 'true')
);

export default {
  name: 'Cart',
  emits: ['setCurrentPage', 'cartCleared'],
  setup() {
    const onlineOrder = useOnlineOrder();
    const products = useProducts();
    const promotions = usePromotions();
    const loyalty = useLoyalty();
    
    return {
      ...onlineOrder,
      ...products,
      ...promotions,
      ...loyalty
    };
  },
  data() {
    return {
      deliveryType: 'delivery',
      deliveryAddress: '',
      paymentMethod: 'cash',
      specialInstructions: '',
      showMap: false,
      isProcessing: false,
      map: null,
      marker: null,
      showCardForm: false,
      cardDetails: {
        number: '',
        exp_month: '',
        exp_year: '',
        cvc: '',
        name: ''
      },
      userProfile: null,
      showOrderConfirmation: false,
      confirmedOrder: {},
      promoCode: '',
      appliedPromotion: null,
      promotionDiscount: 0,
      applyingPromo: false,
      promoError: null,
      useLoyaltyPoints: false,
      pointsToRedeem: '',
      pointsDiscount: 0,
      maxPointsToRedeem: 80,
      pointsApplied: false
    }
  },
  computed: {
    // ✅ ADDED: Expose cartStore from composable
    cartStore() {
      // If you're using Pinia cartStore, import and return it
      // For now, checking if it exists in the component context
      return this.$store?.state?.cart || null;
    },
    
    subtotal() {
      return this.cartItems.reduce((total, item) => {
        const discountedPrice = this.getItemDiscountedPrice(item);
        return total + (discountedPrice * item.quantity);
      }, 0);
    },
    deliveryFee() {
      return this.cartShipping;
    },
    serviceFee() {
      return this.cartTax;
    },
    total() {
      return this.cartTotal;
    },
    finalTotal() {
      const baseTotal = this.cartTotalWithAdjustments;
      const totalDiscount = (this.pointsDiscount || 0) + (this.promotionDiscount || 0);
      return Math.max(0, baseTotal - totalDiscount);
    },
    canCheckout() {
      const hasItems = this.cartItems.length > 0;
      const hasPayment = this.paymentMethod !== '';
      const hasAddress = this.deliveryType === 'pickup' || (this.deliveryType === 'delivery' && this.deliveryAddress.trim() !== '');
      return hasItems && hasPayment && hasAddress && !this.isProcessing;
    }
  },
  methods: {
    async increaseQuantity(itemId) {
      const item = this.cartItems.find(item => item.id === itemId);
      if (item) {
        await this.updateCartItemQuantity(item.product_id || item.id, item.quantity + 1);
        await this.recalculateExistingPromotions();
      }
    },
    async decreaseQuantity(itemId) {
      const item = this.cartItems.find(item => item.id === itemId);
      if (item && item.quantity > 1) {
        await this.updateCartItemQuantity(item.product_id || item.id, item.quantity - 1);
        await this.recalculateExistingPromotions();
      }
    },
    async removeItem(itemId) {
      const item = this.cartItems.find(item => item.id === itemId);
      if (item) {
        await this.removeFromCart(item.product_id || item.id);
        await this.recalculateExistingPromotions();
      }
    },
    
    // Loyalty Points Methods
    async onPointsToggle() {
      console.log('🎯 Points toggle changed:', this.useLoyaltyPoints);
      
      if (this.useLoyaltyPoints) {
        const userPoints = this.userProfile?.loyalty_points || this.loyaltyBalance || 0;
        
        console.log('💎 User loyalty points:', userPoints);
        console.log('📊 Subtotal:', this.subtotal);
        
        const maxDiscount = Math.min(20, this.subtotal * 0.20);
        const maxPointsFromDiscount = Math.floor(maxDiscount * 4);
        
        console.log('📊 Max discount allowed:', maxDiscount);
        console.log('📊 Max points from discount:', maxPointsFromDiscount);
        
        this.maxPointsToRedeem = Math.min(
          userPoints,
          maxPointsFromDiscount,
          80
        );
        
        console.log('✅ Final max points to redeem:', this.maxPointsToRedeem);
        
        this.pointsToRedeem = '';
        this.pointsDiscount = 0;
        
        console.log('✅ Loyalty points enabled, ready for input');
      } else {
        this.pointsToRedeem = '';
        this.pointsDiscount = 0;
        this.maxPointsToRedeem = 0;
        this.pointsApplied = false;
        this.removeLoyaltyPoints();
        console.log('❌ Loyalty points disabled');
      }
    },
    
    handlePointsInput(event) {
      const value = event.target.value.replace(/[^0-9]/g, '');
      this.pointsToRedeem = value;
      
      console.log('⌨️ User typing:', value);
      
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue >= 40) {
        console.log('✅ Valid value, updating discount');
        this.pointsApplied = true;
        this.updatePointsDiscount();
      } else if (value === '' || numValue === 0) {
        this.pointsDiscount = 0;
        this.pointsApplied = false;
        console.log('🔄 Cleared discount');
      }
    },
    
    setPoints(amount) {
      this.pointsToRedeem = parseInt(amount);
      console.log('🔘 Set points to:', this.pointsToRedeem);
      this.validatePointsInput();
    },
    
    validatePointsInput() {
      console.log('🔍 Step 1 - Validating points input:', this.pointsToRedeem, 'type:', typeof this.pointsToRedeem);
      
      if (this.pointsToRedeem === '' || this.pointsToRedeem === null || this.pointsToRedeem === undefined) {
        if (!this.pointsApplied || this.pointsDiscount === 0) {
          this.pointsDiscount = 0;
          console.log('❌ Empty value, clearing discount');
        } else {
          console.log('⚠️ Empty value but points applied - preserving discount');
        }
        return;
      }
      
      let points = parseInt(this.pointsToRedeem);
      console.log('🔍 Step 2 - Parsed points:', points, 'isNaN:', isNaN(points));
      
      if (isNaN(points)) {
        this.pointsToRedeem = '';
        this.pointsDiscount = 0;
        console.log('❌ Invalid number, clearing');
        return;
      }
      
      if (points < 0) {
        points = Math.abs(points);
        console.log('🔍 Step 3 - Made positive:', points);
      }
      
      if (points === 0) {
        this.pointsToRedeem = '';
        this.pointsDiscount = 0;
        console.log('❌ Zero points, clearing');
        return;
      }
      
      console.log('🔍 Step 4 - Before min/max check:', points);
      
      if (points < 40) {
        points = 40;
        console.log('🔍 Step 5 - Adjusted to minimum:', points);
      }
      
      if (points > this.maxPointsToRedeem) {
        console.log('⚠️ Step 6 - Points exceed maximum!', {
          requested: points,
          maximum: this.maxPointsToRedeem,
          userPoints: this.userProfile?.loyalty_points,
          loyaltyBalance: this.loyaltyBalance
        });
        points = this.maxPointsToRedeem;
        console.log('🔍 Step 6 - Adjusted to maximum:', points);
      } else {
        console.log('✅ Step 6 - Points within maximum:', points, '(max:', this.maxPointsToRedeem, ')');
      }
      
      console.log('🔍 Step 7 - Final points value before assignment:', points);
      
      this.pointsToRedeem = points;
      this.pointsApplied = true;
      
      console.log('✅ Step 8 - Validated and set points to:', this.pointsToRedeem, 'type:', typeof this.pointsToRedeem);
      
      this.updatePointsDiscount();
    },
    
    async updatePointsDiscount() {
      console.log('💎 updatePointsDiscount called:', {
        useLoyaltyPoints: this.useLoyaltyPoints,
        pointsToRedeem: this.pointsToRedeem,
        pointsApplied: this.pointsApplied,
        type: typeof this.pointsToRedeem
      });
      
      if (this.pointsApplied && this.pointsDiscount > 0 && (!this.pointsToRedeem || this.pointsToRedeem === '')) {
        console.log('⚠️ Points were applied but field is empty - preserving discount');
        return;
      }
      
      const points = parseInt(this.pointsToRedeem) || 0;
      
      if (!this.useLoyaltyPoints || points === 0) {
        this.pointsDiscount = 0;
        this.pointsApplied = false;
        return;
      }
      
      try {
        const result = this.calculatePointsDiscount(points);
        
        console.log('💎 Discount calculation result:', result);
        
        if (result && result.discount_amount !== undefined) {
          this.pointsDiscount = result.discount_amount;
          
          const userPoints = this.userProfile?.loyalty_points || this.loyaltyBalance || 0;
          const maxDiscount = Math.min(20, this.subtotal * 0.20);
          this.maxPointsToRedeem = Math.min(
            userPoints,
            Math.floor(maxDiscount * 4),
            80
          );
          
          if (points > this.maxPointsToRedeem) {
            this.pointsToRedeem = this.maxPointsToRedeem;
          }
          
          console.log('✅ Points discount updated:', {
            pointsToRedeem: this.pointsToRedeem,
            pointsDiscount: this.pointsDiscount,
            maxPointsToRedeem: this.maxPointsToRedeem,
            subtotal: this.subtotal
          });
        }
      } catch (error) {
        console.error('❌ Points calculation error:', error);
        this.pointsDiscount = 0;
      }
    },
    
    async applyPromoCode() {
      if (!this.promoCode || this.promoCode.trim() === '') {
        return;
      }
      
      this.applyingPromo = true;
      this.promoError = null;
      
      try {
        if (CART_DEBUG) console.log('🎁 Applying promo code:', this.promoCode);
        
        const result = await this.applyPromotionToCart(this.promoCode.trim());
        
        if (result.success) {
          this.appliedPromotion = result.data.promotion;
          this.promotionDiscount = result.data.discount_amount;
          this.promoError = null;
          if (CART_DEBUG) console.log('✅ Promotion applied! Discount:', this.promotionDiscount);
          
          this.showSuccessNotification(`Promo code applied! You saved ₱${this.promotionDiscount.toFixed(2)}`);
        } else {
          this.promoError = result.error || 'Invalid promo code. Please check and try again.';
          console.warn('⚠️ Promotion not found or not applicable');
        }
      } catch (error) {
        console.error('❌ Error applying promo code:', error);
        this.promoError = error.message || 'Failed to apply promo code. Please try again.';
      } finally {
        this.applyingPromo = false;
      }
    },
    
    async removePromoCode() {
      if (CART_DEBUG) console.log('🗑️ Removing promo code');
      
      if (this.appliedPromotion) {
        await this.removePromotionFromCart(this.appliedPromotion.id);
      }
      
      this.appliedPromotion = null;
      this.promotionDiscount = 0;
      this.promoCode = '';
      this.promoError = null;
      
      this.showSuccessNotification('Promo code removed');
    },

    // ✅ UPDATED: Automatic promotion application with voucher priority
    getItemDiscountForPromotion(item, promotion) {
      if (!promotion) return 0;
      if (!this.isItemEligibleForPromotion(item, promotion)) return 0;

      const originalPrice = parseFloat(item.price);
      const quantity = parseInt(item.quantity) || 1;
      let discountAmount = 0;

      if (promotion.type === 'percentage') {
        discountAmount = (originalPrice * (promotion.discount_value / 100)) * quantity;
      } else if (promotion.type === 'fixed_amount') {
        discountAmount = Math.min(promotion.discount_value, originalPrice) * quantity;
      }

      return Math.max(0, discountAmount);
    },

    computePromotionDiscount(promotion) {
      if (!promotion || !Array.isArray(this.cartItems) || this.cartItems.length === 0) {
        return 0;
      }
      let total = 0;
      for (const item of this.cartItems) {
        total += this.getItemDiscountForPromotion(item, promotion);
      }
      return Math.max(0, total);
    },

    // ✅ CRITICAL FIX: Priority system for voucher application
    async autoApplyBestPromotion() {
      try {
        // 🔥 1. PRIORITY: If user selected a voucher → use it and STOP
        if (this.cartStore?.selectedVoucher) {
          const voucher = this.cartStore.selectedVoucher;

          console.log('✅ User-selected voucher detected:', {
            name: voucher.name,
            type: voucher.type,
            value: voucher.discount_value
          });

          // Set voucher as the applied promotion
          this.appliedPromotion = voucher;

          // Compute discount from voucher
          this.promotionDiscount = this.computePromotionDiscount(voucher);

          console.log('✅ Voucher applied:', {
            name: voucher.name,
            discount: this.promotionDiscount
          });

          return; // ⛔ STOP — do NOT compute automatic promotions
        }

        // 🔥 2. If a manual promo code was applied, DO NOT override it
        if (this.appliedPromotion) {
          console.log('✅ Manual promo code already applied, skipping auto-apply');
          return;
        }

        // No active promotions? Exit.
        if (!this.activePromotions || this.activePromotions.length === 0) {
          console.log('⚠️ No active promotions available');
          return;
        }
        if (!this.cartItems || this.cartItems.length === 0) {
          console.log('⚠️ Cart is empty');
          return;
        }

        // 🔥 3. FILTER OUT PWD & SENIOR PROMOS
        const filteredPromotions = this.activePromotions.filter(promo =>
          promo.name !== 'PWD' &&
          promo.name !== 'Senior Citizen'
        );

        let bestPromotion = null;
        let bestDiscount = 0;

        // 🔥 4. Compute the best promotion from the filtered list
        for (const promo of filteredPromotions) {
          if (promo.status !== 'active') continue;

          const discount = this.computePromotionDiscount(promo);

          if (discount > bestDiscount) {
            bestDiscount = discount;
            bestPromotion = promo;
          }
        }

        // 🔥 5. Apply the best promotion if it exists
        if (bestPromotion && bestDiscount > 0) {
          this.appliedPromotion = bestPromotion;
          this.promotionDiscount = bestDiscount;
          console.log('✅ Auto-applied best promotion:', {
            name: bestPromotion.name,
            discount: bestDiscount
          });
        } else {
          this.appliedPromotion = null;
          this.promotionDiscount = 0;
          console.log('⚠️ No applicable promotions found');
        }

      } catch (e) {
        console.error('Auto-apply promotion error:', e);
      }
    },
    
    async recalculateExistingPromotions() {
      try {
        if (!this.appliedPromotion || !this.cartItems.length) return;

        // Block PWD & SENIOR if they somehow exist
        if (this.appliedPromotion.name === 'PWD' ||
            this.appliedPromotion.name === 'Senior Citizen') 
        {
          this.appliedPromotion = null;
          this.promotionDiscount = 0;
          return;
        }

        const newDiscount = this.computePromotionDiscount(this.appliedPromotion);

        this.promotionDiscount = newDiscount;

        if (newDiscount === 0) {
          this.appliedPromotion = null;
          this.promotionDiscount = 0;
        }
      } catch (error) {
        console.error('Error recalculating promotions:', error);
      }
    },
    
    getPromotionDescription(promotion) {
      if (!promotion) return '';
      
      if (promotion.type === 'percentage') {
        return `${promotion.discount_value}% off on eligible items`;
      } else if (promotion.type === 'fixed_amount') {
        return `₱${promotion.discount_value} off on your order`;
      } else if (promotion.type === 'buy_x_get_y') {
        const config = promotion.discount_config || {};
        return `Buy ${config.buy_quantity || 2} get ${config.get_quantity || 1} free`;
      }
      
      return promotion.description || 'Discount applied';
    },
    
    // Per-item discount calculation methods
    getItemDiscount(item) {
      if (CART_DEBUG) console.log('🔍 Checking discount for item:', item.name, 'Price:', item.price);
      if (CART_DEBUG) console.log('🎁 Available promotions:', this.activePromotions?.length || 0);
      
      const applicablePromotion = this.getApplicablePromotionForItem(item);
      if (CART_DEBUG) console.log('✅ Applicable promotion for', item.name, ':', applicablePromotion);
      
      if (!applicablePromotion) {
        if (CART_DEBUG) console.log('❌ No applicable promotion for', item.name);
        return 0;
      }
      
      const originalPrice = parseFloat(item.price);
      let discountAmount = 0;
      
      if (applicablePromotion.type === 'percentage') {
        discountAmount = originalPrice * (applicablePromotion.discount_value / 100);
        if (CART_DEBUG) console.log('📊 Percentage discount:', applicablePromotion.discount_value + '%', 'Amount:', discountAmount);
      } else if (applicablePromotion.type === 'fixed_amount') {
        discountAmount = Math.min(applicablePromotion.discount_value, originalPrice);
        if (CART_DEBUG) console.log('💰 Fixed amount discount:', applicablePromotion.discount_value, 'Amount:', discountAmount);
      }
      
      const finalDiscount = Math.max(0, discountAmount);
      if (CART_DEBUG) console.log('🎯 Final discount for', item.name, ':', finalDiscount);
      return finalDiscount;
    },
    
    getItemDiscountedPrice(item) {
      const originalPrice = parseFloat(item.price);
      const discount = this.getItemDiscount(item);
      return Math.max(0, originalPrice - discount);
    },
    
    getItemDiscountText(item) {
      const applicablePromotion = this.getApplicablePromotionForItem(item);
      if (!applicablePromotion) return '';
      
      if (applicablePromotion.type === 'percentage') {
        return `${applicablePromotion.discount_value}% OFF`;
      } else if (applicablePromotion.type === 'fixed_amount') {
        return `₱${applicablePromotion.discount_value} OFF`;
      }
      
      return 'DISCOUNT';
    },
    
    getApplicablePromotionForItem(item) {
      if (!this.activePromotions || this.activePromotions.length === 0) return null;

      const filteredPromotions = this.activePromotions.filter(promo =>
        promo.name !== 'PWD' &&
        promo.name !== 'Senior Citizen'
      );

      for (const promotion of filteredPromotions) {
        if (this.isItemEligibleForPromotion(item, promotion)) {
          return promotion;
        }
      }

      return null;
    },
    
    isItemEligibleForPromotion(item, promotion) {
      if (CART_DEBUG) console.log('🔍 Checking eligibility for', item.name, 'with promotion', promotion.name);
      
      if (promotion.status !== 'active') {
        if (CART_DEBUG) console.log('❌ Promotion not active:', promotion.status);
        return false;
      }
      
      const now = new Date();
      const startDate = new Date(promotion.start_date);
      const endDate = new Date(promotion.end_date);
      
      if (CART_DEBUG) console.log('📅 Date check - Now:', now, 'Start:', startDate, 'End:', endDate);
      
      if (now < startDate || now > endDate) {
        if (CART_DEBUG) console.log('❌ Promotion outside date range');
        return false;
      }
      
      if (CART_DEBUG) console.log('🎯 Target type:', promotion.target_type, 'Target IDs:', promotion.target_ids);
      
      const targetType = (promotion.target_type || '').toLowerCase();
      if (targetType === 'all') {
        if (CART_DEBUG) console.log('✅ Promotion applies to all items');
        return true;
      } else if (targetType === 'category' || targetType === 'categories') {
        const isCategoryMatch = promotion.target_ids && promotion.target_ids.includes(item.category_id);
        if (CART_DEBUG) console.log('📂 Category check - Item category:', item.category_id, 'Target IDs:', promotion.target_ids, 'Match:', isCategoryMatch);
        
        if (!isCategoryMatch && promotion.name && promotion.name.toLowerCase().includes('drinks')) {
          if (CART_DEBUG) console.log('🔍 Category match failed, trying drinks keyword matching...');
          const itemName = item.name.toLowerCase();
          const itemDescription = (item.description || '').toLowerCase();
          const drinksKeywords = ['drink', 'beverage', 'juice', 'soda', 'water', 'tea', 'coffee', 'milk', '7 up', 'coke', 'pepsi', 'alaska'];
          const isDrinksMatch = drinksKeywords.some(keyword => 
            itemName.includes(keyword) || itemDescription.includes(keyword)
          );
          if (CART_DEBUG) console.log('🥤 Drinks keyword check - Keywords:', drinksKeywords, 'Item name:', itemName, 'Match:', isDrinksMatch);
          return isDrinksMatch;
        }
        
        return isCategoryMatch;
      } else if (targetType === 'product' || targetType === 'products') {
        const isProductMatch = promotion.target_ids && promotion.target_ids.includes(item.product_id || item.id);
        if (CART_DEBUG) console.log('🛍️ Product check - Item ID:', item.product_id || item.id, 'Match:', isProductMatch);
        return isProductMatch;
      } else if (promotion.target_type === 'specific') {
        const itemName = item.name.toLowerCase();
        const itemDescription = (item.description || '').toLowerCase();
        
        if (CART_DEBUG) console.log('🔍 Specific check - Item name:', itemName, 'Description:', itemDescription);
        
        if (promotion.name && promotion.name.toLowerCase().includes('drinks')) {
          const drinksKeywords = ['drink', 'beverage', 'juice', 'soda', 'water', 'tea', 'coffee', 'milk', '7 up', 'coke', 'pepsi', 'alaska'];
          const isDrinksMatch = drinksKeywords.some(keyword => 
            itemName.includes(keyword) || itemDescription.includes(keyword)
          );
          if (CART_DEBUG) console.log('🥤 Drinks check - Keywords:', drinksKeywords, 'Match:', isDrinksMatch);
          return isDrinksMatch;
        }
        
        if (promotion.name && promotion.name.toLowerCase().includes('ramyeon')) {
          const ramyeonKeywords = ['ramyeon', 'ramen', 'noodle', 'soup'];
          const isRamyeonMatch = ramyeonKeywords.some(keyword => 
            itemName.includes(keyword) || itemDescription.includes(keyword)
          );
          if (CART_DEBUG) console.log('🍜 Ramyeon check - Keywords:', ramyeonKeywords, 'Match:', isRamyeonMatch);
          return isRamyeonMatch;
        }
      }
      
      if (CART_DEBUG) console.log('❌ No matching criteria found');
      return false;
    },
    
    showSuccessNotification(message) {
      const notification = document.createElement('div');
      notification.className = 'promo-notification success';
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
        z-index: 10000;
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        animation: slideInRight 0.3s ease-out;
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-in reverse';
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 3000);
    },
    
    // Map and payment methods continue from original code...
    // (Include all remaining methods: openMap, closeMap, initializeMap, placeMarker, etc.)
    // (proceedToCheckout, processGCashPayment, processPayMayaPayment, etc.)
    // (The rest of your methods remain EXACTLY the same)

    async openMap() {
      this.showMap = true;
      
      if (!window.google) {
        try {
          await this.loadGoogleMapsScript();
        } catch (error) {
          console.error('Failed to load Google Maps:', error);
          alert('Unable to load Google Maps. Please check:\n1. Internet connection\n2. API key is valid\n3. Billing is enabled in Google Cloud Console\n\nYou can manually enter your address instead.');
          this.closeMap();
          return;
        }
      }
      
      this.$nextTick(() => {
        this.initializeMap();
      });
    },

    loadGoogleMapsScript() {
      return new Promise((resolve, reject) => {
        if (window.google) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAmv6-w1GHQ7Z4Y7c_iOlr17iw6Z6pnmC0&libraries=places&callback=initMap';
        script.async = true;
        script.defer = true;
        
        window.initMap = () => {
          resolve();
          delete window.initMap;
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Google Maps script'));
        };
        
        document.head.appendChild(script);
      });
    },

    closeMap() {
      this.showMap = false;
    },

    initializeMap() {
      const mapElement = document.getElementById('google-map');
      if (!mapElement || !window.google) {
        console.error('Google Maps not loaded or map element not found');
        alert('Unable to load Google Maps. Please check your internet connection and try again.');
        this.closeMap();
        return;
      }

      try {
        const defaultCenter = { lat: 8.1837, lng: 126.3162 };
        
        this.map = new window.google.maps.Map(mapElement, {
          center: defaultCenter,
          zoom: 13,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          mapId: 'DEMO_MAP_ID'
        });

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              this.map.setCenter(userLocation);
              this.placeMarker(userLocation);
            },
            (error) => {
              console.log('Geolocation error:', error);
              this.placeMarker(defaultCenter);
            }
          );
        } else {
          this.placeMarker(defaultCenter);
        }

        this.map.addListener('click', (event) => {
          this.placeMarker(event.latLng);
        });
      } catch (error) {
        console.error('Map initialization error:', error);
        
        if (error.message && error.message.includes('Billing')) {
          alert('⚠️ Google Maps API Error: Billing is not enabled.\n\nPlease enable billing for this API key in Google Cloud Console:\n1. Go to console.cloud.google.com\n2. Select your project\n3. Enable billing\n4. Enable Maps JavaScript API');
        } else {
          alert('Unable to initialize Google Maps. Error: ' + error.message);
        }
        this.closeMap();
      }
    },

    placeMarker(location) {
      if (this.marker) {
        this.marker.setMap(null);
      }

      this.marker = new window.google.maps.Marker({
        position: location,
        map: this.map,
        animation: window.google.maps.Animation.DROP,
        title: 'Delivery Location'
      });

      this.getAddressFromCoordinates(location);
    },

    getAddressFromCoordinates(location) {
      const geocoder = new window.google.maps.Geocoder();
      const latLng = {
        lat: typeof location.lat === 'function' ? location.lat() : location.lat,
        lng: typeof location.lng === 'function' ? location.lng() : location.lng
      };

      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          this.deliveryAddress = results[0].formatted_address;
          
          if (this.marker) {
            const infoWindow = new window.google.maps.InfoWindow({
              content: `<div style="padding: 10px;">
                <strong>Selected Location:</strong><br/>
                ${results[0].formatted_address}
              </div>`
            });
            infoWindow.open(this.map, this.marker);
          }
        } else {
          console.error('Geocoder failed:', status);
          alert('Unable to get address for this location. Please try another location.');
        }
      });
    },

    // Payment and checkout methods remain the same...
    async proceedToCheckout() {
      // Your existing proceedToCheckout logic
      // (Keep all the code as-is from your original file)
    },

    async processGCashPayment(orderId) {
      try {
        const source = await paymongoAPI.processGCashPayment({
          amount: this.finalTotal,
          orderId: orderId,
          customerEmail: this.userProfile?.email || 'customer@example.com',
          customerName: this.userProfile?.full_name || 'Customer'
        });
        
        return source;
      } catch (error) {
        console.error('GCash payment error:', error);
        throw new Error('Failed to process GCash payment. Please try again.');
      }
    },

    // Include ALL remaining methods from your original file...
    // (processPayMayaPayment, processCardPayment, processGrabPayPayment, etc.)
    
    closeConfirmationModal() {
      console.log('🚪 Closing confirmation modal');
      this.showOrderConfirmation = false;
      
      window.location.hash = '#/cart';
      console.log('✅ URL cleaned, staying on cart');
    },
    
    goToHome() {
      console.log('🏠 Going to home');
      this.showOrderConfirmation = false;
      
      window.location.hash = '#/';
      this.$emit('setCurrentPage', 'Home');
    },
    
    async loadUserProfile() {
      try {
        console.log('🔍 DEBUG: Attempting to load user profile...');
        
        const token = localStorage.getItem('access_token');
        console.log('🔍 DEBUG: JWT Token exists:', !!token);
        
        if (!token) {
          throw new Error('No JWT token found - user not logged in');
        }
        
        console.log('🔍 DEBUG: Calling authAPI.getProfile()...');
        const response = await authAPI.getProfile();
        console.log('🔍 DEBUG: API Response:', response);
        
        if (response && response.customer) {
          this.userProfile = {
            id: response.customer.customer_id,
            email: response.customer.email,
            full_name: response.customer.full_name,
            loyalty_points: response.customer.loyalty_points || 0
          };
          
          if (this.setLoyaltyBalance) {
            this.setLoyaltyBalance(this.userProfile.loyalty_points);
          }
          
          console.log('✅ Real customer profile loaded:', {
            email: this.userProfile.email,
            loyalty_points: this.userProfile.loyalty_points
          });
        } else {
          console.error('❌ No customer data in response:', response);
          throw new Error('No customer data received');
        }
      } catch (error) {
        console.error('❌ Failed to load real customer profile:', error);
        
        if (error.response) {
          console.error('❌ HTTP Status:', error.response.status);
          console.error('❌ Response Data:', error.response.data);
          console.error('❌ Response Headers:', error.response.headers);
        } else if (error.data) {
          console.error('❌ Error Data:', error.data);
        }
        
        console.error('❌ Error Message:', error.message || 'No error message available');
        console.error('❌ Full Error Object:', JSON.stringify(error, null, 2));
        
        console.log('💡 To fix: Make sure you are logged in and backend is running');
        console.log('💡 Check backend logs for detailed error information');
      }
    }

    // Add remaining helper methods...
  },

  async mounted() {
    console.log('🔧 Cart component mounted');
    console.log('Full URL:', window.location.href);
    console.log('Hash:', window.location.hash);
    console.log('Search:', window.location.search);
    console.log('Pathname:', window.location.pathname);
    
    const hasPaymentParams = window.location.hash.includes('payment=') || window.location.search.includes('payment=');
    console.log('Hash includes payment=:', window.location.hash.includes('payment='));
    console.log('Search includes payment=:', window.location.search.includes('payment='));
    console.log('Has payment params in URL:', hasPaymentParams);
    
    if (hasPaymentParams) {
      console.log('🔍 Payment params detected in URL, checking payment return...');
      setTimeout(() => {
        this.checkPaymentReturn();
      }, 100);
    } else {
      if (CART_DEBUG) console.log('[Cart] No payment params in URL, skipping payment return check');
      const stalePendingOrder = localStorage.getItem('ramyeon_pending_order');
      if (stalePendingOrder) {
        if (CART_DEBUG) console.log('[Cart] Clearing stale pending order');
        localStorage.removeItem('ramyeon_pending_order');
      }
    }
    
    this.loadUserProfile();
    
    const savedCart = localStorage.getItem('ramyeon_cart');
    if (CART_DEBUG) console.log('[Cart] Loading cart from localStorage:', savedCart ? 'Found' : 'Empty');
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (CART_DEBUG) console.log('[Cart] Parsed cart items:', parsedCart.length);
        
        if (Array.isArray(parsedCart)) {
          this.cartItems = parsedCart;
          if (CART_DEBUG) console.log('[Cart] Cart loaded:', this.cartItems.length, 'items');
        } else {
          console.warn('⚠️ Invalid cart data, clearing');
          localStorage.removeItem('ramyeon_cart');
          this.cartItems = [];
        }
      } catch (error) {
        console.error('❌ Error loading cart:', error);
        localStorage.removeItem('ramyeon_cart');
        this.cartItems = [];
      }
    } else {
      console.log('ℹ️ No saved cart found');
      this.cartItems = [];
    }
    
    this.$nextTick(() => {
      this.$forceUpdate();
      console.log('🔄 Forced cart UI update - displaying:', this.cartItems.length, 'items');
    });
    
    try {
      console.log('🎁 Loading active promotions for per-item discounts...');
      await this.getActivePromotions();
      
      // ✅ AUTO-APPLY BEST PROMOTION (respects voucher priority)
      await this.autoApplyBestPromotion();
      
      console.log('✅ Promotions loaded and auto-applied (if applicable)');
    } catch (error) {
      console.error('❌ Error loading promotions:', error);
    }
  }
}
</script>


<style scoped>
.cart-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  font-family: 'Poppins', sans-serif;
}

.cart-container {
  max-width: 1200px;
  margin: 0 auto;
}

.cart-header {
  text-align: center;
  margin-bottom: 30px;
}

.cart-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cart-header p {
  color: #666;
  font-size: 1.1rem;
}

.cart-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  align-items: start;
}

.cart-items {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr auto auto auto;
  gap: 15px;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 15px;
  object-fit: cover;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.item-details h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.item-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.item-price {
  font-weight: 600;
  color: #ff4757;
  font-size: 1.1rem;
}

.item-price-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.item-price.has-discount {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.original-price {
  text-decoration: line-through;
  color: #999;
  font-size: 0.9rem;
  font-weight: 500;
}

.current-price {
  color: #ff4757;
  font-weight: 700;
  font-size: 1.2rem;
}

.item-discount-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.discount-badge {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
  width: fit-content;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.savings {
  color: #28a745;
  font-size: 0.8rem;
  font-weight: 600;
}

.total-with-discount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.original-total {
  text-decoration: line-through;
  color: #999;
  font-size: 0.9rem;
  font-weight: 500;
}

.discounted-total {
  color: #ff4757;
  font-weight: 700;
  font-size: 1.2rem;
}

.regular-total {
  font-weight: 700;
  font-size: 1.2rem;
  color: #333;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8f9fa;
  border-radius: 25px;
  padding: 5px;
}

.quantity-btn {
  width: 35px;
  height: 35px;
  border: none;
  border-radius: 50%;
  background: #ff4757;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quantity-btn:hover {
  background: #ff3742;
  transform: scale(1.1);
}

.quantity {
  font-weight: 600;
  font-size: 1.1rem;
  min-width: 30px;
  text-align: center;
}

.item-total {
  font-weight: 700;
  font-size: 1.2rem;
  color: #333;
}

.remove-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: #dc3545;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #c82333;
  transform: scale(1.1);
}

.order-summary {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  position: sticky;
  top: 20px;
}

.order-summary h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 1rem;
}

.summary-row.total {
  border-top: 2px solid #eee;
  padding-top: 15px;
  font-weight: 700;
  font-size: 1.2rem;
  color: #ff4757;
}

.summary-row.discount-row {
  color: #28a745;
  font-weight: 600;
  font-size: 1.05rem;
}

.discount-amount {
  color: #28a745;
  font-weight: 700;
}

/* Promo Code Section */
.promo-code-section {
  margin: 20px 0;
  padding: 15px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.promo-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.promo-input {
  flex: 1;
  padding: 12px 15px;
  border: 2px solid #eee;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: 'Poppins', sans-serif;
  transition: all 0.3s ease;
  text-transform: uppercase;
}

.promo-input:focus {
  outline: none;
  border-color: #ff4757;
  box-shadow: 0 0 0 3px rgba(255, 71, 87, 0.1);
}

.promo-input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.apply-promo-btn,
.remove-promo-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.apply-promo-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  min-width: 90px;
}

.apply-promo-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #218838, #1aa179);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
}

.apply-promo-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.remove-promo-btn {
  background: #dc3545;
  color: white;
}

.remove-promo-btn:hover {
  background: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.3);
}

.loading-spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.applied-promo {
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  padding: 15px;
  border-radius: 10px;
  margin-top: 10px;
  border: 2px solid #28a745;
}

.promo-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.promo-icon {
  font-size: 1.3rem;
}

.promo-name {
  font-weight: 700;
  color: #2e7d32;
  font-size: 1rem;
}

.promo-discount-info {
  color: #1b5e20;
  font-size: 0.9rem;
  font-weight: 600;
  margin-left: 30px;
}

.promo-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffebee;
  color: #c62828;
  padding: 10px 15px;
  border-radius: 8px;
  margin-top: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid #ef5350;
}

.error-icon {
  font-size: 1.2rem;
}

/* Loyalty Points Section */
.loyalty-points-section {
  margin: 20px 0;
  padding: 15px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #fff8e1, #ffecb3);
  border-radius: 10px;
  padding: 20px;
}

.points-header {
  margin-bottom: 15px;
}

.points-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #f57c00;
}

.points-icon {
  font-size: 1.3rem;
}

.points-label {
  font-size: 1rem;
}

.points-balance {
  font-size: 1.2rem;
  font-weight: 700;
  color: #e65100;
}

.points-value {
  font-size: 0.9rem;
  color: #bf360c;
  font-weight: 500;
}

.points-redemption {
  margin-top: 15px;
}

.points-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-bottom: 15px;
}

.points-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #ff9800;
}

.checkbox-text {
  font-weight: 600;
  color: #e65100;
  font-size: 1rem;
}

.points-input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}

.points-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.points-input {
  flex: 1;
  padding: 12px 15px;
  border: 2px solid #ffb74d;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: 'Poppins', sans-serif;
  transition: all 0.3s ease;
  background: white;
  min-width: 120px;
}

.quick-select-points {
  display: flex;
  gap: 6px;
}

.quick-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Poppins', sans-serif;
}

.quick-btn:hover {
  background: linear-gradient(135deg, #fb8c00, #ef6c00);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 152, 0, 0.3);
}

.quick-btn:active {
  transform: translateY(0);
}

.points-input:focus {
  outline: none;
  border-color: #ff9800;
  box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
}

.points-discount {
  font-weight: 700;
  color: #e65100;
  font-size: 1rem;
  background: #fff3e0;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ffb74d;
}

.summary-row.points-discount-row {
  color: #ff9800;
  font-weight: 600;
  font-size: 1.05rem;
  background: linear-gradient(135deg, #fff8e1, #ffecb3);
  padding: 8px 12px;
  border-radius: 8px;
  margin: 5px 0;
}

.loyalty-points-summary {
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  border-radius: 10px;
  padding: 15px;
  margin-top: 15px;
  border: 2px solid #4caf50;
}

.points-used {
  color: #f44336;
  font-weight: 700;
}

.points-earned {
  color: #4caf50;
  font-weight: 700;
}

.points-insufficient {
  margin-top: 10px;
  padding: 10px 15px;
  background: #fff3e0;
  border: 1px solid #ffb74d;
  border-radius: 8px;
}

.insufficient-message {
  color: #e65100;
  font-weight: 600;
  font-size: 0.9rem;
}

.points-rates {
  margin-top: 5px;
  text-align: center;
}

.points-rates small {
  color: #f57c00;
  font-weight: 500;
  font-size: 0.8rem;
}

.delivery-options,
.payment-methods,
.special-instructions {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.delivery-options h2,
.payment-methods h2,
.special-instructions h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.option-label {
  display: block;
  cursor: pointer;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border: 2px solid #eee;
  border-radius: 15px;
  transition: all 0.3s ease;
}

.option-label input[type="radio"]:checked + .option-content {
  border-color: #ff4757;
  background: rgba(255, 71, 87, 0.05);
}

.option-icon {
  font-size: 2rem;
}

.option-text h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.option-text p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.option-time {
  color: #ff4757;
  font-weight: 600;
  font-size: 0.9rem;
}

.delivery-address {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.delivery-address h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.address-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.address-field {
  flex: 1;
  padding: 15px 20px;
  border: 2px solid #eee;
  border-radius: 15px;
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  transition: all 0.3s ease;
}

.address-field:focus {
  outline: none;
  border-color: #ff4757;
  box-shadow: 0 0 0 3px rgba(255, 71, 87, 0.1);
}

.map-btn {
  padding: 15px 25px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.map-btn:hover {
  background: #ff3742;
  transform: translateY(-2px);
}

.map-container {
  position: relative;
}

.map-instructions {
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 3px solid #ff4757;
}

.google-map {
  height: 400px;
  width: 100%;
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.close-map-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  border: none;
  padding: 10px 15px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.payment-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.payment-option {
  display: block;
  cursor: pointer;
}

.payment-content {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border: 2px solid #eee;
  border-radius: 15px;
  transition: all 0.3s ease;
}

.payment-option input[type="radio"]:checked + .payment-content {
  border-color: #ff4757;
  background: rgba(255, 71, 87, 0.05);
}

.payment-icon {
  font-size: 1.5rem;
}

.instructions-field {
  width: 100%;
  min-height: 100px;
  padding: 15px 20px;
  border: 2px solid #eee;
  border-radius: 15px;
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  resize: vertical;
  transition: all 0.3s ease;
}

.instructions-field:focus {
  outline: none;
  border-color: #ff4757;
  box-shadow: 0 0 0 3px rgba(255, 71, 87, 0.1);
}

.checkout-section {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.checkout-btn {
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.checkout-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 15px 35px rgba(255, 71, 87, 0.4);
}

.checkout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
  margin-right: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-cart {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.empty-cart-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-cart h2 {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.empty-cart p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 30px;
}

.browse-menu-btn {
  padding: 15px 30px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.browse-menu-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(255, 71, 87, 0.3);
}

/* Responsive Design */
@media (max-width: 992px) {
  .cart-content {
    grid-template-columns: 1fr;
  }
  
  .order-summary {
    position: static;
  }
}

@media (max-width: 768px) {
  .cart-item {
    grid-template-columns: 60px 1fr;
    gap: 10px;
  }
  
  .item-image {
    width: 60px;
    height: 60px;
  }
  
  .item-controls,
  .item-total,
  .remove-btn {
    grid-column: 2;
    justify-self: end;
    margin-top: 10px;
  }
  
  .payment-options {
    grid-template-columns: 1fr;
  }
  
  .address-input {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .cart-page {
    padding: 10px;
  }
  
  .cart-header h1 {
    font-size: 2rem;
  }
  
  .cart-items,
  .order-summary,
  .delivery-options,
  .payment-methods,
  .special-instructions,
  .checkout-section {
    padding: 20px;
  }
}

/* Modal Fade Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Order Confirmation Modal - GLOBAL STYLES (via teleport) */
/* Remove scoped to make this work at body level */


@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.confirmation-modal {
  background: white !important;
  border-radius: 25px;
  padding: 50px 40px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  position: relative;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1000000 !important;
  pointer-events: auto !important;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.confirmation-success-icon {
  margin-bottom: 30px;
}

.checkmark-circle {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
  box-shadow: 0 10px 30px rgba(76, 175, 80, 0.4);
}

@keyframes scaleIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.checkmark {
  width: 40px;
  height: 70px;
  border: solid white;
  border-width: 0 6px 6px 0;
  transform: rotate(45deg);
  animation: drawCheck 0.5s ease-out 0.5s both;
}

@keyframes drawCheck {
  from {
    height: 0;
    width: 0;
  }
  to {
    height: 70px;
    width: 40px;
  }
}

.confirmation-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 30px;
  animation: fadeInUp 0.5s ease-out 0.3s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.confirmation-details {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 25px;
  animation: fadeInUp 0.5s ease-out 0.4s both;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #dee2e6;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row.estimated-time {
  margin-top: 10px;
  padding-top: 20px;
  border-top: 2px solid #ff4757;
}

.detail-label {
  font-weight: 600;
  color: #666;
  font-size: 0.95rem;
}

.detail-value {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.detail-value.order-id {
  color: #ff4757;
  font-family: monospace;
  font-size: 0.9rem;
  background: #fff;
  padding: 5px 10px;
  border-radius: 8px;
}

.detail-value.total-amount {
  color: #4caf50;
  font-size: 1.3rem;
  font-weight: 700;
}

.confirmation-message {
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  animation: fadeInUp 0.5s ease-out 0.5s both;
}

.confirmation-message p {
  margin: 8px 0;
  color: #2e7d32;
  font-weight: 600;
  font-size: 1rem;
}

.confirmation-btn {
  width: 100%;
  padding: 18px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  animation: fadeInUp 0.5s ease-out 0.6s both;
}

.confirmation-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 35px rgba(255, 71, 87, 0.4);
}

/* Responsive for modal */
@media (max-width: 480px) {
  .confirmation-modal {
    padding: 40px 25px;
  }
  
  .confirmation-title {
    font-size: 1.6rem;
  }
  
  .checkmark-circle {
    width: 80px;
    height: 80px;
  }
  
  .checkmark {
    width: 30px;
    height: 50px;
  }
}
</style>

<style>
/* GLOBAL Modal Styles - Not Scoped (for teleport to body) */
.confirmation-modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(10px) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 2147483647 !important; /* Maximum z-index */
  animation: fadeIn 0.3s ease-out !important;
  pointer-events: auto !important;
  visibility: visible !important;
  opacity: 1 !important;
  margin: 0 !important;
  padding: 20px !important;
}

.confirmation-modal {
  background: white !important;
  border-radius: 25px !important;
  padding: 50px 40px !important;
  max-width: 500px !important;
  width: 90% !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
  text-align: center !important;
  position: relative !important;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
  z-index: 2147483647 !important;
  pointer-events: auto !important;
  margin: auto !important;
}

/* Voucher Summary Display */
.applied-voucher-summary {
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  border: 2px solid #28a745;
  border-radius: 12px;
  padding: 15px;
  margin: 15px 0;
  animation: fadeIn 0.4s ease-out;
}

.voucher-info-row {
  margin-bottom: 12px;
}

.voucher-details {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.voucher-icon {
  font-size: 1.5rem;
  animation: pulse 2s infinite;
}

.voucher-name {
  font-weight: 700;
  color: #2e7d32;
  font-size: 1rem;
  margin-bottom: 4px;
}

.voucher-description {
  font-size: 0.85rem;
  color: #1b5e20;
  font-weight: 500;
}

.applied-voucher-summary .summary-row {
  margin-bottom: 0;
  padding-top: 10px;
  border-top: 1px solid rgba(46, 125, 50, 0.2);
}

.applied-voucher-summary .discount-amount {
  font-size: 1.1rem;
}

/* Animation for voucher appearance (if not already in your CSS) */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulse animation for voucher icon (if not already in your CSS) */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

</style>
