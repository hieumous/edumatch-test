'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, XCircle, AlertCircle, Calendar, Building2, ArrowRight } from 'lucide-react';
import { useApplicationStore } from '@/stores/realtimeStore';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useApplicationsData, useScholarshipsData } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Carousel } from '@/components/Carousel';

export function RealTimeApplicationStatus({ applications: propsApplications, scholarships: propsScholarships }: { applications?: any[], scholarships?: any[] } = {}) {
  const { t } = useLanguage();
  const { applicationStatuses } = useApplicationStore();
  
  // Get real data - prefer props over AppContext
  const appContextData = useApplicationsData();
  const appContextScholarships = useScholarshipsData();
  
  // Use props if provided, otherwise fall back to AppContext
  const applications = propsApplications || appContextData.applications || [];
  const scholarships = propsScholarships || appContextScholarships.scholarships || [];
  
  console.log('[RealTimeApplicationStatus] Data received:', {
    hasProps: !!propsApplications,
    applicationsCount: applications.length,
    scholarshipsCount: scholarships.length,
    applications: applications.map(a => ({ id: a.id, status: a.status, scholarshipId: a.scholarshipId }))
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'UNDER_REVIEW':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'SUBMITTED':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'ACCEPTED':
        return 'default'; // Green
      case 'REJECTED':
        return 'destructive';
      case 'UNDER_REVIEW':
        return 'secondary';
      case 'SUBMITTED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return t('applicationStatus.accepted');
      case 'REJECTED':
        return t('applicationStatus.rejected');
      case 'UNDER_REVIEW':
        return t('applicationStatus.underReview');
      case 'SUBMITTED':
        return t('applicationStatus.submitted');
      default:
        return t('applicationStatus.unknown');
    }
  };

  // Use real applications data - sort by date (newest first) and prefer opportunityTitle from ApplicationDto
  console.log('[RealTimeApplicationStatus] Processing applications:', applications.length);
  
  const sortedApplications = [...applications].sort((a, b) => {
    // Parse dates properly
    const getDateA = () => {
      if (a.submittedAt) {
        const date = a.submittedAt instanceof Date ? a.submittedAt : new Date(a.submittedAt);
        return isNaN(date.getTime()) ? 0 : date.getTime();
      }
      if (a.createdAt) {
        const date = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        return isNaN(date.getTime()) ? 0 : date.getTime();
      }
      return 0;
    };
    const getDateB = () => {
      if (b.submittedAt) {
        const date = b.submittedAt instanceof Date ? b.submittedAt : new Date(b.submittedAt);
        return isNaN(date.getTime()) ? 0 : date.getTime();
      }
      if (b.createdAt) {
        const date = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return isNaN(date.getTime()) ? 0 : date.getTime();
      }
      return 0;
    };
    const dateA = getDateA();
    const dateB = getDateB();
    // Descending order: newest first (larger timestamp comes first)
    return dateB - dateA;
  });
  
  console.log('[RealTimeApplicationStatus] Sorted applications:', sortedApplications.length, sortedApplications.map(a => ({ 
    id: a.id, 
    title: a.opportunityTitle,
    submittedAt: a.submittedAt,
    createdAt: a.createdAt
  })));
  
  // Log first 3 to verify newest are first
  if (sortedApplications.length > 0) {
    console.log('[RealTimeApplicationStatus] First 3 applications (should be newest):', 
      sortedApplications.slice(0, 3).map(a => ({
        id: a.id,
        title: a.opportunityTitle,
        submittedAt: a.submittedAt,
        createdAt: a.createdAt
      }))
    );
  }
  
  const displayApplications = sortedApplications.slice(0, 3).map(app => {
    // Use opportunityTitle from Application object (from backend ApplicationDto)
    // Fallback to finding in scholarships array if not available
    const scholarshipTitle = app.opportunityTitle || 
                            scholarships.find(s => s.id === app.scholarshipId)?.title || 
                            'Unknown Scholarship';
    
    // Provider name from scholarship if available, otherwise use default
    const scholarship = scholarships.find(s => s.id === app.scholarshipId);
    const provider = scholarship?.providerName || 'Unknown Provider';
    
    return {
      id: app.id,
      scholarshipId: app.scholarshipId,
      scholarshipTitle: scholarshipTitle,
      provider: provider,
      status: app.status,
      appliedDate: app.submittedAt 
        ? (app.submittedAt instanceof Date ? app.submittedAt : new Date(app.submittedAt))
        : (app.createdAt || null),
      deadline: scholarship?.applicationDeadline ? formatDate(scholarship.applicationDeadline) : null,
      updatedAt: app.updatedAt ? formatDate(app.updatedAt) : null
    };
  });
  
  console.log('[RealTimeApplicationStatus] Display applications:', displayApplications.length, displayApplications);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('dashboard.recentApplications.title')}</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Real-time updates"></div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/user/applications">
              {t('dashboard.recentApplications.viewAll')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Carousel
          items={sortedApplications}
          itemsPerPage={3}
          renderItem={(application: any, index: number) => {
            const scholarshipTitle = application.opportunityTitle || 
                                    scholarships.find(s => s.id === application.scholarshipId)?.title || 
                                    'Unknown Scholarship';
            const scholarship = scholarships.find(s => s.id === application.scholarshipId);
            const provider = scholarship?.providerName || 'Unknown Provider';
            const appliedDate = application.submittedAt 
              ? (application.submittedAt instanceof Date 
                 ? application.submittedAt 
                 : new Date(application.submittedAt))
              : (application.createdAt || null);
            
            return (
              <div 
                key={application.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {scholarshipTitle}
                  </h4>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Building2 className="h-4 w-4 mr-1" />
                    {provider}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    {t('dashboard.recentApplications.applied')}: {appliedDate 
                      ? formatDate(appliedDate)
                      : (application.updatedAt ? formatDate(application.updatedAt) : 'N/A')}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={getStatusVariant(application.status)} className="flex items-center space-x-1">
                    {getStatusIcon(application.status)}
                    <span>{getStatusLabel(application.status)}</span>
                  </Badge>
                </div>
              </div>
            );
          }}
          emptyMessage={
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('dashboard.recentApplications.noApplications')}</p>
              <Button asChild className="mt-4">
                <Link href="/user/scholarships">{t('dashboard.recentApplications.browse')}</Link>
              </Button>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}