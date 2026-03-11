/**
 * Scholarship Service API
 * Tích hợp với scholarship-service backend
 */

import { 
  ApiResponse, 
  PaginatedResponse, 
  Scholarship, 
  Application 
} from '@/types';

// API Base URL - sử dụng gateway (port 8080)
// Gateway chạy ở http://localhost:8080, endpoint đã có /api/ prefix
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
  process.env.NEXT_PUBLIC_API_GATEWAY ||
  (typeof window !== 'undefined' 
    ? 'http://localhost:8080'  // Gateway URL (port 8080)
    : 'http://localhost:8080');

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
    const response = await fetch(url, {
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
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
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

// Scholarship Filters Interface
export interface ScholarshipSearchFilters {
  q?: string; // Search query
  gpa?: number; // Minimum GPA
  studyMode?: string; // FULL_TIME, PART_TIME, ONLINE, HYBRID
  level?: string; // UNDERGRADUATE, MASTER, PHD, etc.
  isPublic?: boolean;
  currentDate?: string; // YYYY-MM-DD
  page?: number;
  size?: number;
  sort?: string;
}

// Application Request Interface
export interface CreateApplicationRequest {
  opportunityId: number; // BE expects opportunityId, not scholarshipId
  documents?: Array<{
    documentName: string;
    documentUrl: string;
  }>;
  // Additional fields from FE form
  applicantUserName?: string;
  applicantEmail?: string;
  phone?: string;
  gpa?: number;
  coverLetter?: string;
  motivation?: string;
  additionalInfo?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

// Create Opportunity Request Interface (for Employer)
export interface CreateOpportunityRequest {
  title: string;
  fullDescription: string;
  applicationDeadline: string; // ISO date string (YYYY-MM-DD)
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string | null; // ISO date string (YYYY-MM-DD) or null
  scholarshipAmount: number;
  minGpa?: number;
  studyMode: string; // FULL_TIME, PART_TIME, ONLINE, HYBRID
  level: string; // UNDERGRADUATE, MASTER, PHD, POSTDOC, RESEARCH
  isPublic: boolean;
  contactEmail?: string;
  website?: string | null;
  tags?: string[]; // Array of tag names
  requiredSkills?: string[]; // Array of skill names
}

// Scholarship Service API
export const scholarshipServiceApi = {
  /**
   * Tìm kiếm và lọc scholarships (opportunities)
   * GET /api/scholarships
   */
  getScholarships: async (filters?: ScholarshipSearchFilters) => {
    const searchParams = new URLSearchParams();
    
    if (filters) {
      if (filters.q) searchParams.append('q', filters.q);
      if (filters.gpa !== undefined) searchParams.append('gpa', filters.gpa.toString());
      if (filters.studyMode) searchParams.append('studyMode', filters.studyMode);
      if (filters.level) searchParams.append('level', filters.level);
      if (filters.isPublic !== undefined) searchParams.append('isPublic', filters.isPublic.toString());
      if (filters.currentDate) searchParams.append('currentDate', filters.currentDate);
      if (filters.page !== undefined) searchParams.append('page', filters.page.toString());
      if (filters.size !== undefined) searchParams.append('size', filters.size.toString());
      if (filters.sort) searchParams.append('sort', filters.sort);
    }
    
    const queryString = searchParams.toString();
    return apiCall<PaginatedResponse<Scholarship>>(`/api/scholarships${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Lấy chi tiết một scholarship (opportunity)
   * GET /api/scholarships/{id}
   */
  getScholarshipById: async (id: string | number) => {
    return apiCall<{ opportunity: Scholarship; matchScore?: number }>(`/api/scholarships/${id}`);
  },

  /**
   * Tạo application (nộp đơn)
   * POST /api/applications
   */
  createApplication: async (request: CreateApplicationRequest) => {
    return apiCall<Application>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Lấy danh sách applications của user hiện tại
   * GET /api/applications/my
   */
  getMyApplications: async () => {
    return apiCall<Application[]>('/api/applications/my');
  },

  /**
   * Lấy danh sách applications cho một opportunity (Employer only)
   * GET /api/applications/opportunity/{opportunityId}
   */
  getApplicationsForOpportunity: async (opportunityId: string | number) => {
    return apiCall<Application[]>(`/api/applications/opportunity/${opportunityId}`);
  },

  /**
   * Cập nhật trạng thái application (Employer only)
   * PUT /api/applications/{applicationId}/status
   */
  updateApplicationStatus: async (applicationId: string | number, status: string) => {
    return apiCall<Application>(`/api/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Toggle bookmark (bookmark/unbookmark)
   * POST /api/bookmarks/{opportunityId}
   */
  toggleBookmark: async (opportunityId: string | number) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
    }

    try {
      const response = await fetch(`/api/bookmarks/${opportunityId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { message: 'Unknown error', raw: await response.text().catch(() => '') };
        }
        const errorMessage = errorData.message || errorData.error || errorData.details || `HTTP ${response.status}: Failed to toggle bookmark`;
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('[toggleBookmark] Error:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách bookmarks của user hiện tại
   * GET /api/bookmarks/my
   */
  getMyBookmarks: async () => {
    // Gọi vào: /api/bookmarks/my (của Next.js)
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
    }

    try {
      const response = await fetch(`/api/bookmarks/my`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { message: 'Unknown error', raw: await response.text().catch(() => '') };
        }
        const errorMessage = errorData.message || errorData.error || errorData.details || `HTTP ${response.status}: Failed to fetch bookmarks`;
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('[getMyBookmarks] Error:', error);
      throw error;
    }
  },

  // ============================================
  // EMPLOYER CRUD OPERATIONS
  // ============================================

  /**
   * Tạo học bổng mới (Employer only)
   * POST /api/opportunities
   */
  createOpportunity: async (request: CreateOpportunityRequest) => {
    return apiCall<Scholarship>('/api/opportunities', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Lấy analytics data cho employer
   * GET /api/opportunities/analytics
   */
  getEmployerAnalytics: async () => {
    return apiCall<any>('/api/opportunities/analytics');
  },

  /**
   * Lấy danh sách học bổng của employer hiện tại
   * GET /api/opportunities/my
   */
  getMyOpportunities: async () => {
    return apiCall<Scholarship[]>('/api/opportunities/my');
  },

  /**
   * Cập nhật học bổng (Employer only)
   * PUT /api/opportunities/{id}
   */
  updateOpportunity: async (id: string | number, request: CreateOpportunityRequest) => {
    return apiCall<Scholarship>(`/api/opportunities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /**
   * Xóa học bổng (Employer only)
   * DELETE /api/opportunities/{id}
   */
  deleteOpportunity: async (id: string | number) => {
    return apiCall(`/api/opportunities/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Tăng view count khi user xem chi tiết scholarship
   * POST /api/scholarships/{id}/view
   */
  incrementViewCount: async (id: string | number) => {
    try {
      return apiCall<void>(`/api/scholarships/${id}/view`, {
        method: 'POST',
      });
    } catch (error) {
      console.debug('Failed to increment view count:', error);
      // Không throw error - view count là optional feature
    }
  },
  
};

export default scholarshipServiceApi;

