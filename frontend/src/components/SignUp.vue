<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- Logo with animation -->
      <div class="logo-container">
        <img :src="logoSrc" alt="Ramyeon Corner Logo" class="auth-logo" />
      </div>

      <h1 class="auth-title">Join Us! 🎉</h1>
      <p class="auth-subtitle">Already have an account? <a href="#" @click.prevent="$emit('switchToLogin')" class="create-link">Sign in here</a></p>

      <!-- Progress Indicator -->
      <div class="signup-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: signupProgress + '%' }"></div>
        </div>
        <p class="progress-text">{{ progressText }}</p>
      </div>

      <!-- Enhanced Messages -->
      <transition name="slide-fade">
        <div v-if="errorMessage" class="error-message">
          <span class="message-icon">⚠️</span>
          {{ errorMessage }}
        </div>
      </transition>

      <transition name="slide-fade">
        <div v-if="successMessage" class="success-message">
          <span class="message-icon">✅</span>
          {{ successMessage }}
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
                v-model="formData.firstName"
                :class="['form-input', { error: errors.firstName, success: !errors.firstName && formData.firstName }]"
                placeholder="John"
                required
              />
              <span v-if="!errors.firstName && formData.firstName" class="input-check">✓</span>
            </div>
            <transition name="fade">
              <span v-if="errors.firstName" class="field-error">❌ {{ errors.firstName }}</span>
            </transition>
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
                v-model="formData.lastName"
                :class="['form-input', { error: errors.lastName, success: !errors.lastName && formData.lastName }]"
                placeholder="Doe"
                required
              />
              <span v-if="!errors.lastName && formData.lastName" class="input-check">✓</span>
            </div>
            <transition name="fade">
              <span v-if="errors.lastName" class="field-error">❌ {{ errors.lastName }}</span>
            </transition>
          </div>
        </div>

        <div class="form-group">
          <label for="email" class="form-label">
            <span class="label-icon">📧</span>
            E-mail
          </label>
          <div class="input-wrapper">
            <input
              type="email"
              id="email"
              v-model="formData.email"
              :class="['form-input', { error: errors.email, success: !errors.email && formData.email }]"
              placeholder="example@gmail.com"
              required
            />
            <span v-if="!errors.email && formData.email" class="input-check">✓</span>
          </div>
          <transition name="fade">
            <span v-if="errors.email" class="field-error">❌ {{ errors.email }}</span>
          </transition>
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
              v-model="formData.phone"
              :class="['form-input', { error: errors.phone, success: !errors.phone && formData.phone }]"
              placeholder="+63 912 345 6789"
              required
            />
            <span v-if="!errors.phone && formData.phone" class="input-check">✓</span>
          </div>
          <transition name="fade">
            <span v-if="errors.phone" class="field-error">❌ {{ errors.phone }}</span>
          </transition>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">
            <span class="label-icon">🔒</span>
            Password
          </label>
          <div class="input-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="formData.password"
              :class="['form-input', { error: errors.password, success: !errors.password && formData.password }]"
              placeholder="Create a strong password"
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click="togglePassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <span class="eye-icon">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</span>
            </button>
          </div>
          <!-- Password Strength Indicator -->
          <div v-if="formData.password" class="password-strength">
            <div class="strength-bars">
              <div v-for="i in 4" :key="i" 
                   :class="['strength-bar', { active: i <= passwordStrength }]"
                   :style="{ backgroundColor: strengthColor }"></div>
            </div>
            <span class="strength-text" :style="{ color: strengthColor }">{{ strengthText }}</span>
          </div>
          <transition name="fade">
            <span v-if="errors.password" class="field-error">❌ {{ errors.password }}</span>
          </transition>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">
            <span class="label-icon">🔐</span>
            Confirm Password
          </label>
          <div class="input-wrapper">
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              id="confirmPassword"
              v-model="formData.confirmPassword"
              :class="['form-input', { error: errors.confirmPassword, success: !errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword }]"
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click="toggleConfirmPassword"
              :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
            >
              <span class="eye-icon">{{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}</span>
            </button>
            <span v-if="formData.confirmPassword && formData.password === formData.confirmPassword" class="input-check">✓</span>
          </div>
          <transition name="fade">
            <span v-if="errors.confirmPassword" class="field-error">❌ {{ errors.confirmPassword }}</span>
          </transition>
        </div>

        <div class="checkbox-group">
          <input type="checkbox" id="terms" v-model="formData.agreeToTerms" required />
          <label for="terms">
            I agree to the <a href="#" @click.prevent="showTerms">Terms of Service</a>
            and <a href="#" @click.prevent="showPrivacy">Privacy Policy</a>
          </label>
        </div>

        <div class="checkbox-group">
          <input type="checkbox" id="newsletter" v-model="formData.subscribeNewsletter" />
          <label for="newsletter">Subscribe to our newsletter for exclusive deals</label>
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

    <!-- Right side promotional content -->
    <div class="promo-content">
    <!--  <div class="promo-badge">🎁 NEW MEMBER</div>-->
      <div class="promo-image">
        <img src="../assets/food/ramyeon-hero.jpg" alt="Delicious Ramyeon" class="ramyeon-image" />
        <div class="image-overlay"></div>
      </div>
       <!--<div class="promo-text">
         <div class="promo-timer">🍜 ENJOY RAMYEON YOUR WAY!</div>
        <h1 class="promo-title">WELCOME BONUS</h1>
        <div class="promo-code">
          <span class="code-label">GET STARTED WITH</span>
        </div>
        <h3 class="promo-discount">25% OFF</h3>
        <p class="bonus-text">✨ Plus earn points with every order!</p>
        <button class="order-btn">
          <span>Join Now</span>
          <span class="btn-arrow">→</span>
        </button>
      </div>-->
    </div>
  </div>
</template>

<script>
import { authAPI } from '../services/api';

export default {
  name: 'SignUp',
  emits: ['switchToLogin', 'signUpSuccess', 'backToHome'],
  data() {
    return {
      formData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
        subscribeNewsletter: false
      },
      errors: {},
      errorMessage: '',
      successMessage: '',
      isLoading: false,
      showPassword: false,
      showConfirmPassword: false,
      logoSrc: require('../assets/Nav Bar/Logo.png')
    }
  },
  computed: {
    signupProgress() {
      let progress = 0;
      const fields = ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword'];
      const filledFields = fields.filter(field => this.formData[field] && !this.errors[field]).length;
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
      const password = this.formData.password;
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
    validateForm() {
      this.errors = {};

      // First name validation
      if (!this.formData.firstName.trim()) {
        this.errors.firstName = 'First name is required';
      } else if (this.formData.firstName.trim().length < 2) {
        this.errors.firstName = 'First name must be at least 2 characters';
      }

      // Last name validation
      if (!this.formData.lastName.trim()) {
        this.errors.lastName = 'Last name is required';
      } else if (this.formData.lastName.trim().length < 2) {
        this.errors.lastName = 'Last name must be at least 2 characters';
      }

      // Email validation
      if (!this.formData.email) {
        this.errors.email = 'Email is required';
      } else if (!this.isValidEmail(this.formData.email)) {
        this.errors.email = 'Please enter a valid email address';
      }

      // Phone validation
      if (!this.formData.phone) {
        this.errors.phone = 'Phone number is required';
      } else if (!this.isValidPhone(this.formData.phone)) {
        this.errors.phone = 'Please enter a valid phone number';
      }

      // Password validation
      if (!this.formData.password) {
        this.errors.password = 'Password is required';
      } else if (this.formData.password.length < 8) {
        this.errors.password = 'Password must be at least 8 characters';
      } else if (!this.isStrongPassword(this.formData.password)) {
        this.errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }

      // Confirm password validation
      if (!this.formData.confirmPassword) {
        this.errors.confirmPassword = 'Please confirm your password';
      } else if (this.formData.password !== this.formData.confirmPassword) {
        this.errors.confirmPassword = 'Passwords do not match';
      }

      return Object.keys(this.errors).length === 0;
    },

    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    isValidPhone(phone) {
      const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
    },

    isStrongPassword(password) {
      const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      return strongRegex.test(password);
    },

    async handleSignUp() {
      this.errorMessage = '';
      this.successMessage = '';

      if (!this.validateForm()) {
        return;
      }

      if (!this.formData.agreeToTerms) {
        this.errorMessage = 'Please agree to the Terms of Service and Privacy Policy';
        return;
      }

      this.isLoading = true;

      try {
        // Call backend API to register user
        // Backend expects: { email, password, first_name, last_name, phone, delivery_address }
        // Backend returns: { success: True, customer: {...}, message: "..." }
        const response = await authAPI.register({
          first_name: this.formData.firstName.trim(),
          last_name: this.formData.lastName.trim(),
          email: this.formData.email.toLowerCase().trim(),
          phone: this.formData.phone,
          password: this.formData.password,
        });

        // Create user session from API response
        // Backend returns: { success: True, customer: {...}, message: "..." }
        // Note: Registration doesn't return tokens - user needs to log in separately
        const customer = response.customer || {};
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

        // Note: Registration doesn't auto-login, so we don't save session yet
        // User will need to log in after registration
        // localStorage.setItem('ramyeon_user_session', JSON.stringify(userSession));

        this.successMessage = response.message || 'Account created successfully! Please log in to continue.';

        // Redirect to login after successful registration
        setTimeout(() => {
          this.$emit('switchToLogin');
          // Clear form
          this.formData = {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: ''
          };
          this.errors = {};
        }, 2000);

      } catch (error) {
        console.error('SignUp error:', error);
        
        // Handle specific error messages from backend
        if (error.error) {
          this.errorMessage = error.error;
        } else if (error.email) {
          this.errorMessage = Array.isArray(error.email) ? `Email: ${error.email[0]}` : `Email: ${error.email}`;
        } else if (error.password) {
          this.errorMessage = Array.isArray(error.password) ? `Password: ${error.password[0]}` : `Password: ${error.password}`;
        } else if (error.username) {
          this.errorMessage = Array.isArray(error.username) ? `Username: ${error.username[0]}` : `Username: ${error.username}`;
        } else if (error.message) {
          this.errorMessage = error.message;
        } else if (error.detail) {
          this.errorMessage = error.detail;
        } else {
          this.errorMessage = 'An error occurred during registration. Please try again.';
        }
      } finally {
        this.isLoading = false;
      }
    },

    togglePassword() {
      this.showPassword = !this.showPassword;
    },

    toggleConfirmPassword() {
      this.showConfirmPassword = !this.showConfirmPassword;
    },

    showTerms() {
      alert('Terms of Service will be displayed here in a modal.');
    },

    showPrivacy() {
      alert('Privacy Policy will be displayed here in a modal.');
    },

    socialSignUp(provider) {
      if (this.isLoading) return;

      this.isLoading = true;

      // Simulate social signup
      setTimeout(() => {
        const mockUser = {
          id: Date.now(),
          email: `user@${provider}.com`,
          firstName: 'Social',
          lastName: 'User',
          phone: '+1234567890',
          points: 100, // Bonus points for social signup
          vouchers: [
            {
              id: 1,
              title: 'Social Signup Bonus',
              subtitle: 'Thank you for joining!',
              discount: '30% OFF',
              code: 'SOCIAL30',
              qrCode: 'SOCIAL30-QR-' + Date.now()
            }
          ],
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('ramyeon_user_session', JSON.stringify(mockUser));
        this.successMessage = `${provider} signup successful! Welcome to Ramyeon Corner!`;

        setTimeout(() => {
          this.$emit('signUpSuccess', mockUser);
        }, 1000);

        this.isLoading = false;
      }, 1500);
    }
  }
}
</script>

<style src="./AuthStyles.css"></style>
