import { 
  ApiResponse, 
  PaginatedResponse, 
  Scholarship, 
  Application, 
  UserProfile, 
  ScholarshipFilters,
  LoginForm,
  SignupForm,
  ProfileForm,
  ScholarshipForm,
  Notification,
  Message,
  Conversation
} from '@/types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

// Request configuration
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include cookies for authentication
};

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

// Helper function to create authenticated headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Generic API call function
async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Auth API
export const authApi = {
  // Login user
  login: (credentials: LoginForm) =>
    apiCall<{ user: UserProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Register user
  register: (userData: SignupForm) =>
    apiCall<{ user: UserProfile; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // Logout user
  logout: () =>
    apiCall('/auth/logout', {
      method: 'POST',
    }),

  // Get current user
  me: () =>
    apiCall<UserProfile>('/auth/me'),

  // Verify email
  verifyEmail: (token: string) =>
    apiCall('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  // Reset password
  requestPasswordReset: (email: string) =>
    apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Reset password with token
  resetPassword: (token: string, password: string) =>
    apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};

// Users API
export const usersApi = {
  // Get user profile
  getProfile: (userId?: string) =>
    apiCall<UserProfile>(userId ? `/users/${userId}` : '/users/profile'),

  // Update user profile
  updateProfile: (profileData: Partial<ProfileForm>) =>
    apiCall<UserProfile>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  // Upload avatar
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return apiCall<{ avatarUrl: string }>('/users/avatar', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        // Don't set Content-Type for FormData
      },
    });
  },

  // Delete account
  deleteAccount: () =>
    apiCall('/users/account', {
      method: 'DELETE',
    }),
};

// Scholarships API
export const scholarshipsApi = {
  // Get scholarships with filters and pagination
  getScholarships: (filters?: ScholarshipFilters, page = 1, limit = 20) => {
    const searchParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }
    
    searchParams.append('page', page.toString());
    searchParams.append('limit', limit.toString());
    
    return apiCall<PaginatedResponse<Scholarship>>(`/scholarships?${searchParams.toString()}`);
  },

  // Get scholarship by ID
  getScholarship: (id: string) =>
    apiCall<Scholarship>(`/scholarships/${id}`),

  // Create scholarship (provider only)
  createScholarship: (scholarshipData: ScholarshipForm) =>
    apiCall<Scholarship>('/scholarships', {
      method: 'POST',
      body: JSON.stringify(scholarshipData),
    }),

  // Update scholarship (provider only)
  updateScholarship: (id: string, scholarshipData: Partial<ScholarshipForm>) =>
    apiCall<Scholarship>(`/scholarships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scholarshipData),
    }),

  // Delete scholarship (provider only)
  deleteScholarship: (id: string) =>
    apiCall(`/scholarships/${id}`, {
      method: 'DELETE',
    }),

  // Get scholarship recommendations
  getRecommendations: (limit = 10) =>
    apiCall<Scholarship[]>(`/scholarships/recommendations?limit=${limit}`),

  // Save/bookmark scholarship
  saveScholarship: (scholarshipId: string) =>
    apiCall(`/scholarships/${scholarshipId}/save`, {
      method: 'POST',
    }),

  // Unsave scholarship
  unsaveScholarship: (scholarshipId: string) =>
    apiCall(`/scholarships/${scholarshipId}/save`, {
      method: 'DELETE',
    }),

  // Get saved scholarships
  getSavedScholarships: (page = 1, limit = 20) =>
    apiCall<PaginatedResponse<Scholarship>>(`/scholarships/saved?page=${page}&limit=${limit}`),
};

// Applications API
export const applicationsApi = {
  // Get user's applications
  getApplications: (page = 1, limit = 20) =>
    apiCall<PaginatedResponse<Application>>(`/applications?page=${page}&limit=${limit}`),

  // Get application by ID
  getApplication: (id: string) =>
    apiCall<Application>(`/applications/${id}`),

  // Create application
  createApplication: (scholarshipId: string, applicationData: any) =>
    apiCall<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify({
        scholarshipId,
        ...applicationData,
      }),
    }),

  // Update application
  updateApplication: (id: string, applicationData: any) =>
    apiCall<Application>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(applicationData),
    }),

  // Submit application
  submitApplication: (id: string) =>
    apiCall<Application>(`/applications/${id}/submit`, {
      method: 'POST',
    }),

  // Withdraw application
  withdrawApplication: (id: string) =>
    apiCall<Application>(`/applications/${id}/withdraw`, {
      method: 'POST',
    }),

  // Upload application document
  uploadDocument: (applicationId: string, file: File, documentType: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', documentType);
    
    return apiCall<{ url: string }>(`/applications/${applicationId}/documents`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
  },

  // Get scholarship applications (for providers)
  getScholarshipApplications: (scholarshipId: string, page = 1, limit = 20) =>
    apiCall<PaginatedResponse<Application>>(`/scholarships/${scholarshipId}/applications?page=${page}&limit=${limit}`),

  // Update application status (for providers)
  updateApplicationStatus: (applicationId: string, status: string, feedback?: string) =>
    apiCall<Application>(`/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, feedback }),
    }),
};

// Notifications API
export const notificationsApi = {
  // Get notifications
  getNotifications: (page = 1, limit = 20) =>
    apiCall<PaginatedResponse<Notification>>(`/notifications?page=${page}&limit=${limit}`),

  // Mark notification as read
  markAsRead: (id: string) =>
    apiCall(`/notifications/${id}/read`, {
      method: 'PUT',
    }),

  // Mark all notifications as read
  markAllAsRead: () =>
    apiCall('/notifications/read-all', {
      method: 'PUT',
    }),

  // Delete notification
  deleteNotification: (id: string) =>
    apiCall(`/notifications/${id}`, {
      method: 'DELETE',
    }),

  // Get unread count
  getUnreadCount: () =>
    apiCall<{ count: number }>('/notifications/unread-count'),
};

// Messages API
export const messagesApi = {
  // Get conversations
  getConversations: (page = 1, limit = 20) =>
    apiCall<PaginatedResponse<Conversation>>(`/messages/conversations?page=${page}&limit=${limit}`),

  // Get conversation messages
  getMessages: (conversationId: string, page = 1, limit = 50) =>
    apiCall<PaginatedResponse<Message>>(`/messages/conversations/${conversationId}?page=${page}&limit=${limit}`),

  // Send message
  sendMessage: (conversationId: string, content: string, attachments?: File[]) => {
    if (attachments && attachments.length > 0) {
      const formData = new FormData();
      formData.append('content', content);
      attachments.forEach(file => formData.append('attachments', file));
      
      return apiCall<Message>(`/messages/conversations/${conversationId}`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
    } else {
      return apiCall<Message>(`/messages/conversations/${conversationId}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    }
  },

  // Create conversation
  createConversation: (participantId: string) =>
    apiCall<Conversation>('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    }),

  // Mark messages as read
  markAsRead: (conversationId: string) =>
    apiCall(`/messages/conversations/${conversationId}/read`, {
      method: 'PUT',
    }),
};

// Admin API
export const adminApi = {
  // Get users (admin only)
  getUsers: (page = 1, limit = 20, filters?: any) => {
    const searchParams = new URLSearchParams();
    searchParams.append('page', page.toString());
    searchParams.append('limit', limit.toString());
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiCall<PaginatedResponse<UserProfile>>(`/admin/users?${searchParams.toString()}`);
  },

  // Get scholarships (admin only)
  getAllScholarships: (page = 1, limit = 20, filters?: any) => {
    const searchParams = new URLSearchParams();
    searchParams.append('page', page.toString());
    searchParams.append('limit', limit.toString());
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return apiCall<PaginatedResponse<Scholarship>>(`/admin/scholarships?${searchParams.toString()}`);
  },

  // Update user status
  updateUserStatus: (userId: string, status: string) =>
    apiCall(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Get analytics
  getAnalytics: () =>
    apiCall('/admin/analytics'),
};

// Export all APIs
export const api = {
  auth: authApi,
  users: usersApi,
  scholarships: scholarshipsApi,
  applications: applicationsApi,
  notifications: notificationsApi,
  messages: messagesApi,
  admin: adminApi,
};

export default api;