<template>
  <div class="home">

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-text">
          <h1>Are you starving?</h1>
          <p>Within a few clicks, find meals that are accessible near you</p>
          <div class="order-form">
            <div class="toggle-buttons" :class="{ 'pickup-active': deliveryType === 'Pickup' }">
              <button 
                :class="{ active: deliveryType === 'Delivery' }" 
                @click="setDeliveryType('Delivery')"
              >
                <img :src="deliveryType === 'Delivery' ? require('../assets/Home/Delivery 1.png') : require('../assets/Home/Delivery.png')" alt="Delivery" />
                Delivery
              </button>
              <button 
                :class="{ active: deliveryType === 'Pickup' }" 
                @click="setDeliveryType('Pickup')"
              >
                <img :src="deliveryType === 'Pickup' ? require('../assets/Home/Pick up 1.png') : require('../assets/Home/Pick up.png')" alt="Pickup" />
                Pickup
              </button>
            </div>
            <div class="address-order">
              <template v-if="deliveryType === 'Delivery'">
                <div class="input-with-icon">
                  <img src="../assets/Home/Pin.png" alt="Location" class="input-icon-img" />
                  <input 
                    type="text" 
                    placeholder="Enter Your Address" 
                    v-model="address"
                    aria-label="Delivery address input"
                    role="textbox" 
                  />
                </div>
              </template>
              <template v-else>
                <div class="input-with-icon">
                  <img src="../assets/Home/Clock.png" alt="Time" class="input-icon-img" />
                  <input 
                    type="time" 
                    v-model="pickupTime" 
                    class="time-input" 
                    placeholder="Pickup Time"
                    aria-label="Pickup time selection"
                    role="time" 
                  />
                </div>
              </template>
              <button 
                class="order-btn" 
                @click="orderNow"
                role="button"
                aria-label="Place order"
              >ORDER NOW</button>
            </div>
          </div>
        </div>
        <div class="hero-image">
          <img src="../assets/Home/BigRamen.png" alt="Ramyeon Bowl" class="hero-img" />
        </div>
      </div>
    </section>

    <!-- Deals Section -->
    <section class="deals">
      <div class="deals-header">
        <h2>Up to -40% 🎉 Ramyeon Corner exclusive deals</h2>
        <div class="category-tabs">
          <button v-for="category in categories" :key="category" :class="{ active: activeCategory === category }" @click="setActiveCategory(category)">
            {{ category }}
          </button>
        </div>
      </div>
      <div class="deal-cards">
        <div class="deal-card" v-for="deal in filteredDeals" :key="deal.name">
          <div class="deal-image-container">
            <img :src="deal.image" :alt="deal.name" />
            <span class="discount-badge">-{{ deal.discount }}%</span>
          </div>
          <div class="deal-info">
            <p>{{ deal.category }}</p>
            <h3>{{ deal.name }}</h3>
          </div>
        </div>
      </div>
    </section>

    <!-- Popular Items Section -->
    <section class="popular-items">
      <h2>Popular items</h2>
      <div class="popular-cards">
        <div class="popular-card" v-for="item in popularItems" :key="item.name">
          <img :src="item.image" :alt="item.name" />
          <div class="popular-info">
            <h4>{{ item.name }}</h4>
            <p>P{{ item.price }}</p>
            <button class="order-btn" @click="orderNow">Order Now</button>
          </div>
        </div>
      </div>
    </section>

    <!-- How does it work Section -->
    <section class="how-it-works">
      <h2>How does it work</h2>
      <div class="steps">
        <div class="step">
          <div class="icon">
            <img src="../assets/Home/Bigpin.png" alt="Select location" />
          </div>
          <h3>Select location</h3>
          <p>Choose the location where your food will be delivered.</p>
        </div>
        <div class="step">
          <div class="icon">
            <img src="../assets/Home/bell.png" alt="Choose order" />
          </div>
          <h3>Choose order</h3>
          <p>Check over hundreds of menus to pick your favorite food</p>
        </div>
        <div class="step">
          <div class="icon">
            <img src="../assets/Home/Invoice.png" alt="Pay advanced" />
          </div>
          <h3>Pay advanced</h3>
          <p>It's quick, safe, and simple. Select several methods of payment</p>
        </div>
        <div class="step">
          <div class="icon">
            <img src="../assets/Home/donut.png" alt="Enjoy meals" />
          </div>
          <h3>Enjoy meals</h3>
          <p>Food is made and delivered directly to your home.</p>
        </div>
      </div>
    </section>

    <!-- Celebrate parties Section -->
    <section class="celebrate-parties">
      <div class="celebrate-content">
        <div class="celebrate-image">
          <img src="../assets/Home/resto.png" alt="Celebrate parties at Ramyeon Corner" />
        </div>
        <div class="celebrate-text">
          <h2>Celebrate parties here at <span class="highlight">Ramyeon Corner</span></h2>
          <p>Celebrate your special moments at Ramyeon Corner! Enjoy delicious Korean-style ramen and sizzling side dishes, perfect for any party. Check out our best deals for group celebrations!</p>
          <button class="contact-btn" @click="goToContact" >Contact Us ></button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data() {
    return {
      deliveryType: 'Delivery',
      address: '',
      pickupTime: '',
      categories: ['Noodle', 'Rice Cake', 'Side dish', 'Drinks'],
      activeCategory: 'Noodle',
      deals: [
        {
          name: 'Ice Talk',
          category: 'Drinks',
          discount: 40,
          image: 'https://exoticsnacks.com/cdn/shop/files/9_6243126e-1a22-4077-915e-0c23ed74b26b.png'
        },
        {
          name: 'Kimchi & Fish Cake',
          category: 'Side dish',
          discount: 20,
          image: 'https://recipe1.ezmember.co.kr/cache/recipe/2022/05/05/8b3426862e0d9d60035828927d3f0c7d1.jpg'
        },
        {
          name: 'Shin Ramyun',
          category: 'Noodle',
          discount: 17,
          image: 'https://www.cocoislandmart.com/cdn/shop/files/POST_320_x_320_px_37.png?v=1725385975'
        },
        {
          name: 'Tteokbokki',
          category: 'Rice Cake',
          discount: 50,
          image: 'https://www.umami.recipes/api/image/recipes/pI4rKkDrKbrKcUcHIqld/images/ZlLw3bYkiYutITdIi7KdfW?w=3840&q=75'
        }
      ],
      popularItems: [
        {
          name: 'NEO GURI',
          price: 130,
          image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80'
        },
        {
          name: 'Kimchi',
          price: 50,
          image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=400&q=80'
        },
        {
          name: 'Fish Cake',
          price: 55,
          image: 'https://recipe1.ezmember.co.kr/cache/recipe/2022/05/05/8b3426862e0d9d60035828927d3f0c7d1.jpg'
        },
        {
          name: 'Ice Talk',
          price: 55,
          image: 'https://exoticsnacks.com/cdn/shop/files/9_6243126e-1a22-4077-915e-0c23ed74b26b.png'
        },
        {
          name: 'Shin Ramyun',
          price: 150,
          image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80'
        }
      ]
    }
  },
  computed: {
    filteredDeals() {
      return this.deals.filter(deal => deal.category === this.activeCategory);
    }
  },
  methods: {
    goToContact() {
      this.$emit('setCurrentPage', 'Contact');
    },

    setActiveCategory(category) {
      this.activeCategory = category;
    },
    setDeliveryType(type) {
      this.deliveryType = type;
      // Reset inputs when switching types
      this.address = '';
      this.pickupTime = '';
    },
    orderNow() {
      // Delivery / Pickup validation
      if (this.deliveryType === 'Delivery' && !this.address) {
        alert('Please enter your address');
        return;
      }
      if (this.deliveryType === 'Pickup' && !this.pickupTime) {
        alert('Please select a pickup time');
        return;
      }

      // Check login state from App.vue (root component)
      const isLoggedIn = this.$root.isLoggedIn;

      if (isLoggedIn) {
        // ✅ Already logged in → go straight to Menu
        this.$emit('setCurrentPage', 'Menu');
      } else {
        // ❗ Not logged in → go to Login, but remember the intent
        this.$emit('setCurrentPage', 'Login', { from: 'OrderNow' });
      }
    }

  }
}
</script>

<style src="./HelloWorldEnhanced.css" scoped></style>
