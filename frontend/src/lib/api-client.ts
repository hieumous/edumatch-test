// src/lib/api-client.ts

'use client';

import { mockApi } from './mock-data';
import { 
  AuthUser, 
  LoginCredentials, 
  RegisterCredentials, 
  ApiResponse,
  Scholarship, 
  Application,
  ApplicationStatus,
  Notification,
  UserProfile
} from '@/types';

// =============================================================================
// CENTRALIZED API CLIENT
// =============================================================================

export const apiClient = {
  // Authentication
  auth: {
    async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: AuthUser; token: string }>> {
      return mockApi.auth.login(credentials);
    },

    async register(credentials: RegisterCredentials): Promise<ApiResponse<{ user: AuthUser; token: string }>> {
      return mockApi.auth.register(credentials);
    },

    async logout(): Promise<ApiResponse> {
      return mockApi.auth.logout();
    },

    async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
      return mockApi.auth.getCurrentUser();
    }
  },

  // Scholarships
  scholarships: {
    async getAll(filters?: any): Promise<ApiResponse<Scholarship[]>> {
      return mockApi.scholarships.getAll(filters);
    },

    async getById(id: string): Promise<ApiResponse<Scholarship>> {
      return mockApi.scholarships.getById(id);
    },

    async getByProvider(providerId: string): Promise<ApiResponse<Scholarship[]>> {
      return mockApi.scholarships.getByProvider(providerId);
    },

    async create(scholarshipData: Partial<Scholarship>): Promise<ApiResponse<Scholarship>> {
      return mockApi.scholarships.create(scholarshipData);
    },

    async update(id: string, updates: Partial<Scholarship>): Promise<ApiResponse<Scholarship>> {
      return mockApi.scholarships.update(id, updates);
    }
  },

  // Applications
  applications: {
    async getByUser(userId: string): Promise<ApiResponse<Application[]>> {
      return mockApi.applications.getByUser(userId);
    },

    async getByScholarship(scholarshipId: string): Promise<ApiResponse<Application[]>> {
      return mockApi.applications.getByScholarship(scholarshipId);
    },

    async submit(applicationData: any): Promise<ApiResponse<Application>> {
      return mockApi.applications.submit(applicationData);
    },

    async updateStatus(id: string, status: ApplicationStatus): Promise<ApiResponse<Application>> {
      return mockApi.applications.updateStatus(id, status);
    },

    async checkApplicationStatus(scholarshipId: string, userId: string): Promise<ApiResponse<{ hasApplied: boolean; application?: Application }>> {
      return mockApi.applications.checkApplicationStatus(scholarshipId, userId);
    }
  },

  // Saved Scholarships
  savedScholarships: {
    async getByUser(userId: string): Promise<ApiResponse<string[]>> {
      return mockApi.savedScholarships.getByUser(userId);
    },

    async toggle(userId: string, scholarshipId: string): Promise<ApiResponse<{ saved: boolean }>> {
      return mockApi.savedScholarships.toggle(userId, scholarshipId);
    }
  },

  // Notifications
  notifications: {
    async getByUser(userId: string): Promise<ApiResponse<Notification[]>> {
      return mockApi.notifications.getByUser(userId);
    },

    async markAsRead(id: string): Promise<ApiResponse> {
      return mockApi.notifications.markAsRead(id);
    },

    async markAllAsRead(userId: string): Promise<ApiResponse> {
      return mockApi.notifications.markAllAsRead(userId);
    }
  },

  // Profile (ĐÃ SỬA LỖI)
  profile: { // SỬA: profile (số ít)
    async getById(userId: string): Promise<ApiResponse<UserProfile>> {
      return mockApi.profile.getById(userId); // SỬA: profile (số ít)
    },

    async update(userId: string, profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
      return mockApi.profile.update(userId, profileData); // SỬA: profile (số ít)
    }
  },

  // Analytics
  analytics: {
    async getDashboardStats(providerId: string): Promise<ApiResponse<any>> {
      return mockApi.analytics.getDashboardStats(providerId);
    }
  }
};

// =============================================================================
// REACT HOOKS FOR API INTEGRATION
// =============================================================================

import { useState, useEffect, useCallback } from 'react';

// (Giữ nguyên toàn bộ phần code React Hooks)
// ... (useSavedScholarships, useScholarships, useApplications, useNotifications)
export function useSavedScholarships(userId: string = '1') {
  const [savedScholarships, setSavedScholarships] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSavedScholarships = async () => {
      setLoading(true);
      try {
        const response = await apiClient.savedScholarships.getByUser(userId);
        if (response.success && response.data) {
          setSavedScholarships(response.data);
        }
      } catch (error) {
        // Failed to load saved scholarships
      } finally {
        setLoading(false);
      }
    };

    loadSavedScholarships();
  }, [userId]);

  const toggleSaved = useCallback(async (scholarshipId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.savedScholarships.toggle(userId, scholarshipId);
      if (response.success) {
        setSavedScholarships(prev => 
          prev.includes(scholarshipId)
            ? prev.filter(id => id !== scholarshipId)
            : [...prev, scholarshipId]
        );
      }
    } catch (error) {
      // Failed to toggle saved scholarship
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const isScholarshipSaved = useCallback((scholarshipId: string) => {
    return savedScholarships.includes(scholarshipId);
  }, [savedScholarships]);

  return {
    savedScholarships,
    loading,
    toggleSaved,
    isScholarshipSaved
  };
}

export function useScholarships(filters?: any) {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScholarships = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.scholarships.getAll(filters);
      if (response.success && response.data) {
        setScholarships(response.data);
      } else {
        setError(response.error || 'Failed to load scholarships');
      }
    } catch (err) {
      setError('Failed to load scholarships');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadScholarships();
  }, [loadScholarships]);

  return {
    scholarships,
    loading,
    error,
    refetch: loadScholarships
  };
}

export function useApplications(userId: string = '1') {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.applications.getByUser(userId);
      if (response.success && response.data) {
        setApplications(response.data);
      } else {
        setError(response.error || 'Failed to load applications');
      }
    } catch (err) {
      setError('Failed to load applications');
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const submitApplication = useCallback(async (applicationData: any) => {
    setLoading(true);
    try {
      const response = await apiClient.applications.submit(applicationData);
      if (response.success) {
        await loadApplications(); // Refresh the list
        return response;
      } else {
        setError(response.error || 'Failed to submit application');
        return response;
      }
    } catch (err) {
      setError('Failed to submit application');
      console.error('Failed to submit application:', err);
      return { success: false, error: 'Failed to submit application' };
    } finally {
      setLoading(false);
    }
  }, [loadApplications]);
  
  // Thêm lại checkApplicationStatus vào return
  const checkApplicationStatus = useCallback(async (scholarshipId: string) => {
    try {
      const response = await apiClient.applications.checkApplicationStatus(scholarshipId, userId);
      return response.data?.application || null;
    } catch (err) {
      return null;
    }
  }, [userId]);

  return {
    applications,
    loading,
    error,
    refetch: loadApplications,
    submitApplication,
    checkApplicationStatus // Thêm dòng này
  };
}

export function useNotifications(userId: string = '1') {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.notifications.getByUser(userId);
      if (response.success && response.data) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await apiClient.notifications.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiClient.notifications.markAllAsRead(userId);
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [userId]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: loadNotifications
  };
}

// Export the mock data for components that need direct access
export { mockScholarships, mockApplications, mockNotifications } from './mock-data';