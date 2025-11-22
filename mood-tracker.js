// mood-tracker.js - Mood Tracking Logic for MindSpace

class MoodTracker {
  // Log a new mood entry
  static async logMood(userId, moodData) {
    try {
      // Validate mood
      const validMood = MoodUtils.getMoodByName(moodData.mood);
      if (!validMood) {
        return {
          success: false,
          message: 'Invalid mood selected'
        };
      }

      // Validate intensity
      if (moodData.intensity < 1 || moodData.intensity > 10) {
        return {
          success: false,
          message: 'Intensity must be between 1 and 10'
        };
      }

      // Check if entry already exists for this date
      const existingEntries = await this.getMoodsByDate(userId, moodData.date);
      if (existingEntries.length > 0) {
        // Update existing entry instead of creating duplicate
        const existing = existingEntries[0];
        existing.mood = moodData.mood;
        existing.intensity = moodData.intensity;
        existing.notes = moodData.notes;
        existing.timestamp = new Date().toISOString();
        
        await mindspaceDB.update('moods', existing);
        
        return {
          success: true,
          moodId: existing.id,
          message: 'Mood entry updated'
        };
      }

      // Create new mood entry
      const mood = {
        userId: userId,
        mood: moodData.mood,
        intensity: moodData.intensity,
        notes: moodData.notes || '',
        date: moodData.date,
        timestamp: new Date().toISOString()
      };

      const moodId = await mindspaceDB.add('moods', mood);

      return {
        success: true,
        moodId: moodId,
        message: 'Mood logged successfully'
      };
    } catch (error) {
      console.error('Error logging mood:', error);
      return {
        success: false,
        message: 'Failed to log mood'
      };
    }
  }

  // Get mood history for a user
  static async getMoodHistory(userId) {
    try {
      const moods = await mindspaceDB.getByIndex('moods', 'userId', userId);
      
      // Sort by date (most recent first)
      return moods.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error getting mood history:', error);
      return [];
    }
  }

  // Get moods for a specific date
  static async getMoodsByDate(userId, date) {
    try {
      const allMoods = await mindspaceDB.getByIndex('moods', 'userId', userId);
      return allMoods.filter(mood => mood.date === date);
    } catch (error) {
      console.error('Error getting moods by date:', error);
      return [];
    }
  }

  // Get mood statistics
  static async getMoodStats(userId) {
    try {
      const moods = await this.getMoodHistory(userId);
      
      if (moods.length === 0) {
        return {
          totalEntries: 0,
          currentStreak: 0,
          avgIntensity: 0,
          trend: 'stable'
        };
      }

      // Calculate average intensity
      const avgIntensity = MoodUtils.calculateAverage(moods);

      // Calculate current streak
      const currentStreak = this.calculateStreak(moods);

      // Get trend
      const trend = MoodUtils.getMoodTrend(moods);

      return {
        totalEntries: moods.length,
        currentStreak: currentStreak,
        avgIntensity: avgIntensity,
        trend: trend
      };
    } catch (error) {
      console.error('Error getting mood stats:', error);
      return {
        totalEntries: 0,
        currentStreak: 0,
        avgIntensity: 0,
        trend: 'stable'
      };
    }
  }

  // Calculate consecutive days streak
  static calculateStreak(moods) {
    if (moods.length === 0) return 0;

    // Get unique dates
    const dates = [...new Set(moods.map(m => m.date))].sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const dateStr of dates) {
      const moodDate = new Date(dateStr);
      moodDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate - moodDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Get mood insights
  static async getMoodInsights(userId) {
    try {
      const moods = await this.getMoodHistory(userId);
      
      if (moods.length === 0) return null;

      // Find most common mood
      const moodCounts = {};
      moods.forEach(m => {
        moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
      });

      const mostCommonMoodName = Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b
      );
      const mostCommonMood = MoodUtils.getMoodByName(mostCommonMoodName);

      // Calculate average intensity
      const avgIntensity = parseFloat(MoodUtils.calculateAverage(moods));

      // Get trend
      const trend = MoodUtils.getMoodTrend(moods);

      // Get week entries
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekEntries = moods.filter(m => new Date(m.date) >= weekAgo).length;

      // Generate recommendation
      let recommendation = '';
      if (trend === 'declining' && avgIntensity < 5) {
        recommendation = 'Your mood has been declining. Consider scheduling a session with your therapist.';
      } else if (weekEntries < 3) {
        recommendation = 'Try to log your mood more regularly for better insights.';
      } else if (trend === 'improving') {
        recommendation = 'Great! Your mood is improving. Keep up the good work!';
      } else if (avgIntensity > 7) {
        recommendation = 'You\'re doing well! Continue your current practices.';
      } else {
        recommendation = 'Remember to practice self-care and reach out to your support system.';
      }

      return {
        mostCommon: {
          name: mostCommonMood.name,
          emoji: mostCommonMood.emoji,
          count: moodCounts[mostCommonMoodName]
        },
        avgIntensity: avgIntensity.toFixed(1),
        trend: trend,
        weekEntries: weekEntries,
        totalMoods: moods.length,
        recommendation: recommendation
      };
    } catch (error) {
      console.error('Error getting mood insights:', error);
      return null;
    }
  }

  // Get mood distribution
  static async getMoodDistribution(userId) {
    try {
      const moods = await this.getMoodHistory(userId);
      
      const distribution = {};
      MoodUtils.moodCategories.forEach(mood => {
        distribution[mood.name] = 0;
      });

      moods.forEach(m => {
        if (distribution[m.mood] !== undefined) {
          distribution[m.mood]++;
        }
      });

      return distribution;
    } catch (error) {
      console.error('Error getting mood distribution:', error);
      return {};
    }
  }

  // Get mood intensity over time
  static async getMoodIntensityOverTime(userId, days = 30) {
    try {
      const moods = await this.getMoodHistory(userId);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentMoods = moods.filter(m => new Date(m.date) >= cutoffDate);
      
      // Group by date
      const dailyData = {};
      recentMoods.forEach(m => {
        if (!dailyData[m.date]) {
          dailyData[m.date] = [];
        }
        dailyData[m.date].push(m.intensity);
      });

      // Calculate average for each day
      const result = Object.keys(dailyData).map(date => ({
        date: date,
        avgIntensity: dailyData[date].reduce((a, b) => a + b, 0) / dailyData[date].length
      }));

      return result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      console.error('Error getting mood intensity over time:', error);
      return [];
    }
  }

  // Get weekly mood summary
  static async getWeeklySummary(userId) {
    try {
      const moods = await this.getMoodHistory(userId);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weekMoods = moods.filter(m => new Date(m.date) >= weekAgo);

      if (weekMoods.length === 0) {
        return {
          entries: 0,
          avgIntensity: 0,
          mostCommon: null,
          trend: 'stable'
        };
      }

      // Most common mood
      const moodCounts = {};
      weekMoods.forEach(m => {
        moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
      });
      const mostCommon = Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b
      );

      return {
        entries: weekMoods.length,
        avgIntensity: parseFloat(MoodUtils.calculateAverage(weekMoods)),
        mostCommon: MoodUtils.getMoodByName(mostCommon),
        trend: MoodUtils.getMoodTrend(moods)
      };
    } catch (error) {
      console.error('Error getting weekly summary:', error);
      return {
        entries: 0,
        avgIntensity: 0,
        mostCommon: null,
        trend: 'stable'
      };
    }
  }

  // Get monthly mood summary
  static async getMonthlySummary(userId) {
    try {
      const moods = await this.getMoodHistory(userId);
      
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      const monthMoods = moods.filter(m => new Date(m.date) >= monthAgo);

      if (monthMoods.length === 0) {
        return {
          entries: 0,
          avgIntensity: 0,
          mostCommon: null,
          distribution: {}
        };
      }

      // Distribution
      const distribution = {};
      monthMoods.forEach(m => {
        distribution[m.mood] = (distribution[m.mood] || 0) + 1;
      });

      // Most common
      const mostCommon = Object.keys(distribution).reduce((a, b) => 
        distribution[a] > distribution[b] ? a : b
      );

      return {
        entries: monthMoods.length,
        avgIntensity: parseFloat(MoodUtils.calculateAverage(monthMoods)),
        mostCommon: MoodUtils.getMoodByName(mostCommon),
        distribution: distribution
      };
    } catch (error) {
      console.error('Error getting monthly summary:', error);
      return {
        entries: 0,
        avgIntensity: 0,
        mostCommon: null,
        distribution: {}
      };
    }
  }

  // Update mood entry
  static async updateMood(moodId, updates) {
    try {
      const mood = await mindspaceDB.get('moods', moodId);
      
      if (!mood) {
        return {
          success: false,
          message: 'Mood entry not found'
        };
      }

      // Update fields
      if (updates.mood) {
        const validMood = MoodUtils.getMoodByName(updates.mood);
        if (!validMood) {
          return {
            success: false,
            message: 'Invalid mood'
          };
        }
        mood.mood = updates.mood;
      }

      if (updates.intensity !== undefined) {
        if (updates.intensity < 1 || updates.intensity > 10) {
          return {
            success: false,
            message: 'Intensity must be between 1 and 10'
          };
        }
        mood.intensity = updates.intensity;
      }

      if (updates.notes !== undefined) {
        mood.notes = updates.notes;
      }

      mood.updatedAt = new Date().toISOString();

      await mindspaceDB.update('moods', mood);

      return {
        success: true,
        message: 'Mood updated successfully'
      };
    } catch (error) {
      console.error('Error updating mood:', error);
      return {
        success: false,
        message: 'Failed to update mood'
      };
    }
  }

  // Delete mood entry
  static async deleteMood(moodId) {
    try {
      const mood = await mindspaceDB.get('moods', moodId);
      
      if (!mood) {
        return {
          success: false,
          message: 'Mood entry not found'
        };
      }

      await mindspaceDB.delete('moods', moodId);

      return {
        success: true,
        message: 'Mood entry deleted'
      };
    } catch (error) {
      console.error('Error deleting mood:', error);
      return {
        success: false,
        message: 'Failed to delete mood'
      };
    }
  }

  // Get mood by ID
  static async getMoodById(moodId) {
    try {
      return await mindspaceDB.get('moods', moodId);
    } catch (error) {
      console.error('Error getting mood:', error);
      return null;
    }
  }

  // Export mood data (for reports)
  static async exportMoodData(userId) {
    try {
      const moods = await this.getMoodHistory(userId);
      
      // Convert to CSV format
      const csv = [
        ['Date', 'Mood', 'Intensity', 'Notes'],
        ...moods.map(m => [
          m.date,
          m.mood,
          m.intensity,
          m.notes.replace(/,/g, ';') // Replace commas in notes
        ])
      ].map(row => row.join(',')).join('\n');

      return {
        success: true,
        data: csv,
        format: 'csv'
      };
    } catch (error) {
      console.error('Error exporting mood data:', error);
      return {
        success: false,
        message: 'Failed to export data'
      };
    }
  }

  // Get mood patterns (specific times when certain moods are logged)
  static async getMoodPatterns(userId) {
    try {
      const moods = await this.getMoodHistory(userId);
      
      // Analyze by day of week
      const dayPatterns = {};
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      moods.forEach(m => {
        const day = days[new Date(m.date).getDay()];
        if (!dayPatterns[day]) {
          dayPatterns[day] = { total: 0, intensitySum: 0, moods: {} };
        }
        dayPatterns[day].total++;
        dayPatterns[day].intensitySum += m.intensity;
        dayPatterns[day].moods[m.mood] = (dayPatterns[day].moods[m.mood] || 0) + 1;
      });

      // Calculate averages
      Object.keys(dayPatterns).forEach(day => {
        dayPatterns[day].avgIntensity = (dayPatterns[day].intensitySum / dayPatterns[day].total).toFixed(1);
      });

      return dayPatterns;
    } catch (error) {
      console.error('Error getting mood patterns:', error);
      return {};
    }
  }

  // Compare mood with therapy sessions
  static async correlateWithTherapy(userId) {
    try {
      const moods = await this.getMoodHistory(userId);
      const appointments = await mindspaceDB.getByIndex('appointments', 'userId', userId);
      
      const completedSessions = appointments.filter(apt => apt.status === 'completed');
      
      // For each session, check mood before and after
      const correlations = completedSessions.map(session => {
        const sessionDate = new Date(session.date);
        
        // Get mood 7 days before
        const beforeDate = new Date(sessionDate);
        beforeDate.setDate(beforeDate.getDate() - 7);
        
        // Get mood 7 days after
        const afterDate = new Date(sessionDate);
        afterDate.setDate(afterDate.getDate() + 7);
        
        const beforeMoods = moods.filter(m => {
          const moodDate = new Date(m.date);
          return moodDate >= beforeDate && moodDate < sessionDate;
        });
        
        const afterMoods = moods.filter(m => {
          const moodDate = new Date(m.date);
          return moodDate > sessionDate && moodDate <= afterDate;
        });
        
        const beforeAvg = beforeMoods.length > 0 ? 
          beforeMoods.reduce((sum, m) => sum + m.intensity, 0) / beforeMoods.length : 0;
        
        const afterAvg = afterMoods.length > 0 ?
          afterMoods.reduce((sum, m) => sum + m.intensity, 0) / afterMoods.length : 0;
        
        return {
          sessionDate: session.date,
          beforeAvg: beforeAvg.toFixed(1),
          afterAvg: afterAvg.toFixed(1),
          improvement: (afterAvg - beforeAvg).toFixed(1)
        };
      });

      return correlations;
    } catch (error) {
      console.error('Error correlating with therapy:', error);
      return [];
    }
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.MoodTracker = MoodTracker;
}
