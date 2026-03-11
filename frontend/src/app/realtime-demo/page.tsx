'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { ChatWindow } from '@/components/ChatWindow';
import { ApplicationStatusCard } from '@/components/ApplicationStatusCard';
import { DashboardStatsCards } from '@/components/DashboardStatsCards';
import { MatchToast } from '@/components/MatchToast';
import { UserDirectory } from '@/components/UserDirectory';
import { useRealTime } from '@/providers/RealTimeProvider';
import { useNotificationPermission } from '@/providers/RealTimeProvider';
import { useAuth } from '@/lib/auth';
import { 
  MessageCircle, 
  Wifi, 
  WifiOff, 
  Users, 
  Activity,
  Sparkles,
  Bell,
  Settings,
  LogIn,
  UserPlus,
  GraduationCap,
  Building,
  Crown
} from 'lucide-react';

interface ChatUser {
  id: string;
  name: string;
  role: string;
}

export default function RealTimeDemoPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { socket, onlineUsers, isConnected } = useRealTime();
  const { user, isAuthenticated, login } = useAuth();
  
  // Request notification permission
  useNotificationPermission();

  // Mock data
  const mockApplications = [
    {
      id: 'app-1',
      scholarshipTitle: 'AI Research Fellowship 2024',
      providerId: 'provider-1',
      providerName: 'Tech Foundation',
      submittedAt: '2024-09-25T10:00:00Z'
    },
    {
      id: 'app-2', 
      scholarshipTitle: 'Data Science Excellence Award',
      providerId: 'provider-2',
      providerName: 'Innovation Labs',
      submittedAt: '2024-09-20T14:30:00Z'
    }
  ];

  const handleStartChat = (chatUser: any) => {
    const roomId = [user?.id, chatUser.id].sort().join('-');
    setSelectedChat({
      id: chatUser.id,
      name: chatUser.name,
      role: chatUser.role
    });
    setChatOpen(true);
  };

  const handleSendTestNotification = () => {
    console.log('Test notification sent - check the mock server logs');
  };

  const handleQuickLogin = async (role: 'user' | 'employer' | 'admin') => {
    setIsLoading(true);
    
    try {
      let email = '';
      switch(role) {
        case 'applicant':
          email = 'student@demo.com';
          break;
        case 'provider':
          email = 'provider@demo.com';
          break;
        case 'admin':
          email = 'admin@demo.com';
          break;
      }
      
      const credentials = {
        email,
        password: 'password'
      };
      
      console.log('Attempting login with:', credentials);
      
      await login(credentials);
      console.log('Login successful!');
      
    } catch (error) {
      console.error('Quick login failed:', error);
      alert(`Login failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <MessageCircle className="h-6 w-6 text-blue-600" />
              Real-Time Chat Demo
            </CardTitle>
            <p className="text-gray-600">Please login to access chat features</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                onClick={() => handleQuickLogin('applicant')}
                className="w-full flex items-center gap-2"
                variant="outline"
                disabled={isLoading}
              >
                <GraduationCap className="h-4 w-4" />
                {isLoading ? 'Logging in...' : 'Login as Student'}
              </Button>
              <Button 
                onClick={() => handleQuickLogin('provider')}
                className="w-full flex items-center gap-2"
                variant="outline"
                disabled={isLoading}
              >
                <Building className="h-4 w-4" />
                {isLoading ? 'Logging in...' : 'Login as Provider'}
              </Button>
              <Button 
                onClick={() => handleQuickLogin('admin')}
                className="w-full flex items-center gap-2"
                variant="outline"
                disabled={isLoading}
              >
                <Crown className="h-4 w-4" />
                {isLoading ? 'Logging in...' : 'Login as Admin'}
              </Button>
            </div>
            
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-gray-500">
                Quick login for demo purposes
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Emails: student@demo.com, provider@demo.com, admin@demo.com<br/>
                Password: password
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Check console for debug info
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Real-Time Features Demo</h1>
              <p className="text-gray-600">
                Logged in as: <span className="font-medium">{user?.name}</span> 
                <Badge className="ml-2" variant="outline">
                  {user?.role}
                </Badge>
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-600" />
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      Connected
                    </Badge>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-600" />
                    <Badge variant="outline" className="text-red-700 border-red-300">
                      Disconnected
                    </Badge>
                  </>
                )}
              </div>
              
              {/* Notifications */}
              <NotificationDropdown />
              
              <Button onClick={handleSendTestNotification} variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Test Notification
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Chat Directory */}
          <div className="lg:col-span-1 space-y-6">
            <UserDirectory onStartChat={handleStartChat} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Connection Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Socket Status:</span>
                    <Badge variant={isConnected ? "default" : "destructive"}>
                      {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Your Role:</span>
                    <Badge variant="outline">{user?.role}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Online Users:</span>
                    <span>{(onlineUsers?.length || 0) + 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Server:</span>
                    <span className="text-xs text-gray-500">localhost:3003</span>
                  </div>
                </div>
                
                {/* Chat Rules */}
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs font-medium text-blue-800 mb-2">Chat Rules:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• {user?.role}s can chat with each other</li>
                    <li>• Students ↔ Providers allowed</li>
                    <li>• Admins can chat with everyone</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Dashboard & Applications */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dashboard Stats */}
            {(user?.role === 'employer' || user?.role === 'admin') && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Real-Time Dashboard
                </h2>
                <DashboardStatsCards />
              </div>
            )}

            {/* Application Status */}
            {user?.role === 'user' && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Your Applications (Live Updates)
                </h2>
                <div className="grid gap-4">
                  {mockApplications.map((app) => (
                    <ApplicationStatusCard
                      key={app.id}
                      applicationId={app.id}
                      scholarshipTitle={app.scholarshipTitle}
                      providerId={app.providerId}
                      providerName={app.providerName}
                      submittedAt={app.submittedAt}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Demo Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  How to Test Real-Time Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">1.</span>
                    <span>Start the mock server: <code className="bg-gray-100 px-2 py-1 rounded">npm run mock-server</code></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">2.</span>
                    <span>Open multiple tabs and login with different roles</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">3.</span>
                    <span>Use the user directory to start authenticated chats</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">4.</span>
                    <span>Watch for role-based chat restrictions and notifications</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600">5.</span>
                    <span>Dashboard stats update automatically (for providers/admins)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      {chatOpen && selectedChat && user && (
        <ChatWindow
          roomId={[user.id, selectedChat.id].sort().join('-')}
          otherUserId={selectedChat.id}
          otherUserName={selectedChat.name}
          currentUserId={user.id}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* Match Toast (only for students) */}
      {user?.role === 'user' && <MatchToast />}
    </div>
  );
}