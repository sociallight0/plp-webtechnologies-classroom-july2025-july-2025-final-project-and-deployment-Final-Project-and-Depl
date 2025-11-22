// appointments.js - Appointment Management Logic for MindSpace

class AppointmentManager {
  // Book a new appointment
  static async bookAppointment(userId, appointmentData) {
    try {
      // Validate therapist connection
      const isConnected = await TherapistManager.isConnected(userId, appointmentData.therapistId);
      if (!isConnected) {
        return {
          success: false,
          message: 'You must be connected with this therapist first'
        };
      }

      // Check if time slot is available
      const isAvailable = await this.isSlotAvailable(
        appointmentData.therapistId,
        appointmentData.date,
        appointmentData.time
      );

      if (!isAvailable) {
        return {
          success: false,
          message: 'This time slot is no longer available'
        };
      }

      // Create appointment object
      const appointment = {
        userId: userId,
        therapistId: appointmentData.therapistId,
        date: appointmentData.date,
        time: appointmentData.time,
        duration: appointmentData.duration || 50,
        type: appointmentData.type || 'Regular Session',
        status: 'confirmed',
        notes: appointmentData.notes || '',
        createdAt: new Date().toISOString()
      };

      // Save appointment
      const appointmentId = await mindspaceDB.add('appointments', appointment);

      return {
        success: true,
        appointmentId: appointmentId,
        message: 'Appointment booked successfully'
      };
    } catch (error) {
      console.error('Error booking appointment:', error);
      return {
        success: false,
        message: 'Failed to book appointment'
      };
    }
  }

  // Get available time slots for a therapist on a specific date
  static async getAvailableSlots(therapistId, date, duration = 50) {
    try {
      const therapist = await mindspaceDB.get('therapists', therapistId);
      if (!therapist) return [];

      // Check if therapist works on this day
      const dayOfWeek = DateUtils.getDayOfWeek(date);
      if (!therapist.availability.includes(dayOfWeek)) {
        return [];
      }

      // Generate all possible time slots based on duration
      const allSlots = DateUtils.generateTimeSlots(9, 17, duration);

      // Get existing appointments for this therapist on this date
      const allAppointments = await mindspaceDB.getByIndex('appointments', 'therapistId', therapistId);
      const dateAppointments = allAppointments.filter(apt => 
        apt.date === date && apt.status !== 'cancelled'
      );

      // Remove booked slots
      const bookedTimes = dateAppointments.map(apt => apt.time);
      const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

      return availableSlots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  // Check if a specific time slot is available
  static async isSlotAvailable(therapistId, date, time) {
    try {
      const appointments = await mindspaceDB.getByIndex('appointments', 'therapistId', therapistId);
      
      const conflict = appointments.find(apt => 
        apt.date === date && 
        apt.time === time && 
        apt.status !== 'cancelled'
      );

      return !conflict;
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return false;
    }
  }

  // Get upcoming appointments for a user
  static async getUpcomingAppointments(userId) {
    try {
      const allAppointments = await mindspaceDB.getByIndex('appointments', 'userId', userId);
      
      const upcoming = allAppointments.filter(apt => {
        const aptDateTime = new Date(apt.date + ' ' + apt.time);
        return aptDateTime > new Date() && apt.status === 'confirmed';
      });

      // Sort by date and time
      return upcoming.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateA - dateB;
      });
    } catch (error) {
      console.error('Error getting upcoming appointments:', error);
      return [];
    }
  }

  // Get past appointments for a user
  static async getPastAppointments(userId) {
    try {
      const allAppointments = await mindspaceDB.getByIndex('appointments', 'userId', userId);
      
      const past = allAppointments.filter(apt => {
        const aptDateTime = new Date(apt.date + ' ' + apt.time);
        return aptDateTime < new Date() || apt.status === 'completed';
      });

      // Sort by date and time (most recent first)
      return past.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error getting past appointments:', error);
      return [];
    }
  }

  // Get cancelled appointments for a user
  static async getCancelledAppointments(userId) {
    try {
      const allAppointments = await mindspaceDB.getByIndex('appointments', 'userId', userId);
      
      const cancelled = allAppointments.filter(apt => apt.status === 'cancelled');

      // Sort by date and time (most recent first)
      return cancelled.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error getting cancelled appointments:', error);
      return [];
    }
  }

  // Get all appointments for a user
  static async getAllAppointments(userId) {
    try {
      const appointments = await mindspaceDB.getByIndex('appointments', 'userId', userId);
      
      return appointments.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error getting all appointments:', error);
      return [];
    }
  }

  // Get appointment by ID
  static async getAppointmentById(appointmentId) {
    try {
      return await mindspaceDB.get('appointments', appointmentId);
    } catch (error) {
      console.error('Error getting appointment:', error);
      return null;
    }
  }

  // Cancel an appointment
  static async cancelAppointment(appointmentId) {
    try {
      const appointment = await mindspaceDB.get('appointments', appointmentId);
      
      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found'
        };
      }

      if (appointment.status === 'cancelled') {
        return {
          success: false,
          message: 'Appointment is already cancelled'
        };
      }

      // Update status
      appointment.status = 'cancelled';
      appointment.cancelledAt = new Date().toISOString();
      
      await mindspaceDB.update('appointments', appointment);

      return {
        success: true,
        message: 'Appointment cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return {
        success: false,
        message: 'Failed to cancel appointment'
      };
    }
  }

  // Reschedule an appointment
  static async rescheduleAppointment(appointmentId, newDate, newTime) {
    try {
      const appointment = await mindspaceDB.get('appointments', appointmentId);
      
      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found'
        };
      }

      if (appointment.status === 'cancelled') {
        return {
          success: false,
          message: 'Cannot reschedule a cancelled appointment'
        };
      }

      // Check if new slot is available
      const isAvailable = await this.isSlotAvailable(
        appointment.therapistId,
        newDate,
        newTime
      );

      if (!isAvailable) {
        return {
          success: false,
          message: 'The new time slot is not available'
        };
      }

      // Update appointment
      appointment.date = newDate;
      appointment.time = newTime;
      appointment.rescheduledAt = new Date().toISOString();
      
      await mindspaceDB.update('appointments', appointment);

      return {
        success: true,
        message: 'Appointment rescheduled successfully'
      };
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return {
        success: false,
        message: 'Failed to reschedule appointment'
      };
    }
  }

  // Mark appointment as completed
  static async completeAppointment(appointmentId) {
    try {
      const appointment = await mindspaceDB.get('appointments', appointmentId);
      
      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found'
        };
      }

      appointment.status = 'completed';
      appointment.completedAt = new Date().toISOString();
      
      await mindspaceDB.update('appointments', appointment);

      return {
        success: true,
        message: 'Appointment marked as completed'
      };
    } catch (error) {
      console.error('Error completing appointment:', error);
      return {
        success: false,
        message: 'Failed to complete appointment'
      };
    }
  }

  // Update appointment notes
  static async updateNotes(appointmentId, notes) {
    try {
      const appointment = await mindspaceDB.get('appointments', appointmentId);
      
      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found'
        };
      }

      appointment.notes = notes;
      await mindspaceDB.update('appointments', appointment);

      return {
        success: true,
        message: 'Notes updated successfully'
      };
    } catch (error) {
      console.error('Error updating notes:', error);
      return {
        success: false,
        message: 'Failed to update notes'
      };
    }
  }

  // Get appointment statistics for a user
  static async getAppointmentStats(userId) {
    try {
      const appointments = await this.getAllAppointments(userId);
      
      const total = appointments.length;
      const upcoming = appointments.filter(apt => {
        const aptDateTime = new Date(apt.date + ' ' + apt.time);
        return aptDateTime > new Date() && apt.status === 'confirmed';
      }).length;
      
      const completed = appointments.filter(apt => apt.status === 'completed').length;
      const cancelled = appointments.filter(apt => apt.status === 'cancelled').length;

      // Calculate total therapy hours
      const totalMinutes = appointments
        .filter(apt => apt.status === 'completed')
        .reduce((sum, apt) => sum + apt.duration, 0);
      const totalHours = (totalMinutes / 60).toFixed(1);

      return {
        total,
        upcoming,
        completed,
        cancelled,
        totalHours
      };
    } catch (error) {
      console.error('Error getting appointment stats:', error);
      return {
        total: 0,
        upcoming: 0,
        completed: 0,
        cancelled: 0,
        totalHours: 0
      };
    }
  }

  // Get next appointment for a user
  static async getNextAppointment(userId) {
    try {
      const upcoming = await this.getUpcomingAppointments(userId);
      return upcoming.length > 0 ? upcoming[0] : null;
    } catch (error) {
      console.error('Error getting next appointment:', error);
      return null;
    }
  }

  // Get appointments for a specific date
  static async getAppointmentsByDate(userId, date) {
    try {
      const allAppointments = await mindspaceDB.getByIndex('appointments', 'userId', userId);
      
      return allAppointments.filter(apt => apt.date === date);
    } catch (error) {
      console.error('Error getting appointments by date:', error);
      return [];
    }
  }

  // Get appointments with a specific therapist
  static async getAppointmentsWithTherapist(userId, therapistId) {
    try {
      const userAppointments = await mindspaceDB.getByIndex('appointments', 'userId', userId);
      
      return userAppointments.filter(apt => apt.therapistId === therapistId);
    } catch (error) {
      console.error('Error getting appointments with therapist:', error);
      return [];
    }
  }

  // Check for appointment conflicts
  static async hasConflict(userId, date, time, duration) {
    try {
      const appointments = await this.getAppointmentsByDate(userId, date);
      
      const startTime = new Date(`${date} ${time}`);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      for (const apt of appointments) {
        if (apt.status === 'cancelled') continue;

        const aptStart = new Date(`${apt.date} ${apt.time}`);
        const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);

        // Check for overlap
        if (startTime < aptEnd && endTime > aptStart) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return true; // Return true on error to be safe
    }
  }

  // Get appointments for the current week
  static async getWeekAppointments(userId) {
    try {
      const { start, end } = DateUtils.getWeekRange();
      const allAppointments = await mindspaceDB.getByIndex('appointments', 'userId', userId);
      
      return allAppointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= start && aptDate <= end && apt.status !== 'cancelled';
      });
    } catch (error) {
      console.error('Error getting week appointments:', error);
      return [];
    }
  }

  // Send appointment reminder (placeholder for future implementation)
  static async sendReminder(appointmentId) {
    try {
      const appointment = await mindspaceDB.get('appointments', appointmentId);
      
      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found'
        };
      }

      // In a real app, this would send an email/SMS
      console.log(`Reminder sent for appointment ${appointmentId}`);

      return {
        success: true,
        message: 'Reminder sent successfully'
      };
    } catch (error) {
      console.error('Error sending reminder:', error);
      return {
        success: false,
        message: 'Failed to send reminder'
      };
    }
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.AppointmentManager = AppointmentManager;
}
