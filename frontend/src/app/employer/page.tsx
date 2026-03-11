'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Award, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Bell,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Mock data for dashboard
const dashboardData = {
  stats: {
    totalScholarships: 45,
    activeScholarships: 28,
    totalApplications: 342,
    acceptedApplications: 89,
    pendingApplications: 127,
    totalFunding: '$12.5M',
    avgApplicationsPerScholarship: 12.3
  },
  recentApplications: [
    {
      id: '1',
      studentName: 'Sarah Johnson',
      scholarshipTitle: 'Global Excellence Scholarship 2024',
      appliedDate: '2024-03-15',
      status: 'pending',
      score: 95
    },
    {
      id: '2',
      studentName: 'Michael Chen',
      scholarshipTitle: 'STEM Innovation Grant',
      appliedDate: '2024-03-14',
      status: 'under_review',
      score: 88
    },
    {
      id: '3',
      studentName: 'Emma Davis',
      scholarshipTitle: 'Leadership Development Fund',
      appliedDate: '2024-03-13',
      status: 'accepted',
      score: 92
    },
    {
      id: '4',
      studentName: 'David Wilson',
      scholarshipTitle: 'Research Excellence Award',
      appliedDate: '2024-03-12',
      status: 'rejected',
      score: 78
    },
    {
      id: '5',
      studentName: 'Lisa Thompson',
      scholarshipTitle: 'Global Excellence Scholarship 2024',
      appliedDate: '2024-03-11',
      status: 'pending',
      score: 90
    }
  ],
  upcomingDeadlines: [
    {
      id: '1',
      title: 'Global Excellence Scholarship 2024',
      deadline: '2024-04-15',
      applicationsCount: 45,
      daysLeft: 16
    },
    {
      id: '2',
      title: 'STEM Innovation Grant',
      deadline: '2024-04-20',
      applicationsCount: 32,
      daysLeft: 21
    },
    {
      id: '3',
      title: 'Leadership Development Fund',
      deadline: '2024-05-01',
      applicationsCount: 28,
      daysLeft: 32
    }
  ]
};

export default function ProviderDashboard() {
  const router = useRouter();
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'under_review':
        return <Eye className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-blue-50 to-brand-cyan-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Provider Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Welcome back! Here's an overview of your scholarship programs.
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button onClick={() => router.push('/employer/scholarships/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Scholarship
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-brand-blue-100 rounded-lg mr-4">
                <Award className="h-6 w-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboardData.stats.totalScholarships}</p>
                <p className="text-xs text-muted-foreground">Total Scholarships</p>
                <p className="text-xs text-green-600 mt-1">
                  {dashboardData.stats.activeScholarships} active
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mr-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboardData.stats.totalApplications}</p>
                <p className="text-xs text-muted-foreground">Total Applications</p>
                <p className="text-xs text-blue-600 mt-1">
                  {dashboardData.stats.pendingApplications} pending
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboardData.stats.acceptedApplications}</p>
                <p className="text-xs text-muted-foreground">Accepted Applications</p>
                <p className="text-xs text-green-600 mt-1">
                  {Math.round((dashboardData.stats.acceptedApplications / dashboardData.stats.totalApplications) * 100)}% acceptance rate
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mr-4">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboardData.stats.totalFunding}</p>
                <p className="text-xs text-muted-foreground">Total Funding</p>
                <p className="text-xs text-orange-600 mt-1">
                  Distributed across programs
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Applications</CardTitle>
                <Button variant="outline" size="sm" onClick={() => router.push('/employer/applications')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentApplications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{application.studentName}</h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(application.status)}`}
                        >
                          <span className="flex items-center gap-1">
                            {getStatusIcon(application.status)}
                            {application.status.replace('_', ' ')}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {application.scholarshipTitle}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Applied: {application.appliedDate}</span>
                        <span>Score: {application.score}/100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Deadlines</CardTitle>
                <Button variant="outline" size="sm" onClick={() => router.push('/employer/scholarships')}>
                  Manage All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm">{deadline.title}</h4>
                      <Badge variant={deadline.daysLeft <= 7 ? "destructive" : deadline.daysLeft <= 14 ? "default" : "secondary"}>
                        {deadline.daysLeft} days left
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Deadline: {deadline.deadline}
                      </span>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {deadline.applicationsCount} applications
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Application Progress</span>
                        <span>{deadline.applicationsCount} received</span>
                      </div>
                      <Progress value={Math.min((deadline.applicationsCount / 50) * 100, 100)} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-brand-blue-600 mb-2">
                  {dashboardData.stats.avgApplicationsPerScholarship}
                </div>
                <div className="text-sm text-muted-foreground">
                  Average Applications per Scholarship
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {Math.round((dashboardData.stats.acceptedApplications / dashboardData.stats.totalApplications) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Overall Acceptance Rate
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {Math.round((dashboardData.stats.activeScholarships / dashboardData.stats.totalScholarships) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Scholarship Rate
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}