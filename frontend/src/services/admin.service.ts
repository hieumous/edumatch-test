/**
 * Admin Service API
 * Tích hợp với auth-service backend cho admin panel
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8080';

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
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders();
    
    console.log(`[AdminService] Calling API: ${url}`, {
      method: options.method || 'GET',
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      headers: Object.keys(headers)
    });

    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Include cookies for CORS
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    console.log(`[AdminService] Response status: ${response.status}`, {
      url,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch (e) {
        // If response is not JSON, use status text
        errorData = { message: response.statusText };
      }
      
      const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      console.error(`[AdminService] API error for ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    const text = await response.text();
    if (text) {
      try {
        return JSON.parse(text) as T;
      } catch {
        return {} as T;
      }
    }
    return {} as T;
  } catch (error: any) {
    console.error(`[AdminService] API call failed for ${endpoint}:`, {
      url,
      error: error.message,
      stack: error.stack
    });
    
    // Provide more helpful error messages
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc đảm bảo server đang chạy.');
    }
    
    throw error;
  }
}

// Types
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
  organizationId?: number;
  enabled: boolean;
  status?: string;
  subscriptionType?: string;
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalEmployers: number;
  totalAdmins: number;
  activeUsers: number;
  inactiveUsers: number;
  totalScholarships: number;
  activeScholarships: number;
  pendingScholarships: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
}

export interface PaginatedResponse<T> {
  [key: string]: T[] | number;
  currentPage: number;
  totalItems: number;
  totalPages: number;
  pageSize: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationId?: number;
}

export interface AdminScholarship {
  id: number;
  title: string;
  description?: string;
  amount?: number;
  type?: string;
  status?: string;
  moderationStatus?: string;
  applicationDeadline?: string;
  location?: string;
  university?: string;
  department?: string;
  creatorUserId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminApplication {
  id: number;
  applicantUserId: number;
  applicantUserName?: string;
  applicantEmail?: string;
  opportunityId: number;
  opportunityTitle?: string; // Thêm title của opportunity
  status: string;
  gpa?: number;
  coverLetter?: string;
  motivation?: string;
  phone?: string;
  submittedAt?: string; // Dùng submittedAt thay vì createdAt
  createdAt?: string;
  updatedAt?: string;
}

export interface SpringPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Admin Service API
export const adminService = {
  /**
   * Lấy thống kê tổng quan cho admin dashboard
   * GET /api/admin/stats
   */
  getStats: async (): Promise<AdminStats> => {
    return apiCall<AdminStats>('/api/admin/stats');
  },

  /**
   * Lấy danh sách users với filter và pagination
   * GET /api/admin/users
   */
  getUsers: async (params?: {
    page?: number;
    size?: number;
    role?: string;
    enabled?: boolean;
    keyword?: string;
  }): Promise<PaginatedResponse<AdminUser>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) searchParams.append('page', params.page.toString());
      if (params.size !== undefined) searchParams.append('size', params.size.toString());
      if (params.role) searchParams.append('role', params.role);
      if (params.enabled !== undefined) searchParams.append('enabled', params.enabled.toString());
      if (params.keyword) searchParams.append('keyword', params.keyword);
    }
    
    const queryString = searchParams.toString();
    return apiCall<PaginatedResponse<AdminUser>>(`/api/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Lấy chi tiết một user
   * GET /api/admin/users/{id}
   */
  getUserById: async (id: number): Promise<AdminUser> => {
    return apiCall<AdminUser>(`/api/admin/users/${id}`);
  },

  /**
   * Tạo user mới
   * POST /api/admin/create-user
   */
  createUser: async (request: CreateUserRequest): Promise<{ success: boolean; message: string }> => {
    return apiCall('/api/admin/create-user', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Tạo employer mới
   * POST /api/admin/create-employer
   */
  createEmployer: async (request: CreateUserRequest): Promise<{ success: boolean; message: string }> => {
    return apiCall('/api/admin/create-employer', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Xóa user
   * DELETE /api/admin/users/{id}
   */
  deleteUser: async (id: number): Promise<{ success: boolean; message: string }> => {
    return apiCall(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toggle user status (lock/unlock)
   * PATCH /api/admin/users/{id}/toggle-status
   */
  toggleUserStatus: async (id: number): Promise<{ success: boolean; message: string }> => {
    return apiCall(`/api/admin/users/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },

  /**
   * Lấy danh sách scholarships (opportunities) với pagination
   * GET /api/opportunities/all
   */
  getScholarships: async (params?: {
    page?: number;
    size?: number;
    status?: string;
    keyword?: string;
  }): Promise<SpringPageResponse<AdminScholarship>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) searchParams.append('page', params.page.toString());
      if (params.size !== undefined) searchParams.append('size', params.size.toString());
      if (params.status) searchParams.append('status', params.status);
      if (params.keyword) searchParams.append('keyword', params.keyword);
    }
    
    const queryString = searchParams.toString();
    return apiCall<SpringPageResponse<AdminScholarship>>(`/api/opportunities/all${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Duyệt hoặc từ chối scholarship
   * PUT /api/opportunities/{id}/moderate
   */
  moderateScholarship: async (id: number, status: 'APPROVED' | 'REJECTED'): Promise<AdminScholarship> => {
    return apiCall<AdminScholarship>(`/api/opportunities/${id}/moderate`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Lấy chi tiết một scholarship (cho phép xem cả PENDING)
   * GET /api/opportunities/{id}
   */
  getScholarshipById: async (id: number): Promise<any> => {
    const token = getAuthToken();
    console.log('[AdminService] getScholarshipById - Token check:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token ? `${token.substring(0, 30)}...` : 'none',
      id
    });
    return apiCall<any>(`/api/opportunities/${id}`);
  },

  /**
   * Xóa scholarship (admin only)
   * DELETE /api/opportunities/{id}/admin
   */
  deleteScholarship: async (id: number): Promise<{ success: boolean; message: string }> => {
    await apiCall(`/api/opportunities/${id}/admin`, {
      method: 'DELETE',
    });
    return { success: true, message: 'Scholarship deleted successfully' };
  },

  /**
   * Lấy danh sách applications với filter và pagination
   * GET /api/applications/all
   */
  getApplications: async (params?: {
    page?: number;
    size?: number;
    status?: string;
    opportunityId?: number;
    keyword?: string;
  }): Promise<SpringPageResponse<AdminApplication>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) searchParams.append('page', params.page.toString());
      if (params.size !== undefined) searchParams.append('size', params.size.toString());
      if (params.status) searchParams.append('status', params.status);
      if (params.opportunityId) searchParams.append('opportunityId', params.opportunityId.toString());
      if (params.keyword) searchParams.append('keyword', params.keyword);
    }
    
    const queryString = searchParams.toString();
    return apiCall<SpringPageResponse<AdminApplication>>(`/api/applications/all${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Lấy chi tiết một application
   * GET /api/applications/{id}
   */
  getApplicationById: async (id: number): Promise<AdminApplication> => {
    return apiCall<AdminApplication>(`/api/applications/${id}`);
  },

  /**
   * Admin cập nhật trạng thái application (Accept/Reject/Under Review)
   * PUT /api/applications/{id}/admin/status
   */
  updateApplicationStatus: async (id: number, status: 'ACCEPTED' | 'REJECTED' | 'UNDER_REVIEW' | 'PENDING'): Promise<AdminApplication> => {
    return apiCall<AdminApplication>(`/api/applications/${id}/admin/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Lấy recent applications (cho admin dashboard)
   * GET /api/applications/recent
   */
  getRecentApplications: async (limit: number = 5): Promise<AdminApplication[]> => {
    return apiCall<AdminApplication[]>(`/api/applications/recent?limit=${limit}`);
  },

  /**
   * Lấy recent users (cho admin dashboard)
   * GET /api/admin/users/recent
   */
  getRecentUsers: async (limit: number = 5): Promise<AdminUser[]> => {
    const response = await apiCall<{ users: AdminUser[] }>(`/api/admin/users/recent?limit=${limit}`);
    return response.users || [];
  },

  /**
   * Admin Notifications APIs
   */
  
  /**
   * Gửi thông báo
   * POST /api/admin/notifications/send
   */
  sendNotification: async (request: {
    targetAudience: string;
    specificEmail?: string;
    type: string;
    priority: string;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    sendEmail: boolean;
  }): Promise<any> => {
    return apiCall('/api/admin/notifications/send', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Lấy stats notifications
   * GET /api/admin/notifications/stats
   */
  getNotificationStats: async (): Promise<{
    totalSent: number;
    delivered: number;
    pending: number;
    failed: number;
    changePercentage: number;
  }> => {
    return apiCall('/api/admin/notifications/stats');
  },

  /**
   * Lấy lịch sử notifications
   * GET /api/admin/notifications/history
   */
  getNotificationHistory: async (params?: {
    page?: number;
    size?: number;
  }): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) searchParams.append('page', params.page.toString());
      if (params.size !== undefined) searchParams.append('size', params.size.toString());
    }
    
    const queryString = searchParams.toString();
    return apiCall(`/api/admin/notifications/history${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Lấy tất cả templates
   * GET /api/admin/notifications/templates
   */
  getNotificationTemplates: async (): Promise<any[]> => {
    return apiCall('/api/admin/notifications/templates');
  },

  /**
   * Lấy một template
   * GET /api/admin/notifications/templates/{id}
   */
  getNotificationTemplate: async (id: number): Promise<any> => {
    return apiCall(`/api/admin/notifications/templates/${id}`);
  },

  /**
   * Tạo template mới
   * POST /api/admin/notifications/templates
   */
  createNotificationTemplate: async (request: {
    name: string;
    description?: string;
    type: string;
    title?: string;
    message?: string;
    actionUrl?: string;
    actionLabel?: string;
    priority?: string;
  }): Promise<any> => {
    return apiCall('/api/admin/notifications/templates', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Cập nhật template
   * PUT /api/admin/notifications/templates/{id}
   */
  updateNotificationTemplate: async (id: number, request: {
    name: string;
    description?: string;
    type: string;
    title?: string;
    message?: string;
    actionUrl?: string;
    actionLabel?: string;
    priority?: string;
  }): Promise<any> => {
    return apiCall(`/api/admin/notifications/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /**
   * Xóa template
   * DELETE /api/admin/notifications/templates/{id}
   */
  deleteNotificationTemplate: async (id: number): Promise<void> => {
    return apiCall(`/api/admin/notifications/templates/${id}`, {
      method: 'DELETE',
    });
  },
};

export default adminService;

