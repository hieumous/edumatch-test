'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  FileText, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminService, AdminStats } from '@/services/admin.service';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { pageVariants, statCardVariants, listContainerVariants, listItemVariants } from '@/lib/animations';

// Activity Chart Component
const ActivityChart = ({ 
  totalUsers, 
  activeScholarships, 
  totalApplications, 
  pendingApplications,
  acceptedApplications 
}: {
  totalUsers: number;
  activeScholarships: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
}) => {
  const maxValue = Math.max(totalUsers, activeScholarships, totalApplications, 1);
  const chartHeight = 280;
  const chartWidth = 1000;
  const padding = 40;
  const barWidth = 80;
  const spacing = 60;
  
  const data = [
    { label: 'Người dùng', value: totalUsers, color: '#3b82f6' },
    { label: 'Học bổng', value: activeScholarships, color: '#10b981' },
    { label: 'Đơn ứng tuyển', value: totalApplications, color: '#f59e0b' },
    { label: 'Đang chờ', value: pendingApplications, color: '#ef4444' },
    { label: 'Đã chấp nhận', value: acceptedApplications, color: '#8b5cf6' },
  ];

  const getBarHeight = (value: number) => {
    return maxValue > 0 ? (value / maxValue) * (chartHeight - padding * 2) : 0;
  };

  const getBarY = (value: number) => {
    return chartHeight - padding - getBarHeight(value);
  };

  return (
    <div className="w-full h-full overflow-x-auto">
      <svg 
        width={Math.max(chartWidth, data.length * (barWidth + spacing) + padding * 2)} 
        height={chartHeight}
        className="w-full"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + ratio * (chartHeight - padding * 2);
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={chartWidth - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const x = padding + index * (barWidth + spacing);
          const barHeight = getBarHeight(item.value);
          const y = getBarY(item.value);
          
          return (
            <g key={index}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={item.color}
                rx="4"
                className="transition-all duration-500 hover:opacity-80"
              >
                <animate
                  attributeName="height"
                  from="0"
                  to={barHeight}
                  dur="0.8s"
                  fill="freeze"
                />
                <animate
                  attributeName="y"
                  from={chartHeight - padding}
                  to={y}
                  dur="0.8s"
                  fill="freeze"
                />
              </rect>
              
              {/* Value label */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs font-semibold fill-gray-700"
              >
                {item.value}
              </text>
              
              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const value = Math.round(ratio * maxValue);
          const y = padding + ratio * (chartHeight - padding * 2);
          return (
            <text
              key={i}
              x={padding - 10}
              y={y + 4}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {value}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [allScholarships, setAllScholarships] = useState<any[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch stats từ API (cho users và các thông tin khác)
        const data = await adminService.getStats();
        
        // Fetch tất cả scholarships để tính toán chính xác (giống trang quản lý học bổng)
        let allScholarshipsData: any[] = [];
        let scholarshipPage = 0;
        let hasMoreScholarships = true;
        while (hasMoreScholarships) {
          const response = await adminService.getScholarships({ page: scholarshipPage, size: 100 });
          allScholarshipsData = [...allScholarshipsData, ...response.content];
          hasMoreScholarships = !response.last;
          scholarshipPage++;
        }
        setAllScholarships(allScholarshipsData);
        
        // Fetch tất cả applications để tính toán chính xác
        let allApplicationsData: any[] = [];
        let applicationPage = 0;
        let hasMoreApplications = true;
        while (hasMoreApplications) {
          const response = await adminService.getApplications({ page: applicationPage, size: 100 });
          allApplicationsData = [...allApplicationsData, ...response.content];
          hasMoreApplications = !response.last;
          applicationPage++;
        }
        setAllApplications(allApplicationsData);
        
        // Tính toán stats từ dữ liệu thực tế (giống trang quản lý học bổng)
        const activeScholarships = allScholarshipsData.filter(
          s => s.moderationStatus === 'APPROVED' || s.status === 'PUBLISHED'
        ).length;
        
        const pendingApplications = allApplicationsData.filter(
          app => {
            const status = app.status?.toUpperCase();
            return status === 'PENDING' || status === 'SUBMITTED' || status === 'UNDER_REVIEW';
          }
        ).length;
        
        // Cập nhật stats với dữ liệu tính toán từ frontend
        setStats({
          ...data,
          activeScholarships,
          pendingApplications,
          totalScholarships: allScholarshipsData.length,
          totalApplications: allApplicationsData.length
        });
      } catch (error: any) {
        console.error('Failed to fetch admin stats:', error);
        toast.error('Không thể tải thống kê', {
          description: error.message || 'Vui lòng thử lại sau'
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRecentData = async () => {
      try {
        setIsLoadingRecent(true);
        const [apps, users] = await Promise.all([
          adminService.getRecentApplications(5),
          adminService.getRecentUsers(5)
        ]);
        
        // Map applications
        const mappedApps = apps.map((app: any) => ({
          id: app.id,
          studentName: app.applicant?.firstName && app.applicant?.lastName 
            ? `${app.applicant.firstName} ${app.applicant.lastName}`
            : app.applicantUserName || 'N/A',
          scholarship: app.opportunityTitle || 'N/A',
          date: app.submittedAt ? formatDistanceToNow(new Date(app.submittedAt), { addSuffix: true }) : 'N/A',
          amount: app.opportunityTitle || 'N/A',
          status: app.status || 'PENDING'
        }));
        
        // Map users
        const mappedUsers = users.map((user: any) => ({
          id: user.id,
          name: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.username || 'N/A',
          email: user.email || 'N/A',
          joinDate: user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'N/A',
          role: user.roles && user.roles.length > 0 
            ? user.roles[0].replace('ROLE_', '')
            : 'USER',
          avatar: user.firstName ? user.firstName.charAt(0).toUpperCase() : user.username?.charAt(0).toUpperCase() || 'U'
        }));
        
        setRecentApplications(mappedApps);
        setRecentUsers(mappedUsers);
      } catch (error: any) {
        console.error('Failed to fetch recent data:', error);
      } finally {
        setIsLoadingRecent(false);
      }
    };

    fetchStats();
    fetchRecentData();
  }, []);

  // Calculate stats from API data
  const totalUsers = stats?.totalUsers || 0;
  const activeScholarships = stats?.activeScholarships || 0;
  const pendingApplications = stats?.pendingApplications || 0;
  
  // Tính toán học bổng chờ phê duyệt từ dữ liệu thực tế (giống trang quản lý học bổng)
  const pendingScholarships = allScholarships.filter(
    s => s.moderationStatus === 'PENDING' || s.status === 'PENDING'
  ).length;

  const handleGenerateReport = () => {
    // Get current date for report
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Create report data
    const reportData = {
      date,
      totalUsers: stats?.totalUsers || 0,
      activeScholarships: stats?.activeScholarships || 0,
      pendingApplications: stats?.pendingApplications || 0,
      totalFunding,
      students: stats?.totalStudents || 0,
      providers: stats?.totalEmployers || 0,
      acceptedApplications: stats?.acceptedApplications || 0,
      rejectedApplications: stats?.rejectedApplications || 0,
      totalApplications: stats?.totalApplications || 0,
    };

    // Create report content
    const reportContent = `
EduMatch Admin Report
Generated: ${reportData.date}

===========================================
SYSTEM OVERVIEW
===========================================

Users Statistics:
- Total Users: ${reportData.totalUsers}
- Students: ${reportData.students}
- Providers: ${reportData.providers}

Scholarships Statistics:
- Active Scholarships: ${reportData.activeScholarships}
- Total Funding Available: $${reportData.totalFunding.toLocaleString()}

Applications Statistics:
- Pending Applications: ${reportData.pendingApplications}
- Accepted Applications: ${reportData.acceptedApplications}
- Rejected Applications: ${reportData.rejectedApplications}
- Total Applications: ${reportData.totalApplications}

===========================================
DETAILED BREAKDOWN
===========================================

Recent Applications:
(Data will be loaded from API)

Recent Users:
(Data will be loaded from API)

===========================================
Generated by EduMatch Admin System
===========================================
    `.trim();

    // Create and download report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edumatch-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Show success message
    toast.success(t('admin.report.success'), {
      description: t('admin.report.successDescription'),
    });
  };

  const statsCards = [
    {
      title: t('admin.stats.totalUsers'),
      value: isLoading ? '...' : totalUsers.toLocaleString(),
      change: '+12.5%',
      trend: 'up' as const,
      icon: Users,
      color: 'bg-blue-500',
      link: '/admin/users'
    },
    {
      title: t('admin.stats.activeScholarships'),
      value: isLoading ? '...' : activeScholarships.toLocaleString(),
      change: '+5.2%',
      trend: 'up' as const,
      icon: GraduationCap,
      color: 'bg-green-500',
      link: '/admin/scholarships'
    },
    {
      title: t('admin.stats.pendingApplications'),
      value: isLoading ? '...' : pendingApplications.toLocaleString(),
      change: '-3.1%',
      trend: 'down' as const,
      icon: FileText,
      color: 'bg-orange-500',
      link: '/admin/applications'
    },
    {
      title: t('admin.stats.pendingScholarships'),
      value: isLoading ? '...' : pendingScholarships.toLocaleString(),
      change: '+0%',
      trend: 'up' as const,
      icon: Clock,
      color: 'bg-yellow-500',
      link: '/admin/scholarships'
    }
  ];


  const getStatusColor = (status: string) => {
    if (status.includes('accepted')) return 'bg-green-100 text-green-700';
    if (status.includes('submitted') || status.includes('under review')) return 'bg-yellow-100 text-yellow-700';
    if (status.includes('rejected')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <motion.div
      className="space-y-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Page Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.dashboard.subtitle')}</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            onClick={handleGenerateReport}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {t('admin.dashboard.generateReport')}
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={listContainerVariants}
        initial="initial"
        animate="animate"
      >
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          
          return (
            <motion.div key={index} variants={listItemVariants} className="h-full">
              <motion.div variants={statCardVariants} whileHover="hover" className="h-full">
                <Card className="card-minimal h-full flex flex-col">
                  <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4 flex-1">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                    <div className="flex items-center mt-2">
                      <TrendIcon 
                        className={`w-4 h-4 ${
                          stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`} 
                      />
                      <span 
                        className={`text-sm font-medium ml-1 ${
                          stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">{t('admin.stats.vsLastMonth')}</span>
                    </div>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <Link href={stat.link} className="mt-auto">
                  <Button variant="outline" size="sm" className="w-full">
                    {t('admin.stats.viewAll')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {/* Recent Applications */}
        <Card className="card-minimal">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('admin.recentApplications.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingRecent ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400 animate-pulse" />
                  <p>Đang tải...</p>
                </div>
              ) : recentApplications.length > 0 ? recentApplications.map((application) => (
                <div 
                  key={application.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{application.studentName}</h4>
                    <p className="text-sm text-gray-600">{application.scholarship}</p>
                    <p className="text-xs text-gray-500 mt-1">{application.date}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={`mt-1 ${getStatusColor(application.status)}`}>
                      {application.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Chưa có đơn ứng tuyển gần đây</p>
                </div>
              )}
            </div>
            <Link href="/admin/applications">
              <Button variant="outline" className="w-full mt-4">
                {t('admin.recentApplications.viewAll')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="card-minimal">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('admin.recentUsers.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingRecent ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400 animate-pulse" />
                  <p>Đang tải...</p>
                </div>
              ) : recentUsers.length > 0 ? recentUsers.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{user.joinDate}</p>
                  </div>
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Chưa có người dùng gần đây</p>
                </div>
              )}
            </div>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full mt-4">
                {t('admin.recentUsers.viewAll')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="card-minimal">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('admin.activity.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ActivityChart 
                totalUsers={totalUsers}
                activeScholarships={activeScholarships}
                totalApplications={stats?.totalApplications || 0}
                pendingApplications={pendingApplications}
                acceptedApplications={stats?.acceptedApplications || 0}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
