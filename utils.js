
// utils.js - Helper Functions for MindSpace

// Date and Time Utilities
const DateUtils = {
  // Format date to readable string
  formatDate(date) {
    const d = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  },

  // Format date to short string (MM/DD/YYYY)
  formatDateShort(date) {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  },

  // Format time (HH:MM AM/PM)
  formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  },

  // Format date and time together
  formatDateTime(date) {
    return `${this.formatDate(date)} at ${this.formatTime(date)}`;
  },

  // Get day of week
  getDayOfWeek(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(date).getDay()];
  },

  // Check if date is today
  isToday(date) {
    const today = new Date();
    const d = new Date(date);
    return today.toDateString() === d.toDateString();
  },

  // Get date range for week
  getWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const start = new Date(d.setDate(diff));
    const end = new Date(d.setDate(diff + 6));
    return { start, end };
  },

  // Generate time slots
  generateTimeSlots(startHour = 9, endHour = 17, duration = 50) {
    const slots = [];
    let currentTime = startHour * 60; // Convert to minutes
    const endTime = endHour * 60;

    while (currentTime + duration <= endTime) {
      const hours = Math.floor(currentTime / 60);
      const minutes = currentTime % 60;
      const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      slots.push(time);
      currentTime += duration;
    }

    return slots;
  }
};

// Validation Utilities
const ValidationUtils = {
  // Validate email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password (min 6 characters, at least 1 number)
  isValidPassword(password) {
    return password.length >= 6 && /\d/.test(password);
  },

  // Validate phone number
  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  // Validate required field
  isNotEmpty(value) {
    return value !== null && value !== undefined && value.trim() !== '';
  }
};

// UI Utilities
const UIUtils = {
  // Show loading spinner
  showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = '<div class="loading-spinner"></div>';
      element.classList.add('loading');
    }
  },

  // Hide loading spinner
  hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove('loading');
    }
  },

  // Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  // Show error message
  showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = message;
      element.classList.add('error-message', 'show');
    }
  },

  // Clear error message
  clearError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = '';
      element.classList.remove('show');
    }
  },

  // Toggle element visibility
  toggleVisibility(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.toggle('hidden');
    }
  },

  // Confirm dialog
  confirm(message) {
    return window.confirm(message);
  }
};

// Authentication Utilities
const AuthUtils = {
  // Generate session token
  generateToken() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
  },

  // Hash password (simple hash - in production use bcrypt or similar)
  hashPassword(password) {
    // This is a simple hash for demo purposes
    // In production, use a proper hashing library
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  },

  // Get current session
  async getCurrentSession() {
    try {
      const sessions = await mindspaceDB.getAll('sessions');
      return sessions.length > 0 ? sessions[0] : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  // Check if user is logged in
  async isLoggedIn() {
    const session = await this.getCurrentSession();
    return session !== null;
  },

  // Logout
  async logout() {
    try {
      const sessions = await mindspaceDB.getAll('sessions');
      for (const session of sessions) {
        await mindspaceDB.delete('sessions', session.userId);
      }
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};

// Mood Tracker Utilities
const MoodUtils = {
  // Predefined mood categories
  moodCategories: [
    { name: 'Happy', emoji: '😊', color: '#52B788' },
    { name: 'Sad', emoji: '😢', color: '#6C757D' },
    { name: 'Anxious', emoji: '😰', color: '#FFC107' },
    { name: 'Angry', emoji: '😠', color: '#DC3545' },
    { name: 'Calm', emoji: '😌', color: '#B7E4C7' },
    { name: 'Stressed', emoji: '😫', color: '#FF6B6B' },
    { name: 'Energetic', emoji: '⚡', color: '#FFD93D' },
    { name: 'Tired', emoji: '😴', color: '#95A5A6' },
    { name: 'Hopeful', emoji: '🌟', color: '#52B788' },
    { name: 'Overwhelmed', emoji: '🌪️', color: '#E67E22' }
  ],

  // Get mood by name
  getMoodByName(name) {
    return this.moodCategories.find(m => m.name === name);
  },

  // Calculate mood average
  calculateAverage(moods) {
    if (moods.length === 0) return 0;
    const sum = moods.reduce((acc, mood) => acc + mood.intensity, 0);
    return (sum / moods.length).toFixed(1);
  },

  // Get mood trend (improving, declining, stable)
  getMoodTrend(moods) {
    if (moods.length < 2) return 'stable';
    const recent = moods.slice(-7); // Last 7 entries
    const older = moods.slice(-14, -7); // Previous 7 entries
    
    if (older.length === 0) return 'stable';

    const recentAvg = this.calculateAverage(recent);
    const olderAvg = this.calculateAverage(older);
    const diff = recentAvg - olderAvg;

    if (diff > 0.5) return 'improving';
    if (diff < -0.5) return 'declining';
    return 'stable';
  }
};

// Storage Utilities
const StorageUtils = {
  // Save to localStorage (backup)
  saveLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorage save error:', error);
    }
  },

  // Get from localStorage
  getLocal(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  },

  // Remove from localStorage
  removeLocal(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage remove error:', error);
    }
  }
};

// Export utilities (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DateUtils,
    ValidationUtils,
    UIUtils,
    AuthUtils,
    MoodUtils,
    StorageUtils
  };
}
