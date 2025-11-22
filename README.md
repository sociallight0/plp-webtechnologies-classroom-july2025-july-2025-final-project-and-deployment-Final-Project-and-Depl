# 🧠 MindSpace - Mental Health & Therapy Platform

![MindSpace](https://img.shields.io/badge/Version-1.0.0-2D6A4F?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-52B788?style=flat-square)
![Browser](https://img.shields.io/badge/Browser-IndexedDB-B7E4C7?style=flat-square)

A comprehensive mental health platform that connects users with licensed therapists, enables appointment booking, and provides mood tracking capabilities. Built with vanilla JavaScript and IndexedDB for complete client-side data privacy.

## ✨ Features

### 🔐 Authentication System
- User registration with validation
- Secure login with session management
- "Remember me" functionality
- Profile management with emergency contacts
- Password change and account deletion
- Demo account for testing

### 👨‍⚕️ Therapist Management
- Browse 8 pre-loaded professional therapists
- 10 specialized therapy categories
- Connect with multiple therapists
- Filter by specialization
- View detailed therapist profiles
- Rating and availability display

### 📅 Appointment Booking
- Flexible scheduling with calendar interface
- Customizable session durations (30, 50, 60, 90 minutes)
- Real-time availability checking
- Conflict detection (no double-booking)
- Appointment management (view, cancel, reschedule)
- Three-tab organization (Upcoming, Past, Cancelled)
- Notes for each appointment

### 😊 Mood Tracker
- 10 predefined mood categories with emojis
- Intensity scale (1-10) with visual slider
- Daily mood logging
- Streak tracking
- Mood history timeline
- Advanced analytics and insights
- Trend analysis (improving/declining/stable)
- Smart recommendations
- Correlation with therapy sessions
- Export to CSV

### 📊 Dashboard & Analytics
- Live statistics overview
- Upcoming appointments display
- Recent mood entries
- Quick action buttons
- Personalized welcome messages

## 🎨 Design

### Color Theme (Green Palette)
- **Primary Green**: `#2D6A4F` - Forest Green
- **Secondary Green**: `#52B788` - Medium Green
- **Light Green**: `#B7E4C7` - Mint Green
- **Dark Green**: `#1B4332` - Dark Green
- **Accent**: `#95D5B2` - Soft Green

### Responsive Design
- Mobile-first approach
- Breakpoints: 768px (tablet), 1024px (desktop)
- Collapsible sidebar navigation
- Touch-friendly interfaces

## 📁 Project Structure

```
mindspace/
├── index.html                 # Landing page
├── css/
│   ├── styles.css            # Main stylesheet (global styles, components)
│   ├── auth.css              # Authentication pages styling
│   └── dashboard.css         # Dashboard and internal pages styling
├── js/
│   ├── db.js                 # IndexedDB setup and operations
│   ├── utils.js              # Helper functions (dates, validation, UI)
│   ├── auth.js               # Authentication logic
│   ├── therapist.js          # Therapist management
│   ├── appointments.js       # Appointment booking system
│   └── mood-tracker.js       # Mood tracking functionality
└── pages/
    ├── login.html            # Login page
    ├── register.html         # Registration page
    ├── dashboard.html        # User dashboard
    ├── therapists.html       # Browse/manage therapists
    ├── appointments.html     # Appointment booking
    ├── mood-tracker.html     # Mood tracking interface
    └── profile.html          # User profile management
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser with IndexedDB support (Chrome, Firefox, Safari, Edge)
- No server or backend required - runs completely client-side

### Installation

1. **Download/Clone the project**
   ```bash
   git clone https://github.com/yourusername/mindspace.git
   cd mindspace
   ```

2. **Open in browser**
   - Simply open `index.html` in your web browser
   - Or use a local development server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

3. **Access the application**
   - Navigate to `http://localhost:8000` (if using server)
   - Or open `index.html` directly in browser

### Demo Account
Use these credentials to explore the platform:
- **Email**: `demo@mindspace.com`
- **Password**: `demo123`

## 📖 Usage Guide

### 1. Registration & Login
- Click "Get Started" or "Sign Up" to create an account
- Fill in your details (name, email, username, phone)
- Set a strong password (min. 6 characters with a number)
- Add emergency contact information (optional)
- Or use the demo account to explore

### 2. Finding Therapists
- Navigate to "My Therapists" from the sidebar
- Click "Browse All" to see available therapists
- Filter by specialization using the dropdown
- View detailed profiles by clicking "View Profile"
- Click "Connect" to add a therapist to your network

### 3. Booking Appointments
- Go to "Appointments" page
- Click "+ Book New Appointment"
- Select your therapist
- Choose a date (therapist availability is checked)
- Select session duration (30, 50, 60, or 90 minutes)
- Pick an available time slot
- Add optional notes
- Confirm booking

### 4. Tracking Moods
- Navigate to "Mood Tracker"
- Click "+ Log Today's Mood"
- Select how you're feeling (10 options)
- Set intensity level (1-10 scale)
- Add notes about your day (optional)
- Save to track your emotional patterns

### 5. Managing Profile
- Click on "Profile" in the sidebar
- **Personal Information**: Update name, email, phone
- **Security**: Change password or delete account
- **Emergency Contact**: Manage emergency contact details

## 🗄️ Database Schema

### IndexedDB Object Stores

#### `users`
```javascript
{
  id: Number (auto-increment),
  username: String (indexed, unique),
  email: String (indexed, unique),
  password: String,
  fullName: String,
  phone: String,
  dateJoined: String (ISO),
  emergencyContact: {
    name: String,
    phone: String
  },
  profileImage: String (URL)
}
```

#### `therapists`
```javascript
{
  id: Number (auto-increment),
  name: String (indexed),
  specialization: String (indexed),
  email: String,
  phone: String,
  bio: String,
  availability: Array[String], // Days of week
  rating: Number,
  image: String (URL)
}
```

#### `userTherapists`
```javascript
{
  id: Number (auto-increment),
  userId: Number (indexed),
  therapistId: Number (indexed),
  connectedDate: String (ISO),
  status: String // 'active', 'inactive'
}
```

#### `appointments`
```javascript
{
  id: Number (auto-increment),
  userId: Number (indexed),
  therapistId: Number (indexed),
  date: String (indexed), // YYYY-MM-DD
  time: String, // HH:MM
  duration: Number, // minutes
  type: String,
  status: String (indexed), // 'confirmed', 'completed', 'cancelled'
  notes: String,
  createdAt: String (ISO)
}
```

#### `moods`
```javascript
{
  id: Number (auto-increment),
  userId: Number (indexed),
  mood: String, // Mood category
  intensity: Number, // 1-10
  notes: String,
  date: String (indexed), // YYYY-MM-DD
  timestamp: String (indexed, ISO)
}
```

#### `sessions`
```javascript
{
  userId: Number (primary key),
  token: String (indexed, unique),
  email: String,
  fullName: String,
  loginTime: String (ISO),
  rememberMe: Boolean
}
```

## 🛠️ Technical Details

### Technologies Used
- **HTML5**: Semantic markup
- **CSS3**: Custom properties, Grid, Flexbox
- **JavaScript (ES6+)**: Vanilla JS, no frameworks
- **IndexedDB**: Client-side database
- **localStorage**: Session persistence backup

### Key JavaScript Classes

#### `MindSpaceDB`
Database initialization and CRUD operations
```javascript
await mindspaceDB.init()
await mindspaceDB.add(storeName, data)
await mindspaceDB.get(storeName, key)
await mindspaceDB.update(storeName, data)
await mindspaceDB.delete(storeName, key)
```

#### `Auth`
Authentication management
```javascript
await Auth.register(userData)
await Auth.login(email, password)
await Auth.getCurrentUser()
await Auth.logout()
```

#### `TherapistManager`
Therapist operations
```javascript
await TherapistManager.getAllTherapists()
await TherapistManager.connectTherapist(userId, therapistId)
await TherapistManager.getMyTherapists(userId)
```

#### `AppointmentManager`
Appointment handling
```javascript
await AppointmentManager.bookAppointment(userId, appointmentData)
await AppointmentManager.getUpcomingAppointments(userId)
await AppointmentManager.cancelAppointment(appointmentId)
```

#### `MoodTracker`
Mood tracking and analytics
```javascript
await MoodTracker.logMood(userId, moodData)
await MoodTracker.getMoodHistory(userId)
await MoodTracker.getMoodInsights(userId)
```

### Utility Functions

#### `DateUtils`
- `formatDate()`, `formatTime()`, `formatDateTime()`
- `getDayOfWeek()`, `isToday()`
- `generateTimeSlots()` - Dynamic slot generation

#### `ValidationUtils`
- `isValidEmail()`, `isValidPassword()`, `isValidPhone()`
- `isNotEmpty()`

#### `UIUtils`
- `showNotification()`, `showError()`, `clearError()`
- `showLoading()`, `hideLoading()`

#### `MoodUtils`
- 10 predefined mood categories with emojis and colors
- `calculateAverage()`, `getMoodTrend()`

## 🎯 Features in Detail

### Therapist Specializations
1. Anxiety & Stress Management
2. Depression & Mood Disorders
3. Trauma & PTSD
4. Relationship & Family Therapy
5. Addiction & Recovery
6. Grief & Loss Counseling
7. Career & Life Coaching
8. Sleep Disorders
9. Eating Disorders
10. Child & Adolescent Therapy

### Mood Categories
1. 😊 Happy (Green)
2. 😢 Sad (Gray)
3. 😰 Anxious (Yellow)
4. 😠 Angry (Red)
5. 😌 Calm (Light Green)
6. 😫 Stressed (Red-Orange)
7. ⚡ Energetic (Yellow)
8. 😴 Tired (Gray)
9. 🌟 Hopeful (Green)
10. 🌪️ Overwhelmed (Orange)

### Appointment Durations
- 30 minutes (Quick consultation)
- 50 minutes (Standard therapy session)
- 60 minutes (Extended session)
- 90 minutes (Intensive therapy)

## 🔒 Privacy & Security

### Data Storage
- **100% client-side**: All data stored in browser's IndexedDB
- **No server communication**: Complete privacy
- **Local only**: Data never leaves the user's device
- **User control**: Easy account deletion with full data cleanup

### Security Considerations
- Passwords stored in plain text (demo purposes only)
- **Production recommendation**: Implement proper password hashing (bcrypt, argon2)
- Session tokens for authentication
- 30-day session expiry with "remember me"

## 🚧 Future Enhancements

### Planned Features
- [ ] Video call integration for remote sessions
- [ ] Encrypted messaging between users and therapists
- [ ] Journal entries with rich text editing
- [ ] Goal setting and progress tracking
- [ ] Crisis resources and hotlines
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Push notifications for appointments
- [ ] Therapist ratings and reviews
- [ ] Insurance integration
- [ ] Payment processing
- [ ] Mobile app (React Native/Flutter)

### Technical Improvements
- [ ] Implement proper password hashing
- [ ] Add input sanitization
- [ ] Progressive Web App (PWA) capabilities
- [ ] Offline functionality
- [ ] Data sync across devices (optional cloud)
- [ ] Automated testing (Jest, Cypress)
- [ ] Performance optimization
- [ ] Accessibility improvements (WCAG 2.1 AA)

## 🐛 Known Issues

1. **Password Security**: Passwords stored in plain text (demo only)
2. **No Data Sync**: Data tied to single browser/device
3. **Browser Compatibility**: Requires IndexedDB support
4. **No Real Therapists**: Demo data only
5. **Reschedule Feature**: Placeholder implementation

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Use ES6+ JavaScript features
- Follow existing code style
- Add comments for complex logic
- Test in multiple browsers
- Ensure responsive design

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work*

## 🙏 Acknowledgments

- Placeholder images from [Pravatar](https://pravatar.cc/)
- Icons from Unicode emoji set
- Inspired by modern mental health platforms
- Built with accessibility and privacy in mind

## 📞 Support

For support, please:
- Open an issue on GitHub
- Email: support@mindspace.example.com
- **Crisis Support**: National Suicide Prevention Lifeline: 988

## 📊 Project Stats

- **Total Files**: 13 (7 HTML, 3 CSS, 3 JS)
- **Lines of Code**: ~8,000+
- **Browser Support**: Chrome, Firefox, Safari, Edge (Latest)
- **Mobile Friendly**: Yes
- **Accessibility**: WCAG 2.1 considerations

---

**⚠️ Disclaimer**: This is a demo application for educational purposes. Not a replacement for professional mental health care. Always consult qualified healthcare providers for medical advice.

**🔒 Privacy Notice**: All data is stored locally in your browser. No information is transmitted to any server. Clear browser data to remove all stored information.

---

Made with 💚 for mental health awareness
