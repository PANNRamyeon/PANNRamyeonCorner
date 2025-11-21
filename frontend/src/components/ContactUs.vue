<template>
  <div class="contact-us-container">
    <div class="contact-us-page">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <span class="get-started-badge">Get Started</span>
          <h1 class="hero-title">
            Get in touch with us.<br />
            We're here to assist you.
          </h1>
          <p class="hero-subtitle">
            Have questions about our delicious ramyeon? Need help with your order? 
            We'd love to hear from you!
          </p>
          <div class="social-icons-hero">
            <a href="https://www.facebook.com/ramyeoncornerbislig" class="social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <img src="../assets/Nav Bar/fb.png" alt="Facebook" />
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
      </section>

      <!-- Contact Form Section -->
      <section class="form-section">
        <div class="form-container">
          <h2 class="form-title">Send us a Message</h2>
          <form class="contact-form" @submit.prevent="submitForm">
            <div class="form-grid">
              <div class="form-group">
                <label for="name">Full Name *</label>
                <input 
                  id="name"
                  type="text" 
                  v-model="name" 
                  placeholder="Enter your full name" 
                  required 
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="email">Email Address *</label>
                <input 
                  id="email"
                  type="email" 
                  v-model="email" 
                  placeholder="Enter your email address" 
                  required 
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input 
                  id="phone"
                  type="tel" 
                  v-model="phone" 
                  placeholder="Enter your phone number (optional)" 
                  class="form-input"
                />
              </div>
            </div>
            <div class="form-group full-width">
              <label for="message">Message *</label>
              <textarea 
                id="message"
                v-model="message" 
                placeholder="Tell us how we can help you..." 
                required
                class="form-textarea"
                rows="5"
              ></textarea>
            </div>
            <button type="submit" class="submit-btn">
              <span>Send Message</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </section>

      <!-- Contact Information Section -->
      <section class="contact-info-section">
        <h2 class="section-title">We are always happy to assist you</h2>
        <div class="contact-info-grid">
          <div class="info-card">
            <div class="info-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3>Email Address</h3>
            <p class="contact-detail">ramyeoncornerbislig@gmail.com</p>
            <p class="contact-hours">
              <strong>Assistance hours:</strong><br />
              Monday - Friday: 6 AM to 8 PM EST
            </p>
          </div>
          <div class="info-card">
            <div class="info-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 16.92V19.92C22 20.52 21.39 21 20.92 21C9.11 21 1 12.89 1 1.08C1 0.61 1.48 0 2.08 0H5.08C5.68 0 6.08 0.4 6.08 1C6.08 3.25 6.5 5.45 7.34 7.47C7.43 7.7 7.35 7.96 7.13 8.18L5.82 9.49C7.1 12.25 9.75 14.9 12.51 16.18L13.82 14.87C14.04 14.65 14.3 14.57 14.53 14.66C16.55 15.5 18.75 15.92 21 15.92C21.6 15.92 22 16.32 22 16.92Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3>Phone Number</h3>
            <p class="contact-detail">0946 102 0314</p>
            <p class="contact-hours">
              <strong>Assistance hours:</strong><br />
              Monday - Friday: 6 AM to 8 PM EST
            </p>
          </div>
        </div>
      </section>

      <!-- Newsletter Section -->
      <section class="newsletter-section">
        <div class="newsletter-content">
          <div class="newsletter-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="newsletter-title">Stay Updated with Ramyeon Corner</h2>
          <p class="newsletter-description">
            Check on our website and our facebook page to be the first to know about new menu items, 
            special promotions, and exclusive deals delivered straight to your inbox.
          </p>
          <!--<form class="newsletter-form" @submit.prevent="subscribeNewsletter">
            <div class="newsletter-input-group">
              <div class="input-wrapper">
                <input 
                  type="email" 
                  v-model="newsletterEmail" 
                  placeholder="Enter your email address" 
                  required 
                  class="newsletter-input"
                  :class="{ 'error': emailError, 'success': emailSuccess }"
                />
                <div class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
              <button type="submit" class="newsletter-btn" :disabled="isSubscribing">
                <span v-if="!isSubscribing">Subscribe</span>
                <span v-else class="loading-spinner">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <svg class="arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <div class="form-feedback">
              <p v-if="emailError" class="error-message">{{ emailError }}</p>
              <p v-if="emailSuccess" class="success-message">{{ emailSuccess }}</p>
            </div>
            <p class="newsletter-privacy">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
                <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="currentColor" stroke-width="2"/>
              </svg>
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>-->
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import './ContactUs.css';

export default {
  name: 'ContactUs',
  data() {
    return {
      name: '',
      email: '',
      phone: '',
      message: '',
      newsletterEmail: '',
      footerNewsletterEmail: '',
      emailError: '',
      emailSuccess: '',
      isSubscribing: false,
    };
  },
  methods: {
    submitForm() {
      alert('Message sent! Thank you for contacting us.');
      this.name = '';
      this.email = '';
      this.phone = '';
      this.message = '';
    },
    async subscribeNewsletter() {
      // Clear previous messages
      this.emailError = '';
      this.emailSuccess = '';
      
      // Validate email
      if (!this.isValidEmail(this.newsletterEmail)) {
        this.emailError = 'Please enter a valid email address.';
        return;
      }
      
      this.isSubscribing = true;
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        this.emailSuccess = 'Successfully subscribed! Check your inbox for confirmation.';
        this.newsletterEmail = '';
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          this.emailSuccess = '';
        }, 5000);
        
      } catch (error) {
        this.emailError = 'Something went wrong. Please try again.';
      } finally {
        this.isSubscribing = false;
      }
    },
    subscribeFooterNewsletter() {
      alert('Subscribed to newsletter!');
      this.footerNewsletterEmail = '';
    },
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
  },
};
</script>
