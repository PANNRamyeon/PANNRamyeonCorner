<template>
  <div class="promotions-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner-big"></div>
      <p>Loading promotions...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>Failed to Load Promotions</h3>
      <p>{{ error }}</p>
      <button @click="fetchActivePromotions" class="retry-btn">Retry</button>
    </div>
    
    <!-- No Promotions State -->
    <div v-if="!isLoading && promotions.length === 0" class="empty-promotions">
      <div class="empty-icon">🎁</div>
      <h3>No Active Promotions</h3>
      <p>Check back later for exciting deals and offers!</p>
    </div>
    
    <!-- Main Content -->
   <main v-if="!isLoading && !error" class="main-content">
      <!-- Flash Sale Section -->
       <section class="flash-sale-section">
        <div class="flash-sale-card" :class="{ 'disabled': !isLoggedIn }" @click="handlePromotionClick('FLASH30', 'Flash Sale')">
          <div class="flash-sale-content">
            <div class="flash-sale-image">
              <img :src="ramyeonHero" alt="Ramyeon Bowl" />
            </div>
            <div class="flash-sale-text">
              <p class="flash-sale-duration">24 HOURS ONLY</p>
              <h2 class="flash-sale-title">FLASH SALE</h2>
              <div class="flash-sale-discount">30% OFF</div>
              <div class="flash-sale-code">
                <span>Use Code: </span>
                <span class="code-highlight">CORNER</span>
              </div>
              <div class="flash-sale-actions">
                <button class="order-btn" @click.stop="handlePromotionClick('FLASH30', 'Flash Sale')">
                  <span class="btn-icon">🛒</span>
                  <span>Order Now</span>
                </button>
                <button v-if="isLoggedIn" class="save-promotion-btn futuristic-save" @click.stop="savePromotion('FLASH30', 'Flash Sale', '30% OFF')" :disabled="isSaving('FLASH30')">
                  <span class="save-bg-effect"></span>
                  <span class="btn-content">
                    <span v-if="!isSaving('FLASH30')" class="btn-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <polyline points="7 3 7 8 15 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                    <span v-if="!isSaving('FLASH30')">Save</span>
                    <span v-else class="loading-spinner">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Top Food Items -->
      <section class="food-items-section">
        <div class="food-grid">
          <div
            v-for="(item, index) in topItems"
            :key="index"
            class="food-item-card"
            :class="{ 'disabled': !isLoggedIn }"
            @click="handlePromotionClick(item.code, item.name)"
          >
            <div class="food-image">
              <img :src="item.image" :alt="item.name" />
            </div>
            <div class="food-info">
              <h3 class="food-name">{{ item.name }}</h3>
              <p class="food-price">{{ item.price }}</p>
              <button v-if="isLoggedIn" class="save-item-btn futuristic-save-mini" @click.stop="savePromotion(item.code, item.name, item.discount || 'Special Offer')" :disabled="isSaving(item.code)">
                <span class="save-bg-effect"></span>
                <span class="btn-content">
                  <span v-if="!isSaving(item.code)" class="btn-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <polyline points="7 3 7 8 15 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span v-else class="loading-spinner">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Promotional Banner -->
      <section class="promo-banner">
        <div class="promo-banner-content">
          <div class="promo-text">
            <h3>ENJOY RAMYEON YOUR WAY!</h3>
            <p>Discover authentic Korean flavors with every bowl</p>
          </div>
          <div class="promo-icon">🍜</div>
        </div>
      </section>

      <!-- Bottom Food Items -->
      <section class="food-items-section">
        <div class="food-grid">
          <div
            v-for="(item, index) in bottomItems"
            :key="index"
            class="food-item-card"
            :class="{ 'disabled': !isLoggedIn }"
            @click="handlePromotionClick(item.code, item.name)"
          >
            <div class="food-image">
              <img :src="item.image" :alt="item.name" />
            </div>
            <div class="food-info">
              <h3 class="food-name">{{ item.name }}</h3>
              <p class="food-price">{{ item.price }}</p>
              <button v-if="isLoggedIn" class="save-item-btn futuristic-save-mini" @click.stop="savePromotion(item.code, item.name, item.discount || 'Special Offer')" :disabled="isSaving(item.code)">
                <span class="save-bg-effect"></span>
                <span class="btn-content">
                  <span v-if="!isSaving(item.code)" class="btn-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <polyline points="7 3 7 8 15 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span v-else class="loading-spinner">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Special Offers -->
      <section class="special-offers">
        <div class="offers-grid">
          <!-- Summer Offer -->
          <div class="summer-offer-card" :class="{ 'disabled': !isLoggedIn }" @click="handlePromotionClick('SUMMER40', 'Summer Special')">
            <div class="summer-offer-content">
              <div class="summer-offer-text">
                <h3>Special Summer Offer</h3>
                <div class="discount">40% OFF</div>
                <p>Ice cold different flavors to chill you in the summer!</p>
              </div>
              <div class="summer-offer-icon">🎁</div>
            </div>
            <button class="order-btn-red" @click.stop="handlePromotionClick('SUMMER40', 'Summer Special')">
              <span>ORDER</span>
            </button>
            <button v-if="isLoggedIn" class="save-offer-btn futuristic-save" @click.stop="savePromotion('SUMMER40', 'Summer Special', '40% OFF')" :disabled="isSaving('SUMMER40')">
              <span class="save-bg-effect"></span>
              <span class="btn-content">
                <span v-if="!isSaving('SUMMER40')" class="btn-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <polyline points="7 3 7 8 15 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span v-if="!isSaving('SUMMER40')">Save</span>
                <span v-else class="loading-spinner">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </span>
            </button>
          </div>

          <!-- Vouchers -->
          <div class="vouchers-section">
            <div class="voucher-card" :class="{ 'disabled': !isLoggedIn }" @click="handlePromotionClick('STORE10', 'Store Voucher')">
              <div class="voucher-content">
                <div class="voucher-icon">🎁</div>
                <div class="voucher-text">
                  <div class="voucher-discount">₱ 10 OFF</div>
                  <div class="voucher-title">STORE VOUCHER</div>
                </div>
              </div>
              <button v-if="isLoggedIn" class="save-voucher-btn futuristic-save-compact" @click.stop="savePromotion('STORE10', 'Store Voucher', '₱ 10 OFF')" :disabled="isSaving('STORE10')">
                <span class="save-bg-effect"></span>
                <span class="btn-content">
                  <span v-if="!isSaving('STORE10')" class="btn-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <polyline points="7 3 7 8 15 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span v-else class="loading-spinner">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </span>
              </button>
            </div>
            <div class="voucher-card delivery-voucher" :class="{ 'disabled': !isLoggedIn }" @click="handlePromotionClick('DELIVERY20', 'Delivery Voucher')">
              <div class="voucher-content">
                <div class="voucher-icon">🚚</div>
                <div class="voucher-text">
                  <div class="voucher-discount">₱ 20 OFF</div>
                  <div class="voucher-title">DELIVERY VOUCHER</div>
                </div>
              </div>
              <button v-if="isLoggedIn" class="save-voucher-btn futuristic-save-compact" @click.stop="savePromotion('DELIVERY20', 'Delivery Voucher', '₱ 20 OFF')" :disabled="isSaving('DELIVERY20')">
                <span class="save-bg-effect"></span>
                <span class="btn-content">
                  <span v-if="!isSaving('DELIVERY20')" class="btn-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <polyline points="7 3 7 8 15 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span v-else class="loading-spinner">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal for QR Code -->
    <!-- Modal for Promo Code -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>{{ modalTitle }}</h3>

        <!-- TEXT PROMO CODE DISPLAY -->
        <div class="text-code">
          <p>Your promo code:</p>

          <div class="code-display">{{ currentCode }}</div>

          <p class="code-instruction">Show this code to the cashier</p>

          <!-- COPY BUTTON (Same design as SAVE buttons) -->
          <button
            class="futuristic-save-mini"
            @click="copyCode(currentCode)"
          >
            <span class="btn-content">
              📋 Copy Code
            </span>
          </button>

          <!-- SAVE BUTTON (Same design as other save buttons) -->
          <button
            class="futuristic-save-mini"
            @click="savePromotion(currentCode, modalTitle, 'Saved Promotion')"
          >
            <span class="btn-content">
              💾 Save for Later
            </span>
          </button>
        </div>

        <!-- QR SECTION BUT HIDDEN (do not remove) -->
        <!-- <div v-else class="qr-code" style="display:none;">
          <canvas ref="qrCanvas"></canvas>
          <p class="qr-instruction">Scan this QR code to apply the promotion</p>
        </div>-->

        <button @click="closeModal" class="close-btn">Close</button>
      </div>


    </div>
  </div>
</template>

<script>
import QRCode from 'qrcode'
import { usePromotions } from '../composables/api/usePromotions.js'

export default {
  name: 'Promotions',
  emits: ['setCurrentPage'],
  props: {
    isLoggedIn: Boolean
  },
  setup() {
    // Initialize promotions composable
    const promotions = usePromotions();
    
    return {
      // Expose composable methods and state
      ...promotions
    };
  },
  data() {
    return {
      showModal: false,
      modalTitle: '',
      currentCode: '',
      isTextCode: false,
      savingPromotions: {}, // Track which promotions are being saved
      ramyeonHero: require('@/assets/food/ramyeon-hero.jpg'),
      // activePromotions now comes from usePromotions composable
      // loading and error now come from usePromotions composable
      // Fallback images for promotions
      fallbackImages: {
        'ramyeon': require('@/assets/food/ramyeon-hero.jpg'),
        'kimchi': require('@/assets/food/kimchi.jpg'),
        'bulgogi': require('@/assets/food/bulgogi.jpg'),
        'corndog': require('@/assets/food/corn-dog.jpg'),
        'fishcake': require('@/assets/food/fish-cake.jpg'),
        'tteokbokki': require('@/assets/food/tteokbokki.jpg'),
      }
    }
  },
  computed: {
    // Split promotions into sections for display
    flashSalePromotions() {
      return this.promotions.filter(p => 
        p.name?.toLowerCase().includes('flash') || 
        p.description?.toLowerCase().includes('flash')
      ).slice(0, 1) // Take first flash sale
    },
    
    topItems() {
      return this.promotions
        .filter(p =>
          p.type === 'percentage' &&
          !this.flashSalePromotions.includes(p) &&
          !['pwd', 'senior citizen'].includes(p.name?.toLowerCase())
        )
        .slice(0, 3)
        .map(p => this.formatPromotionAsItem(p));
    },
    
    bottomItems() {
      return this.promotions
        .filter(p =>
          !this.flashSalePromotions.includes(p) &&
          !this.topItems.some(item => item.code === p.promotion_id) &&
          !['pwd', 'senior citizen'].includes(p.name?.toLowerCase())
        )
        .slice(0, 3)
        .map(p => this.formatPromotionAsItem(p));
    },

    
    specialOffers() {
      // Get fixed amount and buy_x_get_y promotions
      return this.promotions
        .filter(p => ['fixed_amount', 'buy_x_get_y'].includes(p.type))
        .slice(0, 3)
    }
  },
  async mounted() {
    // Initialize promotions when component is mounted
    await this.fetchActivePromotions();
  },
  methods: {
    async fetchActivePromotions() {
      try {
        console.log('🎯 Fetching active promotions using composable...')
        await this.getActivePromotions()
        console.log('✅ Loaded', this.promotions.length, 'active promotions')
        console.log('Promotions:', this.promotions)
      } catch (error) {
        console.error('❌ Error fetching promotions:', error)
        this.showErrorMessage('Could not load promotions. Please try again later.')
      }
    },
    
    formatPromotionAsItem(promotion) {
      // Format database promotion for display in item cards
      const discountText = promotion.type === 'percentage' 
        ? `${promotion.discount_value}% OFF`
        : `₱${promotion.discount_value} OFF`
      
      return {
        name: promotion.name.toUpperCase(),
        price: this.getPromotionPriceDisplay(promotion),
        image: this.getPromotionImage(promotion),
        code: promotion.promotion_id,
        discount: discountText,
        description: promotion.description
      }
    },
    
    getPromotionPriceDisplay(promotion) {
      // Generate price display based on promotion type
      if (promotion.type === 'percentage') {
        return `${promotion.discount_value}% OFF`
      } else if (promotion.type === 'fixed_amount') {
        return `Save ₱${promotion.discount_value}`
      } else if (promotion.type === 'buy_x_get_y') {
        const config = promotion.discount_config || {}
        return `Buy ${config.buy_quantity || 2} Get ${config.get_quantity || 1} Free`
      }
      return 'Special Offer'
    },
    
    getPromotionImage(promotion) {
      // Try to match promotion name to an image
      const nameLower = promotion.name.toLowerCase()
      
      if (nameLower.includes('ramyeon') || nameLower.includes('ramen')) {
        return this.fallbackImages.ramyeon
      } else if (nameLower.includes('kimchi')) {
        return this.fallbackImages.kimchi
      } else if (nameLower.includes('bulgogi')) {
        return this.fallbackImages.bulgogi
      } else if (nameLower.includes('corn') || nameLower.includes('dog')) {
        return this.fallbackImages.corndog
      } else if (nameLower.includes('fish') || nameLower.includes('cake')) {
        return this.fallbackImages.fishcake
      } else if (nameLower.includes('tteok')) {
        return this.fallbackImages.tteokbokki
      }
      
      // Default to ramyeon hero image
      return this.fallbackImages.ramyeon
    },
    
    goBack() {
      this.$emit('setCurrentPage', 'Home')
    },
    
    handlePromotionClick(code, title) {
      if (!this.isLoggedIn) {
        this.showErrorMessage('Please log in to access promotions!')
        return
      }
      this.showPromoCode(code, title)
    },
    
    isSaving(code) {
      return this.savingPromotions[code] === true
    },
    async showPromoCode(code, title) {
      this.currentCode = code
      this.modalTitle = title
      this.isTextCode = false
      this.showModal = true

      // Generate QR code
      await this.$nextTick()
      if (this.$refs.qrCanvas) {
        try {
          await QRCode.toCanvas(this.$refs.qrCanvas, code, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
        } catch (error) {
          console.error('Error generating QR code:', error)
        }
      }
    },
    showTextCode(code, title) {
      this.currentCode = code
      this.modalTitle = title
      this.isTextCode = true
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
      this.currentCode = ''
      this.modalTitle = ''
      this.isTextCode = false
    },

    async savePromotion(code, title, discount) {
      if (!this.isLoggedIn) {
        this.showErrorMessage('Please log in to save promotions!')
        return
      }

      // Check if already saving this promotion
      if (this.savingPromotions[code]) {
        return
      }

      // Set saving state for this specific promotion
      this.savingPromotions[code] = true

      try {
        // Check if already saved
        const savedVouchers = JSON.parse(localStorage.getItem('ramyeon_saved_vouchers') || '[]')
        const exists = savedVouchers.find(v => v.code === code)
        
        if (exists) {
          this.showErrorMessage('This promotion is already saved!')
          return
        }

        // Find the full promotion data from active promotions
        let fullPromotion = this.activePromotions.find(p => p.promotion_id === code)
        
        if (!fullPromotion) {
          // Fallback: try to fetch from API
          console.log('Promotion not found in active list, fetching from API...')
          try {
            const response = await this.getPromotion(code)
            
            if (response.success && response.promotion) {
              fullPromotion = response.promotion
            } else {
              throw new Error('Promotion not found')
            }
          } catch (apiError) {
            console.error('Failed to fetch promotion from API:', apiError)
            throw new Error('Promotion not found')
          }
        }

        // Create promotion voucher object with full data
        const promotionVoucher = {
          id: Date.now(), // Generate unique ID for local storage
          promotion_id: fullPromotion.promotion_id,
          title: fullPromotion.name,
          subtitle: fullPromotion.description || 'Promotion Offer',
          discount: discount,
          code: code,
          type: 'promotion',
          // Store full promotion data for later use
          promotionData: {
            type: fullPromotion.type,
            discount_value: fullPromotion.discount_value,
            target_type: fullPromotion.target_type,
            target_ids: fullPromotion.target_ids,
            start_date: fullPromotion.start_date,
            end_date: fullPromotion.end_date,
            usage_limit: fullPromotion.usage_limit,
            current_usage: fullPromotion.current_usage
          },
          qrCode: `${code}-QR-${Date.now()}`,
          savedAt: new Date().toISOString()
        }

        // Save to localStorage
        savedVouchers.push(promotionVoucher)
        localStorage.setItem('ramyeon_saved_vouchers', JSON.stringify(savedVouchers))

        console.log('✅ Promotion saved:', promotionVoucher)

        // Show success message
        this.showSuccessMessage('Promotion saved! Redirecting to profile...')

        // Redirect to profile after short delay
        setTimeout(() => {
          this.$emit('setCurrentPage', 'Profile')
        }, 1000)

      } catch (error) {
        console.error('Error saving promotion:', error)
        this.showErrorMessage('Failed to save promotion. Please try again.')
      } finally {
        // Clear saving state for this specific promotion
        this.savingPromotions[code] = false
      }
    },

    showSuccessMessage(message) {
      // Create success notification
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
          padding: 15px 25px;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
          z-index: 9999;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          animation: slideInRight 0.3s ease-out;
          display: flex;
          align-items: center;
          gap: 10px;
        ">
          <span style="font-size: 1.2rem;">✅</span>
          ${message}
        </div>
        <style>
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `

      document.body.appendChild(notification)

      // Remove after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 'slideInRight 0.3s ease-in reverse'
          setTimeout(() => {
            document.body.removeChild(notification)
          }, 300)
        }
      }, 3000)
    },

    showErrorMessage(message) {
      // Create error notification
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #dc3545, #c82333);
          color: white;
          padding: 15px 25px;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
          z-index: 9999;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          animation: slideInRight 0.3s ease-out;
          display: flex;
          align-items: center;
          gap: 10px;
        ">
          <span style="font-size: 1.2rem;">❌</span>
          ${message}
        </div>
        <style>
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `

      document.body.appendChild(notification)

      // Remove after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 'slideInRight 0.3s ease-in reverse'
          setTimeout(() => {
            document.body.removeChild(notification)
          }, 300)
        }
      }, 3000)
    }
  }
}
</script>

<style scoped>
@import './Promotions.css';

/* ============================================
   FUTURISTIC SAVE BUTTON STYLES
   Modern, Sleek, and Awesome Design
   ============================================ */

/* Base Futuristic Save Button */
.futuristic-save,
.futuristic-save-mini,
.futuristic-save-compact {
  position: relative;
  background: linear-gradient(135deg, #ff6f61 0%, #ff4a3d 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 8px 25px rgba(255, 111, 97, 0.4),
              0 0 0 0 rgba(255, 111, 97, 0);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.futuristic-save {
  padding: 12px 24px;
  min-width: 120px;
}

.futuristic-save-mini {
  padding: 8px 16px;
  font-size: 12px;
  border-radius: 10px;
}

.futuristic-save-compact {
  padding: 6px 12px;
  font-size: 11px;
  border-radius: 8px;
  min-width: 70px;
}

/* Animated Background Effect */
.save-bg-effect {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.6s ease;
  z-index: 0;
}

/* Button Content Wrapper */
.btn-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* Hover Effects */
.futuristic-save:hover,
.futuristic-save-mini:hover,
.futuristic-save-compact:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 35px rgba(255, 111, 97, 0.6),
              0 0 30px rgba(255, 111, 97, 0.3),
              inset 0 0 20px rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
}

.futuristic-save:hover .save-bg-effect,
.futuristic-save-mini:hover .save-bg-effect,
.futuristic-save-compact:hover .save-bg-effect {
  left: 100%;
}

/* Active/Click Effect */
.futuristic-save:active,
.futuristic-save-mini:active,
.futuristic-save-compact:active {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(255, 111, 97, 0.5);
}

/* Disabled State */
.futuristic-save:disabled,
.futuristic-save-mini:disabled,
.futuristic-save-compact:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 15px rgba(255, 111, 97, 0.2);
  filter: grayscale(40%);
}

.futuristic-save:disabled:hover,
.futuristic-save-mini:disabled:hover,
.futuristic-save-compact:disabled:hover {
  transform: none;
  box-shadow: 0 4px 15px rgba(255, 111, 97, 0.2);
}

/* Loading Spinner Animation */
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Pulsing Effect for Saving State */
.futuristic-save:disabled .btn-content,
.futuristic-save-mini:disabled .btn-content,
.futuristic-save-compact:disabled .btn-content {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Enhanced Flash Sale Actions */
.flash-sale-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

/* Enhanced Order Button */
.order-btn {
  background: white;
  color: #ff6f61;
  border: 2px solid rgba(255, 111, 97, 0.3);
  padding: 12px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
}

.order-btn:hover {
  background: #ff6f61;
  color: white;
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.5);
  border-color: white;
}

.order-btn:active {
  transform: translateY(-2px) scale(1.02);
}

/* Enhanced Red Order Button */
.order-btn-red {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
  margin-bottom: 8px;
}

.order-btn-red:hover {
  background: linear-gradient(135deg, #c82333, #bd2130);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 30px rgba(220, 53, 69, 0.6);
  border-color: rgba(255, 255, 255, 0.4);
}

.order-btn-red:active {
  transform: translateY(-1px) scale(1.01);
}

/* Position save buttons */
.food-info {
  position: relative;
}

.save-item-btn {
  position: absolute;
  top: 10px;
  right: 10px;
}

.save-offer-btn {
  margin-top: 10px;
  width: 100%;
}

.save-voucher-btn {
  position: absolute;
  top: 10px;
  right: 10px;
}

/* Disabled state for promotions */
.food-item-card.disabled, 
.flash-sale-card.disabled, 
.summer-offer-card.disabled, 
.voucher-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(50%);
}

.food-item-card.disabled:hover, 
.flash-sale-card.disabled:hover, 
.summer-offer-card.disabled:hover, 
.voucher-card.disabled:hover {
  transform: none;
}

/* Neon Glow Effect on Hover (Optional Enhancement) */
@keyframes neonGlow {
  0%, 100% {
    box-shadow: 0 12px 35px rgba(255, 111, 97, 0.6),
                0 0 30px rgba(255, 111, 97, 0.3);
  }
  50% {
    box-shadow: 0 12px 35px rgba(255, 111, 97, 0.8),
                0 0 40px rgba(255, 111, 97, 0.5);
  }
}

.futuristic-save:hover,
.futuristic-save-mini:hover,
.futuristic-save-compact:hover {
  animation: neonGlow 2s ease-in-out infinite;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .flash-sale-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .order-btn,
  .futuristic-save {
    width: 100%;
  }
}

/* ============================================
   LOADING, ERROR, AND EMPTY STATES
   ============================================ */

.loading-container,
.error-container,
.empty-promotions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
  text-align: center;
}

.loading-spinner-big {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 111, 97, 0.2);
  border-top-color: #ff6f61;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-container p {
  font-size: 1.2rem;
  color: #666;
  font-weight: 600;
}

.error-container {
  background: white;
  border-radius: 20px;
  padding: 60px 40px;
  max-width: 500px;
  margin: 40px auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.error-container h3 {
  font-size: 1.8rem;
  color: #dc3545;
  margin-bottom: 15px;
  font-weight: 700;
}

.error-container p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 30px;
  line-height: 1.6;
}

.retry-btn {
  background: linear-gradient(135deg, #ff6f61, #ff4a3d);
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.retry-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(255, 111, 97, 0.4);
}

.empty-promotions {
  background: white;
  border-radius: 20px;
  padding: 60px 40px;
  max-width: 500px;
  margin: 40px auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-promotions h3 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 15px;
  font-weight: 700;
}

.empty-promotions p {
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
}
</style>
