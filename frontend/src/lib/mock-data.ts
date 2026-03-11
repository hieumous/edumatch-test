'use client';

import {
  AuthUser,
  UserRole,
  Scholarship,
  Application,
  ApplicationStatus,
  Notification,
  UserProfile,
  Report,
  LoginCredentials,
  RegisterCredentials,
  ApiResponse,
  ScholarshipType,   
  ScholarshipStatus,
  ReportStatus,     
  StudyMode,
  ModerationStatus,
  Transaction,
  AuditLog,
} from '@/types';

// Helper để format Date thành 'YYYY-MM-DD'
function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// =============================================================================
// USERS (Thêm nhiều student)
// =============================================================================
export const USERS: AuthUser[] = [
  {
    id: 'admin-1', email: 'admin@edumatch.com', name: 'System Admin', role: UserRole.ADMIN,
    emailVerified: true, status: 'ACTIVE' as any, subscriptionType: 'FREE' as any,
    createdAt: new Date('2023-01-01'), updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'provider-1', email: 'mit@scholarships.edu', name: 'MIT Research Lab', role: UserRole.EMPLOYER,
    emailVerified: true, status: 'ACTIVE' as any, subscriptionType: 'PREMIUM' as any,
    createdAt: new Date('2023-06-15'), updatedAt: new Date('2025-01-10'),
  },
  {
    id: 'provider-2', email: 'stanford@scholarships.edu', name: 'Stanford University', role: UserRole.EMPLOYER,
    emailVerified: true, status: 'ACTIVE' as any, subscriptionType: 'PREMIUM' as any,
    createdAt: new Date('2023-07-01'), updatedAt: new Date('2025-01-09'),
  },
  {
    id: 'provider-3', email: 'google@scholarships.com', name: 'Google Education', role: UserRole.EMPLOYER,
    emailVerified: true, status: 'ACTIVE' as any, subscriptionType: 'ENTERPRISE' as any,
    createdAt: new Date('2023-08-10'), updatedAt: new Date('2025-01-08'),
  },
  {
    id: 'student-1', email: 'john.doe@student.edu', name: 'John Doe', role: UserRole.USER,
    emailVerified: true, status: 'ACTIVE' as any, subscriptionType: 'FREE' as any,
    createdAt: new Date('2024-09-01'), updatedAt: new Date('2025-01-12'),
  },
  {
    id: 'student-2', email: 'jane.smith@student.edu', name: 'Jane Smith', role: UserRole.USER,
    emailVerified: true, status: 'ACTIVE' as any, subscriptionType: 'PREMIUM' as any,
    createdAt: new Date('2024-08-15'), updatedAt: new Date('2025-01-11'),
  },
  {
    id: 'student-3', email: 'alex.chen@student.edu', name: 'Alex Chen', role: UserRole.USER,
    emailVerified: true, status: 'ACTIVE' as any, subscriptionType: 'FREE' as any,
    createdAt: new Date('2024-10-01'), updatedAt: new Date('2025-01-10'),
  },
  {
    id: 'student-4', email: 'maria.g@student.edu', name: 'Maria Garcia', role: UserRole.USER,
    emailVerified: true, status: 'ACTIVE' as any, subscriptionType: 'FREE' as any,
    createdAt: new Date('2024-11-05'), updatedAt: new Date('2025-01-09'),
  },
];

// =============================================================================
// USER PROFILES (Thêm cho student mới)
// =============================================================================
export const USER_PROFILES: UserProfile[] = [
  {
    id: 'profile-student-1', userId: 'student-1', 
    email: 'john.doe@student.edu', role: UserRole.USER, // <-- THÊM VÀO
    firstName: 'John', lastName: 'Doe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    bio: 'Computer Science student passionate about AI',
    gpa: 3.8, skills: ['Python', 'React', 'TensorFlow'],
    verified: true,
    interests: ['Artificial Intelligence', 'Web Development'],
    languages: ['English', 'Spanish'],
    createdAt: new Date('2024-09-01'), updatedAt: new Date('2025-01-12'),
  },
  {
    id: 'profile-student-2', userId: 'student-2',
    email: 'jane.smith@student.edu', role: UserRole.USER, // <-- THÊM VÀO
    firstName: 'Jane', lastName: 'Smith',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    bio: 'UX Designer & Frontend Developer.',
    gpa: 3.9, skills: ['Figma', 'React', 'TypeScript'],
    verified: true,
    interests: ['Design', 'Art', 'Frontend'],
    languages: ['English', 'French'],
    createdAt: new Date('2024-08-15'), updatedAt: new Date('2025-01-11'),
  },
  {
    id: 'profile-student-3', userId: 'student-3',
    email: 'alex.chen@student.edu', role: UserRole.USER, // <-- THÊM VÀO
    firstName: 'Alex', lastName: 'Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    bio: 'Data Science major.',
    gpa: 3.7, skills: ['Python', 'SQL', 'Tableau'],
    verified: true,
    interests: ['Data Analytics', 'Machine Learning'],
    languages: ['English', 'Mandarin'],
    createdAt: new Date('2024-10-01'), updatedAt: new Date('2025-01-10'),
  },
  {
    id: 'profile-student-4', userId: 'student-4',
    email: 'maria.g@student.edu', role: UserRole.USER, // <-- THÊM VÀO
    firstName: 'Maria', lastName: 'Garcia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    bio: 'Biomedical Engineering student.',
    gpa: 3.85, skills: ['MATLAB', 'Biomedical Devices', 'Research'],
    verified: false,
    interests: ['Biotech', 'Healthcare'],
    languages: ['English', 'Spanish'],
    createdAt: new Date('2024-11-05'), updatedAt: new Date('2025-01-09'),
  }
];

// =============================================================================
// SCHOLARSHIPS (ĐÃ CHUẨN HÓA VÀ THÊM MỚI)
// =============================================================================
export const SCHOLARSHIPS: Scholarship[] = [
  // 1. Published Scholarship
  {
    id: 'scholarship-1',
    providerId: 'provider-1', 
    providerName: 'MIT Research Lab', 
    title: 'MIT AI Research Fellowship 2025',
    description: 'Full scholarship for graduate students pursuing AI and Machine Learning research at MIT',
    amount: 50000,
    type: ScholarshipType.RESEARCH,
    status: ScholarshipStatus.PUBLISHED,
    isRemote: false,

    applicationDeadline: formatDateString(new Date('2025-03-31')),
    location: 'Cambridge, MA, USA',
    university: 'Massachusetts Institute of Technology',
    department: 'CSAIL', 
    duration: 24, 
    minGpa: 3.5,
    requirements: { 
      minGpa: 3.5,
      englishProficiency: 'TOEFL 100+',
      documents: ['CV', 'Transcript', '3 Letters of Recommendation']
    },
    requiredSkills: ['Python', 'TensorFlow', 'Research'],
    preferredSkills: ['PyTorch', 'NLP'], 
    viewCount: 1250, 
    createdAt: new Date('2024-11-01'), 
    tags: ['AI', 'Machine Learning', 'Research'],
    website: 'https://web.mit.edu/fellowships',
    contactEmail: 'fellowships@mit.edu',
    isPublic: true,
    matchScore: 98,
    // Optional legacy fields for backward compatibility
    level: ScholarshipType.RESEARCH,
    studyMode: StudyMode.FULL_TIME,
    moderationStatus: ModerationStatus.APPROVED,
    scholarshipAmount: 50000,
    currency: 'USD',
  },
  // 2. Pending Scholarship (cho admin duyệt)
  {
    id: 'scholarship-2',
    providerId: 'provider-2',
    providerName: 'Stanford University',
    title: 'Stanford Cybersecurity Excellence Program',
    description: 'Comprehensive scholarship for outstanding students in cybersecurity and network security',
    
    amount: 45000,
    type: ScholarshipType.RESEARCH,
    status: ScholarshipStatus.PENDING,
    isRemote: false,

    applicationDeadline: formatDateString(new Date('2025-04-15')),
    location: 'Stanford, CA, USA',
    university: 'Stanford University',
    department: 'Computer Science',
    duration: 24,
    minGpa: 3.6,
    requirements: {
      minGpa: 3.6,
      documents: ['CV', 'Transcript', 'Essay']
    },
    requiredSkills: ['Network Security', 'Cryptography', 'Linux'],
    preferredSkills: ['Penetration Testing'],
    viewCount: 980,
    createdAt: new Date('2024-12-01'),
    tags: ['Cybersecurity', 'Network Security'],
    website: 'https://www.stanford.edu/cybersecurity',
    contactEmail: 'cybersec@stanford.edu',
    isPublic: false,
    matchScore: 85,
    // Optional legacy fields for backward compatibility
    level: ScholarshipType.RESEARCH,
    studyMode: StudyMode.FULL_TIME,
    moderationStatus: ModerationStatus.PENDING,
    scholarshipAmount: 45000,
    currency: 'USD',
  },
  // 3. Draft Scholarship (Provider chưa submit)
  {
    id: 'scholarship-3',
    providerId: 'provider-3',
    providerName: 'Google Education',
    title: 'Google UX Design Scholarship',
    description: 'Supporting the next generation of UX designers with full tuition coverage',

    amount: 30000,
    type: ScholarshipType.UNDERGRADUATE,
    status: ScholarshipStatus.DRAFT,
    isRemote: true,
    
    applicationDeadline: formatDateString(new Date('2025-05-01')),
    location: 'Remote / Online',
    university: 'Google Education',
    department: 'Design',
    duration: 12,
    minGpa: 3.3,
    requirements: {
      documents: ['Portfolio', 'Essay']
    },
    requiredSkills: ['Figma', 'UI/UX Design', 'Prototyping'],
    preferredSkills: ['User Research'],
    viewCount: 1520,
    createdAt: new Date('2024-11-15'),
    tags: ['UX Design', 'UI Design'],
    website: 'https://edu.google.com/scholarships',
    contactEmail: 'scholarships@google.com',
    isPublic: false,
    matchScore: 72,
    // Optional legacy fields for backward compatibility
    level: ScholarshipType.UNDERGRADUATE,
    studyMode: StudyMode.ONLINE,
    moderationStatus: ModerationStatus.PENDING,
    scholarshipAmount: 30000,
    currency: 'USD',
  },
  // 4. Rejected Scholarship (Admin đã từ chối)
  {
    id: 'scholarship-4',
    providerId: 'provider-1',
    providerName: 'MIT Research Lab',
    title: 'Quantum Computing Grant',
    description: 'Funding for PhD candidates.',

    amount: 75000,
    type: ScholarshipType.PHD,
    status: ScholarshipStatus.REJECTED,
    isRemote: false,

    applicationDeadline: formatDateString(new Date('2025-02-01')),
    location: 'Cambridge, MA, USA',
    university: 'Massachusetts Institute of Technology',
    department: 'Physics',
    duration: 36,
    minGpa: 3.8,
    requirements: {
      minGpa: 3.8,
      documents: ['Research Proposal']
    },
    requiredSkills: ['Quantum Physics', 'Python'],
    preferredSkills: [],
    viewCount: 300,
    createdAt: new Date('2024-10-20'),
    tags: ['Quantum', 'Physics'],
    website: 'https://web.mit.edu/fellowships',
    contactEmail: 'fellowships@mit.edu',
    isPublic: false,
    matchScore: 90,
    // Optional legacy fields for backward compatibility
    level: ScholarshipType.PHD,
    studyMode: StudyMode.FULL_TIME,
    moderationStatus: ModerationStatus.REJECTED,
    scholarshipAmount: 75000,
    currency: 'USD',
  },
  // 5. Another Published Scholarship
  {
    id: 'scholarship-5',
    providerId: 'provider-2',
    providerName: 'Stanford University',
    title: 'Bioengineering Innovators Scholarship',
    description: 'For undergraduate students demonstrating innovation in biomedical engineering.',

    amount: 20000,
    type: ScholarshipType.UNDERGRADUATE,
    status: ScholarshipStatus.PUBLISHED,
    isRemote: false,

    applicationDeadline: formatDateString(new Date('2025-04-30')),
    location: 'Stanford, CA, USA',
    university: 'Stanford University',
    department: 'Bioengineering',
    duration: 12,
    minGpa: 3.7,
    requirements: {
      minGpa: 3.7,
      documents: ['CV', 'Transcript', 'Project Proposal']
    },
    requiredSkills: ['MATLAB', 'Biomedical Devices'],
    preferredSkills: ['Research'],
    viewCount: 850,
    createdAt: new Date('2024-11-25'),
    tags: ['Biotech', 'Engineering'],
    website: 'https://www.stanford.edu/bioe',
    contactEmail: 'bioe@stanford.edu',
    isPublic: true,
    matchScore: 88,
    // Optional legacy fields for backward compatibility
    level: ScholarshipType.UNDERGRADUATE,
    studyMode: StudyMode.FULL_TIME,
    moderationStatus: ModerationStatus.APPROVED,
    scholarshipAmount: 20000,
    currency: 'USD',
  },
];

// =============================================================================
// APPLICATIONS (Thêm nhiều đơn)
// =============================================================================
export const APPLICATIONS: Application[] = [
  // Student 1 (John Doe)
  {
    id: 'app-1',
    applicantId: 'student-1',
    scholarshipId: 'scholarship-1',
    status: ApplicationStatus.ACCEPTED,
    additionalDocs: ['doc-cv.pdf', 'doc-transcript.pdf'],
    createdAt: new Date('2024-12-10'),
    updatedAt: new Date('2025-01-08'),
  },
  {
    id: 'app-2',
    applicantId: 'student-1',
    scholarshipId: 'scholarship-2', // Nộp cho học bổng đang PENDING
    status: ApplicationStatus.PENDING,
    additionalDocs: ['doc-cv.pdf', 'doc-essay.pdf'],
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2024-12-15'),
  },

  // Student 2 (Jane Smith)
  {
    id: 'app-3',
    applicantId: 'student-2',
    scholarshipId: 'scholarship-3', // Nộp cho học bổng DRAFT (vô lý, nhưng để test)
    status: ApplicationStatus.PENDING,
    additionalDocs: ['doc-portfolio.url', 'doc-essay.pdf'],
    createdAt: new Date('2024-12-20'),
    updatedAt: new Date('2024-12-20'),
  },
  {
    id: 'app-4',
    applicantId: 'student-2',
    scholarshipId: 'scholarship-1',
    status: ApplicationStatus.REJECTED,
    additionalDocs: ['doc-portfolio.url'],
    createdAt: new Date('2024-12-11'),
    updatedAt: new Date('2025-01-05'),
  },

  // Student 3 (Alex Chen)
  {
    id: 'app-5',
    applicantId: 'student-3',
    scholarshipId: 'scholarship-1',
    status: ApplicationStatus.PENDING,
    additionalDocs: ['doc-cv-alex.pdf', 'doc-transcript-alex.pdf'],
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-05'),
  },
  {
    id: 'app-6',
    applicantId: 'student-3',
    scholarshipId: 'scholarship-2',
    status: ApplicationStatus.PENDING,
    additionalDocs: ['doc-cv-alex.pdf', 'doc-essay-alex.pdf'],
    createdAt: new Date('2025-01-06'),
    updatedAt: new Date('2025-01-06'),
  },

  // Student 4 (Maria Garcia)
  {
    id: 'app-7',
    applicantId: 'student-4',
    scholarshipId: 'scholarship-5', // Nộp cho học bổng Bioengineering
    status: ApplicationStatus.ACCEPTED,
    additionalDocs: ['doc-cv-maria.pdf', 'doc-project-maria.pdf'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: 'app-8',
    applicantId: 'student-4',
    scholarshipId: 'scholarship-1',
    status: ApplicationStatus.REJECTED,
    additionalDocs: ['doc-cv-maria.pdf'],
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-09'),
  },
];

// =============================================================================
// REPORTS (Bổ sung theo yêu cầu)
// =============================================================================
export const REPORTS: Report[] = [
  {
    id: 'report-1',
    targetId: 'scholarship-2', // Báo cáo học bổng 'Stanford Cybersecurity'
    targetType: 'SCHOLARSHIP',
    reporterId: 'student-1',
    reporterName: 'John Doe',
    reporterEmail: 'john.doe@student.edu',
    priority: 'HIGH',
    category: 'Misleading Information',
    description: 'The scholarship amount listed is incorrect. The official website says $40,000, not $45,000.',
    status: ReportStatus.PENDING,
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
  {
    id: 'report-2',
    targetId: 'scholarship-1', // Báo cáo học bổng 'MIT AI'
    targetType: 'SCHOLARSHIP',
    reporterId: 'student-2',
    reporterName: 'Jane Smith',
    reporterEmail: 'jane.smith@student.edu',
    priority: 'MEDIUM',
    category: 'Broken Link',
    description: 'The "website" link (https://web.mit.edu/fellowships) is dead, it leads to a 404 page.',
    status: ReportStatus.PENDING,
    createdAt: new Date('2025-01-11'),
    updatedAt: new Date('2025-01-11'),
  },
  {
    id: 'report-3',
    targetId: 'scholarship-4', // Báo cáo học bổng 'Quantum Computing'
    targetType: 'SCHOLARSHIP',
    reporterId: 'student-3',
    reporterName: 'Alex Chen',
    reporterEmail: 'alex.chen@student.edu',
    priority: 'CRITICAL',
    category: 'Spam',
    description: 'This provider asked me to pay an application fee via wire transfer, which seems like a scam.',
    status: ReportStatus.RESOLVED,
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2024-12-16'),
  },
];


// =============================================================================
// NOTIFICATIONS (Thêm cho các đơn mới)
// =============================================================================
export const NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'student-1',
    title: 'Application Update: Accepted!',
    message: 'Congratulations! Your application for "MIT AI Research Fellowship 2025" has been accepted.',
    type: 'SUCCESS',
    read: false,
    createdAt: new Date('2025-01-08'),
  },
  {
    id: 'notif-2',
    userId: 'student-2',
    title: 'Application Update: Rejected',
    message: 'We regret to inform you that your application for "MIT AI Research Fellowship 2025" was not successful.',
    type: 'ERROR',
    read: true,
    createdAt: new Date('2025-01-05'),
  },
  {
    id: 'notif-3',
    userId: 'student-4',
    title: 'Application Update: Accepted!',
    message: 'Congratulations! Your application for "Bioengineering Innovators Scholarship" has been accepted.',
    type: 'SUCCESS',
    read: false,
    createdAt: new Date('2025-01-10'),
  },
  {
    id: 'notif-4',
    userId: 'student-1',
    title: 'Application Received',
    message: 'Your application for "Stanford Cybersecurity Excellence Program" has been received.',
    type: 'INFO',
    read: true,
    createdAt: new Date('2024-12-15'),
  }
];

// =============================================================================
// MOCK API IMPLEMENTATION
// =============================================================================

// Simulate network delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const shouldUseMockApi = true;

// Helper helper
let currentMockUser: AuthUser | null = USERS.find(u => u.id === 'admin-1') || null; // Đổi user mặc định thành admin

export const mockApi = {
  auth: {
    async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: AuthUser; token: string }>> {
      await delay(500);
      const user = USERS.find(u => u.email === credentials.email);
      if (user) {
        currentMockUser = user;
        return { success: true, data: { user, token: `mock-token-${user.id}` } };
      }
      return { success: false, error: 'Invalid credentials' };
    },
    async register(credentials: RegisterCredentials): Promise<ApiResponse<{ user: AuthUser; token: string }>> {
      await delay(500);
      return { success: false, error: 'Registration not implemented in mock' };
    },
    async logout(): Promise<ApiResponse> {
      await delay(300);
      currentMockUser = null;
      return { success: true };
    },
    async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
      await delay(200);
      if (currentMockUser) return { success: true, data: currentMockUser };
      return { success: false, error: 'Not authenticated' };
    },
  },

  profile: {
    async getById(userId: string): Promise<ApiResponse<UserProfile>> {
      await delay(300);
      const profile = USER_PROFILES.find(p => p.userId === userId);
      return profile ? { success: true, data: profile } : { success: false, error: 'Not found' };
    },
    async update(userId: string, data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
        await delay(300);
        return { success: false, error: "Not implemented" }
    }
  },

  scholarships: {
    async getAll(filters?: any): Promise<ApiResponse<Scholarship[]>> {
      await delay(300);
      let data = [...SCHOLARSHIPS];
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        data = data.filter(i => i.title.toLowerCase().includes(s));
      }
      // Trả về tất cả học bổng cho admin
      if (currentMockUser?.role === UserRole.ADMIN) {
        return { success: true, data };
      }
      // Chỉ trả về học bổng published cho student/guest
      return { success: true, data: data.filter(s => s.status === ScholarshipStatus.PUBLISHED) };
    },

    async getById(id: string): Promise<ApiResponse<Scholarship>> {
      await delay(300);
      const item = SCHOLARSHIPS.find(s => s.id === id);
      if (!item) return { success: false, error: 'Not found' };
      // Admin/Provider có thể xem mọi trạng thái, student chỉ xem được published
      if (currentMockUser?.role === UserRole.USER && item.status !== ScholarshipStatus.PUBLISHED) {
         return { success: false, error: 'Not found' };
      }
      return { success: true, data: item };
    },

    async getByProvider(providerId: string): Promise<ApiResponse<Scholarship[]>> {
      await delay(300);
      return { success: true, data: SCHOLARSHIPS.filter(s => s.providerId === providerId) };
    },

    async create(data: Partial<Scholarship>): Promise<ApiResponse<Scholarship>> {
        return { success: false, error: "Not implemented" }
    },
    async update(id: string, data: Partial<Scholarship>): Promise<ApiResponse<Scholarship>> {
        return { success: false, error: "Not implemented" }
    }
  },

  applications: {
    async getByUser(userId: string): Promise<ApiResponse<Application[]>> {
      await delay(300);
      return { success: true, data: APPLICATIONS.filter(a => a.applicantId === userId) };
    },
    async getByScholarship(id: string): Promise<ApiResponse<Application[]>> {
        return { success: true, data: APPLICATIONS.filter(a => a.scholarshipId === id) };
    },
    async submit(data: any): Promise<ApiResponse<Application>> {
        return { success: false, error: "Not implemented" }
    },
    async updateStatus(id: string, status: ApplicationStatus): Promise<ApiResponse<Application>> {
        return { success: false, error: "Not implemented" }
    },
    async checkApplicationStatus(scholarshipId: string, userId: string): Promise<ApiResponse<{ hasApplied: boolean; application?: Application }>> {
      await delay(200);
      const app = APPLICATIONS.find(a => a.scholarshipId === scholarshipId && a.applicantId === userId);
      return { success: true, data: { hasApplied: !!app, application: app } };
    }
  },

  savedScholarships: {
    async getByUser(userId: string): Promise<ApiResponse<string[]>> {
      await delay(200);
      // Giả sử student 1 đã lưu scholarship-2 và 5
      if (userId === 'student-1') {
        return { success: true, data: ['scholarship-2', 'scholarship-5'] };
      }
      return { success: true, data: [] };
    },
    async toggle(userId: string, scholarshipId: string): Promise<ApiResponse<{ saved: boolean }>> {
      await delay(200);
      // Giả lập toggle
      return { success: true, data: { saved: Math.random() > 0.5 } };
    }
  },

  notifications: {
    async getByUser(userId: string): Promise<ApiResponse<Notification[]>> {
      await delay(200);
      return { success: true, data: NOTIFICATIONS.filter(n => n.userId === userId) };
    },
    async markAsRead(id: string): Promise<ApiResponse> { return { success: true } },
    async markAllAsRead(userId: string): Promise<ApiResponse> { return { success: true } }
  },

  analytics: {
    async getDashboardStats(providerId: string): Promise<ApiResponse<any>> {
      return { success: true, data: {} };
    }
  }
};

// =============================================================================
// STANDALONE FUNCTIONS (Bổ sung cho admin panel)
// (Các component của bạn đang import trực tiếp, không qua mockApi)
// =============================================================================

/**
 * Lấy thông tin user bằng ID.
 */
export function getUserById(id: string): AuthUser | undefined {
  return USERS.find(u => u.id === id);
}

/**
 * Lấy tất cả đơn nộp cho một học bổng cụ thể.
 */
export function getApplicationsByScholarship(scholarshipId: string): Application[] {
  return APPLICATIONS.filter(app => app.scholarshipId === scholarshipId);
}

/**
 * Lấy thống kê tổng quan cho trang admin analytics.
 */
export function getAdminStats() {
  const totalUsers = USERS.length;
  const totalStudents = USERS.filter(u => u.role === UserRole.USER).length;
  const totalProviders = USERS.filter(u => u.role === UserRole.EMPLOYER).length;
  const totalScholarships = SCHOLARSHIPS.length;
  const totalApplications = APPLICATIONS.length;
  
  // Lấy giá trị mock từ component analytics của bạn
  const totalRevenue = 48320; 

  return {
    totalUsers,
    totalStudents,
    totalProviders,
    totalScholarships,
    totalApplications,
    totalRevenue
  };
}

// =============================================================================
// ADDITIONAL MOCK DATA FOR ADMIN PAGES
// =============================================================================

/**
 * Mock Transactions data
 */
export const TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-1',
    userId: 'student-1',
    amount: 99.99,
    status: 'COMPLETED',
    type: 'SUBSCRIPTION',
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'txn-2',
    userId: 'student-2',
    amount: 199.99,
    status: 'COMPLETED',
    type: 'SUBSCRIPTION',
    createdAt: new Date('2025-01-05'),
  },
  {
    id: 'txn-3',
    userId: 'provider-1',
    amount: 299.99,
    status: 'COMPLETED',
    type: 'SUBSCRIPTION',
    createdAt: new Date('2025-01-10'),
  },
  {
    id: 'txn-4',
    userId: 'student-3',
    amount: 49.99,
    status: 'PENDING',
    type: 'APPLICATION_FEE',
    createdAt: new Date('2025-01-12'),
  },
];

/**
 * Mock Audit Logs data
 */
export const AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    adminId: 'admin-1',
    action: 'APPROVE_SCHOLARSHIP',
    targetId: 'scholarship-1',
    targetType: 'SCHOLARSHIP',
    reason: 'Meets all requirements',
    createdAt: new Date('2024-11-01'),
  },
  {
    id: 'log-2',
    adminId: 'admin-1',
    action: 'REJECT_SCHOLARSHIP',
    targetId: 'scholarship-4',
    targetType: 'SCHOLARSHIP',
    reason: 'Incomplete documentation',
    createdAt: new Date('2024-10-20'),
  },
  {
    id: 'log-3',
    adminId: 'admin-1',
    action: 'SUSPEND_USER',
    targetId: 'student-4',
    targetType: 'USER',
    reason: 'Violation of terms of service',
    createdAt: new Date('2025-01-05'),
  },
];

/**
 * Get user profile by userId
 */
export function getUserProfile(userId: string): UserProfile | undefined {
  return USER_PROFILES.find(p => p.userId === userId);
}

/**
 * Get applications by student (applicant) ID
 */
export function getApplicationsByStudent(studentId: string): Application[] {
  return APPLICATIONS.filter(app => app.applicantId === studentId);
}

// =============================================================================
// LEGACY EXPORTS (Giữ để tương thích)
// =============================================================================
export const mockUsers = USERS;
export const mockUserProfiles = USER_PROFILES;
export const mockScholarships = SCHOLARSHIPS;
export const mockApplications = APPLICATIONS;
export const mockNotifications = NOTIFICATIONS;