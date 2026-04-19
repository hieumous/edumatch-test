module.exports = [
  {
    title: 'Scholarship A',
    description: 'Valid scholarship',
    applicationDeadline: '2026-12-31',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    scholarshipAmount: 1000,
    studyMode: 'ONLINE',
    level: 'BACHELOR',
    isPublic: true,
    contactEmail: 'test@gmail.com',

    // 🔥 QUAN TRỌNG
    organizationId: 1,
    tags: ['IT', 'AI'],
    requiredSkills: ['Java', 'Spring'],

    expectedStatus: 200
  },

  {
    title: '',
    description: 'Missing title',
    applicationDeadline: '2026-12-31',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    scholarshipAmount: 1000,
    studyMode: 'ONLINE',
    level: 'BACHELOR',
    isPublic: true,
    contactEmail: 'test@gmail.com',
    organizationId: 1,
    tags: ['IT'],
    requiredSkills: ['Java'],

    expectedStatus: 400
  }
];