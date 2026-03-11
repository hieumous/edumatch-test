'use client';

import React, { useEffect } from 'react';
import { ApplicationStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, Heart, TrendingUp, Users, Award, AlertTriangle } from 'lucide-react';
import { useRealTime } from '@/providers/RealTimeProvider';
import { useDashboardStore } from '@/stores/realtimeStore';
import { useApplicationsData, useSavedScholarshipsData, useScholarshipsData } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardStatsProps {
  userRole?: 'applicant' | 'provider' | 'admin';
  applications?: any[];
  savedScholarships?: any[];
}

export function RealTimeDashboardStats({ userRole = 'applicant', applications: propsApplications, savedScholarships: propsSavedScholarships }: DashboardStatsProps) {
  const { socket } = useRealTime();
  const { stats } = useDashboardStore();
  const { t } = useLanguage();
  
  // Get real data - prefer props over AppContext
  const appContextData = useApplicationsData();
  const appContextSaved = useSavedScholarshipsData();
  const { scholarships } = useScholarshipsData();
  
  // Use props if provided, otherwise fall back to AppContext
  const applications = propsApplications || appContextData.applications || [];
  const savedScholarships = propsSavedScholarships || appContextSaved.savedScholarships || [];
  
  console.log('[RealTimeDashboardStats] Data received:', {
    hasProps: !!propsApplications,
    applicationsCount: applications.length,
    savedScholarshipsCount: savedScholarships.length,
    scholarshipsCount: scholarships.length,
    applications: applications.map(a => ({ id: a.id, status: a.status }))
  });

  const getApplicantStats = () => {
    const totalApps = applications.length;
    const inReview = applications.filter(a => a.status === ApplicationStatus.PENDING || a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'VIEWED').length;
    const accepted = applications.filter(a => a.status === 'ACCEPTED').length;
    const saved = savedScholarships.length;
    
    console.log('[RealTimeDashboardStats] Computed stats:', {
      totalApps,
      inReview,
      accepted,
      saved,
      allStatuses: applications.map(a => a.status)
    });
    
    return [
      {
        id: 'applications',
        title: 'Total Applications',
        value: totalApps,
        change: stats?.applicationsChange || '+2',
        icon: FileText,
        color: 'bg-gradient-to-br from-blue-100 to-blue-200',
        iconColor: 'text-blue-700',
        changeColor: 'text-green-600'
      },
      {
        id: 'review',
        title: 'In Review',
        value: inReview,
        change: stats?.reviewChange || '+1',
        icon: Clock,
        color: 'bg-gradient-to-br from-yellow-100 to-amber-200',
        iconColor: 'text-yellow-700',
        changeColor: 'text-green-600'
      },
      {
        id: 'accepted',
        title: 'Accepted',
        value: accepted,
        change: stats?.acceptedChange || '0',
        icon: CheckCircle,
        color: 'bg-gradient-to-br from-green-100 to-emerald-200',
        iconColor: 'text-green-700',
        changeColor: 'text-green-600'
      },
      {
        id: 'saved',
        title: 'Saved',
        value: saved,
        change: stats?.savedChange || '+3',
        icon: Heart,
        color: 'bg-gradient-to-br from-purple-100 to-purple-200',
        iconColor: 'text-purple-700',
        changeColor: 'text-green-600'
      }
    ];
  };

  const getProviderStats = () => [
    {
      id: 'scholarships',
      title: 'Active Scholarships',
      value: stats?.activeScholarships || 5,
      change: stats?.scholarshipsChange || '+1',
      icon: Award,
      color: 'bg-gradient-to-br from-blue-100 to-blue-200',
      iconColor: 'text-blue-700',
      changeColor: 'text-green-600'
    },
    {
      id: 'applications',
      title: 'Total Applications',
      value: stats?.totalApplications || 45,
      change: stats?.applicationsChange || '+7',
      icon: FileText,
      color: 'bg-gradient-to-br from-green-100 to-emerald-200',
      iconColor: 'text-green-700',
      changeColor: 'text-green-600'
    },
    {
      id: 'pending',
      title: 'Pending Review',
      value: stats?.pendingReview || 12,
      change: stats?.pendingChange || '+3',
      icon: Clock,
      color: 'bg-gradient-to-br from-yellow-100 to-amber-200',
      iconColor: 'text-yellow-700',
      changeColor: 'text-orange-600'
    },
    {
      id: 'views',
      title: 'Profile Views',
      value: stats?.profileViews || 234,
      change: stats?.viewsChange || '+18',
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-purple-100 to-purple-200',
      iconColor: 'text-purple-700',
      changeColor: 'text-green-600'
    }
  ];

  const getAdminStats = () => [
    {
      id: 'users',
      title: 'Total Users',
      value: stats?.totalUsers || 1234,
      change: stats?.usersChange || '+23',
      icon: Users,
      color: 'bg-gradient-to-br from-blue-100 to-blue-200',
      iconColor: 'text-blue-700',
      changeColor: 'text-green-600'
    },
    {
      id: 'scholarships',
      title: 'Active Scholarships',
      value: stats?.activeScholarships || 89,
      change: stats?.scholarshipsChange || '+5',
      icon: Award,
      color: 'bg-gradient-to-br from-green-100 to-emerald-200',
      iconColor: 'text-green-700',
      changeColor: 'text-green-600'
    },
    {
      id: 'applications',
      title: 'Total Applications',
      value: stats?.totalApplications || 567,
      change: stats?.applicationsChange || '+34',
      icon: FileText,
      color: 'bg-gradient-to-br from-cyan-100 to-cyan-200',
      iconColor: 'text-cyan-700',
      changeColor: 'text-green-600'
    },
    {
      id: 'issues',
      title: 'Open Issues',
      value: stats?.openIssues || 7,
      change: stats?.issuesChange || '-2',
      icon: AlertTriangle,
      color: 'bg-gradient-to-br from-orange-100 to-orange-200',
      iconColor: 'text-orange-700',
      changeColor: 'text-green-600'
    }
  ];

  const getStatsByRole = () => {
    switch (userRole) {
      case 'provider':
        return getProviderStats();
      case 'admin':
        return getAdminStats();
      default:
        return getApplicantStats();
    }
  };

  const statsData = getStatsByRole();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        
        return (
          <Card key={stat.id} className="border-0 bg-gradient-to-br from-white to-blue-50/30 shadow-lg hover:shadow-2xl transition-all duration-300 h-full relative overflow-hidden">
            <CardContent className="flex items-center p-6">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg mr-4 shadow-sm ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
            
            {/* Real-time indicator */}
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}