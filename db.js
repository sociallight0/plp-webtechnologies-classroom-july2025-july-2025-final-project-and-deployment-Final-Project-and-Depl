// db.js - IndexedDB Database Setup and Operations for MindSpace

const DB_NAME = 'MindSpaceDB';
const DB_VERSION = 1;

class MindSpaceDB {
  constructor() {
    this.db = null;
    this.ready = false;
    this.readyPromise = null;
  }

  // Initialize database
  async init() {
    // If already initializing, return the existing promise
    if (this.readyPromise) {
      return this.readyPromise;
    }

    // If already ready, return resolved promise
    if (this.ready && this.db) {
      return Promise.resolve(this.db);
    }

    // Create new initialization promise
    this.readyPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.ready = false;
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.ready = true;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
          userStore.createIndex('email', 'email', { unique: true });
          userStore.createIndex('username', 'username', { unique: true });
        }

        // Therapists store
        if (!db.objectStoreNames.contains('therapists')) {
          const therapistStore = db.createObjectStore('therapists', { keyPath: 'id', autoIncrement: true });
          therapistStore.createIndex('specialization', 'specialization', { unique: false });
          therapistStore.createIndex('name', 'name', { unique: false });
        }

        // User-Therapist relationships store
        if (!db.objectStoreNames.contains('userTherapists')) {
          const utStore = db.createObjectStore('userTherapists', { keyPath: 'id', autoIncrement: true });
          utStore.createIndex('userId', 'userId', { unique: false });
          utStore.createIndex('therapistId', 'therapistId', { unique: false });
          utStore.createIndex('userTherapist', ['userId', 'therapistId'], { unique: true });
        }

        // Appointments store
        if (!db.objectStoreNames.contains('appointments')) {
          const appointmentStore = db.createObjectStore('appointments', { keyPath: 'id', autoIncrement: true });
          appointmentStore.createIndex('userId', 'userId', { unique: false });
          appointmentStore.createIndex('therapistId', 'therapistId', { unique: false });
          appointmentStore.createIndex('date', 'date', { unique: false });
          appointmentStore.createIndex('status', 'status', { unique: false });
        }

        // Moods store
        if (!db.objectStoreNames.contains('moods')) {
          const moodStore = db.createObjectStore('moods', { keyPath: 'id', autoIncrement: true });
          moodStore.createIndex('userId', 'userId', { unique: false });
          moodStore.createIndex('date', 'date', { unique: false });
          moodStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Sessions store (for authentication)
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'userId' });
          sessionStore.createIndex('token', 'token', { unique: true });
        }
      };
    });

    return this.readyPromise;
  }

  // Ensure database is ready before operations
  async ensureReady() {
    if (!this.ready || !this.db) {
      await this.init();
    }
  }

  // Generic CRUD operations
  async add(storeName, data) {
    await this.ensureReady();
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    await this.ensureReady();
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    await this.ensureReady();
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex(storeName, indexName, value) {
    await this.ensureReady();
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, data) {
    await this.ensureReady();
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    await this.ensureReady();
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Seed demo data
  async seedDemoData() {
    await this.ensureReady();
    
    try {
      // Check if data already exists
      const existingTherapists = await this.getAll('therapists');
      if (existingTherapists.length > 0) return;

      // Sample therapists
      const therapists = [
        {
          name: 'Dr. Sarah Mitchell',
          specialization: 'Anxiety & Stress Management',
          email: 'sarah.mitchell@mindspace.com',
          phone: '+1 (555) 123-4567',
          bio: 'Over 10 years of experience helping clients manage anxiety and stress through evidence-based techniques.',
          availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
          rating: 4.8,
          image: 'https://i.pravatar.cc/150?img=1'
        },
        {
          name: 'Dr. James Rodriguez',
          specialization: 'Depression & Mood Disorders',
          email: 'james.rodriguez@mindspace.com',
          phone: '+1 (555) 234-5678',
          bio: 'Specialized in treating depression and mood disorders with a compassionate, holistic approach.',
          availability: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          rating: 4.9,
          image: 'https://i.pravatar.cc/150?img=12'
        },
        {
          name: 'Dr. Emily Chen',
          specialization: 'Trauma & PTSD',
          email: 'emily.chen@mindspace.com',
          phone: '+1 (555) 345-6789',
          bio: 'Expert in trauma-focused therapy and PTSD treatment with advanced certifications in EMDR.',
          availability: ['Monday', 'Wednesday', 'Friday'],
          rating: 4.7,
          image: 'https://i.pravatar.cc/150?img=5'
        },
        {
          name: 'Dr. Michael Thompson',
          specialization: 'Relationship & Family Therapy',
          email: 'michael.thompson@mindspace.com',
          phone: '+1 (555) 456-7890',
          bio: 'Helping couples and families build stronger connections through effective communication.',
          availability: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
          rating: 4.6,
          image: 'https://i.pravatar.cc/150?img=13'
        },
        {
          name: 'Dr. Lisa Patel',
          specialization: 'Addiction & Recovery',
          email: 'lisa.patel@mindspace.com',
          phone: '+1 (555) 567-8901',
          bio: '15 years supporting individuals on their journey to recovery and lasting sobriety.',
          availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          rating: 4.9,
          image: 'https://i.pravatar.cc/150?img=9'
        },
        {
          name: 'Dr. Robert Kim',
          specialization: 'Grief & Loss Counseling',
          email: 'robert.kim@mindspace.com',
          phone: '+1 (555) 678-9012',
          bio: 'Compassionate support for those navigating grief, loss, and life transitions.',
          availability: ['Wednesday', 'Thursday', 'Friday'],
          rating: 4.8,
          image: 'https://i.pravatar.cc/150?img=14'
        },
        {
          name: 'Dr. Amanda Foster',
          specialization: 'Child & Adolescent Therapy',
          email: 'amanda.foster@mindspace.com',
          phone: '+1 (555) 789-0123',
          bio: 'Specialized in working with children and teens using play therapy and CBT techniques.',
          availability: ['Monday', 'Tuesday', 'Thursday'],
          rating: 4.7,
          image: 'https://i.pravatar.cc/150?img=10'
        },
        {
          name: 'Dr. David Williams',
          specialization: 'Career & Life Coaching',
          email: 'david.williams@mindspace.com',
          phone: '+1 (555) 890-1234',
          bio: 'Empowering clients to achieve their goals and find fulfillment in their personal and professional lives.',
          availability: ['Tuesday', 'Wednesday', 'Friday'],
          rating: 4.5,
          image: 'https://i.pravatar.cc/150?img=15'
        }
      ];

      for (const therapist of therapists) {
        await this.add('therapists', therapist);
      }

      // Sample user for testing
      const demoUser = {
        username: 'demo_user',
        email: 'demo@mindspace.com',
        password: 'demo123', // In production, this should be hashed
        fullName: 'Demo User',
        phone: '+1 (555) 000-0000',
        dateJoined: new Date().toISOString(),
        profileImage: 'https://ui-avatars.com/api/?name=Demo+User&background=2D6A4F&color=fff&size=200',
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '+1 (555) 111-1111'
        }
      };

      await this.add('users', demoUser);

      console.log('Demo data seeded successfully!');
    } catch (error) {
      console.error('Error seeding demo data:', error);
    }
  }
}

// Create global instance
const mindspaceDB = new MindSpaceDB();

// Initialize on load and expose as a global promise
if (typeof window !== 'undefined') {
  window.dbReadyPromise = mindspaceDB.init()
    .then(() => mindspaceDB.seedDemoData())
    .then(() => {
      console.log('MindSpace Database initialized successfully');
      return mindspaceDB;
    })
    .catch(error => {
      console.error('Database initialization error:', error);
      throw error;
    });
}
