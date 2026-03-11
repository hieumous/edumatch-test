'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserRole } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { CreateOrganizationModal } from './CreateOrganizationModal';

interface Organization {
  id: number;
  name: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    password: string;
    organizationId?: number;
  }) => void;
}

export function AddUserModal({ isOpen, onClose, onSubmit }: AddUserModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: UserRole.USER,
    password: '',
    organizationId: undefined as number | undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);

  // Fetch organizations when modal opens and role is EMPLOYER
  useEffect(() => {
    if (isOpen && formData.role === UserRole.EMPLOYER) {
      fetchOrganizations();
    } else {
      setOrganizations([]);
    }
  }, [isOpen, formData.role]);

  const fetchOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8080';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/organizations?page=0&size=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      } else {
        console.error('Failed to fetch organizations');
        setOrganizations([]);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleOrganizationCreated = (organizationId: number) => {
    // Refresh organizations list
    fetchOrganizations();
    // Auto-select the newly created organization
    setFormData({ ...formData, organizationId });
  };

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('addUserModal.error.firstNameRequired');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('addUserModal.error.lastNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('addUserModal.error.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('addUserModal.error.emailInvalid');
    }

    if (!formData.password.trim()) {
      newErrors.password = t('addUserModal.error.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('addUserModal.error.passwordTooShort');
    }

    // Validate organization for EMPLOYER role
    if (formData.role === UserRole.EMPLOYER && !formData.organizationId) {
      newErrors.organizationId = t('addUserModal.error.organizationRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        password: formData.password,
        organizationId: formData.role === UserRole.EMPLOYER ? formData.organizationId : undefined,
      });
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: UserRole.USER,
        password: '',
        organizationId: undefined,
      });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: UserRole.USER,
      password: '',
      organizationId: undefined,
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t('addUserModal.title')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('addUserModal.firstName')} *
            </label>
            <Input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder={t('addUserModal.firstNamePlaceholder')}
              className={errors.firstName ? 'border-red-500' : ''}
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('addUserModal.lastName')} *
            </label>
            <Input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder={t('addUserModal.lastNamePlaceholder')}
              className={errors.lastName ? 'border-red-500' : ''}
            />
            {errors.lastName && (
              <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('addUserModal.email')} *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('addUserModal.emailPlaceholder')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('addUserModal.role')} *
            </label>
            <select
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value as UserRole;
                setFormData({ 
                  ...formData, 
                  role: newRole,
                  organizationId: newRole === UserRole.EMPLOYER ? formData.organizationId : undefined
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={UserRole.USER}>{t('addUserModal.roleStudent')}</option>
              <option value={UserRole.EMPLOYER}>{t('addUserModal.roleProvider')}</option>
              <option value={UserRole.ADMIN}>{t('addUserModal.roleAdmin')}</option>
            </select>
          </div>

          {/* Organization - Only show for EMPLOYER role */}
          {formData.role === UserRole.EMPLOYER && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  {t('addUserModal.organization')} *
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOrgModalOpen(true)}
                  className="text-xs h-7 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t('addUserModal.createOrganization') || 'Tạo mới'}
                </Button>
              </div>
              <select
                value={formData.organizationId || ''}
                onChange={(e) => setFormData({ ...formData, organizationId: e.target.value ? Number(e.target.value) : undefined })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.organizationId ? 'border-red-500' : ''}`}
                disabled={loadingOrgs}
              >
                <option value="">{loadingOrgs ? 'Đang tải...' : 'Chọn tổ chức'}</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              {errors.organizationId && (
                <p className="text-sm text-red-600 mt-1">{errors.organizationId}</p>
              )}
              {organizations.length === 0 && !loadingOrgs && (
                <p className="text-sm text-yellow-600 mt-1">
                  {t('addUserModal.noOrganizations') || 'Không có tổ chức nào. Vui lòng tạo tổ chức trước khi thêm nhà cung cấp.'}
                </p>
              )}
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('addUserModal.password')} *
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={t('addUserModal.passwordPlaceholder')}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              {t('addUserModal.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {t('addUserModal.create')}
            </Button>
          </div>
        </form>
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isCreateOrgModalOpen}
        onClose={() => setIsCreateOrgModalOpen(false)}
        onSuccess={handleOrganizationCreated}
      />
    </div>
  );
}
