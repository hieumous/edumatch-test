import { Scholarship, ScholarshipType, ScholarshipStatus } from '@/types';

export const mockScholarships: Scholarship[] = [
  {
    id: '1',
    providerId: 'provider1',
    title: 'Full-Stack Development Research Grant',
    description: 'Looking for talented students to join our research team focusing on modern web technologies and distributed systems.',
    type: ScholarshipType.RESEARCH,
    status: ScholarshipStatus.PUBLISHED,
    university: 'Tech University',
    department: 'Computer Science',
    location: 'San Francisco, CA',
    isRemote: true,
    amount: 50000,
    currency: 'USD',
    duration: 12,
    isPaidMonthly: true,
    requirements: {},
    eligibility: {},
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'Database Design'],
    preferredSkills: ['TypeScript', 'Cloud Computing', 'DevOps'],
    minGpa: 3.5,
    applicationDeadline: new Date('2024-12-31'),
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-12-15'),
    tags: ['full-time', 'research', 'technology'],
    website: 'https://techuni.edu/research',
    contactEmail: 'research@techuni.edu',
    isVisible: true,
    viewCount: 125,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    // Legacy fields for compatibility
    stipend: 50000,
    deadline: '2024-12-31',
    field: ['Computer Science', 'Software Engineering'],
    level: 'Graduate',
    studyMode: 'Full-time',
    
    providerName: 'Tech University'
  },
  {
    id: '2',
    providerId: 'provider2',
    title: 'AI/ML Research Fellowship',
    description: 'Join our cutting-edge artificial intelligence research lab working on machine learning applications.',
    type: ScholarshipType.RESEARCH,
    status: ScholarshipStatus.PUBLISHED,
    university: 'AI Institute',
    department: 'Artificial Intelligence',
    location: 'Boston, MA',
    isRemote: false,
    amount: 60000,
    currency: 'USD',
    duration: 24,
    isPaidMonthly: true,
    requirements: {},
    eligibility: {},
    requiredSkills: ['Python', 'Machine Learning', 'Statistics', 'Research'],
    preferredSkills: ['TensorFlow', 'PyTorch', 'Deep Learning'],
    minGpa: 3.7,
    applicationDeadline: new Date('2024-11-30'),
    startDate: new Date('2025-01-01'),
    endDate: new Date('2026-12-31'),
    tags: ['research', 'AI', 'fellowship'],
    website: 'https://aiinstitute.edu/fellowship',
    contactEmail: 'fellowship@aiinstitute.edu',
    isVisible: true,
    viewCount: 89,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    // Legacy fields
    stipend: 50000,
    deadline: '2024-11-30',
    field: ['Artificial Intelligence', 'Machine Learning'],
    level: 'PhD',
    studyMode: 'Full-time',
    
    providerName: 'AI Institute'
  },
  {
    id: '3',
    providerId: 'provider3',
    title: 'Sustainability Engineering Grant',
    description: 'Research opportunity in renewable energy systems and environmental engineering solutions.',
    type: ScholarshipType.RESEARCH,
    status: ScholarshipStatus.PUBLISHED,
    university: 'Green Tech University',
    department: 'Environmental Engineering',
    location: 'Seattle, WA',
    isRemote: true,
    amount: 45000,
    currency: 'USD',
    duration: 18,
    isPaidMonthly: true,
    requirements: {},
    eligibility: {},
    requiredSkills: ['Engineering', 'Environmental Science', 'Data Analysis'],
    preferredSkills: ['Renewable Energy', 'CAD Software', 'Project Management'],
    minGpa: 3.3,
    applicationDeadline: new Date('2025-01-15'),
    startDate: new Date('2025-02-01'),
    endDate: new Date('2026-07-31'),
    tags: ['sustainability', 'engineering', 'environment'],
    website: 'https://greentech.edu/grants',
    contactEmail: 'grants@greentech.edu',
    isVisible: true,
    viewCount: 67,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    // Legacy fields
    stipend: 50000,
    deadline: '2025-01-15',
    field: ['Environmental Engineering', 'Sustainability'],
    level: 'Graduate',
    studyMode: 'Full-time',
    
    providerName: 'Green Tech University'
  }
];

export const mockCountries = [
  'United States',
  'Canada',
  'United Kingdom', 
  'Germany',
  'Australia',
  'Singapore',
  'Netherlands',
  'Sweden',
  'Switzerland'
];

export const mockFields = [
  'Computer Science',
  'Software Engineering',
  'Artificial Intelligence',
  'Machine Learning', 
  'Data Science',
  'Environmental Engineering',
  'Sustainability',
  'Renewable Energy',
  'Biotechnology',
  'Materials Science',
  'Robotics',
  'Cybersecurity'
];

export const mockLevels = [
  'Undergraduate',
  'Graduate', 
  'PhD',
  'Postdoc'
];

export const mockStudyModes = [
  'Full-time',
  'Part-time',
  'Remote'
];
