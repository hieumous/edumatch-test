'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { scholarshipServiceApi } from '@/services/scholarship.service';
import { Scholarship } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookmarkX, Eye, Calendar, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext'; // 1. Import hook

export default function SavedScholarshipsPage() {
  const router = useRouter();
  const { t } = useLanguage(); // 2. Sử dụng hook
  
  // State lưu danh sách các bookmark (chứa thông tin user và scholarship)
  const [bookmarks, setBookmarks] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  // 1. Gọi API lấy danh sách khi vào trang
  const fetchSavedList = async () => {
    try {
      setIsLoading(true);
      // Gọi service (nó sẽ gọi qua Proxy Next.js -> Java Backend)
      const data = await scholarshipServiceApi.getMyBookmarks();
      
      // Đảm bảo data là array
      if (Array.isArray(data)) {
        setBookmarks(data);
      } else {
        setBookmarks([]);
        toast.error('Dữ liệu không hợp lệ từ server');
      }
    } catch (error: any) {
      const errorMessage = error?.message || t('savedScholarships.loadError');
      toast.error(errorMessage);
      setBookmarks([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedList();
    
    // Refresh khi user quay lại trang (khi tab được focus)
    const handleFocus = () => {
      fetchSavedList();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 2. Xử lý khi bấm nút Xóa (Unsave) ngay tại trang này
  const handleRemove = async (scholarshipId: number) => {
    try {
      // Gọi API Unsave
      await scholarshipServiceApi.toggleBookmark(scholarshipId);
      
      // Xóa khỏi giao diện ngay lập tức (không cần load lại trang)
      setBookmarks((prev) => prev.filter((item) => item.opportunity.id !== scholarshipId));
      toast.success(t('savedScholarships.removeSuccess')); // Sử dụng key dịch
    } catch (error) {
      toast.error(t('savedScholarships.removeError')); // Sử dụng key dịch
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">{t('savedScholarships.loading')}</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        {t('savedScholarships.title')}
        <Badge variant="secondary" className="text-lg">
          {bookmarks.length}
        </Badge>
      </h1>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <p className="text-gray-500 mb-4">{t('savedScholarships.empty')}</p>
          <Button onClick={() => router.push('/user/scholarships')}>
            {t('savedScholarships.browse')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark) => {
            const scholarship = bookmark.opportunity; // Lấy thông tin học bổng ra
            
            return (
              <Card key={bookmark.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-2" title={scholarship.title}>
                      {scholarship.title}
                    </CardTitle>
                    <Badge variant={scholarship.isPublic ? "default" : "secondary"}>
                      {scholarship.level}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="truncate">
                        {scholarship.location || t('scholarshipDetail.remote')}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                        {t('scholarship.deadline')}: {formatDate(scholarship.applicationDeadline)}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(scholarship.scholarshipAmount)}
                  </div>
                </CardContent>

                <CardFooter className="pt-4 border-t gap-2">
                  {/* Nút Xem chi tiết */}
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={() => router.push(`/scholarships/${scholarship.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" /> {t('common.view')}
                  </Button>

                  {/* Nút Xóa (Bỏ lưu) */}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemove(scholarship.id)}
                    title={t('savedScholarships.remove')}
                  >
                    <BookmarkX className="w-5 h-5" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}