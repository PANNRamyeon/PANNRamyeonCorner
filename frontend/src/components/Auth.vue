<template>
  <div class="auth-wrapper">
    <div class="auth-container-wrapper" :class="{ 'show-signup': isSignUpMode }">
      <!-- Login Form -->
      <div class="form-container login-container">
        <div class="auth-card">
          <!-- Logo with animation -->
          <div class="logo-container">
            <img :src="logoSrc" alt="Ramyeon Corner Logo" class="auth-logo" />
          </div>
          
          <h1 class="auth-title">Welcome Back! 🍜</h1>
          <p class="auth-subtitle">Don't have an account? <a href="#" @click.prevent="switchToSignUp" class="create-link">Create now</a></p>
          
          <!-- Enhanced Messages -->
          <transition name="slide-fade">
            <div v-if="loginError" class="error-message">
              <span class="message-icon">⚠️</span>
              {{ loginError }}
            </div>
          </transition>
          
          <transition name="slide-fade">
            <div v-if="loginSuccess" class="success-message">
              <span class="message-icon">✅</span>
              {{ loginSuccess }}
            </div>
          </transition>
          
          <form @submit.prevent="handleLogin" class="auth-form">
            <div class="form-group">
              <label for="loginEmail" class="form-label">
                <span class="label-icon">📧</span>
                E-mail
              </label>
              <div class="input-wrapper">
                <input
                  type="email"
                  id="loginEmail"
                  v-model="loginForm.email"
                  class="form-input"
                  placeholder="example@gmail.com"
                  required
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="loginPassword" class="form-label">
                <span class="label-icon">🔒</span>
                Password
              </label>
              <div class="input-wrapper">
                <input
                  :type="showLoginPassword ? 'text' : 'password'"
                  id="loginPassword"
                  v-model="loginForm.password"
                  class="form-input"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showLoginPassword = !showLoginPassword"
                  :aria-label="showLoginPassword ? 'Hide password' : 'Show password'"
                >
                  <span class="eye-icon">{{ showLoginPassword ? '👁️' : '👁️‍🗨️' }}</span>
                </button>
              </div>
            </div>
            
            <div class="form-row">
              <div class="checkbox-group">
                <input type="checkbox" id="remember" v-model="loginForm.rememberMe" />
                <label for="remember">Remember me</label>
              </div>
              
              <div class="forgot-password">
                <a href="#" @click.prevent="handleForgotPassword">Forgot Password?</a>
              </div>
            </div>
            
            <button type="submit" class="auth-button" :disabled="isLoading">
              <span v-if="isLoading" class="loading-spinner"></span>
              <span v-else class="button-icon">🚀</span>
              {{ isLoading ? 'Signing In...' : 'Sign in' }}
            </button>
          </form>
          
          <div class="auth-divider">OR</div>
          
          <div class="social-login">
            <button class="social-btn google-btn" @click="socialLogin('google')" :disabled="isLoading">
              <span class="social-icon">🔴</span>
              <span>Continue with Google</span>
            </button>
            <button class="social-btn facebook-btn" @click="socialLogin('facebook')" :disabled="isLoading">
              <span class="social-icon">📘</span>
              <span>Continue with Facebook</span>
            </button>
          </div>

          <!-- Back to Home Button -->
          <button class="back-home-btn" @click="$emit('backToHome')">
            <span class="back-icon">←</span>
            Back to Home
          </button>
        </div>
        
        <!-- Right side promotional content for login -->
        <div class="promo-content">
         <!--  <div class="promo-badge">🔥 HOT DEAL</div> -->
          <div class="promo-image">
            <img src="../assets/food/ramyeon-hero.jpg" alt="Delicious Ramyeon" class="ramyeon-image" />
            <div class="image-overlay"></div>
          </div>
          <div class="promo-text">
           <!-- <div class="promo-timer">⏰ 24 HOURS ONLY</div>
            <h1 class="promo-title">FLASH SALE</h1>
            <div class="promo-code">
              <span class="code-label">USE CODE:</span>
              <span class="code-value">CORNER</span>
            </div>-->
            <!-- <h3 class="promo-discount">30% OFF</h3>-->
            <button class="order-btn">
              <span>Order Now</span>
              <span class="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </div>

      <!-- SignUp Form -->
      <div class="form-container signup-container">
        <div class="auth-card">
          <!-- Logo with animation -->
          <div class="logo-container">
            <img :src="logoSrc" alt="Ramyeon Corner Logo" class="auth-logo" />
          </div>

          <h1 class="auth-title">Join Us! 🎉</h1>
          <p class="auth-subtitle">Already have an account? <a href="#" @click.prevent="switchToLogin" class="create-link">Sign in here</a></p>

          <!-- Progress Indicator -->
          <div class="signup-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: signupProgress + '%' }"></div>
            </div>
            <p class="progress-text">{{ progressText }}</p>
          </div>

          <!-- Enhanced Messages -->
          <transition name="slide-fade">
            <div v-if="signupError" class="error-message">
              <span class="message-icon">⚠️</span>
              {{ signupError }}
            </div>
          </transition>

          <transition name="slide-fade">
            <div v-if="signupSuccess" class="success-message">
              <span class="message-icon">✅</span>
              {{ signupSuccess }}
            </div>
          </transition>

          <form @submit.prevent="handleSignUp" class="auth-form">
            <div class="form-row">
              <div class="form-group half-width">
                <label for="firstName" class="form-label">
                  <span class="label-icon">👤</span>
                  First Name
                </label>
                <div class="input-wrapper">
                  <input
                    type="text"
                    id="firstName"
                    v-model="signupForm.firstName"
                    class="form-input"
                    placeholder="John"
                    required
                  />
                </div>
              </div>

              <div class="form-group half-width">
                <label for="lastName" class="form-label">
                  <span class="label-icon">👤</span>
                  Last Name
                </label>
                <div class="input-wrapper">
                  <input
                    type="text"
                    id="lastName"
                    v-model="signupForm.lastName"
                    class="form-input"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="signupEmail" class="form-label">
                <span class="label-icon">📧</span>
                E-mail
              </label>
              <div class="input-wrapper">
                <input
                  type="email"
                  id="signupEmail"
                  v-model="signupForm.email"
                  class="form-input"
                  placeholder="example@gmail.com"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="phone" class="form-label">
                <span class="label-icon">📱</span>
                Phone Number
              </label>
              <div class="input-wrapper">
                <input
                  type="tel"
                  id="phone"
                  v-model="signupForm.phone"
                  class="form-input"
                  placeholder="+63 912 345 6789"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="signupPassword" class="form-label">
                <span class="label-icon">🔒</span>
                Password
              </label>
              <div class="input-wrapper">
                <input
                  :type="showSignupPassword ? 'text' : 'password'"
                  id="signupPassword"
                  v-model="signupForm.password"
                  class="form-input"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showSignupPassword = !showSignupPassword"
                  :aria-label="showSignupPassword ? 'Hide password' : 'Show password'"
                >
                  <span class="eye-icon">{{ showSignupPassword ? '👁️' : '👁️‍🗨️' }}</span>
                </button>
              </div>
              <!-- Password Strength Indicator -->
              <div v-if="signupForm.password" class="password-strength">
                <div class="strength-bars">
                  <div v-for="i in 4" :key="i" 
                       :class="['strength-bar', { active: i <= passwordStrength }]"
                       :style="{ backgroundColor: strengthColor }"></div>
                </div>
                <span class="strength-text" :style="{ color: strengthColor }">{{ strengthText }}</span>
              </div>
            </div>

            <div class="checkbox-group">
              <input type="checkbox" id="terms" v-model="signupForm.agreeToTerms" required />
              <label for="terms">
                I agree to the <a href="#" @click.prevent="showTerms">Terms of Service</a>
              </label>
            </div>

            <button type="submit" class="auth-button" :disabled="isLoading">
              <span v-if="isLoading" class="loading-spinner"></span>
              <span v-else class="button-icon">🎉</span>
              {{ isLoading ? 'Creating Account...' : 'Create Account' }}
            </button>
          </form>

          <div class="auth-divider">OR</div>

          <div class="social-login">
            <button class="social-btn google-btn" @click="socialSignUp('google')" :disabled="isLoading">
              <span class="social-icon">🔴</span>
              <span>Continue with Google</span>
            </button>
            <button class="social-btn facebook-btn" @click="socialSignUp('facebook')" :disabled="isLoading">
              <span class="social-icon">📘</span>
              <span>Continue with Facebook</span>
            </button>
          </div>

          <!-- Back to Home Button -->
          <button class="back-home-btn" @click="$emit('backToHome')">
            <span class="back-icon">←</span>
            Back to Home
          </button>
        </div>

        <!-- Right side promotional content for signup -->
        <div class="promo-content">
        <!--  <div class="promo-badge">🎁 NEW MEMBER</div> -->
          <div class="promo-image">
            <img src="../assets/food/ramyeon-hero.jpg" alt="Delicious Ramyeon" class="ramyeon-image" />
            <div class="image-overlay"></div>
          </div>
            <div class="promo-text">
           <!-- <div class="promo-timer">🍜 ENJOY RAMYEON YOUR WAY!</div>-->
           <!-- <h1 class="promo-title">WELCOME BONUS</h1>
            <div class="promo-code">
              <span class="code-label">GET STARTED WITH</span>
            </div>
            <h3 class="promo-discount">25% OFF</h3>
            <p class="bonus-text">✨ Plus earn points with every order!</p>-->
            <button class="order-btn">
              <span>Join Now</span>
              <span class="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { authAPI, apiBaseUrl } from '../services/api';

export default {
  name: 'Auth',
  emits: ['loginSuccess', 'signUpSuccess', 'backToHome'],
  data() {
    return {
      isSignUpMode: false,
      isLoading: false,
      
      // Login form
      loginForm: {
        email: '',
        password: '',
        rememberMe: false
      },
      loginError: '',
      loginSuccess: '',
      showLoginPassword: false,
      
      // Signup form
      signupForm: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        agreeToTerms: false
      },
      signupError: '',
      signupSuccess: '',
      showSignupPassword: false,
      
      logoSrc: require('../assets/Nav Bar/Logo.png')
    }
  },
  computed: {
    signupProgress() {
      let progress = 0;
      const fields = ['firstName', 'lastName', 'email', 'phone', 'password'];
      const filledFields = fields.filter(field => this.signupForm[field]).length;
      progress = (filledFields / fields.length) * 100;
      return Math.min(progress, 100);
    },
    progressText() {
      const percent = Math.round(this.signupProgress);
      if (percent === 0) return 'Let\'s get started! 🚀';
      if (percent < 40) return 'Keep going! 💪';
      if (percent < 70) return 'Almost there! 🌟';
      if (percent < 100) return 'Just a bit more! 🎯';
      return 'Perfect! Ready to sign up! 🎉';
    },
    passwordStrength() {
      const password = this.signupForm.password;
      if (!password) return 0;
      
      let strength = 0;
      if (password.length >= 8) strength++;
      if (password.length >= 12) strength++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[^a-zA-Z\d]/.test(password)) strength++;
      
      return Math.min(strength, 4);
    },
    strengthText() {
      const strength = this.passwordStrength;
      if (strength === 0) return '';
      if (strength === 1) return 'Weak 😔';
      if (strength === 2) return 'Fair 😐';
      if (strength === 3) return 'Good 🙂';
      return 'Strong 😎';
    },
    strengthColor() {
      const strength = this.passwordStrength;
      if (strength <= 1) return '#ef4444';
      if (strength === 2) return '#f59e0b';
      if (strength === 3) return '#10b981';
      return '#059669';
    }
  },
  methods: {
    switchToSignUp() {
      this.isSignUpMode = true;
      this.clearMessages();
    },
    
    switchToLogin() {
      this.isSignUpMode = false;
      this.clearMessages();
    },
    
    clearMessages() {
      this.loginError = '';
      this.loginSuccess = '';
      this.signupError = '';
      this.signupSuccess = '';
    },
    
    async handleLogin() {
      this.loginError = '';
      this.loginSuccess = '';
      this.isLoading = true;
      
      try {
        const response = await authAPI.login(
          this.loginForm.email.toLowerCase().trim(),
          this.loginForm.password
        );
        
        const customer = response.customer || response.user || {};
        const userSession = {
          id: customer._id || customer.id,
          email: customer.email,
          username: customer.username,
          fullName: customer.full_name,
          firstName: customer.full_name ? customer.full_name.split(' ')[0] : '',
          lastName: customer.full_name ? customer.full_name.split(' ').slice(1).join(' ') : '',
          phone: customer.phone || '',
          points: customer.loyalty_points || 0,
          deliveryAddress: customer.delivery_address || {},
          loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('ramyeon_user_session', JSON.stringify(userSession));
        
        if (this.loginForm.rememberMe) {
          localStorage.setItem('ramyeon_remember_user', this.loginForm.email);
        }
        
        this.loginSuccess = response.message || 'Login successful! Welcome back!';
        
        setTimeout(() => {
          this.$emit('loginSuccess', userSession);
        }, 1000);
        
      } catch (error) {
        console.error('Login error:', error);
        this.loginError = error.error || error.detail || error.message || 'Invalid email or password. Please try again.';
      } finally {
        this.isLoading = false;
      }
    },
    
    async handleSignUp() {
      this.signupError = '';
      this.signupSuccess = '';
      
      if (!this.signupForm.agreeToTerms) {
        this.signupError = 'Please agree to the Terms of Service';
        return;
      }
      
      this.isLoading = true;
      
      try {
        // Ensure any existing session is cleared before creating a new account
        await authAPI.logout();

        const response = await authAPI.register({
          first_name: this.signupForm.firstName.trim(),
          last_name: this.signupForm.lastName.trim(),
          email: this.signupForm.email.toLowerCase().trim(),
          phone: this.signupForm.phone,
          password: this.signupForm.password,
          delivery_address: {},
        });

        const customer = response.customer || response.user || {};
        const responseFirstName = customer.first_name || customer.firstName;
        const responseLastName = customer.last_name || customer.lastName;
        const responseFullName = customer.full_name || customer.fullName || '';

        const derivedFirstName = responseFirstName || responseFullName.split(' ')[0] || this.signupForm.firstName.trim();
        const derivedLastName = responseLastName || responseFullName.split(' ').slice(1).join(' ') || this.signupForm.lastName.trim();

        const userSession = {
          id: customer._id || customer.id,
          email: customer.email,
          username: customer.username,
          fullName: responseFullName || `${derivedFirstName} ${derivedLastName}`.trim(),
          firstName: derivedFirstName,
          lastName: derivedLastName,
          phone: customer.phone || '',
          points: customer.loyalty_points || 0,
          deliveryAddress: customer.delivery_address || {},
          loginTime: new Date().toISOString(),
          emailVerified: customer.email_verified,
          authMode: customer.auth_mode || 'password',
        };

        localStorage.setItem('ramyeon_user_session', JSON.stringify(userSession));

        this.signupSuccess = response.message || 'Account created successfully! Please verify your email.';

        setTimeout(() => {
          this.$emit('signUpSuccess', userSession);
        }, 1500);
         
      } catch (error) {
        console.error('SignUp error:', error);
        this.signupError = error.error || error.detail || error.message || 'An error occurred during registration. Please try again.';
      } finally {
        this.isLoading = false;
      }
    },
    
    handleForgotPassword() {
      alert('Forgot password functionality will be implemented soon!');
    },
    
    showTerms() {
      alert('Terms of Service will be displayed here in a modal.');
    },
    
    socialLogin(provider) {
      this.startSocialAuth(provider, 'login');
    },

    socialSignUp(provider) {
      this.startSocialAuth(provider, 'signup');
    },

    startSocialAuth(provider, mode) {
      if (this.isLoading) {
        return;
      }

      const supportedProviders = ['google', 'facebook'];
      if (!supportedProviders.includes(provider)) {
        const message = `${provider} login is not supported yet.`;
        if (mode === 'signup') {
          this.signupError = message;
        } else {
          this.loginError = message;
        }
        return;
      }

      try {
        this.isLoading = true;
        const redirectUri = `${window.location.origin}/#/oauth`;
        const baseUrl = (apiBaseUrl || '').replace(/\/$/, '');

        if (!baseUrl) {
          throw new Error('Missing API base URL configuration.');
        }

        const authorizeUrl = `${baseUrl}/auth/oauth/${provider}/authorize/?redirect_uri=${encodeURIComponent(redirectUri)}`;
        window.location.href = authorizeUrl;
      } catch (error) {
        console.error('OAuth redirect error:', error);
        const message = 'Failed to start social sign-in. Please try again later.';
        if (mode === 'signup') {
          this.signupError = message;
        } else {
          this.loginError = message;
        }
        this.isLoading = false;
      }
    }
  },
  
  mounted() {
    const rememberedEmail = localStorage.getItem('ramyeon_remember_user');
    if (rememberedEmail) {
      this.loginForm.email = rememberedEmail;
      this.loginForm.rememberMe = true;
    }
  }
}
</script>

<style scoped src="./Auth.css"></style>

