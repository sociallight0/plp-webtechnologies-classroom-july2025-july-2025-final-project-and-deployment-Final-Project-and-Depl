// therapist.js - Therapist Management Logic for MindSpace

class TherapistManager {
  // Get all therapists
  static async getAllTherapists() {
    try {
      const therapists = await mindspaceDB.getAll('therapists');
      return therapists.sort((a, b) => b.rating - a.rating); // Sort by rating
    } catch (error) {
      console.error('Error getting therapists:', error);
      return [];
    }
  }

  // Get therapist by ID
  static async getTherapistById(therapistId) {
    try {
      const therapist = await mindspaceDB.get('therapists', therapistId);
      return therapist;
    } catch (error) {
      console.error('Error getting therapist:', error);
      return null;
    }
  }

  // Get therapists by specialization
  static async getTherapistsBySpecialization(specialization) {
    try {
      const therapists = await mindspaceDB.getByIndex('therapists', 'specialization', specialization);
      return therapists.sort((a, b) => b.rating - a.rating);
    } catch (error) {
      console.error('Error getting therapists by specialization:', error);
      return [];
    }
  }

  // Connect user with therapist
  static async connectTherapist(userId, therapistId) {
    try {
      // Check if connection already exists
      const existingConnections = await mindspaceDB.getByIndex('userTherapists', 'userId', userId);
      const alreadyConnected = existingConnections.some(conn => conn.therapistId === therapistId);

      if (alreadyConnected) {
        return {
          success: false,
          message: 'You are already connected with this therapist'
        };
      }

      // Create connection
      const connection = {
        userId: userId,
        therapistId: therapistId,
        connectedDate: new Date().toISOString(),
        status: 'active'
      };

      await mindspaceDB.add('userTherapists', connection);

      return {
        success: true,
        message: 'Successfully connected with therapist'
      };
    } catch (error) {
      console.error('Error connecting therapist:', error);
      return {
        success: false,
        message: 'Failed to connect with therapist'
      };
    }
  }

  // Disconnect from therapist
  static async disconnectTherapist(userId, therapistId) {
    try {
      const connections = await mindspaceDB.getByIndex('userTherapists', 'userId', userId);
      const connection = connections.find(conn => conn.therapistId === therapistId);

      if (!connection) {
        return {
          success: false,
          message: 'Connection not found'
        };
      }

      await mindspaceDB.delete('userTherapists', connection.id);

      return {
        success: true,
        message: 'Successfully disconnected from therapist'
      };
    } catch (error) {
      console.error('Error disconnecting therapist:', error);
      return {
        success: false,
        message: 'Failed to disconnect from therapist'
      };
    }
  }

  // Get user's connected therapists
  static async getMyTherapists(userId) {
    try {
      const connections = await mindspaceDB.getByIndex('userTherapists', 'userId', userId);
      const therapists = [];

      for (const connection of connections) {
        if (connection.status === 'active') {
          const therapist = await mindspaceDB.get('therapists', connection.therapistId);
          if (therapist) {
            therapists.push({
              ...therapist,
              connectedDate: connection.connectedDate
            });
          }
        }
      }

      // Sort by connection date (most recent first)
      return therapists.sort((a, b) => 
        new Date(b.connectedDate) - new Date(a.connectedDate)
      );
    } catch (error) {
      console.error('Error getting my therapists:', error);
      return [];
    }
  }

  // Check if user is connected to therapist
  static async isConnected(userId, therapistId) {
    try {
      const connections = await mindspaceDB.getByIndex('userTherapists', 'userId', userId);
      return connections.some(conn => 
        conn.therapistId === therapistId && conn.status === 'active'
      );
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }

  // Get therapist availability for booking
  static async getTherapistAvailability(therapistId, date) {
    try {
      const therapist = await mindspaceDB.get('therapists', therapistId);
      if (!therapist) return [];

      const dayOfWeek = DateUtils.getDayOfWeek(date);
      
      // Check if therapist is available on this day
      if (!therapist.availability.includes(dayOfWeek)) {
        return [];
      }

      // Get existing appointments for this therapist on this date
      const allAppointments = await mindspaceDB.getByIndex('appointments', 'therapistId', therapistId);
      const dateAppointments = allAppointments.filter(apt => 
        apt.date === date && apt.status !== 'cancelled'
      );

      // Generate all possible time slots (9 AM to 5 PM)
      const allSlots = DateUtils.generateTimeSlots(9, 17, 50);

      // Filter out booked slots
      const bookedTimes = dateAppointments.map(apt => apt.time);
      const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

      return availableSlots;
    } catch (error) {
      console.error('Error getting therapist availability:', error);
      return [];
    }
  }

  // Get therapist statistics
  static async getTherapistStats(therapistId) {
    try {
      // Get all appointments for this therapist
      const appointments = await mindspaceDB.getByIndex('appointments', 'therapistId', therapistId);
      
      // Get number of connected users
      const connections = await mindspaceDB.getByIndex('userTherapists', 'therapistId', therapistId);
      const activeConnections = connections.filter(conn => conn.status === 'active');

      // Calculate completed appointments
      const completedAppointments = appointments.filter(apt => 
        apt.status === 'completed'
      ).length;

      // Calculate upcoming appointments
      const upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date + ' ' + apt.time);
        return aptDate > new Date() && apt.status !== 'cancelled';
      }).length;

      return {
        totalPatients: activeConnections.length,
        completedSessions: completedAppointments,
        upcomingSessions: upcomingAppointments,
        totalAppointments: appointments.length
      };
    } catch (error) {
      console.error('Error getting therapist stats:', error);
      return {
        totalPatients: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        totalAppointments: 0
      };
    }
  }

  // Search therapists
  static async searchTherapists(query) {
    try {
      const allTherapists = await this.getAllTherapists();
      const lowerQuery = query.toLowerCase();

      return allTherapists.filter(therapist => 
        therapist.name.toLowerCase().includes(lowerQuery) ||
        therapist.specialization.toLowerCase().includes(lowerQuery) ||
        therapist.bio.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching therapists:', error);
      return [];
    }
  }

  // Get recommended therapists based on user's mood patterns
  static async getRecommendedTherapists(userId) {
    try {
      // Get user's recent moods
      const moods = await mindspaceDB.getByIndex('moods', 'userId', userId);
      
      if (moods.length === 0) {
        // If no moods, return top-rated therapists
        const therapists = await this.getAllTherapists();
        return therapists.slice(0, 3);
      }

      // Analyze most common mood categories
      const moodCounts = {};
      moods.forEach(mood => {
        moodCounts[mood.mood] = (moodCounts[mood.mood] || 0) + 1;
      });

      // Map moods to specializations
      const moodToSpecialization = {
        'Anxious': 'Anxiety & Stress Management',
        'Stressed': 'Anxiety & Stress Management',
        'Sad': 'Depression & Mood Disorders',
        'Angry': 'Anger Management',
        'Overwhelmed': 'Anxiety & Stress Management',
        'Hopeful': 'Career & Life Coaching'
      };

      // Find most relevant specialization
      const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b
      );

      const recommendedSpecialization = moodToSpecialization[mostCommonMood] || 
        'Anxiety & Stress Management';

      // Get therapists with this specialization
      let recommended = await this.getTherapistsBySpecialization(recommendedSpecialization);

      // If none found, return top-rated therapists
      if (recommended.length === 0) {
        recommended = await this.getAllTherapists();
      }

      return recommended.slice(0, 3);
    } catch (error) {
      console.error('Error getting recommended therapists:', error);
      return [];
    }
  }

  // Get all specializations
  static getSpecializations() {
    return [
      'Anxiety & Stress Management',
      'Depression & Mood Disorders',
      'Trauma & PTSD',
      'Relationship & Family Therapy',
      'Addiction & Recovery',
      'Grief & Loss Counseling',
      'Career & Life Coaching',
      'Sleep Disorders',
      'Eating Disorders',
      'Child & Adolescent Therapy'
    ];
  }

  // Get user's appointment history with therapist
  static async getAppointmentHistory(userId, therapistId) {
    try {
      const allAppointments = await mindspaceDB.getByIndex('appointments', 'userId', userId);
      
      return allAppointments
        .filter(apt => apt.therapistId === therapistId)
        .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
    } catch (error) {
      console.error('Error getting appointment history:', error);
      return [];
    }
  }

  // Update therapist rating (for future implementation)
  static async updateRating(therapistId, newRating) {
    try {
      const therapist = await mindspaceDB.get('therapists', therapistId);
      if (!therapist) {
        return {
          success: false,
          message: 'Therapist not found'
        };
      }

      // In a real app, you'd calculate average from all ratings
      therapist.rating = newRating;
      await mindspaceDB.update('therapists', therapist);

      return {
        success: true,
        message: 'Rating updated successfully'
      };
    } catch (error) {
      console.error('Error updating rating:', error);
      return {
        success: false,
        message: 'Failed to update rating'
      };
    }
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.TherapistManager = TherapistManager;
}
