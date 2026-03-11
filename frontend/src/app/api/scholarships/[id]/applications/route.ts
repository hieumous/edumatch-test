import { NextRequest, NextResponse } from 'next/server';

// Mock applications data filtered by scholarship ID
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
      id: '1',
      title: 'MIT AI Research Fellowship',
      providerId: 'provider1'
    },
    scholarshipId: '1',
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
      id: '1',
      title: 'MIT AI Research Fellowship',
      providerId: 'provider1'
    },
    scholarshipId: '1',
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
    id: '6',
    applicant: {
      id: 'user6',
      name: 'Emily Rodriguez',
      email: 'emily.r@stanford.edu',
      profile: {
        university: 'Stanford University',
        major: 'Computer Science',
        gpa: 3.9,
        graduationYear: 2025,
        skills: ['Python', 'Deep Learning', 'Neural Networks', 'PyTorch']
      }
    },
    scholarship: {
      id: '1',
      title: 'MIT AI Research Fellowship',
      providerId: 'provider1'
    },
    scholarshipId: '1',
    applicantId: 'user6',
    status: 'UNDER_REVIEW',
    coverLetter: 'I am excited to apply for the MIT AI Research Fellowship. My research focus on deep learning and neural networks aligns perfectly with the fellowship\'s objectives. I have experience developing novel architectures for computer vision and natural language processing tasks.',
    motivation: 'I aim to advance the field of deep learning and develop more efficient and interpretable AI systems.',
    additionalInfo: 'I have interned at Google AI and have contributed to several open-source projects in the AI community.',
    portfolioUrl: 'https://emilyrodriguez-ai.com',
    linkedinUrl: 'https://linkedin.com/in/emilyrodriguez',
    githubUrl: 'https://github.com/emilyrodriguez',
    additionalDocs: ['Resume.pdf', 'Research_Portfolio.pdf', 'Google_Internship_Report.pdf'],
    submittedAt: '2024-09-23T14:30:00Z',
    createdAt: '2024-09-23T14:30:00Z',
    updatedAt: '2024-09-25T11:20:00Z'
  },
  {
    id: '7',
    applicant: {
      id: 'user7',
      name: 'Alex Kim',
      email: 'alex.kim@berkeley.edu',
      profile: {
        university: 'UC Berkeley',
        major: 'Electrical Engineering',
        gpa: 3.6,
        graduationYear: 2024,
        skills: ['Machine Learning', 'Robotics', 'C++', 'ROS']
      }
    },
    scholarship: {
      id: '1',
      title: 'MIT AI Research Fellowship',
      providerId: 'provider1'
    },
    scholarshipId: '1',
    applicantId: 'user7',
    status: 'REJECTED',
    coverLetter: 'I am writing to apply for the MIT AI Research Fellowship with a focus on robotics and autonomous systems. My background in electrical engineering combined with my passion for AI makes me well-suited for interdisciplinary research in this exciting field.',
    motivation: 'I want to develop intelligent robotic systems that can assist humans in various tasks and improve quality of life.',
    additionalInfo: 'I have worked on several robotics projects and have experience with ROS and embedded systems.',
    portfolioUrl: 'https://alexkim-robotics.com',
    linkedinUrl: 'https://linkedin.com/in/alexkim',
    githubUrl: 'https://github.com/alexkim',
    additionalDocs: ['CV.pdf', 'Robotics_Projects.pdf'],
    submittedAt: '2024-09-22T16:45:00Z',
    createdAt: '2024-09-22T16:45:00Z',
    updatedAt: '2024-09-24T10:30:00Z'
  }
];

// Mock applications for scholarship ID 2
const scholarship2Applications = [
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
      id: '2',
      title: 'Google PhD Fellowship',
      providerId: 'provider1'
    },
    scholarshipId: '2',
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
      id: '2',
      title: 'Google PhD Fellowship',
      providerId: 'provider1'
    },
    scholarshipId: '2',
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scholarshipId = params.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Get applications for the specific scholarship
    let applicationsForScholarship: any[] = [];
    
    if (scholarshipId === '1') {
      applicationsForScholarship = mockApplicationsData;
    } else if (scholarshipId === '2') {
      applicationsForScholarship = scholarship2Applications;
    } else {
      // Return empty array for other scholarships
      applicationsForScholarship = [];
    }

    let filteredApplications = [...applicationsForScholarship];

    // Filter by status
    if (status && status !== 'all') {
      filteredApplications = filteredApplications.filter(app => 
        app.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredApplications = filteredApplications.filter(app =>
        app.applicant.name.toLowerCase().includes(searchLower) ||
        app.applicant.email.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredApplications,
      message: `Applications for scholarship ${scholarshipId} retrieved successfully`,
      scholarship: {
        id: scholarshipId,
        totalApplications: applicationsForScholarship.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch applications for scholarship',
        message: 'An error occurred while fetching scholarship applications'
      },
      { status: 500 }
    );
  }
}