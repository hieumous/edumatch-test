/**
 * Utility functions to map backend DTOs to frontend types
 */

import { Scholarship } from '@/types';
import { getOrganizationName, getOrganizationNames } from './organization-helper';

/**
 * Calculate duration in months from start and end dates
 */
function calculateDuration(startDate?: string, endDate?: string): number {
  if (!startDate || !endDate) return 0;
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    return Math.max(0, months);
  } catch {
    return 0;
  }
}

/**
 * Map backend OpportunityDto to frontend Scholarship type
 * Backend uses description field which contains fullDescription from entity
 * 
 * Note: This function is synchronous and will use cached organization names.
 * For batch processing, use mapPaginatedOpportunities which handles organization fetching.
 */
export function mapOpportunityDtoToScholarship(opportunity: any, organizationName?: string | null): Scholarship {
  const startDate = opportunity.startDate || undefined;
  const endDate = opportunity.endDate || undefined;
  const duration = calculateDuration(startDate, endDate);
  
  // Backend sets description = fullDescription in fromEntity()
  // So we use description as primary, with fallback
  const description = opportunity.description || opportunity.fullDescription || opportunity.title || '';
  
  // Provider name: use provided organizationName, or try from opportunity, or fetch from cache
  // If organizationName is provided (from batch fetch), use it
  // Otherwise, try opportunity.organizationName, then fallback to cached name or generic
  const providerName = organizationName || 
                       opportunity.organizationName || 
                       (opportunity.organizationId ? `Organization ${opportunity.organizationId}` : 'Unknown Provider');
  
  return {
    id: opportunity.id?.toString() || '',
    providerId: opportunity.organizationId?.toString() || opportunity.creatorUserId?.toString() || '',
    providerName: providerName,
    title: opportunity.title || '',
    description: description,
    amount: opportunity.scholarshipAmount ? Number(opportunity.scholarshipAmount) : 0,
    scholarshipAmount: opportunity.scholarshipAmount ? Number(opportunity.scholarshipAmount) : undefined,
    type: opportunity.level || 'UNDERGRADUATE',
    level: opportunity.level || 'UNDERGRADUATE',
    status: opportunity.moderationStatus === 'APPROVED' ? 'PUBLISHED' : 
            opportunity.moderationStatus === 'PENDING' ? 'PENDING' : 
            opportunity.moderationStatus === 'REJECTED' ? 'REJECTED' : 'PUBLISHED',
    moderationStatus: opportunity.moderationStatus || 'PENDING',
    applicationDeadline: opportunity.applicationDeadline ? 
                        (typeof opportunity.applicationDeadline === 'string' ? opportunity.applicationDeadline : 
                         opportunity.applicationDeadline.toString()) : '',
    startDate: startDate,
    endDate: endDate,
    location: opportunity.location || '',
    university: opportunity.university || opportunity.organizationName || providerName,
    department: opportunity.department || '',
    duration: duration,
    isRemote: opportunity.studyMode === 'ONLINE' || opportunity.studyMode === 'HYBRID',
    studyMode: opportunity.studyMode || 'FULL_TIME',
    minGpa: opportunity.minGpa ? Number(opportunity.minGpa) : 0,
    requirements: {
      minGpa: opportunity.minGpa ? Number(opportunity.minGpa) : undefined,
      englishProficiency: undefined,
      documents: []
    },
    requiredSkills: opportunity.requiredSkills || [],
    preferredSkills: opportunity.preferredSkills || [],
    viewCount: opportunity.viewsCnt || 0,
    createdAt: opportunity.createdAt ? new Date(opportunity.createdAt) : (() => {
      console.warn(`[ScholarshipMapper] Scholarship "${opportunity.title}" (ID: ${opportunity.id}) missing createdAt, using fallback`);
      return new Date();
    })(),
    updatedAt: opportunity.updatedAt ? new Date(opportunity.updatedAt) : undefined,
    tags: opportunity.tags || [],
    website: opportunity.website || undefined,
    contactEmail: opportunity.contactEmail || undefined,
    isPublic: opportunity.isPublic !== undefined ? opportunity.isPublic : true,
    matchScore: opportunity.matchScore ? Number(opportunity.matchScore) : undefined,
    currency: 'USD'
  };
}

/**
 * Map paginated response from backend
 * Fetches organization names for all opportunities in the response
 */
export async function mapPaginatedOpportunities(response: any): Promise<{
  scholarships: Scholarship[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}> {
  const content = response.content || response.data || [];
  
  if (!Array.isArray(content) || content.length === 0) {
    return {
      scholarships: [],
      totalElements: response.totalElements || 0,
      totalPages: response.totalPages || 1,
      currentPage: response.number !== undefined ? response.number + 1 : response.page || 1,
      size: response.size || response.limit || 20
    };
  }
  
  // Extract all organization IDs
  const organizationIds = content
    .map((opp: any) => opp.organizationId)
    .filter((id: any) => id != null);
  
  // Batch fetch organization names
  const organizationNames = await getOrganizationNames(organizationIds);
  
  // Map opportunities with organization names
  const scholarships = content.map((opportunity: any) => {
    const orgId = opportunity.organizationId;
    const orgName = orgId ? organizationNames.get(typeof orgId === 'string' ? parseInt(orgId, 10) : orgId) : null;
    return mapOpportunityDtoToScholarship(opportunity, orgName || undefined);
  });

  return {
    scholarships,
    totalElements: response.totalElements || scholarships.length,
    totalPages: response.totalPages || 1,
    currentPage: response.number !== undefined ? response.number + 1 : response.page || 1,
    size: response.size || response.limit || 20
  };
}

/**
 * Map OpportunityDetailDto to Scholarship with matchScore
 * Fetches organization name if not provided
 */
export async function mapOpportunityDetailToScholarship(detail: any): Promise<{
  scholarship: Scholarship;
  matchScore?: number;
}> {
  const opportunity = detail.opportunity || detail;
  
  // Fetch organization name if not provided
  let organizationName: string | null = null;
  if (opportunity.organizationId && !opportunity.organizationName) {
    organizationName = await getOrganizationName(opportunity.organizationId);
  } else {
    organizationName = opportunity.organizationName || null;
  }
  
  const scholarship = mapOpportunityDtoToScholarship(opportunity, organizationName || undefined);
  
  return {
    scholarship,
    matchScore: detail.matchScore ? Number(detail.matchScore) : undefined
  };
}

