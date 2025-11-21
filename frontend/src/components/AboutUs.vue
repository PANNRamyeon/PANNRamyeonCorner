<template>
  <div class="about-us">
    <!-- Top Bar and Navigation from HelloWorld.vue will be moved to App.vue -->
    
    <!-- Hero Section -->
    <section class="hero-section">
      <h1>We provide Korean food in Bislig</h1>
      <p>Our story begins with a vision to create a unique dining experience that merges fine dining, exceptional service, and a vibrant ambiance.</p>
    </section>

    <!-- Contact Info Section -->
    <div class="info-section">
      <div class="contact-info">
        <div class="contact-item">
          <div class="contact-header">
            <span class="contact-icon">📞</span>
            <h3>Contact Us</h3>
          </div>
          <div class="contact-content">
            <p>0946 102 0314</p>
            <p>ramyeoncornerbislig@gmail.com</p>
          </div>
        </div>
        <div class="contact-item location-item" @click="openGoogleMaps">
          <div class="contact-header">
            <span class="contact-icon">📍</span>
            <h3>Location</h3>
          </div>
          <div class="contact-content">
            <p>Purok I, Castillo, Mangagoy, Bislig, Philippines</p>
          </div>
        </div>
        <div class="contact-item">
          <div class="contact-header">
            <span class="contact-icon">🕒</span>
            <h3>Hours</h3>
          </div>
          <div class="contact-content">
            <p>Mon-Fri: 10:00 AM - 10:00 PM</p>
            <p>Sat-Sun: 11:00 AM - 11:00 PM</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Story Section -->
    <div class="info-section">
      <div class="story-section">
        <div class="story-content">
          <h2>A little information for our valuable guest</h2>
          <p>At Bislig, we believe that dining is not just about food but also about the overall experience. Our staff, renowned for their warmth and dedication, strives to make every visit an unforgettable event.</p>
          <p>Our culinary team takes pride in crafting authentic Korean dishes using the finest ingredients, ensuring each plate tells a story of tradition and innovation. From our signature ramyeon to our carefully curated side dishes, every item on our menu is prepared with passion and precision.</p>
        </div>
        <div class="story-image">
          <img src="../assets/Home/resto.png" alt="Restaurant Interior" />
        </div>
      </div>
    </div>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="stats-container">
        <div class="stat-item">
          <h3>1</h3>
          <p>Locations</p>
        </div>
        <div class="stat-item">
          <h3>2024</h3>
          <p>Founded</p>
        </div>
        <div class="stat-item">
          <h3>6</h3>
          <p>Staff Members</p>
        </div>
        <div class="stat-item">
          <h3>100%</h3>
          <p>Satisfied Customers</p>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials">
      <h2>What Our Customers Say</h2>
      <div class="testimonial-grid">
        <div class="testimonial-card">
          <p class="testimonial-text">"The best restaurant! Last night we dined at your place and were simply blown away. From the moment we stepped in, we were enveloped in an atmosphere of warmth, greeted with warm smiles."</p>
          <div class="testimonial-author">
            <div class="author-info">
              <h4>Jennifer Robson</h4>
              <p>Bislig City, Surigao del Sur</p>
            </div>
          </div>
        </div>
        <div class="testimonial-card">
          <p class="testimonial-text">"Simply delicious! Place exceeded my expectations on all fronts. The ambiance was cozy and relaxed, making it a perfect venue for our date night. Every dish was expertly prepared and beautifully presented."</p>
          <div class="testimonial-author">
            <div class="author-info">
              <h4>Matt Carson</h4>
              <p>Bislig City, Surigao del Sur</p>
            </div>
          </div>
        </div>
        <div class="testimonial-card">
          <p class="testimonial-text">"One of a kind restaurant! The culinary experience at Bislig is hard to beat. The atmosphere is vibrant, the food - nothing short of extraordinary. The staff went above and beyond. Highly recommended."</p>
          <div class="testimonial-author">
            <div class="author-info">
              <h4>Andy Smith</h4>
              <p>Bislig City, Surigao del Sur</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'AboutUs',
  methods: {
    openGoogleMaps() {
      window.open('https://maps.app.goo.gl/yZMr7g5xoYwTxZBj7', '_blank');
    }
  }
}
</script>

<style src="./AboutUs_Enhanced.css" scoped></style>
