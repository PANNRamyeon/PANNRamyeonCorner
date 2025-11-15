<template>
  <div class="order-status-tracker">
    <!-- Current Status Badge -->
    <div class="current-status" :class="`status-${statusInfo.color}`">
      <span class="status-icon">{{ statusInfo.icon }}</span>
      <span class="status-label">{{ statusInfo.label }}</span>
    </div>

    <!-- Status Description -->
    <p class="status-description">{{ statusInfo.description }}</p>

    <!-- Progress Bar -->
    <div class="progress-container">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${statusInfo.progress}%` }"
          :class="`progress-${statusInfo.color}`"
        ></div>
      </div>
      <span class="progress-text">{{ statusInfo.progress }}% Complete</span>
    </div>

    <!-- Status Timeline (if history available) -->
    <div v-if="showHistory && statusHistory && statusHistory.length > 0" class="status-timeline">
      <h4>Order Timeline</h4>
      <div class="timeline">
        <div 
          v-for="(entry, index) in statusHistory" 
          :key="index"
          class="timeline-entry"
        >
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-status">
              {{ getStatusLabel(entry.status) }}
            </div>
            <div class="timeline-time">
              {{ formatDate(entry.timestamp) }}
            </div>
            <div v-if="entry.notes" class="timeline-notes">
              {{ entry.notes }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Refresh Button -->
    <button 
      v-if="showRefresh"
      @click="refreshStatus" 
      class="refresh-button"
      :disabled="isRefreshing"
    >
      <span v-if="!isRefreshing">🔄 Refresh Status</span>
      <span v-else>⏳ Refreshing...</span>
    </button>
  </div>
</template>

<script>
import { ordersAPI } from '../services/api.js';

export default {
  name: 'OrderStatusTracker',
  props: {
    orderId: {
      type: String,
      required: true
    },
    currentStatus: {
      type: String,
      default: 'pending'
    },
    showHistory: {
      type: Boolean,
      default: false
    },
    showRefresh: {
      type: Boolean,
      default: false
    },
    autoRefresh: {
      type: Boolean,
      default: false
    },
    refreshInterval: {
      type: Number,
      default: 30000 // 30 seconds
    }
  },
  data() {
    return {
      status: this.currentStatus,
      statusHistory: [],
      isRefreshing: false,
      refreshTimer: null,
      isMounted: false,
      orderNotFound: false // Track if order doesn't exist in backend
    };
  },
  computed: {
    statusInfo() {
      return this.getStatusInfo(this.status);
    }
  },
  watch: {
    // Watch for prop changes to update local status
    currentStatus(newStatus) {
      if (newStatus && newStatus !== this.status) {
        this.status = newStatus;
      }
    },
    // Watch autoRefresh prop changes
    autoRefresh(newValue) {
      if (this.isMounted) {
        if (newValue) {
          this.setupAutoRefresh();
        } else {
          this.clearAutoRefresh();
        }
      }
    }
  },
  mounted() {
    this.isMounted = true;
    
    // Fetch full status if showHistory is enabled
    if (this.showHistory) {
      this.fetchStatus();
    }

    // Setup auto-refresh
    if (this.autoRefresh) {
      this.setupAutoRefresh();
    }
  },
  beforeUnmount() {
    this.isMounted = false;
    // Clean up timer
    this.clearAutoRefresh();
  },
  methods: {
    getStatusInfo(statusCode) {
      const statusMap = {
        'pending': {
          label: 'Order Pending',
          description: 'Your order has been placed and is waiting for confirmation',
          icon: '🕐',
          color: 'yellow',
          progress: 10
        },
        'confirmed': {
          label: 'Order Confirmed',
          description: 'Your order has been confirmed and will be prepared soon',
          icon: '✅',
          color: 'blue',
          progress: 20
        },
        'preparing': {
          label: 'Preparing Order',
          description: 'We are gathering your items',
          icon: '📦',
          color: 'blue',
          progress: 40
        },
        'cooking': {
          label: 'Cooking',
          description: 'Your food is being prepared in our kitchen',
          icon: '👨‍🍳',
          color: 'orange',
          progress: 60
        },
        'ready': {
          label: 'Ready for Pickup/Delivery',
          description: 'Your order is ready!',
          icon: '✨',
          color: 'green',
          progress: 80
        },
        'out_for_delivery': {
          label: 'Out for Delivery',
          description: 'Your order is on the way to you',
          icon: '🚚',
          color: 'blue',
          progress: 90
        },
        'delivered': {
          label: 'Delivered',
          description: 'Your order has been delivered',
          icon: '📦',
          color: 'green',
          progress: 95
        },
        'completed': {
          label: 'Completed',
          description: 'Order completed successfully',
          icon: '🎉',
          color: 'green',
          progress: 100
        },
        'cancelled': {
          label: 'Cancelled',
          description: 'This order has been cancelled',
          icon: '❌',
          color: 'red',
          progress: 0
        }
      };

      return statusMap[statusCode] || {
        label: 'Unknown Status',
        description: 'Status information not available',
        icon: '❓',
        color: 'gray',
        progress: 0
      };
    },

    getStatusLabel(statusCode) {
      return this.getStatusInfo(statusCode).label;
    },

    async fetchStatus() {
      // Don't fetch if component is unmounted
      if (!this.isMounted) return;
      
      // Validate orderId before fetching
      if (!this.orderId || this.orderId === 'undefined' || this.orderId === 'null') {
        console.warn('⚠️ Invalid orderId, skipping status fetch:', this.orderId);
        return;
      }
      
      try {
        const result = await ordersAPI.getStatus(this.orderId);
        
        // Check again in case component unmounted during async call
        if (!this.isMounted) return;
        
        if (result.success && result.data) {
          this.status = result.data.current_status;
          this.statusHistory = result.data.status_history || [];
          
          // Emit status update event
          this.$emit('status-updated', {
            orderId: this.orderId,
            status: this.status,
            statusInfo: result.data.status_info
          });
        } else if (result.error) {
          // If order not found, disable auto-refresh to prevent repeated 404s
          if (result.error === 'Order not found') {
            this.orderNotFound = true;
            this.clearAutoRefresh(); // Stop trying to refresh
            return;
          }
          // Only log if it's not a 404 (order not found is expected for old/localStorage orders)
          if (result.error !== 'Not authenticated') {
            console.warn('Failed to fetch order status:', result.error);
          }
        }
      } catch (error) {
        // Don't log 404 errors as they're expected for orders that don't exist in backend
        if (error.response?.status === 404) {
          // Order doesn't exist in backend (probably from localStorage)
          this.orderNotFound = true;
          this.clearAutoRefresh(); // Stop trying to refresh
          return;
        }
        // Only log other errors
        if (error.response?.status !== 404) {
          console.error('Error fetching order status:', error);
        }
      }
    },

    async refreshStatus() {
      if (this.isRefreshing) return; // Prevent double-refresh
      
      this.isRefreshing = true;
      await this.fetchStatus();
      
      // Use requestAnimationFrame for smoother UI update
      if (this.isMounted) {
        setTimeout(() => {
          if (this.isMounted) {
            this.isRefreshing = false;
          }
        }, 500);
      }
    },

    setupAutoRefresh() {
      // Clear existing timer first
      this.clearAutoRefresh();
      
      // Don't setup auto-refresh if order was not found (404)
      if (this.orderNotFound) {
        return;
      }
      
      // Only setup if interval is valid
      if (this.refreshInterval > 0) {
        this.refreshTimer = setInterval(() => {
          if (this.isMounted && !this.orderNotFound) {
            this.fetchStatus();
          }
        }, this.refreshInterval);
      }
    },
    
    clearAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    },

    formatDate(dateString) {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return dateString;
      }
    }
  }
};
</script>

<style scoped>
.order-status-tracker {
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Current Status Badge */
.current-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 12px;
}

.status-yellow {
  background: #fef3c7;
  color: #92400e;
}

.status-blue {
  background: #dbeafe;
  color: #1e40af;
}

.status-orange {
  background: #fed7aa;
  color: #9a3412;
}

.status-green {
  background: #d1fae5;
  color: #065f46;
}

.status-red {
  background: #fee2e2;
  color: #991b1b;
}

.status-gray {
  background: #f3f4f6;
  color: #4b5563;
}

.status-icon {
  font-size: 20px;
}

.status-label {
  font-size: 16px;
}

/* Status Description */
.status-description {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 20px;
}

/* Progress Bar */
.progress-container {
  margin-bottom: 24px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
}

.progress-yellow {
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
}

.progress-blue {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
}

.progress-orange {
  background: linear-gradient(90deg, #fb923c 0%, #f97316 100%);
}

.progress-green {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.progress-red {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.progress-text {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

/* Status Timeline */
.status-timeline {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.status-timeline h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.timeline {
  position: relative;
  padding-left: 32px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.timeline-entry {
  position: relative;
  margin-bottom: 20px;
}

.timeline-entry:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -28px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b82f6;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #3b82f6;
}

.timeline-content {
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
}

.timeline-status {
  font-weight: 600;
  color: #111827;
  font-size: 14px;
  margin-bottom: 4px;
}

.timeline-time {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.timeline-notes {
  font-size: 13px;
  color: #4b5563;
  font-style: italic;
}

/* Refresh Button */
.refresh-button {
  width: 100%;
  padding: 12px;
  margin-top: 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-button:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .order-status-tracker {
    padding: 16px;
  }

  .current-status {
    padding: 10px 16px;
    font-size: 14px;
  }

  .status-icon {
    font-size: 18px;
  }
}
</style>

