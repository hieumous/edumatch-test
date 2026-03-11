/**
 * Matching Service API
 * Tích hợp với matching-service backend để lấy matching scores
 */

// Matching Service URL - via nginx gateway on port 8080
const MATCHING_API_URL = process.env.NEXT_PUBLIC_MATCHING_API_URL || 
  (typeof window !== 'undefined' 
    ? 'http://localhost:8080/api/matching'
    : 'http://matching-service:8000/api/v1/matching');

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
  const url = `${MATCHING_API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    }

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`Matching API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Types
export interface MatchingScore {
  opportunityId: string;
  applicantId: string | null;
  matchingScore: number; // 0-100
}

export interface RecommendationMetadata {
  total: number;
  page: number;
  limit: number;
}

export interface RecommendationResponse {
  metadata: RecommendationMetadata;
  data: MatchingScore[];
}

/**
 * Get scholarship recommendations for current user (applicant)
 */
export const getRecommendationsForApplicant = async (
  applicantId: string,
  limit: number = 10,
  page: number = 1
): Promise<RecommendationResponse> => {
  return apiCall<RecommendationResponse>(
    `/api/v1/recommendations/applicant/${applicantId}?limit=${limit}&page=${page}`
  );
};

/**
 * Get matching score for a specific applicant-opportunity pair
 */
export const getMatchingScore = async (
  applicantId: string,
  opportunityId: string
): Promise<{ overallScore: number; breakdown: any }> => {
  return apiCall(
    `/api/v1/match/score`,
    {
      method: 'POST',
      body: JSON.stringify({
        applicantId,
        opportunityId
      })
    }
  );
};

/**
 * Batch get matching scores for multiple scholarships (optimized)
 */
export const batchGetMatchingScores = async (
  applicantId: string,
  opportunityIds: string[]
): Promise<Map<string, number>> => {
  try {
    console.log('[MatchingService] Fetching batch scores for applicant:', applicantId, 'opportunities:', opportunityIds);
    
    const response = await apiCall<Record<string, number>>(
      `/api/v1/matching/batch-scores`,
      {
        method: 'POST',
        body: JSON.stringify({
          applicantId,
          opportunityIds
        })
      }
    );
    
    console.log('[MatchingService] Batch scores response:', response);
    
    // Convert object to Map
    const scores = new Map<string, number>();
    Object.entries(response).forEach(([opportunityId, score]) => {
      scores.set(opportunityId, score);
    });
    
    console.log('[MatchingService] Converted scores Map:', Array.from(scores.entries()));
    return scores;
  } catch (error) {
    console.error('[MatchingService] Error batch fetching matching scores:', error);
    return new Map();
  }
};

export default {
  getRecommendationsForApplicant,
  getMatchingScore,
  batchGetMatchingScores,
};
