'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (organizationId: number) => void;
}

export function CreateOrganizationModal({ isOpen, onClose, onSuccess }: CreateOrganizationModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    organizationType: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    city: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('createOrganizationModal.error.nameRequired') || 'Tên tổ chức là bắt buộc';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('createOrganizationModal.error.emailInvalid') || 'Định dạng email không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:8080';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/organizations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể tạo tổ chức');
      }

      const data = await response.json();
      toast.success(t('createOrganizationModal.success') || 'Tạo tổ chức thành công', {
        description: t('createOrganizationModal.successDesc')?.replace('{name}', formData.name) || `Tổ chức "${formData.name}" đã được tạo thành công`,
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        organizationType: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        country: '',
        city: '',
      });
      setErrors({});
      
      // Call onSuccess with the new organization ID
      onSuccess(data.id);
      onClose();
    } catch (error: any) {
      toast.error(t('createOrganizationModal.error.createFailed') || 'Không thể tạo tổ chức', {
        description: error.message || 'Vui lòng thử lại sau',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      organizationType: '',
      website: '',
      email: '',
      phone: '',
      address: '',
      country: '',
      city: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('createOrganizationModal.title') || 'Tạo tổ chức mới'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name - Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('createOrganizationModal.name') || 'Tên tổ chức'} *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('createOrganizationModal.namePlaceholder') || 'Nhập tên tổ chức'}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('createOrganizationModal.description') || 'Mô tả'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('createOrganizationModal.descriptionPlaceholder') || 'Nhập mô tả về tổ chức'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Organization Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('createOrganizationModal.organizationType') || 'Loại tổ chức'}
            </label>
            <Input
              type="text"
              value={formData.organizationType}
              onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
              placeholder={t('createOrganizationModal.organizationTypePlaceholder') || 'Ví dụ: Trường đại học, Công ty, Tổ chức phi lợi nhuận'}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('createOrganizationModal.email') || 'Email'}
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('createOrganizationModal.emailPlaceholder') || 'contact@example.com'}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('createOrganizationModal.phone') || 'Số điện thoại'}
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t('createOrganizationModal.phonePlaceholder') || '+84 123 456 789'}
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('createOrganizationModal.website') || 'Website'}
            </label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder={t('createOrganizationModal.websitePlaceholder') || 'https://example.com'}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('createOrganizationModal.address') || 'Địa chỉ'}
            </label>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder={t('createOrganizationModal.addressPlaceholder') || 'Nhập địa chỉ'}
            />
          </div>

          {/* Country and City - Side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('createOrganizationModal.country') || 'Quốc gia'}
              </label>
              <Input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder={t('createOrganizationModal.countryPlaceholder') || 'Việt Nam'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('createOrganizationModal.city') || 'Thành phố'}
              </label>
              <Input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder={t('createOrganizationModal.cityPlaceholder') || 'Hà Nội'}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              {t('createOrganizationModal.cancel') || 'Hủy'}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (t('createOrganizationModal.creating') || 'Đang tạo...') 
                : (t('createOrganizationModal.create') || 'Tạo tổ chức')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

