import { NextRequest, NextResponse } from 'next/server';

// Mock applications data for provider
const mockApplicationsData = [
  {
    id: '1',
    applicant: {
      id: 'user1',
      name: 'John Doe',
      email: 'john.doe@mit.edu',
      profile: {
        university: 'MIT',
        major: 'Computer Science',
        gpa: 3.8,
        graduationYear: 2024,
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'Research']
      }
    },
    scholarship: {
      id: 'sch1',
      title: 'MIT AI Research Fellowship',
      providerId: 'provider1'
    },
    scholarshipId: 'sch1',
    applicantId: 'user1',
    status: 'SUBMITTED',
    coverLetter: 'Dear Selection Committee, I am writing to express my strong interest in the MIT AI Research Fellowship. With my background in computer science and passion for artificial intelligence, I believe I can contribute significantly to cutting-edge research in this field. My experience with machine learning frameworks and my previous research work make me an ideal candidate for this position.',
    motivation: 'I am passionate about AI research and want to contribute to breakthrough technologies that can benefit humanity.',
    additionalInfo: 'I have published 2 papers in top-tier conferences and have 3 years of research experience.',
    portfolioUrl: 'https://johndoe-portfolio.com',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    githubUrl: 'https://github.com/johndoe',
    additionalDocs: ['CV.pdf', 'Transcript.pdf', 'Recommendation_Letter.pdf'],
    submittedAt: '2024-09-28T10:00:00Z',
    createdAt: '2024-09-28T10:00:00Z',
    updatedAt: '2024-09-28T10:00:00Z'
  },
  {
    id: '2',
    applicant: {
      id: 'user2',
      name: 'Jane Smith',
      email: 'jane.smith@stanford.edu',
      profile: {
        university: 'Stanford University',
        major: 'Data Science',
        gpa: 3.9,
        graduationYear: 2025,
        skills: ['Python', 'NLP', 'Deep Learning', 'PyTorch']
      }
    },
    scholarship: {
      id: 'sch2',
      title: 'Google PhD Fellowship',
      providerId: 'provider1'
    },
    scholarshipId: 'sch2',
    applicantId: 'user2',
    status: 'UNDER_REVIEW',
    coverLetter: 'I am excited to apply for the Google PhD Fellowship. My research in natural language processing aligns perfectly with Google\'s mission to organize the world\'s information and make it universally accessible. I have developed novel algorithms for text understanding that have shown promising results.',
    motivation: 'My goal is to advance the field of NLP and develop more human-like AI systems.',
    additionalInfo: 'I have internship experience at top tech companies and strong publication record.',
    portfolioUrl: 'https://janesmith-research.com',
    linkedinUrl: 'https://linkedin.com/in/janesmith',
    githubUrl: 'https://github.com/janesmith',
    additionalDocs: ['Resume.pdf', 'Portfolio.pdf', 'Research_Proposal.pdf'],
    submittedAt: '2024-09-27T14:30:00Z',
    createdAt: '2024-09-27T14:30:00Z',
    updatedAt: '2024-09-27T14:30:00Z'
  },
  {
    id: '3',
    applicant: {
      id: 'user3',
      name: 'Mike Johnson',
      email: 'mike.j@harvard.edu',
      profile: {
        university: 'Harvard University',
        major: 'Mathematics',
        gpa: 3.7,
        graduationYear: 2024,
        skills: ['Mathematics', 'Statistics', 'R', 'MATLAB']
      }
    },
    scholarship: {
      id: 'sch1',
      title: 'MIT AI Research Fellowship',
      providerId: 'provider1'
    },
    scholarshipId: 'sch1',
    applicantId: 'user3',
    status: 'ACCEPTED',
    coverLetter: 'Thank you for considering my application for this prestigious fellowship. My mathematical background provides a strong foundation for understanding the theoretical aspects of artificial intelligence, while my practical experience with statistical modeling gives me the tools to tackle real-world problems.',
    motivation: 'I want to bridge the gap between theoretical mathematics and practical AI applications.',
    additionalInfo: 'I have a strong background in mathematical modeling and statistical analysis.',
    portfolioUrl: null,
    linkedinUrl: 'https://linkedin.com/in/mikejohnson',
    githubUrl: null,
    additionalDocs: ['CV.pdf', 'Research_Papers.pdf'],
    submittedAt: '2024-09-26T09:15:00Z',
    createdAt: '2024-09-26T09:15:00Z',
    updatedAt: '2024-09-28T16:00:00Z'
  },
  {
    id: '4',
    applicant: {
      id: 'user4',
      name: 'Sarah Wilson',
      email: 'sarah.w@berkeley.edu',
      profile: {
        university: 'UC Berkeley',
        major: 'Engineering',
        gpa: 3.5,
        graduationYear: 2025,
        skills: ['Engineering', 'CAD', 'Project Management']
      }
    },
    scholarship: {
      id: 'sch3',
      title: 'Research Grant Program',
      providerId: 'provider1'
    },
    scholarshipId: 'sch3',
    applicantId: 'user4',
    status: 'REJECTED',
    coverLetter: 'I am writing to apply for the Research Grant Program. My engineering background and project management experience make me well-suited for leading research initiatives. I have successfully managed multiple engineering projects and understand the complexities involved in research coordination.',
    motivation: 'I am passionate about applying engineering principles to solve complex research problems.',
    additionalInfo: 'I have managed several successful engineering projects during my studies.',
    portfolioUrl: null,
    linkedinUrl: null,
    githubUrl: null,
    additionalDocs: ['Resume.pdf', 'Transcript.pdf'],
    submittedAt: '2024-09-25T11:45:00Z',
    createdAt: '2024-09-25T11:45:00Z',
    updatedAt: '2024-09-27T10:30:00Z'
  },
  {
    id: '5',
    applicant: {
      id: 'user5',
      name: 'David Chen',
      email: 'david.chen@caltech.edu',
      profile: {
        university: 'Caltech',
        major: 'Physics',
        gpa: 3.95,
        graduationYear: 2024,
        skills: ['Physics', 'Python', 'Quantum Computing', 'Research']
      }
    },
    scholarship: {
      id: 'sch2',
      title: 'Google PhD Fellowship',
      providerId: 'provider1'
    },
    scholarshipId: 'sch2',
    applicantId: 'user5',
    status: 'SUBMITTED',
    coverLetter: 'As a physics graduate with strong computational skills, I believe I would be an excellent fit for the Google PhD Fellowship. My research experience in quantum computing and my programming abilities uniquely position me to contribute to Google\'s advanced research initiatives.',
    motivation: 'I want to explore the intersection of quantum physics and computer science to develop next-generation computing technologies.',
    additionalInfo: 'I have research experience in quantum algorithms and have worked on several quantum computing projects.',
    portfolioUrl: 'https://davidchen-quantum.com',
    linkedinUrl: 'https://linkedin.com/in/davidchen',
    githubUrl: 'https://github.com/davidchen',
    additionalDocs: ['CV.pdf', 'Publications.pdf', 'Recommendations.pdf'],
    submittedAt: '2024-09-24T16:20:00Z',
    createdAt: '2024-09-24T16:20:00Z',
    updatedAt: '2024-09-24T16:20:00Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const scholarshipId = searchParams.get('scholarshipId');
    const search = searchParams.get('search');

    let filteredApplications = [...mockApplicationsData];

    // Filter by status
    if (status && status !== 'all') {
      filteredApplications = filteredApplications.filter(app => 
        app.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Filter by scholarship
    if (scholarshipId && scholarshipId !== 'all') {
      filteredApplications = filteredApplications.filter(app => 
        app.scholarshipId === scholarshipId
      );
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredApplications = filteredApplications.filter(app =>
        app.applicant.name.toLowerCase().includes(searchLower) ||
        app.applicant.email.toLowerCase().includes(searchLower) ||
        app.scholarship.title.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredApplications,
      message: 'Applications retrieved successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch applications',
        message: 'An error occurred while fetching applications'
      },
      { status: 500 }
    );
  }
}