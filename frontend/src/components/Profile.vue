<template>
  <div class="profile-container" :class="{ 'dark-mode': isDarkMode }">
    <div class="profile-content">

      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-avatar" @mouseenter="avatarHover = true" @mouseleave="avatarHover = false">
          {{ avatarHover ? '✨' : '👤' }}
        </div>
        <h1 class="profile-name">{{ user.firstName }} {{ user.lastName }}</h1>
        <p class="profile-email">{{ user.email }}</p>
      </div>

      <!-- Profile Main Content -->
      <div class="profile-main">

        <!-- Loyalty Points Section -->
        <div class="loyalty-points-section">
          <div class="points-header">
            <h2 class="section-title">⭐ Loyalty Points</h2>

            <div class="points-balance">
              <div class="points-circle">
                <div class="points-value">{{ user.loyalty_points || 0 }}</div>
                <div class="points-unit">points</div>
              </div>

              <div class="points-value-display">
                <div class="points-peso-value">₱{{ ((user.loyalty_points || 0) / 4).toFixed(2) }}</div>
                <div class="points-value-label">in value</div>
              </div>
            </div>
          </div>

          <div class="points-actions">
            <button class="promotions-btn" @click="$emit('setCurrentPage', 'Promotions')">
              🎁 Browse Promotions
            </button>
        <!--  <button class="points-history-btn" @click="showPointsHistory">
              📊 Points History
            </button>-->  
          </div>

          <div class="points-info">
            <div class="info-item">
              <span class="info-label">Earn Rate:</span>
              <span class="info-value">20% of order value</span>
            </div>
            <div class="info-item">
              <span class="info-label">Redemption:</span>
              <span class="info-value">4 points = ₱1 discount</span>
            </div>
            <div class="info-item">
              <span class="info-label">Min Redemption:</span>
              <span class="info-value">40 points (₱10)</span>
            </div>
          </div>
        </div>

        <!-- Vouchers Section -->
        <div class="vouchers-section">
          <div class="section-header">
            <h2 class="section-title">{{ user.vouchers.length > 0 ? 'My Vouchers' : 'No Vouchers Yet' }}</h2>

            <a v-if="user.vouchers.length > 2" href="#" class="see-all-btn" @click.prevent="showAllVouchers">
              {{ showAllVouchersFlag ? 'Show Less' : 'See All' }}
            </a>
          </div>

          <div v-if="user.vouchers.length > 0" class="vouchers-grid">
            <div 
              v-for="voucher in displayedVouchers" 
              :key="voucher.id"
              class="voucher-card"
              @click="openVoucherModal(voucher)"
            >
              <div class="voucher-icon">
                {{ getVoucherIcon(voucher.title) }}
              </div>
              <h3 class="voucher-title">{{ voucher.title }}</h3>
              <p class="voucher-subtitle">{{ voucher.subtitle }}</p>
              <span class="voucher-discount">{{ voucher.discount }}</span>
            </div>
          </div>

          <div v-else class="empty-vouchers">
            <div class="empty-icon">🎫</div>
            <p class="empty-text">Save vouchers from promotions to use them later!</p>
            <button class="promotions-btn" @click="$emit('setCurrentPage', 'Promotions')">
              Browse Promotions
            </button>
          </div>
        </div>

        <!-- QR CODE SECTION HIDDEN -->
        <!--
        <div class="qr-section">
          <h3 class="qr-title">Scan for Points</h3>
          <QRCode
            :code="user.pointsQRCode || generatePointsQRCode()"
            title=""
            subtitle=""
            :instructions="'Show this QR code when making a purchase to earn points'"
            size="medium"
          />
        </div>
        -->

        <!-- Settings Section -->
       <!-- <div class="settings-section">
          <h3 class="settings-title">Account & App Settings</h3>
          <p class="settings-description">Manage your profile information and app preferences</p>

          <div class="settings-buttons">
            <button class="settings-btn profile-settings-btn" @click="$emit('setCurrentPage', 'ProfileSettings')">
              👤 Profile Settings
            </button>
            <button class="settings-btn app-settings-btn" @click="$emit('setCurrentPage', 'Settings')">
              ⚙️ App Settings
            </button>
          </div>
        </div>-->

        <div class="settings-section">
          <h3 class="settings-title">Orders & Payments</h3>
          <p class="settings-description">View your order history and payment transactions</p>

          <div class="settings-buttons">
            <button class="settings-btn order-history-btn" @click="$emit('setCurrentPage', 'OrderHistory')">
              📦 Order History
            </button>
            <button class="settings-btn payment-history-btn" @click="$emit('setCurrentPage', 'PaymentHistory')">
              💳 Payment History
            </button>
          </div>
        </div>

      </div>
    </div>

    <VoucherModal 
      :voucher="selectedVoucher"
      :isVisible="showVoucherModal"
      @close="closeVoucherModal"
      @useVoucher="handleUseVoucher"
      @saveVoucher="handleSaveVoucher"
      @removeVoucher="handleRemoveVoucher"
    />
  </div>
</template>

<script>
import VoucherModal from './VoucherModal.vue'

export default {
  name: 'Profile',
  components: {
    VoucherModal
  },
  emits: ['setCurrentPage'],
  data() {
    return {
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        points: 3280,
        loyalty_points: 0,
        vouchers: []
      },
      showVoucherModal: false,
      selectedVoucher: {},
      showAllVouchersFlag: false,
      isDarkMode: false,
      avatarHover: false
    }
  },

  computed: {
    displayedVouchers() {
      return this.showAllVouchersFlag
        ? this.user.vouchers
        : this.user.vouchers.slice(0, 2)
    }
  },

  mounted() {
    this.loadUserData()
    this.loadDarkModePreference()
    this.fetchCurrentUser()
    this.loadSavedVouchers()
  },

  activated() {
    this.fetchCurrentUser()
  },

  watch: {
    'user.loyalty_points'(newPoints, oldPoints) {
      console.log('🔄 Profile loyalty points changed:', { old: oldPoints, new: newPoints })
      this.$forceUpdate()
    },
    '$root.isDarkMode'(newVal) {
      this.isDarkMode = newVal
    }
  },

  methods: {
    // -----------------------------
    // DARK MODE (Restored)
    // -----------------------------
    loadDarkModePreference() {
      const darkMode = localStorage.getItem('ramyeon_dark_mode')
      this.isDarkMode = darkMode === 'true'
    },

    // -----------------------------
    // USER SESSION / PROFILE LOGIC
    // -----------------------------
    loadUserData() {
      const userSession = localStorage.getItem('ramyeon_user_session')
      if (userSession) {
        const userData = JSON.parse(userSession)
        this.user = {
          ...userData,
          vouchers: []
        }
      } else {
        this.user = {
          firstName: 'Guest',
          lastName: 'User',
          email: 'guest@ramyeoncorner.com',
          points: 3280,
          vouchers: []
        }
      }
    },

    loadSavedVouchers() {
      const savedVouchers = JSON.parse(localStorage.getItem('ramyeon_saved_vouchers') || '[]')
      this.user.vouchers = savedVouchers
    },

    async fetchCurrentUser() {
      try {
        console.log('🔍 Fetching profile...')

        const token = localStorage.getItem('access_token')
        if (!token) {
          console.log('⚠️ No token - guest mode')
          return
        }

        const { authAPI } = await import('../services/api.js')
        const response = await authAPI.getProfile()

        let user = response.customer ? response.customer : response

        const first = user.first_name || user.firstName || (user.full_name?.split(' ')[0])
        const last = user.last_name || user.lastName || (user.full_name?.split(' ').slice(1).join(' ') || '')

        this.user = {
          ...this.user,
          firstName: first || this.user.firstName,
          lastName: last || this.user.lastName,
          email: user.email || this.user.email,
          loyalty_points: user.loyalty_points || 0
        }

      } catch (e) {
        console.error('❌ Profile fetch error:', e)
        this.user.loyalty_points = 50 // fallback
      }
    },

    // -----------------------------
    // VOUCHER MODAL HANDLERS
    // -----------------------------
    openVoucherModal(voucher) {
      this.selectedVoucher = voucher
      this.showVoucherModal = true
    },

    closeVoucherModal() {
      this.showVoucherModal = false
      this.selectedVoucher = {}
    },

    handleUseVoucher(voucher) {
      console.log('Using voucher:', voucher)
      this.showMessage('Voucher applied successfully!', 'success')
      this.user.vouchers = this.user.vouchers.filter(v => v.id !== voucher.id)

      const saved = JSON.parse(localStorage.getItem('ramyeon_saved_vouchers') || '[]')
      localStorage.setItem(
        'ramyeon_saved_vouchers',
        JSON.stringify(saved.filter(v => v.id !== voucher.id))
      )
    },

    handleSaveVoucher() {
      this.showMessage('Voucher saved for later!', 'info')
      this.loadSavedVouchers()
    },

    handleRemoveVoucher(voucher) {
      this.user.vouchers = this.user.vouchers.filter(v => v.id !== voucher.id)
      this.showMessage('Voucher removed!', 'info')
      this.closeVoucherModal()
    },

    showAllVouchers() {
      this.showAllVouchersFlag = !this.showAllVouchersFlag
    },

    // -----------------------------
    // SMALL UTILS
    // -----------------------------
    getVoucherIcon(title) {
      const icons = {
        'Shin Ramyun': '🍜',
        'Fish Cake': '🍢',
        'Welcome Bonus': '🎉',
        'Social Signup Bonus': '🎁',
        'Tteokbokki': '🌶️',
        'Kimchi': '🥬',
        default: '🎫'
      }
      return icons[title] || icons.default
    },

    showMessage(text, type) {
      const msg = document.createElement('div')
      msg.className = `message ${type}`
      msg.textContent = text
      msg.style.position = 'fixed'
      msg.style.top = '20px'
      msg.style.right = '20px'
      msg.style.padding = '15px 20px'
      msg.style.zIndex = '9999'
      msg.style.borderRadius = '8px'
      msg.style.fontWeight = '600'

      document.body.appendChild(msg)

      setTimeout(() => {
        if (msg.parentNode) msg.remove()
      }, 3000)
    }
  }
}
</script>



<style src="./Profile.css" scoped></style>

<style scoped>
/* Additional futuristic animations */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100px);
  }
}

/* Message notifications */
.message {
  padding: 18px 25px;
  border-radius: 15px;
  font-weight: 600;
  backdrop-filter: blur(20px);
  border: 1px solid;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.message.success {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border-color: rgba(40, 167, 69, 0.3);
}

.message.error {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  border-color: rgba(220, 53, 69, 0.3);
}

.message.info {
  background: linear-gradient(135deg, #ff6f61, #ff8a80);
  color: white;
  border-color: rgba(255, 111, 97, 0.3);
}

/* Loyalty Points Section */
.loyalty-points-section {
  background: linear-gradient(135deg, #fff8e1, #ffecb3);
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 30px;
  border: 2px solid #ffb74d;
  box-shadow: 0 8px 25px rgba(255, 152, 0, 0.15);
}

.points-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.points-balance {
  display: flex;
  align-items: center;
  gap: 20px;
}

.points-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff9800, #f57c00);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
}

.points-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.points-unit {
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.9;
}

.points-value-display {
  text-align: center;
}

.points-peso-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #e65100;
  line-height: 1;
}

.points-value-label {
  font-size: 0.9rem;
  color: #bf360c;
  font-weight: 500;
}

.points-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.promotions-btn,
.points-history-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.promotions-btn {
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
}

.promotions-btn:hover {
  background: linear-gradient(135deg, #ff3742, #ff2f3a);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.3);
}

.points-history-btn {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
}

.points-history-btn:hover {
  background: linear-gradient(135deg, #f57c00, #ef6c00);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 152, 0, 0.3);
}

.points-info {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 15px;
  border: 1px solid rgba(255, 152, 0, 0.2);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 152, 0, 0.1);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #e65100;
  font-size: 0.9rem;
}

.info-value {
  font-weight: 500;
  color: #bf360c;
  font-size: 0.9rem;
}

/* Smooth hover effect */
.promotions-btn {
  transition: all 0.3s ease;
}

/* Responsive enhancements */
@media (max-width: 480px) {
  .voucher-icon {
    width: 60px;
    height: 60px;
    font-size: 1.8rem;
  }
  
  .voucher-title {
    font-size: 1.2rem;
  }
  
  .voucher-subtitle {
    font-size: 0.85rem;
  }
  
  .voucher-discount {
    font-size: 0.9rem;
    padding: 8px 16px;
  }
  
  .empty-icon {
    font-size: 4rem;
  }
}
</style>
