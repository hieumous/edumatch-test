'use client';

import React, { useState } from 'react';
import { Bell, Send, Users, User, Megaphone, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModalForm, { FormField } from '@/components/admin/ModalForm';
import StatCard from '@/components/admin/StatCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminService } from '@/services/admin.service';
import { useEffect } from 'react';

interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  type: 'SYSTEM' | 'ANNOUNCEMENT' | 'ALERT' | 'UPDATE';
}

const templates: NotificationTemplate[] = [
  { id: 'maintenance', name: 'System Maintenance', description: 'Scheduled maintenance notification', type: 'SYSTEM' },
  { id: 'new-feature', name: 'New Feature', description: 'Announce new platform features', type: 'ANNOUNCEMENT' },
  { id: 'security-alert', name: 'Security Alert', description: 'Important security updates', type: 'ALERT' },
  { id: 'policy-update', name: 'Policy Update', description: 'Platform policy changes', type: 'UPDATE' }
];

export default function AdminNotificationsPage() {
  const { t } = useLanguage();
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [stats, setStats] = useState({
    totalSent: 0,
    delivered: 0,
    pending: 0,
    failed: 0,
    changePercentage: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const data = await adminService.getNotificationStats();
        setStats({
          totalSent: data.totalSent || 0,
          delivered: data.delivered || 0,
          pending: data.pending || 0,
          failed: data.failed || 0,
          changePercentage: data.changePercentage || 0
        });
      } catch (error: any) {
        console.error('Failed to fetch notification stats:', error);
        toast.error('Không thể tải thống kê', {
          description: error.message || 'Vui lòng thử lại sau'
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const response = await adminService.getNotificationHistory({ page: 0, size: 10 });
        setHistory(response.content || []);
      } catch (error: any) {
        console.error('Failed to fetch notification history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const data = await adminService.getNotificationTemplates();
        setTemplates(data.map((t: any) => ({
          id: t.id.toString(),
          name: t.name,
          description: t.description,
          type: t.type as 'SYSTEM' | 'ANNOUNCEMENT' | 'ALERT' | 'UPDATE'
        })));
      } catch (error: any) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const sendFields: FormField[] = [
    {
      name: 'targetAudience',
      label: t('adminNotifications.modal.targetAudience'),
      type: 'select',
      required: true,
      options: [
        { label: t('adminNotifications.modal.audienceAll'), value: 'ALL_USERS' },
        { label: t('adminNotifications.modal.audienceApplicants'), value: 'APPLICANTS' },
        { label: t('adminNotifications.modal.audienceProviders'), value: 'PROVIDERS' },
        { label: t('adminNotifications.modal.audiencePremium'), value: 'PREMIUM' },
        { label: t('adminNotifications.modal.audienceSpecific'), value: 'SPECIFIC' }
      ]
    },
    {
      name: 'specificEmail',
      label: t('adminNotifications.modal.specificEmail'),
      type: 'email',
      required: false,
      placeholder: t('adminNotifications.modal.emailPlaceholder')
    },
    {
      name: 'type',
      label: t('adminNotifications.modal.type'),
      type: 'select',
      required: true,
      options: [
        { label: t('adminNotifications.modal.typeSystem'), value: 'SYSTEM' },
        { label: t('adminNotifications.modal.typeAnnouncement'), value: 'ANNOUNCEMENT' },
        { label: t('adminNotifications.modal.typeAlert'), value: 'ALERT' },
        { label: t('adminNotifications.modal.typeUpdate'), value: 'UPDATE' }
      ]
    },
    {
      name: 'priority',
      label: t('adminNotifications.modal.priority'),
      type: 'select',
      required: true,
      options: [
        { label: t('adminNotifications.modal.priorityLow'), value: 'LOW' },
        { label: t('adminNotifications.modal.priorityNormal'), value: 'NORMAL' },
        { label: t('adminNotifications.modal.priorityHigh'), value: 'HIGH' },
        { label: t('adminNotifications.modal.priorityUrgent'), value: 'URGENT' }
      ]
    },
    {
      name: 'title',
      label: t('adminNotifications.modal.title'),
      type: 'text',
      required: true,
      placeholder: t('adminNotifications.modal.titlePlaceholder')
    },
    {
      name: 'message',
      label: t('adminNotifications.modal.message'),
      type: 'textarea',
      required: true,
      placeholder: t('adminNotifications.modal.messagePlaceholder'),
      rows: 6
    },
    {
      name: 'actionUrl',
      label: t('adminNotifications.modal.actionUrl'),
      type: 'text',
      required: false,
      placeholder: t('adminNotifications.modal.actionUrlPlaceholder')
    },
    {
      name: 'actionLabel',
      label: t('adminNotifications.modal.actionLabel'),
      type: 'text',
      required: false,
      placeholder: t('adminNotifications.modal.actionLabelPlaceholder')
    },
    {
      name: 'sendEmail',
      label: t('adminNotifications.modal.sendEmail'),
      type: 'select',
      required: true,
      options: [
        { label: t('adminNotifications.modal.sendEmailYes'), value: 'yes' },
        { label: t('adminNotifications.modal.sendEmailNo'), value: 'no' }
      ]
    }
  ];

  const handleSendNotification = async (data: Record<string, any>) => {
    try {
      await adminService.sendNotification({
        targetAudience: data.targetAudience,
        specificEmail: data.specificEmail,
        type: data.type,
        priority: data.priority,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        sendEmail: data.sendEmail === 'yes'
      });
      
      setShowSendModal(false);
      setSelectedTemplate(null);
      
      // Refresh stats and history
      const statsData = await adminService.getNotificationStats();
      setStats({
        totalSent: statsData.totalSent || 0,
        delivered: statsData.delivered || 0,
        pending: statsData.pending || 0,
        failed: statsData.failed || 0,
        changePercentage: statsData.changePercentage || 0
      });
      
      const historyResponse = await adminService.getNotificationHistory({ page: 0, size: 10 });
      setHistory(historyResponse.content || []);
      
      toast.success(t('adminNotifications.toast.success'), {
        description: t('adminNotifications.toast.description'),
      });
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      toast.error('Không thể gửi thông báo', {
        description: error.message || 'Vui lòng thử lại sau'
      });
    }
  };

  const useTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setShowSendModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('adminNotifications.title')}</h1>
          <p className="text-gray-500 mt-1">{t('adminNotifications.subtitle')}</p>
        </div>
        <Button onClick={() => setShowSendModal(true)} className="flex items-center gap-2">
          <Send className="w-4 h-4" />
          {t('adminNotifications.sendNew')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title={t('adminNotifications.stats.totalSent')}
          value={isLoadingStats ? '...' : stats.totalSent}
          icon={<Send className="w-6 h-6 text-blue-600" />}
          trend="up"
          change={stats.changePercentage}
          changeLabel={t('adminNotifications.stats.vsLastMonth')}
        />
        <StatCard
          title={t('adminNotifications.stats.delivered')}
          value={isLoadingStats ? '...' : stats.delivered}
          icon={<Bell className="w-6 h-6 text-green-600" />}
        />
        <StatCard
          title={t('adminNotifications.stats.pending')}
          value={isLoadingStats ? '...' : stats.pending}
          icon={<AlertCircle className="w-6 h-6 text-yellow-600" />}
        />
        <StatCard
          title={t('adminNotifications.stats.failed')}
          value={isLoadingStats ? '...' : stats.failed}
          icon={<AlertCircle className="w-6 h-6 text-red-600" />}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="send" className="w-full">
        <TabsList>
          <TabsTrigger value="send">{t('adminNotifications.tabs.send')}</TabsTrigger>
          <TabsTrigger value="templates">{t('adminNotifications.tabs.templates')}</TabsTrigger>
          <TabsTrigger value="history">{t('adminNotifications.tabs.history')}</TabsTrigger>
        </TabsList>

        {/* Send Tab */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('adminNotifications.quickSend.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => setShowSendModal(true)}
                >
                  <Users className="w-8 h-8 text-blue-600" />
                  <span>{t('adminNotifications.quickSend.allUsers')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => setShowSendModal(true)}
                >
                  <User className="w-8 h-8 text-green-600" />
                  <span>{t('adminNotifications.quickSend.applicants')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => setShowSendModal(true)}
                >
                  <Megaphone className="w-8 h-8 text-purple-600" />
                  <span>{t('adminNotifications.quickSend.providers')}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('adminNotifications.recent.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((notif: any) => (
                    <div key={notif.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{notif.title}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(notif.createdAt).toLocaleString('vi-VN')} • {notif.targetAudience}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">
                        {notif.deliveredCount}/{notif.totalRecipients} đã gửi
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Chưa có thông báo nào</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {isLoadingTemplates ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    </div>
                    <Badge variant="outline">{template.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => useTemplate(template)}
                  >
                    {t('adminNotifications.templates.useTemplate')}
                  </Button>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('adminNotifications.history.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((notif: any) => (
                    <div key={notif.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{notif.title}</div>
                        <Badge className="bg-gray-100 text-gray-700">
                          {new Date(notif.createdAt).toLocaleString('vi-VN')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">{t('adminNotifications.history.recipients')}: </span>
                          <span className="font-medium">{notif.totalRecipients}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t('adminNotifications.history.delivered')}: </span>
                          <span className="font-medium text-green-600">{notif.deliveredCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t('adminNotifications.history.failed')}: </span>
                          <span className="font-medium text-red-600">{notif.failedCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Chưa có lịch sử thông báo</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Modal */}
      <ModalForm
        isOpen={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setSelectedTemplate(null);
        }}
        onSubmit={handleSendNotification}
        title={selectedTemplate ? `Send ${selectedTemplate.name}` : t('adminNotifications.modal.sendTitle')}
        fields={sendFields}
        submitText={t('adminNotifications.modal.send')}
        cancelText={t('adminNotifications.modal.cancel')}
        initialValues={selectedTemplate ? {
          type: selectedTemplate.type,
          title: selectedTemplate.name,
          message: selectedTemplate.description
        } : undefined}
      />
    </div>
  );
}
