'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Building2,
  Heart,
  Clock,
  BookOpen,
  TrendingUp,
  Bell,
  User,
  FileText,
  Award,
  Target,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate, getDaysUntilDeadline } from '@/lib/utils';
import { RealTimeDashboardStats } from '@/components/RealTimeDashboardStats';
import { RealTimeApplicationStatus } from '@/components/RealTimeApplicationStatus';
import { MatchToast } from '@/components/MatchToast';
import { ScholarshipCard } from '@/components/ScholarshipCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { parseNotification } from '@/lib/notification-templates';
import { scholarshipServiceApi } from '@/services/scholarship.service';
import { getNotifications } from '@/services/chat.service';
import { useRealTime } from '@/providers/RealTimeProvider';
import { useNotificationStore } from '@/stores/realtimeStore';
import { mapPaginatedOpportunities, mapOpportunityDtoToScholarship } from '@/lib/scholarship-mapper';
import { Scholarship } from '@/types';
import { useApplications, useSavedScholarships } from '@/hooks/api';
import { useAuth } from '@/lib/auth';
import { batchGetMatchingScores } from '@/services/matching.service';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ProfileCompletionModal } from '@/components/ProfileCompletionModal';
import { useProfileCompletionCheck } from '@/hooks/useProfileCompletionCheck';
import { markProfileCompletionSkipped } from '@/lib/profile-utils';
import { Carousel } from '@/components/Carousel';

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  hover: { 
    y: -8,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function DashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();
  
  // Profile completion check
  const { shouldShowModal, hideModal, onProfileCompleted } = useProfileCompletionCheck();
  
  // Auto-close modal after 3 seconds
  useEffect(() => {
    if (shouldShowModal) {
      const timer = setTimeout(() => {
        hideModal();
        markProfileCompletionSkipped();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldShowModal, hideModal]);
  
  // Fetch real data from API
  const { applications: apiApplications, fetchApplications } = useApplications();
  const { savedScholarships } = useSavedScholarships();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingScores, setMatchingScores] = useState<Map<string, number>>(new Map());
  
  // Get notifications from RealTimeProvider (same source as NotificationDropdown)
  const { notifications: realTimeNotifications } = useRealTime();
  const { loadNotifications: storeLoadNotifications } = useNotificationStore();
  
  // Use API applications instead of AppContext
  const applications = apiApplications;
  
  // Use real-time notifications if available, otherwise use fetched notifications
  const displayNotifications = realTimeNotifications && realTimeNotifications.length > 0 
    ? realTimeNotifications 
    : notifications;

  // Check employer request status and refresh user data if role changed
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // Only check for USER role
    if (user.role !== 'USER') return;

    const checkEmployerRequestStatus = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8080';
        const token = localStorage.getItem('auth_token');

        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/employer/request/my`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          // If request is approved, refresh user data
          if (data.status === 'APPROVED') {
            // Invalidate and refetch user data immediately
            await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
            await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            
            // Force refetch user data from backend
            const userResponse = await fetch(`${API_BASE_URL}/api/user/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              credentials: 'include',
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              const newRole = userData.data?.role || userData.role;
              
              // If role changed to EMPLOYER, redirect
              if (newRole === 'EMPLOYER' || newRole === 'ROLE_EMPLOYER') {
                toast.success('Yêu cầu của bạn đã được duyệt! Đang chuyển đến trang employer...', {
                  duration: 3000,
                });
                // Small delay to show toast
                setTimeout(() => {
                  // Force page reload to get new JWT with updated role
                  window.location.href = '/employer/dashboard';
                }, 1500);
              } else {
                // Role vẫn là USER (JWT token vẫn cũ) → logout và yêu cầu đăng nhập lại
                toast('Yêu cầu của bạn đã được duyệt! Vui lòng đăng nhập lại để cập nhật quyền truy cập.', {
                  duration: 5000,
                });
                setTimeout(() => {
                  logout();
                  // Redirect to login with message
                  window.location.href = '/auth/login?message=Yêu cầu của bạn đã được duyệt. Vui lòng đăng nhập lại.';
                }, 2000);
              }
            } else {
              // Không thể fetch user data → logout và yêu cầu đăng nhập lại
              toast('Yêu cầu của bạn đã được duyệt! Vui lòng đăng nhập lại để cập nhật quyền truy cập.', {
                duration: 5000,
              });
              setTimeout(() => {
                logout();
                window.location.href = '/auth/login?message=Yêu cầu của bạn đã được duyệt. Vui lòng đăng nhập lại.';
              }, 2000);
            }
          }
        }
      } catch (error) {
        // Silently fail - user might not have a request
        console.debug('No employer request found or error checking status:', error);
      }
    };

    // Check immediately
    checkEmployerRequestStatus();

    // Poll every 30 seconds to check for role change
    const interval = setInterval(checkEmployerRequestStatus, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, queryClient, router]);

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      console.log('[Dashboard] Starting to fetch all data...', { isAuthenticated, user: user?.id });
      
      if (!isAuthenticated || !user) {
        console.log('[Dashboard] Not authenticated or no user, skipping fetch');
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch applications
        console.log('[Dashboard] Fetching applications...');
        try {
          await fetchApplications();
          console.log('[Dashboard] Applications fetched successfully, count:', applications.length);
        } catch (err) {
          console.error('[Dashboard] Error fetching applications:', err);
        }
        
        // Fetch scholarships (fetch more for carousel pagination)
        console.log('[Dashboard] Fetching scholarships...');
        try {
          const response = await scholarshipServiceApi.getScholarships({
            page: 0,
            size: 12, // Fetch 12 scholarships for carousel (4 pages of 3 items each)
            isPublic: true,
            currentDate: new Date().toISOString().split('T')[0]
          });
          console.log('[Dashboard] Scholarships response:', response);
          const mapped = await mapPaginatedOpportunities(response);
          console.log('[Dashboard] Mapped scholarships:', mapped.scholarships.length);
          // Log first few scholarships to check createdAt and updatedAt
          if (mapped.scholarships.length > 0) {
            console.log('[Dashboard] Sample scholarships with dates:', 
              mapped.scholarships.slice(0, 5).map(s => ({
                id: s.id,
                title: s.title,
                createdAt: s.createdAt ? (s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt) : 'MISSING',
                updatedAt: (s as any).updatedAt ? ((s as any).updatedAt instanceof Date ? (s as any).updatedAt.toISOString() : (s as any).updatedAt) : 'MISSING',
                sortDate: (s as any).updatedAt || s.createdAt ? ((s as any).updatedAt || s.createdAt instanceof Date ? ((s as any).updatedAt || s.createdAt).toISOString() : ((s as any).updatedAt || s.createdAt)) : 'MISSING'
              }))
            );
          }
          setScholarships(mapped.scholarships);

          // Fetch matching scores for recommended scholarships
          try {
            await fetchMatchingScores(mapped.scholarships);
          } catch (err) {
            console.debug('[Dashboard] Failed to fetch matching scores:', err);
          }
        } catch (err) {
          console.error('[Dashboard] Error fetching scholarships:', err);
        }
        
        // Fetch notifications from database
        console.log('[Dashboard] Fetching notifications from database...');
        try {
          const notificationsData = await getNotifications(0, 50);
          console.log('[Dashboard] Notifications API response:', {
            hasContent: !!notificationsData?.content,
            contentLength: notificationsData?.content?.length || 0,
            totalElements: notificationsData?.totalElements || 0,
            isArray: Array.isArray(notificationsData),
            fullResponse: notificationsData
          });
          
          let notificationsArray: any[] = [];
          
          // Spring Data Page format: { content: [...], totalElements, totalPages, ... }
          if (notificationsData && notificationsData.content && Array.isArray(notificationsData.content)) {
            notificationsArray = notificationsData.content;
            console.log('[Dashboard] Found', notificationsArray.length, 'notifications in content array');
          } else if (Array.isArray(notificationsData)) {
            notificationsArray = notificationsData;
            console.log('[Dashboard] Response is direct array, found', notificationsArray.length, 'notifications');
          } else {
            console.warn('[Dashboard] Notifications data format unexpected:', {
              type: typeof notificationsData,
              keys: notificationsData ? Object.keys(notificationsData) : [],
              data: notificationsData
            });
            setNotifications([]);
            await storeLoadNotifications([]);
            return;
          }
          
          if (notificationsArray.length === 0) {
            console.log('[Dashboard] No notifications found in database');
            setNotifications([]);
            await storeLoadNotifications([]);
            return;
          }
          
          // Map notifications to expected format
          const mappedNotifications = notificationsArray.map((notif: any) => {
            // Backend Notification model fields: id, userId, title, body, type, referenceId, isRead, createdAt
            // Backend returns both 'read' (from @JsonProperty) and 'isRead' (from field name)
            // Prefer 'read' first, then 'isRead', default to false
            const isRead = notif.read !== undefined ? notif.read : (notif.isRead !== undefined ? notif.isRead : false);
            
            return {
              id: notif.id?.toString() || `notif-${Date.now()}-${Math.random()}`,
              type: notif.type || 'INFO',
              title: notif.title || 'Notification',
              message: notif.body || notif.message || '',
              body: notif.body || notif.message || '',
              read: isRead,
              isRead: isRead, // Keep both for compatibility
              createdAt: notif.createdAt || new Date(),
              opportunityTitle: notif.opportunityTitle,
              referenceId: notif.referenceId,
            };
          });
          
          // Sort by createdAt descending (newest first)
          const sorted = mappedNotifications.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          });
          
          console.log('[Dashboard] Mapped and sorted', sorted.length, 'notifications:', sorted.map(n => ({ id: n.id, title: n.title, type: n.type })));
          
          // Load notifications into store (this will persist them in memory)
          console.log('[Dashboard] Loading', notificationsArray.length, 'notifications into store');
          await storeLoadNotifications(notificationsArray);
          
          // Also set local state for immediate display
          setNotifications(sorted);
          console.log('[Dashboard] Notifications loaded successfully');
        } catch (err: any) {
          console.error('[Dashboard] Error fetching notifications:', {
            error: err,
            message: err?.message,
            response: err?.response?.data,
            status: err?.response?.status
          });
          setNotifications([]);
          await storeLoadNotifications([]);
        }
        
        console.log('[Dashboard] All data fetched. Final state:', {
          applications: applications.length,
          scholarships: scholarships.length,
          notifications: notifications.length,
          savedScholarships: savedScholarships.length
        });
      } catch (error) {
        console.error('[Dashboard] Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [isAuthenticated, user, fetchApplications]);

  // Fetch matching scores for current user and scholarships
  const fetchMatchingScores = async (scholarshipList: Scholarship[]) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const userId = user.id || user.userId;
      if (!userId) return;

      const opportunityIds = scholarshipList.map(s => s.id.toString());
      if (opportunityIds.length === 0) return;

      const scores = await batchGetMatchingScores(userId.toString(), opportunityIds);
      setMatchingScores(scores);

      // Merge scores into scholarships state so ScholarshipCard can read scholarship.matchScore
      setScholarships(prev => prev.map(s => ({
        ...s,
        matchScore: scores.get(s.id.toString()) || undefined
      })));
    } catch (error) {
      console.debug('Error fetching dashboard matching scores:', error);
    }
  };

  // Dashboard data from API - sorted by date
  const dashboardData = React.useMemo(() => {
    const notificationsToDisplay = realTimeNotifications && realTimeNotifications.length > 0 
      ? realTimeNotifications 
      : (notifications.length > 0 ? notifications : []);
    
    console.log('[Dashboard] Computing dashboardData with:', {
      applicationsCount: applications.length,
      scholarshipsCount: scholarships.length,
      notificationsCount: notificationsToDisplay.length,
      realTimeNotificationsCount: realTimeNotifications?.length || 0,
      fetchedNotificationsCount: notifications.length,
      savedScholarshipsCount: savedScholarships.length
    });
    
    // Sort applications by submittedAt/createdAt descending (newest first)
    const sortedApplications = [...applications].sort((a, b) => {
      // Parse dates properly
      const getDateA = () => {
        if (a.submittedAt) return new Date(a.submittedAt).getTime();
        if (a.createdAt) {
          const date = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          return isNaN(date.getTime()) ? 0 : date.getTime();
        }
        return 0;
      };
      const getDateB = () => {
        if (b.submittedAt) return new Date(b.submittedAt).getTime();
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
    
    // Sort notifications by createdAt descending (newest first)
    const sortedNotifications = [...notificationsToDisplay].sort((a: any, b: any) => {
      const getDateA = () => {
        if (a.createdAt) {
          const date = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          return isNaN(date.getTime()) ? 0 : date.getTime();
        }
        if (a.sentAt) {
          const date = a.sentAt instanceof Date ? a.sentAt : new Date(a.sentAt);
          return isNaN(date.getTime()) ? 0 : date.getTime();
        }
        if (a.timestamp) {
          const date = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
          return isNaN(date.getTime()) ? 0 : date.getTime();
        }
        return 0;
      };
      const getDateB = () => {
        if (b.createdAt) {
          const date = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return isNaN(date.getTime()) ? 0 : date.getTime();
        }
        if (b.sentAt) {
          const date = b.sentAt instanceof Date ? b.sentAt : new Date(b.sentAt);
          return isNaN(date.getTime()) ? 0 : date.getTime();
        }
        if (b.timestamp) {
          const date = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
          return isNaN(date.getTime()) ? 0 : date.getTime();
        }
        return 0;
      };
      const dateA = getDateA();
      const dateB = getDateB();
      // Descending order: newest first (larger timestamp comes first)
      return dateB - dateA;
    });
    
    const stats = {
      applications: applications.length,
      inReview: applications.filter(a => a.status === 'PENDING' || a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'VIEWED').length,
      accepted: applications.filter(a => a.status === 'ACCEPTED').length,
      saved: savedScholarships.length
    };
    
    console.log('[Dashboard] Computed stats:', stats);
    
    // Sort scholarships by updatedAt (approval date) descending (newest approved first)
    // If updatedAt is missing, fallback to createdAt
    const sortedScholarships = [...scholarships].sort((a, b) => {
      const getDateA = () => {
        // Priority: updatedAt (approval/update date) > createdAt
        const dateToUse = (a as any).updatedAt || a.createdAt;
        if (!dateToUse) {
          console.warn(`[Dashboard] Scholarship "${a.title}" missing both updatedAt and createdAt`);
          return 0; // Oldest items without dates go to end
        }
        const date = dateToUse instanceof Date ? dateToUse : new Date(dateToUse);
        if (isNaN(date.getTime())) {
          console.warn(`[Dashboard] Scholarship "${a.title}" has invalid date: ${dateToUse}`);
          return 0;
        }
        return date.getTime();
      };
      const getDateB = () => {
        // Priority: updatedAt (approval/update date) > createdAt
        const dateToUse = (b as any).updatedAt || b.createdAt;
        if (!dateToUse) {
          console.warn(`[Dashboard] Scholarship "${b.title}" missing both updatedAt and createdAt`);
          return 0; // Oldest items without dates go to end
        }
        const date = dateToUse instanceof Date ? dateToUse : new Date(dateToUse);
        if (isNaN(date.getTime())) {
          console.warn(`[Dashboard] Scholarship "${b.title}" has invalid date: ${dateToUse}`);
          return 0;
        }
        return date.getTime();
      };
      const dateA = getDateA();
      const dateB = getDateB();
      // Descending order: newest approved/updated first (larger timestamp comes first)
      // If dateB > dateA, return positive (B should come before A)
      const result = dateB - dateA;
      if (dateA > 0 && dateB > 0) {
        const dateAStr = new Date(dateA).toISOString();
        const dateBStr = new Date(dateB).toISOString();
        const dateTypeA = (a as any).updatedAt ? 'updatedAt' : 'createdAt';
        const dateTypeB = (b as any).updatedAt ? 'updatedAt' : 'createdAt';
        console.log(`[Dashboard] Sorting: "${a.title.substring(0, 20)}" (${dateTypeA}: ${dateAStr}) vs "${b.title.substring(0, 20)}" (${dateTypeB}: ${dateBStr}) = ${result > 0 ? 'B newer (B first)' : result < 0 ? 'A newer (A first)' : 'equal'}`);
      }
      return result;
    });
    
    // Log sorted order to verify and check if reversal is needed
    if (sortedScholarships.length > 0) {
      console.log('[Dashboard] Sorted scholarships order (newest approved first):', 
        sortedScholarships.map((s, idx) => {
          const updatedAt = (s as any).updatedAt;
          const createdAt = s.createdAt;
          const sortDate = updatedAt || createdAt;
          return {
            index: idx,
            title: s.title,
            createdAt: createdAt ? (createdAt instanceof Date ? createdAt.toISOString() : createdAt) : 'MISSING',
            updatedAt: updatedAt ? (updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt) : 'MISSING',
            sortDate: sortDate ? (sortDate instanceof Date ? sortDate.toISOString() : sortDate) : 'MISSING',
            sortTimestamp: sortDate ? (sortDate instanceof Date ? sortDate.getTime() : new Date(sortDate).getTime()) : 0,
            usingUpdatedAt: !!updatedAt
          };
        })
      );
      
      // Check if first item is actually newer than last item (if both have valid dates)
      const firstItem = sortedScholarships[0];
      const lastItem = sortedScholarships[sortedScholarships.length - 1];
      const firstSortDate = (firstItem as any).updatedAt || firstItem.createdAt;
      const lastSortDate = (lastItem as any).updatedAt || lastItem.createdAt;
      const firstTimestamp = firstSortDate ? (firstSortDate instanceof Date ? firstSortDate.getTime() : new Date(firstSortDate).getTime()) : 0;
      const lastTimestamp = lastSortDate ? (lastSortDate instanceof Date ? lastSortDate.getTime() : new Date(lastSortDate).getTime()) : 0;
      
      if (firstTimestamp > 0 && lastTimestamp > 0 && firstTimestamp < lastTimestamp) {
        console.error('[Dashboard] ❌ ERROR: Array is sorted in wrong order! First item is older than last item. Reversing array...');
        sortedScholarships.reverse();
        console.log('[Dashboard] ✅ Array reversed. New first item:', sortedScholarships[0].title);
      }
      
      // Log which items are at the beginning and end
      console.log('[Dashboard] First 3 items (should be newest approved):', 
        sortedScholarships.slice(0, 3).map(s => ({
          title: s.title,
          sortDate: ((s as any).updatedAt || s.createdAt) ? (((s as any).updatedAt || s.createdAt) instanceof Date ? ((s as any).updatedAt || s.createdAt).toISOString() : ((s as any).updatedAt || s.createdAt)) : 'MISSING'
        }))
      );
      console.log('[Dashboard] Last 3 items (should be oldest approved):', 
        sortedScholarships.slice(-3).map(s => ({
          title: s.title,
          sortDate: ((s as any).updatedAt || s.createdAt) ? (((s as any).updatedAt || s.createdAt) instanceof Date ? ((s as any).updatedAt || s.createdAt).toISOString() : ((s as any).updatedAt || s.createdAt)) : 'MISSING'
        }))
      );
    }
    
    const result = {
      stats,
      recentApplications: sortedApplications.slice(0, 3).map(app => {
        const scholarship = scholarships.find(s => s.id === app.scholarshipId);
        return {
          id: app.id,
          scholarshipTitle: app.opportunityTitle || scholarship?.title || 'Unknown Scholarship',
          provider: scholarship?.providerName || 'Unknown Provider',
          status: app.status.toLowerCase(),
          appliedDate: app.submittedAt || app.createdAt || new Date(),
          deadline: scholarship?.applicationDeadline || ''
        };
      }),
      notifications: sortedNotifications.slice(0, 5),
      recommendedScholarships: sortedScholarships // Already sorted by createdAt descending (newest first)
    };
    
    // Verify: First item should be newest (largest timestamp)
    if (result.recommendedScholarships.length > 0) {
      const firstTimestamp = result.recommendedScholarships[0].createdAt ? 
        new Date(result.recommendedScholarships[0].createdAt).getTime() : 0;
      const lastTimestamp = result.recommendedScholarships[result.recommendedScholarships.length - 1].createdAt ? 
        new Date(result.recommendedScholarships[result.recommendedScholarships.length - 1].createdAt).getTime() : 0;
      console.log('[Dashboard] Verification - First item timestamp:', firstTimestamp, 'Last item timestamp:', lastTimestamp);
      if (firstTimestamp < lastTimestamp && firstTimestamp > 0 && lastTimestamp > 0) {
        console.warn('[Dashboard] ⚠️ WARNING: Array appears to be sorted in wrong order! First item is older than last item.');
      }
    }
    
    console.log('[Dashboard] Final dashboardData:', {
      stats: result.stats,
      recentApplicationsCount: result.recentApplications.length,
      notificationsCount: result.notifications.length,
      recommendedScholarshipsCount: result.recommendedScholarships.length
    });
    
    // Log first few items to verify sorting (newest should be first)
    if (result.recommendedScholarships.length > 0) {
      console.log('[Dashboard] First 3 scholarships (should be newest):', 
        result.recommendedScholarships.slice(0, 3).map(s => ({
          id: s.id,
          title: s.title,
          createdAt: s.createdAt,
          createdAtParsed: s.createdAt ? new Date(s.createdAt).toISOString() : 'N/A',
          timestamp: s.createdAt ? new Date(s.createdAt).getTime() : 0
        }))
      );
      console.log('[Dashboard] Last 3 scholarships (should be oldest):', 
        result.recommendedScholarships.slice(-3).map(s => ({
          id: s.id,
          title: s.title,
          createdAt: s.createdAt,
          timestamp: s.createdAt ? new Date(s.createdAt).getTime() : 0
        }))
      );
    }
    if (result.notifications.length > 0) {
      console.log('[Dashboard] First 3 notifications (should be newest):', 
        result.notifications.slice(0, 3).map(n => ({
          id: n.id,
          title: n.title,
          createdAt: n.createdAt
        }))
      );
    }
    if (result.recentApplications.length > 0) {
      console.log('[Dashboard] First 3 applications (should be newest):', 
        result.recentApplications.map(a => ({
          id: a.id,
          title: a.scholarshipTitle,
          appliedDate: a.appliedDate
        }))
      );
    }
    
    return result;
  }, [scholarships, applications, notifications, savedScholarships, realTimeNotifications]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'under_review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'submitted':
        return <FileText className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'under_review':
        return 'warning';
      case 'submitted':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return t('dashboard.status.accepted');
      case 'rejected':
        return t('dashboard.status.rejected');
      case 'under_review':
        return t('dashboard.status.underReview');
      case 'submitted':
        return t('dashboard.status.submitted');
      default:
        return t('dashboard.status.unknown');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-blue-50 to-brand-cyan-50 border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
             <h1 className="text-4xl font-bold text-gray-900">
                {t('dashboard.welcomeUser').replace('{name}', user?.name || user?.email?.split('@')[0] || 'User')}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('dashboard.subtitle')}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button asChild>
                <Link href="/user/scholarships">
                  <Search className="h-4 w-4 mr-2" />
                  {t('dashboard.findScholarships')}
                </Link>
              </Button>
            </div>
        </div>

        {/* Match Toast Notifications */}
        <MatchToast />
      </div>
    </div>      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Real-time Stats Overview */}
        <RealTimeDashboardStats 
          userRole="applicant" 
          applications={applications}
          savedScholarships={savedScholarships}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Real-time Applications */}
          <div className="lg:col-span-2">
            <RealTimeApplicationStatus 
              applications={applications}
              scholarships={scholarships}
            />
          </div>

          {/* Notifications */}
          <div>
            <Card className="border-0 bg-gradient-to-br from-white to-blue-50/20 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">{t('dashboard.notifications.title')}</CardTitle>
                <Button variant="outline" size="sm" className="border-blue-300 hover:bg-blue-50">
                  <Bell className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <Carousel
                  items={dashboardData.notifications}
                  itemsPerPage={3}
                  renderItem={(notification: any) => {
                    console.log('[Dashboard] Rendering notification:', notification);
                    try {
                      const { templateKey, params } = parseNotification({
                        type: notification.type || 'INFO',
                        title: notification.title || 'Notification',
                        message: notification.message || notification.body || '',
                        opportunityTitle: notification.opportunityTitle
                      });
                      return (
                        <div key={notification.id} className={`p-3 rounded-lg border ${!notification.read ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-sm' : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'}`}>
                          <h5 className="font-medium text-sm text-gray-900">
                            {notification.title || t(templateKey + '.title', params || {})}
                          </h5>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message || notification.body || t(templateKey, params || {})}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(notification.createdAt?.toString() || new Date().toString())}
                          </p>
                        </div>
                      );
                    } catch (err) {
                      console.error('[Dashboard] Error parsing notification:', err, notification);
                      // Fallback display
                      return (
                        <div key={notification.id} className={`p-3 rounded-lg border ${!notification.read ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-sm' : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'}`}>
                          <h5 className="font-medium text-sm text-gray-900">
                            {notification.title || 'Notification'}
                          </h5>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message || notification.body || 'No message'}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(notification.createdAt?.toString() || new Date().toString())}
                          </p>
                        </div>
                      );
                    }
                  }}
                  emptyMessage={
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t('dashboard.notifications.noNotifications') || 'No notifications yet'}</p>
                    </div>
                  }
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommended Scholarships */}
        <Card className="mt-8 border-0 bg-gradient-to-br from-white to-cyan-50/20 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">{t('dashboard.recommended.title')}</CardTitle>
            <Button variant="outline" size="sm" className="border-blue-300 hover:bg-blue-50" asChild>
              <Link href="/user/scholarships">
                {t('dashboard.recommended.viewAll')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Carousel
              items={dashboardData.recommendedScholarships}
              itemsPerPage={3}
              renderItem={(scholarship: Scholarship, index: number) => (
                <motion.div
                  key={scholarship.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  custom={index}
                  className="h-full"
                >
                  <ScholarshipCard
                    scholarship={scholarship}
                    showMatchScore={true}
                    className="w-full h-full"
                  />
                </motion.div>
              )}
              emptyMessage={
                <div className="text-center py-8 text-gray-500">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('dashboard.recommended.noScholarships') || 'No recommended scholarships available'}</p>
                  <Button asChild className="mt-4">
                    <Link href="/user/scholarships">{t('dashboard.recommended.browse') || 'Browse Scholarships'}</Link>
                  </Button>
                </div>
              }
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-8 border-0 bg-gradient-to-br from-white to-blue-50/20 shadow-lg">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={cardVariants} whileHover="hover">
                <Button variant="outline" className="h-20 flex-col space-y-2 border-blue-200 w-full hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 hover:border-blue-400 hover:shadow-md transition-all group" asChild>
                <Link href="/user/profile">
                  <User className="h-6 w-6 text-blue-600 group-hover:text-blue-700" />
                  <span className="text-gray-700 group-hover:text-blue-900 font-medium">{t('dashboard.quickAction.updateProfile')}</span>
                </Link>
              </Button>
              </motion.div>
              <motion.div variants={cardVariants} whileHover="hover">
                <Button variant="outline" className="h-20 flex-col space-y-2 border-blue-200 w-full hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 hover:border-blue-400 hover:shadow-md transition-all group" asChild>
                <Link href="/user/scholarships">
                  <Search className="h-6 w-6 text-blue-600 group-hover:text-blue-700" />
                  <span className="text-gray-700 group-hover:text-blue-900 font-medium">{t('dashboard.quickAction.browseScholarships')}</span>
                </Link>
              </Button>
              </motion.div>
              <motion.div variants={cardVariants} whileHover="hover">
                <Button variant="outline" className="h-20 flex-col space-y-2 border-blue-200 w-full hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 hover:border-blue-400 hover:shadow-md transition-all group" asChild>
                <Link href="/user/applications">
                  <FileText className="h-6 w-6 text-blue-600 group-hover:text-blue-700" />
                  <span className="text-gray-700 group-hover:text-blue-900 font-medium">{t('dashboard.quickAction.myApplications')}</span>
                </Link>
              </Button>
              </motion.div>
              <motion.div variants={cardVariants} whileHover="hover">
                <Button variant="outline" className="h-20 flex-col space-y-2 border-blue-200 w-full hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 hover:border-blue-400 hover:shadow-md transition-all group" asChild>
                <Link href="/user/settings">
                  <Target className="h-6 w-6 text-blue-600 group-hover:text-blue-700" />
                  <span className="text-gray-700 group-hover:text-blue-900 font-medium">{t('dashboard.quickAction.settings')}</span>
                </Link>
              </Button>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Completion Modal - Auto close after 3s */}
      <ProfileCompletionModal
        isOpen={shouldShowModal}
        onClose={() => {
          hideModal();
        }}
        onSkip={() => {
          markProfileCompletionSkipped();
          hideModal();
        }}
        onCompleteProfile={() => {
          onProfileCompleted();
          hideModal();
          router.push('/user/profile');
        }}
        isPostRegistration={false}
      />
    </div>
  );
}

