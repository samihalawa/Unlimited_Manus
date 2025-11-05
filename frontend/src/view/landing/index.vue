<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          Meet <span class="gradient-text">Unlimited Manus</span>
        </h1>
        <p class="hero-subtitle">
          Your intelligent AI assistant for seamless task management, coding assistance, and more
        </p>
        <div class="hero-cta">
          <router-link to="/auth" class="btn btn-primary">Get Started Free</router-link>
          <button class="btn btn-secondary" @click="scrollToFeatures">Learn More</button>
        </div>
      </div>
      <div class="hero-image">
        <div class="floating-card">
          <div class="card-icon">✨</div>
          <p>AI-Powered</p>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features" ref="featuresSection">
      <h2>Powerful Features</h2>
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.id" class="feature-card">
          <div class="feature-icon">{{ feature.icon }}</div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats">
      <div class="stat-item">
        <div class="stat-number">10k+</div>
        <p>Active Users</p>
      </div>
      <div class="stat-item">
        <div class="stat-number">99.9%</div>
        <p>Uptime</p>
      </div>
      <div class="stat-item">
        <div class="stat-number">24/7</div>
        <p>Support</p>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="final-cta">
      <h2>Ready to Transform Your Workflow?</h2>
      <p>Start using Unlimited Manus today and experience the power of AI</p>
      <router-link to="/auth" class="btn btn-primary btn-large">Start Free Trial</router-link>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>Product</h4>
          <ul>
            <li><router-link to="/">Home</router-link></li>
            <li><a href="#features">Features</a></li>
            <li><router-link to="/pricing">Pricing</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 Unlimited Manus. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const featuresSection = ref(null);

const features = [
  {
    id: 1,
    icon: '🤖',
    title: 'Smart AI Assistant',
    description: 'Harness the power of advanced AI to automate and enhance your work'
  },
  {
    id: 2,
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'Real-time response with sub-100ms latency for optimal performance'
  },
  {
    id: 3,
    icon: '🔒',
    title: 'Secure & Private',
    description: 'Enterprise-grade encryption and privacy controls for your data'
  },
  {
    id: 4,
    icon: '🎯',
    title: 'Task Management',
    description: 'Organize and track your projects with intelligent task breakdown'
  },
  {
    id: 5,
    icon: '💻',
    title: 'Code Assistance',
    description: 'Get AI-powered help with coding, debugging, and refactoring'
  },
  {
    id: 6,
    icon: '🔄',
    title: 'Multi-Agent Support',
    description: 'Leverage multiple specialized agents for complex workflows'
  }
];

const scrollToFeatures = () => {
  featuresSection.value?.scrollIntoView({ behavior: 'smooth' });
};
</script>

<style scoped lang="scss">
.landing-page {
  width: 100%;
  background: linear-gradient(135deg, #f8f8f7 0%, #f0f0ed 100%);
  overflow-x: hidden;
}

/* Hero Section */
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 40px;
  gap: 60px;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 60px 20px;
    text-align: center;
  }
}

.hero-content {
  flex: 1;
}

.hero-title {
  font-size: 4rem;
  font-weight: 700;
  color: #2c2c2c;
  margin-bottom: 20px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
}

.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 40px;
  line-height: 1.6;
}

.hero-cta {
  display: flex;
  gap: 20px;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
  }
}

.btn {
  padding: 14px 32px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;

  &.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
  }

  &.btn-secondary {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;

    &:hover {
      background: #667eea;
      color: white;
    }
  }

  &.btn-large {
    padding: 18px 48px;
    font-size: 1.1rem;
  }
}

.hero-image {
  flex: 1;
  position: relative;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    width: 100%;
    height: 300px;
  }
}

.floating-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  text-align: center;
  animation: float 3s ease-in-out infinite;

  .card-icon {
    font-size: 4rem;
    margin-bottom: 20px;
  }

  p {
    font-size: 1.2rem;
    color: #2c2c2c;
    font-weight: 600;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* Features Section */
.features {
  max-width: 1200px;
  margin: 100px auto;
  padding: 0 40px;

  h2 {
    font-size: 3rem;
    text-align: center;
    margin-bottom: 60px;
    color: #2c2c2c;
  }

  @media (max-width: 768px) {
    padding: 0 20px;
    margin: 60px auto;

    h2 {
      font-size: 2rem;
    }
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}

.feature-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  }

  .feature-icon {
    font-size: 3rem;
    margin-bottom: 20px;
  }

  h3 {
    font-size: 1.3rem;
    color: #2c2c2c;
    margin-bottom: 15px;
  }

  p {
    color: #666;
    line-height: 1.6;
  }
}

/* Stats Section */
.stats {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  max-width: 1200px;
  margin: 100px auto;
  padding: 60px 40px;
  border-radius: 16px;
  text-align: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 40px 20px;
  }
}

.stat-item {
  .stat-number {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 10px;
  }

  p {
    font-size: 1.1rem;
    opacity: 0.9;
  }
}

/* Final CTA Section */
.final-cta {
  text-align: center;
  max-width: 800px;
  margin: 100px auto;
  padding: 0 40px;

  h2 {
    font-size: 2.5rem;
    color: #2c2c2c;
    margin-bottom: 20px;
  }

  p {
    font-size: 1.1rem;
    color: #666;
    margin-bottom: 40px;
    line-height: 1.6;
  }

  @media (max-width: 768px) {
    padding: 0 20px;
    margin: 60px auto;

    h2 {
      font-size: 1.8rem;
    }
  }
}

/* Footer */
.footer {
  background: #2c2c2c;
  color: white;
  padding: 60px 40px 20px;
  margin-top: 100px;

  @media (max-width: 768px) {
    padding: 40px 20px 20px;
  }
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}

.footer-section {
  h4 {
    margin-bottom: 15px;
    font-size: 1.1rem;
  }

  ul {
    list-style: none;
    padding: 0;

    li {
      margin-bottom: 10px;

      a {
        color: #ccc;
        text-decoration: none;
        transition: color 0.3s;

        &:hover {
          color: #667eea;
        }
      }
    }
  }
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #444;
  color: #999;
}
</style>
