'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown, 
  Bookmark, // Import icon Bookmark
  LayoutDashboard,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { LanguageSelector } from '@/components/LanguageSelector';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserRole } from '@/types'; // Đảm bảo import Enum UserRole
import { Badge } from '@/components/ui/badge';
import chatService from '@/services/chat.service';

// --- Navigation Configs ---

const commonNavigation = [
  { name: 'Home', href: '/', translationKey: 'nav.home' },
];

const getPricingNavigation = (isAuthenticated: boolean, hasPaidSubscription: boolean) => {
  if (!isAuthenticated || !hasPaidSubscription) {
    return [{ name: 'Pricing', href: '/pricing', translationKey: 'nav.pricing' }];
  }
  return [];
};

const applicantSpecificNavigation = [
  { name: 'Dashboard', href: '/user/dashboard', translationKey: 'nav.dashboard' },
  { name: 'Scholarships', href: '/user/scholarships', translationKey: 'nav.scholarships' },
  { name: 'Applications', href: '/user/applications', translationKey: 'nav.applications' },
  { name: 'Messages', href: '/messages', translationKey: 'nav.messages' },
];

const providerSpecificNavigation = [
  { name: 'Dashboard', href: '/employer/dashboard', translationKey: 'nav.dashboard' },
  { name: 'My Scholarships', href: '/employer/scholarships', translationKey: 'nav.myScholarships' },
  { name: 'Applications', href: '/employer/applications', translationKey: 'nav.applications' },
  { name: 'Analytics', href: '/employer/analytics', translationKey: 'nav.analytics' },
  { name: 'Messages', href: '/messages', translationKey: 'nav.messages' },
];

const adminSpecificNavigation = [
  { name: 'Dashboard', href: '/admin', translationKey: 'nav.dashboard' },
  { name: 'Users', href: '/admin/users', translationKey: 'nav.users' },
  { name: 'Scholarships', href: '/admin/scholarships', translationKey: 'nav.scholarships' },
  { name: 'Applications', href: '/admin/applications', translationKey: 'nav.applications' },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { t } = useLanguage();
  const [unreadMessageCount, setUnreadMessageCount] = React.useState(0);
  
  const hasPaidSubscription = user?.subscriptionType !== 'FREE';
  
  // Fetch conversations và tính unread count
  React.useEffect(() => {
    if (!user || !isAuthenticated) {
      setUnreadMessageCount(0);
      return;
    }
    
    const fetchUnreadCount = async () => {
      try {
        const conversations = await chatService.getConversations();
        const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadMessageCount(totalUnread);
        console.log('📊 [Navbar] Updated unread count:', totalUnread);
      } catch (error) {
        console.error('Error fetching unread message count:', error);
        setUnreadMessageCount(0);
      }
    };
    
    fetchUnreadCount();
    
    // Lắng nghe event khi có tin nhắn mới để reload ngay
    const handleNewMessage = () => {
      console.log('🔔 [Navbar] New message received, reloading unread count...');
      // Delay nhỏ để đảm bảo server đã cập nhật unreadCount
      setTimeout(() => {
        fetchUnreadCount();
      }, 300);
    };
    
    window.addEventListener('newMessageReceived', handleNewMessage);
    
    // Poll every 5 seconds to update unread count
    const interval = setInterval(fetchUnreadCount, 5000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('newMessageReceived', handleNewMessage);
    };
  }, [user, isAuthenticated]);
  
  // --- Helpers ---

  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  const getInitials = () => {
    if (!user?.profile) return 'U';
    const firstName = user.profile.firstName || '';
    const lastName = user.profile.lastName || '';
    return (firstName[0] || '') + (lastName[0] || '');
  };

  const getUserFullName = () => {
    if (!user?.profile) return user?.email || 'User';
    return `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() || user.email;
  };

  const getRoleBadge = (role: UserRole | string) => {
    switch (role) {
      case UserRole.EMPLOYER:
      case 'EMPLOYER': // Fallback cho string cũ
        return { label: t('role.provider'), color: 'bg-green-100 text-green-700 border-green-200' };
      case UserRole.ADMIN:
      case 'ADMIN':
        return { label: t('role.admin'), color: 'bg-purple-100 text-purple-700 border-purple-200' };
      default: // UserRole.USER
        let label = t('role.student');
        if (user?.subscriptionType === 'PREMIUM') label += ' ✨';
        return { label, color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
  };

  const getRoleSpecificNavigation = () => {
    if (!isAuthenticated) return [];
    switch (user?.role) {
      case UserRole.EMPLOYER:
        return providerSpecificNavigation;
      case UserRole.ADMIN:
        return adminSpecificNavigation;
      default:
        return applicantSpecificNavigation;
    }
  };

  // --- Render Loading ---
  if (isLoading) {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm h-16">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
           <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
           <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 1. LEFT: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="font-bold text-xl text-gray-900">EduMatch</span>
            </Link>
          </div>

          {/* 2. CENTER: Navigation Links */}
          <div className="hidden xl:flex absolute left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-1">
              {/* Always Show Home */}
              <Link
                href="/"
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive('/') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {t('nav.home')}
              </Link>

              {/* Public Links (If not logged in) */}
              {!isAuthenticated && (
                <>
                  <Link href="/about" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    {t('nav.about')}
                  </Link>
                  <Link href="/user/scholarships" className={cn("px-3 py-2 rounded-md text-sm font-medium", isActive('/user/scholarships') ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50")}>
                    {t('nav.scholarships')}
                  </Link>
                  <Link href="/pricing" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    {t('nav.pricing')}
                  </Link>
                  <Link href="/contact" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    {t('nav.contact')}
                  </Link>
                </>
              )}

              {/* Authenticated Links */}
              {isAuthenticated && getRoleSpecificNavigation().map((item) => {
                const isMessagesLink = item.href === '/messages';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap relative",
                      isActive(item.href) ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    {t(item.translationKey)}
                    {isMessagesLink && unreadMessageCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full animate-pulse"
                      >
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 3. RIGHT: User Actions */}
          <div className="hidden xl:flex items-center space-x-2 flex-shrink-0">
            <LanguageSelector />
            
            {isAuthenticated ? (
              <>
                <NotificationDropdown />

                {/* CTA: Become Provider (Only for Students) */}
                {user?.role === UserRole.USER && (
                  <Link
                    href="/employer/register"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-md border border-blue-200 transition-colors whitespace-nowrap"
                  >
                    {t('nav.becomeProvider')}
                  </Link>
                )}

                {/* User Menu Button */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {user?.profile?.avatar && (
                        <AvatarImage src={user.profile.avatar} alt={getUserFullName()} />
                      )}
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-medium text-gray-900 max-w-[100px] truncate">
                        {getUserFullName()}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                        
                        {/* Header info */}
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                          <p className="text-sm font-semibold text-gray-900 truncate">{getUserFullName()}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                          <div className={cn("mt-2 inline-flex px-2 py-0.5 rounded-full text-xs font-medium border", getRoleBadge(user?.role || 'USER').color)}>
                             {getRoleBadge(user?.role || 'USER').label}
                          </div>
                        </div>
                        
                        <div className="py-1">
                          {/* Dashboard Link */}
                          <Link
                            href={user?.role === UserRole.ADMIN ? '/admin' : user?.role === UserRole.EMPLOYER ? '/employer/dashboard' : '/user/dashboard'}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <LayoutDashboard className="h-4 w-4 mr-3 text-gray-400" />
                            {t('nav.dashboard')}
                          </Link>

                          {/* Profile Link */}
                          <Link
                            href={user?.role === UserRole.ADMIN ? '/admin/profile' : user?.role === UserRole.EMPLOYER ? '/employer/profile' : '/user/profile'}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <User className="h-4 w-4 mr-3 text-gray-400" />
                            {t('user.profile')}
                          </Link>

                          {/* --- NEW: SAVED SCHOLARSHIPS (Only for Students) --- */}
                          {user?.role === UserRole.USER && (
                            <Link
                              href="/user/saved-scholarships"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <Bookmark className="h-4 w-4 mr-3 text-gray-400" />
                              {t('nav.savedScholarships')}
                            </Link>
                          )}
                          {/* ------------------------------------------------- */}

                          <Link
                            href={user?.role === UserRole.ADMIN ? '/admin/settings' : user?.role === UserRole.EMPLOYER ? '/employer/settings' : '/user/settings'}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4 mr-3 text-gray-400" />
                            {t('user.settings')}
                          </Link>
                        </div>
                        
                        <div className="border-t border-gray-200 my-1" />
                        
                        <button
                          onClick={() => { logout(); setIsUserMenuOpen(false); }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          {t('user.logout')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button asChild variant="ghost" size="sm" className="text-gray-700">
                  <Link href="/auth/login">{t('auth.signIn')}</Link>
                </Button>
                <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/auth/register">{t('auth.getStarted')}</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="xl:hidden flex items-center space-x-2">
            <LanguageSelector />
            {isAuthenticated && <NotificationDropdown />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-gray-200 pb-3">
            <div className="px-2 pt-2 space-y-1">
              <Link
                href="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('nav.home')}
              </Link>

              {!isAuthenticated && (
                <>
                  <Link href="/scholarships" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                    {t('nav.scholarships')}
                  </Link>
                  <Link href="/pricing" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                    {t('nav.pricing')}
                  </Link>
                </>
              )}

              {isAuthenticated && getRoleSpecificNavigation().map((item) => {
                const isMessagesLink = item.href === '/messages';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block px-3 py-2 rounded-md text-base font-medium relative",
                      isActive(item.href) ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t(item.translationKey)}
                    {isMessagesLink && unreadMessageCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute top-1 right-1 h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full"
                      >
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>

            {isAuthenticated && (
              <div className="pt-4 border-t border-gray-200 mt-2">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.profile?.avatar} alt={getUserFullName()} />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{getUserFullName()}</div>
                    <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <Link
                    href="/user/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('user.profile')}
                  </Link>
                  
                  {/* Mobile Saved Scholarships */}
                  {user?.role === UserRole.USER && (
                    <Link
                      href="/user/saved-scholarships"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('nav.savedScholarships')}
                    </Link>
                  )}

                  <Link
                    href="/user/settings"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('user.settings')}
                  </Link>
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    {t('user.logout')}
                  </button>
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <div className="pt-4 px-4 space-y-2 border-t border-gray-200 mt-2">
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/auth/login">{t('auth.signIn')}</Link>
                </Button>
                <Button asChild className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                  <Link href="/auth/register">{t('auth.getStarted')}</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}