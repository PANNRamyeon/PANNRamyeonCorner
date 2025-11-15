<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>{{ voucher.title }}</h2>
        <button class="close-btn" @click="closeModal" aria-label="Close modal">
          ✕
        </button>
      </div>
      
      <div class="modal-content">
        <div class="voucher-details">
          <div class="voucher-info">
            <h3>{{ voucher.subtitle }}</h3>
            <div class="discount-badge">
              {{ voucher.discount }}
            </div>
            <p class="voucher-description">
              {{ getVoucherDescription() }}
            </p>
          </div>
          
         <!-- <div class="voucher-tabs">
            <button 
              :class="['tab-btn', { active: activeTab === 'qr' }]"
              @click="activeTab = 'qr'"
            >
              QR Code
            </button>
            <button 
              :class="['tab-btn', { active: activeTab === 'code' }]"
              @click="activeTab = 'code'"
            >
              Text Code
            </button>
          </div>-->
          
         <!-- <div class="tab-content">
           <div v-if="activeTab === 'qr'" class="qr-tab">
              <QRCode 
                :code="voucher.qrCode"
                :title="'Scan to Redeem'"
                :subtitle="voucher.title"
                :instructions="'Show this QR code to the cashier to apply your discount'"
                size="large"
              />
            </div>
            
            <div v-if="activeTab === 'code'" class="code-tab">
              <div class="text-code-display">
                <h4>Promo Code</h4>
                <div class="code-container">
                  <span class="promo-code">{{ voucher.code }}</span>
                  <button 
                    class="copy-code-btn"
                    @click="copyCode"
                    :class="{ 'copied': isCopied }"
                  >
                    {{ isCopied ? '✓ Copied!' : '📋 Copy' }}
                  </button>
                </div>
                <p class="code-instructions">
                  Enter this code at checkout or mention it when placing your order
                </p>
              </div>
            </div>
          </div>-->
          
         <!-- <div class="voucher-terms">
            <h4>Terms & Conditions</h4>
            <ul>
              <li>Valid for {{ getValidityPeriod() }}</li>
              <li>Cannot be combined with other offers</li>
              <li>Minimum order value may apply</li>
              <li>Valid for dine-in, takeout, and delivery</li>
              <li>One use per customer</li>
            </ul>
          </div>-->
          
          <div class="modal-actions">
            <button class="use-voucher-btn" @click="useVoucher" :disabled="isUsing">
              <span v-if="!isUsing" class="btn-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                </svg>
                Use This Voucher
              </span>
              <span v-else class="btn-content">
                <div class="loading-spinner"></div>
                Using...
              </span>
            </button>
            
            <button class="save-voucher-btn" @click="saveVoucher" :disabled="isSaving" :class="{ 'saved': isSaved }">
              <span v-if="!isSaving && !isSaved" class="btn-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Save for Later
              </span>
              <span v-else-if="isSaving" class="btn-content">
                <div class="loading-spinner"></div>
                Saving...
              </span>
              <span v-else class="btn-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Saved!
              </span>
            </button>
            
            <button v-if="isSaved" class="remove-voucher-btn" @click="removeVoucher" :disabled="isRemoving">
              <span v-if="!isRemoving" class="btn-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Remove
              </span>
              <span v-else class="btn-content">
                <div class="loading-spinner"></div>
                Removing...
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import QRCode from './QRCode.vue'  <!-- QR HIDDEN -->

export default {
  name: 'VoucherModal',
  components: {
    // QRCode    <!-- QR HIDDEN -->
  },
  props: {
    voucher: {
      type: Object,
      required: true,
      default: () => ({
        id: 0,
        title: '',
        subtitle: '',
        discount: '',
        code: '',
        // qrCode: ''   <!-- QR HIDDEN -->
      })
    },
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'useVoucher', 'saveVoucher'],
  data() {
    return {
      // activeTab: 'qr',   <!-- QR HIDDEN -->
      activeTab: '',        // to avoid showing QR tab
      isCopied: false,
      isSaved: false,
      isUsing: false,
      isSaving: false,
      isRemoving: false
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        // Reset state when modal opens
        // this.activeTab = 'qr';   <!-- QR HIDDEN -->
        this.activeTab = '';
        this.isCopied = false;
        this.checkIfSaved();

        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },

    async copyCode() {
      try {
        await navigator.clipboard.writeText(this.voucher.code);
        this.isCopied = true;
        setTimeout(() => { this.isCopied = false }, 2000);
      } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = this.voucher.code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        this.isCopied = true;
        setTimeout(() => { this.isCopied = false }, 2000);
      }
    },

    async useVoucher() {
      this.isUsing = true;

      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        this.$emit('useVoucher', this.voucher);
        this.closeModal();
      } catch (error) {
        console.error('Error using voucher:', error);
      } finally {
        this.isUsing = false;
      }
    },

    async saveVoucher() {
      if (!this.isSaved) {
        this.isSaving = true;

        try {
          await new Promise(resolve => setTimeout(resolve, 1000));

          const savedVouchers = JSON.parse(localStorage.getItem('ramyeon_saved_vouchers') || '[]');
          const exists = savedVouchers.find(v => v.id === this.voucher.id);

          if (!exists) {
            savedVouchers.push({
              ...this.voucher,
              savedAt: new Date().toISOString()
            });
            localStorage.setItem('ramyeon_saved_vouchers', JSON.stringify(savedVouchers));
          }

          this.isSaved = true;
          this.$emit('saveVoucher', this.voucher);

        } catch (error) {
          console.error('Error saving voucher:', error);
        } finally {
          this.isSaving = false;
        }
      }
    },

    async removeVoucher() {
      this.isRemoving = true;

      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const savedVouchers = JSON.parse(localStorage.getItem('ramyeon_saved_vouchers') || '[]');
        const updated = savedVouchers.filter(v => v.id !== this.voucher.id);
        localStorage.setItem('ramyeon_saved_vouchers', JSON.stringify(updated));

        this.isSaved = false;
        this.$emit('removeVoucher', this.voucher);

      } catch (error) {
        console.error('Error removing voucher:', error);
      } finally {
        this.isRemoving = false;
      }
    },

    checkIfSaved() {
      const savedVouchers = JSON.parse(localStorage.getItem('ramyeon_saved_vouchers') || '[]');
      this.isSaved = savedVouchers.some(v => v.id === this.voucher.id);
    },

    getVoucherDescription() {
      const descriptions = {
        'Welcome Bonus': 'Get 25% off your first order! Perfect way to try our delicious ramyeon.',
        'Shin Ramyun': 'Enjoy 20% off our signature spicy noodle dish - a customer favorite!',
        'Fish Cake': 'Save 15% on our crispy and flavorful fish cake side dish.',
        'Social Signup Bonus': 'Thank you for joining us through social media! Enjoy 30% off.',
        'default': `Enjoy ${this.voucher.discount} on ${this.voucher.title}. Don't miss out on this great deal!`
      };

      return descriptions[this.voucher.title] || descriptions.default;
    },

    getValidityPeriod() {
      const periods = {
        'Welcome Bonus': '30 days from signup',
        'Shin Ramyun': '14 days from issue',
        'Fish Cake': '7 days from issue',
        'Social Signup Bonus': '30 days from signup',
        'default': '30 days from issue'
      };

      return periods[this.voucher.title] || periods.default;
    }
  },

  beforeUnmount() {
    document.body.style.overflow = '';
  }
}
</script>


<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease-out;
}

.modal-container {
  background: white;
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px 20px;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border-radius: 20px 20px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.modal-content {
  padding: 30px;
}

.voucher-details {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.voucher-info {
  text-align: center;
}

.voucher-info h3 {
  font-size: 1.4rem;
  color: #333;
  margin: 0 0 15px 0;
  font-weight: 600;
}

.discount-badge {
  display: inline-block;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  padding: 12px 25px;
  border-radius: 25px;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 15px;
  box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
}

.voucher-description {
  color: #666;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
}

.voucher-tabs {
  display: flex;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.tab-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
}

.tab-btn.active {
  background: white;
  color: #ff4757;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-btn:hover:not(.active) {
  background: rgba(255, 71, 87, 0.1);
  color: #ff4757;
}

.tab-content {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-tab {
  width: 100%;
  display: flex;
  justify-content: center;
}

.code-tab {
  width: 100%;
  text-align: center;
}

.text-code-display h4 {
  font-size: 1.3rem;
  color: #333;
  margin: 0 0 20px 0;
  font-weight: 600;
}

.code-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.promo-code {
  font-family: 'Courier New', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: #ff4757;
  background: #f8f9fa;
  padding: 15px 25px;
  border-radius: 12px;
  border: 2px dashed #ff4757;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.copy-code-btn {
  background: #ff4757;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.copy-code-btn:hover {
  background: #ff3742;
  transform: translateY(-2px);
}

.copy-code-btn.copied {
  background: #00b894;
  transform: scale(1.05);
}

.code-instructions {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}

.voucher-terms {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #ff4757;
}

.voucher-terms h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.voucher-terms ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.6;
}

.voucher-terms li {
  margin-bottom: 5px;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.use-voucher-btn,
.save-voucher-btn,
.remove-voucher-btn {
  padding: 15px 30px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
  position: relative;
  overflow: hidden;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.use-voucher-btn {
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
}

.use-voucher-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 71, 87, 0.3);
}

.use-voucher-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.save-voucher-btn {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e9ecef;
}

.save-voucher-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #dee2e6;
  transform: translateY(-2px);
}

.save-voucher-btn.saved {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.save-voucher-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.remove-voucher-btn {
  background: #f8d7da;
  color: #721c24;
  border: 2px solid #f5c6cb;
}

.remove-voucher-btn:hover:not(:disabled) {
  background: #f1b0b7;
  border-color: #ef808a;
  transform: translateY(-2px);
}

.remove-voucher-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: currentColor;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dark mode support */
.dark-mode .modal-container {
  background: #2d2d2d;
  color: #f5f5f5;
}

.dark-mode .modal-header {
  border-bottom-color: #4a4a4a;
}

.dark-mode .voucher-info h3 {
  color: #f5f5f5;
}

.dark-mode .voucher-description {
  color: #b8b8b8;
}

.dark-mode .voucher-tabs {
  background: #3a3a3a;
}

.dark-mode .tab-btn {
  color: #b8b8b8;
}

.dark-mode .tab-btn.active {
  background: #4a4a4a;
  color: #ff4757;
}

.dark-mode .text-code-display h4 {
  color: #f5f5f5;
}

.dark-mode .promo-code {
  background: #3a3a3a;
  color: #ff4757;
}

.dark-mode .code-instructions {
  color: #b8b8b8;
}

.dark-mode .voucher-terms {
  background: #3a3a3a;
}

.dark-mode .voucher-terms h4 {
  color: #f5f5f5;
}

.dark-mode .voucher-terms ul {
  color: #b8b8b8;
}

.dark-mode .save-voucher-btn {
  background: #3a3a3a;
  color: #b8b8b8;
  border-color: #4a4a4a;
}

.dark-mode .save-voucher-btn:hover {
  background: #4a4a4a;
  border-color: #5a5a5a;
}

/* Responsive design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-container {
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 20px 25px 15px;
  }
  
  .modal-header h2 {
    font-size: 1.5rem;
  }
  
  .modal-content {
    padding: 25px 20px;
  }
  
  .voucher-details {
    gap: 20px;
  }
  
  .promo-code {
    font-size: 1.5rem;
    padding: 12px 20px;
  }
  
  .code-container {
    flex-direction: column;
    gap: 10px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .use-voucher-btn,
  .save-voucher-btn {
    min-width: auto;
    width: 100%;
  }
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Scrollbar styling for modal content */
.modal-container::-webkit-scrollbar {
  width: 6px;
}

.modal-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.modal-container::-webkit-scrollbar-thumb {
  background: #ff4757;
  border-radius: 3px;
}

.modal-container::-webkit-scrollbar-thumb:hover {
  background: #ff3742;
}
</style>
