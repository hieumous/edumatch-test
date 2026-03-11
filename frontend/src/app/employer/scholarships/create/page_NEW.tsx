'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'react-hot-toast';

export default function CreateScholarshipPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    fullDescription: '',
    applicationDeadline: '',
    startDate: '',
    endDate: '',
    scholarshipAmount: '',
    minGpa: '',
    studyMode: '' as 'FULL_TIME' | 'PART_TIME' | 'REMOTE' | '',
    level: '' as 'HIGH_SCHOOL' | 'UNDERGRADUATE' | 'GRADUATE' | 'MASTER' | 'PHD' | 'POSTDOCTORAL' | '',
    isPublic: true,
    contactEmail: '',
    website: '',
    tags: [] as string[],
    requiredSkills: [] as string[],
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentSkill, setCurrentSkill] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const accessToken = localStorage.getItem('auth_token');
      
      const response = await fetch('http://localhost:8082/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          title: formData.title,
          fullDescription: formData.fullDescription,
          applicationDeadline: formData.applicationDeadline,
          startDate: formData.startDate,
          endDate: formData.endDate,
          scholarshipAmount: parseFloat(formData.scholarshipAmount),
          minGpa: parseFloat(formData.minGpa),
          studyMode: formData.studyMode,
          level: formData.level,
          isPublic: formData.isPublic,
          contactEmail: formData.contactEmail,
          website: formData.website,
          tags: formData.tags,
          requiredSkills: formData.requiredSkills
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create scholarship');
      }

      const result = await response.json();
      console.log('Scholarship created:', result);
      
      toast.success(t('createScholarship.success'));
      router.push('/employer/scholarships');
    } catch (error) {
      toast.error(t('createScholarship.error'));
      console.error('Error creating scholarship:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addSkill = () => {
    if (currentSkill.trim() && !formData.requiredSkills.includes(currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(skill => skill !== skillToRemove)
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-blue-50 to-brand-cyan-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/employer/scholarships')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('createScholarship.backButton')}
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{t('createScholarship.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('createScholarship.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('createScholarship.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">{t('createScholarship.scholarshipTitle')} *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., AI Research Fellowship 2026"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">{t('createScholarship.description')} *</Label>
                <Textarea
                  id="description"
                  required
                  rows={6}
                  value={formData.fullDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullDescription: e.target.value }))}
                  placeholder={t('createScholarship.descriptionPlaceholder')}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="scholarshipAmount">{t('createScholarship.amount')} *</Label>
                  <Input
                    id="scholarshipAmount"
                    type="number"
                    step="0.01"
                    required
                    value={formData.scholarshipAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, scholarshipAmount: e.target.value }))}
                    placeholder="35000.00"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="minGpa">{t('createScholarship.minGpa')}</Label>
                  <Input
                    id="minGpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.0"
                    value={formData.minGpa}
                    onChange={(e) => setFormData(prev => ({ ...prev, minGpa: e.target.value }))}
                    placeholder="3.5"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="studyMode">{t('createScholarship.studyMode')} *</Label>
                  <Select 
                    value={formData.studyMode} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, studyMode: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={t('createScholarship.selectStudyMode')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">{t('createScholarship.fullTime')}</SelectItem>
                      <SelectItem value="PART_TIME">{t('createScholarship.partTime')}</SelectItem>
                      <SelectItem value="REMOTE">{t('createScholarship.remote')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="level">{t('createScholarship.educationLevel')} *</Label>
                  <Select 
                    value={formData.level} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={t('createScholarship.selectLevel')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH_SCHOOL">High School</SelectItem>
                      <SelectItem value="UNDERGRADUATE">Undergraduate</SelectItem>
                      <SelectItem value="GRADUATE">Graduate</SelectItem>
                      <SelectItem value="MASTER">Master's</SelectItem>
                      <SelectItem value="PHD">PhD</SelectItem>
                      <SelectItem value="POSTDOCTORAL">Postdoctoral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>{t('createScholarship.timeline')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="deadline">{t('createScholarship.deadline')} *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    required
                    value={formData.applicationDeadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, applicationDeadline: e.target.value }))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">{t('createScholarship.startDate')}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">{t('createScholarship.endDate')}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>{t('createScholarship.requirements')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>{t('createScholarship.requiredSkills')}</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="e.g., Python, Machine Learning, TensorFlow"
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.requiredSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>{t('createScholarship.tags')}</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="e.g., AI, Research, STEM"
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('createScholarship.contactInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contactEmail">{t('createScholarship.contactEmail')}</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="contact@university.edu"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="website">{t('createScholarship.website')}</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://university.edu/scholarship"
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>{t('createScholarship.publishingOptions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked as boolean }))}
                />
                <Label htmlFor="isPublic">
                  {t('createScholarship.makePublic')}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Public scholarships will be visible to all users and included in matching recommendations.
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/employer/scholarships')}
              className="flex-1"
            >
              {t('createScholarship.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? t('createScholarship.creating') : t('createScholarship.createScholarship')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
