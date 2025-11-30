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
import { ordersAPI } from "../services/api.js";

export default {
  name: "PaymentHistory",
  data() {
    return {
      payments: [],
      statusFilter: "all",
      methodFilter: "all"
    };
  },

  computed: {
    filteredPayments() {
      let filtered = [...this.payments];

      if (this.statusFilter !== "all") {
        filtered = filtered.filter(p => p.status === this.statusFilter);
      }

      if (this.methodFilter !== "all") {
        filtered = filtered.filter(p => p.method === this.methodFilter);
      }

      return filtered.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
    },

    statistics() {
      return {
        successful: this.payments.filter(p => p.status === "succeeded").length,
        failed: this.payments.filter(p => p.status === "failed" || p.status === "cancelled").length,
        totalAttempts: this.payments.length,
        totalPaid: this.payments
          .filter(p => p.status === "succeeded")
          .reduce((sum, p) => sum + p.amount, 0)
      };
    }
  },

  methods: {
    async loadPaymentHistory() {
      try {
        // Load the customer’s orders from backend
        const result = await ordersAPI.getAll();

        if (!result.success || !Array.isArray(result.results)) {
          this.payments = [];
          return;
        }

        // Convert each order → payment entry
        this.payments = result.results.map(order => {
          return {
            orderId: order._id || order.id,
            timestamp: order.transaction_date || order.created_at || order.updated_at,
            method: order.payment_method || "cash",
            status: order.payment_status || "pending",
            amount: order.total_amount || order.total || 0,
            error: order.payment_status === "failed" ? (order.error_message || "Payment failed") : null
          };
        });

      } catch (err) {
        console.error("Error loading payment history:", err);
        this.payments = [];
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    },

    formatStatus(s) {
      const map = {
        initiated: "Initiated",
        redirected: "Redirected to Payment",
        succeeded: "Payment Successful",
        failed: "Payment Failed",
        cancelled: "Payment Cancelled"
      };
      return map[s] || s;
    },

    formatMethod(method) {
      const map = {
        cash: "Cash on Delivery",
        gcash: "GCash",
        paymaya: "PayMaya",
        card: "Credit/Debit Card",
        grabpay: "GrabPay QR"
      };
      return map[method] || method;
    },

    getMethodIcon(method) {
      const iconMap = {
        cash: "💵",
        gcash: "📱",
        paymaya: "🏦",
        card: "💳",
        grabpay: "🎯"
      };
      return iconMap[method] || "💰";
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


