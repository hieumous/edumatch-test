'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  GraduationCap,
  Award,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { useApplicationsData, useScholarshipsData } from '@/contexts/AppContext';
import { USERS } from '@/lib/mock-data';
import { USER_PROFILES } from '@/lib/mock-data';
import { ApplicationStatus, ScholarshipStatus } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { scholarshipServiceApi } from '@/services/scholarship.service';

export default function ProviderAnalyticsPage() {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState('last-6-months');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get fallback data from AppContext (for error fallback)
  const { applications } = useApplicationsData();
  const { scholarships } = useScholarshipsData();

  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await scholarshipServiceApi.getEmployerAnalytics();
        setAnalyticsData(data);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  // Fallback calculation if API data not available
  const fallbackAnalyticsData = useMemo(() => {
    const acceptedApplications = applications.filter(app => app.status === ApplicationStatus.ACCEPTED).length;
    const rejectedApplications = applications.filter(app => app.status === ApplicationStatus.REJECTED).length;
    const pendingApplications = applications.filter(app => 
      app.status === ApplicationStatus.PENDING
    ).length;
    
    const activeScholarships = scholarships.filter(s => s.status === ScholarshipStatus.PUBLISHED).length;
    const acceptanceRate = applications.length > 0 ? (acceptedApplications / applications.length * 100) : 0;
    const averageApplicationsPerScholarship = scholarships.length > 0 ? applications.length / scholarships.length : 0;

    // Calculate scholarship performance
    const scholarshipPerformance = scholarships.map(scholarship => {
      const scholarshipApplications = applications.filter(app => app.scholarshipId === scholarship.id);
      const accepted = scholarshipApplications.filter(app => app.status === ApplicationStatus.ACCEPTED).length;
      const rejected = scholarshipApplications.filter(app => app.status === ApplicationStatus.REJECTED).length;
      const pending = scholarshipApplications.filter(app => 
        app.status === ApplicationStatus.PENDING
      ).length;
      
      return {
        id: scholarship.id,
        title: scholarship.title,
        applications: scholarshipApplications.length,
        accepted,
        rejected,
        pending,
        acceptanceRate: scholarshipApplications.length > 0 ? Number((accepted / scholarshipApplications.length * 100).toFixed(1)) : 0,
        averageRating: 4.0 + Math.random() * 1 // Mock rating for now
      };
    });

    // Calculate demographics
    const universityStats = new Map();
    const majorStats = new Map();
    
    applications.forEach(app => {
      const profile = USER_PROFILES.find((p: any) => p.userId === app.applicantId);
      // UserProfile does not have university/major, fallback to 'N/A'
      universityStats.set('N/A', (universityStats.get('N/A') || 0) + 1);
      majorStats.set('N/A', (majorStats.get('N/A') || 0) + 1);
    });

    const topUniversities = Array.from(universityStats.entries())
      .map(([name, count]) => ({
        name,
        applications: count,
        percentage: Number((count / applications.length * 100).toFixed(1))
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 7);

    const topMajors = Array.from(majorStats.entries())
      .map(([name, count]) => ({
        name,
        applications: count,
        percentage: Number((count / applications.length * 100).toFixed(1))
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 6);

    return {
      overview: {
        totalScholarships: scholarships.length,
        totalApplications: applications.length,
        acceptedApplications,
        rejectedApplications,
        pendingApplications,
        activeScholarships,
        acceptanceRate: Number(acceptanceRate.toFixed(1)),
        averageApplicationsPerScholarship: Number(averageApplicationsPerScholarship.toFixed(1))
      },
      scholarshipPerformance,
      topUniversities,
      topMajors,
      // Mock monthly stats for now
      monthlyStats: [
        { month: 'Feb', applications: 18, accepted: 3, rejected: 12, pending: 3 },
        { month: 'Mar', applications: 25, accepted: 4, rejected: 16, pending: 5 },
        { month: 'Apr', applications: 22, accepted: 3, rejected: 14, pending: 5 },
        { month: 'May', applications: 28, accepted: 5, rejected: 18, pending: 5 },
        { month: 'Jun', applications: 31, accepted: 4, rejected: 22, pending: 5 },
        { month: 'Jul', applications: applications.length, accepted: acceptedApplications, rejected: rejectedApplications, pending: pendingApplications }
      ]
    };
  }, [applications, scholarships]);

  // Use API data if available, otherwise use fallback
  const data = analyticsData || fallbackAnalyticsData;
  const { 
    overview = { 
      totalScholarships: 0, 
      totalApplications: 0, 
      acceptedApplications: 0, 
      rejectedApplications: 0, 
      pendingApplications: 0, 
      activeScholarships: 0, 
      acceptanceRate: 0, 
      averageApplicationsPerScholarship: 0 
    },
    monthlyStats = [],
    scholarshipPerformance = [],
    topUniversities = [],
    topMajors = []
  } = data || {};

  // Export functions
  const generateReportCSV = () => {
    const headers = ['Metric', 'Value', 'Period'];
    const data = [
      ['Total Scholarships', overview.totalScholarships, timeRange],
      ['Total Applications', overview.totalApplications, timeRange],
      ['Accepted Applications', overview.acceptedApplications, timeRange],
      ['Acceptance Rate', `${overview.acceptanceRate}%`, timeRange],
      ['Average Applications per Scholarship', overview.averageApplicationsPerScholarship, timeRange],
    ];
    
    const csvContent = [headers, ...data]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change, 
    changeType = 'positive',
    description 
  }: {
    title: string;
    value: string | number;
    icon: any;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    description?: string;
  }) => (
    <Card className="border-0 bg-gradient-to-br from-white to-blue-50/30 shadow-lg hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {change && (
              <p className={`text-xs mt-1 ${
                changeType === 'positive' ? 'text-green-600' : 
                changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${
            changeType === 'positive' ? 'bg-gradient-to-br from-green-100 to-emerald-200' : 
            changeType === 'negative' ? 'bg-gradient-to-br from-red-100 to-red-200' : 'bg-gradient-to-br from-blue-100 to-blue-200'
          }`}>
            <Icon className={`h-6 w-6 ${
              changeType === 'positive' ? 'text-green-700' : 
              changeType === 'negative' ? 'text-red-700' : 'text-blue-700'
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SimpleChart = ({ data, type = 'line' }: { data: any[]; type?: 'bar' | 'line' }) => {
    const safeData = data || [];
    if (safeData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <p>Chưa có dữ liệu</p>
        </div>
      );
    }

    const chartData = safeData.slice(-6);
    const maxValue = Math.max(...chartData.map(d => d.applications || 0), 1);
    const chartHeight = 200;
    const chartWidth = 500;
    const padding = 40;

    if (type === 'line') {
      // Calculate points for line chart
      const points = chartData.map((item, index) => {
        const x = padding + (index * (chartWidth - padding * 2) / (chartData.length - 1 || 1));
        const y = chartHeight - padding - ((item.applications || 0) / maxValue) * (chartHeight - padding * 2);
        return { x, y, value: item.applications || 0, month: item.month };
      });

      // Create path for line
      const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      // Create area path (closed path for gradient fill)
      const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;

      return (
        <div className="h-64 w-full relative">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={padding}
                y1={padding + ratio * (chartHeight - padding * 2)}
                x2={chartWidth - padding}
                y2={padding + ratio * (chartHeight - padding * 2)}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* Area fill under line */}
            <path
              d={areaPath}
              fill="url(#areaGradient)"
            />

            {/* Main line with animation */}
            <path
              d={pathData}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: '1000',
                strokeDashoffset: '1000',
                animation: 'drawLine 2s ease-out forwards',
              }}
            />
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes drawLine {
                  to {
                    stroke-dashoffset: 0;
                  }
                }
              `
            }} />

            {/* Data points with hover effect */}
            {points.map((point, index) => (
              <g key={index} className="group">
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="3"
                  className="transition-all duration-300 group-hover:r-8 group-hover:fill-blue-700 cursor-pointer"
                />
                {/* Tooltip */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <rect
                    x={point.x - 25}
                    y={point.y - 35}
                    width="50"
                    height="20"
                    rx="4"
                    fill="#1f2937"
                    className="drop-shadow-lg"
                  />
                  <text
                    x={point.x}
                    y={point.y - 20}
                    textAnchor="middle"
                    className="text-xs fill-white font-semibold"
                  >
                    {point.value}
                  </text>
                </g>
              </g>
            ))}

            {/* Month labels */}
            {points.map((point, index) => (
              <text
                key={index}
                x={point.x}
                y={chartHeight - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600 font-medium"
              >
                {point.month}
              </text>
            ))}
          </svg>
        </div>
      );
    }

    // Enhanced Bar Chart
    return (
      <div className="h-64 w-full">
        <div className="h-full flex items-end justify-center space-x-2 px-4">
          {chartData.map((item, index) => {
            const height = ((item.applications || 0) / maxValue) * 100;
            return (
              <div key={index} className="flex flex-col items-center space-y-2 flex-1 group relative">
                <div className="relative w-full flex items-end justify-center h-full">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t-lg shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group-hover:from-blue-700 group-hover:via-blue-600 group-hover:to-blue-500 relative overflow-hidden"
                    style={{ 
                      height: `${height}%`,
                      minHeight: item.applications > 0 ? '4px' : '0'
                    }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {item.applications} đơn
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-600 font-medium">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SimpleDonutChart = ({ data, title }: { data: any[]; title: string }) => {
    const safeData = data || [];
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-center">{title}</h4>
        <div className="space-y-2">
          {safeData.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
              />
              <span className="text-sm">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold">{item.applications}</span>
              <span className="text-xs text-gray-500 ml-1">({item.percentage}%)</span>
            </div>
          </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu phân tích...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-blue-50 to-brand-cyan-50 border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{t('providerAnalytics.title')}</h1>
              <p className="text-gray-600 mt-2">
                {t('providerAnalytics.subtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-30-days">{t('providerAnalytics.timeRange.last30days')}</SelectItem>
                  <SelectItem value="last-3-months">{t('providerAnalytics.timeRange.last3months')}</SelectItem>
                  <SelectItem value="last-6-months">{t('providerAnalytics.timeRange.last6months')}</SelectItem>
                  <SelectItem value="last-year">{t('providerAnalytics.timeRange.lastYear')}</SelectItem>
                  <SelectItem value="all-time">{t('providerAnalytics.timeRange.allTime')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline"
                onClick={() => {
                  // Export functionality
                  console.log('Exporting report...');
                  const csvContent = generateReportCSV();
                  downloadCSV(csvContent, `analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('providerAnalytics.exportReport')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t('providerAnalytics.stats.totalApplications')}
            value={overview.totalApplications}
            icon={Users}
            change={`+12% ${t('providerAnalytics.stats.fromLastMonth')}`}
            changeType="positive"
          />
          
          <StatCard
            title={t('providerAnalytics.stats.acceptanceRate')}
            value={`${overview.acceptanceRate}%`}
            icon={CheckCircle}
            change={`+2.3% ${t('providerAnalytics.stats.fromLastMonth')}`}
            changeType="positive"
          />
          
          <StatCard
            title={t('providerAnalytics.stats.activeScholarships')}
            value={overview.activeScholarships}
            icon={Award}
            change={`2 ${t('providerAnalytics.stats.endingSoon')}`}
            changeType="neutral"
          />
          
          <StatCard
            title={t('providerAnalytics.stats.avgApplications')}
            value={overview.averageApplicationsPerScholarship}
            icon={TrendingUp}
            change={`+5.2 ${t('providerAnalytics.stats.fromLastMonth')}`}
            changeType="positive"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Applications Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2" />
                {t('providerAnalytics.charts.applicationsTrend')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleChart data={monthlyStats} type="line" />
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2" />
                {t('providerAnalytics.charts.statusDistribution')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-2">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{overview.acceptedApplications}</p>
                    <p className="text-sm text-gray-600">{t('providerAnalytics.statusLabels.accepted')}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-2">
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {overview.pendingApplications}
                    </p>
                    <p className="text-sm text-gray-600">{t('providerAnalytics.statusLabels.pending')}</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-2">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{overview.rejectedApplications}</p>
                  <p className="text-sm text-gray-600">{t('providerAnalytics.statusLabels.rejected')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scholarship Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              {t('providerAnalytics.charts.scholarshipPerformance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">{t('providerAnalytics.table.scholarship')}</th>
                    <th className="text-center py-3 px-2">{t('providerAnalytics.table.applications')}</th>
                    <th className="text-center py-3 px-2">{t('providerAnalytics.table.accepted')}</th>
                    <th className="text-center py-3 px-2">{t('providerAnalytics.table.acceptanceRate')}</th>
                    <th className="text-center py-3 px-2">{t('providerAnalytics.table.avgRating')}</th>
                    <th className="text-center py-3 px-2">{t('providerAnalytics.table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {scholarshipPerformance.map((scholarship, index) => (
                    <tr key={scholarship.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-2">
                        <div>
                          <h4 className="font-semibold">{scholarship.title}</h4>
                          <p className="text-sm text-gray-600">ID: {scholarship.id}</p>
                        </div>
                      </td>
                      <td className="text-center py-4 px-2">
                        <span className="font-semibold">{scholarship.applications}</span>
                      </td>
                      <td className="text-center py-4 px-2">
                        <span className="font-semibold text-green-600">{scholarship.accepted}</span>
                      </td>
                      <td className="text-center py-4 px-2">
                        <Badge variant={scholarship.acceptanceRate > 15 ? 'default' : 'secondary'}>
                          {scholarship.acceptanceRate}%
                        </Badge>
                      </td>
                      <td className="text-center py-4 px-2">
                        <div className="flex items-center justify-center">
                          <span className="font-semibold mr-1">{scholarship.averageRating}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-xs ${
                                  star <= scholarship.averageRating
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-4 px-2">
                        <Badge variant="default">{t('providerAnalytics.table.active')}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Universities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2" />
                {t('providerAnalytics.charts.topUniversities')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleDonutChart data={topUniversities} title="" />
            </CardContent>
          </Card>

          {/* Top Majors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                {t('providerAnalytics.charts.popularMajors')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleDonutChart data={topMajors} title="" />
            </CardContent>
          </Card>
        </div>

        {/* Recent Insights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              {t('providerAnalytics.charts.keyInsights')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">{t('providerAnalytics.insights.volumeTitle')}</h4>
                  <p className="text-blue-700 text-sm">
                    {t('providerAnalytics.insights.volumeDesc')
                      .replace('{total}', overview.totalApplications.toString())
                      .replace('{avg}', overview.averageApplicationsPerScholarship.toString())}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">{t('providerAnalytics.insights.acceptanceTitle')}</h4>
                  <p className="text-green-700 text-sm">
                    {t('providerAnalytics.insights.acceptanceDesc')
                      .replace('{rate}', overview.acceptanceRate.toString())
                      .replace('{accepted}', overview.acceptedApplications.toString())
                      .replace('{total}', overview.totalApplications.toString())}
                  </p>
                </div>
              </div>

              {overview.pendingApplications > 0 && (
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-900">{t('providerAnalytics.insights.actionTitle')}</h4>
                    <p className="text-yellow-700 text-sm">
                      {t('providerAnalytics.insights.actionDesc')
                        .replace('{pending}', overview.pendingApplications.toString())}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
