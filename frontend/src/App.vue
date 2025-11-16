<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <!-- Authentication Pages (Full Screen with Sliding Animation) -->
    <template v-if="isAuthPage">
      <Auth
        @loginSuccess="handleAuthSuccess"
        @signUpSuccess="handleAuthSuccess"
        @backToHome="setCurrentPage('Home')"
        @switchToSignUp="setCurrentPage('SignUp')" 
      />
    </template>

    <!-- Main App Layout -->
    <template v-else>
      <!-- Top Bar -->
      <div class="top-bar">
        <div class="top-bar-container">
          <div class="contact-info">
            <div class="contact-item">
              <span class="contact-icon">📞</span>
              <span class="contact-text">(123) 456 - 7890</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">✉️</span>
              <span class="contact-text">ramyeoncornerbislig@gmail.com</span>
            </div>
          </div>
          <div class="auth-social">
            <div class="auth-links" v-if="!isLoggedIn">
              <a href="#" class="auth-btn login-btn" @click.prevent="setCurrentPage('Login')">Login</a>
              <a href="#" class="auth-btn signup-btn" @click.prevent="setCurrentPage('SignUp')">Sign Up</a>
            </div>
            <div class="user-menu" v-else>
              <span class="welcome-text">Welcome, {{ currentUser.firstName }}!</span>
              <a href="#" class="profile-link" @click.prevent="setCurrentPage('Profile')">Profile</a>
              <a href="#" class="logout-link" @click.prevent="handleLogout">Sign Out</a>
            </div>
             <div class="social-icons">
              <a href="https://www.facebook.com/ramyeoncornerbislig" class="social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <img src="./assets/Nav Bar/fb.png" alt="Facebook" />
              </a>
              <!--<a href="#" class="social-link" aria-label="Twitter">
                <img src="./assets/Nav Bar/twt.png" alt="Twitter" />
              </a>
              <a href="#" class="social-link" aria-label="Instagram">
                <img src="./assets/Nav Bar/ig.png" alt="Instagram" />
              </a>
              <a href="#" class="social-link" aria-label="Github">
                <img src="./assets/Nav Bar/git.png" alt="Github" />
              </a>-->
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Bar -->
      <nav class="navbar">
        <div>
          <div class="logo">
            <img src="./assets/Nav Bar/Logo.png" alt="Ramyeon Corner Logo" class="logo-img" />
          </div>
          <ul class="nav-links">
            <li><a href="#" :class="{ active: currentPage === 'Home' }" @click.prevent="setCurrentPage('Home')">Home</a></li>
            <li><a href="#" :class="{ active: currentPage === 'About' }" @click.prevent="setCurrentPage('About')">About</a></li>
            <li><a href="#" :class="{ active: currentPage === 'Menu' }" @click.prevent="setCurrentPage('Menu')">Menu</a></li>
            <li><a href="#" :class="{ active: currentPage === 'Promotions' }" @click.prevent="setCurrentPage('Promotions')">Promotions</a></li>
            <li><a href="#" :class="{ active: currentPage === 'Contact' }" @click.prevent="setCurrentPage('Contact')">Contact Us</a></li>
          </ul>
          <button class="cart-btn" aria-label="Cart" @click="setCurrentPage('Cart')">
            🛒 <span class="cart-count">{{ cartCount }}</span>
          </button>
        </div>
      </nav>

      <!-- Page Content -->
      <HelloWorld v-if="currentPage === 'Home'" @setCurrentPage="setCurrentPage" />
      <AboutUs v-if="currentPage === 'About'" />
      <MenuPage v-if="currentPage === 'Menu'" :onAddToCart="addToCart" />
      <ContactUs v-if="currentPage === 'Contact'" />
      <Promotions v-if="currentPage === 'Promotions'" @setCurrentPage="setCurrentPage" :isLoggedIn="isLoggedIn" />
      <Profile v-if="currentPage === 'Profile'" @setCurrentPage="setCurrentPage" />
      <ProfileSettings v-if="currentPage === 'ProfileSettings'" @setCurrentPage="setCurrentPage" />
      <Settings v-if="currentPage === 'Settings'" @setCurrentPage="setCurrentPage" />
      <Cart v-if="currentPage === 'Cart'" @setCurrentPage="setCurrentPage" @cartCleared="handleCartCleared" :key="cartKey" />
      <OrderHistory v-if="currentPage === 'OrderHistory'" @setCurrentPage="setCurrentPage" :key="orderHistoryKey" />
      <PaymentHistory v-if="currentPage === 'PaymentHistory'" @setCurrentPage="setCurrentPage" :key="paymentHistoryKey" />

      <!-- Sign Out Confirmation Modal -->
      <div v-if="showSignOutModal" class="signout-modal-overlay" @click="cancelSignOut">
        <div class="signout-modal" @click.stop>
          <div class="signout-modal-header">
            <h3>Sign Out</h3>
            <button class="signout-close-btn" @click="cancelSignOut">✕</button>
          </div>
          <div class="signout-modal-body">
            <div class="signout-icon">🚪</div>
            <p class="signout-message">Are you sure you want to sign out?</p>
            <p class="signout-submessage">You will be redirected to the home page.</p>
          </div>
          <div class="signout-modal-footer">
            <button class="signout-btn cancel-btn" @click="cancelSignOut">Cancel</button>
            <button class="signout-btn confirm-btn" @click="confirmSignOut">Sign Out</button>
          </div>
        </div>
      </div>

      <!-- Footer Section -->
      <footer class="footer" v-if="!isProfilePage">
        <div class="footer-content">
          <div class="footer-main">
            <!-- Brand Section -->
            <div class="footer-brand">
              <img src="./assets/Nav Bar/Logo.png" alt="Ramyeon Corner Logo" class="footer-logo" />
              <p class="footer-address">
                Purok I, Castillo, Mangagoy,<br>
                Bislig, Philippines
              </p>
              <p class="footer-contact">📞 (123) 456-7890</p>
              <p class="footer-contact">✉️ ramyeoncornerbislig@gmail.com</p>
            </div>

            <!-- Newsletter Section -->
            <div class="footer-newsletter">
              <div class="newsletter-header">
                <div class="newsletter-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3>Sign Up and get exclusive deals!</h3>
              </div>
              <!--<div class="newsletter-form" :class="{ 'success': subscriptionSuccess, 'error': subscriptionError }">
                <div class="input-container">
                  <input 
                    type="email" 
                    placeholder="youremail@gmail.com" 
                    v-model="newsletterEmail"
                    class="newsletter-input"
                    :class="{ 'error': subscriptionError, 'success': subscriptionSuccess }"
                    @keyup.enter="subscribe"
                  />
                  <div class="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </div>
                <button class="subscribe-btn" @click="subscribe" :disabled="isSubscribing">
                  <span v-if="!isSubscribing">Subscribe</span>
                  <span v-else class="loading-text">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div class="form-feedback">
                <p v-if="subscriptionError" class="error-message">{{ subscriptionError }}</p>
                <p v-if="subscriptionSuccess" class="success-message">{{ subscriptionSuccess }}</p>
              </div>
              <p class="newsletter-disclaimer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="16" r="1" fill="currentColor"/>
                  <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="currentColor" stroke-width="2"/>
                </svg>
                we won't spam, read our <a href="#" class="email-policy-link">email policy</a>
              </p>-->
            </div>
            
            <!-- Legal Pages -->
            <div class="footer-links">
            <!--  <div class="footer-column">
                <h4>Legal Pages</h4>
                <ul>
                  <li><a href="#">Terms and conditions</a></li>
                  <li><a href="#">Privacy</a></li>
                  <li><a href="#">Cookies</a></li>
            
                </ul>
              </div>-->
            </div>

            <!-- Important Links -->
            <div class="footer-links">
             <!-- <div class="footer-column">
                <h4>Important Links</h4>
                <ul>
                  <li><a href="#">Get help</a></li>
                  <li><a href="#">Add your restaurant</a></li>
                  <li><a href="#">Sign up to deliver</a></li>
                  <li><a href="#">Create a business account</a></li>
                </ul>
              </div>-->
            </div>
        </div>
      </div>

      <!-- Social Media Icons (Outside Bottom Footer) -->
      <div class="footer-social">
        <a href="https://www.facebook.com/ramyeoncornerbislig" class="social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
          <img src="./assets/Nav Bar/fb.png" alt="Facebook" />
        </a>
        <!--<a href="#" class="social-link" aria-label="Twitter">
          <img src="./assets/Nav Bar/twt.png" alt="Twitter" />
        </a>
        <a href="#" class="social-link" aria-label="Instagram">
          <img src="./assets/Nav Bar/ig.png" alt="Instagram" />
        </a>
        <a href="#" class="social-link" aria-label="Github">
          <img src="./assets/Nav Bar/git.png" alt="Github" />
        </a>-->
      </div>

      <!-- Copyright Section -->
      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <p>&copy; 2025 Ramyeon Corner. All rights reserved.</p>
        </div>
      </div>
      </footer>
    </template>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import AboutUs from './components/AboutUs.vue'
import MenuPage from './components/Menu.vue'
import ContactUs from './components/ContactUs.vue'
import Promotions from './components/Promotions.vue'
import Auth from './components/Auth.vue'
import Profile from './components/Profile.vue'
import ProfileSettings from './components/ProfileSettings.vue'
import Settings from './components/Settings.vue'
import Cart from './components/Cart.vue'
import OrderHistory from './components/OrderHistory.vue'
import PaymentHistory from './components/PaymentHistory.vue'

export default {
  name: 'App',
  components: {
    HelloWorld,
    AboutUs,
    MenuPage,
    ContactUs,
    Promotions,
    Auth,
    Profile,
    ProfileSettings,
    Settings,
    Cart,
    OrderHistory,
    PaymentHistory
  },
  data() {
    return {
      currentPage: 'Home',
      cartItems: [],
      newsletterEmail: '',
      currentUser: null,
      isDarkMode: false,
      subscriptionError: '',
      subscriptionSuccess: '',
      isSubscribing: false,
      showSignOutModal: false,
      cartKey: 0,
      orderHistoryKey: 0,
      paymentHistoryKey: 0
    }
  },
  computed: {
    isLoggedIn() {
      return this.currentUser !== null;
    },
    isAuthPage() {
      return ['Login', 'SignUp'].includes(this.currentPage);
    },
    isProfilePage() {
      return ['Profile', 'ProfileSettings', 'Settings', 'Cart'].includes(this.currentPage);
    },
    cartCount() {
      return this.cartItems.reduce((total, item) => total + item.quantity, 0);
    }
  },
  mounted() {
    // Check URL hash to determine initial page (important for PayMongo redirects!)
    this.checkURLHash();
    
    this.checkUserSession();
    this.loadDarkModePreference();
    this.loadCartItems();
    window.addEventListener('hashchange', this.handleHashChange);
  },
  methods: {
    handleHashChange() {
      console.log("🔙 Back button detected. Hash:", window.location.hash);
      this.checkURLHash();   // Re-read URL and update currentPage
    },

    checkURLHash() {
      const rawHash = window.location.hash || '';

      if (!rawHash || rawHash === '#/' || rawHash === '#') {
        this.currentPage = 'Home';
        return;
      }

      const trimmedHash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
      const withoutLeadingSlash = trimmedHash.startsWith('/') ? trimmedHash.slice(1) : trimmedHash;

      // Some providers append additional fragments (#/oauth?#/something). Only look at the first segment.
      const [primarySegment] = withoutLeadingSlash.split('#', 1);
      const [routeSegmentRaw, queryString = ''] = primarySegment.split('?');
      const routeSegment = (routeSegmentRaw || '').toLowerCase();

      if (!routeSegment) {
        this.currentPage = 'Home';
        return;
      }

      if (routeSegment === 'oauth') {
        this.processOAuthCallback(queryString);
        return;
      }

      const pageMap = {
        'cart': 'Cart',
        'menu': 'Menu',
        'about': 'About',
        'promotions': 'Promotions',
        'contact': 'Contact',
        'profile': 'Profile',
        'login': 'Login',
        'signup': 'SignUp',
        'order-history': 'OrderHistory',
        'payment-history': 'PaymentHistory',
        'settings': 'Settings',
        'profile-settings': 'ProfileSettings'
      };

      const mappedPage = pageMap[routeSegment];
      this.currentPage = mappedPage || 'Home';
    },

    processOAuthCallback(queryString) {
      const params = new URLSearchParams(queryString || '');
      const status = params.get('status');

      if (!status) {
        this.currentPage = 'Home';
        return;
      }

      if (status === 'success') {
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const userId = params.get('user_id') || '';
        const email = params.get('user_email') || '';
        const fullName = params.get('user_name') || '';
        const username = params.get('username') || (email ? email.split('@')[0] : 'guest');
        const emailVerified = params.get('email_verified') === '1';

        if (accessToken) {
          localStorage.setItem('access_token', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }

        const firstName = fullName ? fullName.split(' ')[0] : username;
        const lastName = fullName ? fullName.split(' ').slice(1).join(' ') : '';

        const userSession = {
          id: userId,
          email,
          username,
          fullName: fullName || username,
          firstName,
          lastName,
          phone: '',
          points: 0,
          deliveryAddress: {},
          emailVerified,
          authMode: 'oauth',
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('ramyeon_user_session', JSON.stringify(userSession));
        this.currentUser = userSession;
        this.setCurrentPage('Profile');
        window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}#/profile`);
        return;
      }

      const message = params.get('message') || 'OAuth login failed. Please try again.';
      alert(message);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}#/login`);
      this.currentPage = 'Login';
    },
    
   setCurrentPage(page, context = {}) {
      this.currentPage = page;

      // ✅ Handle login redirection intent (e.g., from Order Now)
      if (context.from === 'OrderNow') {
        // Instead of going to Cart after login, redirect to Menu
        localStorage.setItem('loginRedirect', 'Menu');
      }

      // ✅ Update URL hash when page changes
      const hashMap = {
        'Home': '',
        'Cart': 'cart',
        'Menu': 'menu',
        'About': 'about',
        'Promotions': 'promotions',
        'Contact': 'contact',
        'Profile': 'profile',
        'Login': 'login',
        'SignUp': 'signup',
        'OrderHistory': 'order-history',
        'PaymentHistory': 'payment-history',
        'Settings': 'settings',
        'ProfileSettings': 'profile-settings'
      };

      const hashName = hashMap[page];
      if (hashName !== undefined) {
        // Don't update hash if we're already on a page with query params (like payment returns)
        if (!window.location.hash.includes('?')) {
          window.location.hash = hashName ? `#/${hashName}` : '#/';
        }
      }

      // ✅ Force reload of certain components when navigating to them
      if (page === 'OrderHistory') {
        this.orderHistoryKey++;
        console.log('📦 Forcing OrderHistory reload');
      } else if (page === 'PaymentHistory') {
        this.paymentHistoryKey++;
      } else if (page === 'Cart') {
        this.cartKey++;
        // Reload cart items when navigating to cart page to ensure sync
        this.loadCartItems();
      }
    },

    
    addToCart(product) {
      if (!this.isLoggedIn) {
        this.setCurrentPage('Login');
        return;
      }

      const existingItem = this.cartItems.find(item => item.id === product.id);

      if (existingItem) {
        existingItem.quantity++;
      } else {
        this.cartItems.push({
          ...product,
          quantity: 1
        });
      }

      // Save cart to localStorage
      localStorage.setItem('ramyeon_cart', JSON.stringify(this.cartItems));

      // Show success message
      this.showCartNotification(product.name);
    },
    
    showCartNotification(productName) {
      // Simple notification - in a real app you might use a toast library
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 15px 20px;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          z-index: 9999;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          animation: slideIn 0.3s ease-out;
        ">
          ✅ ${productName} added to cart!
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 2000);
    },
    
    async subscribe() {
      // Clear previous messages
      this.subscriptionError = '';
      this.subscriptionSuccess = '';
      
      if (!this.newsletterEmail) {
        this.subscriptionError = 'Please enter your email address';
        return;
      }
      if (!this.isValidEmail(this.newsletterEmail)) {
        this.subscriptionError = 'Please enter a valid email address';
        return;
      }
      
      this.isSubscribing = true;
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        this.subscriptionSuccess = `Successfully subscribed with ${this.newsletterEmail}!`;
        this.newsletterEmail = '';
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          this.subscriptionSuccess = '';
        }, 5000);
        
      } catch (error) {
        this.subscriptionError = 'Something went wrong. Please try again.';
      } finally {
        this.isSubscribing = false;
      }
    },
    
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    checkUserSession() {
      const userSession = localStorage.getItem('ramyeon_user_session');
      if (userSession) {
        try {
          this.currentUser = JSON.parse(userSession);
        } catch (error) {
          console.error('Error parsing user session:', error);
          localStorage.removeItem('ramyeon_user_session');
        }
      }
    },
    
    handleAuthSuccess(userData) {
    this.currentUser = userData;
    const redirectTarget = localStorage.getItem('loginRedirect') || 'Profile';
    localStorage.removeItem('loginRedirect');
    this.setCurrentPage(redirectTarget);
  },

    
    handleLogout() {
      this.showSignOutModal = true;
    },

    confirmSignOut() {
      this.currentUser = null;
      localStorage.removeItem('ramyeon_user_session');
      this.setCurrentPage('Home');
      this.showSignOutModal = false;

      // Show success notification
      this.showSignOutSuccess();
    },

    cancelSignOut() {
      this.showSignOutModal = false;
    },

    showSignOutSuccess() {
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 15px 20px;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          z-index: 9999;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          animation: slideIn 0.3s ease-out;
          display: flex;
          align-items: center;
          gap: 10px;
        ">
          <span>✅</span>
          <span>You have been signed out successfully!</span>
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    },
    
    loadDarkModePreference() {
      const darkMode = localStorage.getItem('ramyeon_dark_mode');
      this.isDarkMode = darkMode === 'true';
      
      // Apply dark mode class to document root
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
    },
    
    loadCartItems() {
      const savedCart = localStorage.getItem('ramyeon_cart');
      if (savedCart) {
        try {
          this.cartItems = JSON.parse(savedCart);
        } catch (error) {
          console.error('Error loading cart items:', error);
          this.cartItems = [];
        }
      } else {
        // Explicitly clear cartItems when localStorage is empty
        this.cartItems = [];
      }
    },
    
    handleCartCleared() {
      // Immediately clear cartItems array for instant UI update
      console.log('🛒 Cart cleared event received, updating App.vue cartItems');
      this.cartItems = [];
      // Also reload from localStorage to ensure sync (should be empty now)
      this.loadCartItems();
      // Force Vue to update the computed cartCount
      this.$nextTick(() => {
        this.$forceUpdate();
        console.log('🛒 Cart count updated:', this.cartCount);
      });
    }
  },
  
  watch: {
    // Watch for dark mode changes from settings
    isDarkMode(newVal) {
      if (newVal) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
@import './assets/EnhancedFooter.css';

/* User Menu Styles */
.user-menu {
  display: flex;
  align-items: center;
  gap: 15px;
}

.welcome-text {
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
}

.profile-link,
.logout-link {
  color: white;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  padding: 5px 10px;
  border-radius: 15px;
}

.profile-link:hover {
  background: rgba(255, 255, 255, 0.1);
  text-decoration: underline;
}

.logout-link:hover {
  background: rgba(255, 71, 87, 0.8);
  text-decoration: none;
}

/* Dark mode support for user menu */
.dark-mode .welcome-text {
  color: #f5f5f5;
}

.dark-mode .profile-link,
.dark-mode .logout-link {
  color: #f5f5f5;
}

/* Responsive design for user menu */
@media (max-width: 768px) {
  .user-menu {
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }
  
  .welcome-text {
    font-size: 0.8rem;
  }
  
  .profile-link,
  .logout-link {
    font-size: 0.8rem;
    padding: 3px 8px;
  }
}

@media (max-width: 480px) {
  .auth-social {
    flex-direction: column;
    gap: 10px;
    align-items: flex-end;
  }
  
  .user-menu {
    order: -1;
  }
  
  .social-icons {
    gap: 8px;
  }
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}

#app {
  font-family: 'Poppins', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  margin: 0;
  padding: 0;
  width: 100vw;
  overflow-x: hidden;
}

/* Top Bar - Enhanced Design */
.top-bar {
  background: linear-gradient(135deg, #2c3e50 0%, #3a3a3a 50%, #2c3e50 100%);
  color: white;
  padding: 12px 0;
  font-size: 0.9rem;
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.top-bar-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.contact-info {
  display: flex;
  gap: 25px;
  align-items: center;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.contact-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.contact-icon {
  font-size: 1rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.contact-text {
  font-weight: 500;
  font-size: 0.85rem;
  letter-spacing: 0.3px;
}

.auth-social {
  display: flex;
  align-items: center;
  gap: 20px;
}

.auth-links {
  display: flex;
  gap: 12px;
  align-items: center;
}

.auth-btn {
  color: white;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.login-btn {
  background: rgba(255, 255, 255, 0.1);
}

.login-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

.signup-btn {
  background: linear-gradient(135deg, #ff4757, #ff3742);
  border: 1px solid #ff4757;
}

.signup-btn:hover {
  background: linear-gradient(135deg, #ff3742, #ff2f3a);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
}

.social-icons {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-left: 20px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
}

.social-link img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  transition: all 0.3s ease;
}

.social-link:hover img {
  filter: brightness(0) invert(1) drop-shadow(0 2px 4px rgba(255, 255, 255, 0.3));
}

/* Top Bar Responsive Design */
@media (max-width: 992px) {
  .top-bar-container {
    padding: 0 15px;
  }
  
  .contact-info {
    gap: 15px;
  }
  
  .contact-item {
    padding: 5px 10px;
  }
  
  .contact-text {
    font-size: 0.8rem;
  }
  
  .auth-social {
    gap: 15px;
  }
  
  .social-icons {
    padding-left: 15px;
    gap: 10px;
  }
  
  .social-link {
    width: 28px;
    height: 28px;
  }
  
  .social-link img {
    width: 14px;
    height: 14px;
  }
}

@media (max-width: 768px) {
  .top-bar {
    padding: 10px 0;
  }
  
  .top-bar-container {
    flex-direction: column;
    gap: 12px;
    padding: 0 15px;
  }
  
  .contact-info {
    order: 2;
    gap: 12px;
    justify-content: center;
  }
  
  .contact-item {
    padding: 4px 8px;
    font-size: 0.75rem;
  }
  
  .contact-text {
    font-size: 0.75rem;
  }
  
  .auth-social {
    order: 1;
    gap: 12px;
    width: 100%;
    justify-content: space-between;
  }
  
  .auth-links {
    gap: 8px;
  }
  
  .auth-btn {
    padding: 6px 12px;
    font-size: 0.75rem;
  }
  
  .social-icons {
    padding-left: 0;
    border-left: none;
    gap: 8px;
  }
  
  .social-link {
    width: 26px;
    height: 26px;
  }
  
  .social-link img {
    width: 12px;
    height: 12px;
  }
}

@media (max-width: 480px) {
  .top-bar {
    padding: 8px 0;
  }
  
  .contact-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .contact-item {
    padding: 3px 6px;
  }
  
  .contact-icon {
    font-size: 0.9rem;
  }
  
  .contact-text {
    font-size: 0.7rem;
  }
  
  .auth-social {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
  
  .auth-links {
    order: 1;
  }
  
  .social-icons {
    order: 2;
    gap: 6px;
  }
  
  .social-link {
    width: 24px;
    height: 24px;
  }
  
  .social-link img {
    width: 10px;
    height: 10px;
  }
}

/* Navigation Bar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  background-color: white;
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
  font-weight: 600;
  font-size: 1rem;
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
}

.navbar > div {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.logo {
  height: 70px;
  display: flex;
  align-items: center;
}

.logo img {
  height: 100%;
  width: auto;
  object-fit: contain;
  max-width: 220px;
}

.nav-links {
  list-style: none;
  display: flex;
  gap: 25px;
  margin: 0;
  padding: 0;
}

.nav-links li a {
  color: black;
  text-decoration: none;
  padding: 5px 0;
  transition: color 0.3s ease;
}

.nav-links li a.active,
.nav-links li a:hover {
  color: red;
  font-weight: 700;
}

.cart-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  position: relative;
  cursor: pointer;
  color: #666;
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -10px;
  background-color: red;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 50%;
  box-shadow: 0 0 8px red;
}

/* Footer Section - Ultra Modern Design */
.footer {
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #2d2d2d 100%);
  padding: 60px 0 0 0;
  margin-top: 80px;
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  color: #f5f5f5;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 50%, rgba(255, 71, 87, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 71, 87, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(255, 71, 87, 0.06) 0%, transparent 50%);
  pointer-events: none;
  animation: gradientShift 20s ease-in-out infinite;
}

@keyframes gradientShift {
  0%, 100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1) rotate(2deg);
  }
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px;
  position: relative;
  z-index: 1;
}

.footer-main {
  display: grid;
  grid-template-columns: 1.5fr 1.8fr 1fr 1fr;
  gap: 50px;
  margin-bottom: 40px;
  align-items: start;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.footer-logo {
  height: 45px;
  width: auto;
  object-fit: contain;
  max-width: 180px;
  filter: brightness(0) invert(1);
  margin-bottom: 8px;
  transition: transform 0.3s ease;
}

.footer-logo:hover {
  transform: scale(1.05);
}

.footer-address {
  color: #b8b8b8;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
  font-weight: 400;
}

.footer-contact {
  color: #d4d4d4;
  font-size: 0.9rem;
  margin: 0;
  font-weight: 500;
}

.footer-newsletter {
  display: flex;
  flex-direction: column;
  gap: 15px;
  text-align: left;
}

.newsletter-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 5px;
}

.newsletter-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 71, 87, 0.15);
  border-radius: 50%;
  color: #ff4757;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 71, 87, 0.2);
}

.newsletter-icon:hover {
  background: rgba(255, 71, 87, 0.25);
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
}

.footer-newsletter h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.newsletter-form {
  display: flex;
  gap: 0;
  border-radius: 25px;
  overflow: hidden;
  background: #3a3a3a;
  border: 2px solid #4a4a4a;
  max-width: 320px;
  margin: 0;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  position: relative;
}

.newsletter-form:hover {
  border-color: #ff4757;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.2);
}

.newsletter-form:focus-within {
  border-color: #ff4757;
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.3), 0 0 0 3px rgba(255, 71, 87, 0.1);
}

.newsletter-form.error {
  border-color: #e74c3c;
  animation: shake 0.5s ease-in-out;
}

.newsletter-form.success {
  border-color: #27ae60;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.input-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.newsletter-input {
  flex: 1;
  padding: 12px 18px 12px 45px;
  border: none;
  font-size: 0.9rem;
  outline: none;
  background: transparent;
  color: #ffffff;
  font-weight: 400;
  transition: all 0.3s ease;
}

.newsletter-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

.newsletter-input:focus {
  background: rgba(255, 255, 255, 0.05);
}

.newsletter-input:focus::placeholder {
  color: rgba(255, 255, 255, 0.4);
  transform: translateX(3px);
}

.newsletter-input.error {
  color: #ffcdd2;
}

.newsletter-input.success {
  color: #c8e6c9;
}

.input-icon {
  position: absolute;
  left: 15px;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
  pointer-events: none;
}

.newsletter-input:focus + .input-icon {
  color: #ff4757;
  transform: scale(1.1);
}

.newsletter-input.error + .input-icon {
  color: #e74c3c;
}

.newsletter-input.success + .input-icon {
  color: #27ae60;
}

.subscribe-btn {
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border: none;
  padding: 12px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.subscribe-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.subscribe-btn:hover {
  background: linear-gradient(135deg, #ff3742, #ff2f3a);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(255, 71, 87, 0.4);
}

.subscribe-btn:hover::before {
  left: 100%;
}

.subscribe-btn:active {
  transform: translateY(0);
}

.subscribe-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.subscribe-btn:disabled:hover {
  transform: none;
}

.loading-text svg {
  animation: spin 1s linear infinite;
}

.arrow-icon {
  transition: transform 0.3s ease;
}

.subscribe-btn:hover .arrow-icon {
  transform: translateX(2px);
}

.subscribe-btn:disabled .arrow-icon {
  display: none;
}

.form-feedback {
  min-height: 20px;
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.error-message {
  color: #ffcdd2;
  background: rgba(244, 67, 54, 0.15);
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
  margin: 0;
  border: 1px solid rgba(244, 67, 54, 0.3);
  animation: slideInUp 0.3s ease-out;
}

.success-message {
  color: #c8e6c9;
  background: rgba(76, 175, 80, 0.15);
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
  margin: 0;
  border: 1px solid rgba(76, 175, 80, 0.3);
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 25px;
  align-items: flex-start;
}

.footer-column h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 15px 0;
  position: relative;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.footer-column h4::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  border-radius: 2px;
}

.footer-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-column ul li a {
  color: #b8b8b8;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  font-weight: 400;
  position: relative;
  display: inline-block;
}

.footer-column ul li a::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  transition: width 0.3s ease;
}

.footer-column ul li a:hover {
  color: #ff4757;
  transform: translateX(5px);
}

.footer-column ul li a:hover::before {
  width: 100%;
}

.footer-social {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 15px 0 5px 0;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transition: all 0.3s ease;
  padding: 0;
  border: 2px solid transparent;
}

.social-link:hover {
  transform: translateY(-3px) scale(1.1);
  background: linear-gradient(135deg, #ff4757, #ff3742);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.3);
}

.social-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  transition: all 0.3s ease;
}

.social-link:hover .social-icon-img {
  filter: brightness(0) invert(1) drop-shadow(0 2px 4px rgba(255, 255, 255, 0.3));
  transform: scale(1.1);
}

.footer-bottom {
  background: linear-gradient(135deg, #0f0f0f, #1a1a1a);
  font-size: 0.8rem;
  padding: 5px 0;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-bottom-content p {
  color: #aaa;
  font-size: 0.9rem;
  margin: 0;
  letter-spacing: 0.8px;
  font-weight: 400;
}

.newsletter-disclaimer {
  font-size: 0.8rem;
  color: #b8b8b8;
  margin: 8px 0 0 0;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.newsletter-disclaimer:hover {
  color: #d4d4d4;
  transform: translateY(-1px);
}

.newsletter-disclaimer svg {
  flex-shrink: 0;
  opacity: 0.8;
}

.email-policy-link {
  color: #ff4757;
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 500;
}

.email-policy-link:hover {
  color: #ff3742;
  text-decoration: underline;
}

/* Enhanced Responsive Design */
@media (max-width: 992px) {
  .footer-main {
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }
  
  .footer-newsletter {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .footer {
    padding: 30px 0 0 0;
  }
  
  .footer-main {
    grid-template-columns: 1fr;
    gap: 25px;
    text-align: center;
  }
  
  .footer-brand {
    align-items: center;
  }
  
  .footer-newsletter {
    text-align: center;
    grid-column: span 1;
  }
  
  .newsletter-form {
    max-width: 100%;
  }
  
  .footer-column h4::after {
    left: 50%;
    transform: translateX(-50%);
  }
  
  .footer-social {
    margin-bottom: 10px;
    gap: 15px;
    padding: 10px 0 5px 0;
  }
}

@media (max-width: 480px) {
  .footer {
    padding: 25px 0 0 0;
  }
  
  .footer-content {
    padding: 0 20px;
  }
  
  .footer-main {
    gap: 20px;
  }
  
  .footer-logo {
    height: 35px;
    max-width: 150px;
  }
  
  .footer-newsletter h3 {
    font-size: 1.1rem;
  }
  
  .newsletter-form {
    flex-direction: column;
    border-radius: 15px;
  }
  
  .newsletter-input {
    border-bottom: 1px solid #4a4a4a;
  }
  
  .subscribe-btn {
    border-radius: 0 0 15px 15px;
  }
  
  .social-link {
    width: 40px;
    height: 40px;
  }
  
  .social-icon-img {
    width: 18px;
    height: 18px;
  }
}

/* Enhanced slide transitions for auth pages */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(100%) rotateY(30deg) scale(0.9);
  filter: blur(5px);
}

.slide-enter-to {
  opacity: 1;
  transform: translateX(0) rotateY(0deg) scale(1);
  filter: blur(0px);
}

.slide-leave-from {
  opacity: 1;
  transform: translateX(0) rotateY(0deg) scale(1);
  filter: blur(0px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-100%) rotateY(-30deg) scale(0.9);
  filter: blur(5px);
}

/* Additional animations and effects */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.footer-main > div {
  animation: fadeInUp 0.6s ease-out;
}

.footer-main > div:nth-child(1) { animation-delay: 0.1s; }
.footer-main > div:nth-child(2) { animation-delay: 0.2s; }
.footer-main > div:nth-child(3) { animation-delay: 0.3s; }
.footer-main > div:nth-child(4) { animation-delay: 0.4s; }

/* Sign Out Modal Styles */
.signout-modal-overlay {
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
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease-out;
}

.signout-modal {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

.signout-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
}

.signout-modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
}

.signout-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.2rem;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.signout-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.signout-modal-body {
  padding: 30px 25px;
  text-align: center;
}

.signout-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  display: block;
}

.signout-message {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.signout-submessage {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
}

.signout-modal-footer {
  display: flex;
  gap: 15px;
  padding: 20px 25px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.signout-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.confirm-btn {
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #ff3742, #ff2f3a);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
}

.confirm-btn:active,
.cancel-btn:active {
  transform: translateY(0);
}

/* Dark mode support for modal */
.dark-mode .signout-modal {
  background: #2d2d2d;
  color: #f5f5f5;
}

.dark-mode .signout-modal-footer {
  background: #3a3a3a;
  border-top-color: #4a4a4a;
}

.dark-mode .signout-message {
  color: #f5f5f5;
}

.dark-mode .signout-submessage {
  color: #b8b8b8;
}

/* Modal animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Responsive modal */
@media (max-width: 480px) {
  .signout-modal {
    margin: 20px;
    width: calc(100% - 40px);
  }

  .signout-modal-header {
    padding: 15px 20px;
  }

  .signout-modal-body {
    padding: 25px 20px;
  }

  .signout-modal-footer {
    padding: 15px 20px;
    flex-direction: column;
  }

  .signout-btn {
    width: 100%;
  }
}
</style>
