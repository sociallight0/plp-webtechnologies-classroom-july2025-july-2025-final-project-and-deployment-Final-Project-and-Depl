// auth.js - Authentication Logic for MindSpace

class Auth {
  // Register new user
  static async register(userData) {
    try {
      // Check if email already exists
      const existingUsers = await mindspaceDB.getByIndex('users', 'email', userData.email);
      if (existingUsers.length > 0) {
        return {
          success: false,
          message: 'Email already registered'
        };
      }

      // Check if username already exists
      const existingUsername = await mindspaceDB.getByIndex('users', 'username', userData.username);
      if (existingUsername.length > 0) {
        return {
          success: false,
          message: 'Username already taken'
        };
      }

      // Create user object
      const newUser = {
        username: userData.username,
        email: userData.email,
        password: userData.password, // In production, hash this
        fullName: userData.fullName,
        phone: userData.phone,
        emergencyContact: userData.emergencyContact,
        dateJoined: new Date().toISOString(),
        profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName)}&background=2D6A4F&color=fff&size=200`,
        preferences: {
          notifications: true,
          emailUpdates: true,
          theme: 'light'
        }
      };

      // Add user to database
      const userId = await mindspaceDB.add('users', newUser);

      return {
        success: true,
        userId: userId,
        message: 'Account created successfully'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }
// In auth.js, update the login method:

static async login(email, password, rememberMe = false) {
  try {
    // Find user by email
    const users = await mindspaceDB.getByIndex('users', 'email', email);
    
    if (users.length === 0) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    const user = users[0];

    // Verify password
    if (user.password !== password) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Create session
    const sessionToken = AuthUtils.generateToken();
    const session = {
      userId: user.id,
      token: sessionToken,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      profileImage: user.profileImage,
      loginTime: new Date().toISOString(),
      rememberMe: rememberMe
    };

    // Clear any existing sessions first
    const existingSessions = await mindspaceDB.getAll('sessions');
    for (const oldSession of existingSessions) {
      await mindspaceDB.delete('sessions', oldSession.userId);
    }

    // Save new session - WAIT for it to complete
    await mindspaceDB.add('sessions', session);
    
    // IMPORTANT: Verify session was saved
    const savedSession = await mindspaceDB.get('sessions', user.id);
    if (!savedSession) {
      console.error('Session save failed!');
      return {
        success: false,
        message: 'Session creation failed'
      };
    }

    // Store in localStorage if remember me
    if (rememberMe) {
      StorageUtils.saveLocal('mindspace_session', sessionToken);
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      },
      message: 'Login successful'
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Login failed. Please try again.'
    };
  }
}

  // Get current user from session
  static async getCurrentUser() {
    try {
      const session = await AuthUtils.getCurrentSession();
      if (!session) return null;

      const user = await mindspaceDB.get('users', session.userId);
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Update user profile
  static async updateProfile(userId, updates) {
    try {
      const user = await mindspaceDB.get('users', userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Merge updates with existing user data
      const updatedUser = {
        ...user,
        ...updates,
        id: userId // Ensure ID doesn't change
      };

      await mindspaceDB.update('users', updatedUser);

      // Update session if name or email changed
      if (updates.fullName || updates.email) {
        const session = await AuthUtils.getCurrentSession();
        if (session) {
          session.fullName = updatedUser.fullName;
          session.email = updatedUser.email;
          await mindspaceDB.update('sessions', session);
        }
      }

      return {
        success: true,
        user: updatedUser,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile'
      };
    }
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await mindspaceDB.get('users', userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify current password
      if (user.password !== currentPassword) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Validate new password
      if (!ValidationUtils.isValidPassword(newPassword)) {
        return {
          success: false,
          message: 'New password must be at least 6 characters and contain a number'
        };
      }

      // Update password
      user.password = newPassword; // In production, hash this
      await mindspaceDB.update('users', user);

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Failed to change password'
      };
    }
  }

  // Logout
  static async logout() {
    try {
      await AuthUtils.logout();
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }

  // Check authentication and redirect if needed
  static async requireAuth() {
    const isLoggedIn = await AuthUtils.isLoggedIn();
    if (!isLoggedIn) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  // Auto-login on page load (if remember me was checked)
  static async autoLogin() {
    try {
      const savedToken = StorageUtils.getLocal('mindspace_session');
      if (!savedToken) return false;

      const sessions = await mindspaceDB.getAll('sessions');
      const session = sessions.find(s => s.token === savedToken);

      if (!session) {
        StorageUtils.removeLocal('mindspace_session');
        return false;
      }

      // Check if session is still valid (e.g., within 30 days)
      const loginTime = new Date(session.loginTime);
      const now = new Date();
      const daysSinceLogin = (now - loginTime) / (1000 * 60 * 60 * 24);

      if (daysSinceLogin > 30) {
        // Session expired
        await mindspaceDB.delete('sessions', session.userId);
        StorageUtils.removeLocal('mindspace_session');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Auto-login error:', error);
      return false;
    }
  }

  // Delete account
  static async deleteAccount(userId, password) {
    try {
      const user = await mindspaceDB.get('users', userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify password
      if (user.password !== password) {
        return {
          success: false,
          message: 'Password is incorrect'
        };
      }

      // Delete user data
      await mindspaceDB.delete('users', userId);
      
      // Delete sessions
      const sessions = await mindspaceDB.getByIndex('sessions', 'userId', userId);
      for (const session of sessions) {
        await mindspaceDB.delete('sessions', session.userId);
      }

      // Delete user-therapist relationships
      const userTherapists = await mindspaceDB.getByIndex('userTherapists', 'userId', userId);
      for (const ut of userTherapists) {
        await mindspaceDB.delete('userTherapists', ut.id);
      }

      // Delete appointments
      const appointments = await mindspaceDB.getByIndex('appointments', 'userId', userId);
      for (const appointment of appointments) {
        await mindspaceDB.delete('appointments', appointment.id);
      }

      // Delete moods
      const moods = await mindspaceDB.getByIndex('moods', 'userId', userId);
      for (const mood of moods) {
        await mindspaceDB.delete('moods', mood.id);
      }

      // Clear localStorage
      StorageUtils.removeLocal('mindspace_session');

      return {
        success: true,
        message: 'Account deleted successfully'
      };
    } catch (error) {
      console.error('Delete account error:', error);
      return {
        success: false,
        message: 'Failed to delete account'
      };
    }
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.Auth = Auth;
}
