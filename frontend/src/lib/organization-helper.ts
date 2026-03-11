/**
 * Helper functions to fetch organization information
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8080';

// Cache for organization names to avoid repeated API calls
const organizationCache = new Map<number, string>();

/**
 * Fetch organization name by ID
 * Uses cache to avoid repeated API calls
 */
export async function getOrganizationName(organizationId: number | string | null | undefined): Promise<string | null> {
  if (!organizationId) return null;
  
  const id = typeof organizationId === 'string' ? parseInt(organizationId, 10) : organizationId;
  if (isNaN(id)) return null;
  
  // Check cache first
  if (organizationCache.has(id)) {
    return organizationCache.get(id) || null;
  }
  
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/organizations/${id}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      const name = data.name || data.organizationName || null;
      
      // Cache the result
      if (name) {
        organizationCache.set(id, name);
      }
      
      return name;
    } else {
      console.warn(`Failed to fetch organization ${id}: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching organization ${id}:`, error);
    return null;
  }
}

/**
 * Batch fetch organization names for multiple IDs
 * Returns a map of organizationId -> organizationName
 */
export async function getOrganizationNames(organizationIds: (number | string | null | undefined)[]): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  const idsToFetch: number[] = [];
  
  // Check cache and collect IDs that need fetching
  for (const orgId of organizationIds) {
    if (!orgId) continue;
    
    const id = typeof orgId === 'string' ? parseInt(orgId, 10) : orgId;
    if (isNaN(id)) continue;
    
    if (organizationCache.has(id)) {
      const name = organizationCache.get(id);
      if (name) {
        result.set(id, name);
      }
    } else {
      idsToFetch.push(id);
    }
  }
  
  // Fetch missing organizations in parallel
  if (idsToFetch.length > 0) {
    const fetchPromises = idsToFetch.map(id => 
      getOrganizationName(id).then(name => ({ id, name }))
    );
    
    const results = await Promise.all(fetchPromises);
    for (const { id, name } of results) {
      if (name) {
        result.set(id, name);
      }
    }
  }
  
  return result;
}

/**
 * Clear the organization cache (useful for testing or when organizations are updated)
 */
export function clearOrganizationCache() {
  organizationCache.clear();
}

