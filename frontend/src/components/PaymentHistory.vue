<template>
  <div class="payment-history-container">
    <div class="payment-history-header">
      <h1>💳 Payment History</h1>
      <p>View all your payment attempts and transactions</p>
    </div>

    <!-- Filter Options -->
    <div class="filter-section">
      <div class="filter-group">
        <label>Filter by Status:</label>
        <select v-model="statusFilter">
          <option value="all">All</option>
          <option value="succeeded">Successful</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="redirected">Redirected</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Filter by Method:</label>
        <select v-model="methodFilter">
          <option value="all">All Methods</option>
          <option value="cash">Cash</option>
          <option value="gcash">GCash</option>
          <option value="paymaya">PayMaya</option>
          <option value="card">Card</option>
          <option value="grabpay">GrabPay</option>
        </select>
      </div>
    </div>

    <!-- Payment Statistics -->
    <div class="statistics">
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <h3>{{ statistics.successful }}</h3>
          <p>Successful Payments</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-info">
          <h3>{{ statistics.failed }}</h3>
          <p>Failed Payments</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>₱{{ statistics.totalPaid.toFixed(2) }}</h3>
          <p>Total Paid</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <h3>{{ statistics.totalAttempts }}</h3>
          <p>Total Attempts</p>
        </div>
      </div>
    </div>

    <!-- Payment Attempts List -->
    <div v-if="filteredPayments.length > 0" class="payments-list">
      <div v-for="payment in filteredPayments" :key="payment.timestamp + payment.orderId" class="payment-card">
        <div class="payment-header">
          <div class="payment-info">
            <h3>{{ payment.orderId }}</h3>
            <span class="payment-date">{{ formatDate(payment.timestamp) }}</span>
          </div>
          <div class="payment-status" :class="'status-' + payment.status">
            {{ formatStatus(payment.status) }}
          </div>
        </div>

        <div class="payment-details">
          <div class="detail-item">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">{{ formatMethod(payment.method) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Amount:</span>
            <span class="detail-value amount">₱{{ payment.amount.toFixed(2) }}</span>
          </div>
          <div class="detail-item" v-if="payment.error">
            <span class="detail-label">Error:</span>
            <span class="detail-value error">{{ payment.error }}</span>
          </div>
        </div>

        <div class="payment-icon-display">
          {{ getMethodIcon(payment.method) }}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">💳</div>
      <h2>No Payment History</h2>
      <p>Your payment attempts will appear here</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PaymentHistory',
  data() {
    return {
      payments: [],
      statusFilter: 'all',
      methodFilter: 'all'
    };
  },
  computed: {
    filteredPayments() {
      let filtered = [...this.payments];

      if (this.statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === this.statusFilter);
      }

      if (this.methodFilter !== 'all') {
        filtered = filtered.filter(p => p.method === this.methodFilter);
      }

      // Sort by date, newest first
      return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },
    statistics() {
      const stats = {
        successful: 0,
        failed: 0,
        totalPaid: 0,
        totalAttempts: this.payments.length
      };

      // Calculate from payment attempts
      this.payments.forEach(payment => {
        if (payment.status === 'succeeded') {
          stats.successful++;
        } else if (payment.status === 'failed' || payment.status === 'cancelled') {
          stats.failed++;
        }
      });

      // Calculate TOTAL PAID from actual completed orders (more accurate!)
      try {
        // Check all user-specific orders
        const userOrderKeys = Object.keys(localStorage).filter(k => k.startsWith('ramyeon_orders_'));
        let allOrders = [];
        
        userOrderKeys.forEach(key => {
          try {
            const orders = JSON.parse(localStorage.getItem(key) || '[]');
            allOrders = allOrders.concat(orders);
          } catch (e) {
            console.error('Error parsing orders:', e);
          }
        });
        
        // Also check global orders
        try {
          const globalOrders = JSON.parse(localStorage.getItem('ramyeon_orders') || '[]');
          allOrders = allOrders.concat(globalOrders);
        } catch (e) {
          console.error('Error parsing global orders:', e);
        }
        
        // Remove duplicates (same order ID)
        const uniqueOrders = allOrders.reduce((acc, order) => {
          if (!acc.find(o => o.id === order.id)) {
            acc.push(order);
          }
          return acc;
        }, []);
        
        // Sum up only PAID orders (status: confirmed or paymentStatus: succeeded)
        stats.totalPaid = uniqueOrders
          .filter(order => 
            order.paymentStatus === 'succeeded' || 
            order.status === 'confirmed' ||
            (order.paymentMethod !== 'cash' && order.status !== 'pending')
          )
          .reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
          
        console.log('💰 Total Paid calculated from orders:', stats.totalPaid);
        console.log('📦 Paid orders:', uniqueOrders.filter(o => 
          o.paymentStatus === 'succeeded' || 
          o.status === 'confirmed'
        ));
      } catch (error) {
        console.error('Error calculating total paid from orders:', error);
        // Fallback to payment history if orders calculation fails
        this.payments.forEach(payment => {
          if (payment.status === 'succeeded') {
            stats.totalPaid += payment.amount;
          }
        });
      }

      return stats;
    }
  },
  methods: {
    loadPaymentHistory() {
      try {
        // Get the current logged-in user session
        const userSession = JSON.parse(localStorage.getItem('ramyeon_user_session') || '{}');

        // If no user session found → no payment history
        if (!userSession.id) {
          this.payments = [];
          return;
        }

        // Use per-user payment history key
        const key = `ramyeon_payment_history_${userSession.id}`;

        // Load payment history for ONLY this user
        const savedPayments = localStorage.getItem(key);

        this.payments = savedPayments ? JSON.parse(savedPayments) : [];

      } catch (error) {
        console.error('Error loading payment history:', error);
        this.payments = [];
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    formatStatus(status) {
      const statusMap = {
        'initiated': 'Initiated',
        'redirected': 'Redirected to Payment',
        'succeeded': 'Payment Successful',
        'failed': 'Payment Failed',
        'cancelled': 'Payment Cancelled'
      };
      return statusMap[status] || status;
    },
    formatMethod(method) {
      const methodMap = {
        'cash': 'Cash on Delivery',
        'gcash': 'GCash',
        'paymaya': 'PayMaya',
        'card': 'Credit/Debit Card',
        'grabpay': 'GrabPay QR'
      };
      return methodMap[method] || method;
    },
    getMethodIcon(method) {
      const iconMap = {
        'cash': '💵',
        'gcash': '📱',
        'paymaya': '🏦',
        'card': '💳',
        'grabpay': '🎯'
      };
      return iconMap[method] || '💰';
    }
  },
  mounted() {
    this.loadPaymentHistory();
  }
};
</script>

<style scoped>
.payment-history-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #fff5f0 0%, #ffe6d9 100%);
}

.payment-history-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 30px 20px;
  background: linear-gradient(135deg, #ff6b35 0%, #ff4757 100%);
  border-radius: 20px;
  color: white;
  box-shadow: 0 4px 20px rgba(255, 71, 87, 0.3);
}

.payment-history-header h1 {
  margin: 0;
  font-size: 2.5em;
  font-weight: 700;
}

.payment-history-header p {
  margin: 10px 0 0 0;
  opacity: 0.9;
}

.filter-section {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-weight: 600;
  color: #2d3436;
  font-size: 0.95em;
}

.filter-group select {
  padding: 10px 15px;
  border: 2px solid #dfe6e9;
  border-radius: 10px;
  font-size: 1em;
  cursor: pointer;
  transition: border-color 0.3s ease;
  background: white;
}

.filter-group select:focus {
  outline: none;
  border-color: #ff4757;
}

.statistics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 3em;
}

.stat-info h3 {
  margin: 0;
  font-size: 2em;
  color: #ff4757;
}

.stat-info p {
  margin: 5px 0 0 0;
  color: #636e72;
  font-size: 0.9em;
}

.payments-list {
  display: grid;
  gap: 15px;
}

.payment-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.payment-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.payment-icon-display {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 4em;
  opacity: 0.1;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.payment-info h3 {
  margin: 0;
  color: #2d3436;
  font-size: 1.2em;
}

.payment-date {
  color: #636e72;
  font-size: 0.9em;
}

.payment-status {
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85em;
}

.status-initiated {
  background: #dfe6e9;
  color: #636e72;
}

.status-redirected {
  background: #a29bfe;
  color: #6c5ce7;
}

.status-succeeded {
  background: #55efc4;
  color: #00b894;
}

.status-failed,
.status-cancelled {
  background: #fab1a0;
  color: #e17055;
}

.payment-details {
  display: grid;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  color: #636e72;
  font-weight: 500;
}

.detail-value {
  color: #2d3436;
  font-weight: 600;
}

.detail-value.amount {
  color: #ff4757;
  font-size: 1.1em;
}

.detail-value.error {
  color: #e17055;
  font-size: 0.9em;
  max-width: 300px;
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 5em;
  margin-bottom: 20px;
}

.empty-state h2 {
  color: #2d3436;
  margin: 0 0 10px 0;
}

.empty-state p {
  color: #636e72;
  margin: 0;
}

@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
  }

  .statistics {
    grid-template-columns: 1fr;
  }

  .detail-value.error {
    max-width: 150px;
    font-size: 0.8em;
  }
}
</style>


